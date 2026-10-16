# Protected native Explorer deletion

Targeted M5 component evidence; original aggregate gates remain open.

```json
{
  "id": "E-TRASH-001",
  "tasks": ["M5"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-MIG-002",
    "LD-FILE-003",
    "LD-LIFE-001",
    "LD-LIFE-004",
    "LD-LIFE-007"
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
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-TRASH-001.md",
    "spec/src/history/index.md",
    "tests/desktop/file-deletion.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Finish shared App watcher/tree/metadata ingestion, dirty external rename/delete, collisions/exclusive creation/import, available native file actions and HTTP representation behavior.",
    "After M7 implementation, run every session-deferred full Notes, Design Core, Storybook/accessibility, web and Desktop lane, normal bundle audit and original M4–M7 gates."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "source-managed-trash-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/file-manager-trash.test.ts",
      "result": "fail",
      "failures": 4,
      "note": "Source does not protect/flush writers, block failed descendants, retain the original path or release native-failure protection."
    },
    {
      "name": "source-managed-trash-qualified",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/file-manager-trash.test.ts src/lib/__tests__/file-manager.test.ts src/lib/__tests__/file-editing-sessions.test.ts src/lib/__tests__/editor-rename-persistence.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 38
      },
      "note": "Notes commit 98b333f7 fixes the public FileManager owner and routes Explorer through it. Owning record preserves source commands and strict public check/build evidence."
    },
    {
      "name": "native-menu-fixture-attempts",
      "command": "node --test --test-concurrency=1 tests/desktop/file-deletion.test.mjs",
      "result": "fail",
      "failures": 3,
      "note": "First fixture expects an undeclared destructive variant; the next two expose the embedded driver not dispatching contextmenu for right-click. Inspect the real menu and use its actual Delete item, opening the existing Bits UI menu with the explicit DOM event. No alternate delete action/hook is added."
    },
    {
      "name": "native-destructive-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-deletion.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The corrected original reproduction deletes the physical note while its failed writer retains a local draft. The assertion requires original bytes and draft retention, followed by explicit recovery and local-trash retry."
    },
    {
      "name": "premature-old-bundle-attempt",
      "command": "node --test --test-concurrency=1 tests/desktop/file-deletion.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "One run starts before the new build finishes and executes the previous bundle. Exclude it from consumer-after proof; finish the build before qualification."
    },
    {
      "name": "repaired-guard-missing-notice",
      "command": "node --test --test-concurrency=1 tests/desktop/file-deletion.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "The repaired fresh bundle retains the file, but both the normal and diagnostic attempt find no failure toast. The API workspace forwards progress only, not notice events. Fix the owning generic bridge; do not remove the observable-error assertion."
    },
    {
      "name": "source-notice-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'owned Lapis notices|retires notice delivery'",
      "result": "fail",
      "failures": 2,
      "note": "One actual notice-projection failure plus one new fixture missing the existing language-service disposer. Add that case-local fixture using the existing disposal test pattern, then prove projection and retirement; no shared fixture or assertion is weakened."
    },
    {
      "name": "source-notice-qualified",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts src/lib/__tests__/notifications.test.ts src/lib/__tests__/file-manager-trash.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 135
      },
      "note": "Notes commit 501c50e0 preserves notice fields and unsubscribes with the host; Explorer passes its App explicitly. Both exact notice cases and the complete workspace/notification/deletion family pass."
    },
    {
      "name": "source-explorer-and-public-checks",
      "command": "pnpm --filter @lapis-notes/file-explorer test; pnpm --filter @lapis-notes/api check; pnpm --filter @lapis-notes/api build; pnpm --filter @lapis-notes/file-explorer check; pnpm --filter @lapis-notes/file-explorer build; pnpm check:app-ownership; pnpm spec:first; pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "explorerCases": 28,
        "explorerFiles": 8,
        "svelteErrors": 0,
        "svelteWarnings": 0,
        "sourceChapters": 172,
        "sourceRequirements": 1463
      },
      "note": "Distinct owning-source commands pass, including publint and API built types. Explorer builds after API outputs. Full source/story/web lanes remain session-deferred."
    },
    {
      "name": "verified-public-archives",
      "command": "node scripts/local-archives.mjs .local/m5-deletion/notice/desktop.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 12,
        "importRoutes": 12
      },
      "note": "Replace only API and Explorer; preserve the other ten qualified recovery archives and portable tracked registry files. Store fresh artifacts separately from earlier watch/guard snapshots."
    },
    {
      "name": "fresh-consumer-build-and-types",
      "command": "pnpm check:types; CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Separate commands pass with the final twelve archives; cold native qualification begins only after this build completes."
    },
    {
      "name": "cold-protected-deletion",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-deletion.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Actual editor, disk bytes and failed writer remain intact; the shared notification toast explains failure. Explicit Use disk version clears the draft conflict, the real Delete action moves the external version to .trash, and native close exits normally."
    },
    {
      "name": "related-cold-conflict-acceptance",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/notes-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3,
        "axeViolations": 0
      },
      "note": "Existing real editor/cold Close, stale recovery decisions, disk-version discard, retired-tab barriers and accessibility remain qualified against the repaired notice bridge."
    },
    {
      "name": "specification-and-source-boundaries",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 29,
        "specificationLanes": 4
      },
      "note": "Separate commands pass. Full tests remain deferred; original M4–M7 gates and the independently committed post-M7 plugin plan are preserved."
    }
  ],
  "contractReview": "Source FileManager holds the existing App writer guard through removal, including descendants and retired writers, rejects changed source paths and releases protection on failure. Explorer delegates instead of bypassing that guard. The source-owned workspace projects existing notices into Design Core UI and retires delivery on disposal; no custom screen, dependency alias or new native permission is introduced. Failed attempts remain distinct from functional/source/consumer proof.",
  "milestoneReview": "M5 remains In progress. Dirty deletion is a qualified component, while App reconciliation, creation/import, native actions and the complete consistency gate remain open. Full repository/consumer/native qualification remains deferred until M7 implementation only for this active session. Preserve the separately committed post-M7 plugin plan. Deno host source, .lapis policy, ordinary review app/profile, Documents/tauri-vault, publication, signing and visual baselines are unchanged.",
  "archives": [
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "9374cff46df48644968d5108e8a0f0d92ab95f4bb335b9cdb8d051ba1fd9cf06",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "501c50e049264560e13e29c75a74c089922c7297",
        "packageDirectory": "packages/api"
      }
    },
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.1.2",
      "sha256": "5ef5e51682d67b938a4064054d516f6451624ba6c3f059f0a4254943f4df122d",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "501c50e049264560e13e29c75a74c089922c7297",
        "packageDirectory": "packages/file-explorer"
      }
    }
  ]
}
```
