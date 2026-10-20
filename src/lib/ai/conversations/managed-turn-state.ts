import type { CanonicalConversationRead } from "./backend-port.ts";
import { sameCanonicalConversation } from "./catalog-pages.ts";
import type {
  ManagedTurnRecipient,
  ManagedTurnState,
} from "./managed-turn-types.ts";

export const turnErrorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
export function assertManagedTurn(
  read: CanonicalConversationRead,
  text: string,
  recipients: readonly ManagedTurnRecipient[],
) {
  if (
    read.identity.repository === null ||
    !sameCanonicalConversation(read.identity, read.view.identity) ||
    ["archived", "tombstoned"].includes(read.view.header.status)
  )
    throw new Error("Choose a current writable native conversation");
  if (text.includes("\0") || new TextEncoder().encode(text).length > 256 * 1024)
    throw new Error("Authored message exceeds native limits");
  if (!recipients.length || recipients.length > 4)
    throw new Error("Choose between one and four native agent recipients");
  const seen = new Set<string>();
  for (const recipient of recipients) {
    const key = recipient.participant?.profileId ?? "codex";
    if (seen.has(key) || recipient.request.agent !== "codex")
      throw new Error(
        "Native recipients must be distinct admitted Codex profiles",
      );
    seen.add(key);
  }
}
export function initialManagedTurn(
  read: CanonicalConversationRead,
  text: string,
  recipients: readonly ManagedTurnRecipient[],
): ManagedTurnState {
  const requestId = crypto.randomUUID();
  return {
    requestId,
    nativeRequestId: requestId.replaceAll("-", ""),
    conversation: structuredClone(read.identity),
    phase: "idle",
    authorship: text.trim() ? "pending" : "not-required",
    cancellationRequested: false,
    deliveries: recipients.map((recipient) => ({
      id: crypto.randomUUID().replaceAll("-", ""),
      ...(recipient.participant
        ? { participant: structuredClone(recipient.participant) }
        : {}),
      phase: "pending",
    })),
  };
}
