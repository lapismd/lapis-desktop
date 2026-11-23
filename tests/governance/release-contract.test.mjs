import test from "node:test";
import assert from "node:assert/strict";
import config from "../../spec-validator.config.mjs";
test("release configuration and automation retain distribution contract governance", () => {
  for (const path of [
    ".changeset/config.json",
    "scripts/release-tools/package.json",
    ".github/workflows/version-desktop.yml",
    ".github/workflows/release-auto.yml",
    ".github/workflows/release-cli-tap.yml",
  ]) {
    const chapters = config.validators.specFirst.rules
      .filter((r) => new RegExp(r.pattern).test(path))
      .flatMap((r) => r.chapters);
    assert.ok(chapters.includes("spec/src/current/distribution.md"), path);
  }
});
