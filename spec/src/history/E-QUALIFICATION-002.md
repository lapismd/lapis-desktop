# Final native and ordinary-bundle qualification

This record closes the qualification begun in E-QUALIFICATION-001 once every
original M4–M7 gate passes. Failed attempts remain explicit.

```json
{
  "id": "E-QUALIFICATION-002",
  "tasks": ["M4", "M5", "M6", "M7"],
  "requirements": [
    "LD-MIG-002",
    "LD-GOV-008",
    "LD-LIFE-001",
    "LD-LIFE-002",
    "LD-LIFE-003",
    "LD-LIFE-004",
    "LD-LIFE-005",
    "LD-LIFE-006",
    "LD-LIFE-007",
    "LD-SESSION-003",
    "LD-VAULT-007",
    "LD-SESSION-004",
    "LD-REC-001",
    "LD-REC-002",
    "LD-FILE-001",
    "LD-FILE-002",
    "LD-FILE-003",
    "LD-FILE-004",
    "LD-FILE-005",
    "LD-FILE-006",
    "LD-FILE-007",
    "LD-NAV-001",
    "LD-NAV-002",
    "LD-NAV-003",
    "LD-NAV-004",
    "LD-NAV-005",
    "LD-NAV-006",
    "LD-NAV-007",
    "LD-NAV-008",
    "LD-INT-001",
    "LD-INT-002",
    "LD-INT-003",
    "LD-INT-004",
    "LD-INT-005",
    "LD-INT-006",
    "LD-INT-007",
    "LD-INT-008",
    "LD-INT-009"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/writer-audit.md",
    "spec/src/current/desktop.md",
    "spec/src/current/integration.md",
    "spec/src/history/index.md",
    "spec/src/history/E-QUALIFICATION-002.md",
    "src-tauri/tauri.conf.json",
    "tests/desktop/preview-conflicts.test.mjs",
    "tests/desktop/window-chrome.test.mjs",
    "README.md",
    "scripts/desktop-acceptance.mjs",
    "spec/src/current/migration.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M4": "Cold edit → save → quit → relaunch restores content and session. Failed saves prevent silent close; external edits never silently overwrite dirty buffers; repeated switching leaves no stale sessions or subscriptions.",
    "M5": "UI and disk stay consistent after internal and external changes. Dirty-note rename/delete, collisions, watcher overflow/reconciliation, and teardown are covered.",
    "M6": "Searches and metadata reflect edits, renames, deletions, and restart; navigation opens the intended note and preserves layout.",
    "M7": "Cold launch and already-running delivery pass; external links open safely; menu actions use the same application commands as the UI."
  },
  "runs": [
    {
      "name": "canonical-native-before-final-preview-chrome-repair",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 4,
      "counts": {
        "startupPassed": 2,
        "foundationPassed": 27,
        "coldProfilePassed": 58,
        "coldProfileFailed": 4
      },
      "note": "All M7 integration and note/file/Search/Graph/settings/Properties cases pass. Three preview fixtures fail before card opening; post-resize controls measure top=9,height=14 rather than center y=20. Raw HTTP lane is not reached. Log native-canonical-final.log."
    },
    {
      "name": "relative-acceptance-root-runner-error",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/run-V75jIQ node --test --test-concurrency=1 tests/desktop/preview-conflicts.test.mjs tests/desktop/window-chrome.test.mjs",
      "result": "fail",
      "failures": 4,
      "note": "Native startup correctly requires an absolute isolated profile root; this invocation is invalid. Retry with the absolute root, without relaxing admission. Log native-preview-chrome-before.log."
    },
    {
      "name": "unchanged-exact-preview-chrome-retry",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/run-V75jIQ node --test --test-concurrency=1 tests/desktop/preview-conflicts.test.mjs tests/desktop/window-chrome.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 4
      },
      "note": "Unchanged exact cold cases pass, exposing intermittent qualification rather than resolving it. Logs native-preview-chrome-exact-before.log. Preserve the aggregate failure and strengthen the actual input/resize prerequisites."
    },
    {
      "name": "preview-keyboard-traversal-attempt",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/run-V75jIQ node --test --test-concurrency=1 tests/desktop/preview-conflicts.test.mjs tests/desktop/window-chrome.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 3
      },
      "note": "Shift-Tab/Tab does not reliably return to the link under native WebKit tab order. Keep the focus-visible assertion; establish keyboard modality then focus the explicit trigger. Log native-preview-chrome-regression-before.log."
    },
    {
      "name": "preview-keyboard-focus-and-dirty-authority",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/run-V75jIQ node --test tests/desktop/preview-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3
      },
      "note": "Actual native WebView: keyboard modality and explicit focus-visible trigger, local draft before external bytes. Exact draft/disk, stale recovery decision, normal close, cold content restoration, accessibility and retired-owner assertions remain. Log native-preview-focus-after.log."
    },
    {
      "name": "fresh-server-image-and-full-web",
      "command": "docker build --progress=plain -f packages/server-deno/Dockerfile -t lapis-server:desktop-migration-m7-69cb664e .; exact Playwright server-host case; pnpm test:web:e2e",
      "result": "pass",
      "failures": 0,
      "counts": {
        "exactServerPassed": 1,
        "completeWebPassed": 12
      },
      "note": "Separate terminal-zero commands using LAPIS_SERVER_E2E_IMAGE=lapis-server:desktop-migration-m7-69cb664e. Fresh image sha256:eb372c6d34ae2e67c3267ef837735ba9166f0f34cfc4a1d8e41b527cac8819a1. Prior checksum, stopped-daemon and 3 GiB OOM failures remain in E-QUALIFICATION-001 and the Notes server record. Logs web-server-image-8g.log, web-server-exact-after.log, web-full-after.log."
    },
    {
      "name": "docker-original-settings-restored",
      "command": "docker ps --format {{.Names}}; docker desktop stop; restore and read MemoryMiB in settings-store.json",
      "result": "pass",
      "failures": 0,
      "note": "No containers remain. Temporary 8192 MiB change was explicitly user-approved. Restore only MemoryMiB=3072, preserve all other settings, await Docker stop exit zero and verify the stored value. Original Docker state was stopped. Local journal docker-memory-restoration.json."
    },
    {
      "name": "preview-chrome-after-matched-inset",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json; LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/run-V75jIQ node --test --test-concurrency=1 tests/desktop/preview-conflicts.test.mjs tests/desktop/window-chrome.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 4
      },
      "note": "Separate terminal-zero build and exact native run. All preview recovery cases and native controls pass after three distinct resizes and cold restoration. The configured titlebar container now matches the helper. Logs native-preview-chrome-build.log and native-preview-chrome-after.log."
    },
    {
      "name": "desktop-after-final-native-config-and-fixtures",
      "command": "pnpm check; pnpm test; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererGovernanceCases": 71,
        "rustCases": 68
      },
      "note": "Three separate terminal-zero commands after the matched inset and preview fixture repair. Strict types, all-target Clippy, formatting and specification checks pass. The two ignored Rust subprocess helpers run through passing parent tests. Receipts qualification/desktop-qualified.json."
    },
    {
      "name": "notes-final-mapped-spec-and-commit",
      "command": "pnpm spec:check; pnpm exec prettier --check changed source stories and canonical/evidence files; jj commit",
      "result": "pass",
      "failures": 0,
      "counts": {
        "sourceSpecCases": 38
      },
      "note": "Separate terminal-zero commands. Final source commit 6e6611bf80a015b7e0be56350d01cf41490628a4; worktree clean. Earlier 404-line and missing mapped-chapter failures are retained in the Notes server record; original limits/mappings remain enforced. Docker and story corrections do not change the API archive payload pinned at 69cb664e. Log notes-final-spec-mapped.log."
    },
    {
      "name": "canonical-cold-profile-green-http-build-harness-failure",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 1,
      "counts": {
        "startupPassed": 2,
        "foundationPassed": 27,
        "coldProfilePassed": 62,
        "coldProfileFailed": 0,
        "rawHttpPassed": 1,
        "gzipFixtureBuildFailed": 1
      },
      "note": "All cold native cases pass, including three preview recoveries, exact draft protection and repeated native resizes. The last development-resource fixture cannot spawn Cargo because the harness inherits the intentionally restricted PATH. The actual native app process PATH remains independently restricted by nativeSession. Log native-canonical-qualified.log."
    },
    {
      "name": "complete-http-family-after-host-build-path-repair",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/run-eNbC7O node --test --test-concurrency=1 tests/desktop/file-http-representation.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      },
      "note": "The host harness builds its controlled development fixture with the pinned Cargo toolchain. Both actual app launches still receive only /usr/bin:/bin. Raw binary GET/HEAD/IPC and actual WebView gzip HTML/module assertions all pass. Log native-http-harness-after.log."
    },
    {
      "name": "complete-canonical-native-qualified",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "startupCases": 2,
        "foundationCases": 27,
        "coldProfileCases": 62,
        "resourceRepresentationCases": 2,
        "totalCases": 93
      },
      "note": "One complete terminal-zero command after the final harness PATH repair. Fresh real macOS WebView build, all lifecycle/writers/files/Search/metadata/Graph/integration cases and both resource lanes pass. App processes use /usr/bin:/bin, isolated profiles and real disposable vaults. Native window geometry, stored bytes and queue receipts are measured directly. Log native-canonical-complete.log."
    },
    {
      "name": "ordinary-bundle-and-exclusion-audit",
      "command": "pnpm build; pnpm exec tauri build --debug --bundles app --config '{\"build\":{\"beforeBuildCommand\":\"\"}}'; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Three separate terminal-zero commands. Fresh production assets build first; the ordinary bundle embeds that identical output with only the redundant beforeBuildCommand disabled. Actual ordinary Preview bundle is arm64, has no Node/Deno runtime, acceptance drivers, receipt instrumentation or profile overrides. Production signing remains deferred. Logs ordinary-renderer-final.log, ordinary-bundle-final.log and bundle-final.log; report .local/bundle-check.json."
    },
    {
      "name": "ordinary-preserved-profile-review-launch",
      "command": "Launch the exact ordinary bundle executable with PATH=/usr/bin:/bin and no acceptance environment; inspect the actual app through CUA",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary app restores /Users/stevejuma/Documents/tauri-vault through its existing profile. Actual workspace and existing note are visible without an acceptance driver or test profile. Leave it open for review. No user note is edited. Local receipt ordinary-review-confirmed.json."
    }
  ],
  "contractReview": "Preserve every original M4–M7 gate and enabled writer. Shared source and public archives remain authoritative. Native roles, App-owned commands and bounded queue/services qualify M7; OS notification denial remains explicit, without claiming a visible banner. Match Tauri's 26px vertical inset plus 14px controls to the helper's 40px container, avoiding a later draw shrinking it by four pixels. No baseline, source alias, package patch, signing, publication or Deno desktop edit.",
  "milestoneReview": "Every original M4–M7 gate passes with completed dependencies and no qualification gaps. Full source/Storybook/axe/Web/native/bundle lanes are complete. The ordinary preserved-profile app is open for review. M8 is not started; signing, publication, later plugins and other platforms remain deferred.",
  "gateReview": {
    "M4": "All enabled writers are accounted for in writer-audit.md. Cold note save/Close/Quit/relaunch, failed note/layout/settings/plugin/Properties writes, external editor/preview conflicts and retired drafts, hotkey restore, Safe Mode, database reopen and repeated vault switching pass. Source ownership and pending-admission regressions pass in full source lanes.",
    "M5": "Actual Explorer create/rename/move/delete/import and native actions preserve collision bytes, dirty notes, intended paths, clean projection and restart layout. Rust bounded overflow/rescan tests, source reconciliation tests and actual native watcher delivery/retirement cover overflow and teardown. Direct gzip and raw GET/HEAD/IPC gates both pass.",
    "M6": "Native Search, metadata panels and global/local Graph reflect edits, external rename/create/delete, preserve pending settings/failures and restore after cold restart. Ordinary internal links, node navigation and Tags/All Properties query handoffs open the intended Notes views with saved layout.",
    "M7": "Cold, second-instance and operating-system URL delivery share one native queue/owner, wait for the mounted workspace and preserve pending saves. Bounded external opening and component-owned links act once. Native menus route to the same ready App/chooser/leave coordinator. Physical About/Copy/Paste/Open Vault/Undo/Redo/Quit acceptance is retained in E-INTEGRATION-001. Notification permission denial is explicit; no visible banner is claimed."
  }
}
```
