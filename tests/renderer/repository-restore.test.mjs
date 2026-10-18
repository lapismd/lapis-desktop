import test from "node:test";
import assert from "node:assert/strict";
import { RestoreController } from "../../src/lib/repository/restore.ts";
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
