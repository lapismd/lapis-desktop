// SPDX-License-Identifier: Apache-2.0
import type { App } from "@lapis-notes/api";
import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import {
  AppSkillRegistry,
  AppSlashCommandRegistry,
} from "@lapis-notes/api/agent-skills";
import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { Vault, MemoryVaultAdapter } from "@lapis-notes/api/vault";
import { describe, expect, it, vi } from "vitest";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { VaultTranscriptStore } from "../../../src/lib/ai/conversations/vault-transcript-store.ts";
import { AiApplication } from "../../../src/lib/ai/plugin/application.ts";
import { AiConversationHost } from "../../../src/lib/ai/plugin/conversation-host.ts";
import {
  bindConversationPersistence,
  ownedConversationPersistence,
} from "../../../src/lib/ai/plugin/conversation-persistence.ts";
import { bindAi } from "../../../src/lib/ai/plugin/services.ts";
import { AiSettingsStore } from "../../../src/lib/ai/settings/settings-store.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";

const settings = () => new AiSettingsStore(async () => {});
function owner() {
  return {
    vault: new Vault(new MemoryVaultAdapter()),
    appDatabase: new MemoryAppDatabase(crypto.randomUUID()),
    agentTools: new AppToolRegistry(),
    agentSkills: new AppSkillRegistry(),
    agentSlashCommands: new AppSlashCommandRegistry(),
    plugins: { plugins: new Map(), enabledPlugins: new Set() },
    logger: { warn: vi.fn(), error: vi.fn() },
    fileEditingSessions: {
      register: () => () => {},
      afterMutations: (run: () => Promise<void>) => run(),
    },
  } as unknown as App;
}
const persistence = () => ({
  backend: "test-companion",
  store: new MemoryTranscriptStore(),
  drain: vi.fn(async () => {}),
});
function gate() {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { pending, release };
}

describe("App-owned conversation persistence", () => {
  it("allocates only for its exact App and the real host writes only its selected store", async () => {
    const app = owner(),
      other = owner();
    const selected = persistence();
    const create = vi.fn(() => selected);
    const release = bindConversationPersistence(app, create);
    expect(create).not.toHaveBeenCalled();
    expect(ownedConversationPersistence(other).backend).toBe("vault-files");
    const host = new AiConversationHost(app, settings());
    expect(create).toHaveBeenCalledExactlyOnceWith(app);
    expect(host.persistence.backend).toBe("test-companion");
    const snapshot = await host.conversations.create({ scopeDir: "" });
    expect(await selected.store.read(snapshot.location)).toEqual(snapshot);
    expect(await app.vault.adapter.exists(".lapis/agents/sessions")).toBe(
      false,
    );
    release();
    bindConversationPersistence(app, () => persistence());
    // Changing a future plugin's binding never changes this application's writer.
    expect(host.persistence).toBe(selected);
  });

  it("rejects duplicate bindings and a stale disposer cannot remove a replacement lease", () => {
    const app = owner(),
      create = () => persistence();
    const first = bindConversationPersistence(app, create);
    expect(() => bindConversationPersistence(app, create)).toThrow(
      "already bound",
    );
    first();
    const second = bindConversationPersistence(app, create);
    first();
    expect(ownedConversationPersistence(app).backend).toBe("test-companion");
    second();
    expect(ownedConversationPersistence(app).store).toBeInstanceOf(
      VaultTranscriptStore,
    );
  });

  it("propagates unavailable injected persistence without touching a legacy writer", () => {
    const app = owner();
    const read = vi.spyOn(app.vault.adapter, "read");
    const write = vi.spyOn(app.vault.adapter, "write");
    bindConversationPersistence(app, () => {
      throw new Error("Selected backend unavailable");
    });
    expect(() => new AiConversationHost(app, settings())).toThrow(
      "Selected backend unavailable",
    );
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it("awaits view work and persistence before the real application releases its runtime", async () => {
    const app = owner(),
      view = gate(),
      durable = gate(),
      entered = gate();
    const selected = persistence();
    selected.drain.mockImplementation(async () => {
      entered.release();
      await durable.pending;
    });
    bindConversationPersistence(app, () => selected);
    const close = vi.fn(async () => {});
    bindAi(app, () => ({
      runtime: new FakeAgentRuntime({ id: "acp" }),
      models: { listModels: async () => [] },
      unavailableReason: () => null,
      close,
    }));
    const host = new AiApplication(app, settings());
    host.operations.ownView(() => view.pending);
    const closing = host.close();
    await Promise.resolve();
    expect(selected.drain).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    view.release();
    await entered.pending;
    expect(close).not.toHaveBeenCalled();
    durable.release();
    await closing;
    expect(close).toHaveBeenCalledExactlyOnceWith("close");
    expect(host.active).toBe(false);
  });

  it("retains runtime authority on uncertain persistence and retries the same drain without another writer", async () => {
    const app = owner(),
      selected = persistence();
    selected.drain.mockRejectedValueOnce(
      new Error("Publication outcome unknown"),
    );
    bindConversationPersistence(app, () => selected);
    const close = vi.fn(async () => {});
    bindAi(app, () => ({
      runtime: new FakeAgentRuntime({ id: "acp" }),
      models: { listModels: async () => [] },
      unavailableReason: () => null,
      close,
    }));
    const host = new AiApplication(app, settings());
    await expect(host.close()).rejects.toThrow("AI persistence cleanup failed");
    expect(close).not.toHaveBeenCalled();
    expect(host.active).toBe(false);
    await host.close();
    expect(selected.drain).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledOnce();
    expect(await app.vault.adapter.exists(".lapis/agents/sessions")).toBe(
      false,
    );
  });
});
