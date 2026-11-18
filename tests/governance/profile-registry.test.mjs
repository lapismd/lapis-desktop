import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
    "@lapis-notes/api": "^0.6.9",
    "@lapis-notes/ui": "^0.2.5",
    "@lapis-notes/app-profile": "^0.2.6",
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
