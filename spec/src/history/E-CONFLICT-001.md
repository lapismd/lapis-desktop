# E-CONFLICT-001: API editor conflict recovery

This record qualifies API editor recovery separately from the remaining embedded
Markdown writers. The original M4 gate remains required.

```json
{
  "id": "E-CONFLICT-001",
  "tasks": ["M4"],
  "requirements": ["LD-LIFE-004", "LD-LIFE-007"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "specValidator": "0.1.4"
  },
  "files": [
    "MIGRATION.md",
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CONFLICT-001.md",
    "spec/src/history/index.md",
    "src/FileConflicts.svelte",
    "src/NotesWorkspace.svelte",
    "tests/desktop/native-session.mjs",
    "tests/desktop/notes-conflicts.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "before-editor-conflict-target",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-file-conflicts.test.ts",
      "result": "fail",
      "failures": 9
    },
    {
      "name": "after-editor-conflict-target",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-file-conflicts.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tests": 16
      },
      "note": "The initial nine pass, then an expanded fifteen-case target passes, then the final sixteen-case target adds the in-flight baseline regression."
    },
    {
      "name": "affected-editor-lifetime-and-vault-target",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-persistence.test.ts src/lib/__tests__/editor-document-lifetime.test.ts src/lib/__tests__/editor-document-loading.test.ts src/lib/__tests__/editor-rename-persistence.test.ts src/lib/__tests__/sync-editor-flush.test.ts src/lib/__tests__/vault.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tests": 60
      }
    },
    {
      "name": "native-before-conflict-recovery",
      "command": "pnpm exec tauri build --debug --no-bundle --features e2e --config src-tauri/tauri.e2e.conf.json; LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated-run> node --test --test-concurrency=1 tests/desktop/notes-conflicts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The initial one-case native target loses WebDriver after ordinary Close exits the app. Disk inspection confirms the local draft replaced External one instead of preserving it. This is the unsafe behavior, not an unrelated connection failure."
    },
    {
      "name": "requirement-status-format-first-attempt",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Requirement verification supports only Planned or Implemented. Keep LD-LIFE-004 Planned while the task remains In progress; do not expand accepted statuses or claim all writers are qualified."
    },
    {
      "name": "requirement-status-replacement-retry",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "The first literal replacement missed the formatter-aligned table row. A whitespace-aware replacement restores Planned without changing the permitted status set or the original M4 gate."
    },
    {
      "name": "source-declaration-test-under-parallel-builds",
      "command": "pnpm test",
      "result": "fail",
      "failures": 1,
      "counts": {
        "apiPassed": 1007,
        "apiFailed": 1
      },
      "note": "The existing portable build-helper declaration test exceeds its five-second limit while native and frontend compilers are running. No timeout or assertion is changed."
    },
    {
      "name": "exact-declaration-recheck-and-complete-source-test",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/build-tools/vite-declarations.test.ts && pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "declarationCases": 1,
        "units": 1585,
        "apiCases": 1008,
        "existingSkips": 1
      },
      "note": "The exact declaration case passes in 879 ms. The complete retry passes all eighteen tasks with no timeout or assertion changes."
    },
    {
      "name": "native-recovery-keyboard-driver-attempt",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated-run> node --test --test-concurrency=1 tests/desktop/notes-conflicts.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passedCases": 1,
        "failedCases": 1
      },
      "note": "Close/stale Keep/restart passes. The embedded driver does not activate the focused ordinary HTML button from synthesized Enter. The accessibility scan passes. Functional recovery now uses the supported click operation; independent actual macOS keyboard acceptance below verifies Return without product keyboard workarounds."
    },
    {
      "name": "native-keyboard-target-selection",
      "command": "cua.getApp; node .local/native-conflict-keyboard.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "wrongBundleSelections": 1,
        "invalidExecutableBindings": 1,
        "expiredFixtures": 1
      },
      "note": "Bundle-ID lookup selects the ordinary preview rather than an unbundled acceptance process. Stop only that introduced ordinary process without selecting documents; direct unbundled-path lookup is invalid. A uniquely identified temporary acceptance bundle solves targeting and retains the isolated test profile."
    },
    {
      "name": "actual-macos-keyboard-recovery",
      "command": "node .local/native-conflict-keyboard.mjs; cua.getApp(<unique temporary acceptance bundle>); app.pressKey(\"Return\")",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nativeKeyboardCases": 1,
        "normalExits": 1
      },
      "note": "The actual focused Use disk version button is observed through macOS accessibility. Real Return input selects the external text. The harness independently verifies editor text, unchanged disk bytes, removed conflict and normal Close. Subsequent AX observation sees App quit because the successful harness intentionally closes it; the process exits zero. The unique e2e bundle is not an ordinary distribution artifact."
    },
    {
      "name": "expanded-native-recovery-target",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated-run> node --test --test-concurrency=1 tests/desktop/notes-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "coldCases": 3,
        "accessibilityFailures": 0
      },
      "note": "Close is blocked, stale decisions require review, Keep survives cold restart, accepting disk discards without saving the draft, later edits save from the new baseline, and a closed tab retains its draft and shutdown barrier until explicit recovery."
    },
    {
      "name": "source-full-qualification",
      "command": "pnpm build; pnpm check; pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "buildTasks": 10,
        "checkTasks": 18,
        "units": 1585,
        "apiCases": 1008,
        "existingSkips": 1
      }
    },
    {
      "name": "source-storybook-and-package-policy",
      "command": "pnpm test:storybook --force; pnpm packages:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "interactions": 249,
        "packageBoundaryCases": 2,
        "localConsumerCases": 9,
        "releaseToolCases": 101
      },
      "note": "Four fresh interaction/axe shards: 90 + 65 + 40 + 54. No visual baselines are changed."
    },
    {
      "name": "current-web-server-and-legacy-hosts",
      "command": "LAPIS_SERVER_E2E_IMAGE=lapis-server-desktop-migration:runtime pnpm test:web:e2e --force; pnpm --filter @lapis-notes/desktop-deno package:app; pnpm test:desktop:packaged --force --core; pnpm test:desktop:packaged --force",
      "result": "pass",
      "failures": 0,
      "counts": {
        "browserCases": 12,
        "verifiedServerFrontendFiles": 445,
        "legacyModes": 2
      },
      "note": "Current Linux image stages and individually hashed host-built frontend; legacy local factory retains only its existing ad-hoc launch signature. Production signing and publication remain deferred."
    },
    {
      "name": "desktop-unit-and-strict-check",
      "command": "pnpm check; pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "node": 30,
        "rust": 34,
        "ignoredSubprocessHelpers": 2
      },
      "note": "Svelte diagnostics, strict Clippy, native/Rust and renderer/governance unit checks pass. The later optional native-session executable argument retains marker validation and is exercised by complete cold acceptance plus the unique keyboard bundle."
    },
    {
      "name": "complete-native-qualification",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "webviewCases": 27,
        "coldLifecycleCases": 11,
        "newConflictCases": 3
      },
      "note": "All five actual WebView specs and the complete eleven-case cold lane pass with isolated state and no Node/Deno on process PATH. This includes the three new recovery cases and all prior Close/Quit/reload, failure retention, restoration and edited switching cases."
    },
    {
      "name": "ordinary-bundle-exclusion",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "bundleMiB": 108.26,
        "rendererJavaScriptFiles": 216,
        "automationMarkers": 0
      },
      "note": "Ordinary ARM64 application has neither native acceptance instrumentation nor a Node/Deno runtime. The temporary keyboard e2e bundle is separate."
    },
    {
      "name": "original-task-gates-and-statuses",
      "command": "node --input-type=module",
      "result": "pass",
      "failures": 0,
      "counts": {
        "unchangedOriginalGates": 14,
        "unchangedTaskStatuses": 14
      },
      "note": "Compare every gate and task status with @-. Only M4 requirements, selected evidence and its next action advance; its original gate and In progress status remain unchanged. No completedGates.M4 entry is introduced."
    },
    {
      "name": "mapped-migration-chapter-first-attempt",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The changed task ledger needs its mapped canonical migration chapter. Add the API-editor qualification and explicit remaining preview-writer scope without changing the map or original gate."
    },
    {
      "name": "committed-source-archive-equivalence",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --mira ../mira-mde-desktop-migration --plugins ../lapis-plugins-desktop-migration --already-built; node --input-type=module",
      "result": "pass",
      "failures": 0,
      "counts": {
        "matchingArchives": 10
      },
      "note": "readArchiveManifest verifies every checksum and packed identity/version. All ten committed-source archives match the installed native-qualified receipt byte for byte and carry the expected committed source revisions; no reinstall or new runtime qualification is necessary."
    },
    {
      "name": "final-governance-and-format",
      "command": "pnpm check:progress; pnpm spec:check; pnpm format:check; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 13,
        "specificationLanes": 4
      },
      "note": "Fresh evidence covers every changed path; original gates and statuses stay unchanged. LD-LIFE-004 and LD-LIFE-007 remain Planned, M4 remains In progress, and signing/publication remain deferred."
    }
  ],
  "contractReview": "Document snapshots remain separate from vault cache and background reads. Conflict records and recovery stay owned by the original App across active, inactive and retired API editor contexts. The desktop consumes public registry actions and does not create a second save path.",
  "milestoneReview": "M4 remains In progress under the unchanged original gate. Qualified API text editors are one component. The enabled Markdown preview adapter still writes unconditionally and lacks registration, so LD-LIFE-004 and the explicit complete-writer-coverage requirement LD-LIFE-007 remain Planned. Their source-owned Mira/plugin integration and actual native acceptance remain required; no completedGates.M4 is permitted.",
  "scope": "Qualified API text-editor recovery component only; editable Markdown preview writers and complete writer coverage remain required for M4.",
  "archives": {
    "@lapis-notes/ui": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
    "@lapis-notes/api": "265b1fee9dfbf7c63a1be1d4774a457e8a89bce08bd7ce645be51fd3c5f49102",
    "@lapis-notes/language-service": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
    "@lapis-notes/file-explorer": "79d46a57325cfa601633c776bc128759020b962426c7f43ff35f67370c77e470",
    "@lapis-notes/workspace": "7e968a3173149c547e1195ea48b9a82ba9b396eae4b18166c53c009681453cc7",
    "@lapismd/mira": "2319ccb6279bb6bd6032046e0a22080e8527050b7c90e2e773735bb3e4d54f2e",
    "@lapismd/mira-editor": "850272c678a8e2e5106290189190eade8edab19be444235053f0945eb8ec41c3",
    "@lapismd/mira-plugin-ai": "efe9d5b774a0545e3119818e58987a34e6efdd488c45018c6418214740118823",
    "@lapismd/mira-plugin-mermaid": "0a8e215a3212d3e5075688a07b5da96e5a4ef01fa5fe2937c145da7882bf868e",
    "@lapis-notes/markdown": "51de62aa1477dfb75a27aff747d7b33b5b18eef5744308d334259e29145df687"
  },
  "sourceRevisions": {
    "git+https://github.com/lapismd/lapis-notes.git": "ebf033af0fc0752be5ce5ffa7d55784163d291b4",
    "git+https://github.com/lapismd/mira-mde.git": "b422c110b0b1e1de898b65a5647cbe0ae0eceb12",
    "git+https://github.com/lapismd/lapis-plugins.git": "3664313883a10b5bfdfca8898c820c8b4d2e4db4"
  }
}
```
