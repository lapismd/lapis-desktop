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

test("paired ARM64 diagnostics reuse the normal artifact and never qualify a release", () => {
  const inputs = workflow.on.workflow_dispatch.inputs;
  assert.equal(inputs.native_diagnostic_cases.default, "");
  assert.equal(inputs.rust_backup_diagnostic.default, false);
  assert.match(workflow.concurrency.group, /diagnostic/u);
  assert.match(workflow.jobs.qualification.if, /native_diagnostic_cases/u);
  assert.match(workflow.jobs.qualification.if, /rust_backup_diagnostic/u);
  const native = workflow.jobs["native-quarantine-diagnostic"];
  assert.ok(native.needs.includes("native-prepare"));
  assert.ok(native.needs.includes("native-families"));
  const nativeSource = JSON.stringify(native);
  assert.match(nativeSource, /native-acceptance-artifact/u);
  assert.match(nativeSource, /--reuse-artifact/u);
  assert.match(nativeSource, /macos-native-lanes\.mjs quarantine/u);
  assert.doesNotMatch(nativeSource, /operation prepare/u);
  const nativeExecution = native.steps.find(
    (step) =>
      step.name === "Execute selected original bodies in isolated state",
  ).run;
  assert.match(
    nativeExecution,
    /--reuse-artifact=\.local\/ci-acceptance-artifact\/manifest\.json/u,
  );
  assert.doesNotMatch(nativeExecution, /--reuse-artifact\s/u);
  const rustJob = workflow.jobs["rust-backup-diagnostic"];
  assert.ok(rustJob.needs.includes("native-prepare"));
  assert.ok(rustJob.needs.includes("ci-tools"));
  const rust = JSON.stringify(rustJob);
  assert.match(rust, /native-acceptance-artifact/u);
  assert.match(rust, /ci-acceptance-artifact\.mjs verify/u);
  const toolsIndex = rustJob.steps.findIndex(
    (step) => step.uses === "./.github/actions/setup-ci-tools",
  );
  const diagnosticIndex = rustJob.steps.findIndex((step) =>
    step.run?.includes("rust-backup-diagnostic.mjs"),
  );
  assert.ok(toolsIndex >= 0, "The diagnostic must use verified CI tools");
  assert.doesNotMatch(rust, /validation\/install-tools\.mjs --ci/u);
  assert.match(rust, /rust-backup-diagnostic\.mjs/u);
  assert.match(rust, /LAPIS_DESKTOP_RUST_BACKUP_DIAGNOSTIC/u);
  assert.ok(
    rust.indexOf("ci-acceptance-artifact.mjs verify") <
      rust.indexOf("rust-backup-diagnostic.mjs"),
  );
  assert.ok(diagnosticIndex >= 0 && toolsIndex < diagnosticIndex);
  assert.ok(
    !workflow.jobs.validate.needs.includes("native-quarantine-diagnostic"),
  );
  assert.ok(!workflow.jobs.validate.needs.includes("rust-backup-diagnostic"));
});
test("Linux native jobs free unused runner trees before WebKit and Rust restore", () => {
  const steps = workflow.jobs.linux.steps;
  const free = steps.findIndex(
    (step) => step.name === "Free unused runner disk",
  );
  const webkit = steps.findIndex(
    (step) => step.name === "Install Linux WebKit build dependencies",
  );
  const restore = steps.findIndex(
    (step) => step.name === "Restore Rust dependency builds",
  );
  assert.ok(free >= 0 && free < webkit && webkit < restore);
  for (const path of [
    "/usr/share/dotnet",
    "/usr/local/lib/android",
    "/opt/ghc",
    "/usr/local/share/boost",
    "/usr/share/swift",
    "/opt/hostedtoolcache/CodeQL",
  ])
    assert.match(steps[free].run, new RegExp(path.replaceAll("/", "\\/")));
});
