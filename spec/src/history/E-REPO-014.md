# Shrinking repository picker titles: catalog preview

```json
{
  "id": "E-REPO-014",
  "tasks": ["M13", "M13.2"],
  "requirements": ["LD-REPO-004", "LD-GOV-001", "LD-GOV-002", "LD-GOV-003"],
  "revision": "enclosing Jujutsu change txoyqxmy",
  "versions": {
    "desktopBase": "2a4ed91c5646fee7016cba4741220d553846a38d",
    "designCore": "0.5.1",
    "storybook": "10.5.7"
  },
  "files": [
    "src/components/repository/repository-picker-options.css",
    "catalog/support/repository/review/RepositoryReviewDemo.svelte",
    "src/components/repository/RepositoryParentSummary.svelte",
    "src/components/repository/RepositoryRevisionOption.svelte",
    "src/components/repository/RepositoryOperationOption.svelte",
    "src/components/repository/RepositoryCommitPicker.svelte",
    "src/components/repository/RepositoryRevisionPicker.svelte",
    "src/components/repository/RepositoryOperationParentPicker.svelte",
    "src/components/repository/RepositoryOperationPinPicker.svelte",
    "catalog/COVERAGE.md",
    "spec/src/current/repository-review.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md"
  ],
  "result": "pending",
  "runs": [
    {
      "name": "picker-width-inspection",
      "command": "Read shared catalog summaries/options/parent labels and public CommandView item layout; inspect actual dropdown row geometry through CUA.",
      "result": "pass",
      "failures": 0,
      "note": "Public CommandView uses named three-column/two-row grid areas. Existing catalog two-column overrides leave those inherited areas intact. Explicitly reset the owned item template to one row and a selection column plus minmax(0,1fr) content. Retain shrinkable zero-basis message summaries and fixed avatar/ID/time. No source package edit or dependency-internal selector."
    },
    {
      "name": "shared-shrinking-option-preview",
      "command": "Targeted prettier; CUA OperationMessageIds open changed-revision and operation snapshot pickers, inspect computed grid/text bounds; EvolutionLog open JJ parent and Evo predecessor pickers and inspect selected labels.",
      "result": "pass",
      "failures": 0,
      "note": "Operation title measures417px natural text in375px available space with ellipsis; entire option width/scroll both652px and grid areas none. Changed-revision options use16px608px tracks with no overflow. JJ parent and Evo predecessor options use same single-row ReviewRevisionOption; width/scroll both628px and grid areas none. Selected labels also fit451px/468px rows with118px ID controls and no scroll overflow. All retain full description in title/accessibility metadata, copy identity and separate relative time. Screenshots .local/reusable-conversations/storybook-picker-shrinking-title-review.png and storybook-history-picker-label-width-review.png. Browser preview only; automated resize/keyboard/axe/types/build remain deferred."
    },
    {
      "name": "previous-format-followup",
      "command": "pnpm exec prettier --write catalog/support/repository/review/review-evolution-comparison.ts spec/src/history/E-REPO-013.md; pnpm exec prettier --check catalog/support/repository/review catalog/plugins/repository/ParityReview.stories.ts catalog/COVERAGE.md spec/src/current/repository-review.md spec/src/history/E-REPO-013.md docs/provenance.json",
      "result": "pass",
      "failures": 0,
      "note": "All matched files pass formatting after the single formatting discrepancy recorded in E-REPO-013. No behavioral change to the evolution comparison helper. Current picker followup has its own final document/format checks."
    },
    {
      "name": "picker-document-check-before",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Progress passes33 tasks/116 evidence records. Specification flags one malformed combined evidence link in verification.md introduced while adding E-REPO-014. Restore the existing E-REPO-013 target and add a separate E-REPO-014 link; rerun document consumers."
    },
    {
      "name": "picker-document-width-followup",
      "command": "pnpm exec prettier --write spec/src/current/verification.md spec/src/history/E-REPO-014.md; pnpm check:progress; pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Separate evidence links fix navigation; Prettier table alignment then expands verification.md to34598 bytes. Move the latest pending preview link to a requirement-labelled paragraph outside the table, retaining all existing table evidence/gates. Rerun document checks."
    },
    {
      "name": "picker-final-document-and-freeze",
      "command": "Final targeted prettier --check; pnpm check:progress; pnpm spec:validate; Python production-freeze hash/size inventory",
      "result": "pass",
      "failures": 0,
      "note": "Final checks follow the two recorded documentation repairs. Product type/tests/build/native lanes remain deferred. Production332-file freeze remains unchanged. NOTES-05I remains solely Active; no qualification status advances."
    }
  ],
  "remaining": [
    "User visual confirmation and deferred product type/interaction/accessibility/build qualification.",
    "Native workspace queries, Evolog alignment, Revert and guarded conflict mutation integration remain pending; shipping source stays frozen."
  ],
  "contractReview": "LD-REPO-004 catalog-only presentation now consistently shrinks/truncates message text inside dropdown option and selected-label width constraints. Full descriptions/IDs, copy values, author controls, timestamps and existing pin/selection semantics remain. No native contract, mutation or source package change. Reuse existing copied/adapted components rather than a replacement screen.",
  "milestoneReview": "M13.2 keeps its original qualified Done gate. This pending catalog review does not qualify parity, visual approval or production adoption. M13/M13.3 remain In progress; NOTES-05I is solely Active and NOTES-07 waits.",
  "scope": "Storybook-only components/owned styles and their documentation. Product tests/types/build/native lanes remain deferred under the user’s Storybook-first direction. This unqualified preview remains uncommitted; formatting and document consumers run separately.",
  "fileInventoryNote": "Files reflect production promotion in E-REPO-015; original preview commands, results, gaps and frozen-source observations remain historical."
}
```
