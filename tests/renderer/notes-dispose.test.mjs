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
      preflightNativeRecovery: async () => events.push("native-preflight"),
      guard: async (_, dispose) => {
        events.push("guard");
        return dispose();
      },
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

test("native Sync preparation drains before Desktop enters the session writer guard", async () => {
  const f = fixture();
  f.app.nativeSync = {
    prepareLeave: async () => {
      f.events.push("native-sync-prepare");
      return () => f.events.push("native-sync-resume");
    },
  };
  const guard = f.app.fileEditingSessions.guard;
  f.app.fileEditingSessions.guard = async (scope, action) => {
    assert.equal(f.events.includes("native-sync-prepare"), true);
    return guard(scope, action);
  };
  await disposeNotesWorkspace(f.app, f.options);
  assert.equal(
    f.events.indexOf("native-sync-prepare") < f.events.indexOf("watch-stop"),
    true,
  );
  assert.equal(
    f.events.indexOf("metadata-dispose") <
      f.events.indexOf("native-sync-resume"),
    true,
  );
});

test("Desktop waits for Sync preparation before stopping the original watcher", async () => {
  const f = fixture();
  const entered = Promise.withResolvers();
  const drained = Promise.withResolvers();
  let released = 0;
  f.app.nativeSync = {
    prepareLeave: async () => {
      entered.resolve();
      await drained.promise;
      return () => {
        released++;
      };
    },
  };
  const leaving = disposeNotesWorkspace(f.app, f.options);
  await entered.promise;
  assert.deepEqual(f.events, []);
  drained.resolve();
  await leaving;
  assert.equal(released, 1);
  assert.equal(f.events.at(-1), "complete");
});

test("Desktop releases the same Sync leave fence after refused final persistence", async () => {
  const f = fixture();
  let fenced = false;
  let preparations = 0;
  let releases = 0;
  const lease = {};
  f.app.nativeSync = {
    lease,
    prepareLeave: async () => {
      preparations++;
      fenced = true;
      return () => {
        fenced = false;
        releases++;
      };
    },
  };
  f.options.prepareLeave = () => {
    throw new Error("Final capture refused");
  };
  await assert.rejects(
    disposeNotesWorkspace(f.app, f.options),
    /Final capture refused/,
  );
  assert.equal(fenced, false);
  assert.equal(releases, 1);
  assert.equal(f.app.nativeSync.lease, lease);
  assert.equal(f.events.includes("metadata-dispose"), false);
  assert.equal(f.events.at(-1), "watch-resume");
  f.options.prepareLeave = async () => {};
  await disposeNotesWorkspace(f.app, f.options);
  assert.equal(preparations, 2);
  assert.equal(releases, 2);
});

test("Desktop releases preparation if watcher shutdown or transport cleanup fails", async () => {
  for (const boundary of ["watch", "metadata"]) {
    const f = fixture();
    let released = 0;
    f.app.nativeSync = {
      prepareLeave: async () => () => {
        released++;
      },
    };
    const fail = async () => {
      throw new Error(`${boundary} failed`);
    };
    if (boundary === "watch") f.app.vaultChanges.stop = fail;
    else f.app.metadataCache.dispose = fail;
    await assert.rejects(
      disposeNotesWorkspace(f.app, f.options),
      new RegExp(`${boundary} failed`),
    );
    assert.equal(released, 1);
    assert.equal(f.events.includes("complete"), false);
  }
});

test("native recovery preflight refusal preserves the same workspace and resumes watching", async () => {
  const f = fixture();
  const refusal = new Error(
    "Retained native editing requires review in Problems",
  );
  f.app.fileEditingSessions.preflightNativeRecovery = async () => {
    throw refusal;
  };
  await assert.rejects(
    disposeNotesWorkspace(f.app, f.options),
    (error) => error === refusal,
  );
  assert.equal(f.events.includes("workspace-dispose"), false);
  assert.equal(f.events.includes("popup-dispose"), false);
  assert.equal(f.events.includes("plugin-disable"), false);
  assert.equal(f.events.includes("metadata-dispose"), false);
  assert.equal(f.events.includes("complete"), false);
  assert.equal(f.events.at(-1), "watch-resume");
});

test("native recovery preflight precedes the guarded layout and destructive leave", async () => {
  const f = fixture();
  await disposeNotesWorkspace(f.app, f.options);
  assert.deepEqual(
    f.events.filter((event) =>
      [
        "guard",
        "layout",
        "native-preflight",
        "prepare",
        "workspace-dispose",
      ].includes(event),
    ),
    ["native-preflight", "guard", "layout", "prepare", "workspace-dispose"],
  );
});

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
