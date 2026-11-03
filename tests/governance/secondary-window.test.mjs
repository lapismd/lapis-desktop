import { test } from "node:test";
import assert from "node:assert/strict";
import { openSecondaryWindow } from "../desktop/secondary-window.mjs";

function fixture(failSwitch, failClose = false) {
  const operations = [];
  let closed = false;
  const browser = {
    async execute(callback, operation) {
      if (operation === "close-current-window") {
        operations.push("close");
        if (failClose) throw new Error("No such window: acp-other");
        closed = true;
        return true;
      }
      operations.push("invoke");
      return true;
    },
    async waitUntil(check) {
      assert.equal(await check(), true);
    },
    async getWindowHandles() {
      operations.push("enumerate");
      return closed ? ["main"] : ["main", "acp-other"];
    },
    async switchToWindow(label) {
      operations.push(`switch:${label}`);
      if (failSwitch === label) throw new Error(`No such window: ${label}`);
    },
  };
  return { session: { id: "isolated:123", browser }, operations };
}

test("caller-isolation fixture owns create, IPC readiness and explicit close without activation", async () => {
  const { session, operations } = fixture();
  const close = await openSecondaryWindow(session);
  assert.deepEqual(operations, [
    "invoke",
    "enumerate",
    "switch:acp-other",
    "invoke",
  ]);
  await close();
  assert.deepEqual(operations.slice(-5), [
    "enumerate",
    "close",
    "enumerate",
    "switch:main",
    "enumerate",
  ]);
});

test("an enumerated window that disappears fails without recreation or retry", async () => {
  const { session, operations } = fixture("acp-other");
  let creations = 0;
  await assert.rejects(
    openSecondaryWindow(session, async () => {
      creations++;
    }),
    /No such window/u,
  );
  assert.equal(creations, 1);
  assert.deepEqual(operations, ["enumerate", "switch:acp-other"]);
});

test("a window that disappears before native close fails without recreation or retry", async () => {
  const { session, operations } = fixture(undefined, true);
  let creations = 0;
  const close = await openSecondaryWindow(session, async () => {
    creations++;
  });
  await assert.rejects(close(), /No such window: acp-other/u);
  assert.equal(creations, 1);
  assert.deepEqual(operations.slice(-3), ["enumerate", "close", "enumerate"]);
});

test("a failed main-window restore retains the original error without recreating", async () => {
  const { session, operations } = fixture("main");
  let creations = 0;
  const close = await openSecondaryWindow(session, async () => {
    creations++;
  });
  await assert.rejects(close(), /No such window: main/u);
  assert.equal(creations, 1);
  assert.deepEqual(operations.slice(-5), [
    "enumerate",
    "close",
    "enumerate",
    "switch:main",
    "enumerate",
  ]);
});
