import type { AiChatController } from "../chat-controller.svelte.ts";
import type { AiChatItem } from "../chat-items.ts";
import type { AgentSession } from "../../core/runtime.ts";

/** A completed native request binds its own answers; proximity grants no parent. */
export function captureReplyParents(
  controller: AiChatController,
  session: AgentSession,
  trace: AiChatItem[],
): AiChatItem[] {
  const context = controller._sessionContexts.get(session),
    turn = context?.turn;
  if (
    !context ||
    !turn?.known ||
    turn.outcome !== "completed" ||
    !turn.nativeRequestId
  )
    return trace;
  const parentId = turn.intent.userEntryId;
  const next = trace.map((item) =>
    item.type === "message" &&
    item.role === "assistant" &&
    item.source?.runId === turn.nativeRequestId &&
    (!item.parentId || item.parentId === parentId)
      ? { ...item, parentId }
      : item,
  );
  if (
    context.location?.conversationId === controller.location?.conversationId &&
    context.location?.scopeDir === controller.location?.scopeDir
  ) {
    const parents = new Map(
      next
        .filter((i) => i.type === "message" && i.parentId === parentId)
        .map((i) => [i.id, parentId]),
    );
    controller.items = controller.items.map((item) =>
      parents.has(item.id) ? { ...item, parentId } : item,
    );
  }
  return next;
}
