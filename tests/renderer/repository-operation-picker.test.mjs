import test from "node:test";
import assert from "node:assert/strict";
import { OperationController } from "@lapismd/repository-ui/history";
import { operationParents } from "../../src/lib/repository/operation-parent.ts";
import {
  operationFixture,
  operationNode,
} from "../../catalog/support/repository/operations.ts";
import {
  operation,
  otherOperation,
} from "../../catalog/support/repository/fixture.ts";

function setup(scenario = "operation-merge") {
  const fixture = operationFixture(scenario),
    errors = [];
  const controller = new OperationController(fixture.reader, {
    report: (error) => errors.push(error),
    recovered() {},
  });
  return { ...fixture, controller, errors };
}
const graph = (nodes, next = null, pin = operation) => ({
  kind: "graph",
  data: { operation: pin, data: { graph: "operations", nodes }, next },
});

test("operation picker reuses known cards and resolves missing recorded parents without changing pin or comparison", async () => {
  const f = setup();
  await f.controller.refresh();
  await f.controller.select(f.controller.state.nodes[0]);
  await f.controller.loadParents();
  assert.deepEqual(
    f.controller.state.parentNodes.map((node) => node.id),
    [otherOperation, "ad".repeat(64)],
  );
  assert.equal(f.controller.state.parent, undefined);
  const pages = () =>
    f.calls.filter(([, q]) => q?.kind === "graph" && q.query[1].after);
  assert.equal(pages().length, 1);
  assert.equal(pages()[0][0], "handle-1");
  await f.controller.loadParents();
  assert.equal(pages().length, 1);
  await f.controller.selectParent(otherOperation);
  await f.controller.loadParents();
  assert.equal(f.controller.state.parent, otherOperation);
  assert.equal(f.controller.state.operation, operation);
  assert.deepEqual(f.errors, []);
  await f.controller.close();
});

test("operation picker failures retain comparison and retry only explicitly", async () => {
  const f = setup("operation-picker-failure");
  await f.controller.refresh();
  await f.controller.select(f.controller.state.nodes[0]);
  await f.controller.selectParent(otherOperation);
  await f.controller.loadParents();
  assert.match(f.errors[0].message, /parent operation could not be read/);
  assert.equal(f.controller.state.parent, otherOperation);
  assert.equal(f.controller.state.detail.parent, otherOperation);
  f.recover();
  await f.controller.loadParents();
  assert.equal(f.controller.state.parentNodes.length, 2);
  assert.equal(f.controller.state.parent, otherOperation);
  await f.controller.close();
});

test("late operation cards cannot replace another selection, comparison, pin or closed view", async () => {
  for (const transition of ["selection", "comparison", "pin", "close"]) {
    const f = setup(),
      read = f.reader.read;
    let release, entered;
    const waiting = new Promise((resolve) => {
      entered = resolve;
    });
    f.reader.read = (handle, query) => {
      if (query.kind !== "graph" || !query.query[1].after)
        return read(handle, query);
      entered();
      return new Promise((resolve) => {
        release = resolve;
      });
    };
    await f.controller.refresh();
    await f.controller.select(f.controller.state.nodes[0]);
    const loading = f.controller.loadParents();
    await waiting;
    let closing;
    if (transition === "selection") await f.controller.clearSelection();
    if (transition === "comparison")
      await f.controller.selectParent(otherOperation);
    if (transition === "pin") await f.controller.selectPin(otherOperation);
    if (transition === "close") closing = f.controller.close();
    release(graph([operationNode("ad".repeat(64))]));
    await loading;
    await closing;
    assert.deepEqual(f.controller.state.parentNodes, [], transition);
    assert.deepEqual(f.errors, [], transition);
    await f.controller.close();
  }
});

test("operation card lookup rejects substituted pins, repeated cursors, excessive pages and missing-card limits", async () => {
  const parent = "ad".repeat(64),
    args = ["handle", operation, operation, [parent], [], () => true];
  await assert.rejects(
    operationParents(
      {
        read: async () => graph([operationNode(parent)], null, otherOperation),
      },
      ...args,
    ),
    /different selection/,
  );
  await assert.rejects(
    operationParents(
      { read: async () => graph([], { kind: "operation", id: operation }) },
      ...args,
    ),
    /different selection/,
  );
  let calls = 0;
  await assert.rejects(
    operationParents(
      {
        read: async () => {
          calls++;
          return graph([], {
            kind: "operation",
            id: String(calls).repeat(128),
          });
        },
      },
      ...args,
    ),
    /bounded history page/,
  );
  assert.equal(calls, 4);
  const tooMany = Array.from({ length: 65 }, (_, n) =>
    String(n).padStart(128, "0"),
  );
  await assert.rejects(
    operationParents(
      {
        read: async () => {
          throw Error("unexpected read");
        },
      },
      "handle",
      operation,
      operation,
      tooMany,
      [],
      () => true,
    ),
    /preview limit/,
  );
});
