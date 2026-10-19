# Constrained chat, footer fade and popover clearance

```json
{
  "id": "E-CATALOG-012",
  "tasks": ["M8.5", "M10.2"],
  "requirements": [
    "LD-AI-002",
    "LD-AI-004",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-REPO-004",
    "LD-HOST-001"
  ],
  "revision": "enclosing Jujutsu change",
  "versions": {
    "designCore": "0.5.1",
    "desktop": "0.1.0",
    "platform": "macOS ARM64",
    "pnpm": "10.34.5"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/ai/ChatLayoutReview.stories.ts",
    "catalog/plugins/repository/WorkingCopyStatus.stories.ts",
    "catalog/support/ai/sessions/chat-review-seed.ts",
    "catalog/support/ai/shell/AiShellDemo.svelte",
    "catalog/support/ai/shell/fixture.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-presentation.md",
    "spec/src/current/ai.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-012.md",
    "spec/src/history/index.md",
    "src/components/repository/RepositoryWorkingCopyStatus.svelte",
    "src/lib/ai/chat/transcript-tool-preview.ts",
    "tests/ai/chat/transcript-tool-preview.test.ts",
    "spec/src/current/desktop.md",
    "spec/src/current/plugins.md"
  ],
  "result": "pass",
  "runs": [
    {
      "name": "prose-only-reproduction",
      "command": "Core: pnpm test:storybook src/shared/chat/transcript/Transcript.readonly.stories.svelte -t Narrow; Desktop: pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts -t Long",
      "result": "fail",
      "failures": 1,
      "note": "Prose-only Core cases pass; the first desktop fixture uses Search and exposes two existing accessible-name mismatches in that sidebar. It is replaced with real AI History to match the reported composition. wrapping-desktop-before.log. No a11y rule is disabled."
    },
    {
      "name": "webkit-and-resize-probes",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.webkit.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts -t Long",
      "result": "fail",
      "failures": 1,
      "note": "Functional WebKit cases pass; suite afterAll requires Chromium --expose-gc. An intermediate arbitrary width>800 assertion fails (765px) and is replaced with a relative resize assertion. wrapping-webkit-before.log, wrapping-resize-before.log, wrapping-resize-before-final.log. No GC guard is removed; no WebKit desktop suite pass is claimed."
    },
    {
      "name": "long-path-exact-before",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts -t Long",
      "result": "fail",
      "failures": 1,
      "note": "1320x900 Chromium. A deep path and long basename reproduce clipped prose: reader right edge1468px exceeds thread935px. wrapping-long-path-before.log. Captured path is inert data, never read from the local filesystem."
    },
    {
      "name": "owning-source-regression",
      "command": "Core: pnpm test:storybook src/shared/chat/transcript/Transcript.readonly.stories.svelte -t Narrow",
      "result": "pass",
      "failures": 0,
      "note": "With the inspectable long path, Document and Classic both fail before (948px reader in320px frame), then both pass after. Source32affc0f8b9ac8de34e92fc5b7b34d80df1bea58. ChatTools overrides inherited nowrap and lets the title span shrink. Full titles, inspector controls, source identity and host authority stay unchanged. Core spec/records/2026-10-19-transcript-long-tool-titles.md records commands and failures."
    },
    {
      "name": "focused-source-checks",
      "command": "Core: pnpm test:storybook src/shared/chat/transcript/Transcript.readonly.stories.svelte src/shared/chat/transcript/Transcript.tools.stories.svelte src/shared/chat/transcript/Transcript.task-lists.stories.svelte; pnpm exec svelte-check --tsconfig ./tsconfig.json --fail-on-warnings; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "12 interaction/axe stories pass in a fresh process, source types zero errors/warnings, spec3lanes pass. Core private WebKit config with --project storybook and readonly -t Narrow also passes both final bounded cases; wrapping-long-path-webkit-after.log."
    },
    {
      "name": "public-archive-and-install",
      "command": "Core packLocal from scripts/pack-local.mjs with suffix -tool-title-wrap; pnpm local:install .local/archives/tool-title-wrap-review.json",
      "result": "pass",
      "failures": 0,
      "note": "Archive lapismd-design-core-0.5.1-tool-title-wrap.tgz SHA256615f5ebb650f516d92e9ef439ae8f16792b9ced2937603a0b7af729cd235f90a;254 CSS files,zero utility references. All14archives/import routes verify; only Core entry changed. Other13archives and tracked manifest/lockfile preserved. wrapping-public-install.log."
    },
    {
      "name": "public-exact-after",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts -t Long",
      "result": "pass",
      "failures": 0,
      "note": "1pass,7filtered. After package refresh, both views and outer sidebar toggles fit. Prose and tool button bounds are non-vacuous. Conversation list is asserted on wide layouts; compact layout retains its conversation toggle. wrapping-long-path-public-after.log."
    },
    {
      "name": "public-narrow-after",
      "command": "LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts -t Long",
      "result": "pass",
      "failures": 0,
      "note": "420x800:1pass,7filtered; wrapping-narrow-after.log."
    },
    {
      "name": "first-related-family-run",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/ai/ImportLayoutReview.stories.ts",
      "result": "fail",
      "failures": 2,
      "note": "All15story assertions pass but2unhandled API configuration-persistence rejections report File editing-session registry is closed after Inline Local Commands teardown. Owner: lapis-notes/api lifetime. Ran alongside the separate narrow probe. Guard remains enabled; wrapping-desktop-affected.log. Serial rerun recorded separately."
    },
    {
      "name": "story-types-before",
      "command": "pnpm exec svelte-check --tsconfig ./tsconfig.json",
      "result": "fail",
      "failures": 4,
      "note": "Four new Testing Library ByRoleOptions incorrectly include Playwright exact:true. Remove that unsupported option; role-name matching remains exact by Testing Library default. wrapping-desktop-types.log."
    },
    {
      "name": "story-types-and-ownership-after",
      "command": "pnpm exec svelte-check --tsconfig ./tsconfig.json; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Final types zero errors/warnings and both source audits pass. wrapping-desktop-types-final.log, wrapping-desktop-architecture.log, wrapping-desktop-app-ownership.log."
    },
    {
      "name": "serial-family-rerun",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/ai/ImportLayoutReview.stories.ts",
      "result": "fail",
      "failures": 2,
      "note": "Serial run repeats the same two API configuration-persistence teardown rejections. All 15 story assertions pass; suite remains failed. No API or cleanup workaround is added in this layout slice. wrapping-desktop-affected-serial.log."
    },
    {
      "name": "tracking-before",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "First progress read races the newly untracked evidence before JJ snapshot. The settled spec run identifies two bookkeeping gaps: MIGRATION.md needs fresh evidence coverage and SUMMARY needs the new evidence link. Add those mappings without changing gates or checkers. wrapping-progress.log and wrapping-desktop-spec.log."
    },
    {
      "name": "single-line-path-source",
      "command": "Core exact Narrow before/after; affected readonly/tools/task-list stories; source types/spec; packLocal -tool-path-tooltip",
      "result": "pass",
      "failures": 0,
      "note": "User refinement: optional captured path requests one-line ellipsis and a shadcn tooltip on hover/focus. Before2 failures, after12 affected cases and2 final WebKit cases pass. Source f26edf9e3435129eeef77e830eb1231d1fb0b918; archive SHA256 c73b6263d4b62f6905af7450a75e24be414b1239e2ef847e0a90bc90f37af7e1. Source record 2026-10-19-truncated-tool-paths.md. Desktop read projection supplies captured paths for completed, failed and custom reads without resolving current files."
    },
    {
      "name": "footer-popover-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts -t Rounded",
      "result": "fail",
      "failures": 1,
      "note": "Left position0px fails required8px edge clearance; status-popover-inset-before.log. Set public collisionPadding8 and sideOffset6. First after assertion measured from footer track rather than trigger; corrected to trigger. Floating pixel rounding differs0.16px, so offset uses half-pixel tolerance; edge constraints stay exact."
    },
    {
      "name": "layout-readiness-probe",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts -t \"Long|Rounded\"; repeat narrow",
      "result": "fail",
      "failures": 1,
      "note": "Popover now passes. The chat assertion reads a20px title during initial nested shell measurement. Keep every bound and nonzero title assertion, await them together before inspecting controls. Both intermediate logs truncated-path-footer-{verified,narrow-verified}.log preserve the initial readiness failures."
    },
    {
      "name": "footer-fade-source",
      "command": "Core: composer-layout -t Fading; composer-layout+readonly stories; source types/spec; WebKit Fading; packLocal -transcript-footer-fade",
      "result": "pass",
      "failures": 0,
      "note": "Absent fade fails once before; exact after passes both modes in one case. All11 affected stories,1 WebKit case, zero-diagnostic types and3 spec lanes pass. Source9966602d6dd7cfede1ef24e0b8fddf5f5f6a63f9; archive SHA25692602eccc421077046e2fd3902dae6da907becf955ada21daeec08f175869c0d.255 CSS files audited,zero utility references. Fade follows viewport, clears pinned Classic composer, ignores pointer input and hides at content end."
    },
    {
      "name": "final-public-install",
      "command": "pnpm local:install .local/archives/transcript-footer-fade-review.json",
      "result": "pass",
      "failures": 0,
      "note": "14 archives/import routes verify; only Core changed, other13 entries and tracked dependency files retained. transcript-fade-install.log."
    },
    {
      "name": "final-desktop-layout",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/ai/ImportLayoutReview.stories.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts -t \"(Long.*Messages|Live.*Inbox|Session Preview|Rounded.*Window)\"",
      "result": "pass",
      "failures": 0,
      "note": "1320x900:4 pass,19 filtered; transcript-fade-desktop-final.log. Both modes, path tooltip, inspector/Preview/Source, imported preview, fade and footer popover spacing. Fresh built public package and cold processes."
    },
    {
      "name": "final-narrow-layout",
      "command": "LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts -t \"(Long.*Messages|Rounded.*Window)\"",
      "result": "pass",
      "failures": 0,
      "note": "420x800:2 pass,14 filtered; transcript-fade-desktop-narrow.log."
    },
    {
      "name": "read-projection-unit",
      "command": "pnpm exec vitest run --config vitest.ai.config.mjs tests/ai/chat/transcript-tool-preview.test.ts",
      "result": "pass",
      "failures": 0,
      "note": "10 cases pass; truncated-path-projection-tests.log. Exact captured path remains present for source/custom/failed results without current-file IO."
    },
    {
      "name": "final-types-and-ownership",
      "command": "pnpm exec svelte-check --tsconfig ./tsconfig.json; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors/warnings and both source boundaries pass; final-layout-{types,architecture,ownership}.log."
    },
    {
      "name": "spec-mapping-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Validation, formatting and book build pass; source-first additionally requires desktop.md and plugins.md. Their summaries now reference this qualified presentation slice with unchanged ownership and original gates; layout-final-spec.log."
    },
    {
      "name": "review-refresh",
      "command": "pnpm storybook:restart -- --port 7491; verified detached CARGO_BUILD_JOBS=2 pnpm dev --no-watch",
      "result": "pass",
      "failures": 0,
      "note": "Storybook PID96137 serves the final public archive. Review app supervisor21563 reports renderer ready; review-app-layout-final.log. Vault/profile retained. Known linker/logo advisories remain. Review startup is not a native product gate."
    },
    {
      "name": "tracking",
      "command": "pnpm progress:generate; pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "41 tasks and173 evidence records validate. Statuses, dependencies and gates remain unchanged. Only narrative is condensed to retain the milestone document byte limit."
    },
    {
      "name": "final-document-gates",
      "command": "pnpm check:progress; pnpm spec:check; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "Progress validates41tasks/173records. All4spec lanes pass after mapped chapter summaries; layout-spec-verified.log and layout-tracking-verified.log. No completion gate or baseline changed."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "User requests minimal testing: full catalog/theme/viewport, native provider/platform, release and visual baseline matrices deferred.",
    "The related 15-story run retains two API configuration-persistence teardown rejections, reproduced serially. Its15 assertion passes do not qualify that suite. Owner lapis-notes/api; retained in failed runs above, outside the verified layout slice."
  ],
  "contractReview": "Core owns bounded title wrapping, optional captured-path truncation/tooltips and fixed-footer trailing fade. Desktop supplies only inert captured paths, shell fixtures and acceptance. The repository popover uses public8px collision padding and6px trigger offset. Source bytes, IDs, anchors, native admission, capture and persistence authority remain unchanged. Prepared public archives only; no aliases, patches or consumer CSS workarounds.",
  "milestoneReview": "M8.5 and M10.2 remain In progress; original native/provider/storage and distribution gates are unchanged. No full-suite, native product gate or visual-baseline acceptance is inferred from focused stories or screenshots."
}
```
