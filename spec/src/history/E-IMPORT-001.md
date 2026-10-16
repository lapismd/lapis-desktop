# Attachment import through existing Explorer dropping

Targeted M5 public-source and native qualification; aggregate gates remain open.

```json
{
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "id": "E-IMPORT-001",
  "tasks": ["M5"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-MIG-002",
    "LD-FILE-004",
    "LD-FILE-006",
    "LD-LIFE-001"
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
    "spec/src/history/E-IMPORT-001.md",
    "spec/src/history/index.md",
    "tests/desktop/file-import.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Complete inherited LD-FILE-005 / LN-DENO-076 HTTP representation qualification and remaining M5 aggregate review.",
    "Run all session-deferred source, Storybook/accessibility, web, Desktop and ordinary-bundle lanes and original M4–M7 gates after M7 implementation."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "source-harness-before",
      "command": "pnpm --filter @lapis-notes/file-explorer exec vitest run src/lib/explorer-imports.test.ts",
      "result": "fail",
      "failures": 1,
      "note": "An unnecessary whole-renderer API import in the Node-only fixture fails on a dependency JSON import attribute. Use typed input-port stubs for this unit boundary. No production package resolution is modified."
    },
    {
      "name": "source-helper-before",
      "command": "pnpm --filter @lapis-notes/file-explorer exec vitest run src/lib/explorer-imports.test.ts",
      "result": "fail",
      "failures": 1,
      "note": "The actual private import helper is missing; no cases execute."
    },
    {
      "name": "source-exact-after",
      "command": "pnpm --filter @lapis-notes/file-explorer exec vitest run src/lib/explorer-imports.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 6
      },
      "note": "Complete Unicode/binary bytes, empty input, invalid names/size before IO, collision rejection without overwrite retry, admitted asynchronous reads/creation and sequential file processing pass."
    },
    {
      "name": "source-package",
      "command": "pnpm --filter @lapis-notes/file-explorer test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 37,
        "files": 9
      }
    },
    {
      "name": "source-public-lanes",
      "command": "pnpm --filter @lapis-notes/file-explorer check; pnpm --filter @lapis-notes/file-explorer build; pnpm spec:first; pnpm spec:validate; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "requirements": 1475,
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Separate commands, normal prepack/publint and changed-file formatting pass. Notes commit 717f0ff3; source record spec/records/2026-10-16-existing-explorer-imports.md."
    },
    {
      "name": "source-map-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 4,
      "note": "Four required chapter groups are missing. Document actual ownership at architecture, editor demo, packages and plugin lifecycle boundaries without weakening mappings."
    },
    {
      "name": "native-import-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-import.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Existing Explorer drop accepts a browser File but creates no bytes; a failed import also has no error notice. Public import action was never connected."
    },
    {
      "name": "verified-archive-cohort",
      "command": "node scripts/local-archives.mjs .local/m5-import/desktop.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 12,
        "importRoutes": 12
      },
      "note": "Refresh only Explorer from 717f0ff3 within the qualified twelve-archive cohort. API remains 63a5e7fe; portable tracked registry dependency files are preserved."
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
      "note": "Require terminal zero before native testing."
    },
    {
      "name": "native-import-exact-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-import.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      },
      "note": "Existing real-WebView Explorer callback imports Unicode binary bytes, preserves a collided PNG without staging residue and leaves an empty drop unchanged. Markdown renders the attachment through the scoped native protocol before and after cold restart. Permission failure leaves no file or temporary residue, shows the owned notice and permits retry through immediate close. File/DataTransfer event dispatch does not claim a physical OS drag gesture."
    },
    {
      "name": "affected-native-creation-mutations-and-leave",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-creation.test.mjs tests/desktop/file-ui-mutations.test.mjs tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 10
      }
    },
    {
      "name": "governance",
      "command": "node --test tests/governance/contracts.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 7
      }
    },
    {
      "name": "specification-and-boundaries",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 34,
        "specificationLanes": 4
      },
      "note": "Separate commands pass. Original gates, inherited HTTP item and deferred full source/native qualification remain visible."
    }
  ],
  "contractReview": "Connect the existing Design Core Explorer drop surface to source-owned FileManager new-file creation. App admission begins before File byte reading; native exclusivity preserves destinations, and owned notices report failures. Names and 64 MiB bounds are validated before reads, complete buffers process sequentially, and no new screen, native authority or product test hook is added.",
  "milestoneReview": "This is targeted attachment intake under the original M5 scope. Preserve HTTP representation qualification and every original M4–M7 gate. Deno is frozen; publication/signing, review profiles and post-M7 plugin work remain untouched.",
  "archives": [
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.1.2",
      "sha256": "be3815ebf920370dfb113be69862117670333ec755f179b322f718f7fb44c481",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "717f0ff3956a5d33cba10311fca9c41a06e53b21",
        "packageDirectory": "packages/file-explorer"
      }
    }
  ]
}
```
