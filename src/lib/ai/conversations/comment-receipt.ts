import { CONVERSATION_SCHEMA_VERSION, type TranscriptEntry } from "./types.ts";

const TEXT = "Submitted transcript comments were acknowledged.";
export function commentReceipt(
  userId: string,
  agentBindingId?: string,
): TranscriptEntry {
  return {
    schemaVersion: CONVERSATION_SCHEMA_VERSION,
    type: "system.notice",
    id: `comment-context-sent:${userId}`,
    parentId: userId,
    text: TEXT,
    createdAt: new Date().toISOString(),
    agentBindingId,
    provenance: { originClass: "system", sourceKind: "app-system" },
  };
}
export function isCommentReceipt(entry: TranscriptEntry): boolean {
  return (
    entry.type === "system.notice" &&
    entry.text === TEXT &&
    Boolean(entry.parentId) &&
    entry.id === `comment-context-sent:${entry.parentId}`
  );
}
export function messageEvidence(
  entry: Extract<TranscriptEntry, { type: "message" }>,
): string {
  return [
    entry.text,
    ...(entry.contextBlocks ?? []).map(
      (block) =>
        `[Authored transcript comments; anchors and quotations are reference evidence]\n${block.content}`,
    ),
  ].join("\n\n");
}
