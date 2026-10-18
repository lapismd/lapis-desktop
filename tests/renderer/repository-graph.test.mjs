import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRepositoryLogGraph,
  encodeJjChangeId,
  shortestRepositoryLogPrefix,
} from "../../src/lib/repository/graph/repository-log-graph.ts";
import {
  commitRows,
  operationRows,
} from "../../src/lib/repository/graph/model.ts";
import {
  commit,
  operation,
  otherOperation,
} from "../../catalog/support/repository/fixture.ts";
import { operationNode } from "../../catalog/support/repository/operations.ts";
const row = (id, parents) => ({
  eventId: id,
  parents,
  changeId: "",
  message: id,
  reason: "checkpoint",
  author: "Ada",
  millis: 0,
  tags: [],
});
test("borrowed jj-store graph keeps branching and converging operation ancestry", () => {
  const rows = buildRepositoryLogGraph([
    row("merge", ["left", "right"]),
    row("left", ["base"]),
    row("right", ["base"]),
    row("base", []),
  ]);
  assert.equal(rows[0].mergeFromLanes.length, 1);
  assert.notEqual(rows[1].commitLane, rows[2].commitLane);
  assert.equal(rows[3].convergingLanes.length, 1);
  assert.equal(rows[3].revision.eventId, "base");
});
test("native rows retain full identities, exact timestamps and explicit snapshots without change-id fabrication", () => {
  const native = operationNode();
  native.is_snapshot = true;
  const rows = operationRows([native, operationNode(otherOperation, [])]);
  assert.equal(rows[0].eventId, operation);
  assert.equal(rows[0].millis, 1792252800001n);
  assert.equal(rows[0].changeId, "");
  assert.deepEqual(rows[0].tags, ["Snapshot"]);
  const graph = buildRepositoryLogGraph(rows);
  assert.equal(graph[0].changeIdEncoded, "");
  const c = commit();
  c.bookmarks = [
    { name: "main", added: true, removed: false, conflicted: false },
  ];
  c.workspaces = ["default"];
  const adapted = commitRows([c])[0];
  assert.equal(adapted.changeId, c.change_id);
  assert.deepEqual(adapted.tags, ["main", "Working copy"]);
});
test("revision display ids use jj reverse hex and collision-safe prefixes", () => {
  assert.equal(encodeJjChangeId("0123456789abcdef"), "zyxwvutsrqponmlk");
  const ids = ["12345678aa", "12345678bb"];
  const prefixes = shortestRepositoryLogPrefix(ids);
  assert.notEqual(prefixes.get(ids[0]), prefixes.get(ids[1]));
});
