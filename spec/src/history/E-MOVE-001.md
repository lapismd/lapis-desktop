# Internal Explorer mutations and editor retargeting

Targeted M5 native/source qualification; aggregate gates remain open.

```json
{
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "id": "E-MOVE-001",
  "tasks": ["M5"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-MIG-002",
    "LD-FILE-001",
    "LD-FILE-002",
    "LD-FILE-003",
    "LD-LIFE-001",
    "LD-LIFE-004"
  ],
  "revision": "enclosing-change",
  "files": [
    "MIGRATION.md",
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-MOVE-001.md",
    "spec/src/history/index.md",
    "tests/desktop/file-ui-mutations.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Complete remaining M5 attachment import/exclusive integration and inherited HTTP representation qualification.",
    "Run all session-deferred source, Storybook/accessibility, web, Desktop and ordinary-bundle lanes and original M4–M7 gates after M7 implementation."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-internal-mutation-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-ui-mutations.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 2
      },
      "note": "First harness attempt expects Keep.md instead of the existing /Keep.md notification. Correct that exact path. The subsequent baseline and editor-readiness diagnostic each retain one real failure: tree/disk move succeeds but the next actual editor edit never saves to the moved file. Native toast says Editor editing is protected. Dirty rename/move protection passes throughout."
    },
    {
      "name": "source-exact-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/vault-changes.test.ts",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 14
      },
      "note": "Real Editor rebinding during internal FileManager rename/move reproduces the native protected-editor error."
    },
    {
      "name": "source-exact-after",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/vault-changes.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 17
      },
      "note": "Includes follow-on queued mutation ordering. Event snapshots and existing editor ownership are preserved; mutation callbacks schedule detached projection without awaiting their own queue."
    },
    {
      "name": "source-affected",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/vault-changes.test.ts src/lib/__tests__/file-editing-sessions.test.ts src/lib/__tests__/editor-rename-persistence.test.ts src/lib/__tests__/file-manager-trash.test.ts src/lib/__tests__/editor-persistence.test.ts src/lib/__tests__/file-text-persistence.test.ts src/lib/__tests__/vault-reconciliation.test.ts src/lib/__tests__/workspace.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 207,
        "files": 8
      }
    },
    {
      "name": "source-map-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "Editing-registry implementation also requires the mapped architecture chapter. Add its actual contract; preserve the map."
    },
    {
      "name": "source-public-lanes",
      "command": "pnpm --filter @lapis-notes/api check; pnpm --filter @lapis-notes/api build; pnpm spec:first; pnpm spec:validate; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "requirements": 1472,
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Separate commands, publint, built type contracts and changed-file formatting pass. Notes source commit 63a5e7fe; owning source record spec/records/2026-10-16-internal-view-mutation-order.md."
    },
    {
      "name": "verified-archives",
      "command": "node scripts/local-archives.mjs .local/m5-ui-mutations/desktop.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 12,
        "importRoutes": 12
      },
      "note": "Refresh only the API from committed source 63a5e7fe. Tracked registry manifests and lockfiles remain portable."
    },
    {
      "name": "consumer-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      }
    },
    {
      "name": "fresh-native-build",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Wait for terminal zero before exercising the fresh bundle."
    },
    {
      "name": "native-internal-mutation-exact-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-ui-mutations.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3
      },
      "note": "Real Explorer rename and drop handlers preserve both rename/move collisions and pending edits, retarget saving to the moved path, and restore the active note/layout after cold restart. Dirty rename/move retain disk and draft bytes until explicit recovery. Browser DataTransfer drop dispatch exercises existing UI; this does not claim a physical OS drag gesture."
    },
    {
      "name": "desktop-governance",
      "command": "node --test tests/governance/contracts.test.mjs tests/governance/source-audit.test.mjs tests/renderer/notes-leave.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 11
      }
    },
    {
      "name": "desktop-spec-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Existing desktop chapter exceeds its byte limit by 101 bytes after annotation. Condense duplicated file-management prose while retaining every requirement, instead of raising the budget."
    },
    {
      "name": "affected-native-lifecycle-and-conflicts",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-reconciliation.test.mjs tests/desktop/file-deletion.test.mjs tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 16
      },
      "note": "Cold Source Editor and Markdown-preview conflicts, retained tabs, failed leave/reload, repeated switching, local-trash fallback and clean/dirty external changes all remain protected."
    },
    {
      "name": "specification-and-boundaries",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 33,
        "specificationLanes": 4
      },
      "note": "Separate commands pass. Preserve original milestone gates and session-deferred full qualification."
    }
  ],
  "contractReview": "Internal Explorer actions use shared FileManager protection, native atomic collision checks and original file views. An actual native failure is reproduced and fixed at the owning API boundary: App event projection queues between admitted guards before rebinding clean editors. Dirty external views retain their own recovery. No native permission, replacement UI, editing-lock exception or baseline relaxation is introduced.",
  "milestoneReview": "M5 remains In progress under its original complete gate. Native internal-mutation acceptance and the source component are separate from end-of-M7 full qualification. Deno, signing/publication, ordinary review profiles and post-M7 plugin planning remain unchanged.",
  "archives": [
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "379bc5b63f4cea2a29947ce47b78c1e318857c6d4377c81e45df8aba20477db3",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "63a5e7fe40eea45762b5842b588c742076c7dd1d",
        "packageDirectory": "packages/api"
      }
    }
  ]
}
```
