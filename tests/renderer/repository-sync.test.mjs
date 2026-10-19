import { test } from "node:test";
import assert from "node:assert/strict";
import { SyncController } from "../../src/lib/repository/sync-controller.ts";
import { nativeSync } from "../../src/lib/native/repository/sync.ts";
const deferred = () => {
  let resolve;
  return {
    promise: new Promise((r) => (resolve = r)),
    resolve: (v) => resolve(v),
  };
};
const checkpoint = (commit) => ({
  commit,
  operation: "op",
  change_id: "change",
  description: "Checkpoint",
  timestamp_millis: 1,
});
function fixture() {
  const calls = [],
    errors = [];
  let retained;
  let guarded = false;
  const proposal = {
    local: checkpoint("local"),
    incoming: checkpoint("remote"),
    candidate: checkpoint("merged"),
    conflicts: [],
  };
  const remote = {
    status: async () => ({
      revision: 2,
      configuration: {
        account: "a",
        project: "owner/notes",
        target: { url: "https://github.com/owner/notes.git", branch: "main" },
        canPush: true,
      },
    }),
    keepCurrent: async () => calls.push("capture-barrier"),
  };
  const service = {
    prepare: async () => {
      calls.push("prepare");
      return proposal;
    },
    preview: async (candidate, revision) => {
      assert(guarded);
      assert.equal(revision, 2);
      return {
        checkpoint: candidate,
        expected: "saved",
        added: 1,
        modified: 0,
        deleted: 0,
      };
    },
    apply: async (request, revision) => {
      assert(guarded);
      assert.equal(revision, 2);
      assert.deepEqual(retained.request, request);
      calls.push("apply");
    },
    publish: async () => {
      calls.push("publish");
      return "complete";
    },
    conflict: async (_, path) => ({ path, terms: [] }),
    resolve: async () => checkpoint("resolved"),
  };
  const recovery = {
    load: async () => retained,
    save: async (value) => {
      retained = value;
      calls.push(value ? "persist" : "clear");
    },
  };
  const guard = async (action) => {
    assert(!guarded);
    guarded = true;
    try {
      return await action();
    } finally {
      guarded = false;
    }
  };
  const controller = new SyncController(
    remote,
    service,
    guard,
    { report: (error) => errors.push(error), recovered: () => {} },
    recovery,
  );
  let state;
  controller.subscribe((value) => (state = value));
  return {
    controller,
    calls,
    errors,
    remote,
    service,
    recovery,
    proposal,
    get retained() {
      return retained;
    },
    get state() {
      return state;
    },
  };
}
test("automatic sync persists a guarded apply before publication and coalesces concurrent wakeups", async () => {
  const f = fixture();
  const gate = deferred();
  f.service.prepare = async () => {
    f.calls.push("prepare");
    await gate.promise;
    return f.proposal;
  };
  const first = f.controller.run();
  assert.equal(f.controller.run(), first);
  gate.resolve();
  await first;
  assert.deepEqual(f.calls, [
    "prepare",
    "persist",
    "apply",
    "clear",
    "publish",
  ]);
  assert.equal(f.retained, undefined);
  assert.equal(f.state.phase, "ready");
  assert.equal(f.errors.length, 0);
});
test("conflicted proposals never apply or publish and resolution preserves the selected candidate", async () => {
  const f = fixture();
  f.proposal.conflicts = ["Note.md"];
  await f.controller.run();
  assert.equal(f.state.phase, "conflicts");
  assert(!f.calls.includes("apply"));
  assert(!f.calls.includes("publish"));
  await f.controller.inspect("Note.md");
  assert.equal(f.state.conflict.path, "Note.md");
  f.service.resolve = async (candidate, path, resolution) => {
    assert.equal(candidate, "merged");
    assert.equal(path, "Note.md");
    assert.equal(resolution.kind, "text");
    f.proposal.candidate = checkpoint("resolved");
    f.proposal.conflicts = [];
    return checkpoint("resolved");
  };
  await f.controller.resolve("Note.md", {
    kind: "text",
    text: "merged",
    executable: false,
  });
  assert(f.calls.includes("publish"));
});
test("unknown apply keeps the original request for recovery and later saves cannot clear it prematurely", async () => {
  const f = fixture();
  let original;
  f.service.apply = async (request) => {
    original ??= request;
    assert.deepEqual(request, original);
    if (f.calls.filter((v) => v === "unknown").length === 0) {
      f.calls.push("unknown");
      throw Error("response lost");
    }
    f.calls.push("reconciled");
  };
  await f.controller.run();
  assert.equal(f.errors.length, 1);
  assert.equal(f.state.recovery, true);
  assert.deepEqual(f.retained.request, original);
  assert(!f.calls.includes("publish"));
  f.service.prepare = async () => null;
  await f.controller.run();
  assert(f.calls.includes("reconciled"));
  assert.equal(f.retained, undefined);
  assert.equal(f.state.recovery, false);
});
test("closing during a remote fetch fences all later file writes and does not await the network", async () => {
  const f = fixture();
  const gate = deferred();
  f.service.prepare = async () => {
    f.calls.push("prepare");
    return gate.promise;
  };
  const run = f.controller.run();
  while (!f.calls.includes("prepare")) await Promise.resolve();
  f.controller.close();
  let drained = false;
  void f.controller.drained().then(() => (drained = true));
  await Promise.resolve();
  assert.equal(drained, false);
  gate.resolve(f.proposal);
  await run;
  await f.controller.drained();
  assert(!f.calls.includes("apply"));
  assert(!f.calls.includes("publish"));
  assert.equal(drained, true);
});
test("pausing automatic sync preserves local history and keep-current waits for its native barrier", async () => {
  const f = fixture();
  f.controller.setEnabled(false);
  await f.controller.run();
  assert.deepEqual(f.calls, []);
  f.controller.setEnabled(true);
  f.service.apply = async () => {
    throw Error("unknown");
  };
  await f.controller.run();
  const gate = deferred();
  f.remote.keepCurrent = async () => {
    f.calls.push("capture-barrier");
    await gate.promise;
  };
  const kept = f.controller.keepCurrent();
  await Promise.resolve();
  assert(f.retained);
  gate.resolve();
  await kept;
  assert.equal(f.retained, undefined);
  assert.equal(f.state.recovery, false);
});
test("native sync frames carry only admitted session, revision and owned exact actions", async () => {
  const frames = [];
  const service = nativeSync("opaque", async (command, args) => {
    frames.push({ command, ...args });
    return null;
  });
  await service.prepare(2);
  await service.preview("merged", 2);
  await service.apply(
    { request_id: "stable", checkpoint: "merged", expected: "saved" },
    2,
  );
  await service.publish(2, "push-id");
  assert(frames.every((frame) => frame.command === "desktop_backup_sync"));
  assert.deepEqual(frames[0].request, {
    sessionId: "opaque",
    action: { kind: "prepare", revision: 2 },
  });
  assert.equal(frames[2].request.action.request.request_id, "stable");
  assert.equal(frames[3].request.action.request_id, "push-id");
});
test("a cold sync recovery clears only its loaded original record and rejects malformed recovery before mutation", async () => {
  const { syncRecovery } = await import(
    "../../src/lib/repository/sync-recovery.ts"
  );
  const pending = {
    version: 1,
    revision: 2,
    request: {
      request_id: "original",
      checkpoint: "merged",
      expected: "saved",
    },
  };
  let data = { pendingSync: pending, otherSetting: true };
  const owner = {
    loadData: async () => data,
    saveData: async (next) => (data = next),
  };
  const recovery = syncRecovery(owner);
  assert.deepEqual(await recovery.load(), pending);
  await recovery.save();
  assert.equal(data.pendingSync, null);
  assert.equal(data.otherSetting, true);
  data.pendingSync = pending;
  await recovery.load();
  data.pendingSync = {
    ...pending,
    request: { ...pending.request, request_id: "newer" },
  };
  await recovery.save();
  assert.equal(data.pendingSync.request.request_id, "newer");
  const f = fixture();
  f.recovery.load = async () => ({ version: 90 });
  await f.controller.run();
  assert.equal(f.state.phase, "attention");
  assert.equal(f.state.recovery, true);
  assert.equal(f.calls.length, 0);
  assert.equal(f.errors.length, 1);
});
test("offline backoff survives new checkpoints and disabling or closing stops automatic network work", async (t) => {
  const { RepositorySync } = await import(
    "../../src/components/repository/repository-sync.ts"
  );
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1000 });
  t.after(() => t.mock.timers.reset());
  let listener,
    attempts = 0,
    data = {};
  const progress = { report() {}, complete() {}, fail() {} };
  const plugin = {
    id: "repository-history",
    app: {
      notifications: { createProgress: () => progress },
      fileEditingSessions: { guard: async (_path, action) => action() },
    },
    loadData: async () => data,
    saveData: async (value) => (data = value),
    feedback: () => ({ report() {}, recovered() {} }),
    addCommand() {},
    backup: {
      controller: {
        subscribe(callback) {
          listener = callback;
          callback({ phase: "ready", checkpoint: checkpoint("initial") });
          return () => {
            listener = undefined;
          };
        },
      },
    },
  };
  const services = {
    remote: {
      status: async () => ({ revision: 1, configuration: { canPush: true } }),
    },
    sync: {
      prepare: async () => {
        attempts++;
        throw Error("offline");
      },
    },
  };
  const sync = new RepositorySync(plugin, services);
  await sync.start();
  const flush = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  };
  t.mock.timers.tick(1000);
  await flush();
  assert.equal(attempts, 1);
  listener({ phase: "ready", checkpoint: checkpoint("new-save") });
  t.mock.timers.tick(5000);
  await flush();
  assert.equal(attempts, 1, "local captures must not bypass remote backoff");
  t.mock.timers.tick(115000);
  await flush();
  assert.equal(attempts, 2);
  await sync.setEnabled(false);
  t.mock.timers.tick(1000000);
  await flush();
  assert.equal(attempts, 2);
  sync.close();
  t.mock.timers.tick(1000000);
  await flush();
  assert.equal(attempts, 2);
});
test("automatic retries retain a dismissed failure episode until actual recovery", async () => {
  const f = fixture();
  f.service.prepare = async () => {
    throw Error("offline");
  };
  await f.controller.run();
  await f.controller.run();
  assert.equal(f.errors.length, 1);
  f.service.prepare = async () => null;
  await f.controller.run();
  f.service.prepare = async () => {
    throw Error("offline");
  };
  await f.controller.run();
  assert.equal(f.errors.length, 2);
});

test("explicit fetch never applies files or publishes, including with automatic sync paused", async () => {
  const f = fixture();
  f.remote.fetch = async (revision) => {
    assert.equal(revision, 2);
    f.calls.push("fetch");
    return f.remote.status();
  };
  f.controller.setEnabled(false);
  await f.controller.run("fetch");
  assert.deepEqual(f.calls, ["fetch"]);
  f.controller.close();
});
test("explicit pull applies with the existing guard but never publishes", async () => {
  const f = fixture();
  f.controller.setEnabled(false);
  await f.controller.run("pull");
  assert.deepEqual(f.calls, ["prepare", "persist", "apply", "clear"]);
  assert.equal(f.state.phase, "paused");
  f.controller.close();
});
test("explicit push captures saved files, publishes and refreshes upstream counts", async () => {
  const f = fixture();
  const snapshot = await f.remote.status();
  f.remote.fetch = async () => {
    f.calls.push("fetch-counts");
    return { ...snapshot, divergence: { incoming: 0, outgoing: 0 } };
  };
  await f.controller.run("push");
  assert.deepEqual(f.calls, ["capture-barrier", "publish", "fetch-counts"]);
  assert.equal(f.state.upstream.divergence.outgoing, 0);
  f.controller.close();
});
test("a count refresh failure cannot fail or replay a confirmed push", async () => {
  const f = fixture();
  f.remote.fetch = async () => {
    throw Error("offline after push");
  };
  await f.controller.run("push");
  assert.deepEqual(f.calls, ["capture-barrier", "publish"]);
  assert.equal(f.state.phase, "ready");
  assert.equal(f.state.upstream.divergence, null);
  assert.deepEqual(f.errors, []);
  f.controller.close();
});

test("pull conflict resolution retains pull-only intent and never publishes", async () => {
  const f = fixture();
  f.proposal.conflicts = ["Note.md"];
  await f.controller.run("pull");
  f.proposal.conflicts = [];
  await f.controller.resolve("Note.md", { kind: "delete" });
  assert(f.calls.includes("apply"));
  assert(!f.calls.includes("publish"));
  f.controller.close();
});
test("push cannot replay a pending apply, and read-only accounts cannot publish", async () => {
  const f = fixture();
  f.recovery.load = async () => ({
    version: 1,
    revision: 2,
    request: { request_id: "original", checkpoint: "saved", expected: "tree" },
  });
  await f.controller.run("push");
  assert.deepEqual(f.calls, []);
  assert.equal(f.state.recovery, true);
  f.controller.close();
  const r = fixture(),
    status = await r.remote.status();
  r.remote.status = async () => ({
    ...status,
    configuration: { ...status.configuration, canPush: false },
  });
  await r.controller.run("push");
  assert.deepEqual(r.calls, []);
  assert.match(r.errors[0].message, /cannot push/);
  r.controller.close();
});
