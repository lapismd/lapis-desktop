// Snapshot of Design Core dae8ca42's full recorded-conversation demo, Apache-2.0.
import capture from "./design-core-reference.json";
import avatar from "./design-core-codex.svg?url";
import FileText from "@lucide/svelte/icons/file-text";
import FilePen from "@lucide/svelte/icons/file-pen";
import Terminal from "@lucide/svelte/icons/terminal";
import Search from "@lucide/svelte/icons/search";
import Wrench from "@lucide/svelte/icons/wrench";
import Folder from "@lucide/svelte/icons/folder";
import Bot from "@lucide/svelte/icons/bot";
import type {
  TranscriptItem,
  TranscriptCommentThread,
} from "@lapismd/design-core/chat";
const icons = {
  "file-text": FileText,
  "file-pen": FilePen,
  terminal: Terminal,
  search: Search,
  wrench: Wrench,
  folder: Folder,
  bot: Bot,
};
function restore(value: unknown): unknown {
  if (value === "__CODEX_AVATAR__") return avatar;
  if (Array.isArray(value)) return value.map(restore);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        key === "icon" && typeof entry === "string"
          ? icons[entry as keyof typeof icons]
          : restore(entry),
      ]),
    );
  return value;
}
export function designCoreReference() {
  return restore(capture) as {
    items: TranscriptItem[];
    threads: TranscriptCommentThread[];
  };
}

export function streamReference(items: TranscriptItem[]): TranscriptItem[] {
  return items.map((item, index) =>
    index === items.length - 1
      ? {
          ...item,
          blocks: item.blocks.map((block) =>
            block.kind === "markdown"
              ? {
                  ...block,
                  text: `${block.text}\n\nA streamed update retains the same reader.`,
                }
              : block,
          ),
        }
      : item,
  );
}

type ReferenceReaction = { emoji: string; count: number; selected: boolean };
export function toggleReferenceReaction(
  reactions: Record<string, ReferenceReaction[]>,
  target: string,
  emoji: string,
) {
  const current = reactions[target] ?? [];
  const existing = current.find((reaction) => reaction.emoji === emoji);
  return {
    ...reactions,
    [target]: existing
      ? current.map((reaction) =>
          reaction === existing
            ? {
                ...reaction,
                selected: !reaction.selected,
                count: reaction.count + (reaction.selected ? -1 : 1),
              }
            : reaction,
        )
      : [...current, { emoji, count: 1, selected: true }],
  };
}
