import { test } from "node:test";
import assert from "node:assert/strict";
import {
  markdownProjection,
  validateProgress,
  inventoryErrors,
  migrationSummary,
  migrationTimestamp,
} from "../../scripts/progress-model.mjs";

test("generated status comparison tolerates Markdown alignment but rejects changed status", () => {
  const compact = "| Task | Status |\n| --- | --- |\n| M0.0 | Done |";
  const formatted =
    "| Task    | Status |\n| ------- | ------ |\n| M0.0    | Done   |";
  assert.equal(markdownProjection(compact), markdownProjection(formatted));
  assert.notEqual(
    markdownProjection(compact),
    markdownProjection(formatted.replace("Done", "Planned")),
  );
});

const task = (id, overrides = {}) => ({
  id,
  status: "Planned",
  depends: [],
  requirements: ["LD-GOV-004"],
  gate: "Actual native launch",
  next: "Run the native gate",
  evidence: [],
  ...overrides,
});
const record = (overrides = {}) => ({
  id: "E-SHELL-001",
  tasks: ["M0.1"],
  requirements: ["LD-GOV-004"],
  files: [],
  revision: "enclosing-change",
  versions: { node: "24" },
  milestoneReview: "Reviewed",
  contractReview: "Changed",
  result: "pass",
  remaining: [],
  runs: [
    {
      name: "native",
      command: "pnpm test:desktop",
      result: "pass",
      failures: 0,
    },
  ],
  completedGates: { "M0.1": "Actual native launch" },
  ...overrides,
});
const requirements = new Set(["LD-GOV-004"]);
test("migration summary retains the ledger's explicit UTC update time", () => {
  const stamp = "2026-10-24 15:20:00 UTC";
  const source = `# Milestones\n\nLast updated **${stamp}**.\n`;
  assert.equal(migrationTimestamp(source), stamp);
  const summary = migrationSummary([task("M0.0")], stamp);
  assert.match(summary, /Last updated \*\*2026-10-24 15:20:00 UTC\*\*\./u);
  assert.notEqual(
    markdownProjection(summary),
    markdownProjection(summary.replace("15:20:00", "15:19:00")),
  );
  assert.throws(() => migrationTimestamp("Last updated **2026-10-24**."));
});
test("migration summary lists open gates without labelling deferred qualification as active work", () => {
  const tasks = [
    task("M3", { status: "Done" }),
    task("M4", { status: "In progress", next: "Full gates at M7 end" }),
    task("M5", { status: "In progress", next: "Full gates at M7 end" }),
    task("M6", { status: "In progress", next: "Qualify metadata and Graph" }),
    task("M7", { next: "Desktop integration" }),
    task("M14.7", {
      status: "Partial",
      next: "Deferred native/provider qualification",
    }),
  ];
  const summary = migrationSummary(tasks);
  assert.match(summary, /Open completion gates: M4, M5, M6, M7, M14\.7\./u);
  assert.doesNotMatch(summary, /Current work:|Oldest pending gate:/u);
  assert.match(
    summary,
    /\| M14\.7 \| Partial \| Deferred native\/provider qualification \|/u,
  );
  assert.match(summary, /Completed: M3\./u);
  assert.doesNotMatch(summary, /Next: M4|Native services.*deferred/u);
  assert.doesNotMatch(summary, /post-M7 plugin intake remain deferred/u);
  assert.match(
    migrationSummary([task("M0.0")]),
    /Open completion gates: M0\.0\./u,
  );
  assert.match(
    migrationSummary([task("M0.0", { status: "Done" })]),
    /Open completion gates: None\./u,
  );
});
test("Done requires the original gate and completed prerequisites", () => {
  const tasks = [
    task("M0.0"),
    task("M0.1", {
      status: "Done",
      depends: ["M0.0"],
      evidence: ["E-SHELL-001"],
    }),
  ];
  assert.match(
    validateProgress(tasks, [record()], requirements).join("\n"),
    /incomplete dependency/u,
  );
  tasks[0].status = "Done";
  tasks[0].evidence = ["E-SHELL-001"];
  assert.match(
    validateProgress(
      tasks,
      [record({ completedGates: { "M0.1": "Compilation only" } })],
      requirements,
    ).join("\n"),
    /original gate/u,
  );
});
test("a complete task accepts passing native evidence without promoting its successors", () => {
  const tasks = [
    task("M0.1", { status: "Done", evidence: ["E-SHELL-001"] }),
    task("M1", { depends: ["M0.1"] }),
  ];
  assert.deepEqual(validateProgress(tasks, [record()], requirements), []);
  assert.equal(tasks[1].status, "Planned");
});
test("cycles, false passes and unknown requirements fail closed", () => {
  const tasks = [
    task("M0.1", { depends: ["M1"] }),
    task("M1", { depends: ["M0.1"] }),
  ];
  const errors = validateProgress(
    tasks,
    [
      record({
        runs: [{ name: "native", command: "run", result: "pass", failures: 1 }],
      }),
    ],
    requirements,
  );
  assert.match(errors.join("\n"), /cycle/u);
  assert.match(errors.join("\n"), /invalid run/u);
});
test("inventory entries need a real destination, source revision and stable coverage", () => {
  const inventory = {
    sources: { old: { revision: "abc" } },
    coverage: { requirement: 2 },
    items: [
      {
        id: "legacy",
        kind: "requirement",
        source: "old",
        path: "spec/old.md",
        label: "Legacy gate",
        disposition: "port",
        task: "M99",
      },
    ],
  };
  assert.equal(inventoryErrors(inventory, [task("M1")]).length, 2);
});
