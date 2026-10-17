// SPDX-License-Identifier: Apache-2.0
// Retained lapis-plugins ee20d366 shell fixtures; see src/lib/ai/NOTICE.md.
import { binding, message, conversationFiles } from "./records.ts";
import {
  LOCAL_CONVERSATION_ID,
  ARCHIVED_CONVERSATION_ID,
  RECOVERY_CONVERSATION_ID,
  type ShellScenario,
} from "./types.ts";
import { bindingRecords } from "./bindings.ts";
import { transcriptRecords } from "./transcript.ts";
export function conversationSeed(
  scenario: Exclude<ShellScenario, "default">,
): Record<string, string> {
  const seeded = {
    ...conversationFiles({
      id: LOCAL_CONVERSATION_ID,
      title: "Summarize project notes",
      status: "active",
      bindings: bindingRecords(scenario),
      activeBindingId: "binding-codex",
      transcript: transcriptRecords(scenario),
      usage: { used: 12_920, limit: 128_000 },
    }),
    ...conversationFiles({
      id: ARCHIVED_CONVERSATION_ID,
      title: "Archived planning chat",
      status: "archived",
      bindings: [binding("binding-archived", "codex", "gpt-5.6-sol")],
      activeBindingId: "binding-archived",
      transcript: [
        message("archived-user", "user", "Old plan", "binding-archived"),
        message(
          "archived-assistant",
          "assistant",
          "This conversation is archived.",
          "binding-archived",
        ),
      ],
    }),
  };
  if (scenario !== "recovery") return seeded;
  return {
    ...seeded,
    ...conversationFiles({
      id: RECOVERY_CONVERSATION_ID,
      title: "Interrupted local task",
      status: "active",
      bindings: [
        {
          ...binding("binding-recovery", "codex", "gpt-5.6-sol"),
          nativeSessionId: "missing-fake-session",
        },
        {
          schemaVersion: 3,
          type: "binding.context.updated",
          id: "context-recovery",
          createdAt: "2026-08-16T10:01:30.000Z",
          agentBindingId: "binding-recovery",
          throughEntryId: "recovery-assistant",
          throughEntryHash: "c".repeat(64),
          cause: "native-turn",
        },
      ],
      activeBindingId: "binding-recovery",
      transcript: [
        message(
          "recovery-user",
          "user",
          "Finish the interrupted task",
          "binding-recovery",
        ),
        message(
          "recovery-assistant",
          "assistant",
          "The durable response remains available offline.",
          "binding-recovery",
        ),
        {
          schemaVersion: 1,
          id: "recovery-error",
          type: "error",
          createdAt: "2026-08-16T10:02:00.000Z",
          agentBindingId: "binding-recovery",
          message: "Agent host restarted before the turn completed.",
          retryable: true,
        },
      ],
      malformedFinalLine: true,
    }),
  };
}
