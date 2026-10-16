import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { nativeSession } from "./native-session.mjs";

test("native watch channels scope real changes and retire on subscription or admission close", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "watch-"),
  );
  const vault = join(root, "Watch café");
  mkdirSync(join(vault, "Notes"), { recursive: true });
  const session = await nativeSession("native-watch", root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  const selected = await session.browser.execute(async () => {
    const { invoke, Channel } = globalThis.__TAURI__.core;
    const selected = await invoke("vault_select", {});
    window.__watchBatches = [];
    const channel = new Channel((batch) => window.__watchBatches.push(batch));
    const watchId = await invoke("vault_watch_start", {
      sessionId: selected.sessionId,
      path: "Notes",
      recursive: true,
      onChange: channel,
    });
    return { ...selected, watchId };
  });
  writeFileSync(join(vault, "outside.md"), "not in this scope");
  writeFileSync(join(vault, "Notes/café.md"), "one");
  const observed = async (type, path) =>
    session.browser.waitUntil(async () =>
      session.browser.execute(
        (type, path) =>
          window.__watchBatches.some((batch) =>
            batch.changes.some(
              (change) => change.type === type && change.path === path,
            ),
          ),
        type,
        path,
      ),
    );
  await observed("create", "Notes/café.md");
  writeFileSync(join(vault, "Notes/café.md"), "changed body");
  await observed("modify", "Notes/café.md");
  renameSync(join(vault, "Notes/café.md"), join(vault, "Notes/笔记.md"));
  await observed("create", "Notes/笔记.md");
  unlinkSync(join(vault, "Notes/笔记.md"));
  await observed("delete", "Notes/笔记.md");
  const frames = await session.browser.execute(() => window.__watchBatches);
  assert.ok(
    frames.every((frame) =>
      frame.changes.every(
        (change) => change.path === "Notes" || change.path.startsWith("Notes/"),
      ),
    ),
  );
  assert.ok(
    frames.some((frame) =>
      frame.changes.some((change) => change.previousPath === "Notes/café.md"),
    ),
  );
  assert.ok(
    frames.every(
      (frame, index) =>
        index === 0 || frame.sequence > frames[index - 1].sequence,
    ),
  );
  await session.browser.execute(
    async ({ sessionId, watchId }) =>
      globalThis.__TAURI__.core.invoke("vault_watch_stop", {
        sessionId,
        watchId,
      }),
    selected,
  );
  const before = await session.browser.execute(
    () => window.__watchBatches.length,
  );
  writeFileSync(join(vault, "Notes/stopped.md"), "stopped");
  await session.browser.execute(async (selected) => {
    const { invoke, Channel } = globalThis.__TAURI__.core;
    window.__retiredWatchBatches = [];
    await invoke("vault_watch_start", {
      sessionId: selected.sessionId,
      path: "",
      recursive: true,
      onChange: new Channel((batch) =>
        window.__retiredWatchBatches.push(batch),
      ),
    });
    await invoke("vault_close", { sessionId: selected.sessionId });
  }, selected);
  writeFileSync(join(vault, "Notes/closed.md"), "closed");
  // A native shell round-trip and rendered frame observe the retired callbacks.
  await session.browser.execute(async () => {
    await globalThis.__TAURI__.core.invoke("shell_info");
    await new Promise((done) => requestAnimationFrame(done));
  });
  assert.equal(
    await session.browser.execute(() => window.__watchBatches.length),
    before,
  );
  assert.equal(
    await session.browser.execute(() => window.__retiredWatchBatches.length),
    0,
  );
  await session.close();
});

test("renderer watch bridge awaits registration and stops actual native delivery", async (context) => {
  const root = mkdtempSync(
    join(process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT, "bridge-watch-"),
  );
  const vault = join(root, "Bridge watch vault");
  mkdirSync(join(vault, "Notes"), { recursive: true });
  const session = await nativeSession("bridge-watch", root);
  context.after(session.cleanup);
  writeFileSync(join(root, "picker.json"), JSON.stringify(vault));
  await session.browser.execute(async () => {
    const driver = globalThis.__lapisNativeWatchAcceptance;
    const selected = await driver.open();
    await driver.start(selected);
  });
  writeFileSync(join(vault, "Notes/café.md"), "native bridge event");
  await session.browser.waitUntil(async () =>
    session.browser.execute(() =>
      globalThis.__lapisNativeWatchAcceptance
        .events()
        .some(
          (event) => event.type === "create" && event.path === "Notes/café.md",
        ),
    ),
  );
  await session.browser.execute(async () =>
    globalThis.__lapisNativeWatchAcceptance.close(),
  );
  const before = await session.browser.execute(
    () => globalThis.__lapisNativeWatchAcceptance.events().length,
  );
  writeFileSync(join(vault, "Notes/retired.md"), "closed");
  await session.browser.execute(async () => {
    await globalThis.__TAURI__.core.invoke("shell_info");
    await new Promise((done) => requestAnimationFrame(done));
  });
  assert.equal(
    await session.browser.execute(
      () => globalThis.__lapisNativeWatchAcceptance.events().length,
    ),
    before,
  );
  await session.close();
});
