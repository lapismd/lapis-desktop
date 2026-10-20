import type {
  CanonicalConversationIdentity,
  CanonicalConversationPage,
  CanonicalConversationEditWrite,
  CanonicalConversationSummary,
  CanonicalConversationRead,
} from "../../../ai/conversations/backend-port.ts";
import * as wire from "./wire.ts";
import { parseNativeConversationJson } from "./json.ts";
import { recordSources } from "./record-sources.ts";
import { conversationView } from "./view.ts";

export function identity(value: unknown): CanonicalConversationIdentity {
  const v = wire.record(value),
    target = wire.record(v.target);
  let canonical: CanonicalConversationIdentity["target"];
  if (target.type === "conversation") {
    const id = wire.text(target.id, 512);
    if (!id.trim() || /[\u0000-\u001f\u007f-\u009f]/u.test(id))
      return wire.invalid();
    canonical = { type: "conversation", id };
  } else if (target.type === "recorded")
    canonical = { type: "recorded", session: wire.id(target.session) };
  else return wire.invalid();
  return {
    target: canonical,
    threadId: wire.id(v.threadId),
    repository: v.repository === null ? null : wire.id(v.repository),
  };
}

export function openedCanonicalRead(
  value: unknown,
  threadId: string,
): CanonicalConversationRead | null {
  const opened = wire.openedRead(value);
  if (!opened) return null;
  const view = wire.record(parseNativeConversationJson(opened.snapshot));
  const owner = identity(view.conversation);
  const thread = wire.record(view.thread);
  if (
    view.version !== 2 ||
    owner.threadId !== threadId ||
    wire.id(thread.thread_id) !== threadId
  )
    return wire.invalid();
  return {
    ...opened,
    identity: owner,
    selection: wire.byteSelection(view.selection),
    recordSources: recordSources(view.sessions, threadId),
    view: conversationView(view, owner),
  };
}
function millis(value: unknown): bigint {
  if (
    typeof value !== "bigint" &&
    (typeof value !== "number" || !Number.isSafeInteger(value))
  )
    return wire.invalid();
  const n = BigInt(value as bigint | number);
  if (n < -0x8000000000000000n || n > 0x7fffffffffffffffn)
    return wire.invalid();
  return n;
}
export function catalog(text: unknown): CanonicalConversationPage {
  const v = wire.record(parseNativeConversationJson(wire.text(text)));
  if (
    v.version !== 1 ||
    !Array.isArray(v.conversations) ||
    v.conversations.length > 32
  )
    return wire.invalid();
  const repository = v.repository === null ? null : wire.id(v.repository);
  const seen = new Set<string>(),
    targets = new Set<string>();
  const conversations = v.conversations.map(
    (value): CanonicalConversationSummary => {
      const row = wire.record(value),
        owner = identity(row),
        target = JSON.stringify(owner.target);
      if (
        owner.repository !== repository ||
        seen.has(owner.threadId) ||
        targets.has(target) ||
        !["created", "active", "idle", "archived"].includes(String(row.status))
      )
        return wire.invalid();
      seen.add(owner.threadId);
      targets.add(target);
      return {
        ...owner,
        title: wire.text(row.title, 1024),
        status: row.status as CanonicalConversationSummary["status"],
        createdAtMillis: millis(row.createdAtMillis),
        updatedAtMillis: millis(row.updatedAtMillis),
      };
    },
  );
  const selection = wire.byteSelection(v.selection);
  const nextCursor =
    v.nextCursor === null ? null : wire.text(v.nextCursor, 2048);
  if (nextCursor === "" || (nextCursor !== null && !conversations.length))
    return wire.invalid();
  return { version: 1, repository, selection, conversations, nextCursor };
}
export function editWrite(
  value: unknown,
  requestId: string,
  threadId: string,
): CanonicalConversationEditWrite | null {
  if (value === null) return null;
  const v = wire.record(value),
    conversation = identity(v.conversation);
  if (wire.id(v.requestId) !== requestId || conversation.threadId !== threadId)
    return wire.invalid();
  return {
    requestId,
    conversation,
    receipt: v.receipt === null ? null : wire.text(v.receipt),
  };
}
