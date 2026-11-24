import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { nextPreviewVersion } from "../../scripts/release/version.mjs";
import { refreshReleaseContext } from "../../scripts/release/refresh-context.mjs";
import {
  projectionSourceInputs,
  checkArtifactProjection,
} from "../../scripts/dependency-automation/artifact-projection.mjs";
test("reviewed application versioning renews exact context without relaxing SDK mutation checks", (t) => {
  const root = mkdtempSync(join(tmpdir(), "desktop-release-context-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const p of [
    ...projectionSourceInputs,
    ".github/dependency-automation/artifact-projection.json",
  ]) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), readFileSync(p));
  }
  const before = checkArtifactProjection(root);
  const pkg = JSON.parse(readFileSync(join(root, "package.json")));
  pkg.version = nextPreviewVersion(pkg.version);
  writeFileSync(join(root, "package.json"), JSON.stringify(pkg));
  assert.throws(() => checkArtifactProjection(root), /immutable/);
  const next = refreshReleaseContext(root);
  assert.notEqual(next.shapeSha256, before.shapeSha256);
  assert.equal(checkArtifactProjection(root).shapeSha256, next.shapeSha256);
  pkg.dependencies[Object.keys(pkg.dependencies)[0]] = "^99.0.0";
  writeFileSync(join(root, "package.json"), JSON.stringify(pkg));
  assert.throws(() => checkArtifactProjection(root), /immutable/);
});
