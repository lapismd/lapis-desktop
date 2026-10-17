# Visible history UI and public-package qualification

```json
{
  "id": "E-REPO-003",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-DESK-001",
    "LD-HOST-001",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-FILE-008",
    "LD-PLUG-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-008"
  ],
  "revision": "enclosing Jujutsu change uwuuoszw",
  "versions": {
    "desktopBase": "447f8244a9447a6eea47c1d82af1d7aedd656c69",
    "apiSnapshot": "17e72beba7a4647586f6d59cb16ee8ca6fcf7284",
    "apiSha256": "e8072f731ca2d3db7dfb140a85cfc9fd9c8fef63c1b151d079de89bdc77f0887",
    "designCoreSnapshot": "2c6f0b9efe75fdaa7d9a07034fd944b6e2dfb4b5",
    "designCoreSha256": "3f7fefb5ca546ea3ce4abfcb87ef1099c2b181fb4b506ad29cd286884b726525",
    "markdownSource": "8c345d30b497e7678ebc5f410d43dfacf12e6f37",
    "markdownSha256": "94961f48973de70cc8a610a88c2064fc7e06051113915dd03d481a4689a91401",
    "pnpm": "10.34.5",
    "node": "26.9.0",
    "vitest": "4.1.11",
    "playwright": "1.61.1",
    "platform": "macOS ARM64",
    "apiCommit": "a91d5e2eb5ec037029f6a7a2df316a9bd9440af7",
    "designCoreCommit": "a57a38e24c0f79a5702e2666b5e35041d6babdf4",
    "historyClient": {
      "version": "0.1.0",
      "source": "1dafb19c57bca20241643e0d5816344f42db9c3c",
      "mode": "temporary private-app link through built public exports; archive/range intake remains a standalone qualification item"
    }
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/desktop/FileConflicts.stories.ts",
    "catalog/plugins/repository/History.stories.ts",
    "catalog/plugins/terminal/Terminal.stories.ts",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/repository/RepositoryDemo.svelte",
    "catalog/support/repository/context.ts",
    "catalog/support/repository/fixture.ts",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/history/index.md",
    "src/components/files/ConflictReview.svelte",
    "src/components/repository/RepositoryDiff.svelte",
    "src/components/repository/RepositoryPanel.svelte",
    "src/components/repository/RepositoryRevisions.svelte",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-view.ts",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/components/views/notes-bundled-plugins.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/history-controller.ts",
    "src/lib/repository/history-lifetime.ts",
    "src/lib/repository/history-reader.ts",
    "src/lib/repository/history-selection.ts",
    "src/lib/repository/history-state.ts",
    "src/lib/repository/services.ts",
    "tests/governance/source-audit.test.mjs",
    "tests/renderer/repository-history.test.mjs",
    "tests/renderer/repository-native.test.mjs",
    "vite.catalog.config.ts",
    "MIGRATION.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-003.md",
    "spec/src/current/migration.md"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "initial-history-mount",
      "command": "pnpm test:storybook catalog/plugins/repository/History.stories.ts",
      "result": "fail",
      "failures": 8,
      "note": "Initial nine cases: eight failures and one Safe Mode pass. The API imperative mount/projection race leaves the correct view DOM detached. The owning API regression/fix is recorded in lapis-notes/spec/records/2026-10-17-deferred-imperative-attachment.md; no consumer attachment workaround."
    },
    {
      "name": "initial-public-package-compatibility",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 12,
      "note": "Earlier app/artifact desktop-light:155 pass,12 fail;later configurations not run. Missing upstream Tool Calls disclosure fixes are carried forward in Design Core, then its dark metadata contrast is repaired. Source records preserve exact before/after and interrupted aggregates. Final source pnpm checks passes821 units,834 stories,172 browser cases with one existing skip;all100 affected consumer checks pass."
    },
    {
      "name": "current-producer-check",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 9,
      "note": "Current desktop initially needs its existing resolveMerged API plus removal of eight unsupported exact options on ByRole queries. API fix rebased onto qualified8a27bc36 producer preserves the public method; ByRole string matching remains exact. A cold import attempt runs no tests after six static conflict icons trigger optimization reload; those icons are now pre-bundled."
    },
    {
      "name": "restored-pin-before-after",
      "command": "LAPIS_CATALOG_THEME=light LAPIS_CATALOG_VIEWPORT=desktop pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/History.stories.ts -t 'Restores Historical Operation'",
      "result": "pass",
      "failures": 0,
      "note": "Before:1 failed,16 skipped;initial undefined state replaced saved historical operation with current head. After:1 passed,16 skipped;test also asserts the first reader opens only the historical operation. Operation-change regression retains cleared old diff/revision state."
    },
    {
      "name": "current-history-family",
      "command": "pnpm test:storybook catalog/plugins/repository/History.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "17 cases in all four desktop/narrow light/dark configurations:68 passes. Includes production plugin/ribbon, immutable pins, unified/split diff, merge parent, empty/unavailable, notification recovery, disable/cleanup and restored operations."
    },
    {
      "name": "current-app-before-refresh",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 4,
      "note": "Desktop-light169 pass,4 fail/173;other configurations do not run. Reading Note/Reading Note Dark use a stale Markdown archive; Settings Source assumes expanded sidebar; Leaving Workspace queries an intentionally inert shell."
    },
    {
      "name": "current-package-intake",
      "command": "pnpm local:install",
      "result": "pass",
      "failures": 0,
      "note": "14 verified public import routes. Refresh to the primary app existing qualified Markdown reading archive;API/DC hashes above retained. Normal tracked manifests/lockfile ranges remain portable;no dependency source patch or alias."
    },
    {
      "name": "current-exact-harness-before-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/Workspace.stories.ts catalog/plugins/desktop/FileConflicts.stories.ts catalog/plugins/terminal/Terminal.stories.ts -t 'Reading Note|Leaving Workspace|Settings Source'",
      "result": "pass",
      "failures": 0,
      "note": "After archive refresh,before harness fixes:2 pass,2 fail,28 skipped. After opening real left sidebar before settings and limiting hidden role queries to inert content:4 pass,28 skipped. Terminal canonical persistence and conflict disabled/inert assertions retained."
    },
    {
      "name": "affected-dark-before",
      "command": "pnpm test:storybook catalog/plugins/Workspace.stories.ts catalog/plugins/desktop/FileConflicts.stories.ts catalog/plugins/terminal/Terminal.stories.ts",
      "result": "fail",
      "failures": 2,
      "note": "Both light configurations pass32 each;desktop-dark30 pass,2 fail. Failed Recovery/Stale Decision show desktop-owned alert text at3.45:1; narrow-dark/full catalog do not run after failure."
    },
    {
      "name": "exact-desktop-contrast-before-after",
      "command": "LAPIS_CATALOG_THEME=dark LAPIS_CATALOG_VIEWPORT=desktop pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/FileConflicts.stories.ts -t 'Failed Recovery|Stale Decision'",
      "result": "pass",
      "failures": 0,
      "note": "Before2 failed,11 skipped;after2 passed,11 skipped. Desktop-owned ConflictReview mixes existing destructive/foreground in its dark scope. Light CSS,error semantics,drafts,guarded recovery and axe remain unchanged."
    },
    {
      "name": "affected-final",
      "command": "pnpm test:storybook catalog/plugins/Workspace.stories.ts catalog/plugins/desktop/FileConflicts.stories.ts catalog/plugins/terminal/Terminal.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "32 passes in each of all four configurations:128 total. Fresh processes;all accessibility and persistence assertions retained."
    },
    {
      "name": "renderer-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and zero warnings after current API/DC/Markdown intake."
    },
    {
      "name": "renderer-governance",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "191 passes;includes13 focused history-reader/native-adapter cases and source-boundary regression."
    },
    {
      "name": "renderer-static-builds",
      "command": "pnpm build && pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Both ordinary renderer and static catalog build pass. Production build rejects catalog imports. Existing chunk-size warnings and Rollup PURE-comment diagnostic remain visible;not an empty-console claim."
    },
    {
      "name": "initial-document-check",
      "command": "pnpm progress:generate && pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "The new evidence existed on disk but was not yet in the Jujutsu snapshot used by the fail-closed progress checker. Snapshot the new file with jj st, then rerun;no coverage or validator rule changes."
    },
    {
      "name": "initial-spec-file-limits",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 3,
      "note": "Fresh progress passes33 tasks/91 evidence records. Spec reports desktop33009/32768 bytes,governance404/400 physical lines,and verification41341/32768 bytes. Shortened only new scope notes and redundant verification prose;all requirements,evidence IDs and links remain. Long new row descriptions had widened the entire formatted table;compact citations retain the original page budget."
    },
    {
      "name": "initial-spec-first",
      "command": "pnpm spec:validate && pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "Structural validation now passes6 validators/106 chapters/93 requirements. Spec-first requires the migration chapter for generated next-action changes;added an explicit unchanged-gate milestone note. No mapping or rule weakened."
    },
    {
      "name": "current-complete-catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "Final cold current-app lane:173 passes/44 files in each desktop-light,narrow-light,desktop-dark,narrow-dark configuration;692 total. Session14240 exits0. All assertions,axe rules,fixture teardown and unhandled-error handling remain enabled."
    },
    {
      "name": "governed-documents-and-boundaries",
      "command": "pnpm check:progress && pnpm spec:validate && pnpm spec:first && pnpm check:architecture && pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "33 tasks/91 evidence records;six validators,106 chapters,93 requirements;34 protected files/six canonical chapters;source and App ownership audits pass. Original native gate remains open."
    },
    {
      "name": "initial-format",
      "command": "pnpm exec prettier --check [exact Jujutsu changed file inventory]",
      "result": "fail",
      "failures": 1,
      "note": "Only repository-view.ts needs wrapping after the saved-pin fix. Applied the owning formatter;no semantic change after functional qualification. Final selected-file format check follows."
    },
    {
      "name": "final-format-and-documents",
      "command": "pnpm exec prettier --check [exact Jujutsu changed file inventory]; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "All selected files format correctly after whitespace-only repository-view wrapping. Final progress33 tasks/91 evidence records,6 validators/106 chapters/93 requirements and34 protected files/six chapters pass. Source slices are committed independently;native visible acceptance remains next."
    }
  ],
  "contractReview": "LD-REPO-002 uses a public injected history reader with native-owned vault token,exact operations,bounded pages,explicit merge parent,stale-response fencing,retryable handle drain and App notifications. Restored state is retained before first preparation;refresh never moves the pin. Existing native grants,publication,receipts,AI execution and persistent store formats are unchanged. Desktop-owned conflict error paint and catalog sidebar/inert adaptations retain LD-FILE-008 and LD-CAT-001/003 assertions. Source package defects are repaired and tested upstream,then consumed through verified archives.",
  "milestoneReview": "M13 and M13.2 stay In progress. This slice implements and qualifies production history UI and fixture/public-package boundaries only;actual cold visible native history/restoration remains required. M13.1 stays Done;M13.3 remains Planned. M10.2,broader M8.5,native AI,durable conversations,distribution and visual gates are not completed.",
  "scope": "Renderer/public-package/catalog slice only. Shared API mount behavior,Design Core CSS/disclosures,and shared catalog dependency optimization require complete source gates plus complete current desktop catalog after focused regressions. No native production code changes;Rust/unit/hidden-native/release suites are outside this slice. Cold visible native history is a separate next acceptance slice. Sources remain independently owned;raw logs under jj-store/.local/reusable-conversations/history-*. The new jj-history client currently uses the private migration app permitted built-public-export development link; its portable range/archive intake remains in standalone package qualification. The14 archive checks above cover existing API/presentation dependencies,not that new SDK link."
}
```
