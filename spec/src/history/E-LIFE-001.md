# E-LIFE-001: safe lifecycle and last-Notes restoration

Source and native qualification are recorded separately. External-edit
protection remains a required M4 follow-up.

```json
{
  "id": "E-LIFE-001",
  "tasks": ["M4"],
  "requirements": ["LD-LIFE-001", "LD-LIFE-002", "LD-LIFE-003", "LD-LIFE-005"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "tauri": "2.12.4",
    "specValidator": "0.1.4",
    "rust": "1.99.0"
  },
  "files": [
    "MIGRATION.md",
    "scripts/desktop-acceptance.mjs",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-LIFE-001.md",
    "spec/src/history/index.md",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/app.rs",
    "src-tauri/src/commands.rs",
    "src-tauri/src/lib.rs",
    "src-tauri/src/lifecycle.rs",
    "src-tauri/src/lifecycle_state.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/vault/profiles.rs",
    "src-tauri/src/vault_commands.rs",
    "src-tauri/tests/lifecycle_state.rs",
    "src-tauri/tests/notes_restore.rs",
    "src/NotesWorkspace.svelte",
    "src/Shell.svelte",
    "src/VaultLauncher.svelte",
    "src/desktop-lifecycle.ts",
    "src/main.ts",
    "src/shell.css",
    "src/vault-client.ts",
    "tests/desktop/native-session.mjs",
    "tests/desktop/notes-lifecycle.test.mjs",
    "tests/renderer/vault-client.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "before-notes-profile-target",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test notes_restore",
      "result": "fail",
      "failures": 1,
      "note": "Compilation rejects thirteen uses of the two absent last-Notes profile methods; no test case runs."
    },
    {
      "name": "after-native-profile-and-handshake-target",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test notes_restore --test lifecycle_state",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tests": 6
      }
    },
    {
      "name": "source-layout-regressions",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'flush|serializes an in-flight layout|accepted layout writes|background layout'",
      "result": "pass",
      "failures": 0,
      "counts": {
        "selected": 6,
        "completeWorkspaceFile": 124
      },
      "note": "Four original regressions first failed because flushLayout was absent. Four fixture assertions then required the real opened bottom dock and serialized sidebar widths. Final six selected cases and all 124 workspace cases pass. Source record preserves details."
    },
    {
      "name": "packed-public-type-regression",
      "command": "pnpm --filter @lapis-notes/api check:pack-types",
      "result": "fail",
      "failures": 1,
      "note": "The initial archive had the runtime method but its checked-in declaration was missing. The owning source now has a dist-facing contract and declaration; the corrected archive passes desktop Svelte check with zero diagnostics."
    },
    {
      "name": "source-full-qualification",
      "command": "pnpm test && pnpm build && pnpm check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "units": 1563,
        "existingSkips": 1,
        "buildTasks": 10,
        "checkTasks": 18
      },
      "note": "Source commands executed sequentially. Full unit, public build and check lanes pass before final archive packing."
    },
    {
      "name": "initial-native-cold-suite",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 1,
      "counts": {
        "existingWebViewChecksPassed": 24,
        "coldCasesPassed": 7,
        "coldCasesFailed": 1
      },
      "note": "Repeated-switch probe ran before Back-to-vaults teardown completed. The other seven cold geometry/Notes cases passed, including Close, Quit, failed save, failed reload, missing root and corrupt layout."
    },
    {
      "name": "switch-target-first-retry",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated-run> node --test --test-concurrency=1 --test-name-pattern='repeated vault switching' tests/desktop/notes-lifecycle.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The target then reached the next selection but clicked the still-disabled Open notes button. The helper now waits for the selected path and enabled control, retaining all original database-owner assertions."
    },
    {
      "name": "switch-target-repaired",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated-run> node --test --test-concurrency=1 --test-name-pattern='repeated vault switching' tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 1,
        "switches": 5
      },
      "note": "The complete final cold lane additionally edits each selected note and verifies its exact persisted content before checking database release."
    },
    {
      "name": "desktop-unit-and-rust",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "node": 28,
        "rust": 28,
        "rustSubprocessHelpersIgnored": 2
      }
    },
    {
      "name": "strict-check-first-attempt",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Strict Clippy rejected a collapsible if in native event delivery. An early-return form preserves behavior and passes strict Clippy."
    },
    {
      "name": "strict-check-format-followup",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "All semantic lanes passed; Prettier identified main capability JSON formatting. The permission values are unchanged and formatted before final qualification."
    },
    {
      "name": "corrected-public-archive-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "counts": {
        "errors": 0,
        "warnings": 0
      }
    },
    {
      "name": "full-native-acceptance-final",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "shell": 5,
        "vault": 9,
        "database": 3,
        "notes": 7,
        "coldLifecycleCases": 8,
        "coldProcesses": 12
      },
      "note": "Actual WebViews, isolated profiles and real disposable files. Close/Quit/Back flush pending text and restore the last vault/active note. Failed note/layout saves keep the process and dirty buffer available; retry succeeds. Reload keeps the native PID, missing roots preserve recovery, broken layouts remain visible, and five edited switches save exact disk content and release the old database. Native process PATH is /usr/bin:/bin."
    },
    {
      "name": "shared-consumer-interactions",
      "command": "pnpm test:storybook --force",
      "result": "pass",
      "failures": 0,
      "counts": {
        "notesInteractions": 249
      },
      "note": "Notes source: four fresh shards, 90 + 65 + 40 + 54; zero interaction/accessibility failures."
    },
    {
      "name": "shared-host-browser-and-legacy",
      "command": "LAPIS_SERVER_E2E_IMAGE=lapis-server-desktop-migration:runtime pnpm test:web:e2e --force; pnpm test:desktop:packaged --force --core; pnpm test:desktop:packaged --force",
      "result": "pass",
      "failures": 0,
      "counts": {
        "browserCases": 12,
        "legacyPackagedModes": 2
      },
      "note": "Current Linux dependency/runtime images and individually hashed host-built frontend; existing ARM64 legacy application rebuilt before both modes. Source record documents its existing ad-hoc launch factory. No package release or production signing."
    },
    {
      "name": "complete-desktop-check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Published specification validation, exact permissions, source/App ownership audits, Svelte diagnostics, strict Clippy and formatting all pass."
    },
    {
      "name": "complete-desktop-specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanes": 4
      }
    },
    {
      "name": "ordinary-application-bundle",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "bundleMiB": 108.21,
        "rendererJavaScriptFiles": 216,
        "automationMarkers": 0
      },
      "note": "Ordinary macOS ARM64 .app; signing remains deferred. The bundle has no Node/Deno runtime or native acceptance instrumentation."
    },
    {
      "name": "committed-archive-byte-equivalence",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --mira ../mira-mde-desktop-migration --plugins ../lapis-plugins-desktop-migration --already-built; node --input-type=module",
      "result": "pass",
      "failures": 0,
      "counts": {
        "matchingArchives": 10
      },
      "note": "readArchiveManifest revalidates every tarball and compares all ten SHA256 values with the actual installed native-qualified receipt. Committed source archives are byte-identical; no reinstall or new runtime qualification is needed."
    },
    {
      "name": "plugin-archive-consumer-interactions",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "counts": {
        "interactions": 235
      },
      "note": "Run in lapis-plugins-desktop-migration against nine verified core/Mira archives; shards 61 + 69 + 45 + 60. Tracked dependency files remain portable and unchanged."
    },
    {
      "name": "initial-progress-snapshot",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "The new evidence file was not yet in the Jujutsu snapshot; snapshotting made it visible to the fail-closed checker."
    },
    {
      "name": "initial-progress-file-coverage",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 2,
      "note": "Two later changed paths needed adding to fresh evidence coverage: src/shell.css and tests/renderer/vault-client.test.mjs. Both are covered in the final record."
    },
    {
      "name": "original-gates-and-progress",
      "command": "node --input-type=module; pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "unchangedOriginalGates": 14,
        "unchangedOtherTaskStatuses": 13,
        "tasks": 14,
        "evidenceRecords": 11
      },
      "note": "Inline assertions compare the ledger with @-: every original gate and every unrelated task status is unchanged. Only M4 advances to In progress. The generated tracker agrees."
    }
  ],
  "contractReview": "The application-wide .lapis default remains unchanged, without a Tauri override or legacy-state import. The desktop owns native lifecycle and last-Notes state; the API owns the single awaitable layout writer and its public declaration. Native acknowledgements are correlated, serialized, retryable and fail closed. Signing and publication stay deferred.",
  "milestoneReview": "The lifecycle/restoration slice is verified and committed in each owning repository. M0 through M3 remain Done. M4 remains In progress because LD-LIFE-004 external-edit conflict protection is not implemented or qualified. Its original full gate is unchanged; completedGates deliberately contains no M4 entry. No signing, publication or later milestone is completed.",
  "scope": "Qualified M4 lifecycle/restoration component only; external-edit protection and the original aggregate M4 gate remain open.",
  "archives": {
    "@lapis-notes/ui": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
    "@lapis-notes/api": "562c9f25662c968184a404770c403f0f607fc4382383b4b4e21337f77ac6d2b7",
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
    "git+https://github.com/lapismd/lapis-notes.git": "86e85f6e814430c1755147c913eb91090a439bf4",
    "git+https://github.com/lapismd/mira-mde.git": "b422c110b0b1e1de898b65a5647cbe0ae0eceb12",
    "git+https://github.com/lapismd/lapis-plugins.git": "3664313883a10b5bfdfca8898c820c8b4d2e4db4"
  }
}
```
