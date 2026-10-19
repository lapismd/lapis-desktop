# Full-width workspace status footer

```json
{
  "id": "E-CATALOG-009",
  "tasks": ["M8.5"],
  "requirements": [
    "LD-HOST-001",
    "LD-DESK-001",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-GOV-002"
  ],
  "revision": "enclosing Jujutsu change",
  "versions": {
    "desktop": "0.1.0",
    "designCore": "0.5.1",
    "api": "0.1.4",
    "platform": "macOS ARM64",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "jj": "0.45.1"
  },
  "files": [
    "MIGRATION.md",
    "PLAN.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/ai/Admission.stories.ts",
    "catalog/plugins/repository/WorkingCopyStatus.stories.ts",
    "catalog/support/ai/transcript/DesignCoreReference.svelte",
    "package.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-presentation.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-009.md",
    "spec/src/history/index.md",
    "src/components/ai/chat/panel.css",
    "src/components/repository/repository-status.ts",
    "vitest.catalog.config.ts"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "desktop-before",
      "command": "pnpm test:storybook catalog/plugins/repository/WorkingCopyStatus.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Six existing stories pass; new footer measures 271.375px in a 1200px shell. /tmp/footer-desktop-before.log."
    },
    {
      "name": "source-focused",
      "command": "source footer/AppShell stories and focused unit suites",
      "result": "pass",
      "failures": 0,
      "note": "16 cold AppShell/footer interactions, 9 reusable demo stories and 20 focused units pass; source package and 833-unit suite pass. Owning source record has commands and qualification in progress."
    },
    {
      "name": "working-copy-footer-matrix",
      "command": "pnpm test:storybook catalog/plugins/repository/WorkingCopyStatus.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Seven production stories pass independently at desktop/light, narrow/light, desktop/dark and narrow/dark: 28 interaction/axe cases. /tmp/footer-desktop-focused2.log. Initial validation found fixture title updates outside the public progress API; corrected the fixture to start the long task through createProgress."
    },
    {
      "name": "strict-types-and-renderer",
      "command": "pnpm check:types; pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "0 errors/0 warnings; renderer build passes with existing annotation and large-chunk advisories. /tmp/footer-desktop-types2.log and /tmp/footer-desktop-build.log."
    },
    {
      "name": "document-check-first-attempt",
      "command": "pnpm check:progress; pnpm spec:check",
      "result": "fail",
      "failures": 5,
      "note": "Evidence needed explicit contract review and coverage for PLAN/MIGRATION/verification; added fields/coverage. Desktop chapter exceeded its byte bound after the footer note; condensed that note. No contract or checker weakened."
    },
    {
      "name": "renderer-baseline-runner",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "fail",
      "failures": 5,
      "note": "313 pass; five existing modules reject TypeScript parameter properties in Node 26 strip-only mode. No footer assertion failure. Experimental transform flag is unavailable in Node 26; exact supported tsx preload runs all 342 actual tests successfully."
    },
    {
      "name": "renderer-typescript-loader",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "342 tests pass, zero skips. Default test command now uses the same existing tsx dependency; no production transpiler or build changes. /tmp/footer-desktop-renderer-tsx.log."
    },
    {
      "name": "final-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and warnings. /tmp/footer-desktop-types-final.log."
    },
    {
      "name": "ai-policy-suite",
      "command": "pnpm test:ai",
      "result": "pass",
      "failures": 0,
      "note": "89 files / 402 tests pass. /tmp/footer-desktop-ai-unit-final.log."
    },
    {
      "name": "catalog-admission-regression",
      "command": "pnpm test:storybook catalog/plugins/ai/Admission.stories.ts -t \"Unavailable Admission\"",
      "result": "pass",
      "failures": 0,
      "note": "Current Document composer exposes a textbox and Control+Enter. The exact regression passes after replacing the stale combobox/submit path; FollowScope passes exact reruns without product edits. Earlier broad run was cancelled after these observed failures. /tmp/footer-desktop-admission-after2.log."
    },
    {
      "name": "formatted-verification-bound",
      "command": "pnpm format:check; pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "First final format check found generated MIGRATION table formatting. After formatting, the specification check found verification.md at 40417 bytes because a long footer evidence suffix widened every table row. Move those footer references to a paragraph, preserving all IDs, statuses and evidence; formatted verification.md is 31969 bytes. Final reruns follow."
    },
    {
      "name": "full-catalog-before-restart",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "note": "Desktop/light and narrow/light each pass 74 files / 329 cases. Desktop/dark passes 60 files / 284 cases before one unhandled browser-disconnection error in CommandsAndResults; narrow/dark never starts. This is not a complete matrix pass. Machine restart later removes temporary logs; counts were observed before restart. Remaining dark coverage will run in fresh browser shards without changing assertions or deadlines."
    },
    {
      "name": "final-specification-bound",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four configured lanes pass after moving the footer evidence references out of the widened verification table. Observed before restart; temporary log removed by reboot."
    },
    {
      "name": "final-api-payload-review",
      "command": "pnpm --config.ignore-scripts=true pack --pack-destination .local/archives/packed/footer; compare installed payload",
      "result": "pass",
      "failures": 0,
      "note": "API cae795d0aefe8a1d97dd36af70a487c07eeecd62 packs as 6e663e9c031d23f3b022b3fdcbd341d43b726630cb506319c18b205a14c5ae97. Its only payload difference from the previously accepted desktop archive is the regenerated dist/status-bar.svelte.d.ts; runtime files are byte-identical. Final install/type acceptance follows with the source archive."
    },
    {
      "name": "completed-source-qualification",
      "command": "Design Core source/check/catalog/static/pointer lanes; API source/package/host/catalog lanes",
      "result": "pass",
      "failures": 0,
      "note": "Core 0ad075a2: four type lanes, 833 units, 865 catalog cases, static/metadata, 16 workspace + 11 shell + 151 control + 3 AI pointer cases pass; one Chromium case is covered by WebKit. API cae795d0: 1162 API tests, 1738 package tests, root check/build, 261 catalog cases, static and spec gates pass. Owning records retain commands, failed attempts and bounded reruns. No aggregate exit-zero claim for the cancelled Core pnpm checks."
    },
    {
      "name": "isolate-concurrent-checkout",
      "command": "jj workspace add ../lapis-desktop-status-footer --name status-footer -r ee7c1d0a; jj restore --from codex/desktop-before-history-integration-20261019",
      "result": "pass",
      "failures": 0,
      "note": "Main moved to concurrent AI-history integration vtmksqql while footer qualification ran. Stop edits there per AGENTS.md; restore the preserved footer snapshot into its own workspace based on the original parent. Keep both the saved snapshot and main integration untouched. First install needs semver before node_modules exists; use the byte-identical existing installer from the original checkout to bootstrap this isolated root."
    },
    {
      "name": "final-isolated-archive-handoff",
      "command": "node ../lapis-desktop/scripts/local-archives.mjs .local/archives/footer.json; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Fourteen archives verify across fourteen public import routes; tracked dependency files retain their original contents (only the deliberate test-loader script edit remains). Core 0ad075a2a67d35c202ffb159a69dec315def141d SHA256 825d3fd5d94de2e8fc91bda868c2b14241a0cff83a2833bdf6181c86c6b86805; API cae795d0aefe8a1d97dd36af70a487c07eeecd62 SHA256 6e663e9c031d23f3b022b3fdcbd341d43b726630cb506319c18b205a14c5ae97. Core differs from the previous accepted runtime only in the packaged PLAN.md; API differs only in its regenerated status-bar declaration. Strict consumer types pass with zero errors/warnings."
    },
    {
      "name": "dark-commands-exact",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/CommandsAndResults.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Three exact cases pass in a fresh browser against the final archives. The earlier full-run browser-disconnection error is retained separately. .local/verification/footer/dark-commands-exact.log."
    },
    {
      "name": "fresh-dark-matrices",
      "command": "for viewport in desktop narrow; do for shard in 1 2; do LAPIS_CATALOG_VIEWPORT=\"$viewport\" LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts --shard \"$shard/2\"; done; done",
      "result": "pass",
      "failures": 0,
      "note": "Four serial cold browser shards complete: desktop 138+191 cases in 37+37 files; narrow 138+191 in 37+37 files. Each dark viewport totals 329 cases/74 files. With the earlier complete light viewport runs this covers 1316 cases across four configurations; the earlier monolithic command still retains its browser-disconnection failure. Persistent logs .local/verification/footer/{desktop,narrow}-dark-{1,2}.log."
    },
    {
      "name": "final-isolated-builds",
      "command": "pnpm build; pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Renderer and static Storybook builds succeed against final verified archives. Existing Rollup pure-annotation, empty-worker-chunk and large-chunk advisories remain informational. Logs .local/verification/footer/renderer-final.log and static-final.log."
    },
    {
      "name": "final-isolated-document-checks",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Generated/normalized migration projection passes; 41 tasks and 148 evidence records pass. All four configured specification lanes and complete Prettier/Rust formatting pass. Logs .local/verification/footer/{progress-generate,progress-final,spec-final,format-check-final}.log. No Rust compilation or native acceptance is claimed."
    }
  ],
  "milestoneReview": "M8.5 remains In progress. This footer implementation slice passes source, API, consumer, full theme/viewport matrices and builds; main-workspace handoff is separately recorded. Original native and unrelated migration gates retain their status.",
  "contractReview": "LD-HOST-001 consumes public built archives; Design Core owns footer geometry/overflow and API owns App/context/command projection. Repository placement and AI spacing adapt that contract. Native admission, vault persistence, plugin ownership and original migration gates are unchanged.",
  "deferredQualification": [
    "Main-workspace integration/review restart and temporary workspace retirement are the next separate handoff slice.",
    "Original native M8.5, AI and backup acceptance gates retain their statuses."
  ]
}
```

Design Core owns the footer track, fixed centre, overflow, notification split,
ribbon Settings and shared panel clearance removal. The API owns centre
projection; desktop owns repository placement and AI composer spacing. The
sidebar Settings action remains. No native transport, authority or storage
changes; no release or baseline update. Final results follow in this record.

The user approved the design and resumed verification. Desktop qualification
runs in `/Users/stevejuma/code/lapismd/lapis-desktop-status-footer` (workspace
`status-footer`, change `ttorsqpk`). The default checkout is not the footer work
area while its AI-history merge is uncommitted. The user explicitly chose
application to main after that integration is clean; this is the next handoff,
not permission to replace its current files. Browser shards run serially and
retain the existing assertions, themes, viewport sizes and deadlines.
