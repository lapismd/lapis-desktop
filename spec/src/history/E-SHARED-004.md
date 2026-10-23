# Shared-screen captured context and request recovery

```json
{
  "id": "E-SHARED-004",
  "date": "2026-10-23",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M15.1"],
  "requirements": ["LD-CAT-001", "LD-AI-002", "LD-REPO-002"],
  "versions": {
    "desktopParent": "04ce6d15",
    "baseline": "52516ae9",
    "sharedUi": "aa98c81a",
    "designCore": "81ada062",
    "notesApi": "e159faad",
    "plugins": "99806c68"
  },
  "contractReview": "Desktop retains source and runtime ownership. The host mention transform preserves Markdown leaf shape. Shared captured request results choose the read-only card without rewriting host text. Story assertions use public overlays and controls while retaining request, draft, session and scroll invariants.",
  "milestoneReview": "M15.1 remains In progress. Exact host-context regressions pass. Full consumer matrices, current builds and cold visible native acceptance remain separate gates; no original AI, distribution or visual gate is completed by these fixtures.",
  "runs": [
    {
      "name": "markdown-leaf-before",
      "command": "pnpm test:ai tests/ai/chat/agent-mention-links.test.ts -t 'preserves Markdown leaf shape'",
      "result": "fail",
      "failures": 1,
      "note": "1 failure/7 skipped: the host transform added children: undefined to a captured pathlink, causing mdast conversion to throw."
    },
    {
      "name": "markdown-leaf-after",
      "command": "pnpm test:ai tests/ai/chat/agent-mention-links.test.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 8 pass, retaining leaf shape, exact source positions, legacy tokens and captured agent identities. No dependency workaround was added."
    },
    {
      "name": "scroll-and-scope",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ChatScrollRecovery.stories.ts catalog/plugins/ai/shell/FollowScope.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 5 pass after 4 scroll failures with 8 runtime errors and one obsolete scope label. Both views retain live permission, held execution, session identities and drafts. Shared Vault root replaces the obsolete Vault option query."
    },
    {
      "name": "shared-native-request-source",
      "command": "pnpm check && pnpm test && pnpm build && pnpm spec:check; pnpm test:storybook catalog/AgentScreens.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Agent UI aa98c81a: exact unit 1 fail before; owning file 14 pass after; full units 211 pass/36 files; zero type diagnostics, formatting/architecture/fingerprints pass; both packages build/publint; 3 spec lanes; 32 complete screens x 4 modes = 128 interaction/accessibility passes. Verified public archives installed across 19 routes."
    }
  ],
  "files": [
    "MIGRATION.md",
    "catalog/plugins/ai/Addressing.stories.ts",
    "catalog/plugins/ai/ApprovalPolicy.stories.ts",
    "catalog/plugins/ai/ChatScrollRecovery.stories.ts",
    "catalog/plugins/ai/shell/FollowScope.stories.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/ai-imports.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/shared-screen-integration.md",
    "spec/src/history/E-SHARED-004.md",
    "src/components/ai/chat/transcript-agent-links.ts",
    "tests/ai/chat/agent-mention-links.test.ts",
    "tests/ai/conversations/session-imports.test.ts",
    "tests/desktop/repository-visible.test.mjs"
  ],
  "remaining": [
    "Full affected consumer four-mode matrix and current builds.",
    "Cold visible native acceptance of current UI and adapted public controls.",
    "Visual review; accepted historical formatting and audit findings remain separate."
  ]
}
```

The host Markdown hook introduced the invalid leaf property; PromptContext only
exposed it when captured handoff evidence included link nodes. The fix stays in
Desktop. The temporary diagnostic listener and captured-context logging are
removed. Design Core remains unchanged at its verified source revision.

Addressing uses portalled public suggestions and actual remove controls. Shared
permission outcomes start collapsed. Story adaptation retains host
serialization, exact recipient and native request identities rather than
reinstating old DOM.

Native history acceptance is adapted to public source/operation pickers,
icon-only layout controls and independent source tabs. Its strict native window,
dirty-source preservation, exact pin, restart and no-source-initialization gates
remain required. Earlier attempts stopped on occlusion; the current run passed
that check and exposed obsolete source/control queries. The adapted flow now
passes; the native bundle predates the newest UI fixes, so current-bundle native
qualification remains open.

The initial broad consumer run was superseded after 27 observed failures; it was
not a completed matrix. Intermediate exact results remain in E-SHARED-003. The
first whole AI rerun in this slice was cancelled during archive refresh and
cannot qualify the current cohort. A fresh run and full four-mode matrix follow.
The next desktop/light matrix exposed two duplicate-feedback failures; the
source fix is being qualified separately. No duplicate-alert assertion is
relaxed.

Native public controls: `node --test tests/desktop/repository-visible.test.mjs`
passes one cold visible case with strict native visibility, dirty-source bytes,
exact original source/pins, both diff layouts, restart and plain-folder
preservation. Earlier attempts exposed obsolete default-source, radio/icon
queries and closing an already-restored revision. The adapted test uses public
controls and retains restored selection.

The full AI lane found one failure and 741 passes: asynchronous import
preparation finished in reverse invocation order. The contract serializes writes
after validation. The test now releases both preparation orders
deterministically and checks each exact winner/duplicate result, identical
snapshots, one destination and unchanged entries. All 29 owning import cases
pass.

After source archive intake, Automatic Approval passes one case with three
skipped. The initial five-family run had 17 passes and one ambiguous text query;
the exact target now verifies the visible approved card and its state.

The current whole AI lane passes all 743 tests in 151 files after the controlled
import-order regression. Desktop type checking reports zero errors/warnings and
all four specification lanes pass. Broader consumer and Rust/format
qualification continue; the existing immutable formatting exception remains
explicit.

Existing DOMPurify/Mermaid advisories and immutable E-AI-109 formatting drift
were reproduced on the baseline. The user explicitly accepted tracking both
separately for this local migration. No new functional, runtime or accessibility
failure is waived. No historical evidence, visual baseline or security rule was
changed.

Before/after catalogs remain on 7480/7481, with matching story links in
`docs/shared-ui-migration.md`. Publication, default-workspace integration,
installed-app replacement and normal user profiles remain outside this slice.
