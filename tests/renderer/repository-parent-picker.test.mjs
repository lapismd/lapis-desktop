import test from "node:test";
import assert from "node:assert/strict";
import { HistoryController } from "../../src/lib/repository/history-controller.ts";
import { parentCandidates } from "../../src/lib/repository/parent-candidates.ts";
import {
  commitCardSearch,
  commitCardTags,
} from "../../src/lib/repository/commit-cards.ts";
import {
  historyFixture,
  commit,
  operation,
  otherOperation,
  parent,
} from "../../catalog/support/repository/fixture.ts";
import { commitDetail } from "../../catalog/support/repository/commit-detail.ts";

function setup(scenario = "merge") {
  const fixture = historyFixture(scenario),
    errors = [];
  const controller = new HistoryController(fixture.reader, {
    report: (error) => errors.push(error),
    recovered() {},
  });
  return { ...fixture, controller, errors };
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("parent metadata reads only missing exact parents through the existing pinned handle", async () => {
  const f = setup();
  await f.controller.refresh();
  await f.controller.selectRevision(f.latest);
  await f.controller.loadParents();
  assert.deepEqual(
    f.controller.state.parentCommits.map((c) => c.id),
    [parent, "33".repeat(20)],
  );
  assert.equal(f.controller.state.base, undefined);
  const reads = f.calls.filter(([, query]) => query?.kind === "commit");
  assert.deepEqual(reads, [
    ["handle-1", { kind: "commit", query: { commit: "33".repeat(20) } }],
  ]);
  await f.controller.loadParents();
  assert.equal(
    f.calls.filter(([, query]) => query?.kind === "commit").length,
    1,
  );
  assert.equal(f.controller.state.parentCommits.length, 2);
  await f.controller.selectBase("33".repeat(20));
  assert.equal(f.controller.state.base, "33".repeat(20));
  assert.equal(f.controller.state.snapshot.operation, operation);
  await f.controller.selectBase("44".repeat(20));
  assert.equal(f.controller.state.base, "33".repeat(20));
  assert.equal(f.errors.length, 1);
  await f.controller.close();
});

test("substituted commit, object identity and object kinds are rejected", async () => {
  for (const mutate of [
    (r) => {
      r.data.commit.id = parent;
    },
    (r) => {
      r.data.object.key.id = parent;
    },
    (r) => {
      r.data.object.key.kind = "view";
    },
    (r) => {
      r.data.object.data.kind = "view";
    },
    (r) => {
      r.kind = "graph";
    },
  ]) {
    const f = setup(),
      read = f.reader.read;
    f.reader.read = async (handle, query) => {
      const response = await read(handle, query);
      if (query.kind === "commit") mutate(response);
      return response;
    };
    await f.controller.refresh();
    await f.controller.selectRevision(f.latest);
    await f.controller.loadParents();
    assert.deepEqual(f.controller.state.parentCommits, []);
    assert.match(f.errors[0].message, /different selection/);
    assert.equal(f.controller.state.operation, operation);
    await f.controller.close();
  }
});

test("metadata failure retains the explicit comparison and needs explicit retry", async () => {
  const f = setup("parent-details-failure");
  await f.controller.refresh();
  await f.controller.selectRevision(f.latest);
  await f.controller.selectBase(parent);
  await f.controller.loadParents();
  assert.equal(f.errors.length, 1);
  assert.equal(f.controller.state.base, parent);
  assert.equal(f.controller.state.paths[0].path, "Welcome.md");
  f.recover();
  await f.controller.loadParents();
  assert.equal(f.controller.state.parentCommits.length, 2);
  assert.equal(f.controller.state.base, parent);
  await f.controller.close();
});

test("late parent responses cannot replace a changed revision, comparison, operation or closed view", async () => {
  for (const transition of ["revision", "comparison", "operation", "close"]) {
    const f = setup(),
      held = deferred(),
      entered = deferred(),
      read = f.reader.read;
    f.reader.read = async (handle, query) => {
      if (query.kind !== "commit") return read(handle, query);
      entered.resolve();
      return held.promise;
    };
    await f.controller.refresh();
    await f.controller.selectRevision(f.latest);
    const loading = f.controller.loadParents();
    await entered.promise;
    let closing;
    if (transition === "revision") await f.controller.clearRevision();
    if (transition === "comparison") await f.controller.selectBase(parent);
    if (transition === "operation")
      await f.controller.selectOperation(otherOperation);
    if (transition === "close") closing = f.controller.close();
    held.resolve(commitDetail(commit("33".repeat(20))));
    await loading;
    await closing;
    assert.deepEqual(f.controller.state.parentCommits, []);
    assert.deepEqual(f.errors, []);
    await f.controller.close();
  }
});

test("parent reads stop after invalidation and refuse more than 64 missing cards before IO", async () => {
  const reads = [],
    ids = Array.from({ length: 65 }, (_, n) =>
      n.toString(16).padStart(40, "0"),
    );
  let current = true;
  const reader = {
    async read(handle, query) {
      reads.push([handle, query]);
      current = false;
      return commitDetail(commit(query.query.commit));
    },
  };
  assert.equal(
    await parentCandidates(reader, "pin", ids.slice(0, 3), [], () => current),
    undefined,
  );
  assert.equal(reads.length, 1);
  await assert.rejects(
    parentCandidates(reader, "pin", ids, [], () => true),
    /preview limit/,
  );
  assert.equal(reads.length, 1);
  const known = ids.map((id) => commit(id));
  assert.equal(
    (await parentCandidates(reader, "pin", ids, known, () => true)).length,
    65,
  );
  assert.equal(reads.length, 1);
});

test("commit card search retains exact IDs, native reverse-hex change IDs and native tags", () => {
  const c = commit(parent);
  c.bookmarks = [
    { name: "main", remote: "origin", added: true, removed: false },
  ];
  c.workspaces = ["default"];
  c.conflicted = c.divergent = true;
  const search = commitCardSearch(c.id, c);
  for (const value of [
    parent,
    "pppppppppppppppppppppppppppppppp",
    "ada@example.test",
    "main@origin",
    "default",
    "conflict",
    "divergent",
  ])
    assert.ok(search.includes(value), value);
  assert.equal(commitCardTags(c).length, 4);
});
