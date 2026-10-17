# Compact merge settings

```json
{
  "id": "E-CATALOG-006",
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
    "spec/src/history/E-CATALOG-006.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "result": "pending",
  "remaining": [
    "Source/catalog suites and native builds remain deferred by user request.",
    "Full cold consumer qualification and visual review remain pending; no baselines are approved."
  ],
  "runs": [
    {
      "name": "before",
      "command": "Manual File conflicts/ModifiedOnDisk and user MergeEditorSettings report",
      "result": "fail",
      "failures": 1,
      "note": "One presentation issue: the 32px toggles enlarge the merge toolbar and make its vertical spacing excessive."
    },
    {
      "name": "manual-compact-preview",
      "command": "Preview File conflicts/MergeEditorSettings in light and dark",
      "result": "pass",
      "failures": 0,
      "note": "Both previews show compact controls with all four selected backgrounds and accessible pressed state intact. Tooltips remain visible. Images: .local/qualification/catalog-review/compact-merge-light.png and compact-merge-dark.png. No test suite is run."
    },
    {
      "name": "verification-table-width",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "The expanded evidence prose widened every verification table row to 35,736 bytes in total. Compact the changed evidence cell while retaining all record links, then rerun the same validator; do not raise its 32,768-byte limit."
    },
    {
      "name": "static-governance",
      "command": "pnpm progress:generate; pnpm spec:validate; pnpm spec:first; pnpm check:progress; pnpm check:architecture; pnpm check:app-ownership; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "6 validators, 104 chapters and 93 requirements; spec-first maps 2 protected files to 3 chapters. Progress reports 33 tasks and 89 records. Source/App boundaries and changed-file formatting pass. Generated MIGRATION.md is unchanged because task statuses and next actions are unchanged. The table byte-limit failure is corrected without changing the limit."
    }
  ],
  "milestoneReview": "M8.5 remains In progress under the existing test deferral. Compact presentation does not complete source/catalog/native gates or resume AI migration.",
  "contractReview": "Configure the shared Toggle through its public spacing semantic token on the existing control group. Controls shrink from 32px to 24px tall and the toolbar loses 8px of height. Selected colors, tooltips, disabled state and controlled merge options remain. No package implementation override or dependency refresh."
}
```

The public `--spacing` token is scoped to the merge settings group at 0.1875rem.
The existing small Toggles consequently use 24px height and 12px icons, with a
minimum 24px target in each dimension. The MergeEditor retains its own padding;
no private toolbar selector or source-package change is needed. E-CATALOG-005
retains the prior selected-color and cold-start evidence. This follow-up uses
the existing review server; the user's suite/native-build deferral remains.
