import { expect, it, vi } from "vitest";
import {
  AiProviders,
  type ProviderStatus,
  type ProviderAction,
} from "../../../src/lib/ai/settings/providers.svelte.ts";
function status(): ProviderStatus {
  return {
    revision: 0,
    configuration: { provider: "openai-api", endpoint: null, model: "test" },
    credentialAvailable: false,
    keychainSupported: true,
    lastRequest: null,
    cleanupPending: false,
    providers: [],
  };
}
it("observes a lost save acknowledgement without replaying the write or retaining secret input", async () => {
  let value = status();
  let lose = true;
  const writes: ProviderAction[] = [];
  const changed = vi.fn(),
    report = vi.fn();
  const management = new AiProviders(
    async (action) => {
      if (action.type === "save") {
        writes.push(structuredClone(action));
        value = {
          ...value,
          revision: 1,
          credentialAvailable: true,
          lastRequest: action.command.requestId,
        };
        if (lose) {
          lose = false;
          throw Error("Lost acknowledgement");
        }
      }
      return structuredClone(value);
    },
    changed,
    report,
  );
  await management.refresh();
  management.secret = "synthetic-private-key";
  expect(await management.save()).toBe(false);
  expect(management.pending).toBe(true);
  expect(management.secret).toBe("synthetic-private-key");
  expect(await management.refresh()).toBe(true);
  expect(management.pending).toBe(false);
  expect(management.secret).toBe("");
  expect(writes).toHaveLength(1);
  expect(changed).toHaveBeenCalledOnce();
  expect(report).toHaveBeenCalledOnce();
  await management.close();
});
it("retains exact uncertain requests, fences edits and explicitly adopts superseding settings", async () => {
  let value = status();
  const commands: ProviderAction[] = [];
  const management = new AiProviders(
    async (action) => {
      if (action.type === "save") {
        commands.push(structuredClone(action));
        throw Error("Unknown outcome");
      }
      return structuredClone(value);
    },
    vi.fn(),
    vi.fn(),
  );
  await management.refresh();
  management.configure({ model: "draft" });
  management.secret = "synthetic-private-key";
  await management.save();
  management.configure({ model: "changed" });
  expect(management.draft.model).toBe("draft");
  await management.save();
  expect(commands[0]).toEqual(commands[1]);
  value = {
    ...value,
    revision: 2,
    lastRequest: crypto.randomUUID(),
    configuration: { ...value.configuration, model: "other editor" },
  };
  await management.refresh();
  expect(management.superseded).toBe(true);
  management.useSaved();
  expect(management.draft.model).toBe("other editor");
  expect(management.pending).toBe(false);
  expect(management.secret).toBe("");
  await management.close();
});

it("clears cancelled transient credentials but preserves uncertain commands", async () => {
  const value = status();
  value.providers = [
    {
      id: "openai-api",
      label: "OpenAI",
      default_endpoint: null,
      endpoint_required: false,
      credential_env: "KEY",
    },
  ];
  const manager = new AiProviders(
    async (action) => {
      if (action.type === "save") throw Error("Unknown outcome");
      return structuredClone(value);
    },
    vi.fn(),
    vi.fn(),
  );
  await manager.refresh();
  expect(manager.readyToSave).toBe(false);
  manager.secret = "synthetic-key";
  expect(manager.readyToSave).toBe(true);
  manager.configure({ model: "draft" });
  manager.discardDraft();
  expect(manager.secret).toBe("");
  expect(manager.draft.model).toBe("test");
  manager.secret = "synthetic-key";
  await manager.save();
  manager.discardDraft();
  expect(manager.pending).toBe(true);
  expect(manager.secret).toBe("synthetic-key");
  await manager.close();
});
