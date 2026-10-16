import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../../spec-validator.config.mjs";
import { progressFindings } from "../../scripts/progress.mjs";

test("file management is a governed contract in both document roles and spec-first", () => {
  const contracts = config.documentRoles.filter(
    (role) => role.role === "contract",
  );
  assert.ok(
    contracts.some(({ pattern }) =>
      new RegExp(pattern).test("current/files.md"),
    ),
  );
  assert.ok(
    new RegExp(config.validators.specFirst.canonicalPattern).test(
      "spec/src/current/files.md",
    ),
  );
  for (const path of [
    "current/verification.md",
    "current/index.md",
    "current/writer-audit.md",
    "history/E-FILES-001.md",
  ])
    assert.equal(
      contracts.some(({ pattern }) => new RegExp(pattern).test(path)),
      false,
    );
});
test("progress recognizes requirement IDs from every selected canonical chapter", () => {
  const result = progressFindings(process.cwd(), {
    checkSummary: false,
    checkRevision: false,
  });
  assert.deepEqual(result.errors, []);
});

test("M5 filesystem implementations and acceptance retain a mapped file contract", () => {
  for (const path of [
    "src-tauri/src/file_commands.rs",
    "src-tauri/src/vault/mutations.rs",
    "src-tauri/tests/vault_mutations.rs",
    "src/lib/native/native-bridge.ts",
    "tests/desktop/file-operations.test.mjs",
  ]) {
    const chapters = config.validators.specFirst.rules
      .filter(({ pattern }) => new RegExp(pattern).test(path))
      .flatMap((rule) => rule.chapters ?? []);
    assert.ok(
      chapters.includes("spec/src/current/files.md"),
      `${path} must update its owning file contract`,
    );
  }
});
