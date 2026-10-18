# Command View parent comparison and owned-runtime preview reload

```json
{
  "id": "E-REPO-011",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-DESK-003",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-009",
    "LD-REPO-002",
    "LD-REPO-004"
  ],
  "revision": "enclosing Jujutsu change vqrvqxon",
  "versions": {
    "desktopBase": "65404171d42c603e33ff83b2ea15eae06e0884bf",
    "jjStoreReference": "5b11966779de92a60876e619c30c5575cef011ac",
    "designCoreVersion": "0.5.1",
    "designCoreSource": "b947799617af21fcbcd52c8b2b48593badbecec6",
    "designCoreArchiveSha256": "8768360cb65fb3dfa760e548a5f57fa5f8c5ce737f7f111f88322e9fd590783e",
    "pnpm": "10.34.5",
    "node": "26.9.0",
    "platform": "macOS ARM64",
    "storybook": "10.5.7",
    "vite": "7.3.2",
    "svelte": "5.57.2"
  },
  "files": [
    ".storybook/owned-runtime-reload.mjs",
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/History.stories.ts",
    "catalog/plugins/repository/ParentPicker.stories.ts",
    "catalog/support/repository/commit-detail.ts",
    "catalog/support/repository/fixture.ts",
    "docs/provenance.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-011.md",
    "spec/src/history/index.md",
    "src/components/repository/RepositoryCommitPicker.svelte",
    "src/components/repository/RepositoryCommitTarget.svelte",
    "src/components/repository/RepositoryRevisionFiles.svelte",
    "src/components/repository/repository-commit-picker.css",
    "src/lib/repository/commit-cards.ts",
    "src/lib/repository/history-controller.ts",
    "src/lib/repository/history-graph.ts",
    "src/lib/repository/history-state.ts",
    "src/lib/repository/parent-candidates.ts",
    "tests/governance/catalog-reload.test.mjs",
    "tests/renderer/repository-history-paging.test.mjs",
    "tests/renderer/repository-parent-picker.test.mjs",
    "vite.catalog.config.ts"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "original-parent-regression",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/ParentPicker.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Original regression expected a Command View trigger BUTTON but received the native SELECT. parent-picker-before.log. First implementation then fails one input-name assertion: Command Root owns the actual accessible name Select comparison parent. Correct the selector and autofocus via public Input ref/Popover onOpenAutoFocus; exact rerun passes one case in parent-picker-exact-2.log."
    },
    {
      "name": "interaction-development",
      "command": "pnpm test:storybook catalog/plugins/repository/ParentPicker.stories.ts",
      "result": "fail",
      "failures": 2,
      "note": "First 3-story desktop/light run has 1 pass/2 failures: a global option query includes the unrelated native operation selector and Command Empty, and a metadata-failure visibility assertion races the opening transition. Scope candidate queries to the dialog and await actual visibility. Second attempt has 2 pass/1 transition failure; intermediate runs use changing story inventories during relocation and are not final qualification. parent-picker-stories{,-2,-3}.log and parent-picker-exact-final.log retain attempts."
    },
    {
      "name": "final-parent-interactions",
      "command": "pnpm test:storybook catalog/plugins/repository/ParentPicker.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Four cases in each desktop/narrow and light/dark configuration: 16 interaction/axe passes. Actual public Command View host, autofocus, keyboard selection, author/avatar/time/Git/JJ cards, email/full-ID search, empty results, native tag preview, exact unloaded parents, metadata refusal/App toast/explicit recovery, selected-comparison file count and separately labelled selected-file line counts. Merge selection moved from History to keep its existing 400-line budget. parent-picker-exact-qualified.log."
    },
    {
      "name": "parent-and-graph-authority",
      "command": "node --test tests/renderer/repository-parent-picker.test.mjs tests/renderer/repository-history.test.mjs\nnode --test tests/renderer/repository-history-paging.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "15 parent/history cases and 2 paging cases pass. Exact pin/commit/object identities, substituted kinds, stale revision/comparison/operation/close responses, explicit retry, 64-missing-card limit, reverse-hex/native tag search, cursor retention, duplicate-page refusal and 200-commit bound. Graph paging is extracted unchanged to keep the controller below 300 counted lines. parent-picker-controller.log and parent-picker-paging.log."
    },
    {
      "name": "reopen-cache-regression",
      "command": "node --test tests/renderer/repository-parent-picker.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Reopening initially duplicates cached parent cards: 5 pass/1 failure. Deduplicate known cards and requested IDs before resolving missing records. Final exact rerun passes all 6 cases, preserving one missing read and exactly two cached cards. parent-picker-dedup-{before,after}.log."
    },
    {
      "name": "catalog-runtime-reload",
      "command": "node --test tests/governance/catalog-reload.test.mjs\ncua_repl: switch comparison preview to Op Log, change/revert a controller comment, inspect automatic reconstruction",
      "result": "pass",
      "failures": 0,
      "note": "Before test fails once for absent plugin. App-owned Vite serve plugin then passes path-policy regression: owned runtime scripts and fixtures fully reload, ordinary production components/CSS retain HMR, declarations/generated/sibling paths do not reload. Actual earlier stale-class failure was state.parentCommits is not iterable. After restarting only verified checkout/port7490 PID95906, a comment edit automatically reconstructs the story and returns to default JJ tab. Original bytes restored exactly, SHA-256 288d7b6551bc1a50ffdda621d465445b4bc936d2515ac1d5bb9e443710bbb8c0. catalog-reload-{before,after}.log and parent-picker-preview.log. Scoped lifecycle/cache commands remain pending."
    },
    {
      "name": "line-budget-and-strict-checks",
      "command": "pnpm check:architecture\npnpm check:app-ownership\npnpm check:types\nnode --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Initial architecture finds one History story exceeding 400 counted lines after changing selection interaction; move its merge case into ParentPicker without weakening it. Final audits pass, strict types have 0 errors/0 warnings, and all 224 governance/renderer cases pass. parent-picker-architecture-{2,3,final}.log, parent-picker-ownership-final.log, parent-picker-types-qualified.log and parent-picker-renderer-final.log."
    },
    {
      "name": "interrupted-catalog-attempt",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 0,
      "note": "An early full run is deliberately stopped in its first configuration to finish footer spacing/pluralization. Terminating the known catalog script leaves its Vitest child; verify child PID65162, checkout cwd and port63315, then terminate that exact process. No assertion result or full pass is claimed. parent-picker-catalog-complete.log. Stable-source cold rerun follows."
    },
    {
      "name": "draft-document-consumers",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Progress passes 33 tasks/112 records. Spec correctly refuses desktop chapter at 32860 bytes and fresh generated MIGRATION.md missing from the evidence file inventory. Compact current introductory notes, retain historical evidence, add the actual generated file to fresh coverage, format and snapshot before final consumers. parent-picker-{progress,spec}-draft.log."
    },
    {
      "name": "prepared-request-source-review",
      "command": "Inspect tauri-plugin-jj-store History::read and jj-store-jj Executor::read_code_index",
      "result": "pass",
      "failures": 0,
      "note": "The actual Tauri service delegates to read_code_index. Its explicit Request::Commit allowlist retains repository/metadata binding, native generation, operation pin and prepared selection checks. QueryInfo, OperationsFiltered and direct Operation remain outside this profile. This is source inspection, not a new native/OS acceptance run; no Rust change or broader native gate is claimed."
    },
    {
      "name": "complete-cold-catalog-and-builds",
      "command": "pnpm check:types\npnpm build\npnpm build-storybook\npnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "Stable source: strict types 0 errors/0 warnings; renderer build 29.23s and static Storybook build 45.28s pass with existing PURE/chunk advisories. All 52 files/201 cases pass in each desktop/light, narrow/light, desktop/dark and narrow/dark configuration: 804 interaction/axe passes. Cold Vite/Chromium per configuration. parent-picker-{types,build,static,catalog}-qualified.log. Earlier build attempts also pass but are superseded by these stable-source runs."
    },
    {
      "name": "live-picker-and-css-hmr",
      "command": "cua_repl: inspect original History and two-tab Comparison previews; change/revert picker CSS comment; save screenshot",
      "result": "pass",
      "failures": 0,
      "note": "Original History tab8 now displays public Command View/Popover, focused search, selected commit card, full native identifiers and separately labelled statistics. Tab9 retains both production log views for review. CSS comment edit produces current Vite hot-updated event at 11:39:31 UTC while picker/input remain open/focused; restoration is byte-exact SHA-256 d5b482af4552b181f71c43865d011055398b4b82f4bf54eb493461085dad7005. Screenshot .local/reusable-conversations/parent-picker-review.png. Earlier retained console error at 11:14 predates the reload fix. One stale AX node during a story reload is resolved by fresh observation. No visual baseline approval is claimed."
    },
    {
      "name": "repaired-draft-document-consumers",
      "command": "pnpm check:progress\npnpm spec:check\npnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "After the recorded byte-limit/coverage repairs: progress passes 33 tasks/112 evidence records; all four spec lanes and full formatting pass. parent-picker-{progress,spec}-draft-2.log and parent-picker-format-draft.log. Final selected-evidence consumers follow before commit."
    },
    {
      "name": "final-selected-evidence-consumers",
      "command": "pnpm progress:generate\npnpm exec prettier --write spec/src/history/E-REPO-011.md spec/src/current/progress/milestones.md MIGRATION.md\njj --no-pager st\npnpm check:progress\npnpm spec:check\npnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Final selected evidence preserves original M13/M13.2 statuses and gates. Progress passes 33 tasks/112 records; all four spec lanes and full formatting pass. parent-picker-{progress,spec,format}-final.log. Evidence-only validation/format consumers follow before the local Jujutsu commit."
    }
  ],
  "contractReview": "LD-REPO-004 now uses attributed jj-store Command View/Popover commit-card presentation for recorded JJ parents. Missing metadata uses the existing supported exact commit reader on the retained operation handle; no native request extension. LD-REPO-002 identities, pins, admission, read lifetime and wire/storage/receipt formats stay unchanged. LD-CAT-001/002 preview runtime changes reconstruct owned App/controller instances, retaining ordinary component/style HMR and checkout scope. Public Design Core components/formatter are consumed without dependency patches or internal selectors.",
  "milestoneReview": "NOTES-05I2A qualifies the JJ Log parent Command View picker and NOTES-05I0A qualifies owned-runtime preview reload. Other operation/revision selectors, preview lifecycle/cache commands, native highlighted queries, complete statistics, row/state parity and whole-view acceptance remain open. M13.2 stays Done under its original native gate; M13/M13.3 remain In progress. NOTES-05I remains the sole Active umbrella; NOTES-07 managed dispatch/conversation/restart and visual approval remain open.",
  "scope": "UI-only Notes presentation, pinned metadata-card loading and catalog host lifecycle. Shared fixture/config changes require the complete cold catalog with axe, renderer/governance, strict types/ownership, renderer/static builds and document consumers. Rust/native/provider/OS/foreground acceptance and AI policy suites are out of scope because no native/AI contract or runtime changes. No package publication, native service replacement, source-data cleanup or baseline updates."
}
```
