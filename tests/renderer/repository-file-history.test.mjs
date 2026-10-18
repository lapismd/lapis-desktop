import test from "node:test";
import assert from "node:assert/strict";
import { FileHistoryController } from "../../src/lib/repository/file-history-controller.ts";
import {
  historyFixture,
  operation,
  otherOperation,
  revision,
} from "../../catalog/support/repository/fixture.ts";
function setup(scenario) {
  const f = historyFixture(scenario),
    errors = [];
  const c = new FileHistoryController(f.reader, {
    report: (e) => errors.push(e),
    recovered() {},
  });
  return { ...f, c, errors };
}
async function until(predicate) {
  for (let i = 0; i < 100 && !predicate(); i++)
    await new Promise((r) => setTimeout(r, 0));
  assert.ok(predicate());
}
test("file history is lazy and queries the native literal-path predicate at one pin", async () => {
  const f = setup();
  await f.c.follow();
  assert.equal(f.calls.length, 0);
  await f.c.follow("Welcome.md");
  assert.deepEqual(
    f.c.state.commits.map((c) => c.id),
    [revision],
  );
  const [h, q] = f.calls.find(
    ([, q]) => q?.kind === "graph" && q.query[0].revset.includes("files("),
  );
  assert.equal(h, "handle-1");
  assert.equal(q.query[0].revset, 'all() & files(root-file:"Welcome.md")');
  assert.equal(q.query[0].workspace, "default");
  assert.equal(f.calls.filter(([, q]) => q?.kind === "diff_paths").length, 0);
  await f.c.close();
  assert.deepEqual(f.closed, ["handle-1"]);
  assert.deepEqual(f.errors, []);
});
test("quotes and fileset-looking characters stay literal path data", async () => {
  const f = setup();
  const path = 'notes/a"b (all()).md';
  await f.c.follow(path);
  const [, q] = f.calls.find(
    ([, q]) => q?.kind === "graph" && q.query[0].revset.includes("files("),
  );
  assert.equal(
    q.query[0].revset,
    `all() & files(root-file:${JSON.stringify(path)})`,
  );
  await f.c.close();
});
test("changing file scope clears its blame anchor before admission or an empty editor", async () => {
  const f = setup();
  await f.c.follow("Welcome.md");
  assert.equal(f.c.state.workspaceCommit, revision);
  await f.c.follow();
  assert.equal(f.c.state.workspaceCommit, undefined);
  await f.c.follow("Welcome.md");
  f.reader.heads = async () => {
    throw new Error("Read denied");
  };
  await f.c.follow("Other.md");
  assert.equal(f.c.state.workspaceCommit, undefined);
  assert.equal(f.c.state.phase, "unavailable");
  await f.c.close();
});
test("file switches fence late native query replies and close the prior handle", async () => {
  const f = setup(),
    read = f.reader.read;
  let release;
  f.reader.read = async (h, q) => {
    if (
      q.kind === "graph" &&
      q.query[0].revset?.includes('root-file:"Welcome.md"')
    )
      await new Promise((r) => {
        release = r;
      });
    return read(h, q);
  };
  const old = f.c.follow("Welcome.md");
  await until(() => release);
  await f.c.follow("Other.md");
  release();
  await old;
  assert.equal(f.c.state.path, "Other.md");
  assert.equal(f.c.state.commits.length, 0);
  assert.ok(f.closed.includes("handle-1"));
  await f.c.follow();
  assert.equal(f.c.state.path, undefined);
  assert.deepEqual(f.errors, []);
  await f.c.close();
});
test("refresh keeps its pin and a different file observes the current head", async () => {
  const f = setup();
  await f.c.follow("Welcome.md");
  f.advance();
  await f.c.refresh();
  assert.equal(f.c.state.operation, operation);
  await f.c.follow("Other.md");
  assert.equal(f.c.state.operation, otherOperation);
  await f.c.close();
});
test("multiple heads require an explicit pin and failures retain retry scope", async () => {
  const f = setup("multiple");
  await f.c.follow("Welcome.md");
  assert.equal(f.c.state.operation, undefined);
  await f.c.refresh(operation);
  assert.equal(f.c.state.commits[0].id, revision);
  await f.c.close();
  const u = setup("file-history-failure");
  await u.c.follow("Welcome.md");
  assert.equal(u.c.state.phase, "unavailable");
  assert.equal(u.errors.length, 1);
  u.recover();
  await u.c.refresh();
  assert.equal(u.c.state.phase, "ready");
  await u.c.close();
});
test("closing drains an in-flight head lookup and fences future reads", async () => {
  const f = setup(),
    heads = f.reader.heads;
  let release;
  f.reader.heads = async () => {
    await new Promise((r) => {
      release = r;
    });
    return heads();
  };
  const loading = f.c.follow("Welcome.md");
  await until(() => release);
  let closed = false;
  const closing = f.c.close().then(() => {
    closed = true;
  });
  assert.equal(closed, false);
  release();
  await Promise.all([loading, closing]);
  await f.c.follow("Other.md");
  assert.equal(f.calls.filter(([kind]) => kind === "open").length, 0);
  assert.deepEqual(f.errors, []);
});
