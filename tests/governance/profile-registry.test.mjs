import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import semver from "semver";
import {
  projectUnpublished,
  unpublishedRanges,
} from "../../scripts/ci-install.mjs";

test("released retirement cohort preserves npm ranges and bounds the remaining private projection", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const original = structuredClone(manifest);
  const projected = projectUnpublished(manifest, () => true);
  assert.deepEqual(manifest, original);
  const released = {
    "@lapis-notes/api": "^0.6.16",
    "@lapis-notes/ui": "^0.2.8",
    "@lapis-notes/app-profile": "^0.2.6",
    i18next: "^26.3.4",
  };
  for (const [name, range] of Object.entries(released)) {
    assert.equal(manifest.dependencies[name], range);
    assert.equal(projected.dependencies[name], range);
  }
  assert.deepEqual(Object.keys(unpublishedRanges).sort(), [
    "@lapis-notes/file-explorer",
    "@lapis-notes/language-service",
    "@lapis-notes/lapis-plugin-tasks",
    "@lapis-notes/workspace",
    "@lapismd/ai",
  ]);
  assert.equal(
    projected.dependencies["@lapis-notes/language-service"],
    "file:.local/ci-packages/-lapis-notes-language-service/package.tgz",
  );
  assert.equal(
    projected.dependencies["@lapis-notes/history"],
    original.dependencies["@lapis-notes/history"],
  );
  assert.equal(projected.dependencies["@lapismd/mira"], "~0.2.0");
  assert.equal(
    projected.devDependencies["@lapis-notes/bases"],
    original.devDependencies["@lapis-notes/bases"],
  );
});

test("runtime localization resolves only patched registry peers", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const lock = parse(readFileSync("pnpm-lock.yaml", "utf8"));
  const versions = Object.keys(lock.packages)
    .filter((name) => name.startsWith("i18next@"))
    .map((name) => name.slice("i18next@".length));
  assert.equal(versions.length, 1);
  assert.ok(
    versions.every((version) => semver.satisfies(version, ">=26.3.4")),
    "every runtime localization resolution must contain the inherited-key repair",
  );
  assert.ok(semver.satisfies(versions[0], manifest.dependencies.i18next));
  const direct = lock.importers["."].dependencies.i18next;
  assert.equal(direct.specifier, manifest.dependencies.i18next);
  assert.equal(direct.version.split("(")[0], versions[0]);
  const api = Object.entries(lock.packages).filter(([name]) =>
    name.startsWith("@lapis-notes/api@"),
  );
  assert.equal(api.length, 1);
  assert.ok(semver.satisfies(versions[0], api[0][1].peerDependencies.i18next));
  assert.match(
    lock.packages[`i18next@${versions[0]}`].resolution.integrity,
    /^sha512-/,
  );
});
