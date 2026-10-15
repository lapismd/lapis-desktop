import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nativeSession } from "./native-session.mjs";

test("native Close exits normally and persists geometry without Node or Deno on PATH", async (context) => {
  const session = await nativeSession("close");
  context.after(session.cleanup);
  await session.browser.execute(async () => {
    const { window, dpi } = globalThis.__TAURI__;
    const current = window.getCurrentWindow();
    await current.setSize(new dpi.LogicalSize(900, 640));
    await current.setPosition(new dpi.LogicalPosition(160, 100));
  });
  await session.browser.waitUntil(
    async () => (await session.browser.execute(() => innerWidth)) === 900,
  );
  await session.close();
  const state = JSON.parse(
    readFileSync(process.env.LAPIS_DESKTOP_ACCEPTANCE_STATE, "utf8"),
  );
  assert.ok(state.main.width > 0);
  assert.ok(state.main.height > 0);
});
test("a second cold process restores geometry and also exits normally", async (context) => {
  const session = await nativeSession("relaunch");
  context.after(session.cleanup);
  const dimensions = await session.browser.execute(() => ({
    width: innerWidth,
    height: innerHeight,
  }));
  assert.deepEqual(dimensions, { width: 900, height: 640 });
  await session.close();
});
