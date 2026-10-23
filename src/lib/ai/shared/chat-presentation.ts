import { validateAgentParticipants } from "../settings/participants.ts";
import { normalizeAcpAgent } from "../settings/acp-agents.ts";
import type { AgentChatPresentation } from "@lapismd/agent-ui/chat";
import type { TranscriptPanelProps } from "../chat/panel/transcript.ts";
/** Only the portable presentation contract crosses into Agent UI; App and native services remain here. */
export function desktopChatPresentation(
  owner: () => TranscriptPanelProps,
): AgentChatPresentation {
  return {
    get composerState(): AgentChatPresentation["composerState"] {
      const host = owner().composerState;
      return {
        get draft() {
          return host.draft;
        },
        set draft(value: string) {
          host.draft = value;
        },
        get selectedRuntime() {
          return host.selectedRuntime;
        },
        get selectedAgent() {
          return host.selectedAgent;
        },
        get selectedModel() {
          return host.selectedModel;
        },
        get selectedThinking() {
          return host.selectedThinking;
        },
        get contextPercent() {
          return host.contextPercent;
        },
        get composerStatus() {
          return host.composerStatus;
        },
        get recipientOptions() {
          return host.recipientOptions;
        },
        get recipients() {
          return host.recipients;
        },
        get catalogState() {
          return host.catalogState ?? undefined;
        },
        get modelOptions() {
          return host.modelOptions;
        },
        changeAgent(agent, runtime) {
          if (
            normalizeAcpAgent(agent) !== agent ||
            !["acp", "codex-native", "opencode-native"].includes(runtime)
          )
            throw new Error("This runtime is unavailable.");
          host.changeAgent(
            normalizeAcpAgent(agent),
            runtime as "acp" | "codex-native" | "opencode-native",
          );
        },
        changeModel: (value) => host.changeModel(value),
        changeThinking: (value) => host.changeThinking(value),
        insertReference: (value) => host.insertReference(value),
        setAutomaticallyMentionAgents: (value) =>
          host.setAutomaticallyMentionAgents(value),
        removeRecipient: (id) => host.removeRecipient(id),
        selectRecipient: (id) => host.selectRecipient(id),
      };
    },
    get attachmentsState() {
      return owner().attachmentsState;
    },
    get conversationsState() {
      return owner().conversationsState;
    },
    actions: {
      async perform<T>(action: () => T | Promise<T>): Promise<T> {
        let result!: T,
          completed = false;
        await owner().actions.perform(async () => {
          result = await action();
          completed = true;
        });
        if (!completed)
          throw new Error(owner().controller.error ?? "Action unavailable");
        return result;
      },
      formatTokenCount: (value) => owner().actions.formatTokenCount(value),
    },
    panelProps: {
      validateParticipants: (value) => validateAgentParticipants(value) ?? [],
      get mentionPeople() {
        return owner().panelProps.mentionPeople;
      },
      get loadModels() {
        return owner().panelProps.loadModels;
      },
      get loadExecutionModes() {
        return owner().panelProps.loadExecutionModes;
      },
      get initializing() {
        return (
          !!owner().panelProps.initializing || !owner().composerState.draftReady
        );
      },
      transcriptFrame: true,
      get repository() {
        return !!owner().panelProps.repository;
      },
      get fileSearch() {
        return !!owner().panelProps.fileSearch;
      },
      get selectRuntime() {
        return !!owner().panelProps.selectRuntime;
      },
      get settings() {
        return owner().panelProps.settings;
      },
      onSettingsChange: (patch) => owner().panelProps.onSettingsChange?.(patch),
      onError: (error) => {
        if (error)
          void owner().actions.perform(() => {
            throw error;
          });
      },
    },
    controller: {
      get busy() {
        return owner().controller.busy;
      },
      get repository() {
        return !!owner().controller.repository;
      },
      get usage() {
        return owner().controller.usage ?? undefined;
      },
      get queuedMessages() {
        return owner().controller.queuedMessages;
      },
      cancel: () => owner().controller.cancel(),
      respondToApproval: (...args) =>
        owner().controller.respondToApproval(...args),
      respondToQuestion: (...args) =>
        owner().controller.respondToQuestion(...args),
    },
  };
}
