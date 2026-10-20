import { normalizeConversationScope } from "./paths.ts";
import { CONVERSATION_ID_PATTERN, type ConversationLocation } from "./types.ts";

export type ConversationRoute = {
  version: 1;
  backend: "vault-files";
  location: ConversationLocation;
};
export function retiredNativeRoute(state: Record<string, unknown>): boolean {
  const route = state.conversationRoute;
  return Boolean(
    route &&
      typeof route === "object" &&
      (route as { backend?: unknown }).backend === "jj",
  );
}
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
  if (retiredNativeRoute(state)) return null;
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
  return (
    a.backend === "vault-files" &&
    b.backend === "vault-files" &&
    a.location.scopeDir === b.location.scopeDir &&
    a.location.conversationId === b.location.conversationId
  );
}
