import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Verify the staged resource without executing it on the packaging host. */
export function verifyCliResource(directory, target) {
  const manifest = JSON.parse(
    readFileSync(join(directory, "manifest.json"), "utf8"),
  );
  assert.equal(manifest.buildSchema, 1, "CLI preparation schema is stale");
  const source = readFileSync(
    new URL("../src-tauri/Cargo.toml", import.meta.url),
    "utf8",
  ).match(/lapis-app-core = .*rev = "([a-f0-9]{40})"/)?.[1];
  assert.ok(source, "Pinned CLI source is required");
  assert.equal(
    manifest.sourceRevision,
    source,
    "CLI source differs from the Core pin",
  );
  assert.equal(manifest.target, target, "CLI target differs from the bundle");
  assert.equal(manifest.profile, "release", "CLI must use the release profile");
  const binary = join(directory, "lapis");
  assert.equal(
    createHash("sha256").update(readFileSync(binary)).digest("hex"),
    manifest.sha256,
    "CLI checksum differs from its manifest",
  );
  assert.ok(
    (statSync(binary).mode & 0o111) !== 0,
    "CLI executable permission is required",
  );
  return manifest;
}
