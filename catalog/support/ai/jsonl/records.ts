// SPDX-License-Identifier: Apache-2.0
export const time = "2026-08-27T09:00:00.000Z";
export function lines(records: unknown[]): string {
  return records.map((record) => JSON.stringify(record)).join("\n") + "\n";
}
export const transcript = lines([
  {
    schemaVersion: 1,
    id: "u1",
    type: "message",
    role: "user",
    text: "Summarize @[[Notes/Welcome.md]]",
    createdAt: time,
  },
  {
    schemaVersion: 1,
    id: "t1",
    type: "thinking.summary",
    kind: "summary",
    text: "I checked the project notes.",
    createdAt: time,
  },
  {
    schemaVersion: 1,
    id: "tool1",
    type: "tool",
    toolId: "search1",
    name: "notes_search",
    state: "completed",
    input: '{"query":"project"}',
    output: '{"results":["Project.md"]}',
    createdAt: time,
  },
  {
    schemaVersion: 1,
    id: "a1",
    type: "message",
    role: "assistant",
    text: "The vault has **one active project**.",
    createdAt: time,
  },
]);
export const agents = lines([
  {
    schemaVersion: 1,
    type: "binding.created",
    id: "b1",
    createdAt: time,
    runtime: "acp",
    agent: "codex",
    model: { provider: "codex", model: "fixture-model" },
  },
  {
    schemaVersion: 1,
    type: "usage.updated",
    id: "usage1",
    createdAt: time,
    agentBindingId: "b1",
    usage: { used: 1200, limit: 128000 },
  },
  {
    schemaVersion: 3,
    type: "handoff.summary.created",
    id: "handoff1",
    createdAt: time,
    conversationId: "123e4567-e89b-42d3-a456-426614174000",
    fromEntryId: "u1",
    throughEntryId: "a1",
    sourceHash: "a".repeat(64),
    summary:
      "## Saved context\n\n- Retain the **release plan**.\n- Review the remaining work before continuing.",
    processor: { runtime: "acp", agent: "codex", model: "fixture-model" },
    estimatedTokens: 30,
  },
]);

export const largeTranscript =
  transcript +
  lines([
    {
      schemaVersion: 1,
      id: "read-plan",
      type: "tool",
      toolId: "read-plan",
      name: "read_file",
      state: "completed",
      input: JSON.stringify({ path: "Notes/Plan.md" }),
      output:
        "# Release plan\n\n- [x] Save local transcripts\n- [ ] Review the release\n\n| Area | Status |\n| --- | --- |\n| Chat | Ready |\n| History | Review |",
      createdAt: time,
    },
    {
      schemaVersion: 1,
      id: "review",
      type: "message",
      role: "assistant",
      text:
        'The plan keeps the saved session local.\n\n```ts\nexport function summarize(records: readonly string[]) {\n  return records.filter(Boolean).join("\\n");\n}\n```\n\n```diff\n--- a/plan.md\n+++ b/plan.md\n@@ -1 +1 @@\n- Pending\n+ Ready for review\n```\n\n' +
        Array.from(
          { length: 24 },
          (_, index) =>
            `Review item ${index + 1}: retain captured source and explicit user actions.`,
        ).join("\n\n"),
      createdAt: time,
    },
  ]);
