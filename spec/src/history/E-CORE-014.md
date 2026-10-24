# Native Search provider and retained SQL intake

```json
{
  "id": "E-CORE-014",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-006",
    "LD-GOV-009",
    "LD-DB-003",
    "LD-VAULT-002",
    "LD-VAULT-003",
    "LD-FILE-003",
    "LD-CAT-003",
    "LD-AI-002",
    "LD-GOV-005",
    "LD-REPO-005"
  ],
  "versions": {
    "desktopBaseline": "24057694",
    "notesCore": "e6de56ef",
    "lapisAI": "6548afe0",
    "lapisTerminal": "d7e0a7cd",
    "jjStore": "7192ff39",
    "jjStoreNativeBaseline": "95d46e44",
    "agentRedaction": "3c3dc0d7",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "@lapis-notes/ui sha256": "a6b47b17298b9495ad41f35f6714dbaa08a43802fd2ca2bad06c2ade9ae97cbe",
    "@lapis-notes/api sha256": "e801f3c48c1b5506e4feba1f178da80729b266c0123e9577fe80096f3380619a",
    "@lapis-notes/language-service sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
    "@lapis-notes/file-explorer sha256": "1b2d11da1a0d1d774a36e59a853ff05ea64af92f09ef89bd1598c771a1ea191e",
    "@lapis-notes/workspace sha256": "a215920c24354bc0d33c1036fa6af63b9a56ad709e62b8bca01ca84c25cd308e",
    "nativeBuildBaseline": "a9ce8d9a",
    "notesCoreSource": "cfb369f7",
    "notesPublicArchives": "e6de56ef",
    "notesSemanticCompatibility": "8fd7b926"
  },
  "contractReview": "Qualify the committed Notes Search provider component as a shared native dependency and the retained Turso provider through actual Desktop native SQL. Refresh the five Notes public archives with the existing scoped helper and preserve the other 14 verified entries and tracked registry dependency files. Add the focused hidden native SQL regression to the opt-in API suite using its existing tsx loader convention. Repair the attachment story controlled-disclosure synchronization without changing its absence assertion, timeout or production components. Keep quiet-default, hidden native API, native product and semantic-provider gates separate. Tracker generation is separately committed and qualified by E-PROGRESS-001 at 733bb679. Notes-owned batch/rebuild source lands independently at cfb369f7. The final catalog exposes two more missing startup joins: Notes upstream and local AI conversations. Join the owned Notes completion promise and existing AI fixture promise before unchanged UI assertions. Retain all local wait budgets and the suite deadline; no provider implementation or baseline changes.",
  "milestoneReview": "M16.2 retains the original E-CORE-003/004 file/admission Done gate. This source/archive/transport receipt does not select the new native database facade or semantic provider in Desktop, install runtime/model assets, or complete R1.3 shell/backup, R3 unattended indexing, provider, Linux, UI/OS, visual or distribution acceptance. Markdown Review remains Deferred.",
  "runs": [
    {
      "name": "exact-native-service",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two pass, zero failed/ignored. Existing compact-unwind linker warning remains non-fatal. No Cargo lock or package version changes. Log .local/core-search-provider-service.log."
    },
    {
      "name": "scoped-public-archives",
      "command": "pnpm local:pack /Users/stevejuma/code/lapismd/lapis-notes --already-built; merge the five entries into the saved cohort; pnpm local:install",
      "result": "pass",
      "failures": 0,
      "note": "Source e6de56ef already passed public build qualification. Five Notes entries refresh from e159faad to e6de56ef; all other 14 entries remain. Verify all 19 archive identities/checksums and 19 import routes. Normal supported installation preserves tracked manifests/lockfiles. This scoped receipt does not qualify complete latest-cohort review freshness. Logs .local/core-search-provider-{pack,install}.log; ignored backup .local/archives/manifest.before-search-provider.json."
    },
    {
      "name": "strict-normal-and-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat with --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Both pass. Logs .local/core-search-provider-clippy{,-e2e}.log."
    },
    {
      "name": "focused-cold-catalog",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/Workspace.stories.ts catalog/plugins/repository/Search.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "11 cases / two files pass after archive installation cleared the Vite cache. Fresh test process; accessibility failures enabled. Log .local/core-search-provider-catalog-focused.log."
    },
    {
      "name": "native-sql-loader-before",
      "command": "node --test tests/desktop/search-provider.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "One module-resolution failure: the API bundler export contains extensionless imports. Use the existing Desktop renderer test convention, node --import tsx; do not patch dependencies or introduce an alias. Log .local/core-search-provider-native-sql-first.log."
    },
    {
      "name": "native-sql-focused",
      "command": "node --import tsx --test tests/desktop/search-provider.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "One case passes through the public retained database/provider and actual Tauri SQL IPC in a hidden native process. Checks ready-to-pending invalidation, statistics, one committed revision, identical-configuration no-op and cold connection reopen. Native visibility, activation and document focus stay false. Uses the previous acceptance binary here; complete rebuilt API acceptance follows. No native semantic inference is selected. Log .local/core-search-provider-native-sql-loader.log."
    },
    {
      "name": "qualified-source",
      "command": "Notes exact provider/model regressions, sequential pnpm check/test/build, Web/hosted/cold catalog and specification lanes at e6de56ef",
      "result": "pass",
      "failures": 0,
      "note": "Source passes six native provider cases, two actual MiniLM cases, 180 ordinary Rust cases (two model cases separately run), 1492 API cases/143 files, 20 check/test tasks, 11 builds, nine spec lanes/38 regressions, Web 12/12, hosted Node 24 journey 1/1 and 261 cold catalog cases/59 files. Notes spec/records/2026-10-24-rust-core-search-provider.md retains exact failures, commands and provenance. No already qualified source suite is repeated for this consumer intake."
    },
    {
      "name": "source-provenance",
      "command": "Sibling Jujutsu status; JJ Store native-input inventory from 95d46e44 through working copy",
      "result": "pass",
      "failures": 0,
      "note": "AI 6548afe0, Terminal d7e0a7cd and Redaction 3c3dc0d7 remain clean. JJ Store parent advances to 7192ff39; 532 paths differ from native baseline, zero crates/Cargo/toolchain/desktop inputs. Plugins has unrelated lockfile edits. Preserve all sibling work. Inventory .local/core-search-provider-jj-inputs.txt."
    },
    {
      "name": "types-and-builds",
      "command": "pnpm check:types; pnpm build; pnpm build-storybook; architecture and App ownership audits",
      "result": "pass",
      "failures": 0,
      "note": "Zero Svelte diagnostics. Renderer and static catalog build. Source-boundary and App ownership audits pass. Existing Rollup annotation/chunk-size warnings remain non-fatal. Logs .local/core-search-provider-{types,build,storybook-build,architecture,ownership}.log."
    },
    {
      "name": "native-api-rebuilt",
      "command": "CARGO_INCREMENTAL=0 pnpm test:desktop:api",
      "result": "pass",
      "failures": 0,
      "note": "All four cases pass, zero skipped. Source-owned ACP preparation and rebuilt actual native bundle precede service, AI admission, repository history/admission and retained SQL provider tests. Isolated hidden windows do not activate or focus. This is API acceptance, not visible native UI/OS or semantic ONNX. Log .local/core-search-provider-native-api.log."
    },
    {
      "name": "native-sql-final-exact",
      "command": "node --import tsx --test tests/desktop/search-provider.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Exact final target passes one case after the rebuilt suite, including explicit Turso/native/provider descriptor assertions. Log .local/core-search-provider-native-sql-final.log."
    },
    {
      "name": "full-format-before",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 2,
      "note": "Flags the new evidence draft plus the unchanged historical E-AI-109.md record. Format only our draft, preserving committed historical evidence and its previously user-accepted exception. Log .local/core-search-provider-format-full.log."
    },
    {
      "name": "full-format-after",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 1,
      "note": "Only unchanged E-AI-109.md remains. Jujutsu confirms no diff from parent; last source revision is 5ad084a44528. This is the same pre-existing formatting failure already accepted by the user. All changed source/test files pass their focused formatter. Log .local/core-search-provider-format-full-after.log."
    },
    {
      "name": "quiet-default-before",
      "command": "CARGO_INCREMENTAL=0 pnpm test:desktop:headless",
      "result": "fail",
      "failures": 1,
      "note": "407 renderer/governance and 744 AI cases pass, followed by 230 native service cases and two subprocess helpers marked ignored (called by restart/interruption tests). Full desktop/light catalog passes 499 cases and fails one attachment Document absence assertion immediately after collapse. Remaining viewports/themes are not run after that failure. Log .local/core-search-provider-headless.log."
    },
    {
      "name": "attachment-diagnosis",
      "command": "Exact Document case and whole Attachments family in fresh desktop/light processes",
      "result": "pass",
      "failures": 0,
      "note": "The exact case passes 1/1 with three excluded cases; the complete family passes 4/4 before edits. The full-run stack identifies Remove Welcome still in the accessibility tree immediately after collapse. The shared screen uses public controlled Design Core Collapsible, whose content lifetime settles separately from its click. Await closed trigger state and the unchanged child-absence assertion, without sleeps, retries, a longer timeout or changes to dependency code. Logs .local/core-search-provider-attachments-{exact-before,family-before}.log."
    },
    {
      "name": "attachment-exact-after",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/Attachments.stories.ts -t Document",
      "result": "pass",
      "failures": 0,
      "note": "Exact repaired case passes 1/1, with the three unrelated cases excluded by the filter. Log .local/core-search-provider-attachments-exact-after.log."
    },
    {
      "name": "attachment-family-after",
      "command": "pnpm test:storybook catalog/plugins/ai/Attachments.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 16 cases pass: four scenarios in each desktop/narrow and light/dark combination. Accessibility failures enabled. Log .local/core-search-provider-attachments-family-after.log."
    },
    {
      "name": "spec-mapping-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "One missing plugins.md mapped-chapter diagnostic after the story lifecycle assertion changes. Update that existing owner alongside ai.md, without changing requirement or file-size limits. Exact rerun passes five protected files / five chapters. Logs .local/core-search-provider-spec-first-expanded{,-after}.log."
    },
    {
      "name": "evidence-coverage-before",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "One fresh-evidence coverage diagnostic: the plugins.md update has not yet been added to this draft record files list. Add the owned chapter to the evidence; no validator relaxation. Log .local/core-search-provider-validate-budgets.log."
    },
    {
      "name": "tracker-baseline",
      "command": "Committed workflow evidence E-PROGRESS-001 at 733bb679",
      "result": "pass",
      "failures": 0,
      "note": "The separate workflow slice qualifies 11 progress cases, 411 renderer/governance cases, all 50 task links and four specification lanes. This intake retains that baseline without repeating its unchanged shared suites."
    },
    {
      "name": "checkpoint-mapping-before",
      "command": "pnpm spec:check after the tracker split and active checkpoint refresh",
      "result": "fail",
      "failures": 2,
      "note": "Validation, Rust formatting and mdBook pass; spec-first reports the two unchanged mapped governance/migration chapters for the fresh MIGRATION update. Reference this receipt in those owners alongside the existing UTC/activity rule, retaining 400-line limits and unchanged original gates. Log .local/core-search-provider-final-spec-draft.log."
    },
    {
      "name": "checkpoint-mapping-after",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Five protected files / five mapped chapters pass after recording this intake in the governance/migration owners. Both owners remain exactly 400 physical lines. Full catalog and final complete specification lane remain pending. Log .local/core-search-provider-checkpoint-first.log."
    },
    {
      "name": "full-catalog-dark-before",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 2,
      "note": "Desktop/light and narrow/light each pass 500/500. Desktop/dark passes 498/500 with two failures: Upstream Header Review still loads metadata and AI Local Conversations remains booting when their default UI waits expire. Narrow/dark does not run. Log .local/core-search-provider-catalog-final.log."
    },
    {
      "name": "dark-startup-exact-before",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/UpstreamStatus.stories.ts catalog/plugins/ai/shell/LocalConversations.stories.ts -t 'Header Review|Local Conversations'",
      "result": "pass",
      "failures": 0,
      "note": "Both exact cases pass in a fresh process before edits; six non-target cases are excluded. The full-run stack demonstrates assertions before actual startup completion. No product or dependency defect is inferred from a warm pass. Log .local/core-search-provider-dark-startup-before.log."
    },
    {
      "name": "dark-startup-exact-after",
      "command": "Same exact dark pair after joining owned fixture startup",
      "result": "pass",
      "failures": 0,
      "note": "Both pass, six excluded. NotesDemo exposes its real startup completion through a fixture-owned WeakMap, rejects boot failure and releases registration on disposal. Upstream joins it; Local Conversations joins the existing shell fixture. All original UI assertions, their timeouts and the suite deadline are retained. Log .local/core-search-provider-dark-startup-after.log."
    },
    {
      "name": "startup-family-after",
      "command": "pnpm test:storybook catalog/plugins/repository/UpstreamStatus.stories.ts catalog/plugins/ai/shell/LocalConversations.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 32 affected-family cases pass: seven upstream and one local-conversations scenario across desktop/narrow and light/dark. Original assertions and deadlines remain. Log .local/core-search-provider-startup-families.log."
    },
    {
      "name": "startup-typecheck-after",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and warnings. Log .local/core-search-provider-startup-types.log."
    },
    {
      "name": "startup-spec-first-after",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Nine protected files / six chapters pass. Log .local/core-search-provider-startup-first.log."
    },
    {
      "name": "shared-fixture-full-check",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Fresh strict native and Svelte checks pass. Only unchanged E-AI-109 formatting fails, retaining the previously explicit user acceptance; no other formatting finding is accepted. Log .local/core-search-provider-requalification-check.log."
    },
    {
      "name": "shared-fixture-tests-and-builds",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm test; pnpm build; pnpm build-storybook (sequential wrapper)",
      "result": "pass",
      "failures": 0,
      "note": "All 411 renderer/governance, 744 AI and 230 native service cases pass; two subprocess-only helper entries remain exercised by owning tests. Renderer and static catalog builds pass. Native inputs are qualified cfb369f7; later semantic implementation is separate. Logs .local/core-search-provider-requalification-*.log and results JSON."
    },
    {
      "name": "semantic-core-consumer-compatibility",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked; cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat Clippy with --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Two existing file-service cases and strict normal/e2e all-target Clippy pass against committed Notes 8fd7b926. This qualifies native dependency compatibility, not selecting the new semantic facade. The rebuilt SQL API artifact and complete earlier service suite remain tied to cfb369f7. Non-fatal existing compact-unwind warning remains in service build. Logs .local/core-semantic-compatibility-*.log; results JSON records all three zero exits."
    },
    {
      "name": "full-catalog-startup-final",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "All 2000 cases pass: each of desktop/light, narrow/light, desktop/dark and narrow/dark passes 500/500 across107 files, accessibility failures enabled. Four fresh Vitest/browser processes retain original per-test waits and global deadline. The earlier two dark-mode failures are eliminated by owned startup joins; attachment and original startup assertions remain. Log .local/core-search-provider-catalog-startup-final.log."
    },
    {
      "name": "final-progress-and-specification",
      "command": "pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Final progress passes50 tasks/282 evidence records. All four specification lanes pass: validation, Rust formatting, mdBook and spec-first. Logs .local/core-search-provider-final-{progress,spec}-verified.log."
    }
  ],
  "files": [
    "MIGRATION.md",
    "scripts/desktop-api-tests.mjs",
    "tests/desktop/search-provider.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/verification.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-014.md",
    "spec/src/history/core/index.md",
    "spec/src/SUMMARY.md",
    "catalog/plugins/ai/Attachments.stories.ts",
    "spec/src/current/ai.md",
    "spec/src/current/plugins.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/notes/readiness.ts",
    "catalog/plugins/repository/UpstreamStatus.stories.ts",
    "catalog/plugins/ai/shell/LocalConversations.stories.ts",
    "spec/src/current/repository.md"
  ],
  "remaining": []
}
```

This receipt separates native core dependency, retained SQL transport and
browser catalog qualification from native semantic provider and complete facade
adoption.
