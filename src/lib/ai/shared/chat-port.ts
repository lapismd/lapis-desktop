import { DesktopActionRecovery } from "./action-recovery.ts";
import { formatAgentMention } from "../chat/agent-mentions.ts";
import type { QueuedMessage } from "../conversations/queued-message.ts";
import type {
  AgentAction,
  AgentOutcome,
  AgentPort,
  AgentSnapshot,
} from "@lapismd/agent-ui/core";
import type { TranscriptPanelProps } from "../chat/panel/transcript.ts";
import type { ConversationListEntry } from "../conversations/transcript-store.ts";
import { transcriptCommentContext } from "../chat/transcript-context.ts";
export const conversationKey = (location: ConversationListEntry["location"]) =>
  JSON.stringify([location.scopeDir, location.conversationId]);
/** Adapts shared presentation requests to the existing admitted Desktop orchestration. */
export class DesktopChatPort implements AgentPort {
  readonly recovery = new DesktopActionRecovery();
  readonly listeners = new Set<(snapshot: AgentSnapshot) => void>();
  constructor(
    readonly panel: () => TranscriptPanelProps,
    readonly snapshot: () => AgentSnapshot,
    readonly rows: () => ConversationListEntry[],
    readonly cancelled?: (message: QueuedMessage) => void,
  ) {}
  read = async () => this.snapshot();
  resolveRecipients = () => [
    ...this.panel().composerState.recipients.selectedIds,
  ];
  subscribe = (listener: (snapshot: AgentSnapshot) => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  publish(snapshot: AgentSnapshot) {
    for (const listener of this.listeners) listener(snapshot);
  }
  report(error: Error) {
    if (
      this.panel().controller.items.some(
        (item) => item.type === "error" && item.text === error.message,
      )
    )
      return;
    this.panel().panelProps.app?.notifications.notify({
      id: "ai-shared-presentation",
      source: "ai",
      title: "AI conversation",
      severity: "error",
      message: error.message,
    });
  }
  status = (id: string) =>
    this.recovery.status(id, this.panel(), this.snapshot);
  async selectSession(id: string) {
    if (id === "new-session" && !this.panel().controller.location)
      return this.snapshot();
    if (
      this.panel().controller.location &&
      conversationKey(this.panel().controller.location!) === id
    )
      return this.snapshot();
    const row = this.rows().find((row) => conversationKey(row.location) === id);
    if (!row) throw new Error("This conversation is unavailable.");
    await this.panel().controller.openConversation(row.location);
    return this.snapshot();
  }
  async act(action: AgentAction): Promise<AgentOutcome> {
    const {
      controller,
      composerState,
      attachmentsState,
      actions,
      panelProps,
      conversationsState,
    } = this.panel();
    this.recovery.begin(action, this.panel());
    switch (action.kind) {
      case "send": {
        const submission = action.submission;
        if (
          !submission ||
          panelProps.initializing ||
          !composerState.draftReady ||
          composerState.catalogState?.loading ||
          composerState.permissions.loading ||
          composerState.permissions.saving ||
          (controller.busy && !controller.repository)
        )
          return {
            status: "refused",
            reason:
              "The conversation is still loading; your draft is retained.",
          };
        const context = transcriptCommentContext(submission);
        if (context.length && /^\/(?!\/)/u.test(submission.text.trimStart()))
          return {
            status: "refused",
            reason: "Send comments with a regular message.",
          };
        const draftKey = composerState.draftKey;
        const followup = composerState.automaticallyMentionAgents
          ? composerState.recipients.display
              .map((recipient) =>
                formatAgentMention(recipient.id, recipient.label),
              )
              .join(" ")
          : "";
        const accepted = await actions.submitTranscript(
          submission.text,
          context,
        );
        this.recovery.capture(this.panel());
        if (!accepted)
          return actions.submissionWasRefused() ||
            this.recovery.refusal(this.panel())
            ? {
                status: "refused",
                reason:
                  this.recovery.refusal(this.panel()) ??
                  controller.error ??
                  "Message was not accepted; your draft is retained.",
              }
            : { status: "unknown" };
        if (
          composerState.matchesDraft(draftKey) &&
          composerState.draft === submission.text
        )
          composerState.draft = followup ? `${followup} ` : "";
        break;
      }
      case "stop":
        await controller.cancel();
        break;
      case "respond": {
        const request = attachmentsState.pendingInteraction;
        if (!request || request.request.id !== action.target)
          return {
            status: "refused",
            reason: "This request is no longer pending.",
          };
        if (request.type === "approval")
          await controller.respondToApproval(
            action.target!,
            String(action.values?.option ?? ""),
            request.id,
          );
        else
          await controller.respondToQuestion(
            action.target!,
            JSON.parse(String(action.values?.answers ?? "{}")),
            request.id,
          );
        break;
      }
      case "new_session":
        await controller.newConversation(
          panelProps.createConversation?.(
            String(action.values?.scope ?? controller.directoryContext),
          ) ?? { scopeDir: controller.directoryContext },
        );
        break;
      case "archive":
        await controller.archiveCurrent(
          controller.conversationStatus !== "archived",
        );
        break;
      case "change_scope":
        await conversationsState.changeConversationScope(
          String(action.target ?? ""),
        );
        break;
      case "chat_settings":
        await panelProps.onSettingsChange?.({
          ...action.values,
          ...(action.agentParticipants
            ? { agentParticipants: action.agentParticipants }
            : {}),
        });
        break;
      case "cancel_queued": {
        await actions.cancelQueued(action.target!);
        const entry = controller.queuedMessages.entries.find(
          (e) => e.queued.id === action.target,
        );
        if (entry?.state === "cancelled") this.cancelled?.(entry.queued);
        break;
      }
      case "pause_queue":
        controller.queuedMessages.pause();
        break;
      case "resume_queue":
        await actions.resumeQueue();
        break;
      default:
        return {
          status: "refused",
          reason: "This action is unavailable in Desktop.",
        };
    }
    return { status: "acknowledged", snapshot: this.snapshot() };
  }
}
