import { expect, it, vi } from "vitest";
import { NativeConversationBackend } from "../../../src/lib/native/ai/backends/client.ts";

const handle = "11111111-1111-4111-8111-111111111111";
const targetId = "22222222-2222-4222-8222-222222222222";
const requestId = "a".repeat(32);
const conversation = {
  target: { type: "conversation" as const, id: "external:opaque-capture" },
  threadId: "b".repeat(32),
  repository: "c".repeat(32),
};
const input = {
  requestId,
  conversation,
  expectedSelection: [1, 255],
  clientId: "codex" as const,
};
const prepared = { requestId, conversation, targetId };
const reply = (data: unknown) =>
  JSON.stringify({ version: 1, data: { type: "canonicalCapture", data } });

it("retains canonical identity and sends only the selected thread and bounded native preparation", async () => {
  const invoke = vi.fn(async (_text: string) => reply(prepared));
  const client = new NativeConversationBackend("vault", invoke);
  expect(await client.managed.prepareCanonical(handle, input)).toEqual(
    prepared,
  );
  expect(invoke).toHaveBeenCalledTimes(1);
  expect(JSON.parse(invoke.mock.calls[0]![0])).toEqual({
    version: 1,
    sessionId: "vault",
    operation: {
      type: "prepareCanonicalManagedCapture",
      handle,
      requestId,
      threadId: conversation.threadId,
      expectedSelection: [1, 255],
      clientId: "codex",
    },
  });
  expect(prepared).not.toHaveProperty("conversationRequestId");
});

it("retains a recorded session target without using it as the launch identity", async () => {
  const recorded = {
    ...conversation,
    target: { type: "recorded" as const, session: "d".repeat(32) },
  };
  const invoke = vi.fn(async () =>
    reply({ ...prepared, conversation: recorded }),
  );
  const client = new NativeConversationBackend("vault", invoke);
  const result = await client.managed.prepareCanonical(handle, {
    ...input,
    conversation: recorded,
  });
  expect(result.conversation).toEqual(recorded);
  expect(result.targetId).toBe(targetId);
});

it("does not retry an unknown preparation outcome", async () => {
  const invoke = vi.fn(async () => {
    throw new Error("native preparation reply lost");
  });
  const client = new NativeConversationBackend("vault", invoke);
  await expect(client.managed.prepareCanonical(handle, input)).rejects.toThrow(
    "reply lost",
  );
  expect(invoke).toHaveBeenCalledTimes(1);
});

it("refuses substituted request, canonical owner, repository and launch identities", async () => {
  for (const result of [
    { ...prepared, requestId: "e".repeat(32) },
    {
      ...prepared,
      conversation: { ...conversation, threadId: "e".repeat(32) },
    },
    { ...prepared, conversation: { ...conversation, repository: null } },
    {
      ...prepared,
      conversation: {
        ...conversation,
        target: { type: "conversation", id: "foreign" },
      },
    },
    { ...prepared, targetId: "not-a-native-target" },
  ]) {
    const client = new NativeConversationBackend("vault", async () =>
      reply(result),
    );
    await expect(
      client.managed.prepareCanonical(handle, input),
    ).rejects.toThrow("Invalid native");
  }
});

it("refuses invalid source selections, client selectors and absent repository before IPC", async () => {
  const invoke = vi.fn(async () => reply(prepared));
  const client = new NativeConversationBackend("vault", invoke);
  for (const bad of [
    { ...input, expectedSelection: [] },
    { ...input, expectedSelection: [256] },
    { ...input, expectedSelection: Array(257).fill(1) },
    { ...input, conversation: { ...conversation, repository: null } },
    { ...input, clientId: "arbitrary-executable" as "codex" },
  ])
    await expect(client.managed.prepareCanonical(handle, bad)).rejects.toThrow(
      "Invalid native",
    );
  expect(invoke).not.toHaveBeenCalled();
});
