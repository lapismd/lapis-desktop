import type { ConversationSnapshot } from "../../../../src/lib/ai/conversations/types.ts";
import { recipientFromOption } from "../../../../src/lib/ai/conversations/recipients.ts";

export function savedRecipientSnapshot(): ConversationSnapshot {
  const now = "2026-10-19T00:00:00.000Z";
  return {
    location: {
      scopeDir: "Notes",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    },
    metadata: {
      schemaVersion: 3,
      id: "123e4567-e89b-42d3-a456-426614174000",
      title: "A saved agent review",
      createdAt: now,
      updatedAt: now,
      status: "active",
    },
    transcript: [
      {
        schemaVersion: 3,
        id: "saved-recipient-prompt",
        type: "message",
        role: "user",
        text: "Review the daily notes",
        createdAt: now,
        recipients: [
          recipientFromOption({
            id: "previous-reviewer",
            label: "Previous reviewer",
            agent: "codex",
          }),
        ],
      },
      {
        schemaVersion: 3,
        id: "saved-recipient-answer",
        type: "message",
        role: "assistant",
        text: "The earlier review is retained with its original recipient, independently of the current agent catalog.",
        createdAt: now,
      },
    ],
    agents: [],
    warnings: [],
  };
}
