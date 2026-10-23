import test from "node:test";
import assert from "node:assert/strict";
import { HistorySearchController } from "../../src/lib/repository/search-controller.ts";
import { nativeSearch } from "../../src/lib/native/repository/search.ts";
import { openHistoryRevision } from "@lapismd/repository-ui/history";
import { HistoryController } from "@lapismd/repository-ui/history";
import {
  historyFixture,
  commit,
  revision,
} from "../../catalog/support/repository/fixture.ts";
const checkpoint = {
  operation: "a".repeat(128),
  commit: "b".repeat(40),
  change_id: "c".repeat(32),
  description: "saved",
  timestamp_millis: 1792300000000,
};
const hit = {
  revision: { checkpoint, author: "Lapis Notes", email: "dev@lapis.md" },
  path: "Old.md",
  line: 2,
  excerpt: "lost phrase",
};
const page = (hits = [], next = null) => ({
  hits,
  next,
  checkpoints: 1,
  unindexed: 0,
});
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
test("new history query fences an old page and closes only after native work drains", async () => {
  const first = deferred(),
    last = deferred();
  let calls = 0,
    errors = [];
  const c = new HistorySearchController(
    { page: () => (++calls === 1 ? first.promise : last.promise) },
    { report: (e) => errors.push(e), recovered() {} },
  );
  let state;
  c.subscribe((v) => (state = v));
  const old = c.search({ text: "old" });
  await Promise.resolve();
  const newer = c.search({ text: "new" });
  first.resolve(page([hit]));
  await old;
  await Promise.resolve();
  assert.equal(state.hits.length, 0);
  assert.equal(state.busy, true);
  c.close();
  let drained = false;
  const drain = c.drained().then(() => (drained = true));
  await Promise.resolve();
  assert.equal(drained, false);
  last.resolve(page([hit]));
  await newer;
  await drain;
  assert.equal(state.hits.length, 0);
  assert.equal(errors.length, 0);
});
test("empty pages retain a fixed anchor and failed continuation keeps the original cursor", async () => {
  const cursor = { anchor: checkpoint.commit, revision: 1, after_path: null };
  let calls = [],
    fail = true;
  let errors = [];
  const c = new HistorySearchController(
    {
      async page(request) {
        calls.push(request);
        if (!request.cursor) return page([], cursor);
        if (fail) throw Error("offline index read");
        return page([hit]);
      },
    },
    { report: (e) => errors.push(e.message), recovered() {} },
  );
  let state;
  c.subscribe((v) => (state = v));
  await c.search({ text: "lost", path: "Old", author: "Lapis" });
  assert.deepEqual(state.next, cursor);
  assert.equal(errors.length, 1);
  fail = false;
  await c.more();
  assert.equal(state.hits[0].path, "Old.md");
  assert.equal(state.next, null);
  assert.deepEqual(calls[2].cursor, cursor);
  assert.equal(calls[2].query.author, "Lapis");
  c.close();
});
test("search native transport whitelists filters and cursor and rejects forged results", async () => {
  const frames = [];
  const service = nativeSearch("admitted", async (command, args) => {
    frames.push({ command, args });
    return page([hit]);
  });
  await service.page({
    query: { text: "lost", path: "Old", root: "outside", token: "secret" },
    cursor: {
      anchor: checkpoint.commit,
      revision: 2,
      after_path: null,
      index: "outside",
    },
  });
  assert.deepEqual(frames, [
    {
      command: "desktop_backup_search",
      args: {
        request: {
          sessionId: "admitted",
          search: {
            query: {
              text: "lost",
              path: "Old",
              author: undefined,
              from_millis: undefined,
              to_millis: undefined,
            },
            cursor: {
              anchor: checkpoint.commit,
              revision: 2,
              after_path: null,
            },
          },
        },
      },
    },
  ]);
  await assert.rejects(
    nativeSearch("s", async () => page([{ ...hit, path: "../private" }])).page({
      query: { text: "lost" },
    }),
    /Invalid history search hit/,
  );
});
test("opening a retained search checkpoint uses its exact native commit beyond the first graph page", async () => {
  const f = historyFixture();
  const original = f.reader.read;
  const exact = { ...commit(), id: "d".repeat(40) };
  let requested = [];
  f.reader.read = async (handle, query) => {
    if (query.kind === "commit" && query.query.commit === exact.id) {
      requested.push(query.query.commit);
      const response = await original(handle, {
        kind: "commit",
        query: { commit: commit().id },
      });
      return {
        ...response,
        data: {
          ...response.data,
          commit: exact,
          object: {
            ...response.data.object,
            key: { ...response.data.object.key, id: exact.id },
          },
        },
      };
    }
    if (query.kind === "diff_paths" && query.query.to === exact.id)
      return {
        kind: "diff_paths",
        data: { from: query.query.from, to: exact.id, changes: [], next: null },
      };
    return original(handle, query);
  };
  const errors = [];
  const c = new HistoryController(
    f.reader,
    { report: (e) => errors.push(e.message), recovered() {} },
    async () => {},
  );
  await c.refresh();
  await openHistoryRevision(c, exact.id);
  assert.deepEqual(requested, [exact.id]);
  assert.equal(c.state.revision.id, exact.id);
  assert.deepEqual(errors, []);
  await c.close();
});

test("late exact revision cannot replace a newer row selection or its graph", async () => {
  const f = historyFixture(),
    original = f.reader.read,
    delayed = deferred();
  const id = "d".repeat(40);
  f.reader.read = async (handle, query) =>
    query.kind === "commit" && query.query.commit === id
      ? delayed.promise
      : original(handle, query);
  const c = new HistoryController(
    f.reader,
    {
      report(error) {
        throw error;
      },
      recovered() {},
    },
    async () => {},
  );
  await c.refresh();
  const stale = c.openRevision(id);
  await c.selectRevision(c.state.commits[0]);
  const selected = c.state.revision;
  // A native-shape response for the obsolete commit; no page data is substituted.
  const response = {
    kind: "commit",
    data: {
      object: { key: { kind: "commit", id }, data: { kind: "commit" } },
      commit: commit(id),
    },
  };
  delayed.resolve({
    ...response,
    data: {
      ...response.data,
      commit: commit(id),
      object: { ...response.data.object, key: { kind: "commit", id } },
    },
  });
  await stale;
  assert.equal(c.state.revision.id, selected.id);
  assert.notEqual(c.state.commits[0].id, id);
  await c.close();
});
