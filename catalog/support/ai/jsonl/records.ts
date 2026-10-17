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
]);
