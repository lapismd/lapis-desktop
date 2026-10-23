# Shared-screen integration into the main workspaces

```json
{
  "id": "E-SHARED-007",
  "date": "2026-10-23",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M15.1"],
  "requirements": ["LD-CAT-001", "LD-AI-002", "LD-REPO-002", "LD-LIFE-001"],
  "versions": {
    "desktopCode": "83155277",
    "baseline": "52516ae9",
    "agentUiArchive": "5a88a348",
    "designCoreArchive": "69f48e54",
    "notesApi": "e159faad",
    "plugins": "99806c68",
    "agentUiMain": "18735b02"
  },
  "contractReview": "The user requested default-workspace integration and retirement of temporary workspaces before further qualification. Existing native authority, complete public screens, lifecycle ordering, source ownership and portable tracked dependency files remain unchanged.",
  "milestoneReview": "Integration is complete; M15.1 remains In progress. Remaining interaction modes, ordinary bundle audit and static catalog qualification continue in the default workspace. Existing distribution and visual-review gates are unchanged.",
  "runs": [
    {
      "name": "default-workspace-integration",
      "command": "jj new <qualified-tip>; Agent UI: jj new 890bd723 a43947f6; jj workspace forget <migration-workspace>",
      "result": "pass",
      "failures": 0,
      "note": "Desktop, Design Core, Notes and Plugins are descendants of their migration tips. Agent UI preserves both qualified migration and newer Profile/Threads/content-state work. All five migration workspaces and their directories were removed; unrelated workspaces remain."
    },
    {
      "name": "stable-cohort-install",
      "command": "node scripts/local-archives.mjs; readArchiveManifest and verifyArchiveResolution with actual installed scopes; exportDigest for linked dist",
      "result": "pass",
      "failures": 0,
      "note": "19 archive hashes and 70 active import routes verified in main; all four linked public outputs match the prior receipt. Archived logs, receipts, native target and staged resources are retained under .local/shared-ui-integration. Tracked dependency files preserved."
    },
    {
      "name": "main-lifecycle-regression",
      "command": "node --import tsx --test tests/renderer/notes-dispose.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "7 pass, no failures, after moving to main."
    },
    {
      "name": "cold-main-review-stories",
      "command": "LAPIS_CATALOG_THEME=light LAPIS_CATALOG_VIEWPORT=desktop pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/repository/History.stories.ts catalog/plugins/repository/Operations.stories.ts --testNamePattern='Conversation|Pinned History And Diff|Operation Graph And Changes' --reporter=verbose",
      "result": "pass",
      "failures": 0,
      "note": "3 pass, 32 intentionally filtered. Main Storybook restarted cold at 7480 with the qualified archives; retired 7481 review tab closed."
    },
    {
      "name": "completed-dark-desktop",
      "command": "LAPIS_CATALOG_THEME=dark LAPIS_CATALOG_VIEWPORT=desktop pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository catalog/plugins/ai --reporter=verbose",
      "result": "pass",
      "failures": 0,
      "note": "440 pass across 99 files before integration. Log retained at .local/shared-ui-integration/migration/catalog-dark-desktop-final.log. This is one mode, not a completed four-mode matrix."
    },
    {
      "name": "migration-jobs-retired",
      "command": "Stop only migration-owned process trees before retiring their workspaces",
      "result": "pending",
      "failures": 0,
      "note": "Dark narrow matrix and final lifecycle-family matrix stopped before completion. Queued Community four-mode confirmation did not run. Ordinary debug bundle build stopped while compiling Tauri; check:bundle and final static build did not subsequently run. The earlier missing-normal-bundle audit failure remains unqualified."
    },
    {
      "name": "prior-native-and-renderer-results",
      "command": "Commands and exact assertions retained in E-SHARED-006 and archived native/renderer logs",
      "result": "pass",
      "failures": 0,
      "note": "406 renderer/governance, 228 Rust with 2 existing ignored, normal/e2e strict Clippy, and final types passed. Six native admission/import/history cases passed in one lane; strict visible history passed in its dedicated foreground lane; exact OpenCode/visible pair passed on the clean bundle. The combined seven-case attempts with foreground loss remain failed attempts, not an aggregate pass."
    },
    {
      "name": "integration-spec-navigation-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Initial validation required the new E-SHARED-007 entry in SUMMARY.md. Added its navigation entry and reran the exact command."
    },
    {
      "name": "integration-spec-mapping-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Validation, Rust format and mdBook passed. Spec-first required mapped governance and migration chapters; updated the ownership/retirement policy and original-gate status explicitly, then reran the exact command."
    },
    {
      "name": "integration-canonical-budget-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Added integration policy exceeded the two full canonical chapters by two lines each. Condensed the policy into their existing budget; the 400-line limit is unchanged."
    }
  ],
  "files": [
    "docs/shared-ui-migration.md",
    "spec/src/current/shared-screen-integration.md",
    "spec/src/current/progress/milestones.md",
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/E-SHARED-007.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md"
  ],
  "remaining": [
    "Finish four-mode lifecycle-family coverage and remaining dark/narrow consumer interactions from main. Confirm repaired Community readiness in all modes.",
    "Build and audit the ordinary native bundle, then complete the final static catalog and required qualification.",
    "Visual review, distribution and publication remain separate. Accepted existing Mermaid/DOMPurify audit findings and immutable E-AI-109 formatting drift remain tracked separately."
  ]
}
```

The main Desktop code is the qualified migration tree. Active archive paths now
resolve inside the main workspace; historical paths in retained logs describe
the retired checkouts. No package source alias, dependency patch, installed-app
replacement, profile migration or baseline update was added. Future fixes belong
to the owning default workspace. E-SHARED-001 through E-SHARED-006 remain
intact.
