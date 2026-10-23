import type {
  TranscriptBlock,
  TranscriptItem,
} from "@lapismd/design-core/chat";
import type { TranscriptEntry } from "../conversations/types.ts";
import { projectTranscriptToChatItems } from "../conversations/transcript-to-chat.ts";
import {
  projectAiTranscript,
  transcriptSourceItem,
} from "../chat/transcript-projection.ts";
import { isSlashCommandNotice } from "../chat/chat-items.ts";
import { previewTranscriptTool } from "../chat/transcript-tool-preview.ts";
import { importedToolBlock } from "../imports/transcript-tool-block.ts";
export function projectRecordedTranscript(
  entries: readonly TranscriptEntry[],
  options: {
    projectedItems?: readonly TranscriptItem[];
    capturedUser?: boolean;
    assistant?: { name: string; image?: string };
    inspectTools?: boolean;
  } = {},
) {
  const {
    projectedItems,
    capturedUser = true,
    assistant,
    inspectTools = false,
  } = options;
  function block(b: TranscriptBlock): TranscriptBlock {
    const item = transcriptSourceItem(b, source);
    const report =
      item && isSlashCommandNotice(item) && item.layout !== "inventory";
    return {
      ...b,
      commentable: false,
      kind: b.kind === "custom" && !report ? "code" : b.kind,
    };
  }
  const capturedTools = new Map(
    entries
      .filter((entry) => entry.type === "tool")
      .map((entry) => [entry.id, entry]),
  );
  const source = projectTranscriptToChatItems([...entries]);
  return (projectedItems ?? projectAiTranscript(source)).map((item) => ({
    ...item,
    label:
      capturedUser && item.role === "user"
        ? "Captured user message"
        : item.label,
    author:
      capturedUser && item.role === "user"
        ? { id: "captured-user", name: "Captured user", initials: "CU" }
        : item.role === "assistant" && item.author && assistant
          ? { ...item.author, name: assistant.name, image: assistant.image }
          : item.author,
    blocks: item.blocks.map(block),
    tools: item.tools?.map((t) => {
      const captured = capturedTools.get(t.id);
      const original = source.find((entry) => entry.id === t.id);
      const tool =
        inspectTools && original?.type === "tool"
          ? previewTranscriptTool(t, original, false)
          : {
              ...t,
              blocks: t.blocks.map((b) => importedToolBlock(b, captured)),
            };
      return {
        ...tool,
        commentable: false,
        blocks: tool.blocks.map(block),
        inlineBlocks: tool.inlineBlocks?.map(block),
      };
    }),
  }));
}
