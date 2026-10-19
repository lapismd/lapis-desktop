// SPDX-License-Identifier: Apache-2.0
import FileTextIcon from "@lucide/svelte/icons/file-text";
import type {
  TranscriptTool,
  TranscriptBlock,
} from "@lapismd/design-core/chat";
import type { AiChatToolItem } from "./chat-tool-display.ts";
import { isLocalCommandTool } from "./chat-tool-display.ts";
import { parseToolResultPayload } from "./chat-result-views.ts";

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Captured file text only. Never resolve the path against the current vault. */
function fileText(output: string): string | undefined {
  const parsed = parseToolResultPayload(output);
  if (typeof parsed === "string") return output;
  const content = record(parsed)?.content;
  if (typeof content === "string") return content;
  if (
    Array.isArray(content) &&
    content.every(
      (part) => record(part)?.type === "text" && typeof part.text === "string",
    )
  )
    return content.map((part) => part.text).join("\n");
  // A file can itself be valid JSON; retain those literal bytes when there is no text envelope.
  return output;
}

/** Retain the capture and registered views, with one application-owned inspector. */
export function previewTranscriptTool(
  tool: TranscriptTool,
  item: AiChatToolItem,
  customResult: boolean,
): TranscriptTool {
  if (isLocalCommandTool(item)) return { ...tool, detailPlacement: "inline" };
  const input = record(parseToolResultPayload(item.input));
  const path = input?.path ?? input?.file_path;
  const inspected = {
    ...tool,
    detailPlacement: "sidebar" as const,
    ...(typeof path === "string" && path.trim() ? { path } : {}),
  };
  const first = tool.blocks[0];
  if (!first || customResult) return inspected;
  const read = ["vault.read", "notes_read", "read_file", "read"].includes(
    item.name,
  );
  const content =
    read && item.state === "completed" && item.output !== undefined
      ? fileText(item.output)
      : undefined;
  if (typeof path === "string" && path.trim() && content !== undefined) {
    const block: TranscriptBlock = {
      ...first,
      kind: /\.(md|markdown|mdown)$/iu.test(path) ? "markdown" : "code",
      text: content,
      label: path,
      revision: `${first.revision}/file-preview`,
      path,
    };
    return {
      ...inspected,
      icon: FileTextIcon,
      title: `${item.name} · ${path}`,
      path,
      blocks: [block],
      inlineBlocks: [{ ...block, kind: "code" }],
    };
  }
  return {
    ...inspected,
    blocks: [
      {
        ...first,
        kind: "code",
        path: record(parseToolResultPayload(first.text))
          ? "output.json"
          : undefined,
      },
    ],
  };
}
