import type {
  NativePayload,
  NativeRecordKind,
  NativeRecordRef,
} from "../../../ai/conversations/native-records.ts";
import * as wire from "./wire.ts";

export function fields(value: unknown, keys: readonly string[]) {
  const v = wire.record(value);
  if (
    Object.keys(v).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(v, key))
  )
    return wire.invalid();
  return v;
}
export function choice<const T extends readonly string[]>(
  value: unknown,
  values: T,
): T[number] {
  if (typeof value !== "string" || !values.includes(value))
    return wire.invalid();
  return value as T[number];
}
export function list<T>(
  value: unknown,
  maximum: number,
  decode: (v: unknown) => T,
): T[] {
  if (!Array.isArray(value) || value.length > maximum) return wire.invalid();
  return value.map(decode);
}
export function nullable<T>(
  value: unknown,
  decode: (v: unknown) => T,
): T | null {
  return value === null ? null : decode(value);
}
export function integer(value: unknown, signed = false): bigint {
  if (
    typeof value !== "bigint" &&
    (typeof value !== "number" || !Number.isSafeInteger(value))
  )
    return wire.invalid();
  const n = BigInt(value as bigint | number);
  if (
    signed
      ? n < -0x8000000000000000n || n > 0x7fffffffffffffffn
      : n < 0n || n > 0xffffffffffffffffn
  )
    return wire.invalid();
  return n;
}
export function label(value: unknown, max: number) {
  const result = wire.text(value, max);
  if (!result || /[\u0000-\u001f\u007f-\u009f]/u.test(result))
    return wire.invalid();
  return result;
}
export function schema(value: unknown): 1 {
  if (value !== 1) return wire.invalid();
  return 1;
}
export function reference(
  value: unknown,
  expected?: NativeRecordKind,
): NativeRecordRef {
  const v = fields(value, ["kind", "id"]);
  const kind = choice(v.kind, [
    "event_batch",
    "tool_snapshot",
    "observation_batch",
    "content",
  ]);
  if (
    (expected && kind !== expected) ||
    typeof v.id !== "string" ||
    !/^[0-9a-f]{64}$/u.test(v.id)
  )
    return wire.invalid();
  return { kind, id: v.id };
}
export function payload(value: unknown): NativePayload {
  const v = fields(value, ["media_type", "text"]);
  return {
    media_type: choice(v.media_type, ["json", "text"]),
    text: wire.text(v.text, 1024 * 1024),
  };
}
export function unique<T>(values: T[], key: (value: T) => string): T[] {
  if (new Set(values.map(key)).size !== values.length) return wire.invalid();
  return values;
}
export const sessionStates = [
  "discovered",
  "active",
  "idle",
  "ended",
  "unknown",
] as const;
export const toolStates = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "interrupted",
  "skipped",
  "unknown",
] as const;
export const integrations = [
  "codex",
  "cursor",
  "open_code",
  "owned_controller",
] as const;
