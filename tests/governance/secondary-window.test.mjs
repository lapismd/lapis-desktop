import { test } from "node:test";
import assert from "node:assert/strict";
import { openSecondaryWindow } from "../desktop/secondary-window.mjs";

function fixture(failSwitch = false) {
  const operations = [];
  const browser = {
    async execute(callback) {
      operations.push("invoke");
      return true;
    },
    async waitUntil(check) {
      assert.equal(await check(), true);
    },
    async getWindowHandles() {
      operations.push("enumerate");
      return ["main", "acp-other"];
    },
    async switchToWindow(label) {
      operations.push(`switch:${label}`);
      if (failSwitch) throw new Error("No such window: acp-other");
    },
    async closeWindow() {
      operations.push("close");
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
  assert.deepEqual(operations.slice(-2), ["close", "switch:main"]);
});

test("an enumerated window that disappears fails without recreation or retry", async () => {
  const { session, operations } = fixture(true);
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
