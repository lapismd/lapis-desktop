import { createAppToolPatchPendingSeedItems } from "./seeds-1.ts";
// SPDX-License-Identifier: Apache-2.0
// Retained Lapis AI story fixtures.
export function createAppToolSessionGrantSeedItems() {
  return [
    {
      ...createAppToolPatchPendingSeedItems()[1]!,
      status: "approved" as const,
      responseOptionId: "allow-session",
    },
    {
      id: "app-patch-call-1",
      type: "tool" as const,
      toolId: "app-patch-call-1",
      name: "edit",
      server: "lapis-tools",
      state: "completed" as const,
      input: '{"path":"Notes/alpha.md"}',
      output: '{"path":"Notes/alpha.md","replacements":1}',
      createdAt: "2026-08-17T09:05:02.000Z",
      agentBindingId: "binding-codex",
    },
    {
      id: "app-patch-call-2",
      type: "tool" as const,
      toolId: "app-patch-call-2",
      name: "edit",
      server: "lapis-tools",
      state: "completed" as const,
      input: '{"path":"Notes/beta.md"}',
      output: '{"path":"Notes/beta.md","replacements":1}',
      createdAt: "2026-08-17T09:06:00.000Z",
      agentBindingId: "binding-codex",
    },
  ];
}

export function createNotesSearchSeedItems() {
  return [
    {
      id: "search-user",
      type: "message" as const,
      role: "user" as const,
      text: "/search OAuth",
      createdAt: "2026-08-19T10:00:00.000Z",
    },
    {
      id: "search-tool",
      type: "tool" as const,
      toolId: "search-tool",
      name: "notes_search",
      server: "lapis-tools",
      state: "completed" as const,
      input: '{"query":"OAuth"}',
      output: JSON.stringify({
        content: [{ type: "text", text: "1 match" }],
        structuredContent: {
          results: [
            {
              path: "Projects/auth.md",
              score: 1,
              snippets: [{ text: "OAuth tokens", offset: 0 }],
            },
          ],
        },
      }),
      createdAt: "2026-08-19T10:00:01.000Z",
    },
  ];
}
