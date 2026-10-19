# Core discovery exclusions and compact chat composer

```json
{
  "id": "E-CATALOG-013",
  "tasks": ["M8.5", "M10.2"],
  "requirements": [
    "LD-AI-002",
    "LD-AI-004",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-HOST-001"
  ],
  "revision": "enclosing Jujutsu change",
  "versions": {
    "desktop": "0.1.0",
    "designCore": "0.5.1",
    "api": "0.1.4",
    "ui": "0.1.3",
    "platform": "macOS ARM64",
    "pnpm": "10.34.5"
  },
  "files": [
    "catalog/plugins/ai/ChatLayoutReview.stories.ts",
    "catalog/plugins/ai/VaultListingReview.stories.ts",
    "catalog/support/ai/sessions/chat-review-seed.ts",
    "src/components/ai/chat/AiTranscriptComposer.svelte",
    "spec/src/history/E-CATALOG-013.md",
    "spec/src/current/ai-presentation.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/plugins.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/index.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "spec/src/SUMMARY.md"
  ],
  "result": "pass",
  "runs": [
    {
      "name": "default-listing-before",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/VaultListingReview.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Old public API leaks .git/.jj paths into the folder picker. core-listing-desktop-before.log."
    },
    {
      "name": "composer-height-before",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts -t \"Compact Composer\"",
      "result": "fail",
      "failures": 1,
      "note": "The three-line minimum exceeds the requested two-line height. composer-compact-before.log."
    },
    {
      "name": "owning-source-checks",
      "command": "Notes: exact Vault exclusion tests, affected Vault/glob/configuration tests, API check/build, spec:check; Core: MarkdownComposer stories, source svelte-check, spec:check, packLocal",
      "result": "pass",
      "failures": 0,
      "note": "Notes exact3failures before ->3passes; affected30passes, API types/build pass and spec3lanes plus ownership/metadata audits and38spec tests pass. Source d42511dfff88fbe1f0b25bc1879f0bc87efc9d74; spec/records/2026-10-19-core-vault-exclusions.md. Core framed focus fails before; all10composer interaction/axe cases pass after, types/spec pass. Source7c9e4b84d1e3f0136cf2eed51f1db45c82f631fe; spec/records/2026-10-19-composer-focus.md."
    },
    {
      "name": "first-install",
      "command": "pnpm local:install .local/archives/compact-composer-core-listing-review.json",
      "result": "fail",
      "failures": 1,
      "note": "API0.1.5 requires UI^0.1.4; the previous overlay UI0.1.3 fails closed. Prepare the unchanged current UI0.1.4 build/public archive; do not weaken ranges. composer-core-listing-install.log."
    },
    {
      "name": "incompatible-api-line",
      "command": "pnpm local:install .local/archives/compact-composer-core-listing-review.json; pnpm check:types; focused two-story-file command",
      "result": "fail",
      "failures": 68,
      "note": "The initial default Notes source line4c9d681a/API0.1.5 lacks APIs already consumed by Desktop. UI0.1.4 resolves the first semver rejection but Desktop then has66 type errors and2 import failures including missing FileTextPersistence. Retained composer-core-listing-install-final.log, core-listing-types.log and composer-listing-public-after.log. Do not weaken contracts or integrate unrelated source lines."
    },
    {
      "name": "compatible-source-and-archive",
      "command": "Notes: rebase the owned exclusion slice onto verified API cae795d0; pnpm --filter @lapis-notes/api check; build; affected four test files; spec:check; explicit spec-validator first range",
      "result": "pass",
      "failures": 0,
      "note": "Source b6a1ac59d60a344436a6e5bf3e018109eb9a5ca6 keeps File editing-session operations as the second Vault argument and adds listing options third.30 affected tests, types/build/publint/declarations, spec6lanes,38spec tests and App/metadata audits pass. LN-PKG-185 owns discovery;165was already used on this base. A temporary Core public archive repairs3 source type errors from the old installed Core; the first historical-hook install fails on an absent Markdown artifact, then dedicated archive hook succeeds without tracked dependency changes. Source record retains all attempts. Independent Node line preserved."
    },
    {
      "name": "compatible-public-install",
      "command": "pnpm local:install .local/archives/compact-composer-core-listing-review.json",
      "result": "pass",
      "failures": 0,
      "note": "14archives/import routes verify and tracked package/lock files stay unchanged. Final API0.1.4 and original UI0.1.3 retain Desktop foundation. composer-listing-compatible-install.log. Core0.5.1 source7c9e4b84d1e3f0136cf2eed51f1db45c82f631fe; compact archive SHA2565e884034ca532808521edb99d9110015570b46d3125501bdff73df73b166174f. API SHA25611a766cbf6060320bf7befa54805ed31ae9e610aeebb4c7317fe3a39a3b145c9. Source revision metadata updated after documentation-only qualification; packed runtime unchanged."
    },
    {
      "name": "related-chat-run",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/ai/VaultListingReview.stories.ts",
      "result": "fail",
      "failures": 2,
      "note": "All10assertions pass; two previously recorded configuration-persistence teardown rejections repeat in Inline Local Commands (File editing-session registry is closed). This is not a clean suite pass. composer-listing-public-final.log; API owner, retained separately from the selected changed views."
    },
    {
      "name": "exact-public-after",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/ai/VaultListingReview.stories.ts -t \"Compact Composer|Long Messages|Shared Core\"",
      "result": "pass",
      "failures": 0,
      "note": "Fresh1320x900 Chromium:3passes,7filtered, no unhandled errors. Two-line sizes, no focused shell shadow, retained draft across modes, long-path bounds/fade and default/dynamic core folder exclusions without Repository History are verified; adapter bytes retained. composer-listing-exact-final.log."
    },
    {
      "name": "types-and-source-boundaries",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Final source types zero errors/warnings; both audits pass. composer-listing-types-final.log, core-listing-{architecture,ownership}.log."
    },
    {
      "name": "document-metadata-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Initial record used an unsupported partial result and lacked a SUMMARY entry. Corrected metadata and mapped entry; core-listing-desktop-spec.log. Authored document limits are preserved by shortening narrative, without changing any task gates."
    },
    {
      "name": "document-gates-after",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; changed-file Prettier check; task-row comparison",
      "result": "pass",
      "failures": 0,
      "note": "Progress41tasks/174records validates; all4spec lanes pass. All changed files are formatted. The33main-table task statuses/dependencies/requirements/gates/next actions match the previous change; other task ledgers unchanged. Original completion gates retained. composer-listing-{progress-check,spec-final}.log."
    },
    {
      "name": "review-refresh",
      "command": "pnpm storybook:restart -- --port 7491; verified checkout-owned process restart with CARGO_BUILD_JOBS=2 pnpm dev --no-watch",
      "result": "pass",
      "failures": 0,
      "note": "Storybook75769 serves the final verified packages. Native review supervisor16003 reports renderer ready and preserves the existing vault/profile; review-app-composer-listing.log/json. Existing linker/logo advisories retained. Browser compact-composer shows the focused Classic editor without a ring; compact-composer-review.png. Startup is review evidence, not native qualification."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "User requests minimal testing: aggregate catalog/theme/viewport, native/provider/platform, distribution and visual-baseline matrices remain deferred.",
    "E-CATALOG-012 retains two previously reproduced API configuration-persistence teardown rejections. This slice does not claim their repair."
  ],
  "contractReview": "Core API owns files.exclude discovery defaults and dynamic pattern filtering; explicit admitted reads, adapter bytes and native backup exclusions remain separate. Core owns composer focus presentation; Desktop selects two-line minimums through public tokens. No source aliases, package patches or consumer CSS masks. The default source workspace uses the existing Desktop-compatible API base; the independent Node integration line and main bookmark are preserved. No broad source-line merge is claimed.",
  "milestoneReview": "M8.5 and M10.2 retain In progress and their original native/provider completion gates; focused source and public-consumer checks do not promote those gates."
}
```
