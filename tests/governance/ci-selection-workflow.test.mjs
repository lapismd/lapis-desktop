import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";

const source = readFileSync(".github/workflows/ci.yml", "utf8");
const workflow = parse(source);

test("planner gates expensive Linux tests and docs retain the published-only path", () => {
  assert.equal(workflow.on.workflow_dispatch.inputs.full.default, true);
  for (const name of [
    "dependency-packages",
    "quality",
    "unit",
    "bundle",
    "audit",
    "storybook-static",
    "storybook-interaction-shards",
  ])
    assert.match(workflow.jobs[name].if, /needs.changes.outputs/);
  const docs = JSON.stringify(workflow.jobs.governance);
  assert.doesNotMatch(
    docs,
    /ci-siblings|ci-prepare-links|ci-install|ai:prepare/,
  );
  assert.match(docs, /ci\/docs/);
  assert.ok(workflow.jobs.validate.needs.includes("prerequisites"));
  assert.match(workflow.jobs.qualification.if, /needs.changes.outputs.full/);
});

test("all executable test and quality jobs run on Linux", () => {
  for (const name of [
    "changes",
    "governance",
    "quality",
    "unit",
    "storybook-static",
    "storybook-interaction-shards",
    "storybook-interaction",
    "linux",
    "audit",
    "validate",
    "qualification",
  ])
    assert.match(
      JSON.stringify(workflow.jobs[name]["runs-on"]),
      /ubuntu/u,
      name,
    );
  for (const name of [
    "native-prepare",
    "native-families",
    "native-quarantine-diagnostic",
    "rust-backup-diagnostic",
    "headed",
  ])
    assert.equal(workflow.jobs[name], undefined, name);
  assert.doesNotMatch(source, /macos-native-lanes\.mjs/u);
  assert.doesNotMatch(source, /rust-backup-diagnostic\.mjs/u);
  assert.doesNotMatch(
    source,
    /native_diagnostic_cases|rust_backup_diagnostic/u,
  );
});

test("macOS is limited to prerequisite and ordinary bundle production", () => {
  assert.equal(workflow.jobs.bundle["runs-on"], "macos-15");
  const macConsumers = [...source.matchAll(/runs-on: macos-15/gu)];
  assert.equal(macConsumers.length, 1);
  assert.match(
    JSON.stringify(workflow.jobs.bundle),
    /run-turbo\.mjs ci:bundle/u,
  );
  assert.doesNotMatch(
    JSON.stringify(workflow.jobs.bundle),
    /ci:unit|ci:quality|test:desktop|macos-native-lanes/u,
  );
  assert.match(
    JSON.stringify(workflow.jobs["dependency-packages"]),
    /dependency_platforms/u,
  );
});

test("dependency cache identities remain distinct and Linux tests reuse Linux packages", () => {
  const keys = new Set();
  for (const name of ["quality", "unit", "bundle", "linux"]) {
    const steps = workflow.jobs[name].steps;
    const cache = steps.find((step) =>
      step.uses?.startsWith("Swatinem/rust-cache@"),
    )?.with;
    assert.ok(cache, name);
    assert.equal(cache["shared-key"], undefined);
    assert.equal(cache["add-job-id-key"], true);
    assert.equal(cache["cache-workspace-crates"], false);
    assert.match(cache.key, /ci-sources.json/);
    assert.ok(!keys.has(cache.key), name);
    keys.add(cache.key);
  }
  for (const name of ["quality", "unit"])
    assert.match(
      JSON.stringify(workflow.jobs[name]),
      /private-packages-linux-x64/u,
    );
  assert.match(
    JSON.stringify(workflow.jobs.linux),
    /cargo test --manifest-path/u,
  );
  assert.match(
    JSON.stringify(workflow.jobs.linux),
    /original_and_managed_reads_share_one_client_without_initializing_original_history/u,
  );
});
