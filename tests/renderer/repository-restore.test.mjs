import test from "node:test";
import assert from "node:assert/strict";
import { RestoreController } from "@lapismd/repository-ui/history";
import { restoreRecovery } from "../../src/lib/repository/restore-recovery.ts";
function fixture() {
  const calls = [],
    errors = [],
    states = [];
  const service = {
    async preview(checkpoint, path) {
      calls.push("preview");
      return { checkpoint, path, expected: "hash", bytes: 10, deleted: false };
    },
    async apply(request) {
      calls.push({ ...request });
    },
  };
  const guard = async (path, action) => {
    calls.push(`protect:${path}`);
    try {
      return await action();
    } finally {
      calls.push("release");
    }
  };
  const c = new RestoreController(service, guard, {
    report: (e) => errors.push(e),
    recovered() {},
  });
  c.subscribe((state) => states.push(state));
  return { c, service, calls, errors, states };
}
test("restore protects editor writers during both preview and apply", async () => {
  const f = fixture();
  await f.c.prepare("commit", "Note.md");
  assert.deepEqual(f.calls, ["protect:Note.md", "preview", "release"]);
  assert.equal(f.states.at(-1).open, true);
  await f.c.apply();
  assert.equal(f.calls[3], "protect:Note.md");
  assert.equal(f.calls.at(-1), "release");
  assert.equal(f.states.at(-1).open, false);
  assert.equal(f.errors.length, 0);
});
test("unknown restore outcome keeps the original request id and expected disk version for retry", async () => {
  const f = fixture();
  await f.c.prepare("commit", "Note.md");
  let attempts = 0;
  f.service.apply = async (request) => {
    f.calls.push({ ...request });
    if (++attempts === 1) throw new Error("Response lost");
  };
  await f.c.apply();
  assert.equal(f.states.at(-1).open, true);
  assert.equal(f.errors.at(-1).message, "Response lost");
  await f.c.apply();
  assert.deepEqual(
    f.calls.filter((c) => typeof c === "object")[0],
    f.calls.filter((c) => typeof c === "object")[1],
  );
  assert.equal(f.states.at(-1).open, false);
});
test("a failed editor guard never reaches native restore", async () => {
  let called = false;
  const errors = [];
  const c = new RestoreController(
    {
      preview() {
        called = true;
      },
      apply() {
        called = true;
      },
    },
    async () => {
      throw new Error("Editor save failed");
    },
    { report: (e) => errors.push(e), recovered() {} },
  );
  await c.prepare("commit", "Note.md");
  assert.equal(called, false);
  assert.equal(errors[0].message, "Editor save failed");
});
test("closing a restore view fences a delayed preview and its feedback", async () => {
  const f = fixture();
  let resolve;
  f.service.preview = () => new Promise((r) => (resolve = r));
  const pending = f.c.prepare("commit", "Note.md");
  f.c.close();
  resolve({
    checkpoint: "commit",
    path: "Note.md",
    expected: "hash",
    bytes: 10,
    deleted: false,
  });
  await pending;
  assert.equal(f.states.at(-1).preview, undefined);
  assert.equal(f.errors.length, 0);
});
test("whole-vault restore protects every editor and retains one command across retries", async () => {
  const f = fixture();
  f.service.previewVault = async (checkpoint) => ({
    checkpoint,
    expected: "tree",
    added: 1,
    modified: 2,
    deleted: 3,
  });
  const requests = [];
  f.service.applyVault = async (request) => {
    requests.push({ ...request });
    if (requests.length === 1) throw new Error("Interrupted vault restore");
  };
  await f.c.prepare("commit", "Note.md");
  await f.c.prepareVault("checkpoint");
  assert.equal(f.states.at(-1).request, undefined);
  assert.equal(f.states.at(-1).vault.modified, 2);
  await f.c.apply();
  await f.c.apply();
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(
    f.calls.filter((call) => call === "protect:undefined").length,
    3,
  );
  assert.equal(f.states.at(-1).open, false);
});
test("cold restore controller reconciles its persisted original request", async () => {
  let pending;
  const requests = [];
  const service = {
    async preview(checkpoint, path) {
      return {
        checkpoint,
        path,
        expected: "a".repeat(64),
        bytes: 1,
        deleted: false,
      };
    },
    async apply(request) {
      requests.push({ ...request });
      if (requests.length === 1) throw new Error("Lost response");
    },
  };
  const feedback = { report() {}, recovered() {} };
  const guard = async (_path, action) => action();
  const persist = async (value) => {
    pending = value ? structuredClone(value) : undefined;
  };
  const first = new RestoreController(service, guard, feedback, persist);
  await first.prepare("b".repeat(40), "Note.md");
  await first.apply();
  first.close();
  const second = new RestoreController(service, guard, feedback, persist);
  second.recover(restoreRecovery(pending));
  await second.apply();
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(pending, undefined);
});
test("a failed pending-command save never reaches native mutation", async () => {
  let applied = false;
  const errors = [];
  const c = new RestoreController(
    {
      async preview(checkpoint, path) {
        return { checkpoint, path, expected: "hash", bytes: 1, deleted: false };
      },
      async apply() {
        applied = true;
      },
    },
    async (_path, action) => action(),
    { report: (e) => errors.push(e), recovered() {} },
    async () => {
      throw new Error("Cannot save recovery state");
    },
  );
  await c.prepare("commit", "Note.md");
  await c.apply();
  assert.equal(applied, false);
  assert.equal(errors.at(-1).message, "Cannot save recovery state");
  assert.throws(
    () =>
      restoreRecovery({
        version: 1,
        scope: "file",
        request: {
          request_id: "stable",
          checkpoint: "b".repeat(40),
          expected: "a".repeat(64),
          path: "../escape",
        },
      }),
    /Invalid/,
  );
});
test("keeping current files confirms the native worker barrier before clearing recovery", async () => {
  const order = [];
  const service = {
    async preview() {},
    async apply() {},
    async keepCurrent() {
      order.push("worker-barrier");
    },
  };
  const c = new RestoreController(
    service,
    async (_path, action) => {
      order.push("protect-all");
      return action();
    },
    { report() {}, recovered() {} },
    async () => {
      order.push("clear-recovery");
    },
  );
  c.recover({
    version: 1,
    scope: "vault",
    request: {
      request_id: "stable",
      checkpoint: "a".repeat(40),
      expected: "b".repeat(40),
    },
  });
  await c.keepCurrent();
  assert.deepEqual(order, ["protect-all", "worker-barrier", "clear-recovery"]);
});
