# History layout within narrow workspace panes

```json
{
  "id": "E-REPO-005",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-004",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-007"
  ],
  "revision": "enclosing Jujutsu change tttsrzwm",
  "versions": {
    "desktopUi": "2209736a",
    "platform": "macOS ARM64",
    "vitest": "4.1.11",
    "pnpm": "10.34.5"
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/History.stories.ts",
    "catalog/plugins/repository/HistoryLayout.stories.ts",
    "catalog/support/repository/RepositoryDemo.svelte",
    "catalog/support/repository/interactions.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/index.md",
    "src/components/repository/RepositoryPanel.svelte",
    "src/components/repository/RepositoryRevisions.svelte",
    "MIGRATION.md",
    "spec/src/history/E-REPO-005.md"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "live-preview-before",
      "command": "Open Desktop/Repository history/Pinned History And Diff in the actual7490 Storybook preview",
      "result": "fail",
      "failures": 1,
      "note": "The wide browser contains an approximately175px history pane after its normal sidebars. A viewport media query retains the192px revision column,crushing comparison text and file controls. Existing692 interaction cases had not asserted this pane geometry. Screenshot:jj-store/.local/reusable-conversations/history-preview-pane-before.png."
    },
    {
      "name": "exact-before",
      "command": "LAPIS_CATALOG_THEME=light LAPIS_CATALOG_VIEWPORT=desktop pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/HistoryLayout.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "NarrowPaneInWideShell fails:revision/comparison left edges differ192px rather than less than1. The fixture bounds the real shell at800px without narrowing the browser."
    },
    {
      "name": "exact-after",
      "command": "LAPIS_CATALOG_THEME=light LAPIS_CATALOG_VIEWPORT=desktop pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/HistoryLayout.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "One pass after component-owned named inline-size container queries and wrapping toolbar. Asserts pane<640px,stacked revisions/comparison,full comparison width,contained Refresh and file-button width>80px. Same production ribbon/revision/file workflow retained."
    },
    {
      "name": "history-family",
      "command": "pnpm test:storybook catalog/plugins/repository",
      "result": "pass",
      "failures": 0,
      "note": "All18 cases in both story files pass each desktop/narrow/light/dark configuration;72 total. Original17 scenarios and their assertions retained after helper extraction."
    },
    {
      "name": "types-renderer-builds",
      "command": "pnpm check:types && node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs && pnpm build && pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors/warnings;all191 renderer/governance cases pass;ordinary renderer and static catalog builds pass. No Rust/native product change."
    },
    {
      "name": "document-gates",
      "command": "pnpm progress:generate && pnpm check:progress && pnpm spec:validate && pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "33 tasks and 93 evidence records; six validators, 108 chapters and 94 requirements; 10 protected files and four canonical chapters. Native focus/restoration remains pending. progress:generate refreshes the derived MIGRATION.md table without changing milestone status. The derived MIGRATION.md diff is whitespace-only after normalization; restore it to the parent to avoid unrelated generated formatting churn."
    },
    {
      "name": "complete-catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "All 174 cases in 45 story files pass in desktop-light, narrow-light, desktop-dark and narrow-dark; 696 total. Fresh Vitest/browser processes exercise the current public-package artifacts. Log: jj-store/.local/reusable-conversations/history-pane-full-catalog.log. No baseline changes or native acceptance claim."
    },
    {
      "name": "selected-format",
      "command": "pnpm exec prettier --check catalog/COVERAGE.md catalog/DESKTOP_STATES.md catalog/plugins/repository/History.stories.ts catalog/plugins/repository/HistoryLayout.stories.ts catalog/support/repository/RepositoryDemo.svelte catalog/support/repository/interactions.ts spec/src/SUMMARY.md spec/src/current/desktop.md spec/src/current/migration.md spec/src/current/plugins.md spec/src/current/progress/milestones.md spec/src/current/repository.md spec/src/current/verification.md spec/src/history/E-REPO-005.md spec/src/history/index.md src/components/repository/RepositoryPanel.svelte src/components/repository/RepositoryRevisions.svelte",
      "result": "pass",
      "failures": 0,
      "note": "All changed files pass selected formatting. The exact path list is the change file inventory."
    },
    {
      "name": "record-format-repair",
      "command": "pnpm exec prettier --check catalog/COVERAGE.md catalog/DESKTOP_STATES.md catalog/plugins/repository/History.stories.ts catalog/plugins/repository/HistoryLayout.stories.ts catalog/support/repository/RepositoryDemo.svelte catalog/support/repository/interactions.ts spec/src/SUMMARY.md spec/src/current/desktop.md spec/src/current/migration.md spec/src/current/plugins.md spec/src/current/progress/milestones.md spec/src/current/repository.md spec/src/current/verification.md spec/src/history/E-REPO-005.md spec/src/history/index.md src/components/repository/RepositoryPanel.svelte src/components/repository/RepositoryRevisions.svelte",
      "result": "fail",
      "failures": 1,
      "note": "Final JSON reserialization leaves one evidence formatting warning. Apply the formatter, then repeat the selected check including generated MIGRATION.md. No source/test failure."
    },
    {
      "name": "final-format-and-progress",
      "command": "pnpm exec prettier --write spec/src/history/E-REPO-005.md && pnpm exec prettier --check catalog/COVERAGE.md catalog/DESKTOP_STATES.md catalog/plugins/repository/History.stories.ts catalog/plugins/repository/HistoryLayout.stories.ts catalog/support/repository/RepositoryDemo.svelte catalog/support/repository/interactions.ts spec/src/SUMMARY.md spec/src/current/desktop.md spec/src/current/migration.md spec/src/current/plugins.md spec/src/current/progress/milestones.md spec/src/current/repository.md spec/src/current/verification.md spec/src/history/E-REPO-005.md spec/src/history/index.md src/components/repository/RepositoryPanel.svelte src/components/repository/RepositoryRevisions.svelte && pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "Selected authored files pass formatting; progress passes with 33 tasks and 93 evidence records. The native gate stays pending."
    }
  ],
  "contractReview": "LD-REPO-004 makes pane-relative history presentation explicit. The application owns its named container,toolbar wrap and revision-list layout;public Design Core components/tokens remain untouched. Shared catalog interaction helpers preserve original17 scenarios and injected disposable Apps. Request identities,operation pins,receipts,persistence,native authority and execution are unchanged.",
  "milestoneReview": "M13/M13.2 remain In progress. UI layout qualification does not replace pending E-REPO-004 actual-window focus/restoration or durable conversation gates. No baseline or visual approval is created.",
  "scope": "One repository-presentation surface and its direct stories. The shared fixture/helper change plus public-package startup require the18-case affected family and complete current catalog after the exact regression. No Rust/source runtime changes or native build needed for this UI slice;the next actual-native rerun must rebuild its UI bundle."
}
```
