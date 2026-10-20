import type {
  CanonicalConversationIdentity,
  CanonicalConversationPage,
  CanonicalConversationSummary,
} from "./backend-port.ts";

export function nativeConversationTargetKey(
  value: CanonicalConversationIdentity,
): string {
  return JSON.stringify([
    value.target.type,
    value.target.type === "conversation"
      ? value.target.id
      : value.target.session,
  ]);
}
export function sameCanonicalConversation(
  a: CanonicalConversationIdentity,
  b: CanonicalConversationIdentity,
): boolean {
  return (
    a.threadId === b.threadId &&
    a.repository === b.repository &&
    nativeConversationTargetKey(a) === nativeConversationTargetKey(b)
  );
}
export type CatalogPageState = Pick<
  CanonicalConversationPage,
  "repository" | "selection" | "nextCursor"
> & {
  conversations: CanonicalConversationSummary[];
};
/** A continuation may extend only the same committed native selection. */
export function extendCanonicalCatalog(
  previous: CatalogPageState,
  page: CanonicalConversationPage,
): CatalogPageState {
  if (
    previous.repository !== page.repository ||
    JSON.stringify(previous.selection) !== JSON.stringify(page.selection)
  )
    throw new Error(
      "Conversation catalog changed. Refresh to read the current selection.",
    );
  const threads = new Set(previous.conversations.map((row) => row.threadId));
  const targets = new Set(
    previous.conversations.map(nativeConversationTargetKey),
  );
  for (const row of page.conversations) {
    if (
      row.repository !== previous.repository ||
      threads.has(row.threadId) ||
      targets.has(nativeConversationTargetKey(row))
    )
      throw new Error("Conversation catalog returned conflicting membership");
    threads.add(row.threadId);
    targets.add(nativeConversationTargetKey(row));
  }
  if (threads.size > 4096)
    throw new Error("Conversation catalog limit exceeded");
  return {
    repository: previous.repository,
    selection: [...previous.selection],
    conversations: [...previous.conversations, ...page.conversations],
    nextCursor: page.nextCursor,
  };
}
