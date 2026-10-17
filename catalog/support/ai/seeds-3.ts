// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI story fixtures.
export function createAiChatFailureSeedItems() {
  return [
    {
      id: "failed-user",
      type: "message" as const,
      role: "user" as const,
      text: "Summarize the release notes",
      createdAt: "2026-03-16T09:00:00.000Z",
    },
    {
      id: "failed-response",
      type: "error" as const,
      text: "The agent connection closed before the response completed.",
      createdAt: "2026-03-16T09:00:01.000Z",
    },
  ];
}

export function createAiChatScrollSeedItems() {
  const yesterday = new Date("2026-03-15T10:00:00.000Z");
  const today = new Date("2026-03-16T09:00:00.000Z");
  const items = [];
  for (let index = 0; index < 8; index += 1) {
    const createdAt = new Date(
      yesterday.getTime() + index * 60_000,
    ).toISOString();
    items.push({
      id: `user-y-${index}`,
      type: "message" as const,
      role: "user" as const,
      text: `Yesterday prompt ${index + 1}`,
      createdAt,
    });
    items.push({
      id: `asst-y-${index}`,
      type: "message" as const,
      role: "assistant" as const,
      text: `Yesterday reply ${index + 1}`,
      createdAt,
    });
  }
  for (let index = 0; index < 6; index += 1) {
    const createdAt = new Date(today.getTime() + index * 60_000).toISOString();
    items.push({
      id: `user-t-${index}`,
      type: "message" as const,
      role: "user" as const,
      text: `Today prompt ${index + 1}`,
      createdAt,
    });
    items.push({
      id: `asst-t-${index}`,
      type: "message" as const,
      role: "assistant" as const,
      text: index === 5 ? "Latest seeded message" : `Today reply ${index + 1}`,
      createdAt,
    });
  }
  return items;
}
