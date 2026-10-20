import type {
  ConversationLocation,
  ConversationSnapshot,
} from "../../../../src/lib/ai/conversations/types.ts";
export function interruptedSnapshot(
  location: ConversationLocation,
): ConversationSnapshot {
  return {
    location,
    metadata: {
      schemaVersion: 1,
      id: location.conversationId,
      status: "active",
      createdAt: "2026-10-19T00:00:00.000Z",
      updatedAt: "2026-10-19T00:00:00.000Z",
      title: "An interrupted local turn",
      pendingTurn: {
        version: 1,
        id: "interrupted-turn",
        userEntryId: "original-user",
        agentBindingId: "unconfirmed-binding",
        startedAt: "2026-10-19T00:00:00.000Z",
      },
    },
    transcript: [
      {
        schemaVersion: 1,
        id: "original-user",
        type: "message",
        role: "user",
        text: "Keep this authored prompt after an interrupted session.",
        createdAt: "2026-10-19T00:00:00.000Z",
      },
    ],
    agents: [],
    warnings: [],
  };
}
