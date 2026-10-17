// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI orchestration; see ../NOTICE.md.
import type { AgentRuntime, McpServerContribution } from "../core/runtime.ts";
import type { ModelRef } from "../core/models.ts";
import type { ConversationLocation } from "../conversations/types.ts";
import type { AiPluginSettings } from "../settings/ai-settings.ts";
import type { AiViewHost } from "./view-host.ts";

export type AiViewBootstrap = {
  runtime: AgentRuntime;
  settings: AiPluginSettings;
  models: ModelRef[];
  modelCatalogError: string | null;
  unavailableReason: string | null;
};

export function initialAiViewBootstrap(host: AiViewHost): AiViewBootstrap {
  return {
    runtime: host.fallbackRuntime(),
    settings: host.getSettings(),
    models: [],
    modelCatalogError: null,
    unavailableReason: null,
  };
}

export async function prepareAiViewBootstrap(
  host: AiViewHost,
  initialLocation: ConversationLocation | null,
  mcpServers: McpServerContribution[],
  signal?: AbortSignal,
): Promise<AiViewBootstrap> {
  signal?.throwIfAborted();
  let settings = host.getSettings();
  const conversation = initialLocation
    ? host.conversations.read(initialLocation)
    : Promise.resolve(null);
  const snapshot = await conversation.catch(() => null);
  signal?.throwIfAborted();

  if (snapshot) {
    const binding = snapshot.agents.find(
      (record) =>
        record.type === "binding.created" &&
        record.id === snapshot.metadata.activeAgentBindingId,
    );
    if (binding?.type === "binding.created") {
      const agent =
        binding.agent === "cursor"
          ? "cursor"
          : binding.agent === "opencode"
            ? "opencode"
            : "codex";
      settings = {
        ...settings,
        acpAgent: agent,
        defaultRuntime:
          binding.runtime === "codex-native"
            ? "codex-native"
            : binding.runtime === "opencode-native"
              ? "opencode-native"
              : binding.runtime === "fake"
                ? "fake"
                : "acp",
        defaultModel: binding.model?.model ?? settings.defaultModels[agent],
        thinking: binding.thinking ?? settings.thinking,
      };
    }
  }

  const [selectedCatalog] = await Promise.allSettled([
    host.models.listModels(settings.acpAgent, settings.defaultRuntime),
  ]);
  signal?.throwIfAborted();
  const models =
    selectedCatalog?.status === "fulfilled" ? selectedCatalog.value : [];
  let modelCatalogError: string | null = null;
  const agentModels = models.filter(
    (model) => model.provider === settings.acpAgent,
  );
  if (selectedCatalog?.status === "rejected") {
    modelCatalogError = errorMessage(selectedCatalog.reason);
  } else if (
    !initialLocation &&
    agentModels.length > 0 &&
    !agentModels.some((model) => model.model === settings.defaultModel)
  ) {
    const model = (agentModels.find((entry) => entry.isDefault) ??
      agentModels[0])!;
    await host.updateSettings({ defaultModel: model.model });
    signal?.throwIfAborted();
    settings = host.getSettings();
  }

  let runtime: AgentRuntime;
  let unavailableReason: string | null = null;
  try {
    runtime = await host.selectRuntime({
      prompt: "",
      workspace: host.workspace,
      mcpServers,
      agent: settings.acpAgent,
      model: { provider: settings.acpAgent, model: settings.defaultModel },
      thinking: settings.thinking,
      metadata:
        settings.defaultRuntime === "auto"
          ? undefined
          : { runtime: settings.defaultRuntime },
    });
    signal?.throwIfAborted();
    unavailableReason =
      settings.defaultRuntime === "fake"
        ? null
        : host.liveRuntimeUnavailableReason();
  } catch (error) {
    signal?.throwIfAborted();
    runtime = host.fallbackRuntime();
    unavailableReason = errorMessage(error);
  }

  return {
    runtime,
    settings,
    models,
    modelCatalogError,
    unavailableReason,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function applyAiViewSettingsPatch(
  settings: AiPluginSettings,
  patch: Partial<AiPluginSettings>,
  current: AiPluginSettings,
): AiPluginSettings {
  const acpAgent = patch.acpAgent ?? settings.acpAgent;
  const defaultModels = { ...settings.defaultModels, ...patch.defaultModels };
  if (patch.defaultModel !== undefined)
    defaultModels[acpAgent] = patch.defaultModel;
  return {
    ...settings,
    ...patch,
    acpAgent,
    defaultModels,
    defaultModel:
      patch.defaultModel ??
      (patch.acpAgent !== undefined
        ? current.defaultModels[acpAgent]
        : (patch.defaultModels?.[acpAgent] ?? settings.defaultModel)),
  };
}
