import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
const workflow = parse(readFileSync(".github/workflows/ci.yml", "utf8"));
test("planner gates expensive preparation and docs retain the published-only path", () => {
  assert.equal(workflow.on.workflow_dispatch.inputs.full.default, true);
  for (const name of [
    "dependency-packages",
    "quality",
    "unit",
    "bundle",
    "headed",
    "native-prepare",
    "native-families",
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
test("effective dependency cache keys separate variants, targets and deployment before restore", () => {
  const keys = new Set();
  for (const name of ["quality", "unit", "bundle", "native-prepare", "linux"]) {
    const steps = workflow.jobs[name].steps;
    const at = steps.findIndex((s) =>
      s.uses?.startsWith("Swatinem/rust-cache@"),
    );
    assert.ok(
      at >
        steps.findIndex((s) => s.uses?.startsWith("dtolnay/rust-toolchain@")),
      name,
    );
    const cache = steps[at].with;
    assert.equal(cache["shared-key"], undefined);
    assert.equal(cache["add-job-id-key"], true);
    assert.equal(cache["cache-workspace-crates"], false);
    assert.match(cache.workspaces, /src-tauri/);
    assert.match(cache.workspaces, /\.\.\/lapis-ai/);
    assert.match(cache.key, /ci-sources.json/);
    assert.match(cache.key, /runner.os/);
    assert.match(cache.key, /runner.arch/);
    assert.equal(
      steps.find((step) => step.env?.CACHE_IDENTITY).env.CACHE_IDENTITY,
      cache.key,
    );
    assert.match(cache["env-vars"], /MACOSX_DEPLOYMENT_TARGET/);
    assert.ok(
      steps.findIndex((s) => s.run?.includes("native-build-environment.mjs")) <
        at,
    );
    assert.ok(!keys.has(cache.key));
    keys.add(cache.key);
    if (name === "linux") assert.match(cache.key, /matrix.target/);
  }
});
test("native family aggregation fails closed and packages fan out without source rebuilds", () => {
  assert.equal(workflow.jobs["native-families"].strategy["fail-fast"], false);
  assert.match(
    workflow.jobs["native-families"].strategy.matrix.family,
    /outputs.native_families/,
  );
  assert.ok(workflow.jobs.headed.needs.includes("native-prepare"));
  assert.ok(workflow.jobs.headed.needs.includes("native-families"));
  assert.match(
    JSON.stringify(workflow.jobs.headed),
    /native-families.mjs aggregate/,
  );
  for (const name of [
    "quality",
    "unit",
    "bundle",
    "storybook-static",
    "storybook-interaction-shards",
    "audit",
    "linux",
    "native-prepare",
    "native-families",
  ]) {
    assert.ok(workflow.jobs[name].needs.includes("prerequisites"));
    assert.doesNotMatch(
      JSON.stringify(workflow.jobs[name]),
      /ci-prepare-links.mjs/,
    );
    assert.match(
      JSON.stringify(workflow.jobs[name]),
      /LAPIS_DESKTOP_CI_DEPENDENCY_ARTIFACT/,
    );
  }
  assert.match(
    JSON.stringify(workflow.jobs.linux),
    /cargo test --manifest-path/,
  );
  assert.match(
    JSON.stringify(workflow.jobs.linux),
    /original_and_managed_reads_share_one_client_without_initializing_original_history/,
  );
  assert.match(
    workflow.jobs["storybook-interaction-shards"].env
      .LAPIS_DESKTOP_CATALOG_PROFILE,
    /outputs.catalog_profile/,
  );
});
