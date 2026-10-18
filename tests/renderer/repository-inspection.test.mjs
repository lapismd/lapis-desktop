import test from "node:test";
import assert from "node:assert/strict";
import { HistoryController } from "../../src/lib/repository/history-controller.ts";
import { OperationController } from "../../src/lib/repository/operation-controller.ts";
import {
  historyFixture,
  operation,
  revision,
  parent,
} from "../../catalog/support/repository/fixture.ts";
import { operationFixture } from "../../catalog/support/repository/operations.ts";
import { operationMessageParts } from "../../src/lib/repository/operation-message.ts";

function owner(Controller, fixture) {
  const errors = [];
  const controller = new Controller(fixture.reader, {
    report: (e) => errors.push(e),
    recovered() {},
  });
  return { ...fixture, controller, errors };
}
function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}

test("workspace context clears comparisons while retaining the exact pinned operation", async () => {
  const f = owner(HistoryController, historyFixture());
  await f.controller.refresh();
  await f.controller.selectRevision(f.latest);
  await f.controller.selectPath("Welcome.md");
  await f.controller.selectWorkspace("default");
  assert.equal(f.controller.state.operation, operation);
  assert.equal(f.controller.state.workspace, "default");
  assert.equal(f.controller.state.revision, undefined);
  assert.equal(f.controller.state.diff, undefined);
  const graph = f.calls.filter(([, q]) => q?.kind === "graph").at(-1)[1];
  assert.equal(graph.query[0].workspace, "default");
  await f.controller.close();
});

test("operation revision cards use exact pinned commit reads and retain the selected comparison", async () => {
  const f = owner(OperationController, operationFixture());
  await f.controller.refresh();
  await f.controller.select(f.controller.state.nodes[0]);
  await f.controller.files.selectGroup(
    f.controller.state.files.groups[0].change,
  );
  await f.controller.files.selectPath("Welcome.md");
  const before = f.calls.length;
  await f.controller.loadRevisions();
  assert.deepEqual(
    new Set(f.controller.state.commits.map((c) => c.id)),
    new Set([parent, revision]),
  );
  assert.equal(f.controller.state.operation, operation);
  assert.equal(f.controller.state.files.path, "Welcome.md");
  assert.ok(f.calls.slice(before).every(([, q]) => q.kind === "commit"));
  await f.controller.loadRevisions();
  assert.equal(f.calls.length, before + 2);
  await f.controller.close();
});

test("operation workspaces are read through the retained native handle, separately from the op pin", async () => {
  const f = owner(OperationController, operationFixture());
  await f.controller.refresh();
  await f.controller.select(f.controller.state.nodes[0]);
  await f.controller.loadWorkspaces();
  assert.equal(f.controller.state.workspaceCommits[0].workspaces[0], "default");
  const request = f.calls.filter(([, q]) => q?.kind === "graph").at(-1)[1];
  assert.equal(request.query[0].revset, "working_copies()");
  await f.controller.selectWorkspace("default");
  assert.equal(f.controller.state.operation, operation);
  assert.equal(f.controller.state.selected, undefined);
  assert.equal(f.controller.state.files.ready, false);
  await f.controller.close();
});

test("native conflict descriptors retain their revision identity and are cleared on collapse", async () => {
  const f = owner(HistoryController, historyFixture("conflicted"));
  await f.controller.refresh();
  await f.controller.selectRevision(f.latest);
  await f.controller.loadConflicts();
  assert.equal(f.controller.state.conflictsReady, true);
  assert.equal(f.controller.state.conflicts[0].path, "Welcome.md");
  assert.equal(f.controller.state.conflicts[0].fingerprint, "ad".repeat(32));
  assert.deepEqual(
    f.calls.filter(([, q]) => q?.kind === "conflicts").map(([, q]) => q.query),
    [{ commit: revision, path: "" }],
  );
  await f.controller.clearRevision();
  assert.deepEqual(f.controller.state.conflicts, []);
  await f.controller.close();
});

test("late or substituted conflict descriptors cannot become the current revision", async () => {
  const f = owner(HistoryController, historyFixture("conflicted"));
  await f.controller.refresh();
  await f.controller.selectRevision(f.latest);
  const read = f.reader.read,
    pending = deferred();
  f.reader.read = async (handle, query) => {
    const response = await read(handle, query);
    if (query.kind === "conflicts") {
      await pending.promise;
      return { ...response, data: { ...response.data, commit: parent } };
    }
    return response;
  };
  const loading = f.controller.loadConflicts();
  await f.controller.clearRevision();
  pending.resolve();
  await loading;
  assert.equal(f.controller.state.conflictsReady, false);
  assert.deepEqual(f.errors, []);
  await f.controller.selectRevision(f.latest);
  await f.controller.loadConflicts();
  assert.equal(f.controller.state.conflictsReady, false);
  assert.equal(f.errors.length, 1);
  await f.controller.close();
});

test("operation titles only shorten complete bounded IDs, preserving exact copy values", () => {
  const id = "A1".repeat(20),
    change = "b2".repeat(16);
  const parts = operationMessageParts(
    `describe commit ${id}; change ${change}`,
  );
  assert.deepEqual(
    parts.filter((p) => p.type !== "text").map((p) => p.value),
    [id.toLowerCase(), change],
  );
  assert.ok(
    operationMessageParts(`path/to/${id}x`).every((p) => p.type === "text"),
  );
});
