import test from "node:test";
import assert from "node:assert/strict";
import { HistoryController } from "@lapismd/repository-ui/history";
import {
  historyFixture,
  commit,
  parent,
  operation,
  otherOperation,
} from "../../catalog/support/repository/fixture.ts";

function setup() {
  const f = historyFixture(),
    errors = [];
  const controller = new HistoryController(f.reader, {
    report: (error) => errors.push(error),
    recovered() {},
  });
  return { ...f, controller, errors };
}
test("commit paging retains exact pinned cursors, rejects duplicates and stops at 200", async () => {
  const f = setup(),
    read = f.reader.read,
    queries = [];
  let page = 0;
  f.reader.read = async (handle, query) => {
    const response = await read(handle, query);
    if (query.kind === "graph") {
      queries.push([handle, query.query[1].after]);
      response.data.next = {
        kind: "commit",
        id: ((page + 1) * 50 - 1).toString(16).padStart(40, "0"),
      };
      response.data.data.nodes = Array.from({ length: 50 }, (_, n) => ({
        commit: commit((page * 50 + n).toString(16).padStart(40, "0")),
        edges: [],
      }));
      page++;
    }
    return response;
  };
  await f.controller.refresh();
  for (let n = 0; n < 4; n++) await f.controller.moreCommits();
  assert.equal(f.controller.state.commits.length, 200);
  assert.equal(f.controller.state.next, null);
  assert.deepEqual(queries, [
    ["handle-1", null],
    ...Array.from({ length: 3 }, (_, page) => [
      "handle-1",
      {
        kind: "commit",
        id: ((page + 1) * 50 - 1).toString(16).padStart(40, "0"),
      },
    ]),
  ]);
  assert.equal(f.controller.state.operation, operation);
  assert.deepEqual(f.errors, []);
  await f.controller.selectOperation(otherOperation);
  // Return the same first page again to exercise overlap rejection.
  page--;
  await f.controller.moreCommits();
  assert.equal(f.errors.length, 1);
  assert.equal(f.controller.state.commits.length, 50);
  await f.controller.close();
});
test("a delayed commit page cannot publish after changing the pinned handle", async () => {
  const f = setup(),
    read = f.reader.read;
  let release, enter;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  const entered = new Promise((resolve) => {
    enter = resolve;
  });
  f.reader.read = async (handle, query) => {
    const response = await read(handle, query);
    if (handle === "handle-1" && query.kind === "graph") {
      enter();
      await held;
    }
    return response;
  };
  const initial = f.controller.refresh();
  await entered;
  await f.controller.selectOperation(otherOperation);
  release();
  await initial;
  assert.equal(f.controller.state.snapshot.operation, otherOperation);
  assert.equal(f.controller.state.commits.length, 2);
  assert.deepEqual(f.errors, []);
  await f.controller.close();
});
