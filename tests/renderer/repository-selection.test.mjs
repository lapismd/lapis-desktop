import test from "node:test";
import assert from "node:assert/strict";
import { HistoryController } from "@lapismd/repository-ui/history";
import { historyFixture } from "../../catalog/support/repository/fixture.ts";
test("collapsed and reopened revision rejects its previous file-list response", async () => {
  const f = historyFixture(),
    errors = [];
  const c = new HistoryController(f.reader, {
    report: (e) => errors.push(e),
    recovered() {},
  });
  await c.refresh();
  const read = f.reader.read;
  let release;
  f.reader.read = (h, q) =>
    q.kind === "diff_paths" && !release
      ? new Promise(
          (r) =>
            (release = async () => {
              const v = await read(h, q);
              v.data.changes = [{ ...v.data.changes[0], path: "stale.md" }];
              r(v);
            }),
        )
      : read(h, q);
  const old = c.selectRevision(f.latest);
  await c.clearRevision();
  await c.selectRevision(f.latest);
  assert.equal(c.state.paths[0].path, "Welcome.md");
  await release();
  await old;
  assert.equal(c.state.paths[0].path, "Welcome.md");
  assert.deepEqual(errors, []);
  await c.close();
});

test("collapse clears pending busy state and ignores a rejected obsolete file read", async () => {
  const f = historyFixture(),
    errors = [];
  const c = new HistoryController(f.reader, {
    report: (e) => errors.push(e),
    recovered() {},
  });
  await c.refresh();
  await c.selectRevision(f.latest);
  const read = f.reader.read;
  let reject;
  f.reader.read = (h, q) =>
    q.kind === "diff" ? new Promise((_r, j) => (reject = j)) : read(h, q);
  const old = c.selectPath("Welcome.md");
  await c.clearRevision();
  assert.equal(c.state.busy, false);
  reject(new Error("Obsolete file failure"));
  await old;
  assert.deepEqual(errors, []);
  await c.close();
});
