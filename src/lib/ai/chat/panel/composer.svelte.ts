import { ComposerDraftState } from "./draft-state.svelte.ts";
// SPDX-License-Identifier: Apache-2.0
// Retained Lapis chat presentation state; see ../../NOTICE.md.
import { ComposerPermissions } from "./permissions.svelte.ts";
import { changeComposerAgent } from "./composer-agent.ts";
import { runChatAction } from "./action-errors.ts";
import { onDestroy } from "svelte";
import { observeComposerDefaults } from "./defaults.svelte.ts";
import {
  appendInlineRecipient,
  removeInlineRecipient,
  observeInlineAudience,
} from "./inline-audience.svelte.ts";
import type {
  ComposerStatus,
  ComposerTrigger,
} from "@lapismd/design-core/ai/chat";
import type { AiThinkingLevel, ModelRef } from "../../core/models.ts";
import {
  catalogModelsForAgent,
  normalizeAcpAgent,
  type AcpAgentId,
} from "../../settings/acp-agents.ts";
import { DEFAULT_AI_SETTINGS } from "../../settings/ai-settings.ts";
import { ComposerRecipients } from "./recipients.svelte.ts";
import { mentionTriggers } from "./mention-triggers.ts";
import { ACP_AGENT_IDS } from "../../settings/acp-agents.ts";
import { shouldShowWorkingIndicator } from "../chat-status.ts";
import type { AiChatController } from "../chat-controller.svelte.ts";
import {
  ComposerModelCatalog,
  type ComposerModelCatalogState,
} from "../composer-model-catalog.ts";
import type { AiChatPanelProps } from "./props.ts";
import type { AgentRecipientOption } from "../../conversations/recipients.ts";
class ComposerPanelState extends ComposerDraftState {
  readonly permissions: ComposerPermissions;
  catalogState = $state<ComposerModelCatalogState | null>(null);
  catalog = new ComposerModelCatalog(
    (agent, runtime) =>
      this.getProps().loadModels?.(agent, runtime) ?? Promise.resolve([]),
    (state) => {
      this.catalogState = state;
      if (!state.loading && !state.error) {
        this.localModel = state.model;
        this.persistComposerDefaults(
          state.agent,
          state.runtime === "auto" ? "acp" : state.runtime,
          state.model,
          this.selectedThinking,
        );
      }
    },
  );
  catalogModels = $derived.by(() => {
    const { models = [] } = this.getProps();
    return this.catalogState?.models ?? models;
  });
  input = $state<
    import("@lapismd/design-core/chat").MarkdownComposerHandle | null
  >(null);
  insertReference(value: string) {
    if (this.input) this.input.insertText(`${value} `);
    else this.draft += `${value} `;
  }
  recipientOptions = $derived.by<readonly AgentRecipientOption[]>(
    () =>
      this.getProps().agentOptions ??
      this.getProps().settings?.agentParticipants ??
      ACP_AGENT_IDS.filter(
        (agent) =>
          agent === this.selectedAgent ||
          this.catalogModels.some((model) => model.provider === agent),
      ).map((agent) => ({
        id: agent,
        agent,
        label: {
          codex: "Codex",
          cursor: "Cursor",
          opencode: "OpenCode",
          local: "Lapis AI",
        }[agent],
      })),
  );
  recipients = new ComposerRecipients(() => this.recipientOptions);
  localAgent = $state<AcpAgentId | null>(null);
  localRuntime = $state<
    "acp" | "codex-native" | "opencode-native" | "fake" | null
  >(null);
  localModel = $state<string | null>(null);
  localThinking = $state<AiThinkingLevel | null>(null);
  selectedAgent = $derived.by(() => {
    const { settings } = this.getProps();
    return this.localAgent ?? normalizeAcpAgent(settings?.acpAgent);
  });
  selectedRuntime = $derived.by(() => {
    const { settings } = this.getProps();
    return (
      this.localRuntime ??
      (settings?.defaultRuntime === "codex-native"
        ? "codex-native"
        : settings?.defaultRuntime === "opencode-native"
          ? "opencode-native"
          : settings?.defaultRuntime === "fake"
            ? "fake"
            : "acp")
    );
  });
  selectedModel = $derived.by(() => {
    const { settings } = this.getProps();
    return (
      this.localModel ??
      settings?.defaultModel ??
      DEFAULT_AI_SETTINGS.defaultModel
    );
  });
  selectedThinking = $derived.by(() => {
    const { settings } = this.getProps();
    return (
      this.localThinking ?? settings?.thinking ?? DEFAULT_AI_SETTINGS.thinking
    );
  });
  modelOptions = $derived.by<ModelRef[]>(() => {
    const available = catalogModelsForAgent(
      this.selectedAgent,
      this.catalogModels,
    );
    if (
      this.selectedModel &&
      !available.some((model) => model.model === this.selectedModel)
    ) {
      return [
        { provider: this.selectedAgent, model: this.selectedModel },
        ...available,
      ];
    }
    return available;
  });
  mentionTriggers = $derived.by<ComposerTrigger[]>(() => {
    return mentionTriggers(this.getProps(), this, this.controller);
  });
  get automaticallyMentionAgents() {
    return this.getProps().settings?.automaticallyMentionAgents === true;
  }
  setAutomaticallyMentionAgents(value: boolean) {
    void runChatAction(this.getProps, this.controller, () =>
      this.getProps().onSettingsChange?.({ automaticallyMentionAgents: value }),
    );
  }
  removeRecipient(id?: string) {
    removeInlineRecipient(this, id);
  }
  selectRecipient(id: string, inline = true): void {
    void runChatAction(this.getProps, this.controller, () => {
      const option = this.recipientOptions.find((entry) => entry.id === id);
      if (!option) {
        this.recipients.selectedId = id;
        throw new Error("The selected agent is no longer available");
      }
      if (
        !this.recipients.selectedIds.length &&
        option.agent !== this.selectedAgent
      )
        this.changeAgent(option.agent, "acp");
      this.recipients.select(id);
      if (inline) appendInlineRecipient(this, id);
    });
  }
  composerError = $derived.by(() => {
    const { modelCatalogError = null, unavailableReason = null } =
      this.getProps();
    return (
      this.controller.error ??
      (this.catalogState
        ? this.catalogState.error
        : (modelCatalogError ?? unavailableReason)) ??
      this.controller.appToolsUnavailableReason
    );
  });
  composerStatus = $derived.by<ComposerStatus | undefined>(() => {
    return this.composerError
      ? { type: "error", message: this.composerError }
      : undefined;
  });
  showWorkingIndicator = $derived.by(() => {
    const { initializing = false } = this.getProps();
    return shouldShowWorkingIndicator(
      initializing,
      this.controller.busy,
      this.composerError,
    );
  });
  workingLabel = $derived.by(() => {
    const { initializing = false } = this.getProps();
    return initializing
      ? "Preparing AI…"
      : this.controller.commandWorking
        ? "Preparing command…"
        : "Agent is working…";
  });
  contextPercent = $derived.by(() => {
    return this.controller.usage
      ? Math.min(
          100,
          Math.round(
            (this.controller.usage.used / this.controller.usage.limit) * 100,
          ),
        )
      : 0;
  });

  constructor(
    private readonly getProps: () => AiChatPanelProps,
    private readonly controller: AiChatController,
  ) {
    super();
    this.permissions = new ComposerPermissions(getProps, controller);
    this.persistComposerDefaults = this.persistComposerDefaults.bind(this);
    this.changeAgent = this.changeAgent.bind(this);
    this.changeModel = this.changeModel.bind(this);
    this.changeThinking = this.changeThinking.bind(this);
    this.acceptDefaults = this.acceptDefaults.bind(this);
    onDestroy(() => this.catalog.cancel());
    observeComposerDefaults(this.getProps, this);
    observeInlineAudience(this);
  }
  persistComposerDefaults(
    agent: AcpAgentId,
    runtimePreference: "acp" | "codex-native" | "opencode-native" | "fake",
    model: string | null,
    thinking: AiThinkingLevel,
  ): void {
    const { onSettingsChange } = this.getProps();

    void runChatAction(this.getProps, this.controller, () =>
      onSettingsChange?.({
        acpAgent: agent,
        defaultRuntime: runtimePreference,
        ...(model ? { defaultModel: model } : {}),
        thinking,
      }),
    );
  }
  changeAgent(
    agent: AcpAgentId,
    runtimePreference: "acp" | "codex-native" | "opencode-native",
  ): void {
    changeComposerAgent(this, this.getProps(), agent, runtimePreference);
  }
  changeModel(value: string): void {
    this.localModel = value;
    this.persistComposerDefaults(
      this.selectedAgent,
      this.selectedRuntime === "fake" ? "acp" : this.selectedRuntime,
      value,
      this.selectedThinking,
    );
  }
  changeThinking(value: string): void {
    this.localThinking = value as AiThinkingLevel;
    this.persistComposerDefaults(
      this.selectedAgent,
      this.selectedRuntime === "fake" ? "acp" : this.selectedRuntime,
      this.selectedModel,
      this.localThinking,
    );
  }
  acceptDefaults({
    agent,
    runtimePreference,
  }: {
    agent: AcpAgentId;
    runtimePreference: "acp" | "codex-native" | "opencode-native" | "fake";
  }): void {
    if (runtimePreference === "fake") {
      this.catalog.cancel();
      this.catalogState = {
        agent,
        runtime: "fake",
        models: [],
        model: this.localModel ?? "",
        loading: false,
        error: null,
      };
      this.localAgent = agent;
      this.localRuntime = "fake";
      this.persistComposerDefaults(
        agent,
        "fake",
        this.localModel,
        this.selectedThinking,
      );
      return;
    }
    this.changeAgent(agent, runtimePreference);
  }
}
export function createComposerState(
  getProps: () => AiChatPanelProps,
  controller: AiChatController,
) {
  return new ComposerPanelState(getProps, controller);
}
export type ComposerState = ComposerPanelState;
