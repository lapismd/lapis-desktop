import type { TranscriptSubmission } from "@lapismd/design-core/chat";
import type { AgentContextBlock } from "../core/context.ts";

/** Exact authored comments and immutable quotes; never concatenate into prompt text. */
export function transcriptCommentContext(
  submission: TranscriptSubmission,
): AgentContextBlock[] {
  if (!submission.comments.length) return [];
  return [
    {
      kind: "transcript-comments",
      id: submission.id,
      content: JSON.stringify({ comments: submission.comments }, null, 2),
      metadata: { submissionId: submission.id },
    },
  ];
}
