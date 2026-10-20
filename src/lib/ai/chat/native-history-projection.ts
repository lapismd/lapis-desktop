// SPDX-License-Identifier: Apache-2.0
import type { TranscriptItem } from "@lapismd/design-core/chat";
import type { NativeConversationView } from "../conversations/native-view.ts";
import { projectNativeThread } from "./native-thread-projection.ts";

/** Join only explicit native authored-revision associations; never text or time. */
export function projectNativeHistory(
  view: NativeConversationView,
  sources: readonly (readonly TranscriptItem[])[],
) {
  const authored = projectNativeThread(view);
  const groups = new Map(
    authored.map((item) => [item.id, [] as TranscriptItem[]]),
  );
  const unassociated: TranscriptItem[] = [];
  const seen = new Set(authored.map((item) => item.id));
  for (const items of sources)
    for (const item of items) {
      if (seen.has(item.id))
        throw new Error("Native history repeats an item identity");
      seen.add(item.id);
      const group = item.turn ? groups.get(item.turn.id) : undefined;
      if (group)
        group.push(
          item.role === "user"
            ? {
                ...item,
                kind: "context",
                role: undefined,
                label: "Captured prompt context",
              }
            : item,
        );
      else unassociated.push(item);
    }
  return [
    ...authored.flatMap((item) => [item, ...groups.get(item.id)!]),
    ...unassociated,
  ];
}
