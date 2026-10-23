# Shared-screen runtime failures and public controls

```json
{
  "id": "E-SHARED-005",
  "date": "2026-10-23",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M15.1"],
  "requirements": [
    "LD-CAT-001",
    "LD-AI-002",
    "LD-REPO-002",
    "LD-LIFE-001",
    "LD-POP-004"
  ],
  "versions": {
    "desktopParent": "d7a912a7",
    "baseline": "52516ae9",
    "sharedUi": "5a88a348",
    "designCore": "69f48e54",
    "notesApi": "e159faad",
    "plugins": "99806c68"
  },
  "contractReview": "Await rendered shell unmount before retiring workspace owners. Shared source UI catches rejected pointer opens and request responses; programmatic adapters preserve rejection. Consumer stories exercise public request cards, source inspectors, portalled menus, exact identities, draft retention and failure recovery.",
  "milestoneReview": "M15.1 remains In progress until the final current-cohort four-mode consumer matrix, production/static builds and cold native acceptance pass. Visual review and distribution remain separate.",
  "runs": [
    {
      "name": "consumer-first-whole-mode",
      "command": "pnpm test:storybook catalog/plugins/repository catalog/plugins/ai --reporter=verbose",
      "result": "fail",
      "failures": 26,
      "note": "Completed desktop/light only: 99 files, 414 pass/26 fail and 2 unhandled rejections. This is not a completed four-mode matrix. Old control assumptions and genuine shared response/Explorer failures are repaired separately."
    },
    {
      "name": "shell-unmount-before",
      "command": "node --import tsx --test --test-name-pattern='workspace teardown waits' tests/renderer/notes-dispose.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Workspace disposal began before the asynchronous shell unmount hook completed."
    },
    {
      "name": "shell-unmount-after",
      "command": "node --import tsx --test tests/renderer/notes-dispose.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All six owning cases pass after awaiting beforeDispose and a Svelte tick in NotesWorkspace."
    },
    {
      "name": "renderer-and-governance",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 405 cases pass."
    },
    {
      "name": "cold-original-failure-families",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/Admission.stories.ts catalog/plugins/ai/AppToolActivity.stories.ts catalog/plugins/ai/Cancellation.stories.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/ai/Conversation.stories.ts catalog/plugins/ai/ErrorsAndMentions.stories.ts catalog/plugins/ai/Plugin.stories.ts catalog/plugins/ai/ReplyErrors.stories.ts catalog/plugins/ai/ToolActivity.stories.ts catalog/plugins/ai/TurnRequests.stories.ts catalog/plugins/ai/VaultListingReview.stories.ts catalog/plugins/ai/shell/CommunityToolOptIn.stories.ts catalog/plugins/ai/shell/ImmediateInitializingComposer.stories.ts catalog/plugins/ai/shell/Initialization.stories.ts catalog/plugins/ai/shell/TranscriptAdoption.stories.ts catalog/plugins/repository/HistoryLayout.stories.ts catalog/plugins/repository/Loading.stories.ts catalog/plugins/repository/FileHistory.stories.ts --reporter=verbose",
      "result": "fail",
      "failures": 1,
      "note": "54 pass/1 fail with zero runtime errors. All original failures except Unavailable Admission are repaired, including delayed Explorer teardown and controlled response rejection. The remaining duplicate is a native first-send conversation transition, not a same-session portable refusal."
    },
    {
      "name": "native-capture-before",
      "command": "pnpm test:ai tests/ai/shared-agent-adapters.test.ts -t 'new native conversation'",
      "result": "fail",
      "failures": 1,
      "note": "The native host status did not recognize the first send\u2019s newly created conversation and exact captured error."
    },
    {
      "name": "native-capture-after",
      "command": "pnpm test:ai tests/ai/shared-agent-adapters.test.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 6 pass. Host recovery retains original native attempt and new conversation identity; foreign conversations and removed notices restore ordinary status."
    },
    {
      "name": "native-admission-four-modes",
      "command": "pnpm test:storybook catalog/plugins/ai/Admission.stories.ts -t 'Unavailable Admission'",
      "result": "pass",
      "failures": 0,
      "note": "1 pass/4 skipped in each of four modes; exactly one alert, exact authored draft retained and no native execution session admitted."
    },
    {
      "name": "types-current-cohort",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and zero warnings through the current verified public archives."
    }
  ],
  "files": [
    "MIGRATION.md",
    "catalog/plugins/ai/Admission.stories.ts",
    "catalog/plugins/ai/AppToolActivity.stories.ts",
    "catalog/plugins/ai/Cancellation.stories.ts",
    "catalog/plugins/ai/Conversation.stories.ts",
    "catalog/plugins/ai/ErrorsAndMentions.stories.ts",
    "catalog/plugins/ai/Plugin.stories.ts",
    "catalog/plugins/ai/ReplyErrors.stories.ts",
    "catalog/plugins/ai/ToolActivity.stories.ts",
    "catalog/plugins/ai/TurnRequests.stories.ts",
    "catalog/plugins/ai/shell/CommunityToolOptIn.stories.ts",
    "catalog/plugins/ai/shell/ImmediateInitializingComposer.stories.ts",
    "catalog/plugins/ai/shell/Initialization.stories.ts",
    "catalog/plugins/ai/shell/TranscriptAdoption.stories.ts",
    "catalog/plugins/repository/HistoryLayout.stories.ts",
    "catalog/plugins/repository/Loading.stories.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/shared-screen-integration.md",
    "spec/src/current/windows.md",
    "spec/src/history/E-SHARED-005.md",
    "src/components/ai/shared/DesktopAgentChat.svelte",
    "src/components/views/NotesWorkspace.svelte",
    "src/lib/ai/shared/action-recovery.ts",
    "src/lib/ai/shared/chat-presentation.ts",
    "src/lib/notes/notes-dispose.ts",
    "tests/ai/shared-agent-adapters.test.ts",
    "tests/renderer/notes-dispose.test.mjs"
  ],
  "remaining": [
    "Current public archive source qualification and exact consumer rechecks.",
    "Final complete consumer four-mode interaction/accessibility matrix and current production/static builds.",
    "Current-bundle cold visible history and hidden admission/import/history acceptance.",
    "Visual review; accepted historical audit/format findings remain separate."
  ]
}
```

The initial Desktop matrix found 26 functional failures and two runtime errors.
Most functional failures queried retired controls. Adaptations preserve their
behavioral gates: visible source capture, exact submitted request identities,
retained drafts, explicit grant scopes, session closure and bounded scrolling.
No assertion is loosened to hide a runtime or accessibility failure.

The Notes shell now unmounts before workspace/plugin owners retire. That valid
ordering fix alone did not eliminate the delayed Explorer rejection. Design Core
must handle rejected pointer actions in its own UI while the programmatic API
continues rejecting. Agent UI must return controlled response promises to cards.
Both source defects have independent reproductions and source evidence.

Preference-save failure injection uses the owning plugin's public saveData seam;
it no longer guesses an internal storage path. Tool detail tests assert output
before switching to the public raw-source control to inspect captured input.
Portalled permission menus await real pointer-event restoration after Escape.

Existing DOMPurify/Mermaid advisories and immutable E-AI-109 formatting drift
were reproduced on the baseline and explicitly accepted by the user as
separately tracked for this local migration. No new functional, runtime or
accessibility failure is waived. Historical evidence and visual baselines stay
unchanged.

Before/after catalogs remain isolated on 7480/7481. No default integration,
publication, installed-app replacement or ordinary profile changes are included.

The narrow/dark Transcript Adoption first run found two boot-time queries before
the fixture ready promise resolved. Awaiting that owned readiness before
querying the rendered panel preserves both tests and passes the exact two cases.
The other nine cases passed in that mode; all eleven passed in the first three
modes.

The portable controller correctly refuses to attribute provisional-session
failure metadata to another session. Desktop's first send admits its native
conversation before refusing execution; that identity mapping belongs to the
host. The native recovery adapter now supplies the same captured-status result
to both public composer status paths. It hides only the new exact error from
that original attempt in its resulting conversation. This is host identity
adaptation through the public status API, with no consumer selector or shared
component override. The temporary diagnostic effect is removed. The Admission
story additionally requires the exact authored draft to remain visible after
refusal.

Committed source inputs are Agent UI 5a88a348 and Design Core 69f48e54. Source
Agent UI has 632 affected interaction/accessibility passes, 213 unit passes,
zero check diagnostics, both builds/publint and all three spec lanes. Design
Core has 18 Explorer stories, 11 owning units, all 914 repository units and zero
check diagnostics with all three spec lanes. Their broader static/source lanes
were interrupted and are rerun; interrupted commands do not count as passes.
