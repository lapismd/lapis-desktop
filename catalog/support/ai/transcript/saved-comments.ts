import { transcriptReviewItems } from "./seeds.ts";
import { projectAiTranscript } from "../../../../src/lib/ai/chat/transcript-projection.ts";
import { transcriptCommentContext } from "../../../../src/lib/ai/chat/transcript-context.ts";
import { projectChatItemsToTranscript } from "../../../../src/lib/ai/conversations/chat-to-transcript.ts";
import { commentReceipt } from "../../../../src/lib/ai/conversations/comment-receipt.ts";
import type { ConversationSnapshot } from "../../../../src/lib/ai/conversations/types.ts";

export function savedCommentSnapshot(): ConversationSnapshot {
  const items = transcriptReviewItems();
  const block = projectAiTranscript(items).find(
    (item) => item.id === "review-response",
  )!.blocks[0]!;
  const anchor = (quote: string) => ({
    blockId: block.id,
    revision: block.revision,
    from: block.text.indexOf(quote),
    to: block.text.indexOf(quote) + quote.length,
    quote,
  });
  const author = { id: "local-user", name: "You", initials: "YO" };
  const captured = transcriptCommentContext({
    id: "saved-context-batch",
    text: "",
    comments: [
      {
        threadId: "saved-code",
        commentId: "saved-code-comment",
        author,
        text: "Keep this code feedback after reopening.",
        anchor: anchor("# Daily review"),
      },
      {
        threadId: "saved-table",
        commentId: "saved-table-comment",
        author,
        text: "Keep this table feedback and its original row.",
        anchor: {
          ...anchor("Research"),
          tableContext: {
            markdown: "| Research | Link the three open questions | Tomorrow |",
            from: 2,
            to: 10,
          },
        },
      },
    ],
  });
  const userId = "saved-comment-user";
  return {
    location: {
      scopeDir: "Notes",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    },
    metadata: {
      schemaVersion: 3,
      id: "123e4567-e89b-42d3-a456-426614174000",
      title: "Saved code and table feedback",
      createdAt: "2026-10-19T00:00:00.000Z",
      updatedAt: "2026-10-19T00:00:00.000Z",
      status: "active",
      activeAgentBindingId: "saved-catalog-binding",
    },
    agents: [
      {
        schemaVersion: 3,
        id: "saved-catalog-binding",
        type: "binding.created",
        createdAt: "2026-10-19T00:00:00.000Z",
        runtime: "fake",
        agent: "codex",
        nativeSessionId: "saved-catalog-session",
      },
    ],
    warnings: [],
    transcript: [
      ...projectChatItemsToTranscript(items),
      ...projectChatItemsToTranscript([
        {
          id: userId,
          type: "message",
          role: "user",
          text: "",
          contextBlocks: captured,
          createdAt: "2026-10-19T00:00:00.000Z",
        },
      ]),
      commentReceipt(userId),
    ],
  };
}
