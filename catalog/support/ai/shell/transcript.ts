// SPDX-License-Identifier: Apache-2.0
// Retained lapis-plugins ee20d366 shell fixtures; see src/lib/ai/NOTICE.md.
import { message } from "./records.ts";
import type { ShellScenario } from "./types.ts";
export function transcriptRecords(scenario: ShellScenario) {
  return scenario === "registry-chat" || scenario === "registry-overview"
    ? [
        message(
          "registry-user",
          "user",
          "Summarize this note and identify the next action.",
          "binding-codex",
        ),
        {
          schemaVersion: 1,
          id: "registry-thinking",
          type: "thinking.summary",
          kind: "summary",
          text: "I inspected the active note and its linked project context.",
          createdAt: "2026-08-16T09:01:30.000Z",
          agentBindingId: "binding-codex",
        },
        {
          schemaVersion: 1,
          id: "registry-tool",
          type: "tool",
          toolId: "registry-vault-read",
          name: "vault.read",
          state: "completed",
          input: JSON.stringify({ path: "Notes/Welcome.md" }),
          output: JSON.stringify({ content: "Ask the AI chat." }),
          createdAt: "2026-08-16T09:01:45.000Z",
          agentBindingId: "binding-codex",
        },
        message(
          "registry-assistant",
          "assistant",
          "## Summary\n\nThe welcome note introduces the in-workspace AI flow. Next, connect the first project note and review its open TODO.",
          "binding-codex",
        ),
      ]
    : scenario === "jsonl-preview"
      ? [
          message(
            "preview-user",
            "user",
            "Summarize the preview log",
            "binding-codex",
          ),
          {
            schemaVersion: 1,
            id: "preview-thinking",
            type: "thinking.summary",
            kind: "summary",
            text: "I inspected the indexed project notes.",
            createdAt: "2026-08-16T09:01:30.000Z",
            agentBindingId: "binding-codex",
          },
          {
            schemaVersion: 1,
            id: "preview-tool",
            type: "tool",
            toolId: "preview-notes-search",
            name: "notes_search",
            state: "completed",
            input: JSON.stringify({ query: "project" }),
            output: JSON.stringify({ results: ["Notes/alpha.md"] }),
            createdAt: "2026-08-16T09:01:45.000Z",
            agentBindingId: "binding-codex",
          },
          message(
            "preview-assistant",
            "assistant",
            "Preview **rendering** is ready.",
            "binding-codex",
          ),
        ]
      : scenario === "agent-switching"
        ? [
            message("user-1", "user", "Review the note", "binding-codex"),
            message(
              "assistant-1",
              "assistant",
              "Codex reviewed the project note.",
              "binding-codex",
            ),
            {
              schemaVersion: 3,
              id: "switch-1",
              type: "agent.switch",
              createdAt: "2026-08-16T09:02:00.000Z",
              agentBindingId: "binding-cursor",
              fromBindingId: "binding-codex",
              toBindingId: "binding-cursor",
              handoffId: "handoff-codex-to-cursor",
              handoffMode: "full",
              handoffThroughEntryId: "assistant-1",
              omittedEntryCount: 0,
            },
            message("user-2", "user", "Continue with Cursor", "binding-cursor"),
            message(
              "assistant-2",
              "assistant",
              "Cursor continued in the same local conversation.",
              "binding-cursor",
            ),
            {
              schemaVersion: 3,
              id: "switch-2",
              type: "agent.switch",
              createdAt: "2026-08-16T09:04:00.000Z",
              agentBindingId: "binding-codex",
              fromBindingId: "binding-cursor",
              toBindingId: "binding-codex",
              handoffId: "handoff-cursor-to-codex",
              handoffMode: "delta",
              handoffThroughEntryId: "assistant-2",
              omittedEntryCount: 0,
            },
            {
              schemaVersion: 3,
              id: "agent-config-1",
              type: "agent.config",
              createdAt: "2026-08-16T09:04:30.000Z",
              agentBindingId: "binding-codex",
              model: { provider: "codex", model: "gpt-5.6-terra" },
            },
            message("user-3", "user", "Finish back in Codex", "binding-codex"),
            message(
              "assistant-3",
              "assistant",
              "Codex resumed its original binding with the Cursor delta.",
              "binding-codex",
            ),
          ]
        : [
            message("user-1", "user", "Summarize the project", "binding-codex"),
            message(
              "assistant-1",
              "assistant",
              "The project has one welcome note and one TODO.",
              "binding-codex",
            ),
          ];
}
