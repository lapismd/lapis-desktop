import { expect, it, vi } from "vitest";
import { NativeConversationBackend } from "../../../src/lib/native/ai/backends/client.ts";

const handle = "11111111-1111-4111-8111-111111111111";
const requestId = "a".repeat(32),
  threadId = "b".repeat(32),
  repository = "c".repeat(32);
const conversation = {
  target: { type: "conversation", id: "external:canonical-authorship" },
  threadId,
  repository,
};
const reply = (data: unknown) =>
  JSON.stringify({
    version: 1,
    data: { type: "canonicalConversationMessage", data },
  });
const result = {
  requestId,
  conversation,
  messageId: "d".repeat(32),
  receipt: null,
};
const input = {
  requestId,
  threadId,
  expectedSelection: [1, 255],
  text: "A canonical authored message",
};

it("uses the canonical thread and exact observed selection without a conversation UUID alias", async () => {
  const invoke = vi.fn(async (_text: string) => reply(result));
  const client = new NativeConversationBackend("vault", invoke);
  const written = await client.authored.appendCanonical(handle, input);
  expect(written).toEqual(result);
  expect(written.conversation.target).toEqual({
    type: "conversation",
    id: "external:canonical-authorship",
  });
  expect(JSON.parse(invoke.mock.calls[0]![0])).toEqual({
    version: 1,
    sessionId: "vault",
    operation: {
      type: "appendCanonicalConversationMessage",
      handle,
      message: input,
    },
  });
  expect(written).not.toHaveProperty("conversationRequestId");
});

it("keeps unknown outcomes under the original identity and reads status without replay", async () => {
  const invoke = vi.fn(async (_text: string) => reply(result));
  const client = new NativeConversationBackend("vault", invoke);
  expect(
    (await client.authored.appendCanonical(handle, input)).receipt,
  ).toBeNull();
  expect(
    (await client.authored.canonicalStatus(handle, requestId, threadId))
      ?.receipt,
  ).toBeNull();
  expect(invoke.mock.calls.map(([text]) => JSON.parse(text).operation)).toEqual(
    [
      { type: "appendCanonicalConversationMessage", handle, message: input },
      {
        type: "canonicalConversationMessageStatus",
        handle,
        requestId,
        threadId,
      },
    ],
  );
});

it("admits the dedicated large human-text frame and preserves full-width receipt text", async () => {
  const receipt = '{"accepted_at_millis":9223372036854775807}',
    text = "# A saved message\n\nA paragraph of authored text.\n".repeat(500);
  const invoke = vi.fn(async (_text: string) => reply({ ...result, receipt }));
  const client = new NativeConversationBackend("vault", invoke);
  expect(
    (await client.authored.appendCanonical(handle, { ...input, text })).receipt,
  ).toBe(receipt);
  expect(invoke.mock.calls[0]![0].length).toBeGreaterThan(4096);
  expect(JSON.parse(invoke.mock.calls[0]![0]).operation.message.text).toBe(
    text,
  );
});

it("retains recorded-session targets without converting them to app conversations", async () => {
  const target = { type: "recorded", session: "e".repeat(32) };
  const invoke = vi.fn(async (_text: string) =>
    reply({ ...result, conversation: { ...conversation, target } }),
  );
  const client = new NativeConversationBackend("vault", invoke);
  expect(
    (await client.authored.appendCanonical(handle, input)).conversation.target,
  ).toEqual(target);
});

it("refuses malformed requests before transport and changed native response identities", async () => {
  const invoke = vi.fn(async (_text: string) => reply(result));
  const client = new NativeConversationBackend("vault", invoke);
  for (const value of [
    { ...input, expectedSelection: [] },
    { ...input, expectedSelection: [256] },
    { ...input, threadId: "uuid-alias" },
    { ...input, requestId: "not-native" },
    { ...input, text: " " },
    { ...input, text: "nul\0text" },
    { ...input, text: "x".repeat(256 * 1024 + 1) },
  ])
    await expect(
      client.authored.appendCanonical(handle, value),
    ).rejects.toThrow(/Invalid/);
  expect(invoke).not.toHaveBeenCalled();
  for (const value of [
    { ...result, requestId: "f".repeat(32) },
    { ...result, conversation: { ...conversation, threadId: "f".repeat(32) } },
    { ...result, conversation: { ...conversation, repository: null } },
    { ...result, messageId: "new-renderer-message" },
  ]) {
    invoke.mockResolvedValueOnce(reply(value));
    await expect(
      client.authored.appendCanonical(handle, input),
    ).rejects.toThrow(/Invalid/);
  }
});
