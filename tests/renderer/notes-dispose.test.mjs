import { test } from "node:test";
import assert from "node:assert/strict";
import { disposeNotesWorkspace } from "../../src/lib/notes/notes-dispose.ts";

function fixture() {
  const events = [];
  let live = true;
  const app = {
    vaultChanges: {
      stop: async () => events.push("watch-stop"),
      start: async () => events.push("watch-resume"),
    },
    workspace: {
      flushPluginChanges: async () => events.push("flush"),
      flushLayout: async () => events.push("layout"),
      disposeWorkspaceHost: async () => events.push("workspace-dispose"),
    },
    plugins: {
      flushPendingConfigWrites: async () => events.push("config"),
      plugins: new Map([
        ["plugin", { disable: async () => events.push("plugin-disable") }],
      ]),
    },
    fileEditingSessions: {
      settleOperations: async () => events.push("settle"),
      guard: async (_, dispose) => dispose(),
    },
    metadataCache: { dispose: async () => events.push("metadata-dispose") },
  };
  const options = {
    popouts: { dispose: async () => events.push("popup-dispose") },
    prepareLeave: () => events.push("prepare"),
    beforeDispose: () => {
      live = false;
      events.push("before-dispose");
    },
    disposeSync: async () => events.push("sync-dispose"),
    disposeSettings: () => events.push("settings-dispose"),
    disposeBrowser: () => events.push("browser-dispose"),
    complete: () => events.push("complete"),
    canResume: () => live,
  };
  return { app, options, events };
}

test("workspace teardown captures live view state before shell unmount", async () => {
  const f = fixture();
  let livePin = "exact historical operation",
    savedPin;
  f.options.beforeDispose = () => {
    queueMicrotask(() => {
      livePin = undefined;
    });
  };
  f.app.workspace.disposeWorkspaceHost = async () => {
    // The public host first joins projection and layout persistence.
    await Promise.resolve();
    savedPin = livePin;
    f.events.push("workspace-dispose");
  };
  await disposeNotesWorkspace(f.app, f.options);
  assert.equal(savedPin, "exact historical operation");
});

test("workspace teardown joins shell cleanup before retiring plugin resources", async () => {
  const f = fixture();
  const entered = Promise.withResolvers(),
    unmounted = Promise.withResolvers();
  f.options.beforeDispose = async () => {
    entered.resolve();
    await unmounted.promise;
  };
  const leaving = disposeNotesWorkspace(f.app, f.options);
  await entered.promise;
  await new Promise((resolve) => setImmediate(resolve));
  try {
    assert.equal(f.events.includes("workspace-dispose"), true);
    assert.equal(f.events.includes("metadata-dispose"), false);
    assert.equal(f.events.includes("plugin-disable"), false);
  } finally {
    unmounted.resolve();
    await leaving;
  }
  assert.equal(f.events.includes("plugin-disable"), true);
});

test("an unresolved native window keeps plugin and metadata owners alive until it retires", async () => {
  const f = fixture();
  const gate = Promise.withResolvers(),
    entered = Promise.withResolvers();
  f.options.popouts.dispose = async () => {
    f.events.push("popup-dispose");
    entered.resolve();
    await gate.promise;
  };
  const leaving = disposeNotesWorkspace(f.app, f.options);
  await entered.promise;
  assert.equal(f.events.includes("workspace-dispose"), true);
  assert.equal(f.events.includes("metadata-dispose"), false);
  assert.equal(f.events.includes("plugin-disable"), false);
  assert.equal(f.events.includes("complete"), false);
  gate.resolve();
  await leaving;
  assert.equal(f.events.at(-1), "complete");
  assert.equal(f.events.includes("watch-resume"), false);
});

test("a failed writer guard retains workspace and popup owners and resumes the original watcher", async () => {
  const f = fixture();
  f.app.fileEditingSessions.guard = async () => {
    throw new Error("Unsaved note");
  };
  await assert.rejects(disposeNotesWorkspace(f.app, f.options), /Unsaved note/);
  assert.equal(f.events.includes("workspace-dispose"), false);
  assert.equal(f.events.includes("popup-dispose"), false);
  assert.equal(f.events.includes("plugin-disable"), false);
  assert.equal(f.events.at(-1), "watch-resume");
});

test("asynchronous final persistence completes before destructive workspace teardown", async () => {
  const f = fixture();
  const gate = Promise.withResolvers();
  const entered = Promise.withResolvers();
  f.options.prepareLeave = () => {
    f.events.push("prepare");
    entered.resolve();
    return gate.promise;
  };
  const leaving = disposeNotesWorkspace(f.app, f.options);
  await entered.promise;
  try {
    assert.equal(f.events.includes("before-dispose"), false);
    assert.equal(f.events.includes("workspace-dispose"), false);
    assert.equal(f.events.includes("plugin-disable"), false);
  } finally {
    gate.resolve();
    await leaving;
  }
});

test("failed final persistence leaves the original workspace available for retry", async () => {
  const f = fixture();
  const failed = Promise.reject(new Error("Final backup capture failed"));
  void failed.catch(() => {});
  f.options.prepareLeave = () => failed;
  await assert.rejects(
    disposeNotesWorkspace(f.app, f.options),
    /Final backup capture failed/,
  );
  assert.equal(f.events.includes("before-dispose"), false);
  assert.equal(f.events.includes("workspace-dispose"), false);
  assert.equal(f.events.includes("popup-dispose"), false);
  assert.equal(f.events.includes("plugin-disable"), false);
  assert.equal(f.events.includes("metadata-dispose"), false);
  assert.equal(f.events.at(-1), "watch-resume");
  f.options.prepareLeave = async () => f.events.push("prepare-retry");
  await disposeNotesWorkspace(f.app, f.options);
  assert.equal(f.events.at(-1), "complete");
});

test("final backup rejection during plugin shutdown must not leave a destroyed workspace", async () => {
  const f = fixture();
  const failed = Promise.reject(new Error("Final backup capture failed"));
  void failed.catch(() => {});
  const finalCapture = () => failed;
  f.options.prepareLeave = finalCapture;
  f.app.plugins.plugins.get("plugin").disable = finalCapture;
  await assert.rejects(
    disposeNotesWorkspace(f.app, f.options),
    /Final backup capture failed/,
  );
  assert.equal(f.events.includes("before-dispose"), false);
  assert.equal(f.events.includes("workspace-dispose"), false);
  assert.equal(f.events.includes("metadata-dispose"), false);
  assert.equal(f.events.at(-1), "watch-resume");
});
