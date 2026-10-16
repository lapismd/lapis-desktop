# E-STATE-001: Settings and hotkey writer admission

This continues M4 without completing its aggregate gate.

```json
{
  "id": "E-STATE-001",
  "tasks": ["M4"],
  "requirements": ["LD-LIFE-007", "LD-SESSION-004", "LD-GOV-008", "LD-MIG-002"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "tauri": "2.12.4"
  },
  "files": [
    "PLAN.md",
    "MIGRATION.md",
    "src/NotesWorkspace.svelte",
    "scripts/desktop-acceptance.mjs",
    "tests/desktop/settings-persistence.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/writer-audit.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-STATE-001.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "exact-api-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/app-state-persistence.test.ts",
      "result": "fail",
      "failures": 5,
      "note": "All initial concurrent-key, pending-close, failed-settings and external-hotkey cases fail before the API writer integration."
    },
    {
      "name": "rejected-reset-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/app-state-persistence.test.ts",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 5
      },
      "note": "The added invalid external-record case reveals early conflict clearing. Retain baseline and conflict until the reset callback succeeds; all six exact cases subsequently pass."
    },
    {
      "name": "native-settings-original-before",
      "command": "node --test --test-concurrency=1 tests/desktop/settings-persistence.test.mjs (old Properties bundle)",
      "result": "fail",
      "failures": 3,
      "counts": {
        "passed": 1
      },
      "note": "Failed-save recovery, external conflict and cold F6 restoration fail against the preceding bundle."
    },
    {
      "name": "initial-archive-cohort-merge",
      "command": "Merge source-owned Notes archives with the unchanged Mira/Markdown cohort; pnpm local:install",
      "result": "fail",
      "failures": 1,
      "note": "An absolute old tarball path caused SameFileError. A five-entry overlay was installed but was not accepted as cohort qualification. Correct the immutable directory merge, assert ten entries and verify all ten routes before building the updated renderer. No tracked dependency changes."
    },
    {
      "name": "initial-source-and-consumer-pass",
      "command": "Notes and Plugins: pnpm check --force; pnpm test --force; pnpm build --force; Notes: pnpm test:storybook --force",
      "result": "pass",
      "failures": 0,
      "counts": {
        "apiCases": 1035,
        "notesPackageCases": 1616,
        "notesCatalogCases": 256,
        "pluginUnitCases": 800
      },
      "note": "Initial API-only integration passes these lanes, but the next native run still exposes the shared Settings debounce boundary. These passes do not qualify the final bridge repair."
    },
    {
      "name": "native-settings-api-only",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/settings-after node --test --test-concurrency=1 tests/desktop/settings-persistence.test.mjs",
      "result": "fail",
      "failures": 3,
      "counts": {
        "passed": 1
      },
      "note": "Cold hotkeys pass. Settings close loses a deferred write; recovery followed by immediate close also loses a deferred write. One disk assertion assumed a schema default had already been persisted. Explicitly seed true in the isolated fixture; retain all disk/recovery assertions and deadlines."
    },
    {
      "name": "native-settings-seeded-before-bridge",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/settings-after node --test --test-concurrency=1 tests/desktop/settings-persistence.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 2
      },
      "note": "The same pre-bridge bundle now passes permission-failure recovery and cold hotkeys. Immediate close and post-recovery close still lose the shared Settings change."
    },
    {
      "name": "source-workspace-bridge-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace-state-persistence.test.ts",
      "result": "fail",
      "failures": 3,
      "note": "The initial two integration regressions fail; adding the independent queued API field case gives three failures. Correct the field to the existing built-in appearance setting before accepting the three-case baseline."
    },
    {
      "name": "source-workspace-bridge-after",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace-state-persistence.test.ts src/lib/__tests__/workspace.test.ts src/lib/__tests__/app-state-persistence.test.ts src/lib/__tests__/configuration.test.ts src/lib/__tests__/command.test.ts src/lib/__tests__/file-text-persistence.test.ts src/lib/__tests__/metadata-persistence.test.ts src/lib/__tests__/frontmatter-persistence.test.ts src/lib/__tests__/metadata-type-manager.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "exactCases": 3,
        "affectedCases": 190
      },
      "note": "The API Workspace adapter synchronously admits shared changes before debounce, submits a single changed field where supplied, and excludes API recovery projection from feedback writes."
    },
    {
      "name": "formatter-routing-attempts",
      "command": "Cross-repository pnpm exec prettier; source-owned pnpm exec prettier",
      "result": "fail",
      "failures": 2,
      "note": "The desktop invocation cannot resolve the source JSDoc plugin; the source formatter cannot infer a Svelte parser. Use the source formatter for TS/Markdown and the desktop explicit configuration for the standalone Svelte harness. No formatter configuration changes."
    },
    {
      "name": "stale-progress-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Generated MIGRATION.md was stale after adding E-STATE-001. Regenerate and format it; the subsequent specification check passes."
    },
    {
      "name": "root-sync-service-timeout",
      "command": "pnpm test --force",
      "result": "fail",
      "failures": 1,
      "counts": {
        "apiCasesPassed": 1038
      },
      "note": "The unchanged deno-host-services build case keeps completed receipts outside the bounded active journal exceeds its existing 5000ms deadline. The dependency failure interrupts the root lane; this is not accepted as a passing full suite."
    },
    {
      "name": "root-timeout-exact-and-full-retry",
      "command": "pnpm --filter @lapis-notes/deno-host-services exec vitest run src/sync-vault.test.ts -t 'keeps completed receipts outside the bounded active journal'; pnpm test --force",
      "result": "pass",
      "failures": 0,
      "counts": {
        "exactCases": 1,
        "rootTasks": 18,
        "apiCases": 1038,
        "notesPackageCases": 1619
      },
      "note": "The exact case takes 2.17 seconds. The complete original root lane passes with no source, skip or timeout changes. One existing legacy integration skip remains."
    },
    {
      "name": "final-source-check-build-and-cold-catalog",
      "command": "pnpm check --force; pnpm build --force; pnpm test:storybook --force",
      "result": "pass",
      "failures": 0,
      "counts": {
        "checkTasks": 18,
        "buildTasks": 10,
        "catalogCases": 256
      },
      "note": "The final API bridge and writer implementation pass every owning source task and all four fresh interaction/axe catalog shards. Existing root Deno static/build tasks remain unchanged; no Deno packaged app qualification or source edit is introduced."
    },
    {
      "name": "final-local-archive-cohort",
      "command": "node /Users/stevejuma/code/lapismd/lapis-desktop/scripts/pack-local-core.mjs /Users/stevejuma/code/lapismd/lapis-notes-desktop-migration --already-built; pnpm local:install .local/m4-settings-bridge/.local/archives/manifest.json; node /Users/stevejuma/code/lapismd/lapis-desktop/scripts/local-archives.mjs .local/archives/m4-settings-bridge-core.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "desktopArchives": 10,
        "desktopRoutes": 10,
        "pluginArchives": 9,
        "pluginRoutes": 28
      },
      "note": "Pack the five Notes public outputs after their normal prepack lanes pass, then copy the unchanged five Mira/Markdown archives into a new immutable cohort. Check all ten payload checksums and installed routes before renderer qualification. Tracked manifests and registry lockfiles remain unchanged. Packing runs from .local/m4-settings-bridge; the final command runs from lapis-plugins-desktop-migration."
    },
    {
      "name": "native-settings-bridge-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/settings-after node --test --test-concurrency=1 tests/desktop/settings-persistence.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 4,
        "coldProcesses": 6
      },
      "note": "The final bundle passes unassisted in 12.8 seconds: immediate close/cold settings restoration; failed save retained across close and Keep after permission repair; preserved external keys and disk recovery followed by another save; cold and restarted F6 override."
    },
    {
      "name": "desktop-foundation-checks",
      "command": "CARGO_BUILD_JOBS=2 pnpm test; CARGO_BUILD_JOBS=2 pnpm check; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodeCases": 36,
        "rustCases": 34,
        "ignoredRustHelpers": 2,
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Complete foundation tests and all-target strict Clippy pass serially. The final verified archive cohort also passes the full Desktop check, including public Svelte types, source/specification/progress audits and formatting."
    },
    {
      "name": "ordinary-review-bundle",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererJavaScriptFiles": 216,
        "normalAutomationMarkers": 0
      },
      "note": "The ordinary ARM64 Preview app passes identity and runtime checks and excludes all acceptance hooks and probes. Signing remains deferred. The separate acceptance bundle is prepared during the plugin catalog; canonical native acceptance still performs its own fresh build."
    },
    {
      "name": "final-plugin-consumer-qualification",
      "command": "pnpm check --force; pnpm test --force; pnpm build --force; pnpm test:storybook; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "checkTasks": 13,
        "testTasks": 13,
        "buildTasks": 12,
        "unitCases": 800,
        "catalogCases": 235
      },
      "note": "The verified API/archive consumer passes all four fresh interaction/axe shards. Audit retains the existing one moderate and one high ignored finding; no ignore or dependency policy is changed. Plugin source and tracked dependency files remain clean."
    },
    {
      "name": "canonical-native-frame-timeout",
      "command": "CARGO_BUILD_JOBS=2 pnpm test:desktop",
      "result": "fail",
      "failures": 6,
      "counts": {
        "startupPassed": 2,
        "webviewProductPassed": 22,
        "webviewProductFailed": 5,
        "teardownHooksFailed": 1
      },
      "note": "The conditional-write after-all hook times out waiting for executeAsync requestAnimationFrame after the visibility check. Five subsequent Notes cases fail in the same process, which reports a hidden startup-failure surface. Database conformance still passes; the cold continuation does not run. Preserve this failure and rerun exact affected fixtures before the full canonical command. No timeout or assertion is changed."
    },
    {
      "name": "exact-native-fixtures-after-frame-timeout",
      "command": "node_modules/.bin/wdio run tests/desktop/wdio.conf.mjs --spec tests/desktop/conditional.spec.mjs; node_modules/.bin/wdio run tests/desktop/wdio.conf.mjs --spec tests/desktop/notes.spec.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "conditionalCases": 3,
        "notesCases": 7
      },
      "note": "Each target receives a fresh absolute isolated root with the canonical Unicode vault and copied PNG seed. Conditional writes and their after-all return pass in 1.5 seconds; Notes startup, disk edit, attachment, accessibility and reopen pass in 8.7 seconds. No product or harness source changes, native activation assistance, skipped assertions or deadline changes. The precise transient activation cause remains unestablished; these narrow passes do not replace the complete canonical rerun."
    },
    {
      "name": "canonical-native-final",
      "command": "CARGO_BUILD_JOBS=2 pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "webviewCases": 27,
        "coldCases": 26,
        "totalCases": 53
      },
      "note": "The full correctly seeded command passes unassisted after its fresh renderer/native build. All five WebView spec files pass, including conditional teardown and all seven Notes cases. The final cold continuation passes 24 cases in 95.3 seconds, in addition to startup two. No product or harness change, activation assistance, skipped assertion or timeout adjustment resolves the preceding interruption; its exact transient activation cause remains unestablished."
    },
    {
      "name": "final-source-specification-mapping-before",
      "command": "pnpm spec:check (Notes source)",
      "result": "fail",
      "failures": 1,
      "counts": {
        "findings": 2
      },
      "note": "Spec-first requires a mapped workspace-shell chapter and plugin-model chapter for workspace.svelte.ts. Add the owning persistence and controlled-source contract notes, then rerun the exact source specification command. This changes documentation only; no runtime gate is waived."
    },
    {
      "name": "source-specification-mapping-after",
      "command": "pnpm spec:check; pnpm spec:validate (Notes source)",
      "result": "pass",
      "failures": 0,
      "counts": {
        "specificationRegressionCases": 38,
        "chapters": 172,
        "requirements": 1457
      },
      "note": "All canonical, mdBook, spec-first, explicit App-ownership, metadata and specification regression lanes pass after the two source contract notes. No runtime implementation changes follow archive packing."
    },
    {
      "name": "final-desktop-governance",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm format:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "milestones": 14,
        "evidenceRecords": 22
      },
      "note": "The generated tracker matches the sole milestone ledger, source boundaries and all four specification lanes pass, and formatting remains clean. M4 remains In progress, with Next paused for review and the remaining writer audit explicit."
    }
  ],
  "contractReview": "The owning API serializes logical configuration updates and retains pending/failed settings and hotkey drafts in the App-owned conditional writer registry. Its Workspace bridge admits shared Settings changes before presentation debounce and avoids feedback writes or reentry during guarded shutdown. Cold startup loads public hotkey overrides before workspace commands. Existing components and recovery UI are reused. No Deno source change, publication, signing or visual-baseline update.",
  "milestoneReview": "M4 remains In progress. Configuration and hotkeys are qualified components, not the complete enabled-writer audit. Core/plugin enablement, App Shell plugin state, compatibility plugin-data files, initial frontmatter admission failures and create/attachment close remain open. Preserve every original M4-M7 gate. The user requested a pause after this verified component is committed and the ordinary app is reopened for review; further implementation requires a resume request. API source is committed as 2bffe484b38761af197afe7ab9b0d7b3affb50d7. Its implementation payload has no difference from archive snapshot ebcb151ce59afb5cd783d3da3e490f6374f31ddc; later changes are documentation only. The ordinary review process was closed gracefully through its Quit action, preserving tauri-vault, and the verified Preview bundle is ready to reopen after this commit. Human review remains pending.",
  "archives": [
    {
      "name": "@lapis-notes/ui",
      "revision": "ebcb151ce59afb5cd783d3da3e490f6374f31ddc",
      "sha256": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9"
    },
    {
      "name": "@lapis-notes/api",
      "revision": "ebcb151ce59afb5cd783d3da3e490f6374f31ddc",
      "sha256": "004e0d180ef0e4ebf49917ce36312a935247495818f641761f6bfea406734275"
    },
    {
      "name": "@lapis-notes/language-service",
      "revision": "ebcb151ce59afb5cd783d3da3e490f6374f31ddc",
      "sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65"
    },
    {
      "name": "@lapis-notes/file-explorer",
      "revision": "ebcb151ce59afb5cd783d3da3e490f6374f31ddc",
      "sha256": "79d46a57325cfa601633c776bc128759020b962426c7f43ff35f67370c77e470"
    },
    {
      "name": "@lapis-notes/workspace",
      "revision": "ebcb151ce59afb5cd783d3da3e490f6374f31ddc",
      "sha256": "c4e9cc3e4d73edf3a76d93a297653781c471cb2dc6646d5d37d251899380151f"
    },
    {
      "name": "@lapis-notes/markdown",
      "revision": "40b4b0ca2dfc49adebc4ed087b7601bcdc4a8282",
      "sha256": "1fd2f7d7dbd33ec4a7627ba4ff9ecf5eed4d888d22c46fc21b8d3ac4e21cb96e"
    },
    {
      "name": "@lapismd/mira",
      "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
      "sha256": "ba44e98bc0c61490e48f7a7cf4ec24e819963d506145cf94792a83e68e6d39d6"
    },
    {
      "name": "@lapismd/mira-editor",
      "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
      "sha256": "850272c678a8e2e5106290189190eade8edab19be444235053f0945eb8ec41c3"
    },
    {
      "name": "@lapismd/mira-plugin-ai",
      "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
      "sha256": "efe9d5b774a0545e3119818e58987a34e6efdd488c45018c6418214740118823"
    },
    {
      "name": "@lapismd/mira-plugin-mermaid",
      "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
      "sha256": "0a8e215a3212d3e5075688a07b5da96e5a4ef01fa5fe2937c145da7882bf868e"
    }
  ]
}
```
