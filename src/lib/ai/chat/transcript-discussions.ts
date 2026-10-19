import { tick } from "svelte";
import type { App } from "@lapis-notes/api";
import type {
  TranscriptCommentThread,
  TranscriptController,
  TranscriptItem,
  TranscriptSubmissionComment,
} from "@lapismd/design-core/chat";
import type { AiChatItem } from "./chat-items.ts";
import type { AgentBindingCreatedRecord } from "../conversations/types.ts";
import { persistableCommentContexts } from "../conversations/comment-context.ts";
import { bindingLabels } from "./panel/binding-labels.ts";

type Message = Extract<AiChatItem, { type: "message" }>;
type Reply = {
  user: Message;
  comments: TranscriptSubmissionComment[];
  destinations: { id: string; label: string }[];
};

function acceptedBinding(user: Message, bindingId: string) {
  return user.deliveries?.length
    ? user.deliveries.every((d) => d.state === "completed") &&
        user.deliveries.some((d) => d.agentBindingId === bindingId)
    : user.agentBindingId === bindingId;
}

/** Reuses jj-store's explicit reply-context model with local receipt/parent evidence. */
export function discussionReplies(
  items: readonly AiChatItem[],
  bindings: readonly AgentBindingCreatedRecord[] = [],
): Reply[] {
  const users = new Map(
    items
      .filter(
        (i): i is Message =>
          i.type === "message" &&
          i.role === "user" &&
          i.contextDelivery === "sent" &&
          !!i.contextBlocks?.length,
      )
      .map((i) => [i.id, i]),
  );
  const answers = new Map<string, Map<string, Message>>();
  for (const item of items) {
    if (
      item.type !== "message" ||
      item.role !== "assistant" ||
      !item.text.trim() ||
      !item.parentId ||
      !item.agentBindingId
    )
      continue;
    const user = users.get(item.parentId);
    if (!user || !acceptedBinding(user, item.agentBindingId)) continue;
    const byBinding = answers.get(user.id) ?? new Map<string, Message>();
    byBinding.set(item.agentBindingId, item);
    answers.set(user.id, byBinding);
  }
  const labels = bindingLabels([...bindings]);
  return [...answers].map(([id, byBinding]) => {
    const user = users.get(id)!;
    return {
      user,
      comments: persistableCommentContexts(user.contextBlocks).flatMap(
        (b) => JSON.parse(b.content).comments as TranscriptSubmissionComment[],
      ),
      destinations: [...byBinding].map(([bindingId, answer]) => ({
        id: answer.id,
        label: labels.get(bindingId) ?? "Agent reply",
      })),
    };
  });
}

export function discussionReplyContexts(
  items: readonly AiChatItem[],
  bindings: readonly AgentBindingCreatedRecord[] = [],
) {
  const result = new Map<string, NonNullable<TranscriptItem["replyContext"]>>();
  for (const reply of discussionReplies(items, bindings)) {
    const first = reply.comments[0];
    if (!first) continue;
    const context = {
      threadId: first.threadId,
      commentIds: reply.comments
        .filter((c) => c.threadId === first.threadId)
        .map((c) => c.commentId),
    };
    for (const destination of reply.destinations)
      result.set(destination.id, context);
  }
  return result;
}

export function restoreDiscussionReplies(
  current: TranscriptCommentThread[],
  items: readonly AiChatItem[],
  bindings: readonly AgentBindingCreatedRecord[] = [],
) {
  let next = current;
  for (const reply of discussionReplies(items, bindings))
    for (const captured of reply.comments) {
      const thread = next.find(
        (t) =>
          t.id === captured.threadId &&
          JSON.stringify(t.anchor) === JSON.stringify(captured.anchor),
      );
      const comment = thread?.comments.find(
        (c) =>
          c.id === captured.commentId &&
          c.messageId === reply.user.id &&
          c.text === captured.text &&
          ["sent", "replied"].includes(c.status),
      );
      if (
        !thread ||
        !comment ||
        (comment.status === "replied" &&
          comment.replyItemId === reply.destinations[0]!.id &&
          JSON.stringify(comment.replyDestinations) ===
            JSON.stringify(reply.destinations))
      )
        continue;
      next = next.map((t) =>
        t === thread
          ? {
              ...t,
              comments: t.comments.map((c) =>
                c === comment
                  ? {
                      ...c,
                      status: "replied" as const,
                      replyItemId: reply.destinations[0]!.id,
                      replyDestinations: reply.destinations,
                    }
                  : c,
              ),
            }
          : t,
      );
    }
  return next;
}

/** Public reader registrations handle both presentations, avoiding private DOM selectors. */
async function revealDiscussionReply(
  state: TranscriptController,
  items: readonly TranscriptItem[],
  itemId: string,
) {
  const item = items.find((i) => i.id === itemId && i.replyContext),
    block = item?.blocks[0];
  if (!item || !block)
    throw new Error("The captured agent reply is unavailable");
  state.disclosures[item.id] = true;
  await tick();
  await tick();
  const reader = state.readers.get(block.id);
  if (!reader)
    throw new Error("The captured agent reply cannot be shown in this view");
  reader(
    { blockId: block.id, revision: block.revision, from: 0, to: 0, quote: "" },
    true,
  );
}

export async function navigateDiscussionReply(
  state: TranscriptController,
  items: readonly TranscriptItem[],
  itemId: string,
  notifications?: Pick<App["notifications"], "notify">,
) {
  try {
    await revealDiscussionReply(state, items, itemId);
  } catch (error) {
    notifications?.notify({
      id: "ai-discussion-navigation-error",
      source: "ai",
      severity: "error",
      title: "AI discussion",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
