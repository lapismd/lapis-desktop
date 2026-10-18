# Repository Command View pickers and full-height split diff

```json
{
  "id": "E-REPO-012",
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
    "svelte": "5.57.2"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/DiffLayout.stories.ts",
    "catalog/plugins/repository/Header.stories.ts",
    "catalog/plugins/repository/History.stories.ts",
    "catalog/plugins/repository/Operations.stories.ts",
    "catalog/support/repository/operations.ts",
    "docs/provenance.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-012.md",
    "src/components/repository/RepositoryDiff.svelte",
    "src/components/repository/RepositoryLogHeader.svelte",
    "src/components/repository/RepositoryOperationColumn.svelte",
    "src/components/repository/RepositoryOperationParentPicker.svelte",
    "src/components/repository/RepositoryOperationPinPicker.svelte",
    "src/components/repository/RepositoryOperationTarget.svelte",
    "src/components/repository/repository-operation-column.css",
    "src/lib/repository/operation-controller.ts",
    "src/lib/repository/operation-parent.ts",
    "src/lib/repository/operation-state.ts",
    "tests/renderer/repository-operation-picker.test.mjs",
    "vite.catalog.config.ts",
    "src/components/repository/RepositoryOperationFiles.svelte",
    "src/components/repository/RepositoryRevisionPicker.svelte",
    "catalog/support/repository/review/RepositoryOperationsReview.svelte",
    "catalog/support/repository/review/RepositoryReviewDemo.svelte",
    "src/components/repository/RepositoryRevisions.svelte",
    "src/components/repository/RepositoryRevisionFiles.svelte",
    "src/components/repository/RepositoryCommitPicker.svelte",
    "src/components/repository/RepositoryParentSummary.svelte",
    "src/components/repository/repository-review-identifiers.css",
    "catalog/support/repository/review/RepositoryHistoryReview.svelte",
    "src/components/repository/RepositoryComparisonBar.svelte",
    "src/components/repository/RepositoryComparisonTime.svelte",
    "src/components/repository/RepositoryOperationColumn.svelte",
    "src/components/repository/RepositoryOperationParentPicker.svelte",
    "src/components/repository/RepositoryDiffControls.svelte",
    "src/components/repository/RepositoryPickerSearch.svelte",
    "src/components/repository/RepositoryOperationOption.svelte",
    "src/components/repository/RepositoryGraph.svelte",
    "src/components/repository/RepositoryRevisionOption.svelte",
    "src/components/repository/RepositoryOperationRail.svelte",
    "src/components/repository/RepositoryAuthorAvatar.svelte",
    "catalog/support/repository/review/ReviewCommitTarget.svelte",
    "src/lib/repository/author.ts",
    "src/components/repository/RepositoryCommitMessage.svelte",
    "catalog/support/repository/review/review-fixture.ts",
    "catalog/plugins/repository/ParityReview.stories.ts"
  ],
  "result": "pending",
  "remaining": [
    "User visual parity confirmation for the Storybook-only selected-row action bar and revision Command View.",
    "Production adoption and all further automated validation are explicitly deferred by the user until confirmation."
  ],
  "runs": [
    {
      "name": "native-select-regression",
      "command": "pnpm test:storybook catalog/plugins/repository/Operations.stories.ts -t 'Merge Parent Choice'",
      "result": "fail",
      "failures": 1,
      "note": "Expected Command View BUTTON, received native SELECT before implementation. operation-picker-before.log."
    },
    {
      "name": "initial-command-adoption",
      "command": "pnpm test:storybook catalog/plugins/repository/Operations.stories.ts -t 'Merge Parent Choice'",
      "result": "pass",
      "failures": 0,
      "note": "Initial replacement passes all four width/theme configurations. Later fixture/recovery assertions require fresh final qualification; this result does not cover the final source. operation-picker-after.log."
    },
    {
      "name": "recovery-transition-regression",
      "command": "pnpm test:storybook catalog/plugins/repository/Operations.stories.ts -t 'Merge Parent Choice|Parent Metadata Failure And Recovery'",
      "result": "fail",
      "failures": 1,
      "note": "Recovery test observes the new option before Popover re-entry transition becomes visible. Retain visibility assertion and await its state with waitFor, plus retry readiness. Product metadata/selection remains correct. operation-picker-focused-final.log."
    },
    {
      "name": "focused-pinned-reader",
      "command": "node --test tests/renderer/repository-operation-picker.test.mjs tests/renderer/repository-operations.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "12 cases pass including exact parent candidates/cache, pinned bounded graph reads, stale selection/comparison/pin/close, retry preservation, substituted pins, repeated cursors and work/card limits. operation-picker-node.log."
    },
    {
      "name": "final-focused-command-picker",
      "command": "pnpm test:storybook catalog/plugins/repository/Operations.stories.ts -t 'Merge Parent Choice|Parent Metadata Failure And Recovery'",
      "result": "pass",
      "failures": 0,
      "note": "Final two scenarios pass all four width/theme configurations: eight interaction/axe checks. Rich loaded/unloaded operation metadata, search/empty query, keyboard selection and full native ID binding, explicit merge selection, retained comparison and App toast/explicit recovery. Visibility assertion retained and awaited across Popover transition. operation-picker-focused-2.log."
    },
    {
      "name": "renderer-checks",
      "command": "pnpm check:types\npnpm check:architecture\npnpm check:app-ownership\nnode --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Strict types 0 errors/0 warnings, both source audits pass, and all 246 renderer/governance cases pass. Final types repeated on unchanged final UI. operation-picker-{types-final,architecture,ownership,renderer}.log."
    },
    {
      "name": "live-preview",
      "command": "CUA inspect running port7490 JJ and Op Log parent controls; open public Command View popovers and save screenshot.",
      "result": "pass",
      "failures": 0,
      "note": "Original History tab8 already uses JJ commit-card Command View from E-REPO-011. Two-tab story9 now visibly renders operation-parent Command View, author avatar, user/host/time, exact OP ID preview and selected file diff. Managed7490PID92784 verified before work. Screenshot .local/reusable-conversations/operation-parent-picker-review.png; original History/comparison/source tabs retained. Browser proof is separate from native service and visual approval."
    },
    {
      "name": "catalog-rescope-after-user-request",
      "command": "pnpm build; pnpm build-storybook; pnpm test:storybook (interrupted); verify exact Vitest22432 command/cwd and terminate only that catalog run.",
      "result": "fail",
      "failures": 0,
      "note": "Renderer31.74s and static Storybook46.44s pass with existing PURE/chunk advisories. User adds header Command View while complete catalog is in its first configuration. Stop only exact owned test process22432 after OS command/cwd verification; parent exits143. No complete catalog pass or assertion failure is claimed. Final combined source requires fresh builds/catalog. operation-picker-{build,static,catalog}.log."
    },
    {
      "name": "header-native-select-regression",
      "command": "pnpm test:storybook catalog/plugins/repository/Header.stories.ts -t 'Operation Snapshot Command Picker'",
      "result": "fail",
      "failures": 1,
      "note": "Expected Command View BUTTON, received native SELECT. Exact failing boundary precedes header replacement. operation-pin-before.log."
    },
    {
      "name": "first-header-cold-import",
      "command": "pnpm test:storybook catalog/plugins/repository/Header.stories.ts -t 'Operation Snapshot Command Picker'",
      "result": "fail",
      "failures": 1,
      "note": "New source-style circle-check icon is discovered by Vite during test import; dependency optimization reloads the module and fails one suite before any test. Pin the used icon in the existing optimizeDeps.include list. Later warm five-case Header run passes20 checks, but final source/config requires a cold repeat. operation-pin-{after,focused}.log."
    },
    {
      "name": "combined-cold-preview",
      "command": "pnpm storybook:restart -- --port 7490",
      "result": "pass",
      "failures": 0,
      "note": "Managed restart replaces only verified review PID92784 with25431 on7490. Actual UI is cold after the include change; native services and source fixtures are preserved. operation-pin-preview-restart.log."
    },
    {
      "name": "combined-parent-header-cold",
      "command": "pnpm test:storybook catalog/plugins/repository/Header.stories.ts catalog/plugins/repository/Operations.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All15 cases pass in four configurations:60 cold interaction/axe checks after explicit icon preoptimization. Final UI source has not yet included requested diff-height fix; combined final catalog follows. operation-picker-combined-focused.log."
    },
    {
      "name": "shared-fill-investigation",
      "command": "Inspect installed/public FileDiff, ScrollArea and ColumnCanvas Body contracts; temporary source native/styled fill regression; jj restore only the two investigation files in Design Core.",
      "result": "pass",
      "failures": 0,
      "note": "An initial name filter skips all4 tests and is not proof. Running all4 temporary source cases passes on unchanged production. Existing shared body already supports bounded percentage sizing. Restore only owned temporary source story/spec edits; Design Core working copy is clean on b9477996. No source package change, archive, dependency override or public extension is needed. Notes wrapper owns the break."
    },
    {
      "name": "split-diff-height-regression",
      "command": "pnpm test:storybook catalog/plugins/repository/DiffLayout.stories.ts",
      "result": "fail",
      "failures": 2,
      "note": "History diff leaves481px bottom gap; operation diff is40px high. Both geometry regressions precede wrapper changes. Final tests retain full column/pane equality, wrap and operation collapse/unified-return assertions. diff-fill-before.log."
    },
    {
      "name": "user-review-first-deferral",
      "command": "Stop owned final verification pipeline29211 and its observed descendants after exact OS command/cwd verification; continue catalog-only preview work.",
      "result": "fail",
      "failures": 0,
      "note": "The user explicitly switches to Storybook-first review and defers tests until visual confirmation. Stop only exact owned pipeline29211 and descendants30232/30236/30252/30258. Strict type/audit/renderer steps had passed; final renderer build is interrupted during chunk rendering and static/full catalog do not run. No complete final pass is claimed. New actionbar/revision-picker prototype lives only under catalog/support/repository/review and has no play/test assertions. Production source is frozen at production-freeze-review.json. Earlier focused results remain distinct from current unqualified prototype."
    },
    {
      "name": "storybook-only-actionbar-review",
      "command": "CUA open desktop-repository-parity-review--selected-operation-actions; manually display selected-row icon toolbar, revision Command View cards and full-height split diff.",
      "result": "pass",
      "failures": 0,
      "note": "Review-only composition in a real disposable Notes App opens on7490, browser tab11. The selected operation has icon-only Inspect/Changed revision actions; revision Command View shows Ada/Grace fixture cards with Git/JJ IDs, time/tags and search. A missing commits prop in the initial catalog copy is corrected manually; no automated tests are run after deferral. Screenshot .local/reusable-conversations/storybook-only-op-actions-review.png. New toolbar/picker remains catalog-only. Source-file hash inventory confirms no src changes after the review-only freeze. This is manual preview evidence, not interaction/axe/native/visual approval."
    },
    {
      "name": "storybook-user-requested-compact-review",
      "command": "pnpm exec prettier --write catalog/support/repository/review/{ReviewOperationFiles,ReviewRevisionPicker,RepositoryOperationsReview,RepositoryReviewDemo,ReviewRevisions,ReviewRevisionFiles,ReviewCommitPicker,ReviewParentSummary}.svelte; CUA reload selected-operation-actions, switch JJ/Op review tabs and open the operation menu; compare src SHA-256 inventory with production-freeze-review.json.",
      "result": "pass",
      "failures": 0,
      "note": "Manual preview only; no automated tests or qualification. Full-width muted strip uses outline xs Inspect/Revisions controls and a trailing menu of at least12rem. Copy operation ID renders on one line. JJ parent trigger uses a20px avatar, single-line message/time and independent Git/JJ copy controls; popup retains rich cards. Fresh page reload starts both sidebars closed through public getLayout/changeLayout widths without manual toggles. Catalog identifier skin uses inherited foreground/primary7% backgrounds. Screenshots .local/reusable-conversations/storybook-compact-parent-review.png and storybook-labelled-actions-menu-review.png. Production source hashes unchanged since review freeze. Visual approval and deferred automated/document lanes remain pending."
    },
    {
      "name": "storybook-comparison-strips-revision-header",
      "command": "pnpm exec prettier --write catalog/support/repository/review/Review{RevisionPicker,ComparisonBar,ComparisonTime,ParentSummary,CommitPicker,OperationColumn,OperationParentPicker,OperationFiles}.svelte catalog/support/repository/review/RepositoryOperationsReview.svelte catalog/COVERAGE.md docs/provenance.json spec/src/current/repository.md spec/src/history/E-REPO-012.md; CUA manual preview and read-only src hash inventory.",
      "result": "pass",
      "failures": 0,
      "note": "Manual preview and formatting only. Shared catalog strip reads Comparison parent, then avatar/message and identity copy controls within the outlined selector label; relative time sits on the far right. JJ copy IDs remain full native Git/JJ values; operation IDs stay operations. Independent sibling controls avoid nested buttons. Revisions removes visible title/repeated group heading, places input and close in one compact row and uses a full-width header border per latest user direction. Public Command View border token is scoped to the input row; footer stays intact. Kebab hover borrows source accent/muted tokens. New operation column/picker copies are catalog-only. Shipping source remains unchanged; no automated tests, native acceptance, production adoption or visual approval claimed. Saved screenshots .local/reusable-conversations/storybook-jj-comparison-selector-review.png, storybook-op-comparison-menu-review.png and storybook-revisions-compact-header-review.png. Latest full-width header divider supersedes the earlier border-removal request."
    },
    {
      "name": "storybook-comparison-selector-spacing",
      "command": "pnpm exec prettier --write catalog/support/repository/review/ReviewComparisonBar.svelte catalog/support/repository/review/ReviewCommitPicker.svelte catalog/support/repository/review/ReviewOperationParentPicker.svelte catalog/support/repository/review/ReviewComparisonTime.svelte; CUA inspect both review tabs; read-only production hash inventory.",
      "result": "pass",
      "failures": 0,
      "note": "Manual visual inspection only. Comparison selector minimum height increases28px to36px with6px block padding around identity controls; comparison strip block padding decreases8px to4px. Both JJ/Op relative times now live within the selected label alongside IDs, vertically centred with the other label contents. Screenshots .local/reusable-conversations/storybook-comparison-spacing-{jj,op}-review.png. Production hashes unchanged. Automated/type/document checks, visual approval and production adoption remain deferred; sole Active NOTES-05I and all milestone gates unchanged."
    },
    {
      "name": "storybook-identifiers-compact-controls-no-parent",
      "command": "pnpm exec prettier --write catalog/support/repository/review/review-identifiers.css catalog/support/repository/review/ReviewDiffControls.svelte catalog/support/repository/review/ReviewHistoryDiff.svelte catalog/support/repository/review/ReviewOperationColumn.svelte catalog/support/repository/review/ReviewRevisionFiles.svelte; CUA compare source/review computed typography and geometry, inspect root states in isolated hidden review tab; read-only production hash inventory.",
      "result": "pass",
      "failures": 0,
      "note": "Manual inspection only. Live jj-store chips use Source Code Pro9px/600 and IDs11px/500; preview incorrectly used DM Sans chips. Preview now uses matching Source Code Pro family/sizes/weights, centred16px text cells and centred half-button content. Diff hosts measure22px high with all icons12px; both review views use the same catalog component. Initial group icons stayed16px due public group specificity; corrected via owned classes, then all three measured12px. A transient disabled no-parent strip was superseded by explicit user direction to hide it entirely. Both root revision and operation now omit comparison strips; the temporary empty component was removed. Manual tab changes collided with user interaction once; an isolated hidden preview avoided further interference. One hidden-tab locator attempt encountered an inactive JJ view; selected the visible JJ tab before completing inspection. Screenshots storybook-git-jj-typography-review.png, storybook-compact-diff-actions-review.png, storybook-no-comparison-bar-review.png and storybook-no-op-comparison-bar-review.png under .local/reusable-conversations. Prior empty-row screenshots are superseded. No automated tests/type/axe/native gates or visual approval claimed; shipping source remains frozen."
    },
    {
      "name": "storybook-operation-parent-popover-parity",
      "command": "pnpm exec prettier --write catalog/support/repository/review/ReviewPickerSearch.svelte catalog/support/repository/review/ReviewRevisionPicker.svelte catalog/support/repository/review/ReviewOperationParentPicker.svelte; CUA inspect operation-parent popup; read-only src SHA-256 inventory.",
      "result": "pass",
      "failures": 0,
      "note": "Catalog-only shared search/close header now serves both Revisions and Choose operation parent. No visible title or repeated group heading; search sits at the top with close in the same row, compact padding and a full-width divider. Outer popover padding/gap are zero. Dialog labels, parent-only data, full native OP IDs, rich operation cards, search binding/autofocus and footer/retry content remain. Manual preview screenshot .local/reusable-conversations/storybook-operation-parent-compact-header-review.png; no automated tests or visual approval. Shipping src hashes remain frozen; original milestones unchanged."
    },
    {
      "name": "storybook-jj-comparison-single-divider",
      "command": "pnpm exec prettier --write catalog/support/repository/review/ReviewComparisonBar.svelte; CUA inspect row/comparison border styles and screenshot in isolated JJ-first comparison preview.",
      "result": "pass",
      "failures": 0,
      "note": "Before: revision row bottom1px plus adjacent inset comparison top1px made a double divider. After: only inset JJ comparison top border is0px; row bottom remains1px and comparison bottom remains1px. Manual visual/DOM inspection in hidden tab14 confirms the single seam; screenshot .local/reusable-conversations/storybook-jj-single-comparison-border-review.png. LD-REPO-004 presentation contract unchanged: only redundant border removed, without changing pin, selection, identity or shipping registration. M13/M33 statuses unchanged; NOTES-05I stays solely Active. No automated tests/type/axe/native checks, production adoption or visual approval."
    },
    {
      "name": "storybook-operation-parent-single-row",
      "command": "pnpm exec prettier --write catalog/support/repository/review/ReviewOperationOption.svelte catalog/support/repository/review/ReviewOperationParentPicker.svelte catalog/support/repository/review/ReviewOperationColumn.svelte; CUA inspect single-row option and read-only geometry; src hash inventory comparison.",
      "result": "pass",
      "failures": 0,
      "note": "Manual presentation inspection only. Each option uses small author avatar/title, one source-style OP ID copy control and relative time at the end. Rendered content height25.2px; title/control/time centres agree to0.01px. Visible title truncates without wrapping. Normal full-ID footer is removed; missing metadata retains explicit retry footer. Full128-hex OP IDs remain copy values, search terms and accessible descriptions. Copy stops pointer/click and activation-key propagation, retains stale-feedback fences, and reports errors via injected review feedback; copying, failure toast and keyboard activation have NOT been exercised because tests remain deferred. No clipboard mutation was performed. Screenshot .local/reusable-conversations/storybook-operation-parent-single-row-review.png. Existing LD-REPO-002/native selection contracts and shipping source remain unchanged; LD-REPO-004 preview proposal only. Sole Active NOTES-05I and original milestone/visual gates unchanged."
    },
    {
      "name": "storybook-revision-single-row-design-core-authors",
      "command": "Read public Design Core Avatar/AuthorCard contracts and jj-store Git-author/Gravatar source. pnpm exec prettier --write catalog/support/repository/review/ReviewAuthorAvatar.svelte catalog/support/repository/review/review-author.ts catalog/support/repository/review/ReviewGraph.svelte catalog/support/repository/review/ReviewCommitTarget.svelte catalog/support/repository/review/ReviewOperationRail.svelte catalog/support/repository/review/ReviewParentSummary.svelte catalog/support/repository/review/ReviewRevisionOption.svelte catalog/support/repository/review/ReviewRevisionPicker.svelte catalog/support/repository/review/ReviewOperationFiles.svelte catalog/support/repository/review/ReviewOperationColumn.svelte catalog/support/repository/review/ReviewOperationOption.svelte catalog/support/repository/review/ReviewOperationParentPicker.svelte catalog/support/repository/review/ReviewCommitPicker.svelte catalog/support/repository/review/ReviewRevisions.svelte catalog/support/repository/review/RepositoryOperationsReview.svelte catalog/support/repository/review/review-identifiers.css. Then pnpm exec prettier --write catalog/support/repository/review/ReviewAuthorAvatar.svelte catalog/COVERAGE.md docs/provenance.json spec/src/current/repository.md spec/src/current/progress/milestones.md spec/src/history/E-REPO-012.md. In jj-store: pnpm exec prettier --write docs/maintenance/reusable-agent-workflows-progress.md docs/maintenance/repository-view-parity-review.md. CUA manual presentation inspection and Python read-only src SHA-256 inventory comparison.",
      "result": "pass",
      "failures": 0,
      "note": "Manual presentation review only. Before: Revisions used multiline author/time metadata with vertically stacked GIT/JJ badges; graph and compact avatars were custom initials with no profile details. After: title/small avatar, native Git/JJ copy controls and end time share25.2px content rows; vertical centres agree within0.01px. Review-only portal skin retains Source Code Pro chips/IDs. New catalog graph/rail/target compositions use public Design Core AuthorCard (which composes Avatar) with no nested row-selection buttons. Parent label profile trigger explicitly restores pointer events. Profile cards show name and email or operation user@host; opening them manually leaves selection intact. Supplied author images take priority; normalized email is SHA-256 hashed via WebCrypto for Gravatar d=404/s=80, with stale-request fencing and shared name fallback on missing/failed images. Synthetic .test fixture emails have no Gravatar, so initials fallback is visible; a successful remote image, pointer hover timing, keyboard/copy/failure toast and axe interactions remain unqualified. Source uses interaction=hover and its own shared open/close delays; manual details were opened by click, not pointer hover. No automated tests/type/axe/native/document qualification or clipboard mutation. Screenshots .local/reusable-conversations/storybook-revision-single-row-author-review.png and storybook-design-core-author-details-review.png. Production freeze remains intact; sole Active NOTES-05I and all original native/managed/visual gates unchanged. A stale AX click in the disposable tab briefly opened the wrong detail control; a fresh state read and reload restored the fixture, followed by semantic-name selection. Manual Revisions author activation keeps the picker open and the chosen comparison intact while its highlighted row/tag preview follows Grace. Combined screenshot storybook-revision-author-details-review.png is also retained."
    },
    {
      "name": "storybook-comparison-border-and-multiline-markdown",
      "command": "pnpm exec prettier --write catalog/support/repository/review/ReviewComparisonBar.svelte catalog/support/repository/review/review-fixture.ts catalog/support/repository/review/ReviewCommitMessage.svelte catalog/support/repository/review/ReviewRevisions.svelte catalog/plugins/repository/ParityReview.stories.ts; CUA open desktop-repository-parity-review--multiline-commit-message in a disposable hidden tab, inspect its AX/rendered DOM and screenshot; Python read-only src SHA-256 freeze comparison. Documentation formatting: pnpm exec prettier --write catalog/COVERAGE.md spec/src/current/repository.md spec/src/history/E-REPO-012.md; in jj-store, pnpm exec prettier --write docs/maintenance/repository-view-parity-review.md docs/maintenance/reusable-agent-workflows-progress.md.",
      "result": "pass",
      "failures": 0,
      "note": "Manual presentation inspection only. Before, shared Comparison parent used top/bottom borders and commitRows retained only the subject; changing a description alone would leave the body hidden. After, only the shared strip top border remains (inset JJ top stays0); computed bottom border is0px on both instances. The review fixture retains one multiline description in graph, exact commit-detail and changed-revision metadata; commitDetail creates consistent object metadata. Expanded JJ rows render the message body through public Design Core MarkdownContent with compact/fullWidth tokens, outside selection buttons. Subject and command options remain compact. Rendered DOM contains the two intended bold spans, italic readable-context span, two list items, blockquote and fenced shell code. Screenshot .local/reusable-conversations/storybook-multiline-markdown-commit-review.png. A dedicated review story opens on JJ Log; the existing two-tab preview shares the same fixture. Shipping source remains frozen; no automated tests/type/axe/native/document qualification, clipboard changes, milestone completion, production adoption or visual approval. NOTES-05I remains solely Active; NOTES-07 waits."
    },
    {
      "name": "storybook-parent-author-row",
      "command": "pnpm exec prettier --write catalog/support/repository/review/ReviewOperationRail.svelte; CUA inspect parent placement, focus tooltip with Shift, read geometry and save screenshot; Python src SHA-256 freeze comparison.",
      "result": "pass",
      "failures": 0,
      "note": "Manual preview: parent is on the author row, right edge16px inside the rail and vertical centres within0.01px. CornerLeftUp replaces History; only short ID is visible. Public Tooltip shows Parent operation on focus; aria-label retains full native ID. Navigation callback unchanged (LD-REPO-002/004). Screenshot .local/reusable-conversations/storybook-parent-author-row-review.png. Automated tests, hover timing, merge/narrow qualification and production adoption deferred. No milestone/visual gate completed; NOTES-05I solely Active. Doc patch context mismatch was re-read/reapplied."
    }
  ],
  "contractReview": "LD-REPO-004 now covers source-style public Command View/Popover for operation parent comparisons, with native operation metadata and exact 128-hex IDs. Recorded merge choices remain explicit. LD-REPO-002 native admission/pin/lifetime and wire/storage/receipt formats stay unchanged; no request allowlist extension. Missing cards reuse the existing qualified bounded graph profile. Copied composition is attributed; no upstream dependency defect or patch. The user-requested compact JJ/Op Log header operation-snapshot picker now ports StoreWorkspacePicker composition without changing operation versus workspace semantics. Opening/searching is local presentation only; existing explicit pin selection remains authoritative. LD-REPO-004 now requires split diffs to fill bounded History/Op Log hosts and both panes; unified operation previews retain content sizing. This uses application-owned CSS hosts and the existing unmodified public FileDiff percentage-height contract. LD-REPO-004 catalog-only proposal now uses single-row revision options and Design Core Avatar/AuthorCard with optional display-only Gravatar enrichment. Native identity, persistence, pin and receipt contracts are unchanged. No dependency patch, source alias or public API change. LD-REPO-004 catalog-only comparison strips now omit bottom borders, and expanded JJ commit bodies reuse public safe MarkdownContent. Full description metadata remains intact; graph and picker subjects stay compact. Native/storage/receipt/public contracts stay unchanged.",
  "milestoneReview": "NOTES-05I2B/05I2C and05I3B qualify operation parent/header Command View and split-diff sizing after validation. Changed-revision and ambiguous before/after selectors, native queries, full statistics, row/state and whole-view/visual approval remain open. M13.2 keeps its original Done native gate; M13/M13.3 remain In progress. NOTES-05I remains solely Active and NOTES-07 managed chat/restart waits. Latest user direction holds new production adoption and automated tests for explicit Storybook parity confirmation. The prototype is review-only and completes no milestone or visual baseline gate. Latest catalog-only action strip, compact JJ parent trigger, menu width, identifier skin and closed-sidebar startup complete no production or visual gate; NOTES-05I remains solely Active. Latest revision/author preview completes no implementation, production-adoption or visual gate; further automated verification remains deferred by the user.",
  "scope": "UI-only operation parent/header picker, pinned graph metadata, split-diff host sizing and catalog preoptimization. Shared helper, header, fixture, CSS and config require full renderer/governance, cold full catalog interaction/axe, strict types/audits, renderer/static builds and document consumers. No native/AI/storage/receipt contract or runtime input changes; Rust, provider, OS acceptance and AI suites are out of scope. No baseline update, publication or native service replacement.",
  "fileInventoryNote": "Files reflect production promotion in E-REPO-015; original preview commands, results, gaps and frozen-source observations remain historical."
}
```
