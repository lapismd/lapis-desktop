import assert from "node:assert/strict";
import { test } from "node:test";
import {
  affectedCrates,
  gates,
  planChanges,
  validateResults,
} from "../../scripts/ci/impact.mjs";
const metadata = {
  workspace_members: ["app", "core", "independent"],
  packages: [
    {
      id: "app",
      name: "lapis-desktop",
      manifest_path: "/repo/src-tauri/Cargo.toml",
      dependencies: [{ name: "core" }],
    },
    {
      id: "core",
      name: "core",
      manifest_path: "/repo/src-tauri/crates/core/Cargo.toml",
      dependencies: [],
    },
    {
      id: "independent",
      name: "independent",
      manifest_path: "/repo/src-tauri/crates/independent/Cargo.toml",
      dependencies: [],
    },
  ],
};
const plan = (files, options = {}) =>
  planChanges(files, {
    root: "/repo",
    metadata,
    narrowProfiles: true,
    ...options,
  });
test("docs-only edits select specification checks without native/UI/test builds", () => {
  const p = plan([
    "docs/desktop-release.md",
    "spec/src/current/ci.md",
    "README.md",
  ]);
  assert.deepEqual(p.gates, ["governance"]);
  assert.deepEqual(p.unit, []);
  assert.equal(p.full, false);
});
test("Cargo closure includes dependent application crates and excludes unrelated crates", () => {
  assert.deepEqual(
    affectedCrates(["src-tauri/crates/core/src/lib.rs"], metadata, "/repo"),
    ["core", "lapis-desktop"],
  );
  const p = plan(["src-tauri/crates/independent/src/lib.rs"]);
  assert.deepEqual(p.rustPackages, ["independent"]);
  assert.ok(!p.gates.includes("headed"));
  const app = plan(["src-tauri/src/watch/mod.rs"]);
  assert.deepEqual(app.unit, ["rust"]);
  assert.ok(app.gates.includes("linux"));
  assert.ok(!app.gates.includes("bundle"));
  assert.ok(!app.gates.includes("storybook-interaction"));
  const serviceTest = plan(["src-tauri/tests/repository_original.rs"]);
  assert.ok(serviceTest.gates.includes("linux"));
  assert.ok(!serviceTest.gates.includes("headed"));
});
test("renderer, catalog, release and native-test changes select complete consumers", () => {
  const renderer = plan(["src/components/views/Main.svelte"]);
  assert.ok(!renderer.gates.includes("bundle"));
  assert.ok(renderer.gates.includes("linux"));
  assert.deepEqual(renderer.dependencyPlatforms, [
    { os: "ubuntu-24.04", id: "linux-x64" },
    { os: "ubuntu-24.04-arm", id: "linux-arm64" },
  ]);
  const catalog = plan(["catalog/plugins/Example.stories.ts"]);
  assert.ok(catalog.gates.includes("storybook-interaction"));
  assert.ok(!catalog.gates.includes("linux"));
  const release = plan(["scripts/release/build-linux.mjs"]);
  assert.deepEqual(release.gates, [
    "governance",
    "prerequisites",
    "quality",
    "unit",
  ]);
  assert.deepEqual(release.unit, ["governance"]);
  const native = plan(["tests/desktop/startup-progress.test.mjs"]);
  assert.ok(!native.gates.includes("bundle"));
  assert.ok(native.gates.includes("linux"));
});
test("unknown/shared changes, missing crate ownership and explicit full requests fail closed", () => {
  for (const files of [
    ["package.json"],
    ["src-tauri/Cargo.lock"],
    ["scripts/ci/impact.mjs"],
    ["unknown/new.file"],
    ["../escape.md"],
    [],
  ])
    assert.deepEqual(plan(files).gates, gates);
  assert.equal(plan(["README.md"], { full: true }).full, true);
  assert.equal(planChanges(["src-tauri/src/lib.rs"]).full, true);
  // Rename detection supplies both paths; moving code to docs cannot hide its former impact.
  assert.ok(
    plan(["src-tauri/src/old.rs", "docs/old.md"]).gates.includes("linux"),
  );
  assert.ok(plan(["public/product.md"]).gates.includes("linux"));
});
test("Validate rejects skipped selected gates, failed unselected gates and incomplete plans", () => {
  const p = plan(["README.md"]),
    result = Object.fromEntries(
      gates.map((g) => [g, g === "governance" ? "success" : "skipped"]),
    );
  validateResults(p, result);
  for (const failure of [
    { ...result, governance: "skipped" },
    { ...result, bundle: "failure" },
    { ...result, bundle: "cancelled" },
    { ...result, unit: undefined },
  ])
    assert.throws(() => validateResults(p, failure));
  assert.throws(() => validateResults({}, result));
});

test("ordinary catalog and mapped native tests declare exact smaller coverage", () => {
  const catalog = plan(["catalog/plugins/Launcher.stories.ts"]);
  assert.equal(catalog.schemaVersion, 2);
  assert.equal(catalog.profile, "ordinary");
  assert.equal(catalog.catalogProfile, "ordinary");
  assert.deepEqual(catalog.nativeFamilies, []);
  const native = plan(["tests/desktop/metadata-owner.test.mjs"]);
  assert.equal(native.profile, "ordinary");
  assert.deepEqual(native.nativeFamilies, []);
  assert.deepEqual(native.dependencyPlatforms, [
    { os: "ubuntu-24.04", id: "linux-x64" },
    { os: "ubuntu-24.04-arm", id: "linux-arm64" },
  ]);
  const renderer = plan(["src/components/views/Main.svelte"]);
  assert.equal(renderer.catalogProfile, "full");
  assert.deepEqual(renderer.nativeFamilies, []);
});

test("shared harness, shared presentation and unknown native ownership select full qualification", () => {
  for (const file of [
    "tests/desktop/native-session.mjs",
    "tests/desktop/new-unmapped.test.mjs",
    "src-tauri/src/host/windows/mod.rs",
    "src-tauri/src/acceptance/acp.rs",
    ".storybook/preview.ts",
    "catalog/support/shared.ts",
  ]) {
    const selected = plan([file]);
    assert.equal(selected.profile, "full", file);
    assert.equal(selected.catalogProfile, "full");
    assert.deepEqual(selected.gates, gates);
  }
  const renamed = plan([
    "tests/desktop/metadata-owner.test.mjs",
    "tests/desktop/acp-transport.test.mjs",
  ]);
  assert.deepEqual(renamed.nativeFamilies, []);
});

test("private prerequisite platforms cover every selected consumer and docs need none", () => {
  assert.deepEqual(plan(["README.md"]).dependencyPlatforms, []);
  assert.ok(!plan(["README.md"]).gates.includes("prerequisites"));
  const full = plan(["README.md"], { full: true });
  assert.deepEqual(full.dependencyPlatforms, [
    { os: "macos-15", id: "macos-arm64" },
    { os: "ubuntu-24.04", id: "linux-x64" },
    { os: "ubuntu-24.04-arm", id: "linux-arm64" },
  ]);
});

test("full marker cannot be made from incomplete, ordinary or malformed plan fields", () => {
  const full = plan(["README.md"], { full: true });
  const results = Object.fromEntries(gates.map((gate) => [gate, "success"]));
  validateResults(full, results);
  for (const change of [
    { schemaVersion: 1 },
    { profile: "ordinary" },
    { nativeFamilies: ["smoke"] },
    { catalogProfile: "ordinary" },
    { unit: ["governance"] },
    { quality: [] },
    { rustPackages: [] },
    { dependencyPlatforms: [] },
    { testedRevision: "not-an-exact-source" },
    { gates: full.gates.filter((gate) => gate !== "prerequisites") },
  ])
    assert.throws(() => validateResults({ ...full, ...change }, results));
  const ordinary = plan(["tests/desktop/metadata-owner.test.mjs"]);
  assert.throws(() => validateResults({ ...ordinary, full: true }, results));
  assert.throws(() =>
    validateResults(
      { ...ordinary, nativeFamilies: ["smoke", "unknown"] },
      results,
    ),
  );
});

test("unqualified ordinary profile rollout preserves full native/catalog scope without expanding docs gates", () => {
  const native = plan(["tests/desktop/metadata-owner.test.mjs"], {
    narrowProfiles: false,
  });
  assert.equal(native.profile, "ordinary");
  assert.equal(native.ordinaryProfilesEnabled, false);
  assert.deepEqual(native.nativeFamilies, []);
  assert.equal(native.catalogProfile, "full");
  const catalog = plan(["catalog/plugins/Launcher.stories.ts"], {
    narrowProfiles: false,
  });
  assert.equal(catalog.catalogProfile, "full");
  assert.ok(!catalog.gates.includes("headed"));
  assert.deepEqual(plan(["README.md"], { narrowProfiles: false }).gates, [
    "governance",
  ]);
  const results = Object.fromEntries(gates.map((gate) => [gate, "success"]));
  assert.throws(() =>
    validateResults({ ...native, nativeFamilies: ["smoke"] }, results),
  );
});
