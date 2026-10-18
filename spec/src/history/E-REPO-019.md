# Blame layout and commit details preview

```json
{
  "id": "E-REPO-019",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-MIG-002",
    "LD-REPO-002",
    "LD-REPO-004"
  ],
  "date": "2026-10-18",
  "result": "pending",
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/BlameLayoutReview.stories.ts",
    "catalog/support/repository/blame-review/BlameReviewDemo.svelte",
    "catalog/support/repository/blame-review/ReviewBlameCommitTitle.svelte",
    "catalog/support/repository/blame-review/ReviewBlameGroup.svelte",
    "catalog/support/repository/blame-review/ReviewBlamePanel.svelte",
    "catalog/support/repository/blame-review/ReviewBlameView.svelte",
    "catalog/support/repository/blame-review/blame-review-view.ts",
    "catalog/support/repository/blame-review/commit-stats.ts",
    "catalog/support/repository/blame-review/large-fixture.ts",
    "catalog/support/repository/blame-review/title-actions.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-REPO-019.md"
  ],
  "contractReview": "LD-CAT-001/002/003: user explicitly requests Storybook copies for visual confirmation before live adoption. Adapt desktop-owned BlamePanel/View/Group at 68b130fb, retaining original jj-store attribution in docs/provenance.json. Public Design Core HoverCard, FileChangeStats, RelativeTime and production author/profile presentation compose the requested commit preview. Final subject-only refinement shows just the first message line, clamped to two wrapped lines with ellipsis; no corresponding jj-store commit hover component exists to copy. LD-REPO-002/004 native read, pin, authority, generation, source and lifetime contracts remain unchanged. No shipping source, public API, native command or package dependency changes.",
  "milestoneReview": "M13.2 remains Done under its original qualified native gate; M13 and M13.3 remain In progress. Catalog screenshots and fixture interactions do not complete native, durable managed conversation, provider or release gates. This preview awaits user confirmation before production adoption.",
  "scope": "Catalog-only blame layout, title action and hover preview in enclosing-change lktmkrqr on 68b130fb. The native jj-store owner remains clean. Broad/native checks deferred by user direction; only focused preview checks and document/ownership validation. LargeFile starts with both sidebars collapsed through public canonical host layout; the editor-action scenario deliberately retains Files navigation.",
  "remaining": [
    "User visual confirmation; production adoption is explicitly waiting.",
    "Production hover diff counts need an owned pinned summary query: native blame summaries do not contain counts. Current counts are explicit catalog-only fixture data.",
    "Shipping title action/icon and layout remain unchanged until confirmation."
  ],
  "runs": [
    {
      "name": "layout-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Original production copy retained the visible operation row. Log blame-layout-before.log."
    },
    {
      "name": "layout-superseded",
      "command": "same exact preview story command",
      "result": "pass",
      "failures": 0,
      "note": "Full-height divider draft passed; user then requested a content-height divider and final-row bottom border instead. Logs blame-layout-exact.log and blame-preview-layout-exact.log. Production drafts were restored before final catalog-only work."
    },
    {
      "name": "actions-draft",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Layout passed; editor title action was missing. Log blame-preview-actions.log."
    },
    {
      "name": "types-draft",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 3,
      "note": "EventRef union and two unsupported exact role options. Fixed typed individual event disposal and exact regular-expression labels. Log blame-preview-actions-types.log."
    },
    {
      "name": "hover-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts -t \"Commit Details\"",
      "result": "fail",
      "failures": 1,
      "note": "Existing blame titles had no commit detail hover card. Log blame-hover-before.log."
    },
    {
      "name": "hover-import-draft",
      "command": "pnpm check:types; exact review family",
      "result": "fail",
      "failures": 1,
      "note": "Unsupported diff/file-change-stats subpath. Corrected to the existing public diff export. Browser run was interrupted after import failure. Logs blame-preview-final-types.log and blame-preview-final-stories.log."
    },
    {
      "name": "optimizer-draft",
      "command": "exact review family",
      "result": "fail",
      "failures": 1,
      "note": "New icon optimization reloaded the test during import; no tests executed. Retried in a fresh runner after optimization. Log blame-preview-qualified-stories.log."
    },
    {
      "name": "hover-action-draft",
      "command": "exact review family",
      "result": "fail",
      "failures": 2,
      "note": "One layout pass; title-action scenario had not opened an editor and hover visibility assertion raced opening animation. Scenario now opens the file through the real Files view and awaits visible content. Log blame-preview-after.log."
    },
    {
      "name": "types-qualified",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors/warnings. Log blame-preview-qualified-types.log. Final rerun recorded below."
    },
    {
      "name": "hover-observed",
      "command": "exact review family",
      "result": "fail",
      "failures": 2,
      "note": "blame-preview-actions-hover.log and blame-preview-observed.log: layout passed, titlebar registration was overwritten by the file view loading its own actions, and hover close assertion retained a card while pointer safe-area handling was active. Sync now listens to public layout-change and reinstalls only if the actual contributed action is absent. Hover story retains the opened card for visual review."
    },
    {
      "name": "title-return-draft",
      "command": "exact Title Bar Action",
      "result": "fail",
      "failures": 1,
      "note": "blame-title-lifecycle.log: title action, recorded content and review tab icon passed, but the compatibility revealLeaf method did not select the host editor tab. The scenario now reopens through the real Files control. The first four-combinations attempt retained the same one failure with three passes and stopped before later combinations."
    },
    {
      "name": "large-exact",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts -t \"Commit Details|Large File|Blame Layout\"",
      "result": "pass",
      "failures": 0,
      "note": "Three exact interaction/accessibility cases passed; title action skipped. Real controller source is presented with twelve synthetic commits and six authors. Scroll exceeds three viewport heights, reaches the last-row border and returns. Log blame-large-exact.log."
    },
    {
      "name": "large-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and zero warnings. Log blame-large-types.log."
    },
    {
      "name": "documents-draft",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "note": "Draft evidence omitted revision/versions; progress additionally reported generated MIGRATION.md coverage before formatting returned that file to its original bytes. Metadata corrected; no product gate relaxed."
    },
    {
      "name": "host-navigation-draft",
      "command": "pnpm test:storybook catalog/plugins/repository/BlameLayoutReview.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "The first combination passed three stories but reopening via the Files control did not reactivate the retained editor view. The exact story now uses the public host workspace revealLeaf on the actual retained host tab; assertions are retained. Logs blame-review-four-combinations.log and blame-review-final-four-combinations.log."
    },
    {
      "name": "collapsed-draft",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Title action, hover and compact layout passed. New LargeFile sidebar assertion found compatibility split collapse was replaced while opening the host view. Use the public host workspace setSidebarOpen after opening the preview. Log blame-review-collapsed-exact.log."
    },
    {
      "name": "spec-first-draft",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "Migration inventory is also a canonical owner for catalog/support fixture changes. Added an explicit unchanged migration-gate statement in migration.md. Log blame-review-final-first.log."
    },
    {
      "name": "prior-final-documents",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Strict types: zero errors/warnings; source/App audits pass; progress:33tasks/121evidence; specification:6validators/140chapters/94requirements. Final metadata and collapsed-sidebar reruns are recorded separately."
    },
    {
      "name": "sidebar-api-draft",
      "command": "exact review family and pnpm check:types",
      "result": "fail",
      "failures": 1,
      "note": "The attempted facade setSidebarOpen call was unavailable at runtime and produced the user-reported page error. Strict types reported two errors. An intermediate draft used unsupported open fields in canonical layout JSON. Final code uses public getLayout/changeLayout with zero-width side docks. Logs blame-review-qualified-combinations.log, blame-review-qualified-types.log, blame-review-final-qualified.log and blame-sidebar-api-types.log."
    },
    {
      "name": "public-layout-exact",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All four exact interaction/accessibility stories pass in a fresh runner: compact final borders; editor title action/icon/opening and return; full message hover; large-file scroll to final row and back. Both dock widths are zero and rendered sidebars are absent/hidden. Log blame-sidebar-public-layout-exact.log."
    },
    {
      "name": "public-layout-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and zero warnings. Log blame-sidebar-public-layout-types.log."
    },
    {
      "name": "visible-preview",
      "command": "Browser reload of Desktop/Repository blame layout review/LargeFile",
      "result": "pass",
      "failures": 0,
      "note": "Actual review page shows Open left/right sidebar controls, no role=alert feedback, and the recorded source pane. Screenshot .local/reusable-conversations/blame-large-collapsed.png. User visual approval remains pending."
    },
    {
      "name": "review-state-combinations",
      "command": "pnpm test:storybook catalog/plugins/repository/BlameLayoutReview.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Four review stories pass at desktop/narrow widths in light/dark:16 focused interaction/accessibility executions. Log blame-preview-complete-states.log. Final subject-only refinement has a separate exact check."
    },
    {
      "name": "subject-only",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts -t \"Commit Details\"",
      "result": "pass",
      "failures": 0,
      "note": "Final user request limits the card to the first commit-message line and clamps that subject to two visual lines. Exact story asserts no body text and a two-line clamp. Larger fixture includes a long subject for overflow review. Log blame-subject-clamp.log."
    },
    {
      "name": "document-size-draft",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Migration topic reached401physical lines after the unchanged-gate preview note. Shortened that new note to keep the authored chapter within400; no existing requirements/evidence removed. Log blame-preview-complete-spec.log."
    },
    {
      "name": "final-documents-and-types",
      "command": "pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm check:types; changed-file Prettier; source/App ownership audits",
      "result": "pass",
      "failures": 0,
      "note": "Final subject-only state: zero type errors/warnings; progress33tasks/121records; specification6validators/140chapters/94requirements; mapped source gate passes. Earlier final source/App audits pass, and final changed-file formatting is checked before committing. Full native, root aggregate, static build and live adoption remain outside this preview scope."
    }
  ],
  "revision": "enclosing Jujutsu change lktmkrqr",
  "versions": {
    "desktopBase": "68b130fb",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "jj": "0.45.1",
    "storybook": "10.5.7",
    "svelte": "5.57.2",
    "vite": "7.3.2",
    "designCore": "installed verified 0.5.1 archive"
  }
}
```

The final layout ends the attribution divider beside source content, with a
bottom border across the last row and source group separators. The preview omits
the inner Blame heading and operation ID. A proposed plugin-owned public
FileView action opens the review at the recorded active-file pin; both action
and preview tab use `git-merge-conflict`. Title hover/focus retains
click-through to the pinned JJ Log, and shows a clamped first-line subject,
commit icon, author/avatar, time, sample diff counts and a compact change bar.
No hover performs a native read.

Production adoption and baseline approval remain pending. No production or
native app rebuild, restart, publication or distribution was performed.

The large fixture imports current local blame-controller source as plain text,
with synthetic authors, relative dates, commit messages and counts. It adds no
repository read, telemetry or runtime command parsing. The default large story
is opened for review; production adoption still waits for confirmation.
