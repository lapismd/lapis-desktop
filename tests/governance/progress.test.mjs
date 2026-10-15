import { test } from "node:test";
import assert from "node:assert/strict";
import {
  markdownProjection,
  validateProgress,
  inventoryErrors,
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
