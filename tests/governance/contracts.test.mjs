import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../../spec-validator.config.mjs";
import { progressFindings } from "../../scripts/progress.mjs";

test("AI is a canonical contract in document roles and specification-first", () => {
  assert.ok(
    new RegExp(config.validators.specFirst.canonicalPattern).test(
      "spec/src/current/ai.md",
    ),
  );
  assert.ok(
    config.documentRoles.some(
      ({ pattern, role }) =>
        role === "contract" && new RegExp(pattern).test("current/ai.md"),
    ),
  );
});

test("AI policy, transport, views and catalog retain their dedicated owner", () => {
  for (const path of [
    "src/lib/ai/plugin/application.ts",
    "src/lib/native/ai/user-commands.ts",
    "src/components/ai/views/catalog-view.ts",
    "src-tauri/src/ai/admission.rs",
    "src-tauri/src/host/ai/policy.rs",
    "src-tauri/tests/ai_admission.rs",
    "tests/ai/commands/native-watch.test.ts",
    "tests/renderer/ai-acp-runtime.test.mjs",
    "tests/desktop/acp-transport.test.mjs",
    "catalog/plugins/ai/UserCommands.stories.ts",
    "catalog/support/ai/command-refresh.ts",
  ]) {
    const chapters = config.validators.specFirst.rules
      .filter(({ pattern }) => new RegExp(pattern).test(path))
      .flatMap(({ chapters }) => chapters ?? []);
    assert.ok(
      chapters.includes("spec/src/current/ai.md"),
      `${path} must retain its AI contract`,
    );
  }
});

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
    "src-tauri/src/host/vault/files.rs",
    "src-tauri/src/vault/system_actions/mod.rs",
    "src-tauri/src/vault/system_actions/macos.rs",
    "src-tauri/src/vault/action_targets.rs",
    "src-tauri/src/acceptance/actions.rs",
    "src-tauri/tests/system_action_targets.rs",
    "src-tauri/tests/macos_system_actions.rs",
    "tests/desktop/system-file-actions.test.mjs",
    "tests/renderer/native-system-actions.test.mjs",
    "src-tauri/src/vault/mutations.rs",
    "src-tauri/src/vault/creates.rs",
    "src-tauri/src/vault/staged.rs",
    "src-tauri/src/vault/resources.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/tests/vault_creates.rs",
    "src-tauri/src/watch/mod.rs",
    "src-tauri/src/watch/registry.rs",
    "src-tauri/src/host/vault/watch.rs",
    "src-tauri/tests/vault_mutations.rs",
    "src-tauri/tests/watch_registry.rs",
    "src/lib/native/native-bridge.ts",
    "src/lib/native/file-watch.ts",
    "src/lib/native/vault-client.ts",
    "src/lib/native/vault-path.ts",
    "src/lib/notes/notes-leave.ts",
    "src/lib/notes/notes-startup.ts",
    "src/components/views/NotesWorkspace.svelte",
    "tests/renderer/notes-leave.test.mjs",
    "tests/desktop/file-reconciliation.test.mjs",
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

test("M6 profile and native navigation retain their dedicated canonical owner", () => {
  assert.ok(
    new RegExp(config.validators.specFirst.canonicalPattern).test(
      "spec/src/current/navigation.md",
    ),
  );
  assert.ok(
    config.documentRoles.some(
      ({ pattern, role }) =>
        role === "contract" &&
        new RegExp(pattern).test("current/navigation.md"),
    ),
  );
  for (const path of [
    "src/lib/notes/notes-plugins.ts",
    "tests/desktop/navigation-search.test.mjs",
    "tests/desktop/navigation-graph.test.mjs",
  ]) {
    const chapters = config.validators.specFirst.rules
      .filter(({ pattern }) => new RegExp(pattern).test(path))
      .flatMap((rule) => rule.chapters ?? []);
    assert.ok(
      chapters.includes("spec/src/current/navigation.md"),
      `${path} must update its navigation contract`,
    );
  }
});

test("native window and integration features retain their canonical owners", () => {
  const owners = {
    "windows.md": [
      "src-tauri/src/host/windows/mod.rs",
      "src-tauri/src/host/windows/navigation.rs",
      "src-tauri/src/host/windows/macos_chrome.rs",
      "src-tauri/src/acceptance/popouts.rs",
    ],
    "integration.md": [
      "src-tauri/src/host/integration/mod.rs",
      "src-tauri/src/host/integration/menu.rs",
      "src-tauri/src/host/integration/services.rs",
      "src-tauri/src/integration/mod.rs",
      "src-tauri/src/integration/policy.rs",
      "src-tauri/src/integration/urls.rs",
      "src-tauri/src/acceptance/integration.rs",
    ],
  };
  for (const [owner, paths] of Object.entries(owners))
    for (const path of paths) {
      const chapters = config.validators.specFirst.rules
        .filter(({ pattern }) => new RegExp(pattern).test(path))
        .flatMap((rule) => rule.chapters ?? []);
      assert.ok(chapters.includes(`spec/src/current/${owner}`), path);
    }
});

test("repository source authority has its own canonical contract", () => {
  assert.ok(
    new RegExp(config.validators.specFirst.canonicalPattern).test(
      "spec/src/current/repository.md",
    ),
  );
  assert.ok(
    config.documentRoles.some(
      ({ pattern, role }) =>
        role === "contract" &&
        new RegExp(pattern).test("current/repository.md"),
    ),
  );
  for (const path of [
    "src-tauri/src/repository/mod.rs",
    "src-tauri/src/host/repository/policy.rs",
    "src-tauri/tests/repository_admission.rs",
  ]) {
    const chapters = config.validators.specFirst.rules
      .filter(({ pattern }) => new RegExp(pattern).test(path))
      .flatMap(({ chapters }) => chapters ?? []);
    assert.ok(chapters.includes("spec/src/current/repository.md"), path);
  }
});
