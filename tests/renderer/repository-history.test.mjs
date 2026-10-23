import test from "node:test";
import assert from "node:assert/strict";
import { HistoryController } from "@lapismd/repository-ui/history";
import {
  diffText,
  timestampLabel,
} from "../../src/lib/repository/history-state.ts";
import { prepared } from "../../src/lib/repository/history-selection.ts";
import {
  historyFixture,
  operation,
  otherOperation,
  parent,
  revision,
} from "../../catalog/support/repository/fixture.ts";

function setup(scenario) {
  const fixture = historyFixture(scenario);
  const errors = [];
  let recovered = 0;
  const controller = new HistoryController(fixture.reader, {
    report: (error) => errors.push(error),
    recovered: () => recovered++,
  });
  return { ...fixture, controller, errors, recoveries: () => recovered };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
test("automatic checkpoint follow advances only unselected live history", async () => {
  const f = setup();
  await f.controller.refresh();
  f.advance();
  await f.controller.checkpointChanged(otherOperation);
  assert.equal(f.controller.state.operation, otherOperation);
  await f.controller.selectOperation(operation);
  await f.controller.checkpointChanged(otherOperation);
  assert.equal(f.controller.state.operation, operation);
  await f.controller.close();
  const selected = setup();
  await selected.controller.refresh();
  await selected.controller.selectRevision(selected.latest);
  selected.advance();
  await selected.controller.checkpointChanged(otherOperation);
  assert.equal(selected.controller.state.operation, operation);
  assert.equal(selected.controller.state.revision.id, selected.latest.id);
  await selected.controller.close();
});

test("history pins one operation across refresh and exact revision/path comparisons", async () => {
  const f = setup();
  await f.controller.refresh();
  assert.equal(f.controller.state.snapshot.generation, 18446744073709551615n);
  assert.equal(f.controller.state.operation, operation);
  assert.equal(f.controller.state.commits.length, 2);
  await f.controller.selectRevision(f.latest);
  assert.equal(f.controller.state.base, parent);
  await f.controller.selectPath("Welcome.md");
  assert.deepEqual(diffText(f.controller.state.diff), {
    oldText: "# Notes\nOld title\n",
    newText: "# Notes\nHistory is retained\n",
  });
  f.advance();
  await f.controller.refresh();
  assert.deepEqual(f.controller.state.heads, [otherOperation]);
  assert.equal(f.controller.state.operation, operation);
  assert.equal(f.calls.filter(([method]) => method === "open").length, 1);
  await f.controller.selectOperation(otherOperation);
  assert.equal(f.closed.length, 1);
  assert.equal(f.controller.state.snapshot.operation, otherOperation);
  assert.equal(f.controller.state.revision, undefined);
  assert.equal(f.controller.state.base, undefined);
  assert.equal(f.controller.state.path, undefined);
  assert.equal(f.controller.state.diff, undefined);
  assert.deepEqual(f.controller.state.paths, []);
  await f.controller.close();
  assert.equal(f.closed.length, 2);
  assert.deepEqual(f.errors, []);
});

test("multiple heads require a choice and merge parents are never guessed", async () => {
  const f = setup("multiple");
  await f.controller.refresh();
  assert.equal(f.controller.state.operation, undefined);
  assert.equal(
    f.calls.some(([kind]) => kind === "open"),
    false,
  );
  await f.controller.selectOperation(operation);
  f.latest.parents.push("33".repeat(20));
  await f.controller.selectRevision(f.latest);
  assert.equal(f.controller.state.base, undefined);
  assert.deepEqual(f.controller.state.paths, []);
  await f.controller.selectBase(parent);
  assert.equal(f.controller.state.paths[0].path, "Welcome.md");
  await f.controller.close();
});

test("late file reads cannot overwrite a later selected operation", async () => {
  const f = setup();
  const held = deferred();
  const read = f.reader.read;
  f.reader.read = async (handle, query) =>
    query.kind === "diff" ? held.promise : read(handle, query);
  await f.controller.refresh();
  await f.controller.selectRevision(f.latest);
  const old = f.controller.selectPath("Welcome.md");
  await f.controller.selectOperation(otherOperation);
  held.resolve({
    kind: "diff",
    data: { from: parent, to: revision, path: "Welcome.md", changes: [] },
  });
  await old;
  assert.equal(f.controller.state.operation, otherOperation);
  assert.equal(f.controller.state.diff, undefined);
  assert.deepEqual(f.errors, []);
  await f.controller.close();
});

test("failed reads retain the pin and recover only through explicit retry", async () => {
  const f = setup();
  await f.controller.refresh();
  f.fail();
  await f.controller.refresh();
  assert.equal(f.errors.length, 1);
  assert.equal(f.controller.state.operation, operation);
  assert.equal(f.controller.state.commits.length, 2);
  const before = f.calls.length;
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(f.calls.length, before);
  await f.controller.refresh();
  assert.ok(f.recoveries() >= 2);
  await f.controller.close();
});

test("close cancels a pending native read before waiting for its response", async () => {
  const f = setup();
  const held = deferred();
  const entered = deferred();
  const read = f.reader.read,
    close = f.reader.close;
  f.reader.read = async (handle, query) => {
    if (query.kind !== "diff") return read(handle, query);
    entered.resolve();
    return held.promise;
  };
  f.reader.close = async (handle) => {
    held.reject(new Error("canceled"));
    return close(handle);
  };
  await f.controller.refresh();
  await f.controller.selectRevision(f.latest);
  const reading = f.controller.selectPath("Welcome.md");
  await entered.promise;
  await f.controller.close();
  await reading;
  assert.equal(f.closed.length, 1);
  assert.deepEqual(f.errors, []);
});

test("uncertain handle close is retained for explicit cleanup retry", async () => {
  const f = setup();
  await f.controller.refresh();
  const close = f.reader.close;
  let fail = true;
  f.reader.close = async (handle) => {
    if (fail) {
      fail = false;
      throw new Error("lost close response");
    }
    await close(handle);
  };
  await assert.rejects(f.controller.close(), /cleanup failed/);
  assert.equal(f.closed.length, 0);
  await f.controller.close();
  assert.equal(f.closed.length, 1);
});

test("preparation polling is bounded and never turns a timeout into readiness", async () => {
  const f = historyFixture("preparing");
  let waits = 0;
  await assert.rejects(
    prepared(f.reader, "handle", new AbortController().signal, async () => {
      waits++;
    }),
    /did not finish/,
  );
  assert.equal(waits, 100);
  assert.equal(f.calls.length, 100);
});

test("binary and oversized content stay unavailable and full-width times stay exact", async () => {
  const f = setup("binary");
  await f.controller.refresh();
  await f.controller.selectRevision(f.latest);
  await f.controller.selectPath("Welcome.md");
  assert.deepEqual(diffText(f.controller.state.diff), {
    unavailable: "binary",
  });
  const large = {
    ...f.controller.state.diff,
    content: {
      status: "text",
      hunks: [{ before: "x".repeat(1024 * 1024 + 1), after: "" }],
    },
  };
  assert.match(diffText(large).unavailable, /preview limit/);
  assert.match(
    timestampLabel(9223372036854775807n),
    /^9223372036854775807 milliseconds/,
  );
  await f.controller.close();
});

test("a failed paths query is unavailable until explicit retry, never an empty comparison", async () => {
  const f = setup();
  const read = f.reader.read;
  let fail = true;
  f.reader.read = async (handle, query) => {
    if (query.kind === "diff_paths" && fail) {
      fail = false;
      throw new Error("Read failed");
    }
    return read(handle, query);
  };
  await f.controller.refresh();
  await f.controller.selectRevision(f.latest);
  assert.equal(f.controller.state.pathsReady, false);
  assert.equal(f.errors.length, 1);
  await f.controller.selectBase(parent);
  assert.equal(f.controller.state.pathsReady, true);
  assert.equal(f.controller.state.paths.length, 1);
  await f.controller.close();
});
