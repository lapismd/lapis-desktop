import type { AgentContextBlock } from "../core/context.ts";
import { record, requiredString } from "./validation-fields.ts";

export type CommentContextBlock = Extract<
  AgentContextBlock,
  { kind: "transcript-comments" }
>;
export function validateCommentContexts(value: unknown): CommentContextBlock[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 16)
    throw new Error("Invalid comment context list");
  if (new TextEncoder().encode(JSON.stringify(value)).length > 65_536)
    throw new Error("Comment context exceeds 64 KiB");
  const ids = new Set<string>();
  for (const input of value) {
    const block = record(input, "Comment context");
    const id = identity(block, "id");
    const metadata = record(block.metadata, "Comment context metadata");
    if (
      block.kind !== "transcript-comments" ||
      metadata.submissionId !== id ||
      ids.has(id)
    )
      throw new Error("Invalid comment context identity");
    ids.add(id);
    const content = record(
      JSON.parse(requiredString(block, "content", "Comment context")),
      "Comment capture",
    );
    if (
      !Array.isArray(content.comments) ||
      !content.comments.length ||
      content.comments.length > 64
    )
      throw new Error("Invalid captured comment list");
    const comments = new Set<string>();
    for (const input of content.comments) {
      const comment = record(input, "Captured comment");
      identity(comment, "threadId");
      const commentId = identity(comment, "commentId");
      if (comments.has(commentId))
        throw new Error("Duplicate captured comment");
      comments.add(commentId);
      requiredString(comment, "text", "Captured comment");
      const author = record(comment.author, "Comment author");
      identity(author, "id");
      identity(author, "name");
      const anchor = record(comment.anchor, "Comment anchor");
      identity(anchor, "blockId");
      identity(anchor, "revision");
      range(anchor);
      if (
        typeof anchor.quote !== "string" ||
        anchor.quote.length !== Number(anchor.to) - Number(anchor.from)
      )
        throw new Error("Comment quote does not match its captured range");
      if (anchor.tableContext !== undefined) {
        const table = record(anchor.tableContext, "Comment table context");
        range(table);
        if (
          typeof table.markdown !== "string" ||
          Number(table.to) > table.markdown.length
        )
          throw new Error("Invalid captured table context");
      }
    }
  }
  return value as CommentContextBlock[];
}
function identity(value: Record<string, unknown>, key: string): string {
  const text = requiredString(value, key, "Comment capture");
  if (text.length > 512 || /[\u0000-\u001f]/u.test(text))
    throw new Error("Invalid comment capture identity");
  return text;
}
function range(value: Record<string, unknown>): void {
  if (
    !Number.isSafeInteger(value.from) ||
    !Number.isSafeInteger(value.to) ||
    Number(value.from) < 0 ||
    Number(value.to) < Number(value.from)
  )
    throw new Error("Invalid comment capture range");
}
export function persistableCommentContexts(
  blocks?: readonly AgentContextBlock[],
): CommentContextBlock[] {
  const captured = structuredClone(
    blocks?.filter((block) => block.kind === "transcript-comments") ?? [],
  );
  return validateCommentContexts(captured);
}
