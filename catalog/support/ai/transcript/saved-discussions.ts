import { savedCommentSnapshot } from "./saved-comments.ts";
import { projectAiTranscript } from "../../../../src/lib/ai/chat/transcript-projection.ts";
import { projectTranscriptToChatItems } from "../../../../src/lib/ai/conversations/transcript-to-chat.ts";

/** Local-file evidence, using the ordinary format and unchanged generic discussion UI. */
export function savedDiscussionSnapshot() {
  const snapshot = savedCommentSnapshot();
  const user = snapshot.transcript.find((e) => e.id === "saved-comment-user")!;
  if (user.type !== "message")
    throw new Error("Fixture comment parent is missing");
  user.agentBindingId = "saved-catalog-binding";
  const tool = projectAiTranscript(
    projectTranscriptToChatItems(snapshot.transcript),
  )
    .flatMap((i) => i.tools ?? [])
    .find((t) => t.id === "review-read")!;
  const block = tool.blocks[0]!;
  const capture = JSON.parse(user.contextBlocks![0]!.content);
  capture.comments.push({
    threadId: "saved-tool",
    commentId: "saved-tool-comment",
    author: { id: "local-user", name: "You", initials: "YO" },
    text: "Keep the original read result when answering.",
    anchor: {
      blockId: block.id,
      revision: block.revision,
      from: 0,
      to: block.text.length,
      quote: block.text,
    },
  });
  user.contextBlocks![0]!.content = JSON.stringify(capture);
  snapshot.transcript.push({
    schemaVersion: 3,
    id: "saved-feedback-reply",
    parentId: user.id,
    type: "message",
    role: "assistant",
    agentBindingId: user.agentBindingId,
    createdAt: "2026-10-19T00:01:00.000Z",
    text: "## A clarified daily review\n\nThe original code example, the **Research** row and the captured note read all stay intact. Review each open question before choosing the next action.\n\nYou can jump back to the exact feedback from this answer, or open this answer from any of the three comments.",
  });
  snapshot.metadata.title = "Linked code, table and tool discussions";
  return snapshot;
}
