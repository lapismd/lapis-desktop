import test from "node:test";
import assert from "node:assert/strict";
import { historySource } from "../../src/lib/repository/history-source.ts";
import { openRepositoryView } from "../../src/components/repository/repository-navigation.ts";
test("persisted pins keep a strict source and legacy view state stays backup-scoped", () => {
  assert.equal(historySource({}), "backup");
  assert.equal(historySource({ source: "original" }), "original");
  for (const source of ["path", null, {}, "/vault/.jj"])
    assert.throws(() => historySource({ source }), /Invalid/);
});
test("opening original history never applies its pin to an existing backup tab", async () => {
  const calls = [],
    leaves = [];
  const workspace = {
    getLeavesOfType: () => leaves,
    openLeaf(type, state) {
      const leaf = {
        viewState: { type, state },
        async setViewState(value) {
          calls.push(["state", value]);
          leaf.viewState = value;
        },
      };
      leaves.push(leaf);
      return leaf;
    },
    revealLeaf: (leaf) => calls.push(["reveal", leaves.indexOf(leaf)]),
  };
  await openRepositoryView(workspace, "repository-history", "backup", {
    operation: "backup-op",
  });
  await openRepositoryView(workspace, "repository-history", "original", {
    operation: "original-op",
    revision: "original-commit",
  });
  assert.equal(leaves.length, 2);
  assert.deepEqual(leaves[0].viewState.state, {
    source: "backup",
    operation: "backup-op",
  });
  assert.deepEqual(leaves[1].viewState.state, {
    source: "original",
    operation: "original-op",
    revision: "original-commit",
  });
  await openRepositoryView(workspace, "repository-history", "original");
  assert.equal(leaves.length, 2);
  assert.deepEqual(calls.at(-1), ["reveal", 1]);
  await openRepositoryView(workspace, "repository-history", "original", {
    operation: "next-original",
  });
  assert.equal(leaves[1].viewState.state.operation, "next-original");
  assert.equal(leaves[0].viewState.state.operation, "backup-op");
});
