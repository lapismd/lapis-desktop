# Native file history and repository row actions

```json
{
  "id": "E-REPO-017",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-DESK-001",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-009",
    "LD-MIG-002"
  ],
  "revision": "enclosing Jujutsu change mmtysxqu",
  "versions": {
    "desktopBase": "41f8c649",
    "jjStore": "17270354 (change uvrmkunv)",
    "jj": "0.45.1",
    "storybook": "10.5.7",
    "svelte": "5.57.2",
    "vite": "7.3.2"
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/FileHistory.stories.ts",
    "catalog/plugins/repository/RowSelection.stories.ts",
    "catalog/support/repository/RepositoryDemo.svelte",
    "catalog/support/repository/fixture.ts",
    "catalog/support/repository/operations.ts",
    "catalog/support/repository/review/history-review-view.ts",
    "catalog/support/repository/review/review-view.ts",
    "scripts/spec-contracts.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-REPO-017.md",
    "src/components/repository/RepositoryFileHistory.svelte",
    "src/components/repository/RepositoryGraph.svelte",
    "src/components/repository/RepositoryPanel.svelte",
    "src/components/repository/file-history-view.ts",
    "src/components/repository/operation-view.ts",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-view.ts",
    "src/lib/repository/file-history-controller.ts",
    "src/lib/repository/open-history-revision.ts",
    "tests/renderer/repository-file-history.test.mjs"
  ],
  "result": "pass",
  "runs": [
    {
      "name": "row-before-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/RowSelection.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Exact new cases failed twice before the row delegate, then both pass. Non-interactive metadata/graph/padding select; author/copy/nested controls retain actions. Intermediate operation tag fixture was switched to operation-snapshot; Svelte ignore codes repaired to comma-separated syntax."
    },
    {
      "name": "renderer",
      "command": "node --test tests/renderer/repository-file-history.test.mjs; node --test tests/renderer/repository-*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Six exact file-controller cases and all 57 repository renderer cases pass. Lazy scope, literal filenames, stale response fences, pin preservation, multiple heads, failure/retry and close drain are covered."
    },
    {
      "name": "stories-before-rename-repair",
      "command": "LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository",
      "result": "fail",
      "failures": 1,
      "note": "72 of 73 cases passed; rename/deletion fixture retained a stale TFile after public vault rename replaces its identity. Reacquired the file before deletion without changing product code or loosening assertions. Exact dark/narrow Rename And Delete then passes."
    },
    {
      "name": "affected-family",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository; LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository",
      "result": "pass",
      "failures": 0,
      "note": "Before final native race repair: complete affected family 73/73 across 14 files in each fresh process, 100.44s light/desktop and 102.35s dark/narrow. Production views, independent tabs and teardown covered; final delayed regression and final family qualification follow."
    },
    {
      "name": "native-source",
      "command": "jj-store pnpm dev:cargo -- test -p tauri-plugin-jj-store --no-default-features -- --test-threads=1; affected strict Clippy and jj-store-jj local_history test",
      "result": "pass",
      "failures": 0,
      "note": "Owner E-FILE-HISTORY-001 records 12 bridge cases and native stock-JJ oracles for >70 commits, multiple changed-path batches, clean/conflicted merges, deletion, exact paging/order, literal quoted paths, retained pins, revocation and source preservation. Only complete indexed native files() is newly admitted; same wire/schema/permissions. Parallel Busy attempt is retained as a separate qualification limitation."
    },
    {
      "name": "initial-normal-bundle",
      "command": "pnpm desktop:bundle --debug; graceful quit and cold ordinary Preview launch through cua",
      "result": "pass",
      "failures": 0,
      "note": "Final source-freeze bundle before race repair: Vite 66s, native compilation 20.05s, ordinary 226.93 MiB app. Existing profile, dirty Note.md, vault and bd3e4eca pin preserved. Default File history right tab appears; Note.md loads three native matching revisions. Selecting Native history second selects 7cb493e5 at the same operation, but native review exposed the false-toast race below."
    },
    {
      "name": "delayed-selection-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/FileHistory.stories.ts -t \"Open During Log Preparation\"",
      "result": "fail",
      "failures": 1,
      "note": "Cold native review showed a false outside-bounded-history toast while the selected revision actually opened. A held main-log graph reproduces that exact toast in browser fixtures. Initial promise-only repair still failed; diagnostics and the final mounted-lifetime repair are recorded below."
    },
    {
      "name": "intermediate-types",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 1,
      "note": "New delayed-regression fixture accessed revset without narrowing graph variant. Added explicit log discriminant; native request handling and assertions unchanged."
    },
    {
      "name": "bookkeeping-before",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Draft selected E-REPO-017 had not been created yet. Added this fresh record. repository.md reached 421 physical lines; extracted row/sidebar contract to repository-navigation.md and registered canonical chapter ownership instead of raising limits."
    },
    {
      "name": "delayed-selection-final",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/FileHistory.stories.ts -t \"Open During Log Preparation\"",
      "result": "pass",
      "failures": 0,
      "note": "Exact held-graph regression passes (1 passed, 5 filtered) after mounted-lifetime fencing. Temporary call-stack diagnostics showed the abandoned Panel callback selecting against zero commits; diagnostics removed before qualification. View state changes await their owned initial load and obsolete state requests are fenced."
    },
    {
      "name": "final-source",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; node --test tests/renderer/repository-*.test.mjs tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Final source: 0 type errors/0 warnings, both ownership audits pass, 123 renderer/governance cases pass."
    },
    {
      "name": "final-cold-native",
      "command": "pnpm desktop:bundle --debug; graceful quit and cold ordinary Preview launch through cua; select File history revision and return to editor",
      "result": "pass",
      "failures": 0,
      "note": "Corrected source bundle: Vite 75s, native compilation 23.66s, ordinary 226.93 MiB app. Preserved native profile, dirty Note.md and bd3e4eca pin restore. Three real matching revisions load; 7cb493e5 opens selected in JJ Log at that pin with no error toast. File history remains visible beside the editor. Screenshot .local/reusable-conversations/file-history-native.png. No provider execution, native instrumentation, installed-app replacement or source reset."
    },
    {
      "name": "draft-doc-checks",
      "command": "pnpm progress:generate; pnpm spec:validate; pnpm spec:first; pnpm spec:check",
      "result": "fail",
      "failures": 3,
      "note": "Draft evidence lacked its SUMMARY entry; new canonical registry mapping needed governance and migration confirmations; those new chapter paths then needed fresh evidence inventory. Added all mappings and confirmations without changing requirements or gates. Final checks follow."
    },
    {
      "name": "final-family",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository; LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository",
      "result": "pass",
      "failures": 0,
      "note": "All 74 affected interaction/accessibility stories pass in each fresh process, 14 files: 109.50s desktop/light and 91.91s narrow/dark. Includes delayed state restoration with no false toast. Other width/theme combinations and whole catalog remain deferred."
    },
    {
      "name": "final-documents",
      "command": "pnpm progress:generate; pnpm exec prettier --write <changed files including MIGRATION.md>; pnpm check:progress; pnpm spec:check; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes 33 tasks/119 records. Four specification lanes pass: validate, Rust format, mdBook and spec-first. Canonical registry, evidence navigation and file budgets pass; no Rust compilation or full repository product suite is implied. Generated formatted MIGRATION.md matches its parent and is omitted from the final inventory."
    }
  ],
  "contractReview": "LD-REPO-002/004 adds default editor-following native file revisions, independent retained handle/pin, literal fileset matching and status ownership. Row padding and metadata delegate to existing selection while nested actions remain independent; repository icons match requested Lucide names. File selections fence stale reads and closure drains handles. No desktop Rust, transport schema, permission, source storage or mutation grant changes. Native producer qualification belongs to jj-store E-FILE-HISTORY-001.",
  "milestoneReview": "M13.2 retains its original Done gate. M13/M13.3 remain In progress; managed AgentStore/ThreadStore chat and restart recovery are still separate work. This focused usable-plugin slice does not qualify native writes/search/evolution, provider/platform expansion, full catalog combinations or visual baselines.",
  "scope": "Production repository renderer, view registration/lifetime, default right sidebar, file-controller/native reader boundary and directly affected repository story family. Broader whole-catalog/provider/release/platform lanes remain deferred by user direction. Normal native UI acceptance is recorded independently from fixture interaction/accessibility.",
  "remaining": []
}
```
