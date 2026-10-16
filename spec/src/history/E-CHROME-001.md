# E-CHROME-001: Tab-first native window

This record preserves independent before/after results and the unchanged
milestone gates.

```json
{
  "id": "E-CHROME-001",
  "tasks": ["M0.1", "M4"],
  "requirements": ["LD-DESK-002", "LD-DESK-005"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "specValidator": "0.1.4"
  },
  "completedGates": {},
  "files": [
    "PLAN.md",
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CHROME-001.md",
    "spec/src/history/index.md",
    "src/FileConflicts.svelte",
    "src/NotesWorkspace.svelte",
    "src/Shell.svelte",
    "src/main.ts",
    "src/notes-workspace.css",
    "src/shell.css",
    "src/window-chrome.css",
    "src/window-drag.ts",
    "tests/desktop/notes-lifecycle.test.mjs",
    "tests/desktop/notes.spec.mjs",
    "tests/desktop/shell.spec.mjs",
    "tests/desktop/window-chrome.test.mjs",
    "tests/desktop/workspace-navigation.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Complete desktop check, native and ordinary-bundle lanes after startup presentation integration."
  ],
  "runs": [
    {
      "name": "window-chrome-before",
      "command": "node --test --test-concurrency=1 tests/desktop/window-chrome.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The old extra shell header precedes the workspace."
    },
    {
      "name": "window-chrome-target-after",
      "command": "node --test --test-concurrency=1 tests/desktop/window-chrome.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "coldCases": 1,
        "topTabStrips": 3
      },
      "note": "All visible strips start at y=0 and are 40px high. Native-control clearance, collapsed/reopened sidebar and dynamic deep/false drag mapping pass."
    },
    {
      "name": "immutable-invoke-fixture",
      "command": "node --test --test-concurrency=1 tests/desktop/window-chrome.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "A temporary spy cannot replace immutable Tauri internals. Remove the invalid fixture; do not change native permissions or claim simulated IPC proves AppKit movement."
    },
    {
      "name": "native-automation-drag-attempts",
      "command": "node .local/native-window-chrome.mjs; cua.getApp; app.drag",
      "result": "fail",
      "failures": 1,
      "note": "Trusted automation reaches the deep-marked background but does not move the native window. The cause remains unestablished. Independent physical input subsequently passes."
    },
    {
      "name": "evidence-before-finalization",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Specification validation correctly rejects protected changes before fresh evidence records exist. Add coverage and retain all original gates."
    },
    {
      "name": "initial-manual-window-expired",
      "command": "node .local/native-window-chrome.mjs --manual",
      "result": "fail",
      "failures": 1,
      "note": "The user cannot see the first window and its ten-minute harness expires. Reopen the isolated copied e2e bundle, raise it and request the physical check again."
    },
    {
      "name": "manual-drag-transient-snapshot",
      "command": "node .local/native-window-chrome.mjs --manual",
      "result": "fail",
      "failures": 1,
      "note": "Real input moves the HTML sidebar spacer, and the user confirms normal dragging. The fixture closes after detecting initial movement and compares a mid-gesture x=606 with the final persisted x=594. Normal Close succeeds. Keep this sampling failure and independently verify the saved final position on cold relaunch."
    },
    {
      "name": "physical-html-drag-and-cold-restoration",
      "command": "node .local/native-window-chrome.mjs --manual; nativeSession cold restoration",
      "result": "pass",
      "failures": 0,
      "counts": {
        "physicalDragChecks": 1,
        "restoredPositions": 1,
        "normalExits": 2
      },
      "note": "The user confirms the window moves normally. Trusted mousedown targets the deep-marked sidebar tab spacer. Position changes from physical (280,200) to persisted (594,388); a fresh process restores exactly (594,388) and closes normally. No automation limitation waives this separate native result."
    },
    {
      "name": "strict-desktop-check-and-unit-lanes",
      "command": "pnpm check; pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodeCases": 30,
        "rustCases": 34,
        "ignoredSubprocessHelpers": 2
      },
      "note": "The restored startup component and tab-first shell pass Svelte checking without warnings, strict Clippy, formatting and native/renderer/governance units."
    },
    {
      "name": "original-task-gate-comparison",
      "command": "node --input-type=module",
      "result": "pass",
      "failures": 0,
      "counts": {
        "unchangedGates": 14,
        "unchangedStatuses": 14
      },
      "note": "Compare parseTasks with the committed parent. All original gates and statuses are preserved; no completedGates.M4 entry exists."
    }
  ],
  "contractReview": "User-requested alignment follows the Deno tab-first shell and jj-store overlay configuration. No visible app title or session toolbar precedes tabs. Native title stays hidden, native controls retain public-token clearance, and Tauri HTML handles own dragging; interactive controls are excluded. Back moves into the existing navigation menu and Mod+R retains guarded reload.",
  "milestoneReview": "M0.1 retains its original gate and completion record. This slice requalifies the changed presentation and native input separately. M4 stays In progress; signing and publication remain deferred."
}
```
