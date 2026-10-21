// SPDX-License-Identifier: Apache-2.0
import type { DurableMemoryRecord } from "./types.ts";
import { conversationDirectory } from "../conversations/paths.ts";

export type NoteBlock = {
  id: string;
  text: string;
  summary: string;
  start: number;
  end: number;
};
export function noteBlocks(content: string): NoteBlock[] {
  return [
    ...content.matchAll(
      /<!-- memory:([a-z0-9-]+) -->\r?\n([\s\S]*?)<!-- \/memory:\1 -->(?:\r?\n)?/gu,
    ),
  ].map((match) => ({
    id: match[1]!,
    text: match[0],
    start: match.index!,
    end: match.index! + match[0].length,
    summary: match[2]!
      .replace(/^##[^\n]*\r?\n\r?\n/u, "")
      .split(/\r?\n\r?\n(?:Sources:|Daily note:|\^)/u)[0]!
      .trim(),
  }));
}

export function renderMemoryBlock(
  record: DurableMemoryRecord,
  timezone: string,
  daily?: string,
): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(record.updatedAt));
  const sources = record.evidence
    .map(
      (ref) =>
        `[Conversation ${ref.conversationId.slice(0, 8)}](${encodeURI(conversationDirectory({ scopeDir: ref.scopeDirAtObservation, conversationId: ref.conversationId }) + "/transcript.jsonl")})`,
    )
    .join(" · ");
  return `<!-- memory:${record.id} -->\n## ${time} — ${record.kind}\n\n${record.summary.trim()}\n\n${daily ? `Daily note: [${daily}](${encodeURI(daily)}#^${record.id})\n\n` : ""}${sources ? `Sources: ${sources}\n\n` : ""}^${record.id}\n<!-- /memory:${record.id} -->\n`;
}

export function replaceMemoryBlock(
  current: string,
  id: string,
  next: string,
): string {
  const matches = noteBlocks(current).filter((block) => block.id === id);
  if (matches.length > 1) throw new Error(`Duplicate memory anchor: ${id}`);
  const block = matches[0];
  if (!block) return next ? `${current.trimEnd()}\n\n${next}` : current;
  return current.slice(0, block.start) + next + current.slice(block.end);
}

export function handwrittenText(content: string): string {
  let text = content;
  for (const block of noteBlocks(content).reverse())
    text = text.slice(0, block.start) + text.slice(block.end);
  return text
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, "")
    .replace(/^# [^\n]*\n/u, "")
    .trim();
}
