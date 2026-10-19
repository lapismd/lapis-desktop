# Rounded desktop footer and imported XML context

```json
{
  "id": "E-CATALOG-011",
  "tasks": ["M8.5", "M10.2"],
  "requirements": [
    "LD-HOST-001",
    "LD-AI-002",
    "LD-AI-004",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003"
  ],
  "revision": "enclosing Jujutsu change",
  "versions": {
    "designCore": "0.5.1",
    "desktop": "0.1.0",
    "platform": "macOS ARM64",
    "pnpm": "10.34.5"
  },
  "files": [
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/ai/ImportLayoutReview.stories.ts",
    "catalog/plugins/repository/WorkingCopyStatus.stories.ts",
    "catalog/support/ai/imports/fixture.ts",
    "catalog/support/repository/WorkingCopyDemo.svelte",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-presentation.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-011.md",
    "spec/src/history/index.md",
    "src/components/ai/sessions/AiRecordedTranscript.svelte",
    "src/styles/notes-workspace.css"
  ],
  "result": "pass",
  "runs": [
    {
      "name": "xml-context-before",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ImportLayoutReview.stories.ts -t 'Xml.*Context'",
      "result": "fail",
      "failures": 2,
      "note": "Preview and reopened saved imports lack XML disclosure buttons. The first extension-only rerun still fails both: the shared immutable Markdown reader does not render those regions. Logs xml-context-before.log and xml-context-after.log under .local/verification/footer."
    },
    {
      "name": "source-and-public-archive",
      "command": "Design Core focused footer/read-only stories, range/parser/rich-source units, types, spec/format checks and packLocal",
      "result": "pass",
      "failures": 0,
      "note": "Eighteen source units, eleven affected interaction/accessibility stories and four type configurations pass; source types pass again after the final reader repair. Spec passes three lanes. Source ada0cccc plus fixture-only namespace fix 1effb2839ceffedd574567a680ac2a1a812b5f28. The first package style audit rejects a fixture utility-like class; the namespaced selector passes its exact Rounded rerun and final packaging audit (254 CSS files, zero utility references). Core source records retain each failure and command."
    },
    {
      "name": "public-archive-install",
      "command": "pnpm local:install .local/archives/safe-xml-review.json",
      "result": "pass",
      "failures": 0,
      "note": "All 14 archives/import routes verify. Only Core changes; other 13 archives and tracked manifests/lockfile are preserved. Core archive .local/packages/lapismd-design-core-0.5.1-safe-area-xml.tgz SHA256 9e33d66214f5d2f651674bf8eb11ad487514fe8aebcf8a471f81de20b42247f0."
    },
    {
      "name": "first-public-run-without-completion-summary",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ImportLayoutReview.stories.ts -t 'Xml.*Context'",
      "result": "pending",
      "failures": 0,
      "note": "The invocation exits zero during dependency re-optimization after the package install/restart but reports no test summary. It supplies no pass. Rerun with fresh stable processes; log xml-context-public-after.log."
    },
    {
      "name": "public-xml-exact-after",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ImportLayoutReview.stories.ts -t 'Xml.*Context'",
      "result": "pass",
      "failures": 0,
      "note": "Both exact regressions pass (five filtered), including disclosure expansion in Document and Classic for preview and saved imports, with no composer. Log xml-context-public-final.log."
    },
    {
      "name": "public-affected-consumers",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ImportLayoutReview.stories.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 15 cases pass across both directly affected files, including deduplication, empty/loading/unavailable states, status refresh/settings/failure feedback, footer placement and rounded safe-area controls. Log safe-xml-consumers.log."
    },
    {
      "name": "desktop-types-and-boundaries",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Zero type errors/warnings; source and App boundaries pass. Logs safe-xml-desktop-types.log and safe-xml-architecture.log."
    },
    {
      "name": "review-refresh-and-visible-proof",
      "command": "pnpm storybook:restart -- --port 7491; restart verified isolated preview process group from main with CARGO_BUILD_JOBS=2 pnpm dev --no-watch; inspect actual stories",
      "result": "pass",
      "failures": 0,
      "note": "Storybook runs on 7491 (36710); native preview supervisor 37601 builds in 15.13s and reports renderer ready. Native last-notes.json is refreshed at 21:17:31 local after ordinary admission/Notes metadata startup. Known linker/logo advisories remain. No profile or vault data is reset. Actual stories show clear footer edges and expanded inert XML disclosures; screenshots rounded-footer-final.png and import-xml-final.png under .local/verification/footer. This is review startup, not a native acceptance gate."
    },
    {
      "name": "tracking-spec-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Validation, Rust format and book build pass, but spec-first requires mapped ai.md and migration.md chapter updates. Their summaries now reference the qualified XML/footer slice while retaining every original native/provider/release gate. No implementation or checker changes."
    },
    {
      "name": "tracking-and-documents",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm exec prettier --check [changed files]",
      "result": "pass",
      "failures": 0,
      "note": "Original statuses/gates retained. Condense milestone summary only to retain its 32768-byte bound after selecting this evidence. Broad catalog/native/provider/release/visual runs remain deferred."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Full catalog/theme/viewport, native provider/platform, release and visual baseline matrices remain deferred under the user minimal-testing instruction."
  ],
  "contractReview": "Native host supplies Core safe-area variables (8px at inline edges, 4px bottom). Footer owns full track and controls; views/plugins add no padding. Recorded/imported transcripts enable public inert promptElementsExtension and retain captured bytes, IDs, read-only state, transport/privacy/persistence and execution boundaries. Source defects are fixed in Design Core and consumed through its public archive; no aliases or node_modules patches.",
  "milestoneReview": "M8.5 and M10.2 remain In progress with original native gates unchanged. Focused source/consumer evidence cannot qualify those broader gates."
}
```
