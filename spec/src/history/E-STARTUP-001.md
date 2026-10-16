# E-STARTUP-001: Native Notes startup progress

The host restores Deno's branded public startup component and reports real work.

```json
{
  "id": "E-STARTUP-001",
  "tasks": ["M4"],
  "requirements": ["LD-SESSION-003", "LD-DESK-001"],
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
    "spec/src/history/E-STARTUP-001.md",
    "spec/src/history/index.md",
    "src/NotesWorkspace.svelte",
    "src/Shell.svelte",
    "tests/desktop/startup-progress.test.mjs",
    "tests/desktop/notes-lifecycle.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Exact startup/failure native target and complete consumer requalification."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-progress-before",
      "command": "LAPIS_STARTUP_ACCEPTANCE_EXECUTABLE=<isolated prior e2e bundle> node --test --test-concurrency=1 --test-name-pattern='real Notes startup' tests/desktop/startup-progress.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The real App opens successfully but no public WorkspaceStartup progress surface is rendered."
    },
    {
      "name": "startup-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero Svelte errors or warnings after using the existing public Design Core startup API."
    },
    {
      "name": "startup-table-integration-first-attempt",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Separate new requirement/verification tables are not the configured table boundary. A subsequent misplaced multiline row also fails validation. Keep one existing table for each contract and verification; do not change validators."
    },
    {
      "name": "startup-tables-corrected",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "requirements": 36,
        "chapters": 24
      }
    },
    {
      "name": "startup-and-failure-exact-native",
      "command": "node --test --test-concurrency=1 tests/desktop/startup-progress.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "coldCases": 2
      },
      "note": "The expanded target observes real storage opening, all five App startup phases, plugin detail, Lapis branding and accessible progress. A read-only temporary vault retains its failed step and returns through the public recovery action. Successful startup removes the surface and keeps the workspace at y=0."
    },
    {
      "name": "failed-layout-navigation-first-complete-run",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 1,
      "counts": {
        "webviewPassed": 27,
        "startupPassed": 2,
        "otherColdPassed": 14,
        "otherColdFailed": 1
      },
      "note": "The legacy broken-layout test tries to open a workspace menu before any workspace exists. Use the new public failed-startup recovery button for this one scenario; ordinary workspace navigation tests retain their menu path."
    },
    {
      "name": "failed-layout-exact-recovery-after",
      "command": "node --test --test-concurrency=1 --test-name-pattern='broken saved layout' tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "coldCases": 1
      },
      "note": "Assert the failed layout phase and recovery action, return normally, and preserve the malformed layout and note bytes. No file-integrity or lifecycle assertion is relaxed."
    }
  ],
  "contractReview": "The Deno host already composes public WorkspaceStartup with a Lapis logo and actual phase/plugin progress. Tauri now uses that same public component. The existing Deno branding component now lives in Workspace and both native hosts consume its public export; progress semantics remain Design Core-owned. No dependency source copy, alias, patch or new product acceptance hook is introduced.",
  "milestoneReview": "This restores requested startup feedback within the existing slice. Workspace tabs remain at the top after startup; M4 retains its original gate and In progress status. Properties and metadata writers remain next, and signing/publication stay deferred."
}
```
