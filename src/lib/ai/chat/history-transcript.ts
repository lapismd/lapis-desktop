import type { TranscriptItem } from "@lapismd/design-core/chat";
import type { AiTurnRecord } from "../../repository/ai-history.ts";
import type { AiChatItem } from "./chat-items.ts";

/** Insert immutable comparisons after the last retained row of their turn. */
export function historyTranscript(
  items: readonly TranscriptItem[],
  records: readonly AiTurnRecord[],
  source: readonly AiChatItem[] = [],
): TranscriptItem[] {
  const bindings = new Map(
    source.map((item) => [item.id, item.agentBindingId]),
  );
  const originals = new Map(source.map((item) => [item.id, item]));
  const after = new Map<number, AiTurnRecord[]>();
  for (const record of records) {
    if (record.phase === "running") continue;
    let index = -1;
    let participantIndex = -1;
    items.forEach((item, position) => {
      if (item.turn?.id === record.context.message) {
        index = position;
        const binding =
          bindings.get(item.id) ?? bindings.get(item.tools?.at(-1)?.id ?? "");
        if (binding && binding === record.context.binding)
          participantIndex = position;
      }
    });
    if (participantIndex >= 0) index = participantIndex;
    const commandIndex = items.findIndex(
      (item) =>
        item.id === record.context.message ||
        item.tools?.some((tool) => tool.id === record.context.message),
    );
    const anchor = record.context.message
      ? originals.get(record.context.message)
      : undefined;
    if (commandIndex >= 0 && anchor && anchor.type !== "message") {
      index = commandIndex;
      for (let next = commandIndex + 1; next < items.length; next++) {
        const row = originals.get(items[next]!.id);
        if (
          row?.type === "command" ||
          row?.type === "skill-activation" ||
          (row?.type === "message" && row.role === "user")
        )
          break;
        index = next;
      }
    }
    if (index < 0) index = items.length - 1;
    after.set(index, [...(after.get(index) ?? []), record]);
  }
  const row = (record: AiTurnRecord): TranscriptItem => ({
    id: `history/${record.context.turn}`,
    kind: "context",
    label: "Saved file changes",
    defaultExpanded: true,
    blocks: [
      {
        id: `history/${record.context.turn}`,
        revision: record.after?.commit ?? "incomplete",
        kind: "custom",
        text: "",
        label: "Saved file changes",
        commentable: false,
      },
    ],
  });
  return [
    ...(after.get(-1) ?? []).map(row),
    ...items.flatMap((item, index) => [
      item,
      ...(after.get(index) ?? []).map(row),
    ]),
  ];
}
