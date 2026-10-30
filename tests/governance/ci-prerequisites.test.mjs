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

test("private public archives share the consumer graph and preserve published registry packages", () => {
  const manifest = {
    dependencies: {
      "@lapismd/agent-ui": "^0.1.0",
      "@lapismd/repository-ui": "^0.1.0",
    },
    devDependencies: {},
  };
  for (const name of Object.keys(unpublishedRanges))
    manifest.devDependencies[name] = "^0.1.0";
  const projected = projectUnpublished(
    manifest,
    () => true,
    (name) => `/archives/${name}.tgz`,
  );
  assert.deepEqual(projected.dependencies, manifest.dependencies);
  for (const name of Object.keys(unpublishedRanges)) {
    assert.equal(projected.devDependencies[name], `file:/archives/${name}.tgz`);
    assert.equal(manifest.devDependencies[name], "^0.1.0");
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

test("semantic specification search remains an authoring command", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["spec:search"], "spec-validator search --semantic");
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.doesNotMatch(ci, /pnpm spec:(?:search|index)/);
});
