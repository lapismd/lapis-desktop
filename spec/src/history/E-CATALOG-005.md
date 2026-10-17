# Selected merge settings

```json
{
  "id": "E-CATALOG-005",
  "tasks": ["M8.5"],
  "requirements": ["LD-FILE-008", "LD-CAT-003", "LD-GOV-002", "LD-GOV-003"],
  "revision": "enclosing Jujutsu change",
  "versions": {
    "desktop": "0.1.0",
    "design-core": "0.5.1 fa174d7e candidate unchanged"
  },
  "files": [
    "src/components/files/ConflictReviewControls.svelte",
    "spec/src/current/files.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-005.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "result": "pending",
  "remaining": [
    "Source/catalog interaction, accessibility and native suites remain deferred by user request.",
    "Visual review remains pending; no baselines are approved."
  ],
  "runs": [
    {
      "name": "before",
      "command": "Manual Desktop/File conflicts/ModifiedOnDisk preview",
      "result": "fail",
      "failures": 1,
      "note": "One reported presentation defect: pressed ghost buttons have no selected fill. The first shared Toggle preview still blends into the toolbar because both use the same muted semantic color."
    },
    {
      "name": "manual-themed-review",
      "command": "ModifiedOnDisk light/dark: select wrap, whitespace and case; deselect wrap; inspect initial scroll-sync selection",
      "result": "pass",
      "failures": 0,
      "note": "Selected controls have a distinct theme-derived purple fill; deselection clears it. Accessible pressed values track each option and the merged text remains intact. Ignored images: .local/qualification/catalog-review/toggle-light.png and toggle-dark.png."
    },
    {
      "name": "cold-preview",
      "command": "Restart pnpm storybook on 7480; reload ModifiedOnDisk",
      "result": "pass",
      "failures": 0,
      "note": "Fresh process and browser reload preserve the initial selected scroll-sync fill. Selecting wrap also paints its background and updates the accessible pressed state. Screenshot: .local/qualification/catalog-review/toggle-cold-dark.png."
    },
    {
      "name": "spec-first-before-map-updates",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 2,
      "note": "Two attempts each report one LD-GOV-002 missing chapter: desktop.md, then migration.md after the progress ledger changes. Update both mapped chapters without changing any completion gate."
    },
    {
      "name": "static-governance",
      "command": "pnpm spec:validate; pnpm spec:first; pnpm progress:generate; pnpm check:progress; pnpm check:architecture; pnpm check:app-ownership; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "6 validators, 103 chapters, 93 requirements; spec-first maps 2 protected files to 3 chapters; 33 tasks and 88 evidence records. Source/App boundaries and formatting pass. Generated MIGRATION.md is unchanged because task statuses and next actions are unchanged. Functional suites and native builds remain deferred."
    }
  ],
  "milestoneReview": "M8.5 remains In progress. This focused presentation review does not complete its deferred source/catalog/native acceptance or resume AI migration.",
  "contractReview": "Use public Design Core Toggle pressed state and its existing theme styling. Scope the public muted semantic token to a primary/background color mix so the selected fill contrasts with this toolbar. No private selectors, source aliases, upstream modifications or additional persistence path."
}
```

The four independent merge settings now use the shared Toggle primitive rather
than ordinary ghost Buttons. Tooltip names, disabled state and controlled option
updates remain. The control group scopes the public `--muted` token to a mix of
`--primary` and `--background`; this configures the existing Toggle
selected/hover fill for its placement on a muted toolbar. No Design Core defect
or new public extension is needed, and its local archive remains unchanged.
