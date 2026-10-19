import { expect, it, vi } from "vitest";
import type { AppToolBridgeEvent } from "../../../src/lib/ai/tools/app-tool-bridge.ts";
import { deferred, fixture } from "./app-tools-fixture.ts";

it("publishes the captured snapshot and waits for transcript-event persistence before replying/completing", async () => {
  const f = fixture();
  const events: AppToolBridgeEvent[] = [];
  const saved = deferred();
  f.bridge.subscribe(async (event) => {
    events.push(event);
    if (event.event.type === "tool.end") await saved.promise;
  });
  const descriptor = await f.bridge.prepare(f.input);
  expect(descriptor.status).toBe("available");
  expect(f.request.mock.calls[0]![1]).toEqual({
    type: "open",
    tools: [
      {
        name: "notes_read",
        description: "Read an admitted note",
        inputSchema: { type: "object" },
      },
    ],
  });
  expect(f.bridge.target(descriptor, "codex")).toBe(
    `codex:tools:${descriptor.bridgeId}`,
  );
  const turnId = crypto.randomUUID(),
    invocationId = crypto.randomUUID();
  await f.bridge.arm(descriptor.bridgeId!, turnId);
  f.event({
    type: "call",
    bridgeId: descriptor.bridgeId!,
    invocationId,
    turnId,
    name: "notes_read",
    arguments: { path: "Notes/Readme.md" },
  });
  await vi.waitFor(() =>
    expect(events.some((e) => e.event.type === "tool.end")).toBe(true),
  );
  expect(f.replies()).toHaveLength(0);
  let ended = false;
  const ending = f.bridge.end(descriptor.bridgeId!, turnId).then(() => {
    ended = true;
  });
  await Promise.resolve();
  expect(ended).toBe(false);
  saved.resolve();
  await ending;
  expect(f.execute).toHaveBeenCalledOnce();
  expect(f.replies()[0]![1]).toMatchObject({
    invocationId,
    outcome: { type: "completed" },
  });
  expect(events.map((e) => e.event.source?.sequence)).toEqual([1, 2]);
  expect(events.map((e) => e.event.source?.runId)).toEqual([turnId, turnId]);
  expect(f.work).toHaveBeenCalledWith(
    "Running notes_read",
    expect.any(Function),
  );
  await f.bridge.close();
  f.host.close();
});

it("holds approved writes until their approval event is saved and uses the retained host policy", async () => {
  const f = fixture("write");
  const published = deferred();
  let approval: string | undefined;
  f.bridge.subscribe(async ({ event }) => {
    if (event.type === "permission.request") {
      approval = event.request.id;
      await published.promise;
    }
  });
  const descriptor = await f.bridge.prepare(f.input);
  const turnId = crypto.randomUUID();
  await f.bridge.arm(descriptor.bridgeId!, turnId);
  f.event({
    type: "call",
    bridgeId: descriptor.bridgeId!,
    invocationId: crypto.randomUUID(),
    turnId,
    name: "notes_read",
    arguments: {},
  });
  await vi.waitFor(() => expect(approval).toBeDefined());
  expect(f.bridge.respondToApproval(approval!, "allow-once")).toBe(true);
  expect(f.execute).not.toHaveBeenCalled();
  published.resolve();
  await vi.waitFor(() => expect(f.replies()).toHaveLength(1));
  expect(f.execute).toHaveBeenCalledOnce();
  await f.bridge.end(descriptor.bridgeId!, turnId);
  await f.bridge.close();
  f.host.close();
});

it("retains cancelled execution until its actual callback settles and never reports successful completion", async () => {
  const actual = deferred<{ content: [] }>();
  const f = fixture(
    "read",
    vi.fn(() => actual.promise),
  );
  const descriptor = await f.bridge.prepare(f.input);
  const turnId = crypto.randomUUID(),
    invocationId = crypto.randomUUID();
  await f.bridge.arm(descriptor.bridgeId!, turnId);
  f.event({
    type: "call",
    bridgeId: descriptor.bridgeId!,
    invocationId,
    turnId,
    name: "notes_read",
    arguments: {},
  });
  await vi.waitFor(() => expect(f.execute).toHaveBeenCalledOnce());
  f.event({ type: "cancel", bridgeId: descriptor.bridgeId!, invocationId });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(f.replies()).toHaveLength(0);
  const ending = expect(
    f.bridge.end(descriptor.bridgeId!, turnId),
  ).rejects.toThrow("unknown");
  actual.resolve({ content: [] });
  await ending;
  expect(f.replies()[0]![1]).toMatchObject({ outcome: { type: "unknown" } });
  expect(f.execute).toHaveBeenCalledOnce();
  await f.bridge.close();
  f.host.close();
});

it("reconciles a lost reply acknowledgement on close without re-executing the callback", async () => {
  const f = fixture();
  let lost = true;
  f.request.mockImplementation(async (_id, operation) => {
    if (operation.type === "reply" && lost) {
      lost = false;
      throw new Error("Reply acknowledgement lost");
    }
  });
  const descriptor = await f.bridge.prepare(f.input);
  const turnId = crypto.randomUUID();
  await f.bridge.arm(descriptor.bridgeId!, turnId);
  f.event({
    type: "call",
    bridgeId: descriptor.bridgeId!,
    invocationId: crypto.randomUUID(),
    turnId,
    name: "notes_read",
    arguments: {},
  });
  await vi.waitFor(() => expect(f.report).toHaveBeenCalledOnce());
  await expect(f.bridge.end(descriptor.bridgeId!, turnId)).rejects.toThrow(
    "Reply acknowledgement lost",
  );
  await f.bridge.closeBinding(f.input.agentBindingId);
  expect(f.replies()).toHaveLength(2);
  expect(f.replies()[0]).toEqual(f.replies()[1]);
  expect(f.execute).toHaveBeenCalledOnce();
  await f.bridge.close();
  f.host.close();
});

it("cleans an uncertain open using its original opaque identity and refuses binding reuse", async () => {
  const f = fixture();
  f.request.mockImplementation(async (_id, operation) => {
    if (operation.type === "open") throw new Error("Open reply lost");
  });
  await expect(f.bridge.prepare(f.input)).rejects.toThrow("Open reply lost");
  expect(f.request.mock.calls.map((call) => call[1].type)).toEqual([
    "open",
    "close",
  ]);
  expect(f.request.mock.calls[0]![0]).toBe(f.request.mock.calls[1]![0]);
  await expect(f.bridge.prepare(f.input)).rejects.toThrow("unavailable");
  expect(f.host.getSession("binding")).toBeUndefined();
  await f.bridge.close();
  f.host.close();
});

it("close fences late preparation and owns cleanup after the caller loses its open reply", async () => {
  const f = fixture();
  const opening = deferred();
  f.request.mockImplementation(async (_id, operation) => {
    if (operation.type === "open") await opening.promise;
  });
  const prepared = expect(f.bridge.prepare(f.input)).rejects.toThrow(
    "cancelled",
  );
  await vi.waitFor(() => expect(f.request).toHaveBeenCalledOnce());
  const closing = f.bridge.closeBinding("binding");
  opening.resolve();
  await prepared;
  await closing;
  expect(f.request.mock.calls.map((call) => call[1].type)).toEqual([
    "open",
    "close",
  ]);
  await f.bridge.close();
  f.host.close();
});

it("does not execute tools when publishing their start fails", async () => {
  const f = fixture();
  f.bridge.subscribe(async () => {
    throw new Error("Transcript write failed");
  });
  const descriptor = await f.bridge.prepare(f.input);
  const turnId = crypto.randomUUID();
  await f.bridge.arm(descriptor.bridgeId!, turnId);
  f.event({
    type: "call",
    bridgeId: descriptor.bridgeId!,
    invocationId: crypto.randomUUID(),
    turnId,
    name: "notes_read",
    arguments: {},
  });
  await vi.waitFor(() => expect(f.replies()).toHaveLength(1));
  expect(f.execute).not.toHaveBeenCalled();
  expect(f.replies()[0]![1]).toMatchObject({ outcome: { type: "unknown" } });
  await expect(f.bridge.end(descriptor.bridgeId!, turnId)).rejects.toThrow(
    "unknown",
  );
  await f.bridge.close();
  f.host.close();
});

it("honours cancellation delivered before the matching call reaches the renderer", async () => {
  const f = fixture();
  const descriptor = await f.bridge.prepare(f.input);
  const turnId = crypto.randomUUID(),
    invocationId = crypto.randomUUID();
  await f.bridge.arm(descriptor.bridgeId!, turnId);
  f.event({ type: "cancel", bridgeId: descriptor.bridgeId!, invocationId });
  f.event({
    type: "call",
    bridgeId: descriptor.bridgeId!,
    invocationId,
    turnId,
    name: "notes_read",
    arguments: {},
  });
  await vi.waitFor(() => expect(f.replies()).toHaveLength(1));
  expect(f.execute).not.toHaveBeenCalled();
  expect(f.replies()[0]![1]).toMatchObject({ outcome: { type: "rejected" } });
  await f.bridge.end(descriptor.bridgeId!, turnId);
  await f.bridge.close();
  f.host.close();
});

it("drains every event observer after another observer rejects before acknowledging execution", async () => {
  const f = fixture(),
    publishing = deferred();
  f.bridge.subscribe(async () => {
    throw new Error("Persistence failed");
  });
  let entered = false;
  f.bridge.subscribe(async ({ event }) => {
    if (event.type === "tool.start") {
      entered = true;
      await publishing.promise;
    }
  });
  const descriptor = await f.bridge.prepare(f.input),
    turnId = crypto.randomUUID();
  await f.bridge.arm(descriptor.bridgeId!, turnId);
  f.event({
    type: "call",
    bridgeId: descriptor.bridgeId!,
    invocationId: crypto.randomUUID(),
    turnId,
    name: "notes_read",
    arguments: {},
  });
  await vi.waitFor(() => expect(entered).toBe(true));
  expect(f.replies()).toHaveLength(0);
  expect(f.execute).not.toHaveBeenCalled();
  publishing.resolve();
  await vi.waitFor(() => expect(f.replies()).toHaveLength(1));
  expect(f.replies()[0]![1]).toMatchObject({ outcome: { type: "unknown" } });
  await expect(f.bridge.end(descriptor.bridgeId!, turnId)).rejects.toThrow(
    "unknown",
  );
  await f.bridge.close();
  f.host.close();
});
