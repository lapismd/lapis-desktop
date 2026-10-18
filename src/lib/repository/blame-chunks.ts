import type { BlameRange } from "./blame-model.ts";
export const BLAME_UNAVAILABLE =
  "Blame is not available on this server yet. Source remains available.";
export function sourceLines(contents: string): string[] {
  if (!contents) return [];
  const lines = contents.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}
/** Matches the recorded-file admission of the shared JJ annotation adapter. */
export function blameSizeReason(contents: string): string | undefined {
  return new TextEncoder().encode(contents).byteLength > 256 * 1024 ||
    sourceLines(contents).length > 32_768
    ? "Blame is unavailable for files larger than 256 KiB or 32,768 lines."
    : undefined;
}
export interface BlameChunk {
  start: number;
  end: number;
  commitId?: string;
  continued: boolean;
}
/** Split long groups into bounded render chunks, retaining continuation attribution. */
export function blameChunks(
  lineCount: number,
  ranges: readonly BlameRange[],
): BlameChunk[] {
  const groups: { start: number; end: number; commitId?: string }[] = [];
  let cursor = 1;
  for (const native of ranges) {
    const range = {
      start: native.start,
      end: native.end,
      commitId: native.commit_id,
    };
    if (range.start > cursor) groups.push({ start: cursor, end: range.start });
    const previous = groups.at(-1);
    if (
      previous &&
      previous.commitId === range.commitId &&
      previous.end === range.start
    )
      previous.end = range.end;
    else groups.push({ ...range });
    cursor = range.end;
  }
  if (cursor <= lineCount) groups.push({ start: cursor, end: lineCount + 1 });
  return groups.flatMap((group) => {
    const chunks: BlameChunk[] = [];
    for (let start = group.start; start < group.end; start += 32)
      chunks.push({
        ...group,
        start,
        end: Math.min(start + 32, group.end),
        continued: start !== group.start,
      });
    return chunks;
  });
}
