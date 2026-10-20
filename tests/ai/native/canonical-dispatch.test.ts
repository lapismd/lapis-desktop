import { expect, it, vi } from "vitest";
import { NativeConversationBackend } from "../../../src/lib/native/ai/backends/client.ts";
import type {
  NativeDispatchInput,
  NativeDispatchView,
} from "../../../src/lib/ai/conversations/dispatch-port.ts";

const handle = "11111111-1111-4111-8111-111111111111";
const target = "22222222-2222-4222-8222-222222222222";
const requestId = "a".repeat(32),
  threadId = "b".repeat(32),
  recipientId = "d".repeat(32);
const input: NativeDispatchInput = {
  requestId,
  threadId,
  expectedSelection: [1, 255],
  authored: false,
  recipients: [{ requestId: recipientId, participant: null }],
};
const view: NativeDispatchView = {
  requestId,
  conversation: {
    target: { type: "conversation", id: "external:opaque" },
    threadId,
    repository: "c".repeat(32),
  },
  authored: null,
  recipients: [
    {
      requestId: recipientId,
      participant: null,
      phase: "planned",
      targetId: null,
      binding: null,
      prepared: false,
    },
  ],
  stopRequested: false,
  stopped: false,
  settled: false,
  fresh: true,
};
const reply = (data: unknown) =>
  JSON.stringify({ version: 1, data: { type: "canonicalDispatch", data } });

it("sends bounded native intent without renderer-supplied ownership or provider authority", async () => {
  const invoke = vi.fn(async (_request: string) => reply(view));
  const client = new NativeConversationBackend("vault", invoke);
  expect(await client.dispatch.begin(handle, input)).toEqual(view);
  expect(invoke).toHaveBeenCalledOnce();
  expect(JSON.parse(invoke.mock.calls[0]![0]).operation).toEqual({
    type: "beginCanonicalDispatch",
    handle,
    input,
  });
});

it("discovers exact or outstanding state without creating a plan or retrying", async () => {
  const retained = { ...view, fresh: false };
  const invoke = vi.fn(async (_request: string) => reply(retained));
  const client = new NativeConversationBackend("vault", invoke);
  expect(await client.dispatch.status(handle, threadId)).toEqual(retained);
  expect(JSON.parse(invoke.mock.calls[0]![0]).operation).toEqual({
    type: "canonicalDispatchStatus",
    handle,
    threadId,
    requestId: null,
  });
  invoke.mockResolvedValueOnce(reply(null));
  expect(await client.dispatch.status(handle, threadId, requestId)).toBeNull();
  invoke.mockRejectedValueOnce(new Error("Native reply lost"));
  await expect(client.dispatch.begin(handle, input)).rejects.toThrow(
    /reply lost/,
  );
  expect(invoke).toHaveBeenCalledTimes(3);
});

it("requires a native stopped result before releasing a turn", async () => {
  const invoke = vi.fn(async () =>
    reply({
      ...view,
      fresh: false,
      stopRequested: true,
      stopped: true,
      settled: true,
    }),
  );
  const client = new NativeConversationBackend("vault", invoke);
  expect(
    (await client.dispatch.stop(handle, threadId, requestId)).stopped,
  ).toBe(true);
  invoke.mockResolvedValueOnce(
    reply({ ...view, fresh: false, stopRequested: true }),
  );
  await expect(
    client.dispatch.stop(handle, threadId, requestId),
  ).rejects.toThrow(/Invalid native/);
});

it("requires the native fence before detaching streams and closing workers", async () => {
  const invoke = vi.fn(async (_request: string) =>
    reply({ ...view, fresh: false, stopRequested: true }),
  );
  const client = new NativeConversationBackend("vault", invoke);
  expect(
    (await client.dispatch.fence(handle, threadId, requestId)).stopRequested,
  ).toBe(true);
  expect(JSON.parse(invoke.mock.calls[0]![0]).operation.type).toBe(
    "fenceCanonicalDispatch",
  );
  invoke.mockResolvedValueOnce(reply({ ...view, fresh: false }));
  await expect(
    client.dispatch.fence(handle, threadId, requestId),
  ).rejects.toThrow(/Invalid native/);
});

it("classifies Stop/fence as cleanup while status and Begin retain active admission", async () => {
  const invoke = vi.fn(async (request: string, _cleanup?: boolean) => {
    const type = JSON.parse(request).operation.type;
    return reply({
      ...view,
      fresh: type === "beginCanonicalDispatch",
      stopRequested:
        type === "fenceCanonicalDispatch" || type === "stopCanonicalDispatch",
      stopped: type === "stopCanonicalDispatch",
      settled: type === "stopCanonicalDispatch",
    });
  });
  const client = new NativeConversationBackend("vault", invoke);
  await client.dispatch.begin(handle, input);
  await client.dispatch.status(handle, threadId, requestId);
  await client.dispatch.fence(handle, threadId, requestId);
  await client.dispatch.stop(handle, threadId, requestId);
  expect(invoke.mock.calls.map(([, cleanup]) => cleanup)).toEqual([
    undefined,
    undefined,
    true,
    true,
  ]);
});

it("rejects inconsistent phase, identity, binding, authority and completion fields", async () => {
  for (const bad of [
    { ...view, owner: { window: "main" } },
    { ...view, requestId: "e".repeat(32) },
    { ...view, settled: true },
    { ...view, stopped: true },
    { ...view, conversation: { ...view.conversation, repository: null } },
    { ...view, recipients: [] },
    { ...view, recipients: [view.recipients[0], view.recipients[0]] },
    { ...view, recipients: [{ ...view.recipients[0], phase: "completed" }] },
    {
      ...view,
      fresh: false,
      recipients: [
        {
          ...view.recipients[0],
          phase: "bound",
          targetId: target,
          binding: { worker: "worker", openRequest: "open", target: handle },
        },
      ],
    },
  ]) {
    const client = new NativeConversationBackend("vault", async () =>
      reply({ ...bad, fresh: false }),
    );
    await expect(
      client.dispatch.status(handle, threadId, requestId),
    ).rejects.toThrow(/Invalid native/);
  }
});

it("refuses duplicate recipients and malformed selections before IPC", async () => {
  const invoke = vi.fn(async () => reply(view));
  const client = new NativeConversationBackend("vault", invoke);
  for (const bad of [
    { ...input, expectedSelection: [] },
    { ...input, recipients: [] },
    { ...input, recipients: [input.recipients[0]!, input.recipients[0]!] },
    { ...input, recipients: [{ requestId, participant: null }] },
  ])
    await expect(client.dispatch.begin(handle, bad)).rejects.toThrow(
      /Invalid native/,
    );
  expect(invoke).not.toHaveBeenCalled();
});
