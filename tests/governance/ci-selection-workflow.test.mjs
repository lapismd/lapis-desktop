import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
const workflow = parse(readFileSync(".github/workflows/ci.yml", "utf8"));
test("workflow selects gates before expensive setup and keeps full manual qualification", () => {
  assert.ok(workflow.jobs.changes);
  assert.equal(workflow.on.workflow_dispatch.inputs.full.default, true);
  for (const name of [
    "quality",
    "unit",
    "bundle",
    "headed",
    "audit",
    "storybook-static",
    "storybook-interaction-shards",
  ])
    assert.ok(workflow.jobs[name].if.includes("needs.changes.outputs"), name);
  assert.ok(workflow.jobs.linux.if.includes("needs.changes.result"));
  for (const step of workflow.jobs.linux.steps)
    assert.ok(step.if.includes("needs.changes.outputs.linux"));
  assert.ok(
    workflow.jobs.qualification.if.includes("needs.changes.outputs.full"),
  );
  const docs = JSON.stringify(workflow.jobs.governance);
  assert.doesNotMatch(
    docs,
    /ci-siblings|ci-prepare-links|ci-install|ai:prepare/,
  );
  assert.match(docs, /ci\/docs/);
  assert.ok(workflow.jobs.validate.needs.includes("changes"));
  assert.match(JSON.stringify(workflow.jobs.validate), /validate-results/);
});
test("Rust dependency caches cover app and helper workspaces after Rust selection", () => {
  for (const name of ["quality", "unit", "bundle", "headed", "linux"]) {
    const steps = workflow.jobs[name].steps;
    const at = steps.findIndex((s) =>
      s.uses?.startsWith("Swatinem/rust-cache@"),
    );
    assert.ok(
      at >
        steps.findIndex((s) => s.uses?.startsWith("dtolnay/rust-toolchain@")),
      name,
    );
    assert.match(steps[at].with.workspaces, /src-tauri/);
    assert.match(steps[at].with.workspaces, /\.\.\/lapis-ai/);
    assert.equal(steps[at].with["cache-workspace-crates"], false);
  }
});
