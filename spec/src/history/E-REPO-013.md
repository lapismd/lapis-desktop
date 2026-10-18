# Repository parity preview: controls, tags, evolution and conflicts

```json
{
  "id": "E-REPO-013",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-CAT-003",
    "LD-REPO-004",
    "LD-REPO-002",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003"
  ],
  "revision": "enclosing Jujutsu change txoyqxmy",
  "versions": {
    "desktopBase": "2a4ed91c5646fee7016cba4741220d553846a38d",
    "jjStoreReference": "5b11966779de92a60876e619c30c5575cef011ac",
    "designCoreVersion": "0.5.1",
    "designCoreSource": "b947799617af21fcbcd52c8b2b48593badbecec6",
    "designCoreArchiveSha256": "8768360cb65fb3dfa760e548a5f57fa5f8c5ce737f7f111f88322e9fd590783e",
    "pnpm": "10.34.5",
    "node": "26.9.0",
    "platform": "macOS ARM64",
    "storybook": "10.5.7",
    "vite": "7.3.2",
    "svelte": "5.57.2",
    "jjStoreTagReference": "204676c3783cd62f3627e976edabb24b96f83c95"
  },
  "files": [
    "src/components/repository/repository-column-chrome.css",
    "catalog/support/repository/review/RepositoryReviewDemo.svelte",
    "src/components/repository/RepositoryDiffColumn.svelte",
    "src/components/repository/RepositoryDiffControls.svelte",
    "src/components/repository/RepositoryCommitMessage.svelte",
    "catalog/support/repository/review/review-fixture.ts",
    "catalog/COVERAGE.md",
    "spec/src/current/repository.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "catalog/plugins/repository/Comparison.stories.ts",
    "catalog/support/repository/review/history-review-view.ts",
    "catalog/support/repository/review/review-view.ts",
    "MIGRATION.md",
    "src/components/repository/RepositoryOperationArguments.svelte",
    "src/components/repository/RepositoryOperationColumn.svelte",
    "catalog/support/repository/review/RepositoryOperationsReview.svelte",
    "src/lib/repository/tags.ts",
    "src/components/repository/RepositoryGraph.svelte",
    "src/components/repository/RepositoryCommitPicker.svelte",
    "catalog/support/repository/review/ReviewCommitTarget.svelte",
    "src/components/repository/RepositoryRevisionPicker.svelte",
    "catalog/support/repository/review/RepositoryHistoryReview.svelte",
    "catalog/plugins/repository/ParityReview.stories.ts",
    "docs/provenance.json",
    "src/components/repository/RepositoryLogHeader.svelte",
    "src/components/repository/RepositoryOperationPinPicker.svelte",
    "src/components/repository/RepositoryOperationOption.svelte",
    "spec/src/SUMMARY.md",
    "catalog/support/repository/review/ReviewEvolutionColumn.svelte",
    "src/components/repository/RepositoryRevisionActions.svelte",
    "catalog/support/repository/review/review-evolution.ts",
    "catalog/support/repository/review/review-evolution-comparison.ts",
    "src/lib/repository/history-canvas.ts",
    "src/components/repository/RepositoryRevisions.svelte",
    "src/components/repository/RepositoryRevisionFiles.svelte",
    "src/components/repository/RepositoryComparisonBar.svelte",
    "spec/src/current/repository-review.md",
    "src/components/repository/RepositoryShell.svelte",
    "src/components/repository/RepositoryParentSummary.svelte",
    "catalog/support/repository/review/ReviewRevertOperation.svelte",
    "catalog/support/repository/review/review-conflict-fixture.ts",
    "src/components/repository/conflicts/RepositoryConflictActions.svelte",
    "src/lib/repository/workspaces.ts",
    "src/components/repository/conflicts/RepositoryConflictSurface.svelte",
    "src/components/repository/RepositoryOperationParentPicker.svelte",
    "src/lib/repository/operation-message.ts",
    "src/components/repository/RepositoryFileTitle.svelte",
    "src/components/repository/conflicts/repository-conflict-file-tree.css",
    "src/components/repository/RepositoryRevisionOption.svelte",
    "src/lib/repository/conflict-menu.ts",
    "src/components/repository/RepositoryOperationRail.svelte",
    "src/components/repository/repository-review-identifiers.css",
    "src/components/repository/conflicts/RepositoryConflictText.svelte",
    "src/components/repository/conflicts/repository-conflicts.css",
    "src/components/repository/conflicts/RepositorySidebarToggleIcon.svelte",
    "src/components/repository/RepositoryPickerSearch.svelte",
    "src/components/repository/RepositoryWorkspacePicker.svelte",
    "src/components/repository/RepositoryAuthorAvatar.svelte",
    "src/components/repository/conflicts/RepositoryConflictFileTree.svelte",
    "src/components/repository/RepositoryOperationMessage.svelte",
    "src/components/repository/conflicts/RepositoryConflictBody.svelte",
    "catalog/support/repository/review/ReviewConflictResolution.svelte",
    "src/components/repository/RepositoryOperationFiles.svelte",
    "src/components/repository/RepositoryComparisonTime.svelte",
    "src/lib/repository/author.ts"
  ],
  "result": "pending",
  "runs": [
    {
      "name": "before-column-contrast",
      "command": "Read public Design Core ColumnCanvas/Button/Toggle contracts and jj-store repository-log-diff.css/stack-workspace.css; CUA inspect Close Diff focus and header/control styles.",
      "result": "pass",
      "failures": 0,
      "note": "Existing theme accent is #f6f6f6, close/refresh/toggle feedback is too close to the pale header, and catalog diff buttons force transparent backgrounds without a distinct unselected hover. Default ColumnCanvas header action token is12% foreground. This is a catalog contrast preference, not a dependency defect."
    },
    {
      "name": "format-review-components",
      "command": "pnpm exec prettier --write catalog/support/repository/review/review-column-chrome.css catalog/support/repository/review/RepositoryReviewDemo.svelte catalog/support/repository/review/ReviewHistoryDiff.svelte catalog/support/repository/review/ReviewDiffControls.svelte; pnpm exec prettier --write catalog/support/repository/review/ReviewCommitMessage.svelte catalog/support/repository/review/review-fixture.ts",
      "result": "pass",
      "failures": 0,
      "note": "Catalog-owned chrome hosts and public ColumnCanvas tokens use24% foreground mixed with background for hover/focus. Diff selected rest stays12%, with stronger hover/focus. No global row/menu theme change, source package patch or new dependency."
    },
    {
      "name": "manual-control-and-message-preview",
      "command": "CUA hidden selected-operation-actions; focus Close Diff and Collapse Op Log with Shift; navigate with globals=colorMode:dark, inspect settled styles, switch JJ tab via fresh AX, click View more then View less; open multiline-commit-message with globals=colorMode:light and inspect screenshot/geometry.",
      "result": "pass",
      "failures": 0,
      "note": "Close focus settles to srgb0.792 in light versus header0.95; dark settles0.294588 versus header0.111765. Hover/focus share the owned CSS rule; actual pointer hover timing remains unqualified. Initial colour reads caught a transition frame, then settled reads were used. A semantic checkbox locator did not match the custom workspace tab; fresh AX click opened JJ. Long rendered body measures483px, collapsed viewport144px (9rem) with a48px fade, and expands to482.62px with no mask. View less restores collapse and aria-expanded changes. Light message background0.956667 differs from selected0.896; dark0.15451 differs from selected0.206118. The fixture now includes additional paragraphs/headings/checklist below the fold. Public safe MarkdownContent stays intact; opening a focused Markdown link reveals its context. Focus-link, short nonempty message, resizing/selection reset and automated axe/keyboard qualification remain deferred."
    },
    {
      "name": "preview-artifacts",
      "command": "CUA getScreenshot; Python SHA-256 production-freeze-review.json comparison; targeted document formatting and progress commands recorded below.",
      "result": "pass",
      "failures": 0,
      "note": "Screenshots under .local/reusable-conversations: storybook-column-action-contrast-review.png, storybook-collapsed-message-dark-review.png, storybook-collapsed-message-light-review.png. The current production freeze is intact. Browser previews are manual evidence only; no automated product tests, native rebuild/restart, clipboard use, baseline update or visual approval."
    },
    {
      "name": "progress-record-coverage-before",
      "command": "pnpm progress:generate && pnpm check:progress",
      "result": "fail",
      "failures": 3,
      "note": "Generation succeeds; progress checker finds three existing review composition files without fresh evidence coverage: Comparison.stories.ts, history-review-view.ts and review-view.ts. Their earlier catalog-only wiring was unchanged by this slice, but is exercised by the mounted two-tab manual preview. Add those paths to this pending evidence inventory without claiming callback/type/interaction qualification; rerun bookkeeping."
    },
    {
      "name": "progress-record-coverage-after",
      "command": "pnpm exec prettier --write spec/src/history/E-REPO-013.md; pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes33 tasks/115 evidence records after recording coverage for the existing review composition. Bookkeeping only, not product tests. Targeted documentation formatter also covers catalog/COVERAGE.md, spec/src/current/repository.md, spec/src/current/progress/milestones.md, spec/src/current/verification.md and E-REPO-013; jj-store formats both maintenance review/progress pages. Production source SHA-256 inventory has no differences from the freeze."
    },
    {
      "name": "operation-command-source-and-preview",
      "command": "Read jj-cli0.45.1 cli_util.rs start_repo_transaction/command_args_to_transaction_attribute and jj-store local_browser graph_types.rs/graphs.rs plus installed jj-history generated.ts. pnpm exec prettier --write catalog/support/repository/review/ReviewOperationArguments.svelte catalog/support/repository/review/ReviewOperationColumn.svelte catalog/support/repository/review/RepositoryOperationsReview.svelte catalog/support/repository/review/review-view.ts catalog/support/repository/review/review-fixture.ts; CUA inspect selected-operation-actions, save screenshot, then navigate to its parent.",
      "result": "pass",
      "failures": 0,
      "note": "JJ CLI records a shell-quoted command string under metadata.attributes[args]; jj-store clones the map into LocalGraphOperationNode and the installed public type exposes it. No native/package extension required. Catalog-only Info disclosure, nativeDetails state, RepositoryOperationDetail import/render and now-unused onHistory wiring are removed. The labelled left Inspect action remains to open the main details column. New optional Command block renders the unmodified nonblank args string as escaped plain pre/code after Comparison parent, never parses or executes it and adds no inferred prefix. Fixture selected operation includes a realistic jj describe command; root parent omits args. Manual DOM shows zero native Info buttons/old details; commandTop equals parentBottom244.59px. Parent navigation removes the command (zero command sections), with no missing placeholder. Screenshot .local/reusable-conversations/storybook-operation-command-details-review.png. Automated tests/type/axe, whitespace-only/wrapping/dark command qualification and production adoption remain deferred."
    },
    {
      "name": "tag-list-source-and-fixture-preview",
      "command": "Read jj-store CommunityProjectsRevisionGraphCopy.svelte and Design Core TagList/TagChip/tag-list.css/TagListItem/Badge public contracts; pnpm exec prettier --write catalog/support/repository/review/review-tags.ts catalog/support/repository/review/ReviewGraph.svelte catalog/support/repository/review/ReviewCommitPicker.svelte catalog/support/repository/review/ReviewCommitTarget.svelte catalog/support/repository/review/ReviewRevisionPicker.svelte catalog/support/repository/review/review-fixture.ts catalog/plugins/repository/ParityReview.stories.ts; CUA hidden tags-and-conflicted-commits, open +3 and select Grace.",
      "result": "pass",
      "failures": 0,
      "note": "Review-only TagList replaces flattened graph/commit-preview tags. Shared mapping retains active local/remote bookmarks, workspaces, merge/divergence/conflict labels and semantic tones; flat overflow has no redundant tooltip descriptions. Graph TagList is outside the selection button, with aria-describedby. Popup/keyboard propagation in the command preview stays separate from selection. Fixture includes local/remote long names, default workspace and a conflicted Grace revision; native detail replies share the same metadata. Earlier manual +3 popup shows all five tags without selecting a different revision. Automated product checks remain deferred."
    },
    {
      "name": "selected-tag-shapes-before",
      "command": "CUA select Update vault shortcuts in tags-and-conflicted-commits; inspect screenshot, rendered bounds and computed badge styles.",
      "result": "fail",
      "failures": 1,
      "note": "Remote labels are present, not clipped. Their default outline chips have transparent backgrounds and #e0e0e0 borders against selected srgb0.896, obscuring chip shapes. Conflicted/local coloured chips remain visible. Design Core outline behavior is intentional; this is the catalog mapping choice, not a dependency defect."
    },
    {
      "name": "selected-tag-shapes-after",
      "command": "pnpm exec prettier --write catalog/support/repository/review/review-tags.ts; CUA select Grace, open Welcome.md and +1, then navigate with globals=colorMode:dark and repeat selection/file; read settled styles and save screenshots.",
      "result": "pass",
      "failures": 0,
      "note": "Bookmarks now use public secondary variant; semantic tones retain local/conflict styling. Light neutral chip background is #f6f6f6 against selected srgb0.896; dark is #262626 against selected srgb0.206118. Labels remain foreground and all inline chips measure20px. Wide selected Grace shows all four tags. Beside the diff, three tags and +1 fit; popup shows Conflicted/notes/notes@origin/notes@backup without changing Grace selection. Screenshots: .local/reusable-conversations/storybook-selected-conflicted-tags-review.png, storybook-selected-tag-overflow-review.png and storybook-selected-conflicted-tags-dark-review.png. No dependency edits or selectors, baseline update, automated product tests or production adoption."
    },
    {
      "name": "tag-preview-bookkeeping-and-document-limits-before",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; Python SHA-256 production-freeze-review.json comparison and Markdown line/byte inventory.",
      "result": "fail",
      "failures": 4,
      "note": "Progress generation/check passes33 tasks/115 evidence records. All332 production src files match the freeze. Document-only validation finds two existing pending ledger tables over32768 bytes (milestones33288, verification34480) and missing SUMMARY entries for both E-REPO-012/013. Compact repeated checkpoint/evidence prose, preserve all task rows/statuses/gates/evidence links, and add navigation; rerun document consumers. Product tests remain deferred."
    },
    {
      "name": "operation-selector-parity-preview",
      "command": "pnpm exec prettier --write catalog/support/repository/review/ReviewLogHeader.svelte catalog/support/repository/review/ReviewOperationPinPicker.svelte catalog/support/repository/review/ReviewOperationOption.svelte catalog/support/repository/review/RepositoryHistoryReview.svelte catalog/support/repository/review/RepositoryOperationsReview.svelte; CUA open both header operation selectors, inspect screenshot, filter no matches and close.",
      "result": "pass",
      "failures": 0,
      "note": "Catalog-only headers now share ReviewPickerSearch and ReviewOperationOption with Revisions/operation parents. Zero outer padding, one bordered search/close row, no visible title/group heading/full-ID footer, single avatar/description/OP-copy/time option and current-pin marker. Available fixture operation metadata is shared with graph replies; no open/search lookup added. No matches appears for a foreign query; Close restores trigger focus and retains pin. Screenshot .local/reusable-conversations/storybook-operation-selector-review.png. Full-ID copy, multiple choices, automated keyboard/axe and production qualification remain deferred."
    },
    {
      "name": "document-limits-and-navigation-after",
      "command": "pnpm exec prettier --write spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/SUMMARY.md spec/src/history/E-REPO-013.md; pnpm check:progress; pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Compacted repeated checkpoint/evidence prose without changing task rows, statuses, gates or selected evidence. Both pending records now have SUMMARY entries. Progress passes33 tasks/115 records; document validation passes6 validators/131 chapters/94 requirements. Subsequent evolution scope adds a linked review continuation to keep the growing repository chapter bounded; final document checks follow below. Product tests remain deferred."
    },
    {
      "name": "evolution-inspection-before",
      "command": "Read jj-store StoreEvolutionColumn.svelte, StoreRepositoryActionsPanel.svelte and repository-log-canvas.ts; inspect initial catalog EvolutionLog preview.",
      "result": "fail",
      "failures": 1,
      "note": "Initial preview supplied the selected-row action and independent closeable graph, but selected versions lacked commit message/file expansion and diff inspection. User requests the complete JJ Log inspection flow. Extend the catalog composition without shipping/native adoption."
    },
    {
      "name": "jj-evolution-semantics-and-expanded-preview",
      "command": "jj --no-pager evolog --help; read jj-cli0.45.1 commands/evolog.rs and diff_util.rs show_inter_diff; pnpm exec prettier --write catalog/support/repository/review/review-evolution-comparison.ts catalog/support/repository/review/review-evolution.ts catalog/support/repository/review/ReviewEvolutionColumn.svelte catalog/support/repository/review/ReviewRevisions.svelte catalog/support/repository/review/ReviewRevisionFiles.svelte catalog/support/repository/review/ReviewComparisonBar.svelte catalog/support/repository/review/ReviewCommitPicker.svelte catalog/support/repository/review/ReviewHistoryDiff.svelte catalog/support/repository/review/review-history-canvas.ts catalog/support/repository/review/RepositoryHistoryReview.svelte; CUA EvolutionLog inspect current/older/initial version, open version Welcome.md and inspect retained main selection/pin.",
      "result": "pass",
      "failures": 0,
      "note": "JJ evolog --patch compares aligned predecessors, including a temporary rebase when parents differ. Catalog now reuses JJ expanded-row Markdown, measured View more, profile/tags, comparison selector and changed-file modes. Synthetic same-parent predecessor patches use Previous version; initial versions use the recorded native parent. Parent fields remain unchanged and graph edges explicitly use predecessors. Rebased/combined/unknown comparisons are unavailable, never substituted with raw tree diffs. Each version remains selectable in the original graph and has an independent file selection/diff column, split/unified controls and full-height rendering. Manual latest patch shows History stays local -> History is retained; older patch Draft vault -> History stays local. Older version Markdown renders bold, code and list; initial version shows Comparison parent Start the vault. Main DOM selection remains Keep repository history beside the notes and full ab..ab operation pin. Earlier close/reopen/main-change checks retain independence; final rich-column closure is recorded separately if exercised. Screenshots .local/reusable-conversations/storybook-evolution-messages-review.png, storybook-evolution-file-diff-review.png and storybook-evolution-expanded-diff-review.png. No native evolution/diff lookup or public contract extension is implemented; comparisons/content are explicit fixtures. Automated types/interactions/axe/build, unsupported-case branch qualification, native alignment/paging/recovery and production adoption remain deferred."
    },
    {
      "name": "workspace-and-operation-title-preview",
      "command": "Read jj-store StoreWorkspacePicker/StoreWorkspaceSectionHeader/store-workspaces and revision graph message/parser; format catalog workspace/title files; CUA open workspace picker in both logs, select notes-review in Op Log, filter missing-workspace in JJ Log, inspect operation title graph/details and button structure.",
      "result": "pass",
      "failures": 0,
      "note": "Both headers show explicit default/notes-review links and Repository overview with shared search/close. Op selection changes context, clears selected operation/details and retains the full ab..ab pin. JJ foreign search shows No matching workspaces. This does not qualify native workspace filtering. Graph/details display describe commit 5ae7211b…0ce8 with sibling full-ID copy controls; DOM has zero nested buttons. Real clipboard and error-path interaction tests remain deferred."
    },
    {
      "name": "conflict-preview-initial-before",
      "command": "CUA open initial custom ConflictResolution preview; inspect logs, screenshot and inert ancestors; load copied source components.",
      "result": "fail",
      "failures": 3,
      "note": "Initial custom preview used nonexistent commit.change instead of the owned identity field; corrected. Its surface was inside Main, making the visible layer inert; moved it into a catalog-only root sibling surface slot. User rejected the approximate layout and explicitly requested copying source. Copied surface initially retained one renamed sibling icon import path; corrected. Superseded custom overlay screenshot is not parity evidence. No production file changed."
    },
    {
      "name": "copied-conflict-and-operation-actions",
      "command": "Read/copy jj-store StoreConflictSurface/Body/Text/HeaderActions, sidebar toggle, repository file tree/CSS and menu context; inspect public Design Core AppShell/ConfirmDialog/MergeEditor APIs; jj --no-pager op revert --help; targeted prettier; CUA ConflictResolution open settings/Escape, accept Left, Stage merged file, Preview, Back, Close and reopen; CUA Revert selected operation.",
      "result": "pass",
      "failures": 0,
      "note": "Catalog now maintains copied source header/browser/editor composition, Files/mode controls, 15rem browser, Delete path, Stage merged file, Preview, Left/Resolved/Right and settings. Extra custom context/footer removed. Surface is outside inert Main; measured owned hosts/public slots retain full-height sizing without dependency-internal CSS. At viewport1314x988 the page also measures1314x988, body837px and editor821px. Escape closes the settings menu while retaining the surface. Local accepted Command+P content stages, previews and survives close/reopen; native Apply stays disabled and native conflict flag is unchanged. Source op revert is an inverse in a new operation, not restore. Revert dialog shows exact selected operation/parent context and disabled native confirmation. Root Revert is disabled. Git branch icon replaces changed-revision arrows. Screenshots under .local/reusable-conversations: storybook-revert-operation-review.png and storybook-copied-conflict-resolution-review.png. No real mutation, dependency edit, test, baseline update or parity approval."
    },
    {
      "name": "short-message-divider-and-file-icons",
      "command": "CUA ConflictResolution selected short Grace row: inspect action/comparison geometry, focus restoration and file title; inspect Op Log file header. Format ReviewRevisionActions/Files/Revisions and ReviewFileTitle plus direct consumers.",
      "result": "pass",
      "failures": 0,
      "note": "No-body comparison margin no longer overlaps the action divider: action bottom347px, comparison host top347px, host padding8px and bottom border1px. Close returns focus to Resolve conflicts. Shared compact FileText icon precedes the filename in main JJ, evolution diff and operation file headers. Current JJ and Op headers are manually visible; evolution shares the same header component. Screenshot storybook-short-message-action-divider-review.png. Long Markdown disclosure retains its earlier manual evidence."
    },
    {
      "name": "empty-comparison-rows-hidden",
      "command": "Format ReviewRevisions/ReviewOperationFiles and add EvolutionWithoutComparison story; CUA select initialize repo root operation, open EvolutionWithoutComparison, inspect comparison rows, close Evo Log.",
      "result": "pass",
      "failures": 0,
      "note": "Root operation keeps Inspect and disabled Revisions/Revert but omits No file comparison for the root operation. Root evolution shows Start the vault metadata without No comparison is available for this version and has zero revision-files hosts. Closing Evo retains Start the vault and the exact ab..ab operation pin. No guessed comparison or native support is added. Screenshot storybook-evolution-no-comparison-review.png."
    },
    {
      "name": "final-catalog-bookkeeping-and-freeze",
      "command": "pnpm exec prettier --write changed catalog/docs files and jj-store maintenance pages; pnpm progress:generate; pnpm check:progress; pnpm spec:validate; Python SHA-256 freeze and authored-file-size inventory. Final formatting/document consumers rerun after recording results.",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes33 tasks/115 evidence records; specification passes6 validators/132 chapters/94 requirements. All332 frozen src hashes match with zero changed/new source files. Review code stays below300 physical lines and canonical continuation/evidence below400 lines/32768 bytes. Source copies and Apache-2.0 attribution are recorded in docs/provenance.json. User explicitly requested saving the copy-first jj-store preference; one authorized memory extension note was added outside repositories. Product type/tests/builds/axe/native/provider qualification, native apply, commits, publication, restarts and baselines were not performed. NOTES-05I remains solely Active; NOTES-07 waits."
    },
    {
      "name": "final-format-followup",
      "command": "pnpm exec prettier --check catalog/support/repository/review catalog/plugins/repository/ParityReview.stories.ts catalog/COVERAGE.md spec/src/current/repository-review.md spec/src/history/E-REPO-013.md docs/provenance.json; format review-evolution-comparison.ts and rerun.",
      "result": "fail",
      "failures": 1,
      "note": "Final formatting finds one existing catalog comparison helper formatting discrepancy. Apply formatter only, then rerun formatting/document consumers. Progress/specification pass separately; product checks remain deferred."
    }
  ],
  "remaining": [
    "User visual confirmation and deferred type, renderer, Storybook interaction/accessibility/build qualification.",
    "New production adoption remains frozen; NOTES-05I stays solely Active and NOTES-07 waits.",
    "Native Evolog lookup/paging/recovery and rebase-aligned or combined-predecessor inter-diff; fixture-only inspection does not qualify these cases.",
    "Native workspace-aware queries, operation revert and conflict descriptors/term resolution/uploads/atomic guarded apply; current actions are catalog-only drafts and previews."
  ],
  "contractReview": "LD-REPO-004 catalog-only preview adds clearer column controls and a measured long-message disclosure. Body preview uses native CSS overflow/mask and a public labelled Design Core Button with aria-controls/expanded; ResizeObserver is disposed and new descriptions reset expansion. Semantic foreground/background tokens keep both appearances distinct. LD-REPO-002 native admission, full identities, pins and transport are unchanged. No shipping source change or public contract extension. LD-REPO-004 catalog operation details now remove the separate native Info disclosure and conditionally display recorded attributes[args]. LD-REPO-002 native operation IDs, pins, full attribute map, readers and transport stay unchanged. Recorded strings remain plain display text. Existing labelled Inspect/main-column and parent selection authority remain. LD-REPO-004 catalog-only metadata now uses public TagList with flat semantic tags, independent accessible overflow and opaque neutral bookmark chips. Fixture conflict flags do not enable conflict editing; LD-REPO-002 native IDs, pins and reads are unchanged. The explicit selected-revision seed belongs solely to the catalog review. Catalog header snapshot selectors now reuse the bordered search/close header and compact operation option presentation. Exact operation pins/current markers and supplied metadata remain distinct from revision IDs; opening/filtering performs no new reads. Shipping registrations/source remain frozen. Documentation compaction changes no original gate, status or evidence selection. LD-REPO-004 catalog evolution now has a selected-row action, explicit predecessor graph and JJ-style expanded message/file inspection with an independent diff. Its supported same-parent synthetic comparisons mirror evolog inter-diff semantics; rebased/combined/unknown cases remain unavailable. No native identities are remapped and no native query, transport or shipping integration is added. The linked repository-review continuation keeps the native chapter below authored limits. Catalog workspace context, operation ID titles, Git-icon Revisions, operation-inverse Revert preview, source-copied conflict presentation, no-body divider and file icons extend LD-REPO-004 only. Native commands/reads/admission/identities remain frozen. Unavailable evolution comparisons and root operation file comparisons now omit their empty explanatory rows. No native support is inferred from a hidden row. Copy jj-store presentation first and adapt owned data/actions; recreate only when copying is impractical.",
  "milestoneReview": "The user explicitly requires Storybook-first review and defers tests until visual confirmation. E-REPO-013 qualifies no production or visual gate. M13.2 keeps its historical Done native gate; M13/M13.3 remain In progress. NOTES-05I is the sole Active umbrella and NOTES-07 waits.",
  "scope": "Catalog-only Svelte/CSS/fixture changes and their documentation. Automated product checks, Rust/native/provider/OS qualification and production adoption are deferred/out of scope for this review; documentation consumers are reported separately.",
  "fileInventoryNote": "Files reflect production promotion in E-REPO-015; original preview commands, results, gaps and frozen-source observations remain historical."
}
```
