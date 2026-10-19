// SPDX-License-Identifier: Apache-2.0
import type { TranscriptBlock } from "@lapismd/design-core/chat";
import type { TranscriptEntry } from "../conversations/types.ts";
import { parseToolResultPayload } from "../chat/chat-result-views.ts";

/** Display-only file metadata; this never reads a file or changes its capture. */
export function importedToolBlock(
  block: TranscriptBlock,
  tool?: Extract<TranscriptEntry, { type: "tool" }>,
): TranscriptBlock {
  const readonly = {
    ...block,
    commentable: false,
    kind: block.kind === "custom" ? ("code" as const) : block.kind,
  };
  if (!tool || tool.output === undefined) return readonly;
  const name = tool.name.toLowerCase().replace(/[-_]/g, "");
  if (!["read", "readfile", "openfile"].includes(name)) return readonly;
  const input = parseToolResultPayload(tool.input);
  if (!input || typeof input !== "object" || Array.isArray(input))
    return readonly;
  const fields = input as Record<string, unknown>;
  const path = fields.path ?? fields.file_path ?? fields.filePath;
  if (typeof path !== "string" || !path.trim()) return readonly;
  return {
    ...readonly,
    path,
    label: path,
    lineNumbered: /^\s*\d+\t/u.test(block.text),
  };
}
