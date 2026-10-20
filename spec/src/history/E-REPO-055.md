# Inset repository sidebar sizing

```json
{
  "id": "E-REPO-055",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M13.2"],
  "requirements": ["LD-REPO-004", "LD-CAT-003"],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "desktopParent": "254bc588"
  },
  "contractReview": "Embedded repository shells intentionally disable the full application minimum main width through the public Design Core prop, matching the existing AI embedded shell. At 320px the prior main surface extended 7px beyond its host, clipping its right border. No dependency overrides or shared package changes. Native annotation, identity, operation pins, wrap preference and virtual measurement contracts are unchanged.",
  "milestoneReview": "M13.2 remains Done at its original qualified history gate. M13/M13.3 remain Deferred. Focused UI sizing evidence does not change native backup, provider, signing, visual or release gates.",
  "runs": [
    {
      "name": "before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameWrapping.stories.ts -t 'Right Sidebar'",
      "result": "fail",
      "failures": 1,
      "note": "New regression fails: frame right 1207 exceeds host right minus 1 (1199). Browser separately measured a 320px host ending at 1280 with frame ending at 1287. Reproduces the missing border from the user screenshot."
    },
    {
      "name": "after",
      "command": "same exact Right Sidebar command",
      "result": "pass",
      "failures": 0,
      "note": "One story passed. At 320/400/480px the shell retains its inset right edge and only the source scrolls when wrapping is off."
    },
    {
      "name": "direct-shell-consumers",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameWrapping.stories.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/repository/HistoryLayout.stories.ts catalog/plugins/repository/Operations.stories.ts catalog/plugins/repository/Forges.stories.ts -t 'Blame|Narrow Pane In Wide Shell|Operation Graph And Changes|Empty Accounts'",
      "result": "pass",
      "failures": 0,
      "note": "Five selected stories / four families passed; 22 filtered stories skipped. Covers blame entrypoints, narrow history/diff, operation log and embedded backup Settings. The filter did not select the new RightSidebar story; the following complete blame-family runs cover it."
    },
    {
      "name": "blame-light",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameWrapping.stories.ts catalog/plugins/repository/Blame.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Eight stories / two families passed in a fresh process, including all wrap/measurement/preference, sidebar sizing, header action and failure/recovery assertions."
    },
    {
      "name": "blame-dark-narrow",
      "command": "LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameWrapping.stories.ts catalog/plugins/repository/Blame.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Eight stories / two families passed in dark narrow review. Eleven unique light-mode stories passed across all direct consumers."
    },
    {
      "name": "source-checks",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Zero Svelte errors or warnings; source and App ownership audits passed."
    },
    {
      "name": "spec-first-before-mapping",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 3,
      "note": "Required mapped desktop/migration/repository chapters had not yet been updated; added the governed sizing evidence to all three without changing existing gates."
    },
    {
      "name": "spec-first",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Five protected files / five canonical chapters."
    },
    {
      "name": "premature-bundle-audit",
      "command": "pnpm check:bundle",
      "result": "fail",
      "failures": 1,
      "note": "Audit was mistakenly started while Vite was rebuilding renderer files; rendererFiles.length was zero. This incomplete-output run qualifies nothing. Waited for build completion and ran the audit again."
    },
    {
      "name": "ordinary-build",
      "command": "pnpm exec tauri build --debug --bundles app; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Normal arm64 review application rebuilt. Post-build audit passed with 328 renderer JavaScript files and zero normal automation markers. Existing chunk-size, annotation and linker warnings retained; signing deferred."
    },
    {
      "name": "review-refresh",
      "command": "CUA guarded quit/cold launch of the rebuilt Lapis Notes Preview.app; process observation",
      "result": "pending",
      "failures": 0,
      "note": "Rebuilt app cold-launched as PID 29511; existing workspace, pinned blame, wrap setting and transcript restored. Captured the 12-character unsent draft before quitting. A subsequent user-interaction interruption and two native automation timeouts prevented confirming draft restoration or the final native border visually. Preserved the exact draft in ignored .local/review-draft-before-blame-refresh.txt. No prompt sent, file reset, or test assertion weakened. The corrected Storybook right sidebar visibly retains a 9px inset; screenshot in .local/blame-sidebar-review.png. Native window recheck remains separate."
    },
    {
      "name": "document-gates-before",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "note": "Ledger rejected unsupported partial result values and pass with remaining native-review gaps. Corrected the evidence to pending with a pending native-review run; no gate was weakened."
    },
    {
      "name": "final-document-gates",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:first; pnpm spec:validate; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "41 tasks / 225 records; five protected files / five canonical chapters; six validators / 259 chapters / 95 requirements. Evidence remains pending only for the interrupted native visual/draft confirmation; focused sizing checks passed."
    }
  ],
  "remaining": [
    "Native post-refresh visual check and confirmation of draft restoration were interrupted by UI automation; source and browser sizing acceptance pass. Visual baselines remain unapproved."
  ],
  "scope": "UI-only embedded repository shell and governed production stories. Under the user-selected minimal testing scope, check blame and representative direct shell consumers; defer unrelated aggregate suites, native Rust tests, live providers, visual baseline approval and release.",
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/BlameWrapping.stories.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-055.md",
    "spec/src/history/index.md",
    "src/components/repository/RepositoryShell.svelte"
  ]
}
```
