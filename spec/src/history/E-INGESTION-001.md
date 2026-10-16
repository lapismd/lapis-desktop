# App-owned external file reconciliation

Targeted M5 integration evidence; aggregate gates remain open.

```json
{
  "id": "E-INGESTION-001",
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
    "LD-LIFE-003",
    "LD-LIFE-004"
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
    "scripts/desktop-acceptance.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec-validator.config.mjs",
    "src/components/views/NotesWorkspace.svelte",
    "src/lib/notes/notes-leave.ts",
    "src/lib/notes/notes-startup.ts",
    "tests/desktop/file-reconciliation.test.mjs",
    "tests/desktop/notes-lifecycle.test.mjs",
    "tests/governance/contracts.test.mjs",
    "tests/renderer/notes-leave.test.mjs",
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-INGESTION-001.md",
    "spec/src/history/index.md"
  ],
  "result": "pending",
  "remaining": [
    "Complete remaining M5 native/UI consistency, attachment import/exclusive integration, available native reveal/system-trash and inherited HTTP response normalization.",
    "After M7 implementation, run every session-deferred full source, Storybook/accessibility, web, Desktop and normal bundle lane and the original M4\u2013M7 gates."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "source-stable-tree-before-and-after",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/vault-reconciliation.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 10
      },
      "note": "Notes 109e208a. Six initial failures, one scan/rename serialization failure and one binary-cache failure are preserved in the owning record. Stable node/index/descendant projection, complete bounded scans and retirement pass. 61 affected operation/editor and 58 metadata cases pass."
    },
    {
      "name": "source-watch-before-and-after",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/vault-changes.test.ts src/lib/__tests__/vault-reconciliation.test.ts src/lib/__tests__/directory-watcher.test.ts src/lib/__tests__/file-editing-sessions.test.ts src/lib/__tests__/editor-persistence.test.ts src/lib/__tests__/editor-rename-persistence.test.ts src/lib/__tests__/file-text-persistence.test.ts src/lib/__tests__/workspace.test.ts src/lib/__tests__/cache.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 239,
        "files": 9,
        "watchServiceCases": 14
      },
      "note": "Notes 74f544e2. Initial missing-service collection error, missing projection case, Svelte class fixture errors, private Workspace-field type errors and mapped chapter omissions are preserved in its owning source record. Real Editor clean refresh and dirty conflict recovery pass alongside clean/dirty view routing and bounded start/stop/retry cases."
    },
    {
      "name": "source-public-checks",
      "command": "pnpm --filter @lapis-notes/api check; pnpm --filter @lapis-notes/api build; pnpm spec:first; pnpm spec:validate; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0,
        "requirements": 1470
      },
      "note": "Separate source commands, publint, built type contracts and changed-file formatting pass. Full source/story/web lanes remain session-deferred."
    },
    {
      "name": "native-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-reconciliation.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Actual Explorer never displays Created.md written physically after the vault opens. The previous bundle has transport but no App ingestion."
    },
    {
      "name": "leave-before",
      "command": "node --test tests/renderer/notes-leave.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "New leave helper is missing; collection fails before cases execute."
    },
    {
      "name": "leave-exact",
      "command": "node --test tests/renderer/notes-leave.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 4
      },
      "note": "Stop precedes persistence, failed save resumes before rejection, failed cleanup prevents teardown and preserves resume errors, and partially disposed Apps do not restart."
    },
    {
      "name": "explicit-map-before",
      "command": "node --test --test-name-pattern='M5 filesystem implementations' tests/governance/contracts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "New Notes watch integration paths lack an explicit files.md map. Add the map rather than relying on general shell coverage."
    },
    {
      "name": "affected-node",
      "command": "node --test tests/renderer/notes-leave.test.mjs tests/renderer/native-file-watch.test.mjs tests/renderer/vault-client.test.mjs tests/governance/contracts.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 26
      }
    },
    {
      "name": "verified-public-archives",
      "command": "node scripts/local-archives.mjs .local/m5-ingestion/desktop.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 12,
        "importRoutes": 12
      },
      "note": "Only API changes; preserve the qualified other eleven and portable tracked semver files."
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
      "note": "Actual WebView qualification begins only after the build terminal exits zero, using the fresh verified public API archive and isolated child profiles."
    },
    {
      "name": "native-clean-exact-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-reconciliation.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "The original missing-Created.md scenario passes. Physical create, clean content refresh, rename, editing/saving to the new path and deletion all reconcile through actual Explorer and editor UI."
    },
    {
      "name": "native-clean-and-dirty-qualification",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-reconciliation.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3
      },
      "note": "Extend the exact target with cold dirty external rename and deletion. A real permission failure retains each writer; subsequent external mutation updates the tree, keeps the draft/view and reports an existing toast. Close remains blocked until explicit missing-file recovery. Original paths are never silently recreated and renamed disk bytes survive."
    },
    {
      "name": "native-affected-lifecycle-preview-and-mutations",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/file-deletion.test.mjs tests/desktop/file-creation.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 14,
        "axeViolations": 0
      },
      "note": "All source-editor and editable-preview conflict/recovery/retired-tab cases pass, alongside cold edit/quit/relaunch, permission/layout failures, repeated switching, protected deletion and exclusive creation. Failed native close now additionally proves resumed watching by displaying a newly created physical note."
    },
    {
      "name": "specification-and-boundaries",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 31,
        "specificationLanes": 4
      },
      "note": "Separate commands pass. Original completion gates and full inventory are retained; all broad session qualification remains deferred until M7 implementation."
    }
  ],
  "contractReview": "Tree scans and canonical resource projection remain in the shared API; the host only starts/stops the explicitly owned service. Native registration precedes initial reconciliation, hints/retries are bounded, and stop retires callbacks before draining work. Existing workspace events, FileView lifecycle and notifications handle changes; dirty/retired writers keep their original recovery owner. Failed leave resumes only a still-live App. No consumer override, replacement editor/screen or native permission is added.",
  "milestoneReview": "M5 remains In progress under its original gate and full inventory. Source and transport components do not waive native/UI or end-of-M7 qualification. Preserve the independently committed post-M7 plugin plan. Deno host source, publication, signing, visual baselines and ordinary review profiles remain unchanged.",
  "archives": [
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "775a7588b0223a3680d06bc4831332b392a587187b639b65690ee7159af8e6e2",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "74f544e2aa8a967524c0c218f3db7e1a495a1a17",
        "packageDirectory": "packages/api"
      }
    }
  ]
}
```
