import assert from "node:assert/strict";
import test from "node:test";
import {
  oldestRevisionContaining,
  revisionComparisonDiagnostic,
  revisionComparisonState,
} from "../desktop/history-revision-selection.mjs";

test("selects the oldest file-bearing revision past newer startup checkpoints", async () => {
  const paths = new Map([
    ["working-copy", []],
    ["later-transcript", ["transcript.jsonl"]],
    ["startup-skills", ["SKILL.md"]],
    ["initial-transcript", ["transcript.jsonl"]],
  ]);
  assert.equal(
    await oldestRevisionContaining(
      [...paths.keys()],
      "transcript.jsonl",
      async (revision) => paths.get(revision),
    ),
    "initial-transcript",
  );
});

test("distinguishes a clean working copy from loaded and unavailable comparisons", () => {
  assert.equal(
    revisionComparisonState({ files: false, empty: false, unavailable: false }),
    "pending",
  );
  assert.equal(
    revisionComparisonState({ files: false, empty: true, unavailable: false }),
    "empty",
  );
  assert.equal(
    revisionComparisonState({ files: true, empty: false, unavailable: false }),
    "files",
  );
  assert.equal(
    revisionComparisonState({ files: false, empty: false, unavailable: true }),
    "unavailable",
  );
  assert.throws(
    () =>
      revisionComparisonState({ files: true, empty: true, unavailable: false }),
    /Conflicting revision comparison states: files, empty/u,
  );
});

test("reports every inspected revision when the file is absent", async () => {
  await assert.rejects(
    oldestRevisionContaining(
      ["newer", "older"],
      "transcript.jsonl",
      async (revision) => [`${revision}.md`],
    ),
    /No inspected revision changed transcript\.jsonl; older: older\.md; newer: newer\.md/u,
  );
});

test("bounds revision comparison diagnostics without hiding selection state", () => {
  assert.deepEqual(
    revisionComparisonDiagnostic({
      expected: "expected-revision",
      selected: "selected-revision",
      expanded: false,
      busy: true,
      files: false,
      empty: false,
      unavailable: false,
      paths: ["x".repeat(200), ...Array.from({ length: 20 }, (_, i) => `${i}`)],
    }),
    {
      expected: "expected-revision",
      selected: "selected-revision",
      expanded: false,
      busy: true,
      state: "pending",
      paths: ["x".repeat(160), ...Array.from({ length: 15 }, (_, i) => `${i}`)],
    },
  );
});
