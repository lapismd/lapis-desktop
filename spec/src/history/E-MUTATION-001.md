# E-MUTATION-001: Properties and metadata writer intake

This slice resumes M4 before the requested progression through M7.

```json
{
  "id": "E-MUTATION-001",
  "tasks": ["M4"],
  "requirements": ["LD-LIFE-007", "LD-SESSION-003", "LD-MIG-002", "LD-GOV-008"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "tauri": "2.12.4"
  },
  "files": [
    "PLAN.md",
    "MIGRATION.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "scripts/desktop-acceptance.mjs",
    "spec/src/current/index.md",
    "spec/src/current/writer-audit.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "tests/desktop/properties-persistence.test.mjs",
    "src/NotesWorkspace.svelte",
    "spec/src/history/E-MUTATION-001.md",
    "scripts/check-bundle.mjs",
    "src-tauri/src/commands.rs",
    "src-tauri/src/macos_chrome.rs",
    "tests/desktop/native-visibility.mjs",
    "spec/src/current/verification.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "native-properties-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m4-properties-before node --test --test-concurrency=1 tests/desktop/properties-persistence.test.mjs",
      "result": "fail",
      "failures": 3,
      "counts": {
        "cases": 3,
        "passed": 0
      },
      "note": "The old acceptance bundle loses the property value on close, exposes no conflict after an external edit, and exits instead of retaining a failed Properties write. The value-entry path also needs verification against the rebuilt bundle; do not weaken disk or lifecycle assertions."
    },
    {
      "name": "metadata-submenu-hover-before",
      "command": "node --test --test-concurrency=1 --test-name-pattern='property type menu' tests/desktop/properties-persistence.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The embedded driver's synthetic hover does not open the submenu. Use the existing menu's keyboard Right action; do not change the component, timeout or assertion."
    },
    {
      "name": "focused-input-and-metadata-before",
      "command": "node --test --test-concurrency=1 --test-name-pattern='Properties edits save|property type menu' tests/desktop/properties-persistence.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "The full typed value is confirmed in the native input before close, but teardown loses it. Keyboard submenu activation works and reveals the separate missing first types.json creation. The host now blurs and settles the focused control before entering the editing guard; it also awaits metadata type loading during startup."
    },
    {
      "name": "exact-native-properties-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m4-properties-after node --test --test-concurrency=1 tests/desktop/properties-persistence.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 4,
        "coldProcesses": 6
      },
      "note": "All four real-WebView cases pass unassisted in 18.7 seconds: focused input close/cold restore, stale displayed record and explicit disk recovery, failed save retained through close and recovered after permission repair, and metadata type creation/cold restoration."
    },
    {
      "name": "manual-full-invocation-missing-seed",
      "command": "pnpm exec wdio run tests/desktop/wdio.conf.mjs (fresh m4-full root without the canonical seed)",
      "result": "fail",
      "failures": 12,
      "counts": {
        "specFiles": 5,
        "failedSpecFiles": 3,
        "reportedPasses": 13
      },
      "note": "This invocation omitted desktop-acceptance.mjs's seeded Unicode vault and attachment. Six vault failures, one database before-hook failure and five downstream Notes failures are reported. The chained cold suite does not run. Use the canonical runner's fixture preparation; all admission, disk and lifecycle assertions remain unchanged."
    },
    {
      "name": "canonical-startup-hidden-before",
      "command": "CARGO_BUILD_JOBS=2 pnpm test:desktop",
      "result": "fail",
      "failures": 2,
      "counts": {
        "startupPassed": 0,
        "startupFailed": 2
      },
      "note": "The correctly seeded canonical runner stops in the actual visibility guard before either startup case interacts with product content. Other browser catalogs are running concurrently. No hidden WebView pass is accepted."
    },
    {
      "name": "exploratory-repeated-ready",
      "command": "node --test --test-concurrency=1 tests/desktop/startup-progress.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 1,
        "failed": 1
      },
      "note": "Repeating shell_ready after driver attachment does not resolve the visibility issue reliably. Remove that exploratory helper and contract edit; retain the original visibility guard and startup deadline."
    },
    {
      "name": "native-startup-readonly-inspection",
      "command": "node --test --test-concurrency=1 --test-name-pattern='failed native startup' tests/desktop/startup-progress.test.mjs; CUA inventory/AX inspection",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 1
      },
      "note": "The isolated case passes while read-only CUA inspection is attempted. Two bundle copies make the ID ambiguous, and the full-path AX observation times out as the process closes. This is diagnostic evidence, not the final unassisted startup qualification. Serialize the remaining browser and native UI lanes before final native acceptance."
    },
    {
      "name": "final-source-and-catalog-qualification",
      "command": "Notes and Plugins: pnpm check --force; pnpm test --force; pnpm build --force; pnpm test:storybook; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "notesPackageCases": 1610,
        "apiCases": 1029,
        "notesCatalogCases": 256,
        "pluginUnitCases": 800,
        "pluginCatalogCases": 235
      },
      "note": "The final IO-aware API and Properties implementation passes all required source check/test/build tasks and both complete cold interaction/axe catalogs. Exact writer coverage passes 57 cases; the adapter passes seven. Each owning repository retains its own source record and source snapshot. One existing Notes legacy integration skip remains."
    },
    {
      "name": "parallel-rust-doctest-artifact-failure",
      "command": "CARGO_BUILD_JOBS=2 pnpm test (concurrent with native Tauri build and Clippy)",
      "result": "fail",
      "failures": 1,
      "counts": {
        "nodeCases": 36,
        "rustCases": 34,
        "ignoredRustHelpers": 2
      },
      "note": "All functional cases pass. Rustdoc aborts with E0460: a possibly newer objc2 crate than tauri's dependency. Concurrent Cargo lanes are sharing and recompiling the same output directory. Rerun the exact canonical test command serially after all other Cargo processes finish; do not change source or disable doctests."
    },
    {
      "name": "canonical-serialized-before",
      "command": "CARGO_BUILD_JOBS=2 pnpm test:desktop",
      "result": "fail",
      "failures": 8,
      "counts": {
        "passed": 41,
        "webviewCases": 27,
        "coldCases": 22
      },
      "note": "With both catalogs stopped, seven cold cases fail the unchanged visibility guard and one preview fixture cannot finish its menu/hover transition. Browser-lane concurrency alone does not explain the issue; do not waive these failures."
    },
    {
      "name": "native-foreground-diagnosis",
      "command": "Ignored diagnostic launcher with unchanged direct process ownership and CUA inspection; e2e native shell_info probe",
      "result": "fail",
      "failures": 1,
      "note": "A confirmed-live isolated process reports native visible=true, minimized=false, currentSpace=false, unoccluded=false and key=false while WebKit is hidden. Read-only inspection and accessibility Raise do not change it. Experiments with all-workspaces (five visible, then one hidden), fullscreen auxiliary, explicit ordering and always-on-top do not qualify stable activation. Remove every Space/stacking experiment and retain only the passive e2e probe."
    },
    {
      "name": "bounded-focus-cold-probe",
      "command": "node .local/diagnose-visibility.mjs (bounded focus helper; no open, CUA or native stacking/Space overrides)",
      "result": "pass",
      "failures": 0,
      "counts": {
        "coldProcesses": 12
      },
      "note": "Every process reaches actual native current-Space/unoccluded/key state and WebKit visible/focused, then a real animation frame. Repeating Tauri focus requests within the original 15-second guard resolves this observed cold-activation failure without changing assertions or deadlines. This diagnostic run supplements the canonical suite."
    },
    {
      "name": "canonical-native-final",
      "command": "CARGO_BUILD_JOBS=2 pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "webviewCases": 27,
        "coldCases": 22,
        "totalCases": 49
      },
      "note": "The full correctly seeded canonical runner passes unassisted after a fresh renderer/native build: startup progress, Notes disk/attachment/accessibility, save and conflict barriers, previews, all four Properties/type cases, switching, chooser return and native control geometry. The final cold chain takes 104.8 seconds; no Node/Deno is on its PATH."
    },
    {
      "name": "serial-default-tests-after",
      "command": "CARGO_BUILD_JOBS=2 pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodeCases": 36,
        "rustCases": 34,
        "ignoredRustHelpers": 2
      },
      "note": "Rerunning without another Cargo lane passes functional cases and doctests. No source change, suppression or disabled doctest is needed for the earlier E0460 artifact collision."
    },
    {
      "name": "ordinary-bundle-and-final-check",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --config '{\"build\":{\"beforeBuildCommand\":null}}'; pnpm check:bundle; CARGO_BUILD_JOBS=2 pnpm check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererJavaScriptFiles": 216,
        "normalAutomationMarkers": 0
      },
      "note": "The ordinary ARM64 bundle passes identity, runtime-content and both e2e probe-exclusion checks. Complete source checks pass, including zero Svelte errors/warnings, strict all-target Clippy, specification/source audits and formatting. Signing remains deferred."
    }
  ],
  "archives": [
    {
      "name": "@lapis-notes/api",
      "revision": "d5bddc6ebbd72ff48062939668853003541eee3d",
      "sha256": "c0ace270f1adf1dd785495fa938a18260a6ddbe13e18d9095f5322464ac66b26"
    },
    {
      "name": "@lapis-notes/markdown",
      "revision": "40b4b0ca2dfc49adebc4ed087b7601bcdc4a8282",
      "sha256": "1fd2f7d7dbd33ec4a7627ba4ff9ecf5eed4d888d22c46fc21b8d3ac4e21cb96e"
    }
  ],
  "contractReview": "The owning API now admits managed mutations after protecting existing writers, uses authoritative conditional text, and retains failed drafts in the existing recovery registry. The owning Markdown adapter supplies the displayed record and preserves local controller state during pending/conflicted persistence. No custom UI, Deno host changes, source aliases or registry publication. The final native helper only reports passive visibility diagnostics in e2e builds. The driver repeats public Tauri focus requests within the existing visibility deadline. All exploratory Space and stacking overrides are removed.",
  "milestoneReview": "M4 remains In progress. Source and native component qualification cannot replace its complete writer audit and aggregate gate. M5, M6 and M7 retain the full functionality and gates from PLAN.md. Continue until M7 is actually completed, then stop; M8 and later are outside this request. API source is committed as 86f63166 and Markdown as 265680b6; their archive source payloads have no implementation difference from the recorded precommit snapshots."
}
```
