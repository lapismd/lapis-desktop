// SPDX-License-Identifier: Apache-2.0
// Retained lapis-plugins ee20d366 shell fixtures; see src/lib/ai/NOTICE.md.
import { binding } from "./records.ts";
import type { ShellScenario } from "./types.ts";
export function bindingRecords(scenario: ShellScenario) {
  return [
    binding("binding-codex", "codex", "gpt-5.6-sol"),
    ...(scenario === "agent-switching"
      ? [
          binding("binding-cursor", "cursor", "composer-2.5"),
          {
            schemaVersion: 3,
            type: "binding.context.updated",
            id: "context-codex-before-cursor",
            createdAt: "2026-08-16T09:01:30.000Z",
            agentBindingId: "binding-codex",
            throughEntryId: "assistant-1",
            throughEntryHash: "a".repeat(64),
            cause: "native-turn",
          },
          {
            schemaVersion: 3,
            type: "binding.context.updated",
            id: "context-cursor-before-codex",
            createdAt: "2026-08-16T09:03:30.000Z",
            agentBindingId: "binding-cursor",
            throughEntryId: "assistant-2",
            throughEntryHash: "b".repeat(64),
            cause: "handoff",
            handoffId: "handoff-codex-to-cursor",
            projectionMode: "full",
            omittedEntryCount: 0,
          },
          {
            schemaVersion: 3,
            type: "binding.config.updated",
            id: "config-codex-model",
            createdAt: "2026-08-16T09:04:30.000Z",
            agentBindingId: "binding-codex",
            model: { provider: "codex", model: "gpt-5.6-terra" },
          },
          {
            schemaVersion: 3,
            type: "binding.context.updated",
            id: "context-codex-after-cursor",
            createdAt: "2026-08-16T09:06:30.000Z",
            agentBindingId: "binding-codex",
            throughEntryId: "assistant-3",
            throughEntryHash: "c".repeat(64),
            cause: "handoff",
            handoffId: "handoff-cursor-to-codex",
            projectionMode: "delta",
            omittedEntryCount: 0,
          },
        ]
      : []),
  ];
}
