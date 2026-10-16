# E-REVIEW-002: Retained native controls and foreground qualification

This completes the native relayout and review handoff from E-REVIEW-001.

```json
{
  "id": "E-REVIEW-002",
  "tasks": ["M0.1", "M4"],
  "requirements": [
    "LD-DESK-002",
    "LD-DESK-005",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-MIG-002"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "objc2": "0.6.5",
    "specValidator": "0.1.4"
  },
  "files": [
    "PLAN.md",
    "MIGRATION.md",
    "scripts/check-bundle.mjs",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "src-tauri/src/main.rs",
    "src-tauri/src/commands.rs",
    "src-tauri/src/window.rs",
    "src-tauri/src/lifecycle.rs",
    "src-tauri/src/macos_chrome.rs",
    "tests/desktop/window-chrome.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-REVIEW-001.md",
    "spec/src/history/E-REVIEW-002.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "relayout-cold-suite-first",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-relayout-final LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-relayout-final/window-state.json node --test --test-concurrency=1 tests/desktop/startup-progress.test.mjs tests/desktop/lifecycle.test.mjs tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/window-chrome.test.mjs tests/desktop/vault-return.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": { "passed": 16, "failed": 2 },
      "note": "Both failures occur in nativeSession's visibility guard before product assertions: external-change Close and failed-note-save Close. A window-focus request alone cannot unhide a background AppKit process. The other sixteen cases, including actual native rectangles across restore, pass. E2E readiness now calls public app.show, window.show and set_focus; no timeout, assertion or permission is weakened."
    },
    {
      "name": "visibility-regressions-exact-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-relayout-final LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-relayout-final/window-state.json node --test --test-concurrency=1 --test-name-pattern='external changes block Close|failed note saves block native close' tests/desktop/notes-conflicts.test.mjs tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": { "coldCases": 2 },
      "note": "Both exact cases pass without CUA foreground assistance. The tests still verify save/conflict barriers and normal native exit."
    },
    {
      "name": "final-webview-suite",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-visible-final LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-visible-final/window-state.json pnpm exec wdio run tests/desktop/wdio.conf.mjs",
      "result": "pass",
      "failures": 0,
      "counts": { "cases": 27, "specFiles": 5 },
      "note": "All actual-WebView shell, vault, conditional-write, database, Notes and accessibility cases pass with the final native helper and e2e activation. No CUA foreground assistance."
    },
    {
      "name": "final-cold-suite",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-visible-final LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-visible-final/window-state.json node --test --test-concurrency=1 tests/desktop/startup-progress.test.mjs tests/desktop/lifecycle.test.mjs tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/window-chrome.test.mjs tests/desktop/vault-return.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": { "coldCases": 18 },
      "note": "The full cold runner passes unassisted in 61.8 seconds. This includes actual AppKit control rectangles after startup, resize/focus and cold geometry restoration, plus chooser return, startup progress, conflict recovery, save barriers and repeated switching."
    },
    {
      "name": "ordinary-native-bundle",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --config '{\"build\":{\"beforeBuildCommand\":null}}' && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererJavaScriptFiles": 216,
        "normalAutomationMarkers": 0
      },
      "note": "The ARM64 preview bundle uses the previously freshly built, unchanged ordinary renderer. Identity and all automation/probe exclusion checks pass. The only later source edit is cfg(e2e) app activation, excluded from this ordinary artifact. Signing remains deferred."
    },
    {
      "name": "ordinary-review-initial-restore-wait",
      "command": "cua.getApp; app.getAXStateAndScreenshot; sample 85002 1",
      "result": "fail",
      "failures": 1,
      "note": "The ordinary app initially remains at Restore your notes. Native sampling shows the UI thread idle and vault restoration blocked inside the OS directory-open syscall, not a busy native-layout loop. Do not change or reset the user's vault/profile."
    },
    {
      "name": "ordinary-review-restored",
      "command": "app.getAXStateAndScreenshot",
      "result": "pass",
      "failures": 0,
      "note": "The same ordinary process subsequently restores tauri-vault and both existing editor panes without a data reset, profile change or product-code workaround. The initial filesystem wait's cause remains unestablished; this record does not claim a startup-performance fix. The macOS capture badge obscures native controls in the screenshot; their actual geometry is qualified separately above. Leave this app running for user review."
    },
    {
      "name": "complete-source-check",
      "command": "CARGO_BUILD_JOBS=2 pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Final source: zero Svelte errors/warnings, strict all-target Clippy, source/spec audits and formatting pass. The unchanged production native helper also passed 36 Node and 34 Rust cases, with two ignored subprocess helpers, in E-REVIEW-001."
    },
    {
      "name": "final-document-format-first",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 1,
      "note": "Progress generation leaves the new longer evidence lists in MIGRATION.md needing table formatting. Format the generated summary and rerun progress, specification and formatting checks. No product behavior changed."
    },
    {
      "name": "final-document-governance",
      "command": "pnpm progress:generate && pnpm exec prettier --write MIGRATION.md && pnpm check:progress && pnpm spec:check && pnpm format:check",
      "result": "pass",
      "failures": 0,
      "counts": { "tasks": 14, "evidenceRecords": 20, "specLanes": 4 },
      "note": "Fresh final evidence, generated progress, canonical validation, Rust formatting, mdBook, mapped spec-first and repository formatting pass. All original milestone gates/statuses remain unchanged."
    }
  ],
  "contractReview": "Native control geometry uses the qualified jj-store-style main-thread boundary; actual rectangle measurement exists only in e2e shell information. E2E readiness explicitly unhides and focuses the real app before its acknowledgement. Ordinary bundles exclude the probe and activation hook, retain exact IPC grants, and use the unchanged verified renderer. All sources remain in their owning package; Deno stays frozen.",
  "milestoneReview": "All fourteen original milestone gates and statuses remain unchanged. This record qualifies the requested review fixes, not M4's aggregate everyday-use gate. Properties/metadata protection and earlier shared-package qualification remain separate unfinished work. The ordinary app is restored for review. Commit these fixes and pause; do not start another migration slice."
}
```
