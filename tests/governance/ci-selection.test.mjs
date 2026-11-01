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
  planChanges(files, { root: "/repo", metadata, ...options });
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
  assert.ok(!app.gates.includes("storybook-interaction"));
});
test("renderer, catalog, release and native-test changes select complete consumers", () => {
  assert.ok(
    plan(["src/components/views/Main.svelte"]).gates.includes("headed"),
  );
  const catalog = plan(["catalog/plugins/Example.stories.ts"]);
  assert.ok(catalog.gates.includes("storybook-interaction"));
  assert.ok(!catalog.gates.includes("linux"));
  const release = plan(["scripts/release/build-linux.mjs"]);
  assert.deepEqual(release.gates, ["governance", "quality", "unit"]);
  assert.deepEqual(release.unit, ["governance"]);
  assert.ok(
    plan(["tests/desktop/startup-progress.test.mjs"]).gates.includes("headed"),
  );
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
    plan(["src-tauri/src/old.rs", "docs/old.md"]).gates.includes("headed"),
  );
  assert.ok(plan(["public/product.md"]).gates.includes("headed"));
});
test("Validate rejects skipped selected gates, failed unselected gates and incomplete plans", () => {
  const p = plan(["README.md"]),
    result = Object.fromEntries(
      gates.map((g) => [g, g === "governance" ? "success" : "skipped"]),
    );
  validateResults(p, result);
  for (const failure of [
    { ...result, governance: "skipped" },
    { ...result, headed: "failure" },
    { ...result, headed: "cancelled" },
    { ...result, unit: undefined },
  ])
    assert.throws(() => validateResults(p, failure));
  assert.throws(() => validateResults({}, result));
});
