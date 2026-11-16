import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  projectUnpublished,
  unpublishedRanges,
} from "../../scripts/ci-install.mjs";

test("Sync migration preserves released ranges and bounds its pending-contract projection", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  const original = structuredClone(manifest);
  const projected = projectUnpublished(manifest, () => true);
  assert.deepEqual(manifest, original);
  assert.equal(manifest.dependencies["@lapis-notes/app-profile"], "^0.2.2");
  assert.equal(manifest.dependencies["@lapis-notes/api"], "^0.6.5");
  assert.deepEqual(Object.keys(unpublishedRanges).sort(), [
    "@lapis-notes/api",
    "@lapis-notes/app-profile",
    "@lapis-notes/file-explorer",
    "@lapis-notes/language-service",
    "@lapis-notes/lapis-plugin-tasks",
    "@lapis-notes/ui",
    "@lapis-notes/workspace",
    "@lapismd/ai",
  ]);
  assert.equal(
    projected.dependencies["@lapis-notes/app-profile"],
    "file:.local/ci-packages/-lapis-notes-app-profile/package.tgz",
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
