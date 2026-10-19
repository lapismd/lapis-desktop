import { expect, it } from "vitest";
import {
  recipientFromOption,
  validateRecipients,
} from "../../../src/lib/ai/conversations/recipients.ts";
import { projectChatItemsToTranscript } from "../../../src/lib/ai/conversations/chat-to-transcript.ts";
import { projectTranscriptToChatItems } from "../../../src/lib/ai/conversations/transcript-to-chat.ts";
import { validateTranscriptEntry } from "../../../src/lib/ai/conversations/transcript-validation.ts";

const codex = { id: "codex", label: "Codex", agent: "codex" as const };
it("uses jj-store's canonical setup token without confusing labels, keys or native bindings", () => {
  const saved = recipientFromOption(codex);
  expect(saved).toEqual({
    id: "codex",
    label: "Codex",
    token: "jj-store-agent:636f646578;",
  });
  expect(validateRecipients([saved])).toEqual([saved]);
  for (const invalid of [
    [{ ...saved, id: "CODEX" }],
    [{ ...saved, token: "jj-store-agent:FF;" }],
    [{ ...saved, label: "Codex\nrun" }],
    [{ ...saved, label: "Codex\u2028run" }],
    [{ ...saved, program: "/bin/sh" }],
    [saved, saved],
    Array.from({ length: 5 }, () => saved),
    {},
  ])
    expect(() => validateRecipients(invalid)).toThrow();
});
it("keeps saved recipient tags separate from authored text through journal projection", () => {
  const recipients = [recipientFromOption(codex)];
  const entries = projectChatItemsToTranscript([
    {
      id: "message",
      type: "message",
      role: "user",
      text: "Review this table",
      recipients,
    },
  ]);
  expect(entries[0]).toMatchObject({ text: "Review this table", recipients });
  expect(validateTranscriptEntry(entries[0])).toEqual(entries[0]);
  expect(projectTranscriptToChatItems(entries)[0]).toMatchObject({
    text: "Review this table",
    recipients,
  });
  expect(() =>
    validateTranscriptEntry({ ...entries[0], role: "assistant" }),
  ).toThrow();
  expect(
    projectChatItemsToTranscript([
      { id: "old", type: "message", role: "user", text: "Old message" },
    ])[0],
  ).not.toHaveProperty("recipients");
});
