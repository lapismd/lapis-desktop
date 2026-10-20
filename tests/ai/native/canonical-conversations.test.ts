import { expect, it, vi } from "vitest";
import { NativeConversationBackend } from "../../../src/lib/native/ai/backends/client.ts";
import { parseNativeConversationJson } from "../../../src/lib/native/ai/backends/json.ts";

const handle = "11111111-1111-4111-8111-111111111111";
const request = "a".repeat(32),
  thread = "b".repeat(32),
  repository = "c".repeat(32);
const reply = (type: string, data: unknown) =>
  JSON.stringify({ version: 1, data: { type, data } });
const page = (
  created = "9223372036854775807",
  target = '{"type":"conversation","id":"opaque application conversation"}',
) =>
  `{"version":1,"repository":"${repository}","selection":[0,255],"conversations":[{"target":${target},"threadId":"${thread}","repository":"${repository}","title":"Native title","status":"idle","createdAtMillis":${created},"updatedAtMillis":-9223372036854775808}],"nextCursor":null}`;

it("retains opaque native targets and full-width timestamps without UUID or floating-point remapping", async () => {
  const call = vi.fn(async (_text: string) =>
    reply("conversationCatalog", page()),
  );
  const client = new NativeConversationBackend("vault", call);
  const result = await client.canonical.list(handle);
  expect(result.conversations[0]).toMatchObject({
    target: { type: "conversation", id: "opaque application conversation" },
    threadId: thread,
    repository,
    createdAtMillis: 9223372036854775807n,
    updatedAtMillis: -9223372036854775808n,
  });
  expect(JSON.parse(call.mock.calls[0]![0]).operation).toEqual({
    type: "listConversations",
    handle,
  });
  call.mockResolvedValueOnce(
    reply(
      "conversationCatalog",
      page("1", `{"type":"recorded","session":"${request}"}`),
    ),
  );
  expect(
    (await client.canonical.list(handle)).conversations[0]!.target,
  ).toEqual({ type: "recorded", session: request });
});

it.each([
  '{"a":1,"a":2}',
  '{"sequence":18446744073709551615.0}',
  '{"sequence":01}',
  '{"a":[1,]}',
])("rejects malformed or ambiguous native numeric JSON: %s", (value) => {
  expect(() => parseNativeConversationJson(value)).toThrow();
});

it("refuses wrong repository, repeated membership and unknown target kinds", async () => {
  const raw = JSON.parse(page("1").replace("-9223372036854775808", "2"));
  const call = vi.fn();
  const client = new NativeConversationBackend("vault", call);
  raw.conversations[0].repository = "d".repeat(32);
  call.mockResolvedValueOnce(reply("conversationCatalog", JSON.stringify(raw)));
  await expect(client.canonical.list(handle)).rejects.toThrow(/Invalid/);
  raw.conversations[0].repository = repository;
  raw.conversations.push(raw.conversations[0]);
  call.mockResolvedValueOnce(reply("conversationCatalog", JSON.stringify(raw)));
  await expect(client.canonical.list(handle)).rejects.toThrow(/Invalid/);
  call.mockResolvedValueOnce(
    reply("conversationCatalog", page("1", '{"type":"annotation","id":"x"}')),
  );
  await expect(client.canonical.list(handle)).rejects.toThrow(/Invalid/);
});

it("passes the exact native page cursor and retains snapshot text for pinned projection", async () => {
  const snapshot = `{"version":2,"conversation":{"target":{"type":"conversation","id":"opaque"},"threadId":"${thread}","repository":"${repository}"},"thread":{"schema_version":1,"thread_id":"${thread}","title":"Pinned title","status":"idle","actor":"${request}","accepted_at_millis":1,"previous":null,"event":{"kind":"thread_event","id":"${"f".repeat(64)}"},"purpose":{"type":"conversation","target":{"type":"conversation","id":"opaque"}}},"metadata":null,"messages":[],"references":{"thread":{"kind":"thread_version","id":"${"e".repeat(64)}"},"metadata":null,"messages":{}},"selection":[0,255],"sessions":[],"sequence":18446744073709551615}`;
  const call = vi
    .fn()
    .mockResolvedValueOnce(reply("conversationCatalog", page("1")))
    .mockResolvedValueOnce(reply("conversationRead", { handle, snapshot }));
  const client = new NativeConversationBackend("vault", call);
  const cursor = '{"version":1,"selection":[0,255],"after":"' + thread + '"}';
  await client.canonical.list(handle, cursor);
  expect(JSON.parse(call.mock.calls[0]![0]).operation.cursor).toBe(cursor);
  expect((await client.canonical.openRead(handle, thread))?.snapshot).toBe(
    snapshot,
  );
  expect(JSON.parse(call.mock.calls[1]![0]).operation).toEqual({
    type: "openCanonicalConversationRead",
    handle,
    threadId: thread,
  });
});

it("keeps unknown canonical edits under the same request and reads status without replay", async () => {
  const result = {
    requestId: request,
    conversation: {
      target: { type: "conversation", id: "opaque" },
      threadId: thread,
      repository,
    },
    receipt: null,
  };
  const call = vi.fn(async (_text: string) =>
    reply("conversationEdit", result),
  );
  const client = new NativeConversationBackend("vault", call);
  const edit = {
    requestId: request,
    threadId: thread,
    expectedSelection: [0, 255],
    action: { type: "rename" as const, title: "New title" },
  };
  expect((await client.canonical.edit(handle, edit)).receipt).toBeNull();
  expect(
    (await client.canonical.editStatus(handle, request, thread))?.receipt,
  ).toBeNull();
  expect(
    call.mock.calls.map(([text]) => JSON.parse(text).operation.type),
  ).toEqual(["editCanonicalConversation", "canonicalConversationEditStatus"]);
  expect(JSON.parse(call.mock.calls[0]![0]).operation.edit).toEqual(edit);
  await expect(
    client.canonical.edit(handle, { ...edit, expectedSelection: [256] }),
  ).rejects.toThrow(/Invalid/);
  expect(call).toHaveBeenCalledTimes(2);
});

it("releases a newly allocated read when its returned canonical identity is invalid", async () => {
  const readHandle = "22222222-2222-4222-8222-222222222222";
  const snapshot = JSON.stringify({
    version: 2,
    selection: [1],
    conversation: {
      target: { type: "conversation", id: "opaque" },
      threadId: thread,
      repository,
    },
    thread: { thread_id: "e".repeat(32) },
  });
  const call = vi
    .fn()
    .mockResolvedValueOnce(
      reply("conversationRead", { handle: readHandle, snapshot }),
    )
    .mockResolvedValueOnce(reply("closed", undefined));
  const client = new NativeConversationBackend("vault", call);
  await expect(client.canonical.openRead(handle, thread)).rejects.toThrow(
    /Invalid/,
  );
  expect(call.mock.calls.map(([text]) => JSON.parse(text).operation)).toEqual([
    { type: "openCanonicalConversationRead", handle, threadId: thread },
    { type: "closeConversationRead", handle, readHandle },
  ]);
});

it("uses the typed large human-message frame while preserving its exact request identity", async () => {
  const messageId = "d".repeat(32),
    text = "A saved human message\n".repeat(5000);
  const call = vi.fn(async (_text: string) =>
    reply("conversationMessage", {
      requestId: request,
      conversationRequestId: thread,
      messageId,
      receipt: null,
    }),
  );
  const client = new NativeConversationBackend("vault", call);
  expect(
    (await client.authored.append(handle, request, thread, text)).receipt,
  ).toBeNull();
  expect(JSON.parse(call.mock.calls[0]![0]).operation).toEqual({
    type: "appendConversationMessage",
    handle,
    requestId: request,
    conversationRequestId: thread,
    text,
  });
  await client.authored.status(handle, request, thread);
  await expect(
    client.authored.append(handle, request, thread, "x\0y"),
  ).rejects.toThrow(/Invalid/);
  expect(call).toHaveBeenCalledTimes(2);
});
