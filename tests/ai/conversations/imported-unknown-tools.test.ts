import { expect, it } from "vitest";
import { planSessionImport } from "../../../src/lib/ai/conversations/import-plan.ts";
import { projectTranscriptToChatItems } from "../../../src/lib/ai/conversations/transcript-to-chat.ts";
import { projectAiTranscript } from "../../../src/lib/ai/chat/transcript-projection.ts";
import { toolCallStatus } from "../../../src/lib/ai/chat/chat-tool-display.ts";

it("retains an observed imported tool outcome as unknown through saved and document projections", async () => {
  const plan = await planSessionImport(
    {
      version: 1,
      source: {
        kind: "codex",
        profile: "codex-cli-0.156.1",
        sessionKey: "a".repeat(64),
        snapshotKey: "b".repeat(64),
      },
      createdAt: "2026-10-19T12:00:00.000Z",
      entries: [
        {
          id: "tool:2",
          createdAt: "2026-10-19T12:00:00.000Z",
          type: "tool",
          name: "exec_command",
          state: "unknown",
          input: "pwd",
          output: "observed output",
        },
      ],
    },
    "",
  );
  expect(plan.entries[0]).toMatchObject({
    type: "tool",
    state: "unknown",
    output: "observed output",
  });
  const chat = projectTranscriptToChatItems(plan.entries);
  expect(chat[0]).toMatchObject({ type: "tool", state: "unknown" });
  expect(toolCallStatus("unknown")).toBe("unknown");
  expect(JSON.stringify(projectAiTranscript(chat))).toContain(
    '"status":"unknown"',
  );
});
