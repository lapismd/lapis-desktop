# Editable conflict result and clean catalog scenes

```json
{
  "id": "E-CATALOG-004",
  "tasks": ["M8.5"],
  "requirements": [
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-FILE-008",
    "LD-GOV-002",
    "LD-GOV-003"
  ],
  "revision": "enclosing Jujutsu change",
  "versions": {
    "desktop": "0.1.0",
    "design-core": "0.5.1 fa174d7e candidate unchanged",
    "apiSource": "a1b2abd0319b2017f167f55b4946b08baf59d68d",
    "apiSha256": "7275ca7e7b2dc7ecb4e139e2737369f740bf036c49c74f9313cb4ce36bb5f50c"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/ai/Catalog.stories.ts",
    "catalog/plugins/ai/CommandsAndResults.stories.ts",
    "catalog/plugins/ai/History.stories.ts",
    "catalog/plugins/ai/Lifetime.stories.ts",
    "catalog/plugins/ai/Models.stories.ts",
    "catalog/plugins/ai/PanelLifetime.stories.ts",
    "catalog/plugins/ai/Settings.stories.ts",
    "catalog/plugins/ai/UserCommands.stories.ts",
    "catalog/plugins/desktop/FileConflicts.stories.ts",
    "catalog/plugins/terminal/Terminal.stories.ts",
    "catalog/support/ai/AiChatDemo.svelte",
    "catalog/support/ai/CommandRefreshDemo.svelte",
    "catalog/support/ai/PanelDemo.svelte",
    "catalog/support/ai/SettingsDemo.svelte",
    "catalog/support/ai/panel-interactions.ts",
    "catalog/support/ai/review.ts",
    "catalog/support/ai/workspace/AiWorkspaceDemo.svelte",
    "catalog/support/ai/workspace/InitializingChatDemo.svelte",
    "catalog/support/ai/workspace/PendingPanelDemo.svelte",
    "catalog/support/terminal/TerminalDemo.svelte",
    "catalog/support/terminal/review.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-004.md",
    "spec/src/history/index.md",
    "src/components/files/ConflictReview.svelte",
    "src/components/files/ConflictReviewControls.svelte",
    "src/components/files/conflict-review-state.svelte.ts",
    "src/components/files/conflict-review-view.ts",
    "src/components/files/register-conflict-reviews.ts"
  ],
  "result": "pending",
  "remaining": [
    "User-deferred API/source, catalog interaction/accessibility and full consumer qualification.",
    "Native conflict acceptance must exercise the editable result, original/retired writer reset, stale decisions and guarded teardown; native builds remain deferred.",
    "Run all AI fixture-consuming stories and both viewports/themes after test deferral is lifted; current preview observations are not aggregate qualification.",
    "Visual review remains pending and no baseline is approved."
  ],
  "runs": [
    {
      "name": "before",
      "command": "User annotations: ModifiedOnDisk, ProblemsList, InputResizeAndScroll and AI catalog scenes",
      "result": "pending",
      "failures": 0,
      "note": "Four visual annotations plus the AI JSON report; no automated before count because suites remain explicitly deferred. Centre was read-only, frame retained its border/radius, resize fixture left a fixed height and AI fixtures exposed telemetry/controls."
    },
    {
      "name": "api-build",
      "command": "pnpm --filter @lapis-notes/api build",
      "result": "pass",
      "failures": 0,
      "note": "Public dist packaging, publint and packed declaration compilation pass. The captured resolveMerged method keeps current-object, owner lease, snapshot and conditional-write checks; test suites are not run."
    },
    {
      "name": "public-intake",
      "command": "pnpm pack --config.ignore-scripts=true; pnpm local:install",
      "result": "pass",
      "failures": 0,
      "note": "14 verified archives across 14 import routes; only the API archive changed. Portable tracked dependency files and the existing Design Core candidate are preserved."
    },
    {
      "name": "manual-merge",
      "command": "Cold pnpm storybook; open ModifiedOnDisk; edit centre; enable Wrap text; Save merged version",
      "result": "pass",
      "failures": 0,
      "note": "Edited centre and pressed wrap state observed. Save retires the review and clears Problems to zero through the actual memory-backed persistence owner. This is manual catalog evidence, not native or automated byte acceptance. EditedMergeResult authors an exact byte assertion for the deferred lane."
    },
    {
      "name": "manual-catalog",
      "command": "Preview AI Workspace lifecycle and Terminal InputResizeAndScroll",
      "result": "pass",
      "failures": 0,
      "note": "Manual previews show the AI workspace without fixture telemetry and Terminal filling the entire viewport after the resize story finishes. Source removes all AI fixture output/control DOM; private ports retain original actions/observations. Suites remain deferred."
    },
    {
      "name": "deferred-product-gates",
      "command": "API tests; all affected desktop/AI/Terminal stories; complete source/catalog interaction and axe; native build/acceptance",
      "result": "pending",
      "failures": 0,
      "note": "Not run under the standing review-only test deferral."
    },
    {
      "name": "preview-before-ready",
      "command": "Open the cold localhost Storybook preview",
      "result": "fail",
      "failures": 1,
      "note": "One connection refusal occurs before the new server listens. Confirmed server readiness precedes the successful manual previews; no product change or assertion suppression is used."
    },
    {
      "name": "static-governance",
      "command": "pnpm spec:validate; pnpm spec:first; pnpm check:progress; pnpm check:architecture; pnpm check:app-ownership; changed-file Prettier check",
      "result": "pass",
      "failures": 0,
      "note": "Desktop: 6 validators, 102 chapters, 93 requirements; spec-first maps 29 protected files to 5 canonical chapters; 33 tasks and 87 evidence records. Source boundaries, owned App audits and source API specification validation/spec-first pass. These checks are not the deferred functional/axe/native gates."
    }
  ],
  "milestoneReview": "M8.5 remains In progress. Editable-result presentation and fixture cleanup extend the review; no original source/catalog/native gate is declared complete. AI migration remains paused.",
  "contractReview": "Use public MergeEditor editing/header slots and frame tokens. Persistence stays in the source-owned captured writer; closing its view retains the staged result. AI observations/fault actions stay outside product DOM. No native permission, signing, publication, Deno or baseline changes."
}
```

The shared MergeEditor centre is editable. Accepting either side updates that
result; the explicit Save merged version action persists its exact text through
FileTextConflict.resolveMerged, without replacing the save pipeline. The
comparison retains the baseline seed, changed disk snapshot and original draft.
Refresh keeps the staged result, and closing/reopening a review retains it in
App-owned presentation state until resolution. Unreadable/leave/busy states
prevent edits and saving. Source whole-version APIs stay compatible.

Icon-only controls in the public header-centre slot toggle wrap, whitespace,
case and horizontal scroll sync. Accessible names and tooltips remain. Public
frame border/radius tokens remove the embedded comparison's outer frame; no
private Design Core selectors or upstream source changes are used.

Terminal resize now restores the prior height after two animation frames. Its
story retains input, resize, scroll and shutdown assertions and adds a full
viewport-height assertion. AI Settings, Catalog/History, initialization/pending
lifetime, models, user commands and chat fixtures move controls and telemetry to
an owned WeakMap review port. The workspace fixture removes its unused controls.
Original lifecycle/fixture observations and product assertions remain authored.
No fixture UI or JSON is rendered at the bottom of catalog scenes.

The API source record is
`lapis-notes-desktop-migration/spec/records/2026-10-17-edited-conflict-result.md`.
It describes failed post-write owner reset separately: the conflict remains,
while disk may already contain the user's explicit result and needs refresh.
Pending source/native qualification must cover that boundary. Logs and manual
preview images live under ignored `.local/qualification/catalog-review`.
