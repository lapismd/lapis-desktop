// SPDX-License-Identifier: Apache-2.0
import type { ConversationRepository } from "../../../../src/lib/ai/conversations/conversation-repository.ts";
export const files = {
  "Notes/Welcome.md": "# Welcome\n\nA note beside the retained AI panel.\n",
  "Notes/.agents/skills/daily/SKILL.md":
    "---\nname: daily\ndescription: Daily notes\n---\nDaily skill body.\n",
  "Notes/.agents/commands/review.md":
    "---\ndescription: Review notes\n---\nReview $ARGUMENTS.\n",
};
export async function seedConversations(
  repository: ConversationRepository,
): Promise<void> {
  for (const [index, scopeDir, title, archived] of [
    [1, "Notes", "Summarize project notes", false],
    [2, "Notes", "Archived planning chat", true],
    [3, "Projects/Atlas", "Fix parser errors", false],
    [4, "", "Plan vault release", false],
  ] as const) {
    const snapshot = await repository.create({
      scopeDir,
      id: `${index}23e4567-e89b-42d3-a456-426614174000`,
      now: "2026-08-16T10:00:00.000Z",
    });
    await repository.appendTranscript(snapshot.location, [
      {
        schemaVersion: 1,
        id: `m${index}`,
        type: "message",
        role: "user",
        text: title,
        createdAt: "2026-08-16T10:00:00.000Z",
      },
    ]);
    if (archived) await repository.archive(snapshot.location);
  }
}
