import {
  CONVERSATION_SCHEMA_VERSION,
  type TranscriptEntry,
  type ConversationSnapshot,
} from "./types.ts";
import {
  record,
  requiredString,
  assertTimestamp,
} from "./validation-fields.ts";

export type ConversationTurnIntent = {
  version: 1;
  id: string;
  userEntryId: string;
  agentBindingId: string;
  startedAt: string;
};

export function validateTurnIntent(value: unknown): ConversationTurnIntent {
  const data = record(value, "Pending conversation turn");
  if (
    data.version !== 1 ||
    Object.keys(data).some(
      (key) =>
        ![
          "version",
          "id",
          "userEntryId",
          "agentBindingId",
          "startedAt",
        ].includes(key),
    )
  )
    throw new Error("Pending conversation turn format is unsupported");
  for (const key of ["id", "userEntryId", "agentBindingId"]) {
    if (requiredString(data, key, "Pending conversation turn").length > 512)
      throw new Error("Pending conversation turn identity exceeds its limit");
  }
  assertTimestamp(data, "startedAt", "Pending conversation turn");
  return data as ConversationTurnIntent;
}

export function unknownTurnEntry(
  intent: ConversationTurnIntent,
): Extract<TranscriptEntry, { type: "error" }> {
  return {
    schemaVersion: CONVERSATION_SCHEMA_VERSION,
    id: `turn-unknown:${intent.id}`,
    parentId: intent.userEntryId,
    type: "error",
    agentBindingId: intent.agentBindingId,
    createdAt: intent.startedAt,
    retryable: false,
    message:
      "The previous turn's outcome is unknown. It has not been replayed. Send a new message to continue.",
    provenance: { originClass: "system", sourceKind: "app-system" },
  };
}

export function hasUnknownTurnEntry(
  snapshot: ConversationSnapshot,
  intent: ConversationTurnIntent,
): boolean {
  const user = snapshot.transcript.findIndex(
    (entry) => entry.id === intent.userEntryId,
  );
  return (
    user >= 0 &&
    snapshot.transcript
      .slice(user + 1)
      .some(
        (entry) =>
          entry.id === `turn-unknown:${intent.id}` &&
          entry.type === "error" &&
          entry.retryable === false,
      )
  );
}
