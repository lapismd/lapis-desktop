# Production blame adoption and native review update

```json
{
  "id": "E-REPO-023",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-DESK-003",
    "LD-HOST-001",
    "LD-MIG-002",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-007"
  ],
  "date": "2026-10-18",
  "result": "pending",
  "revision": "enclosing-change",
  "versions": {
    "desktopBase": "6f96191f",
    "storybook": "10.5.7",
    "svelte": "5.57.2",
    "designCore": "installed verified 0.5.1 archive",
    "pnpm": "10.34.5",
    "jj": "0.45.1"
  },
  "files": [
    ".storybook/preview.css",
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/Blame.stories.ts",
    "catalog/plugins/repository/BlameLayoutReview.stories.ts",
    "catalog/plugins/repository/OperationLayout.stories.ts",
    "catalog/plugins/repository/RowSelection.stories.ts",
    "catalog/support/repository/blame-review/BlameReviewDemo.svelte",
    "catalog/support/repository/blame-review/ReviewBlameGroup.svelte",
    "catalog/support/repository/blame-review/ReviewBlamePanel.svelte",
    "catalog/support/repository/blame-review/ReviewBlameRows.svelte",
    "catalog/support/repository/blame-review/ReviewBlameView.svelte",
    "catalog/support/repository/blame-review/blame-review-view.ts",
    "catalog/support/repository/blame-review/title-actions.ts",
    "catalog/support/repository/review/RepositoryHistoryReview.svelte",
    "catalog/support/repository/review/RepositoryOperationsReview.svelte",
    "docs/provenance.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository-review.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-REPO-023.md",
    "src-tauri/tauri.conf.json",
    "src/components/repository/RepositoryFileHistory.svelte",
    "src/components/repository/RepositoryGraph.svelte",
    "src/components/repository/RepositoryOperationArguments.svelte",
    "src/components/repository/RepositoryOperationColumn.svelte",
    "src/components/repository/RepositoryOperationMessage.svelte",
    "src/components/repository/blame/RepositoryBlameCommitTitle.svelte",
    "src/components/repository/blame/RepositoryBlameGroup.svelte",
    "src/components/repository/blame/RepositoryBlamePanel.svelte",
    "src/components/repository/blame/RepositoryBlameRows.svelte",
    "src/components/repository/blame/RepositoryBlameView.svelte",
    "src/components/repository/blame/blame-view.ts",
    "src/components/repository/blame/editor-actions.ts",
    "src/components/repository/repository-plugin.ts",
    "src/lib/repository/operation-command.ts",
    "tests/renderer/repository-operation-command.test.mjs",
    "vite.catalog.config.ts"
  ],
  "contractReview": "User authorizes production adoption and review app update. LD-REPO-002/004 retain native annotation, pin, identity, bounds, background status, independent handle and closure contracts. Promote catalog-owned blame layout/ScrollArea/virtual geometry/commit title to production, delete duplicate preview components and CSS masks, and inject only optional fixture stats. Enabled plugin owns editor git-merge-conflict actions and removes them on disable; action reads current recorded file and fences changed file scope. Commit-card subject opens JJ Log at the same operation. First-line subject clamps to two visual lines. Both log resting rows use --background, preserving selected/hover rules. Details title collapses without hover fill; ID buttons retain independent actions. Recognized JJ 0.45.1 transaction attribute quoting is decoded and safely re-quoted for display only, bounded to65536 characters; unknown/malformed text remains verbatim. Raw native attributes are unchanged and never executed. LD-DESK-003 image CSP admits only https://www.gravatar.com beyond its previous sources; no generic remote-image or IPC authority. Existing source attribution remains in docs/provenance.json.",
  "milestoneReview": "M13.2 keeps its original Done qualification. M13/M13.3 remain In progress with original native/conversation/release gates. This is a focused presentation/plugin adoption; broader provider/platform/release and visual baselines remain separate.",
  "scope": "Focused repository production plugin and direct catalog consumers, strict source checks, renderer/governance tests, renderer/native review bundle and cold ordinary review. No new native service command, repository write, dependency publication, app installation or data reset. The new icon is explicitly pre-optimized to avoid Vite invalidating the initial browser test import. Whole-catalog/release/provider work stays deferred under the user continuation.",
  "runs": [
    {
      "name": "editor-action-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Blame.stories.ts -t 'Editor Blame Action'",
      "result": "fail",
      "failures": 1,
      "note": "Production editor has zero Blame actions; new assertion requires exactly one. Log blame-adoption-before.log."
    },
    {
      "name": "types-first",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 5,
      "note": "New event-ref union cleanup and test View narrowing rejected in two files. Reuse individually typed event refs and explicit FileView narrowing. Log blame-adoption-types.log."
    },
    {
      "name": "browser-first",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/{Blame,BlameLayoutReview,RowSelection}.stories.ts",
      "result": "fail",
      "failures": 2,
      "note": "One file failed import during newly optimized git-merge-conflict icon reload; one title-action story queried rename before asynchronous file header readiness. Explicit icon pre-optimization and awaited header preserve cold startup and assertions. Log blame-adoption-exact.log."
    },
    {
      "name": "blame-exact",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/repository/BlameLayoutReview.stories.ts catalog/plugins/repository/RowSelection.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Twelve interaction/accessibility stories pass in a fresh runner, including production title action cleanup on disable, subject navigation, sticky scrolling and row surface. Log blame-adoption-exact-final.log."
    },
    {
      "name": "command-before-after",
      "command": "node --test tests/renderer/repository-operation-command.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Before:2failed/1passed. After:3passed/0failed. Supplied nested TOML example, apostrophes, literal shell syntax, backslashes and malformed/unknown formats covered. JJ writer confirmed in jj-cli0.45.1 cli_util.rs command_args_to_transaction_attribute; storage currently uses quote wrapping and escaped apostrophes rather than POSIX escaping. Logs operation-command-{before,after}.log."
    },
    {
      "name": "oplog-hover-exact",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/OperationLayout.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All3 Op Log interaction/accessibility cases pass, including unchanged title background on hover and retained collapse actions. Log oplog-hover-exact.log."
    },
    {
      "name": "source-checks",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; node --test tests/renderer/repository-*.test.mjs tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Strict types zero errors/warnings, both source/App audits pass,133 repository/governance tests pass. Logs blame-live-{types,architecture,ownership,node}.log."
    },
    {
      "name": "normal-bundle",
      "command": "pnpm desktop:bundle --debug; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Renderer built in92s; ordinary native build21.66s;228.01MiB app. ARM64/macOS bundle audit passes with0automation markers. Existing Rollup annotation/large chunk warnings retained. Logs blame-live-bundle.log and blame-live-bundle-audit.log."
    },
    {
      "name": "cold-review-app",
      "command": "CUA graceful Quit menu, cold exact ordinary Preview launch, observe recorded blame and select operation114334d6, source fingerprint comparison",
      "result": "pass",
      "failures": 0,
      "note": "Updated ordinary app is running with preserved profile/vault. Native blame has filename-only inner header/shared ScrollArea and recorded source at bd3e4eca pin. Selected operation args render user.name and user.email with readable double-quote wrappers and literal TOML apostrophes. Both regular log row fills come from production, with selected fill retained. All110 captured fixture source/Git/JJ files match before/after; .lapis profile state is excluded. Screenshot blame-live-native-oplog.png; native accessibility inspection confirms the exact formatted command. User also interacted during review; accessibility was refreshed before further actions. Direct native editor title-bar Blame action opens Note.md at1980d3fa/bd3e4eca and shows recorded Unsnapshotted draft while the editor keeps Dirty after external advance. Screenshots blame-live-native-blame.png and blame-live-native-command.png show the adopted layout/readable command."
    },
    {
      "name": "documentation-initial",
      "command": "pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "fail",
      "failures": 3,
      "note": "Initial contract additions exceeded desktop bytes/repository lines and spec-first required the governance chapter. A second validation found desktop1byte over/governance404lines plus missing fresh coverage for governance. Move presentation prose into the owning review chapter, compress redundant historical introduction, modify the existing governance note, include all changed files in this record. Original requirements/gates remain unchanged. Logs blame-live-{progress,spec,first}.log and their -final variants retain the attempts."
    },
    {
      "name": "repository-family",
      "command": "pnpm test:storybook catalog/plugins/repository catalog/plugins/background/Work.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All93 stories across18 files pass in each desktop/narrow by light/dark combination:372 focused interaction/accessibility executions. Fresh runner processes qualify cold startup and icon pre-optimization without the original import reload. Log blame-live-repository-stories.log. This is the directly affected family, not the whole catalog."
    },
    {
      "name": "final-documents",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm exec prettier --write/--check on changed files",
      "result": "pass",
      "failures": 0,
      "note": "Progress33tasks/125evidence; six validators/144chapters/94requirements; spec-first37protected files/six chapters. All source/App and strict type checks remain passing. Initial changed-file formatter found only generated MIGRATION.md; format it and rerun. Requirement bytes/lines remain within their unchanged limits. Logs blame-live-{progress,spec,first}-qualified.log."
    },
    {
      "name": "evidence-status-check",
      "command": "pnpm check:progress; pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "note": "Changing the overall evidence result to pass was correctly rejected while separate visual/provider gate gaps remain listed. Retain pending evidence status with all completed focused/native runs recorded as pass; no gate or remaining gap is removed."
    }
  ],
  "remaining": [
    "Visual baselines and broad provider/platform/release gates remain deferred.",
    "Positive Gravatar HTTP in a native fixture with a registered image is not separately exercised. Storybook dev@lapis.md image loading is recorded in E-REPO-022; this slice qualifies the exact native image-host policy and fallback presentation."
  ]
}
```
