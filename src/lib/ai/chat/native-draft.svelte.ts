// SPDX-License-Identifier: Apache-2.0
import type { MarkdownComposerHandle } from "@lapismd/design-core/chat";
import type { ComposerTrigger } from "@lapismd/design-core/ai/chat";
import { agentMentionMatches } from "@lapismd/jj-conversations";
import type { AiPluginSettings } from "../settings/ai-settings.ts";
import type { AcpAgentId } from "../settings/acp-agents.ts";
import type { AiThinkingLevel } from "../core/models.ts";
import { ComposerRecipients } from "./panel/recipients.svelte.ts";
import {
  ComposerModelCatalog,
  type ComposerModelCatalogState,
} from "./composer-model-catalog.ts";
import {
  recipientFromOption,
  type AgentRecipientOption,
} from "../conversations/recipients.ts";
import type { ManagedTurnRecipient } from "../conversations/managed-turn-types.ts";
import type { AgentProfileEditorContext } from "../settings/agent-profile-editor.ts";
import {
  observeInlineAudience,
  removeInlineRecipient,
} from "./panel/inline-audience.svelte.ts";

/** Native view-local preferences; the shared editor owns saved profiles. */
export class NativeChatDraft {
  draft = $state("");
  input = $state<MarkdownComposerHandle | null>(null);
  localModel = $state<string>();
  localThinking = $state<AiThinkingLevel>();
  catalogState = $state<ComposerModelCatalogState | null>(null);
  readonly selectedRuntime = "acp";
  readonly selectedAgent = "codex";
  readonly recipients = new ComposerRecipients(() => this.recipientOptions);
  readonly catalog = new ComposerModelCatalog(
    (agent, runtime) =>
      this.context().loadModels?.(agent, runtime) ?? Promise.resolve([]),
    (state) => {
      this.catalogState = state;
    },
  );
  selectedThinking = $derived.by(
    () => this.localThinking ?? this.context().settings?.thinking ?? "medium",
  );
  selectedModel = $derived.by(
    () =>
      this.localModel ?? this.context().settings?.defaultModels?.codex ?? "",
  );
  recipientOptions = $derived.by<readonly AgentRecipientOption[]>(() =>
    (
      this.context().settings?.agentParticipants ?? [
        { id: "codex", agent: "codex", label: "Codex" },
      ]
    ).filter((option) => option.agent === "codex"),
  );
  modelOptions = $derived(
    (this.catalogState?.models ?? []).filter(
      (model) => model.provider === "codex",
    ),
  );
  mentionTriggers = $derived.by<ComposerTrigger[]>(() => [
    {
      character: "@",
      menuLabel: "Agents",
      emptySearchResultsText: "No matching agents",
      searchSource: (query) =>
        this.recipientOptions
          .filter((option) =>
            `${option.label} ${option.id}`
              .toLocaleLowerCase()
              .includes(query.toLocaleLowerCase()),
          )
          .map((option) => ({
            id: option.id,
            label: option.label,
            description: `${option.agent} · ${option.model ?? "Default model"}`,
            avatar: {
              id: option.id,
              name: option.label,
              src: option.avatar,
              background: option.avatarBackground,
              shape: "rounded",
            },
          })),
      onSelect: (item) => {
        try {
          this.recipients.select(item.id);
        } catch (error) {
          this.report(error);
          return "";
        }
        const option = this.recipientOptions.find(
          (option) => option.id === item.id,
        );
        return option ? `${recipientFromOption(option).token} ` : "";
      },
    },
  ]);
  readonly #drafts = new Map<string, string>();
  #thread?: string;
  constructor(
    private readonly context: () => AgentProfileEditorContext,
    private readonly workspace: string | undefined,
    private readonly report: (error: unknown) => void,
  ) {
    observeInlineAudience(this);
  }
  activate(thread: string) {
    if (this.#thread === thread) return;
    if (this.#thread) this.#drafts.set(this.#thread, this.draft);
    this.#thread = thread;
    this.draft = this.#drafts.get(thread) ?? "";
  }
  insertReference(value: string) {
    if (this.input) this.input.insertText(`${value} `);
    else this.draft += `${value} `;
  }
  toggleRecipient(id: string) {
    if (this.recipients.selectedIds.includes(id))
      return removeInlineRecipient(this, id);
    this.recipients.select(id);
    const option = this.recipientOptions.find((option) => option.id === id)!;
    this.insertReference(recipientFromOption(option).token);
  }
  sent(text: string) {
    if (this.draft !== text) return;
    this.draft = this.context().settings?.automaticallyMentionAgents
      ? agentMentionMatches(text)
          .map((match) => text.slice(match.start, match.end))
          .join(" ") + " "
      : "";
  }
  setAutomaticallyMentionAgents(value: boolean) {
    void Promise.resolve()
      .then(() =>
        this.context().onSettingsChange?.({
          automaticallyMentionAgents: value,
        }),
      )
      .catch(this.report);
  }
  changeAgent(agent: AcpAgentId, _runtime: AiPluginSettings["defaultRuntime"]) {
    if (agent !== "codex")
      throw new Error("Native conversations currently support Codex ACP");
    void this.catalog.refresh(agent, "acp", this.selectedModel);
  }
  changeModel(value: string) {
    this.localModel = value;
  }
  changeThinking(value: string) {
    this.localThinking = value as AiThinkingLevel;
  }
  snapshot(): ManagedTurnRecipient[] {
    const selected = this.recipients.snapshot();
    const options: readonly AgentRecipientOption[] = selected?.options ?? [
      { id: "codex", agent: "codex", label: "Codex" },
    ];
    return options.map((option) => {
      const model = option.model ?? this.selectedModel;
      const thinking = option.thinking ?? this.selectedThinking;
      return {
        participant: {
          profileId: option.id,
          label: option.label,
          preferredModel: model || null,
          preferredEffort: thinking,
        },
        request: {
          agent: option.agent,
          workspace: this.workspace,
          model: model ? { provider: option.agent, model } : undefined,
          thinking,
          metadata: { runtime: "acp" },
          approvalPolicy: "ask",
          requireApprovals: true,
        },
      };
    });
  }
}
