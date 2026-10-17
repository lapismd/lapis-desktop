import { describe, expect, it, vi } from "vitest";
import type { AgentRuntime } from "../../../src/lib/ai/core/runtime.ts";
import { ConversationRepository } from "../../../src/lib/ai/conversations/conversation-repository.ts";
import { MemoryTranscriptStore } from "../../../src/lib/ai/conversations/memory-transcript-store.ts";
import { CONVERSATION_SCHEMA_VERSION } from "../../../src/lib/ai/conversations/types.ts";
import { FakeAgentRuntime } from "../support/fake-runtime.ts";
import {
  DEFAULT_AI_SETTINGS,
  mergeAiSettings,
} from "../../../src/lib/ai/settings/ai-settings.ts";
import type { AiViewHost } from "../../../src/lib/ai/bootstrap/view-host.ts";
import { LIVE_RUNTIME_UNAVAILABLE_REASON } from "../../../src/lib/ai/bootstrap/runtime-unavailable.ts";
import {
  initialAiViewBootstrap,
  applyAiViewSettingsPatch,
  prepareAiViewBootstrap,
} from "../../../src/lib/ai/bootstrap/view-bootstrap.ts";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const CREATED_AT = "2026-08-16T10:00:00.000Z";

function createHost(
  options: { selectedId?: string; unavailableReason?: string | null } = {},
) {
  const fallback = new FakeAgentRuntime({ resumeSupported: false });
  const selected = new FakeAgentRuntime({
    id: options.selectedId ?? "selected",
  });
  const repository = new ConversationRepository(new MemoryTranscriptStore());
  let settings = mergeAiSettings(DEFAULT_AI_SETTINGS);
  const listModels = vi.fn(async (provider: string) => [
    {
      provider,
      model: provider === "cursor" ? "composer-2.5" : "gpt-5.6-sol",
      isDefault: true,
    },
  ]);
  const selectRuntime = vi.fn(async () => selected as AgentRuntime);
  const host: AiViewHost = {
    selectRuntime,
    fallbackRuntime: () => fallback,
    liveRuntimeUnavailableReason: () => options.unavailableReason ?? null,
    mcpServers: { list: () => [] },
    conversations: repository,
    createConversationInput: () => ({ scopeDir: "" }),
    currentConversationScope: () => "",
    listConversationFolders: () => [""],
    revealConversationHistory: async () => {},
    searchVaultFiles: async () => [],
    getSettings: () => settings,
    updateSettings: async (patch) => {
      const acpAgent = patch.acpAgent ?? settings.acpAgent;
      const defaultModels = {
        ...settings.defaultModels,
        ...patch.defaultModels,
      };
      if (patch.defaultModel !== undefined) {
        defaultModels[acpAgent] = patch.defaultModel.trim();
      }
      settings = mergeAiSettings({
        ...settings,
        ...patch,
        acpAgent,
        defaultModels,
      });
    },
    models: { listModels },
  };
  return { fallback, host, listModels, repository, selectRuntime };
}

describe("AI view bootstrap", () => {
  it("provides a synchronous fallback without starting provider work", () => {
    const { fallback, host, listModels, selectRuntime } = createHost();

    expect(initialAiViewBootstrap(host)).toMatchObject({
      runtime: fallback,
      settings: DEFAULT_AI_SETTINGS,
      models: [],
      modelCatalogError: null,
      unavailableReason: null,
    });
    expect(listModels).not.toHaveBeenCalled();
    expect(selectRuntime).not.toHaveBeenCalled();
  });

  it("prepares the exact durable binding after the shell is available", async () => {
    const { host, repository, selectRuntime, listModels } = createHost();
    const location = { scopeDir: "Notes", conversationId: ID };
    await repository.create({
      id: ID,
      scopeDir: "Notes",
      now: CREATED_AT,
    });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        type: "binding.created",
        id: "binding-native",
        createdAt: CREATED_AT,
        runtime: "codex-native",
        agent: "codex",
        model: { provider: "codex", model: "gpt-5.6-sol" },
        thinking: "high",
      },
    ]);

    const prepared = await prepareAiViewBootstrap(host, location, []);

    expect(prepared.settings).toMatchObject({
      defaultRuntime: "codex-native",
      acpAgent: "codex",
      defaultModel: "gpt-5.6-sol",
      thinking: "high",
    });
    expect(prepared.models).toHaveLength(1);
    expect(listModels).toHaveBeenCalledExactlyOnceWith("codex", "codex-native");
    expect(selectRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: "codex",
        model: { provider: "codex", model: "gpt-5.6-sol" },
        thinking: "high",
        metadata: { runtime: "codex-native" },
      }),
    );
  });

  it("does not report host unavailability for an explicit Fake runtime", async () => {
    const { host } = createHost({
      selectedId: "fake",
      unavailableReason: LIVE_RUNTIME_UNAVAILABLE_REASON,
    });
    await host.updateSettings({ defaultRuntime: "fake" });

    const prepared = await prepareAiViewBootstrap(host, null, []);

    expect(prepared.runtime.id).toBe("fake");
    expect(prepared.unavailableReason).toBeNull();
  });

  it("restores the OpenCode Native runtime and agent from a durable binding", async () => {
    const { host, repository, selectRuntime } = createHost();
    const location = { scopeDir: "Notes", conversationId: ID };
    await repository.create({ id: ID, scopeDir: "Notes", now: CREATED_AT });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        type: "binding.created",
        id: "binding-opencode",
        createdAt: CREATED_AT,
        runtime: "opencode-native",
        agent: "opencode",
        model: { provider: "opencode", model: "anthropic/claude-sonnet-4-5" },
        thinking: "high",
      },
    ]);

    const prepared = await prepareAiViewBootstrap(host, location, []);

    expect(prepared.settings).toMatchObject({
      defaultRuntime: "opencode-native",
      acpAgent: "opencode",
      defaultModel: "anthropic/claude-sonnet-4-5",
    });
    expect(selectRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: "opencode",
        metadata: { runtime: "opencode-native" },
      }),
    );
  });

  it("keeps a saved Cursor default when the flat catalog omits that model", async () => {
    const { host, listModels } = createHost();
    await host.updateSettings({
      acpAgent: "cursor",
      defaultModel: "composer-2.5[fast=true]",
    });
    listModels.mockImplementation(async (provider: string) =>
      provider === "cursor"
        ? []
        : [
            {
              provider,
              model: "gpt-5.6-sol",
              isDefault: true,
            },
          ],
    );

    const prepared = await prepareAiViewBootstrap(host, null, []);

    expect(prepared.settings.acpAgent).toBe("cursor");
    expect(prepared.settings.defaultModel).toBe("composer-2.5[fast=true]");
    expect(host.getSettings().defaultModel).toBe("composer-2.5[fast=true]");
  });

  it("reports a start-server message when auto falls back to Fake", async () => {
    const { host } = createHost({
      selectedId: "fake",
      unavailableReason: LIVE_RUNTIME_UNAVAILABLE_REASON,
    });

    const prepared = await prepareAiViewBootstrap(host, null, []);

    expect(prepared.runtime.id).toBe("fake");
    expect(prepared.unavailableReason).toBe(LIVE_RUNTIME_UNAVAILABLE_REASON);
  });
});

it("passes the owning vault to desktop runtime readiness", async () => {
  const { host } = createHost();
  host.workspace = "/tmp/lapis-review-vault";
  const selected = new FakeAgentRuntime();
  host.selectRuntime = async (request) => {
    if (request.workspace !== host.workspace)
      throw new Error(
        "An absolute vault workspace is required for the AI controller",
      );
    return selected;
  };
  const prepared = await prepareAiViewBootstrap(host, null, []);
  expect(prepared.unavailableReason).toBeNull();
  expect(prepared.runtime).toBe(selected);
});

it("preserves durable composer defaults during unrelated Settings notifications", () => {
  const current = mergeAiSettings(DEFAULT_AI_SETTINGS);
  const restored = {
    ...current,
    acpAgent: "cursor" as const,
    defaultRuntime: "acp" as const,
    defaultModel: "durable-cursor-model",
    thinking: "high" as const,
  };
  const updated = applyAiViewSettingsPatch(
    restored,
    { memoryAutomaticRecall: true },
    { ...current, memoryAutomaticRecall: true },
  );
  expect(updated).toMatchObject({
    acpAgent: "cursor",
    defaultModel: "durable-cursor-model",
    thinking: "high",
    memoryAutomaticRecall: true,
  });
  const changed = applyAiViewSettingsPatch(
    restored,
    { acpAgent: "codex" },
    current,
  );
  expect(changed.defaultModel).toBe(current.defaultModels.codex);
});
