import test from "node:test";
import assert from "node:assert/strict";
import { BlameController } from "../../src/lib/repository/blame-controller.ts";
import { validateBlame } from "../../src/lib/repository/blame-model.ts";
import {
  blameChunks,
  sourceLines,
} from "../../src/lib/repository/blame-chunks.ts";
import {
  historyFixture,
  operation,
  revision,
} from "../../catalog/support/repository/fixture.ts";
import { blameText } from "../../catalog/support/repository/blame.ts";
const selection = { operation, commit: revision, path: "Welcome.md" };
function setup(scenario) {
  const f = historyFixture(scenario),
    errors = [];
  const c = new BlameController(f.reader, {
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
test("blame uses its exact pin, progressive native cursor and file membership proof", async () => {
  const f = setup("blame-progress");
  await f.c.open(selection);
  assert.equal(f.c.state.status, "ready");
  assert.equal(f.c.state.contents, blameText);
  assert.equal(f.c.state.progress.complete, true);
  const reads = f.calls.filter(([, q]) => q?.kind === "blame");
  assert.equal(reads.length, 2);
  assert.deepEqual(reads[0][1].query, {
    commit: revision,
    path: "Welcome.md",
    continuation: null,
  });
  assert.equal(reads[1][1].query.continuation, "next-blame");
  assert.equal(f.calls.filter(([kind]) => kind === "heads").length, 0);
  assert.ok(
    f.calls.some(
      ([, q]) => q?.kind === "file_at" && q.query.commit === revision,
    ),
  );
  await f.c.close();
  assert.deepEqual(f.errors, []);
  assert.equal(f.closed.length, 1);
});
test("blame failures retain the selection for explicit recovery", async () => {
  const f = setup("blame-failure");
  await f.c.open(selection);
  assert.equal(f.c.state.status, "failed");
  assert.equal(f.errors.length, 1);
  f.recover();
  await f.c.refresh();
  assert.equal(f.c.state.status, "ready");
  assert.deepEqual(f.c.state.selection, selection);
  await f.c.close();
});
test("old blame replies cannot replace a newer file selection", async () => {
  const f = setup(),
    native = f.reader.blame;
  let release;
  f.reader.blame = async (h, q) => {
    if (q.path === "Welcome.md") await new Promise((r) => (release = r));
    return native(h, q);
  };
  const first = f.c.open(selection);
  await until(() => release);
  await f.c.open({ ...selection, path: "Other.md" });
  release();
  await first;
  assert.equal(f.c.state.selection.path, "Other.md");
  assert.equal(f.c.state.status, "ready");
  assert.deepEqual(f.errors, []);
  await f.c.close();
});
test("close drains pending annotation and fences late feedback", async () => {
  const f = setup("blame-preparing");
  const loading = f.c.open(selection);
  await until(() => f.calls.some(([, q]) => q?.kind === "blame"));
  await f.c.close();
  await loading;
  await f.c.open(selection);
  assert.equal(f.calls.filter(([kind]) => kind === "open").length, 1);
  assert.deepEqual(f.errors, []);
});
test("blame ranges use checked display integers and retain native wide counters", async () => {
  const f = setup();
  await f.c.open(selection);
  const page = f.c.state.progress;
  const wide = {
    ...page,
    line_count: 4n,
    history_commits: 18446744073709551615n,
    ranges: page.ranges.map((r) => ({
      ...r,
      start: BigInt(r.start),
      end: BigInt(r.end),
    })),
  };
  const normalized = validateBlame(wide, selection);
  assert.equal(normalized.line_count, 4);
  assert.equal(normalized.history_commits, 18446744073709551615n);
  assert.throws(() =>
    validateBlame({ ...wide, line_count: 18446744073709551615n }, selection),
  );
  assert.throws(() =>
    validateBlame({ ...page, path: "outside.md" }, selection),
  );
  assert.throws(() =>
    validateBlame(
      { ...page, ranges: [{ start: 0, end: 3, commit_id: revision }] },
      selection,
    ),
  );
  assert.throws(() =>
    validateBlame(
      { ...page, ranges: [{ start: 1, end: 6, commit_id: revision }] },
      selection,
    ),
  );
  await f.c.close();
});
test("copied blame chunks bound rendered groups and preserve unknown gaps", () => {
  assert.deepEqual(sourceLines("one\ntwo\n"), ["one", "two"]);
  const chunks = blameChunks(70, [{ start: 2, end: 70, commit_id: revision }]);
  assert.equal(chunks[0].commitId, undefined);
  assert.equal(chunks.at(-1).commitId, undefined);
  assert.ok(chunks.every((c) => c.end - c.start <= 32));
  assert.equal(chunks[2].continued, true);
});
