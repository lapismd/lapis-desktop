import assert from "node:assert/strict";
import test from "node:test";
import { installDesktopLifecycle } from "../../src/lib/desktop/desktop-lifecycle.ts";

const turn = () => new Promise((resolve) => setImmediate(resolve));

function reloadKey(target) {
  const event = new Event("keydown", { cancelable: true });
  Object.assign(event, { metaKey: true, key: "r", repeat: false });
  target.dispatchEvent(event);
  return event;
}

test("a deliberate reload pressed during failed persistence runs after its acknowledgement", async (context) => {
  const target = new EventTarget();
  const calls = [];
  const failures = [];
  let receive;
  let acknowledge;
  let attempts = 0;
  const stop = await installDesktopLifecycle(
    async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("layout save failed");
    },
    (failure) => failures.push(failure),
    {
      target,
      listen: async (_name, handler) => {
        receive = handler;
        return () => {};
      },
      invoke: async (command, args) => {
        calls.push([command, args]);
        if (command === "lifecycle_result" && args.saved === false)
          await new Promise((resolve) => {
            acknowledge = resolve;
          });
      },
    },
  );
  context.after(stop);

  receive({ payload: { requestId: "failed", action: "reload" } });
  await turn();
  assert.equal(failures[0].message, "layout save failed");
  assert.equal(reloadKey(target).defaultPrevented, true);
  assert.deepEqual(calls, [
    ["lifecycle_result", { requestId: "failed", saved: false }],
  ]);

  acknowledge();
  await turn();
  assert.deepEqual(calls, [
    ["lifecycle_result", { requestId: "failed", saved: false }],
    ["lifecycle_reload", undefined],
  ]);
});

test("a duplicate reload during successful persistence is not replayed", async (context) => {
  const target = new EventTarget();
  const calls = [];
  let receive;
  let acknowledge;
  const stop = await installDesktopLifecycle(async () => {}, assert.fail, {
    target,
    listen: async (_name, handler) => {
      receive = handler;
      return () => {};
    },
    invoke: async (command, args) => {
      calls.push([command, args]);
      if (command === "lifecycle_result")
        await new Promise((resolve) => {
          acknowledge = resolve;
        });
    },
  });
  context.after(stop);

  receive({ payload: { requestId: "saved", action: "reload" } });
  await turn();
  reloadKey(target);
  acknowledge();
  await turn();
  assert.deepEqual(calls, [
    ["lifecycle_result", { requestId: "saved", saved: true }],
  ]);
});
