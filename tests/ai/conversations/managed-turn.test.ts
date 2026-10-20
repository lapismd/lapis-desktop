import { expect, it, vi } from "vitest";
import { deferred, managedTurnFixture } from "./managed-turn-fixture.ts";
import type { AgentSession } from "../../../src/lib/ai/core/runtime.ts";

it("retains one preparation when a state subscriber requests it again", async () => {
  const f = await managedTurnFixture();
  let observed: Promise<void> | undefined;
  f.turn.subscribe((state) => {
    if (state.phase === "preparing") observed ??= f.turn.prepare();
  });
  const preparing = f.turn.prepare();
  await preparing;
  expect(observed).toBe(preparing);
  expect(f.append).toHaveBeenCalledOnce();
  expect(f.prepare).toHaveBeenCalledTimes(2);
  await f.turn.close();
});

it("confirms one human contribution and prepares all recipients before native dispatch", async () => {
  const f = await managedTurnFixture();
  const onSession = vi.fn();
  const contextBlocks = [
    {
      kind: "file-context" as const,
      id: "note",
      content: "Injected reference",
      metadata: { path: "Note.md" },
    },
  ];
  const sending = f.turn.send({ contextBlocks }, onSession);
  expect(f.turn.send({ contextBlocks }, onSession)).toBe(sending);
  await sending;
  expect(f.append).toHaveBeenCalledOnce();
  expect(f.append.mock.calls[0]![1]).toMatchObject({
    text: "Keep the authored text unchanged",
    expectedSelection: f.read.selection,
    requestId: f.turn.state.nativeRequestId,
  });
  expect(f.prepare).toHaveBeenCalledTimes(2);
  expect(
    f.prepare.mock.calls.every(
      ([, input]) =>
        JSON.stringify(input.expectedSelection) ===
        JSON.stringify(f.current.selection),
    ),
  ).toBe(true);
  expect(f.order.indexOf("author")).toBeLessThan(
    f.order.indexOf("read-current"),
  );
  expect(f.order.indexOf("plan:agent-1")).toBeLessThan(
    f.order.indexOf("start:0"),
  );
  for (const session of f.sessions)
    expect(session.send).toHaveBeenCalledWith(
      "Keep the authored text unchanged",
      { contextBlocks, requestId: f.turn.state.requestId },
    );
  expect(f.turn.state.nativeRequestId).toBe(
    f.turn.state.requestId.replaceAll("-", ""),
  );
  expect(f.turn.state).toMatchObject({
    phase: "completed",
    authorship: "confirmed",
    deliveries: [{ phase: "completed" }, { phase: "completed" }],
  });
  expect(onSession).toHaveBeenCalledTimes(2);
  await f.turn.close();
  for (const session of f.sessions)
    expect(session.close).toHaveBeenCalledOnce();
});

it("does not turn an unknown authoring result or recovered receipt into a dispatch retry", async () => {
  const f = await managedTurnFixture();
  f.append.mockResolvedValueOnce({
    requestId: f.turn.state.nativeRequestId,
    conversation: f.read.identity,
    messageId: "f".repeat(32),
    receipt: null,
  });
  const first = f.turn.send();
  await expect(first).rejects.toThrow(/not confirmed/);
  expect(f.turn.state).toMatchObject({
    phase: "failed",
    authorship: "unknown",
  });
  await f.turn.authorshipStatus();
  expect(f.turn.send()).toBe(first);
  await expect(first).rejects.toThrow(/not confirmed/);
  expect(f.status).toHaveBeenCalledWith(
    f.native.opened.handle,
    f.turn.state.nativeRequestId,
    f.read.identity.threadId,
  );
  expect(f.append).toHaveBeenCalledOnce();
  expect(f.prepare).not.toHaveBeenCalled();
  expect(f.launcher.start).not.toHaveBeenCalled();
  await f.turn.close();
});

it("retains partial capture plans without launching any worker or preparing again", async () => {
  const f = await managedTurnFixture();
  const prepare = f.prepare.getMockImplementation()!;
  f.prepare.mockImplementation(async (...args) => {
    if (args[1].participant?.profileId === "agent-1")
      throw new Error("Lost native preparation reply");
    return prepare(...args);
  });
  const first = f.turn.prepare();
  await expect(first).rejects.toThrow(/Lost native preparation/);
  expect(f.turn.prepare()).toBe(first);
  expect(f.turn.state.deliveries[0]).toMatchObject({
    phase: "prepared",
    preparation: { requestId: f.turn.state.deliveries[0]!.id },
  });
  expect(f.turn.state.deliveries[1]).toMatchObject({
    phase: "unknown",
    error: "Lost native preparation reply",
  });
  expect(f.launcher.start).not.toHaveBeenCalled();
  expect(f.closeRead).toHaveBeenCalledOnce();
  await f.turn.close();
});

it("refuses unsupported participants before attempting a human write", async () => {
  const f = await managedTurnFixture();
  f.launcher.supports.mockResolvedValueOnce(false);
  await expect(f.turn.send()).rejects.toThrow(/unavailable/);
  expect(f.turn.state.authorship).toBe("pending");
  expect(f.append).not.toHaveBeenCalled();
  expect(f.prepare).not.toHaveBeenCalled();
  await f.turn.close();
});

it("refuses a substituted current identity and releases only its own temporary pin", async () => {
  const f = await managedTurnFixture();
  const replaced = structuredClone(f.current);
  replaced.identity.target = {
    type: "conversation",
    id: "foreign:conversation",
  };
  f.refresh.mockResolvedValueOnce(replaced);
  await expect(f.turn.send()).rejects.toThrow(/canonical identity/);
  expect(f.prepare).not.toHaveBeenCalled();
  expect(f.closeRead).toHaveBeenCalledWith(
    f.native.opened.handle,
    replaced.handle,
  );
  expect(f.turn.state.authorship).toBe("confirmed");
  await f.turn.close();
});

it("keeps completed and unknown recipient outcomes separate without resubmitting", async () => {
  const f = await managedTurnFixture();
  f.sessions[0]!.send.mockRejectedValueOnce(
    new Error("Provider outcome unknown"),
  );
  const sending = f.turn.send();
  await expect(sending).rejects.toThrow(/did not complete/);
  expect(f.turn.state.deliveries.map((delivery) => delivery.phase)).toEqual([
    "unknown",
    "completed",
  ]);
  expect(f.turn.send()).toBe(sending);
  expect(f.launcher.start).toHaveBeenCalledTimes(2);
  for (const session of f.sessions) expect(session.send).toHaveBeenCalledOnce();
  await f.turn.close();
});

it("fences a late startup after Stop before the authored prompt can be sent", async () => {
  const f = await managedTurnFixture(1);
  const pending = deferred<AgentSession>();
  f.launcher.start.mockReturnValueOnce(pending.promise);
  const sending = f.turn.send();
  const failed = expect(sending).rejects.toThrow(/did not complete/);
  await vi.waitFor(() => expect(f.launcher.start).toHaveBeenCalledOnce());
  const cancelling = f.turn.cancel();
  await vi.waitFor(() => expect(f.dispatch.fence).toHaveBeenCalledOnce());
  pending.resolve(f.sessions[0]!);
  await cancelling;
  await failed;
  expect(f.turn.state.cancellationRequested).toBe(true);
  expect(f.sessions[0]!.send).not.toHaveBeenCalled();
  await f.turn.close();
  expect(f.sessions[0]!.close).toHaveBeenCalledOnce();
});

it("Close waits for a late startup, retains it and closes it without dispatch", async () => {
  const f = await managedTurnFixture(1);
  const pending = deferred<AgentSession>();
  f.launcher.start.mockReturnValueOnce(pending.promise);
  const sending = f.turn.send();
  const failed = expect(sending).rejects.toThrow(/did not complete/);
  await vi.waitFor(() => expect(f.launcher.start).toHaveBeenCalledOnce());
  const closing = f.turn.close();
  pending.resolve(f.sessions[0]!);
  await failed;
  await closing;
  expect(f.sessions[0]!.send).not.toHaveBeenCalled();
  expect(f.sessions[0]!.close).toHaveBeenCalledOnce();
  expect(f.turn.state.phase).toBe("closed");
});

it("retains an unknown temporary-read close for explicit close retry", async () => {
  const f = await managedTurnFixture();
  f.closeRead.mockRejectedValueOnce(new Error("Read close unknown"));
  await expect(f.turn.send()).rejects.toThrow(/Read close unknown/);
  expect(f.closeRead).toHaveBeenCalledOnce();
  expect(f.launcher.start).not.toHaveBeenCalled();
  await f.turn.close();
  expect(f.closeRead).toHaveBeenCalledTimes(2);
});

it("context-only turns create no human write and keep context in the prompt options", async () => {
  const f = await managedTurnFixture(1, "");
  const contextBlocks = [
    {
      kind: "transcript-comments" as const,
      id: "comment",
      content: "Authored comment beside its reference",
      metadata: { submissionId: "original" },
    },
  ];
  await f.turn.send({ contextBlocks });
  expect(f.append).not.toHaveBeenCalled();
  expect(f.turn.state.authorship).toBe("not-required");
  expect(f.sessions[0]!.send).toHaveBeenCalledWith("", {
    contextBlocks,
    requestId: f.turn.state.requestId,
  });
  await f.turn.close();
});
