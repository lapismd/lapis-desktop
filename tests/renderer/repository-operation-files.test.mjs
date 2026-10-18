import test from "node:test";
import assert from "node:assert/strict";
import { OperationController } from "../../src/lib/repository/operation-controller.ts";
import { operationFixture } from "../../catalog/support/repository/operations.ts";
import {
  operation,
  otherOperation,
  parent,
  revision,
} from "../../catalog/support/repository/fixture.ts";
function setup(scenario) {
  const f = operationFixture(scenario),
    errors = [];
  const c = new OperationController(f.reader, {
    report: (e) => errors.push(e),
    recovered() {},
  });
  return { ...f, c, errors };
}
async function select(f) {
  await f.c.refresh();
  await f.c.select(f.c.state.nodes[0]);
  await f.c.files.selectGroup(f.c.state.files.groups[0].change);
}
test("operation content uses the native exact pair and same pinned handle", async () => {
  const f = setup();
  await select(f);
  assert.equal(f.c.state.files.from, parent);
  assert.equal(f.c.state.files.to, revision);
  await f.c.files.selectPath("Welcome.md");
  assert.equal(f.c.state.files.diff.path, "Welcome.md");
  const [h, q] = f.calls.find(([, q]) => q?.kind === "diff");
  assert.equal(h, "handle-1");
  assert.equal(q.query.from, parent);
  assert.equal(q.query.to, revision);
  f.advance();
  await f.c.refresh();
  assert.equal(f.c.state.operation, operation);
  assert.equal(f.c.state.files.diff.path, "Welcome.md");
  await f.c.close();
  assert.deepEqual(f.errors, []);
});
test("ambiguous and unavailable operation comparisons never invent revision pairs", async () => {
  const f = setup("operation-ambiguous");
  await select(f);
  assert.equal(f.c.state.files.from, undefined);
  assert.equal(f.calls.filter(([, q]) => q?.kind === "diff_paths").length, 0);
  await f.c.files.compare("bad", revision);
  assert.equal(f.errors.length, 1);
  await f.c.files.compare(parent, revision);
  assert.equal(f.c.state.files.paths.length, 1);
  await f.c.close();
  const u = setup("operation-unavailable");
  await select(u);
  assert.equal(u.c.state.files.pathsReady, false);
  assert.equal(u.calls.filter(([, q]) => q?.kind === "diff_paths").length, 0);
  await u.c.close();
});
test("late operation files cannot return after collapse and selecting the same operation again", async () => {
  const f = setup();
  await select(f);
  let release;
  const read = f.reader.read;
  f.reader.read = (h, q) =>
    q.kind === "diff"
      ? new Promise((r) => (release = () => read(h, q).then(r)))
      : read(h, q);
  const old = f.c.files.selectPath("Welcome.md");
  await f.c.clearSelection();
  await f.c.select(f.c.state.nodes[0]);
  release();
  await old;
  assert.equal(f.c.state.files.diff, undefined);
  assert.equal(f.c.state.files.group, undefined);
  assert.equal(f.c.state.selected.id, operation);
  await f.c.close();
});
test("operation group pages reject wrong receipts and failed groups recover explicitly", async () => {
  const f = setup("operation-files-failure");
  await f.c.refresh();
  await f.c.select(f.c.state.nodes[0]);
  assert.equal(f.errors.length, 1);
  assert.equal(f.c.state.files.ready, false);
  f.recover();
  await f.c.files.retry();
  assert.equal(f.c.state.files.ready, true);
  const read = f.reader.read;
  f.reader.read = async (h, q) => {
    const r = await read(h, q);
    if (q.kind === "operation_changes") r.data.parent = operation;
    return r;
  };
  await f.c.selectParent(otherOperation);
  assert.equal(f.c.state.files.ready, false);
  assert.equal(f.errors.length, 2);
  await f.c.close();
});
