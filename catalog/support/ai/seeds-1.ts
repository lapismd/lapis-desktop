// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI story fixtures.
export function createAiChatToolSeedItems(
  state: "running" | "completed" | "error",
) {
  return [
    {
      id: `tool-${state}`,
      type: "tool" as const,
      toolId: `tool-${state}`,
      name: "shell.execute",
      server: "local workspace",
      state,
      input: "pnpm --filter @lapis-notes/ai test",
      ...(state === "completed"
        ? { output: "121 tests passed" }
        : state === "error"
          ? { output: "Process exited with code 1\nFAIL ai-chat-panel.test.ts" }
          : {}),
      createdAt: "2026-03-16T09:00:00.000Z",
    },
  ];
}

export function createAppToolReadSeedItems() {
  return [
    {
      id: "app-read-user",
      type: "message" as const,
      role: "user" as const,
      text: "Read Notes/alpha.md",
      createdAt: "2026-08-17T09:00:00.000Z",
      agentBindingId: "binding-codex",
    },
    {
      id: "app-read-call",
      type: "tool" as const,
      toolId: "app-read-call",
      name: "read",
      server: "lapis-tools",
      state: "completed" as const,
      input: '{"path":"Notes/alpha.md","fromLine":1,"toLine":20}',
      output:
        '{"path":"Notes/alpha.md","content":"# Alpha\\n\\nTODO: summarize this note.","truncated":false,"revision":"sha256:8d9b"}',
      createdAt: "2026-08-17T09:00:01.000Z",
      agentBindingId: "binding-codex",
    },
    {
      id: "app-read-assistant",
      type: "message" as const,
      role: "assistant" as const,
      text: "I read the scoped note and found one TODO.",
      createdAt: "2026-08-17T09:00:02.000Z",
      agentBindingId: "binding-codex",
    },
  ];
}

export function createAppToolPatchPendingSeedItems() {
  return [
    {
      id: "app-patch-user",
      type: "message" as const,
      role: "user" as const,
      text: "Mark the Alpha TODO complete",
      createdAt: "2026-08-17T09:05:00.000Z",
      agentBindingId: "binding-codex",
    },
    {
      id: "approval-app-patch",
      type: "approval" as const,
      request: {
        id: "app-patch",
        origin: "app-tool" as const,
        kind: "write" as const,
        title: "Edit Notes/alpha.md",
        tool: {
          name: "edit",
          input: {
            path: "Notes/alpha.md",
            oldText: "TODO: summarize this note.",
            newText: "DONE: summarized this note.",
          },
        },
        options: [
          {
            id: "allow-once",
            label: "Allow once",
            kind: "allow-once" as const,
          },
          {
            id: "allow-session",
            label: "Allow for this session",
            kind: "allow-session" as const,
          },
          { id: "deny-once", label: "Deny", kind: "deny-once" as const },
        ],
        details: {
          description: "Replace exactly one current match atomically.",
          path: "Notes/alpha.md",
          diff: "--- before\nTODO: summarize this note.\n+++ after\nDONE: summarized this note.",
        },
      },
      status: "pending" as const,
      createdAt: "2026-08-17T09:05:01.000Z",
      agentBindingId: "binding-codex",
    },
  ];
}
