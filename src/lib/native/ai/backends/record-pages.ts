import type { NativeRecordPage } from "../../../ai/conversations/native-records.ts";
import { identity } from "./canonical-wire.ts";
import { fields, list, unique } from "./record-fields.ts";
import { recordValue } from "./record-values.ts";
import { parseNativeConversationJson } from "./json.ts";
import * as wire from "./wire.ts";

/** Sanitized JSON payloads remain text; only typed native fields are decoded. */
export function recordPage(
  text: unknown,
  cursor: string,
  afterIndex: number,
): NativeRecordPage {
  const source = wire.text(text),
    raw = wire.record(parseNativeConversationJson(source));
  const common = [
    "version",
    "selection",
    "cursor",
    "session_id",
    "after_index",
    "next_after_index",
    "records",
  ];
  let origin: NativeRecordPage["origin"];
  if (raw.version === 1) {
    fields(raw, [...common, "conversation_request_id"]);
    origin = { version: 1, requestId: wire.id(raw.conversation_request_id) };
  } else if (raw.version === 2) {
    fields(raw, [...common, "conversation"]);
    origin = { version: 2, conversation: identity(raw.conversation) };
  } else return wire.invalid();
  if (
    wire.handle(raw.cursor) !== cursor ||
    wire.revision(raw.after_index) !== afterIndex
  )
    return wire.invalid();
  const records = unique(
    list(raw.records, 16, recordValue),
    (v) => `${v.reference.kind}:${v.reference.id}`,
  );
  for (const record of records) {
    if (record.projection.type !== "observation_batch") continue;
    const batch = record.projection.value;
    if (
      batch.desktop &&
      (origin.version !== 2 ||
        batch.integration !== "owned_controller" ||
        batch.representation !== "sanitized_native" ||
        batch.desktop.threadId !== origin.conversation.threadId ||
        batch.desktop.repository !== origin.conversation.repository)
    )
      return wire.invalid();
  }
  const nextAfterIndex =
    raw.next_after_index === null ? null : wire.revision(raw.next_after_index);
  if (
    afterIndex > 65_536 ||
    afterIndex + records.length > 65_536 ||
    (nextAfterIndex !== null &&
      (!records.length || nextAfterIndex !== afterIndex + records.length))
  )
    return wire.invalid();
  return {
    source,
    origin,
    selection: wire.byteSelection(raw.selection),
    cursor,
    sessionId: wire.id(raw.session_id),
    afterIndex,
    nextAfterIndex,
    records,
  };
}
