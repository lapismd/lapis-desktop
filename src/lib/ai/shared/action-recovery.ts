import type {
  AgentAction,
  AgentOutcome,
  AgentSnapshot,
} from "@lapismd/agent-ui/core";
import type { TranscriptPanelProps } from "../chat/panel/transcript.ts";
import type { ConversationLocation } from "../conversations/types.ts";
/** Retain application-owned identities; recovery reads receipts and never dispatches. */
export class DesktopActionRecovery {
  private pending?: {
    action: AgentAction;
    location: ConversationLocation | null;
    before: Set<string>;
    user?: string;
  };
  begin(action: AgentAction, panel: TranscriptPanelProps) {
    this.pending = {
      action,
      location: panel.controller.location,
      before: new Set(panel.controller.items.map((item) => item.id)),
    };
  }
  capture(panel: TranscriptPanelProps) {
    const pending = this.pending;
    if (!pending || pending.user || pending.action.kind !== "send") return;
    const current = panel.controller.location;
    if (
      pending.location &&
      (current?.scopeDir !== pending.location.scopeDir ||
        current.conversationId !== pending.location.conversationId)
    )
      return;
    const users = panel.controller.items.filter(
      (item) =>
        item.type === "message" &&
        item.role === "user" &&
        !pending.before.has(item.id) &&
        item.text === pending.action.submission?.text,
    );
    if (users.length === 1) {
      pending.user = users[0]!.id;
      pending.location = panel.controller.location;
    }
  }
  refusal(panel: TranscriptPanelProps): string | undefined {
    const pending = this.pending;
    if (!pending || pending.action.kind !== "send") return;
    const failures = panel.controller.items.filter(
      (item) =>
        item.type === "error" &&
        !pending.before.has(item.id) &&
        item.retryable !== false,
    );
    return failures.length === 1 && failures[0]!.type === "error"
      ? failures[0]!.text
      : undefined;
  }
  async status(
    id: string,
    panel: TranscriptPanelProps,
    snapshot: () => AgentSnapshot,
  ): Promise<AgentOutcome> {
    const pending = this.pending;
    if (!pending || pending.action.id !== id) return { status: "unknown" };
    if (
      pending.action.kind === "respond" &&
      pending.location?.scopeDir === panel.controller.location?.scopeDir &&
      pending.location?.conversationId ===
        panel.controller.location?.conversationId
    ) {
      const item = panel.controller.items.find(
        (item) =>
          (item.type === "approval" || item.type === "question") &&
          item.request.id === pending.action.target,
      );
      if (
        item &&
        (item.type === "approval" || item.type === "question") &&
        item.status !== "pending" &&
        item.status !== "cancelled"
      )
        return { status: "acknowledged", snapshot: snapshot() };
    }
    if (
      pending.action.kind === "send" &&
      pending.location &&
      panel.controller.repository
    ) {
      this.capture(panel);
      const saved = await panel.controller.repository.read(pending.location);
      const user = saved.transcript.find(
        (entry) =>
          entry.id === pending.user &&
          entry.type === "message" &&
          entry.role === "user",
      );
      if (user) return { status: "acknowledged", snapshot: snapshot() };
    }
    return { status: "unknown" };
  }
}
