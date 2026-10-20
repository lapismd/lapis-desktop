import type { CanonicalConversationIdentity } from "./backend-port.ts";
import { sameCanonicalConversation } from "./catalog-pages.ts";
import { normalizeConversationScope } from "./paths.ts";
import { CONVERSATION_ID_PATTERN, type ConversationLocation } from "./types.ts";

export type NativeConversationReference = CanonicalConversationIdentity & {
  repository: string;
};
/** Persist references only. Handles, selections and transcripts never enter tab state. */
export type ConversationRoute =
  | { version: 1; backend: "vault-files"; location: ConversationLocation }
  | { version: 1; backend: "jj"; conversation: NativeConversationReference };
function invalid(): never {
  throw new Error("Invalid conversation route");
}
function fields(value: unknown, keys: readonly string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid();
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(record, key))
  )
    return invalid();
  return record;
}
function id(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f0-9]{32}$/u.test(value))
    return invalid();
  return value;
}
export function nativeConversationReference(
  value: unknown,
): NativeConversationReference {
  const v = fields(value, ["target", "threadId", "repository"]);
  const t = v.target as Record<string, unknown> | null;
  if (!t || typeof t !== "object" || Array.isArray(t)) return invalid();
  let target: CanonicalConversationIdentity["target"];
  if (t.type === "conversation") {
    fields(t, ["type", "id"]);
    if (
      typeof t.id !== "string" ||
      !t.id.trim() ||
      new TextEncoder().encode(t.id).length > 512 ||
      /[\u0000-\u001f\u007f-\u009f]/u.test(t.id)
    )
      return invalid();
    target = { type: "conversation", id: t.id };
  } else if (t.type === "recorded") {
    fields(t, ["type", "session"]);
    target = { type: "recorded", session: id(t.session) };
  } else return invalid();
  return { target, threadId: id(v.threadId), repository: id(v.repository) };
}
export function fileConversationLocation(value: unknown): ConversationLocation {
  const v = fields(value, ["scopeDir", "conversationId"]);
  if (
    typeof v.scopeDir !== "string" ||
    normalizeConversationScope(v.scopeDir) !== v.scopeDir ||
    typeof v.conversationId !== "string" ||
    !CONVERSATION_ID_PATTERN.test(v.conversationId)
  )
    return invalid();
  return { scopeDir: v.scopeDir, conversationId: v.conversationId };
}
export function conversationRoute(value: unknown): ConversationRoute {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid();
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return invalid();
  if (v.backend === "jj") {
    fields(v, ["version", "backend", "conversation"]);
    return {
      version: 1,
      backend: "jj",
      conversation: nativeConversationReference(v.conversation),
    };
  }
  if (v.backend === "vault-files") {
    fields(v, ["version", "backend", "location"]);
    return {
      version: 1,
      backend: "vault-files",
      location: fileConversationLocation(v.location),
    };
  }
  return invalid();
}
export function conversationRouteFromState(
  state: Record<string, unknown>,
): ConversationRoute | null {
  if (Object.hasOwn(state, "conversationRoute")) {
    if (
      Object.hasOwn(state, "scopeDir") ||
      Object.hasOwn(state, "conversationId")
    )
      return invalid();
    return conversationRoute(state.conversationRoute);
  }
  const scope = Object.hasOwn(state, "scopeDir"),
    key = Object.hasOwn(state, "conversationId");
  if (!scope && !key) return null;
  if (!scope || !key) return invalid();
  return {
    version: 1,
    backend: "vault-files",
    location: fileConversationLocation({
      scopeDir: state.scopeDir,
      conversationId: state.conversationId,
    }),
  };
}
export function stateWithConversationRoute(
  state: Record<string, unknown>,
  route: ConversationRoute | null,
) {
  const next = { ...state };
  delete next.scopeDir;
  delete next.conversationId;
  delete next.conversationRoute;
  if (route) next.conversationRoute = conversationRoute(route);
  return next;
}
export function sameConversationRoute(
  a: ConversationRoute | null,
  b: ConversationRoute | null,
): boolean {
  if (!a || !b) return a === b;
  if (a.backend === "jj" && b.backend === "jj")
    return sameCanonicalConversation(a.conversation, b.conversation);
  return (
    a.backend === "vault-files" &&
    b.backend === "vault-files" &&
    a.location.scopeDir === b.location.scopeDir &&
    a.location.conversationId === b.location.conversationId
  );
}
