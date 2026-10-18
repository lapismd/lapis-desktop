# Stacked operation card and file diff

```json
{
  "id": "E-REPO-010",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-DESK-003",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-009"
  ],
  "revision": "enclosing Jujutsu change xxyrspzr",
  "versions": {
    "desktopBase": "d00a69b3",
    "jjStoreReference": "5b11966779de92a60876e619c30c5575cef011ac",
    "designCoreVersion": "0.5.1",
    "designCorePackedRevision": "c85c4aa6cf86fdc6b8edfcb4a4d1ed23e489ec16",
    "designCoreArchiveSha256": "8768360cb65fb3dfa760e548a5f57fa5f8c5ce737f7f111f88322e9fd590783e",
    "pnpm": "10.34.5",
    "node": "26.9.0",
    "platform": "macOS ARM64",
    "designCoreCommittedSource": "b947799617af21fcbcd52c8b2b48593badbecec6"
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/Comparison.stories.ts",
    "catalog/plugins/repository/OperationFiles.stories.ts",
    "catalog/plugins/repository/OperationLayout.stories.ts",
    "catalog/plugins/repository/Operations.stories.ts",
    "catalog/support/repository/operations.ts",
    "docs/provenance.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-010.md",
    "spec/src/history/index.md",
    "src/components/repository/RepositoryAuthorAvatar.svelte",
    "src/components/repository/RepositoryDiff.svelte",
    "src/components/repository/RepositoryOperationColumn.svelte",
    "src/components/repository/RepositoryOperationDetail.svelte",
    "src/components/repository/RepositoryOperationFiles.svelte",
    "src/components/repository/RepositoryOperationRail.svelte",
    "src/components/repository/RepositoryOperations.svelte",
    "src/components/repository/repository-operation-column.css",
    "src/lib/repository/log-canvas.ts",
    "src/lib/repository/operation-controller.ts",
    "src/lib/repository/operation-parent.ts",
    "tests/renderer/repository-operations.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "missing-card-regression",
      "command": "pnpm test:storybook catalog/plugins/repository/OperationLayout.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Initial desktop/light case fails because operation metadata and file diff occupy separate columns. operation-layout-before.log."
    },
    {
      "name": "intermediate-compilation",
      "command": "pnpm check:types\npnpm test:storybook catalog/plugins/repository/OperationLayout.stories.ts",
      "result": "fail",
      "failures": 6,
      "note": "First type attempt has six errors/nine warnings: state rune shadowing and unsupported story option. Later attempts find an accidental operation-snapshot type import; all corrected. Initial transformed-story compile produces no tests. Preserve operation-layout-types*.log and operation-layout-exact*.log; these are failed attempts, not acceptance."
    },
    {
      "name": "source-accessibility-regression",
      "command": "pnpm test:storybook catalog/plugins/repository/OperationLayout.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "RelativeTime triggers axe label-content-name-mismatch. Fixed in Design Core DC-SHA-062; no consumer override. Prepared public archive consumed through existing ignored overlay; pnpm local:install verifies 14 archives/14 routes. Source evidence is docs/evidence/relative-time-accessibility-2026-10-18.md."
    },
    {
      "name": "affected-family-and-merge-repair",
      "command": "pnpm test:storybook catalog/plugins/repository\npnpm test:storybook catalog/plugins/repository/Operations.stories.ts -t Merge",
      "result": "pass",
      "failures": 0,
      "note": "Initial repository run is 39 pass/1 fail for duplicate merge-parent prompt. Repaired exact Merge passes all four viewport/theme configurations. Earlier full catalog finishes first 196-case configuration then is stopped for new pixel/navigation regressions; not a full pass. operation-layout-{repository,merge,catalog}.log."
    },
    {
      "name": "pixel-and-navigation-regressions",
      "command": "pnpm test:storybook catalog/plugins/repository/OperationLayout.stories.ts",
      "result": "fail",
      "failures": 2,
      "note": "Separate attempts reproduce one incorrect fallback-initial failure (AD instead of source A), then one inaccessible unloaded-parent file-control failure. Copy source application fallback and retain separately labelled file controls outside the graph. operation-card-pixels-before.log and operation-card-pixels-after.log retain attempts."
    },
    {
      "name": "final-exact-operation-layout",
      "command": "pnpm test:storybook catalog/plugins/repository/OperationLayout.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Eight passes across desktop/narrow and light/dark, including axe. Source card geometry, avatar, disclosure, compact diff height, file/split selection, close/reopen, loaded/unloaded parent navigation, App toast on refusal and explicit successful recovery. operation-card-acceptance-final.log."
    },
    {
      "name": "controller-and-renderer",
      "command": "node --test tests/renderer/repository-operations.test.mjs\nnode --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Seven operation-controller cases and all 214 renderer/governance cases pass. Exact native operation IDs, integer metadata, retained pins and stale-response refusal are covered. operation-layout-controller.log and operation-card-renderer-complete.log."
    },
    {
      "name": "strict-ui-checks-and-builds",
      "command": "pnpm check:types\npnpm check:architecture\npnpm check:app-ownership\npnpm build\npnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Zero type errors/warnings; architecture and App ownership pass. Renderer/static catalog builds pass with existing PURE/chunk advisories. operation-card-{types,architecture,ownership,build,static}-complete.log."
    },
    {
      "name": "pre-profile-correction-catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "All 50 files/196 cases pass independently in desktop/light, narrow/light, desktop/dark and narrow/dark: 784 interaction/axe passes. Each configuration starts cold Vite/Chromium. operation-card-catalog-complete.log. This predates the prepared-profile correction and is superseded by the final rerun."
    },
    {
      "name": "browser-source-comparison",
      "command": "cua_repl: compare live jj-store Op Log and Notes Expanded Operation Files story; inspect source geometry and save screenshot.",
      "result": "pass",
      "failures": 0,
      "note": "Reference header 40px, metadata 14px, rail padding 13.6px 16px and stack gap 12px are ported. Final screenshot .local/reusable-conversations/operation-card-aligned.png. Application-owned components copied/adapted with source/license attribution in docs/provenance.json. Whole-view pixel approval remains open; no baselines updated."
    },
    {
      "name": "prepared-profile-regression",
      "command": "node --test tests/renderer/repository-operations.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Actual Tauri History::read delegates to read_code_index, which refuses direct Request::Operation. New controller reproduction rejects that unsupported request and supplies only qualified graph pages: 6 pass/1 fail before correction. operation-card-profile-before.log. Source inspection is distinct from running a native test."
    },
    {
      "name": "qualified-prepared-parent-pages",
      "command": "node --test tests/renderer/repository-operations.test.mjs\npnpm check:types\npnpm check:architecture\npnpm check:app-ownership\nnode --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Resolve exact parent metadata with existing graph:operations pages under the retained pin. At most four pages of 50 nodes; repeated continuations, missing IDs, substituted pins and stale responses refuse or fence. Eight controller and all 215 renderer/governance cases pass; strict types zero errors/warnings and both audits pass. operation-card-profile-{after2,types,architecture,ownership,renderer}.log."
    },
    {
      "name": "initial-document-consumers",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:check\npnpm format:check",
      "result": "fail",
      "failures": 4,
      "note": "Initial progress sees the stale pre-document JJ snapshot and refuses fresh coverage. Spec reports three chapter-size violations and missing SUMMARY entry. Consolidate current evidence notes and preserve compact verification table; add navigation and snapshot with jj st before fresh consumers. Formatting itself passes. operation-card-{progress,spec,format}-final.log."
    },
    {
      "name": "final-profile-ui-and-build-qualification",
      "command": "pnpm test:storybook catalog/plugins/repository/OperationLayout.stories.ts\npnpm test:storybook\npnpm build\npnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Final operation-card exact stories pass 12 cases across four width/theme configurations, including bounded-refusal toast. Final complete existing catalog passes 50 files/197 cases in each configuration: 788 checks. The new independent Comparison story is collected afterward and separately passes all four configurations, making 792 current cases covered across both commands. No pre-existing catalog runtime inputs change during the run; the sole later edit to OperationLayout is erased type annotations on its fixture-log assertion. Renderer build passes; fresh final static build passes after the final comparison selector correction (48.67 seconds). operation-card-qualified-{exact,catalog}.log, operation-card-profile-build.log, operation-card-qualified-static.log."
    },
    {
      "name": "bound-story-type-check",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 2,
      "note": "New bound-story assertion reads an unknown fixture log without a type annotation: 2 errors/0 warnings. Add erased LocalCodeQuery annotations only; final strict types pass with 0 errors/0 warnings. operation-card-qualified-types.log and operation-card-qualified-types2.log."
    },
    {
      "name": "two-tab-comparison-story",
      "command": "pnpm test:storybook catalog/plugins/repository/Comparison.stories.ts\npnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Four interaction/axe passes across both widths/themes. Production workspace tabs retain both independent pins, expanded files, JJ split diff and Op Log stacked cards. First two attempts fail once each: requested title differs from the View display name, then macOS AX checkbox maps to a DOM pressed button. Use actual production display names and DOM button semantics; no production tab behavior changes. operation-card-comparison{,2,3}.log; final types zero errors/warnings in operation-card-comparison-types.log. Vitest selects another available port when the first is occupied by the independent catalog run; no unrelated listener is stopped."
    },
    {
      "name": "open-two-tab-review",
      "command": "cua_repl: createBrowserTab port7490 Comparison story, getAXState, markDeliverable, save screenshot.",
      "result": "pass",
      "failures": 0,
      "note": "Actual open preview contains Repository history and Repository operation log workspace tabs, both already configured for file/diff review. The final JJ tab is active; the user may switch to Op Log. Screenshot .local/reusable-conversations/repository-comparison-tabs.png. Preview source HMR is active; dev logs record component/story index updates. Whole-view parity and baseline approval remain open."
    },
    {
      "name": "documents",
      "command": "pnpm progress:generate\npnpm exec prettier --write MIGRATION.md\npnpm check:progress\npnpm spec:check\npnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Initial progress/spec failures remain recorded. Final document qualification passes 33 tasks/111 records, all four spec lanes and full formatting. Final evidence-only consumers repeat progress/spec and check formatted evidence. operation-card-{progress,spec,format}-qualified.log and operation-card-{progress,spec,evidence-format}-committed.log. Native statuses/gates are unchanged."
    }
  ],
  "contractReview": "LD-REPO-004 operation metadata and file diff now share one Column Canvas column. Source-owned operation card/rail and avatar fallback are copied with attribution, using public Design Core primitives. Exact unloaded-parent graph pages retain the operation pin, bound work and reject substituted pins, missing IDs, repeated cursors and stale responses and keep file controls reachable without fabricating graph rows. LD-REPO-002 native admission, storage, transport, receipt and publication formats are unchanged; no Rust source or authority changes.",
  "milestoneReview": "NOTES-05I3A qualifies operation-card composition; NOTES-05I5A supplies the requested two-tab review story only. M13.2 stays Done under its original native history gate; M13/M13.3 remain In progress. NOTES-05I remains the sole Active umbrella. The requested rich parent Command View picker is next, with preview maintenance, highlighted native queries, remaining row/statistics/state parity and whole-view acceptance still open. NOTES-07 waits. Managed conversation/restart and visual approval gates remain open.",
  "scope": "UI-only application-owned operation composition and parent navigation. Shared file-diff presentation justifies renderer, all repository/catalog interactions, strict checks and both builds. Source package accessibility defect is qualified upstream and consumed as a verified private archive. No Rust builds, native foreground/provider acceptance, package publication or visual baseline updates. Prepared-profile source inspection corrected the earlier direct Operation request: only already qualified operation graph requests are used; Rust source stays unchanged."
}
```
