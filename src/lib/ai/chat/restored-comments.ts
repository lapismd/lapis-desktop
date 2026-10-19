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
