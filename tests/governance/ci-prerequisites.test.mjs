import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sourceUrl } from "../../scripts/ci-siblings.mjs";
import {
  projectUnpublished,
  unpublishedRanges,
} from "../../scripts/ci-install.mjs";

test("CI source downloads require full immutable commits and safe repository names", () => {
  const source = {
    name: "lapis-notes",
    repository: "lapismd/lapis-notes",
    revision: "a".repeat(40),
  };
  assert.equal(
    sourceUrl(source),
    `https://codeload.github.com/lapismd/lapis-notes/tar.gz/${source.revision}`,
  );
  for (const change of [
    { revision: "main" },
    { name: "../existing" },
    { repository: "other/repo/../../escape" },
  ])
    assert.throws(() => sourceUrl({ ...source, ...change }), /full commit/);
});

test("source-fix archives share the graph while tracked ranges and unaffected registry packages remain portable", () => {
  const manifest = {
    dependencies: {
      "@lapismd/agent-ui": "^0.2.0",
      "@lapismd/repository-ui": "^0.1.1",
      "@lapismd/design-core": "^0.7.4",
      "@lapis-notes/workspace": "^0.3.1",
      "@lapismd/terminal": "^0.1.2",
      "@lapis-notes/bases": "^0.2.0",
      "@lapis-notes/history": "^0.2.0",
    },
    devDependencies: {
      "@lapis-notes/lapis-plugin-tasks": "^0.1.1",
    },
  };
  for (const name of Object.keys(unpublishedRanges))
    if (!Object.hasOwn(manifest.dependencies, name))
      manifest.devDependencies[name] = "^0.1.0";
  const original = structuredClone(manifest);
  const projected = projectUnpublished(
    manifest,
    () => true,
    (name) => `/archives/${name}.tgz`,
  );
  assert.deepEqual(manifest, original);
  assert.equal(projected.dependencies["@lapismd/repository-ui"], "^0.1.1");
  assert.equal(projected.dependencies["@lapismd/design-core"], "^0.7.4");
  assert.equal(projected.dependencies["@lapis-notes/workspace"], "^0.3.1");
  assert.equal(projected.dependencies["@lapismd/terminal"], "^0.1.2");
  assert.equal(projected.dependencies["@lapismd/agent-ui"], "^0.2.0");
  assert.equal(projected.dependencies["@lapis-notes/bases"], "^0.2.0");
  assert.equal(projected.dependencies["@lapis-notes/history"], "^0.2.0");
  assert.equal(
    projected.devDependencies["@lapis-notes/lapis-plugin-tasks"],
    "^0.1.1",
  );
  for (const name of Object.keys(unpublishedRanges)) {
    const section = Object.hasOwn(manifest.dependencies, name)
      ? "dependencies"
      : "devDependencies";
    assert.equal(projected[section][name], `file:/archives/${name}.tgz`);
    assert.equal(manifest[section][name], "^0.1.0");
  }
});

test("hosted native acceptance prepares real artifacts and passes their inventory to every consumer", () => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const setup = ci.indexOf("node --import tsx scripts/ci-native-fixtures.mjs");
  const run = ci.indexOf("run: node scripts/run-turbo.mjs ci:headed");
  assert.ok(setup > 0 && setup < run);
  assert.match(
    ci.slice(setup, run),
    /LAPIS_DESKTOP_PORTABLE_FIXTURES: .local\/ci-native-plugins\/manifest.json/,
  );
  assert.match(
    readFileSync("tests/desktop/distribution-fixtures.mjs", "utf8"),
    /process.env.LAPIS_DESKTOP_PORTABLE_FIXTURES/,
  );
});

test("native fixtures install plugins before importing the release signer", () => {
  const source = readFileSync("scripts/ci-native-fixtures.mjs", "utf8");
  const install = source.indexOf('["install", "--frozen-lockfile"]');
  const imported = source.indexOf("scripts/plugin-release.mjs");
  assert.ok(install > 0 && imported > install);
  assert.match(source, /node_modules\/fflate\/package\.json/);
});

test("semantic specification search remains an authoring command", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["spec:search"], "spec-validator search --semantic");
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.doesNotMatch(ci, /pnpm spec:(?:search|index)/);
});
