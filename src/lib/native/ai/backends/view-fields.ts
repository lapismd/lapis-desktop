import type { NativeCollabRef } from "../../../ai/conversations/native-view.ts";
import { fields, integer } from "./record-fields.ts";
import * as wire from "./wire.ts";

export function collabRef(value: unknown, kind?: string): NativeCollabRef {
  const v = fields(value, ["kind", "id"]);
  const kinds = [
    "index_page",
    "thread_version",
    "conversation_metadata",
    "thread_event",
    "human_message_revision",
    "thread_link",
    "reaction",
    "reaction_retraction",
    "reaction_slot",
    "custom_emoji_version",
    "image_asset",
  ];
  if (
    typeof v.kind !== "string" ||
    !kinds.includes(v.kind) ||
    (kind && v.kind !== kind) ||
    typeof v.id !== "string" ||
    !/^[a-f0-9]{64}$/u.test(v.id)
  )
    return wire.invalid();
  return { kind: v.kind, id: v.id };
}
export function acceptedMillis(value: unknown): bigint {
  const millis = integer(value, true);
  if (millis < 0n) return wire.invalid();
  return millis;
}
export function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") return wire.invalid();
  return value;
}
