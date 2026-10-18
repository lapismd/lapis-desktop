import test from "node:test";
import assert from "node:assert/strict";
import { OperationController } from "../../src/lib/repository/operation-controller.ts";
import {
  historyFixture,
  operation,
  otherOperation,
} from "../../catalog/support/repository/fixture.ts";
const stats = {
  metadata_nodes: 0,
  predicate_file_bytes: 0,
  predicate_lines: 0,
  object_reads: 0,
  object_bytes: 0,
  work: 0,
};
export function operationNode(id = operation, parents = [otherOperation]) {
  return {
    id,
    parents,
    view: "de".repeat(64),
    description: parents.length ? "describe commit" : "initialize repo",
    user: "Ada",
    host: "laptop",
    start: { millis: 1792252800000n, offset_minutes: 0 },
    end: { millis: 1792252800001n, offset_minutes: 0 },
    is_snapshot: false,
    attributes: {},
    predecessor_data_present: true,
  };
}
function setup() {
  const f = historyFixture();
  const read = f.reader.read;
  const errors = [];
  f.reader.read = async (handle, q) => {
    if (q.kind === "graph" && q.query[0].graph === "operations") {
      f.calls.push([handle, q]);
      return {
        kind: "graph",
        data: {
          version: 1,
          operation,
          data: {
            graph: "operations",
            nodes: [operationNode(), operationNode(otherOperation, [])],
          },
          stats,
        },
      };
    }
    if (q.kind === "operation_changes")
      return {
        kind: "operation_changes",
        data: {
          version: 1,
          operation: q.query.operation,
          parent: q.query.parent,
          groups: [],
          stats,
        },
      };
    if (q.kind === "operation_diff") {
      f.calls.push([handle, q]);
      return {
        kind: "operation_diff",
        data: {
          version: 1,
          data:
            q.query.operation === otherOperation
              ? {
                  operation: otherOperation,
                  view: "de".repeat(64),
                  status: "root",
                }
              : {
                  status: "difference",
                  operation: q.query.operation,
                  parent: q.query.parent,
                  before_view: "de".repeat(64),
                  after_view: "ef".repeat(64),
                  visible_commits: { added: [], removed: [] },
                  view: {
                    heads: { added: [], removed: [] },
                    local_bookmarks: [],
                    local_tags: [],
                    remote_views: [],
                    git_refs: [],
                    git_heads: [],
                    workspaces: [],
                  },
                },
          stats,
        },
      };
    }
    return read(handle, q);
  };
  const c = new OperationController(f.reader, {
    report: (e) => errors.push(e),
    recovered: () => {},
  });
  return { ...f, c, errors };
}
test("operation log uses a separate pinned operation graph and preserves the pin on refresh", async () => {
  const f = setup();
  await f.c.refresh();
  assert.equal(f.c.state.operation, operation);
  assert.equal(f.c.state.nodes.length, 2);
  const query = f.calls.find(([, q]) => q?.kind === "graph")[1];
  assert.equal(query.query[0].graph, "operations");
  await f.c.select(f.c.state.nodes[0]);
  assert.equal(f.c.state.selected.id, operation);
  f.advance();
  await f.c.refresh();
  assert.equal(f.c.state.operation, operation);
  assert.deepEqual(f.c.state.heads, [otherOperation]);
  assert.equal(f.calls.filter(([m]) => m === "open").length, 1);
  await f.c.close();
  assert.equal(f.closed.length, 1);
  assert.deepEqual(f.errors, []);
});
test("operation detail replies cannot overwrite a newer selection and closure drains outstanding work", async () => {
  const f = setup();
  await f.c.refresh();
  let release;
  const read = f.reader.read;
  f.reader.read = (h, q) =>
    q.kind === "operation_diff" && q.query.operation === operation
      ? new Promise((r) => (release = r))
      : read(h, q);
  const old = f.c.select(f.c.state.nodes[0]);
  await f.c.select(f.c.state.nodes[1]);
  release({
    kind: "operation_diff",
    data: {
      version: 1,
      data: { operation, view: "de".repeat(64), status: "root" },
      stats,
    },
  });
  await old;
  assert.equal(f.c.state.selected.id, otherOperation);
  assert.equal(f.c.state.detail.operation, otherOperation);
  await f.c.close();
  const before = f.calls.length;
  await f.c.refresh();
  assert.equal(f.calls.length, before);
});
test("failed operation detail retains selection, reports feedback and only retries explicitly", async () => {
  const f = setup();
  await f.c.refresh();
  const read = f.reader.read;
  f.reader.read = async (h, q) => {
    if (q.kind === "operation_diff")
      throw new Error("Operation comparison unavailable");
    return read(h, q);
  };
  await f.c.select(f.c.state.nodes[0]);
  assert.equal(f.errors.length, 1);
  assert.equal(f.c.state.selected.id, operation);
  assert.equal(f.c.state.detail, undefined);
  f.reader.read = read;
  await f.c.select(f.c.state.selected);
  assert.equal(f.c.state.detail.operation, operation);
  await f.c.close();
});
test("multi-parent operation comparisons require explicit selection and reject a wrong parent receipt", async () => {
  const f = setup();
  await f.c.refresh();
  f.c.state.nodes[0].parents.push("ad".repeat(64));
  await f.c.select(f.c.state.nodes[0]);
  assert.equal(f.c.state.parent, undefined);
  assert.equal(f.c.state.detail, undefined);
  assert.equal(
    f.calls.filter(([, q]) => q?.kind === "operation_diff").length,
    0,
  );
  await f.c.selectParent(otherOperation);
  assert.equal(f.c.state.detail.parent, otherOperation);
  const read = f.reader.read;
  f.reader.read = async (h, q) => {
    const response = await read(h, q);
    if (q.kind === "operation_diff") response.data.data.parent = "bad";
    return response;
  };
  await f.c.selectParent(otherOperation);
  assert.equal(f.c.state.detail, undefined);
  assert.equal(f.errors.length, 1);
  await f.c.close();
});
test("late operation graph reads cannot overwrite a newer pin", async () => {
  const f = setup();
  const read = f.reader.read;
  let release;
  f.reader.read = (h, q) =>
    q.kind === "graph" && h === "handle-1"
      ? new Promise((r) => (release = r))
      : read(h, q);
  const first = f.c.refresh();
  while (!release) await new Promise((r) => setImmediate(r));
  await f.c.selectPin(otherOperation); // the intentionally wrong fixture operation is refused
  release({
    kind: "graph",
    data: {
      version: 1,
      operation,
      data: { graph: "operations", nodes: [operationNode()] },
      stats,
    },
  });
  await first;
  assert.equal(f.c.state.operation, otherOperation);
  assert.deepEqual(f.c.state.nodes, []);
  await f.c.close();
  assert.equal(f.closed.length, 2);
});
