import type {
  BackendSelection,
  BackendSelectionReceipt,
  PreparedConversation,
} from "../../../ai/conversations/backend-port.ts";

const bytes = (text: string) => new TextEncoder().encode(text).byteLength;
export function invalid(): never {
  throw new Error("Invalid native conversation frame");
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid();
  return value as Record<string, unknown>;
}
export function id(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f0-9]{32}$/u.test(value))
    return invalid();
  return value;
}
export function handle(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/u.test(
      value,
    )
  )
    return invalid();
  return value;
}
export function revision(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 0xffffffff
  )
    return invalid();
  return value;
}
export function selection(value: unknown): BackendSelection {
  const v = record(value);
  if (v.backend !== "vault-files" && v.backend !== "jj") return invalid();
  return { backend: v.backend, revision: revision(v.revision) };
}
export function receipt(
  value: unknown,
  request: string,
): BackendSelectionReceipt | null {
  if (value === null) return null;
  const v = record(value);
  if (id(v.request_id) !== request) return invalid();
  const result = {
    request_id: request,
    expected_revision: revision(v.expected_revision),
    selection: selection(v.selection),
  };
  if (result.selection.revision !== result.expected_revision + 1)
    return invalid();
  return result;
}
export function text(value: unknown, maximum = 2 * 1024 * 1024): string {
  if (typeof value !== "string" || bytes(value) > maximum) return invalid();
  return value;
}
export function prepared(
  value: unknown,
  request: string,
): PreparedConversation | null {
  if (value === null) return null;
  const v = record(value);
  if (id(v.requestId) !== request) return invalid();
  return {
    requestId: request,
    conversationId: handle(v.conversationId),
    threadId: id(v.threadId),
    repository: v.repository === null ? null : id(v.repository),
    receipt: v.receipt === null ? null : text(v.receipt),
  };
}
export function request(
  session: string,
  operation: Record<string, unknown>,
): string {
  if (typeof session !== "string" || !session || bytes(session) > 128)
    return invalid();
  const value = JSON.stringify({ version: 1, sessionId: session, operation });
  const maximum =
    operation.type === "appendConversationMessage" ||
    operation.type === "appendCanonicalConversationMessage"
      ? 1024 * 1024
      : operation.type === "beginCanonicalDispatch"
        ? 8 * 1024
        : 4096;
  if (bytes(value) > maximum) return invalid();
  return value;
}
export function response(frame: string, kind: string): unknown {
  text(frame, 8 * 1024 * 1024);
  let v: Record<string, unknown>;
  try {
    v = record(JSON.parse(frame));
  } catch {
    return invalid();
  }
  if (v.version !== 1) return invalid();
  const data = record(v.data);
  if (data.type !== kind) return invalid();
  return data.data;
}

export type NativeBackendCall = (
  kind: string,
  operation: Record<string, unknown>,
) => Promise<unknown>;
export function openedRead(value: unknown) {
  if (value === null) return null;
  const v = record(value);
  return { handle: handle(v.handle), snapshot: text(v.snapshot) };
}
export function byteSelection(value: unknown): number[] {
  if (
    !Array.isArray(value) ||
    value.length > 256 ||
    value.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
  )
    return invalid();
  return [...value];
}
