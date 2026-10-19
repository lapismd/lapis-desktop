import type {
  TranscriptCommentThread,
  TranscriptSubmissionComment,
} from "@lapismd/design-core/chat";
import type { AiChatItem } from "./chat-items.ts";
import { projectAiTranscript } from "./transcript-projection.ts";
import { persistableCommentContexts } from "../conversations/comment-context.ts";

/** Restore only locally acknowledged captures; never turn unknown history into drafts. */
export function restoreTranscriptComments(
  current: TranscriptCommentThread[],
  items: readonly AiChatItem[],
  seen?: WeakSet<object>,
): TranscriptCommentThread[] {
  let next = current;
  const delivered = items.filter(
    (item) =>
      item.type === "message" &&
      item.role === "user" &&
      item.contextDelivery === "sent" &&
      !seen?.has(item),
  );
  if (!delivered.length) return current;
  const blocks = projectAiTranscript(items).flatMap((item) => [
    ...item.blocks,
    ...(item.tools ?? []).flatMap((tool) => tool.blocks),
  ]);
  for (const item of delivered) {
    for (const block of persistableCommentContexts(item.contextBlocks)) {
      const comments = JSON.parse(block.content)
        .comments as TranscriptSubmissionComment[];
      for (const capture of comments) {
        const existing = next.find((thread) => thread.id === capture.threadId);
        // Conflicting anchors remain inspectable in their captured context disclosure.
        if (
          existing &&
          JSON.stringify(existing.anchor) === JSON.stringify(capture.anchor)
        ) {
          const previous = existing.comments.find(
            (c) => c.id === capture.commentId,
          );
          if (
            previous &&
            previous.text === capture.text &&
            previous.status === "queued"
          ) {
            next = next.map((t) =>
              t === existing
                ? {
                    ...t,
                    comments: t.comments.map((c) =>
                      c === previous
                        ? {
                            ...c,
                            status: "sent" as const,
                            messageId: item.id,
                            batchId: block.id,
                            version: `local:${item.id}`,
                          }
                        : c,
                    ),
                  }
                : t,
            );
            continue;
          }
        }
        if (
          existing &&
          (JSON.stringify(existing.anchor) !== JSON.stringify(capture.anchor) ||
            existing.comments.some(
              (comment) => comment.id === capture.commentId,
            ))
        )
          continue;
        const source = blocks.find(
          (candidate) => candidate.id === capture.anchor.blockId,
        );
        const comment = {
          id: capture.commentId,
          author: structuredClone(capture.author),
          text: capture.text,
          status: "sent" as const,
          messageId: item.id,
          batchId: block.id,
          batchIds: [block.id],
          version: `local:${item.id}`,
          createdAt: item.createdAt ? Date.parse(item.createdAt) : undefined,
        };
        const thread = existing
          ? { ...existing, comments: [...existing.comments, comment] }
          : {
              id: capture.threadId,
              anchor: structuredClone(capture.anchor),
              label: source?.label ?? "Captured transcript",
              sourceKind: source?.kind ?? ("markdown" as const),
              comments: [comment],
            };
        next = existing
          ? next.map((entry) => (entry === existing ? thread : entry))
          : [...next, thread];
      }
    }
    seen?.add(item);
  }
  return next;
}

/** Only an explicit acknowledged cancellation can return its current live comments to drafts. */
export function reclaimQueuedCommentDrafts(
  current: TranscriptCommentThread[],
  blocks: readonly import("../core/context.ts").AgentContextBlock[] | undefined,
) {
  let next = current;
  for (const block of persistableCommentContexts(blocks)) {
    const comments = JSON.parse(block.content)
      .comments as TranscriptSubmissionComment[];
    for (const captured of comments)
      next = next.map((thread) => {
        if (
          thread.id !== captured.threadId ||
          JSON.stringify(thread.anchor) !== JSON.stringify(captured.anchor)
        )
          return thread;
        const previous = thread.comments.find(
          (c) =>
            c.id === captured.commentId &&
            c.text === captured.text &&
            c.status === "queued" &&
            c.batchId === block.id,
        );
        return previous
          ? {
              ...thread,
              comments: thread.comments.map((c) =>
                c === previous
                  ? { ...c, status: "draft" as const, batchId: undefined }
                  : c,
              ),
            }
          : thread;
      });
  }
  return next;
}
