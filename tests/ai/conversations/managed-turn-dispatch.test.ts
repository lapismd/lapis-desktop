import { expect, it } from "vitest";
import { managedTurnFixture } from "./managed-turn-fixture.ts";

it("records every intended recipient before preparing a launch target", async () => {
  const f = await managedTurnFixture();
  await f.turn.send();
  expect(f.order.indexOf("begin-dispatch")).toBeLessThan(
    f.order.indexOf("plan:agent-0"),
  );
  expect(f.dispatch.begin).toHaveBeenCalledOnce();
  expect(
    f.prepare.mock.calls.every(
      ([, input]) => input.dispatchRequestId === f.turn.state.nativeRequestId,
    ),
  ).toBe(true);
  expect(f.turn.state.dispatch?.recipients.map((r) => r.phase)).toEqual([
    "completed",
    "completed",
  ]);
  await f.turn.close();
});

it("does not treat a resolved renderer send as native capture completion", async () => {
  const f = await managedTurnFixture(1);
  f.sessions[0]!.send.mockResolvedValueOnce();
  await expect(f.turn.send()).rejects.toThrow(/did not complete/);
  expect(f.turn.state.deliveries[0]!.phase).toBe("unknown");
  expect(f.turn.state.dispatch!.recipients[0]!.phase).toBe("bound");
  await f.turn.close();
});

it("uses confirmed native capture after the renderer loses its send reply", async () => {
  const f = await managedTurnFixture(1);
  f.sessions[0]!.send.mockImplementationOnce(async () => {
    f.dispatch.complete(0);
    throw new Error("Renderer reply lost");
  });
  await f.turn.send();
  expect(f.turn.state.deliveries[0]!.phase).toBe("completed");
  expect(f.sessions[0]!.send).toHaveBeenCalledOnce();
  await f.turn.close();
});

it("inspects retained native state without reconstructing a launch attempt", async () => {
  const f = await managedTurnFixture(1);
  const begin = f.dispatch.begin.getMockImplementation()!;
  f.dispatch.begin.mockImplementationOnce(async (...args) => ({
    ...(await begin(...args)),
    fresh: false,
  }));
  await expect(f.turn.send()).rejects.toThrow(/retained/);
  await f.turn.dispatchStatus();
  expect(f.prepare).not.toHaveBeenCalled();
  expect(f.launcher.start).not.toHaveBeenCalled();
  expect(f.dispatch.begin).toHaveBeenCalledOnce();
  await f.turn.close();
});

it("retains an unknown Begin and uses its exact request for explicit Stop", async () => {
  const f = await managedTurnFixture(1);
  const begin = f.dispatch.begin.getMockImplementation()!;
  f.dispatch.begin.mockImplementationOnce(async (...args) => {
    await begin(...args);
    throw new Error("Begin reply lost");
  });
  await expect(f.turn.send()).rejects.toThrow(/Begin reply lost/);
  await f.turn.dispatchStatus();
  expect(f.prepare).not.toHaveBeenCalled();
  await f.turn.close();
  expect(f.dispatch.stop).toHaveBeenCalledWith(
    f.native.opened.handle,
    f.read.identity.threadId,
    f.turn.state.nativeRequestId,
  );
});

it("preserves failed Stop for an explicit retry before releasing renderer streams", async () => {
  const f = await managedTurnFixture(1);
  await f.turn.send();
  f.dispatch.stop.mockRejectedValueOnce(new Error("Native stop unknown"));
  await expect(f.turn.close()).rejects.toThrow(/stop unknown/);
  expect(f.launcher.releaseStopped).not.toHaveBeenCalled();
  await f.turn.close();
  expect(f.dispatch.stop).toHaveBeenCalledTimes(2);
  expect(f.launcher.releaseStopped).toHaveBeenCalledOnce();
  expect(f.order.indexOf("fence-dispatch")).toBeLessThan(
    f.order.indexOf("detach-stream"),
  );
  expect(f.order.indexOf("detach-stream")).toBeLessThan(
    f.order.indexOf("stop-dispatch"),
  );
  expect(f.order.indexOf("stop-dispatch")).toBeGreaterThan(
    f.order.indexOf("send:0"),
  );
});
