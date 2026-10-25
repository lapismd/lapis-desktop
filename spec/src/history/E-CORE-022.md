# Retained native chat and History navigation

```json
{
  "id": "E-CORE-022",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M10.2"],
  "requirements": [
    "LD-GOV-006",
    "LD-AI-001",
    "LD-AI-002",
    "LD-AI-004",
    "LD-CAT-001",
    "LD-CAT-002"
  ],
  "versions": {
    "desktopBaseline": "83b82d7f",
    "notesBaseline": "58dc50ac",
    "lapisAI": "6548afe0",
    "pnpm": "10.34.5",
    "notesArchive": "committed private profile; nineteen peers retained",
    "pluginServices": "6af2420ff720cf8ce04581306c9c7b8d12b126e4",
    "notesSource": "7161a447ef365df498371d7bad491df5f5da431c",
    "jjStore": "4e74e423966180576da89229e02da49dcd014dfd",
    "profileSha256": "d1846fd2757115a7076c37d0e37132b4778208f04cd9da07b2ae3bdfa0bfd6ba"
  },
  "contractReview": "The Notes-owned App navigator preserves History in its sidebar, selects exact main scope/conversation pairs and preserves other drafts. Public Agent screens remain unchanged. Read-only native metadata and immutable first-prompt fallback provide saved titles without reading every transcript or creating a renderer writer.",
  "milestoneReview": "R2.2.3 retained chat and History adoption passes through the actual Rust-hosted and Tauri production screens, including fixture-provider cold restart without replay. R2.3 actual-provider detach/cold application recovery remains open. M10.2 and default cutover remain open; no signing, publication or Node retirement is claimed.",
  "runs": [
    {
      "name": "native-chat-before",
      "command": "node --test tests/desktop/ai-core-chat.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "After correcting a test-only invalid WebDriver selector, the actual native fixture turn completes and History surface is body instead of right-sidebar."
    },
    {
      "name": "native-catalog-focused",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/NativeTurns.stories.ts",
      "result": "pass",
      "tests": 4,
      "failures": 0
    },
    {
      "name": "renderer-governance",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "tests": 420,
      "failures": 0,
      "note": "Initial 419/1 governance result required an explicit remaining field in this receipt; exact and complete reruns pass."
    },
    {
      "name": "ai",
      "command": "pnpm test:ai",
      "result": "pass",
      "tests": 744,
      "failures": 0
    },
    {
      "name": "candidate-catalog-light",
      "command": "pnpm test:storybook",
      "result": "pass",
      "tests": 1008,
      "failures": 0,
      "note": "Desktop/light and narrow/light each pass 504 cases in 108 files. Dark modes remain running; this is candidate profile evidence, not committed-archive adoption."
    },
    {
      "name": "complete-candidate-catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "tests": 2016,
      "failures": 0,
      "note": "Four sequential viewport/theme modes each pass 504 cases in 108 files. Final callback-only formatting produces identical compiled JS/CSS; final committed-profile cold stories pass separately."
    },
    {
      "name": "committed-archives",
      "command": "pnpm local:install .local/chat-navigation-committed/manifest.json",
      "result": "pass",
      "note": "Twenty archives and twenty import routes validate; only the private profile is refreshed from Notes 7161a447. Tracked manifest/lock remain unchanged.",
      "failures": 0
    },
    {
      "name": "committed-profile-focused",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/NativeTurns.stories.ts",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "note": "Cold after the committed archive install; strict Svelte types also pass with zero errors/warnings."
    },
    {
      "name": "native-normal-e2e",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings; cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "tests": 242,
      "failures": 0,
      "note": "Normal and e2e strict Clippy pass; service suite has two intentional ignored cases."
    },
    {
      "name": "native-bundles",
      "command": "pnpm desktop:bundle -- --debug; pnpm check:bundle; pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Fresh ordinary and e2e bundles pass; ordinary audit finds zero automation markers across 328 renderer JavaScript files."
    },
    {
      "name": "native-chat-after",
      "command": "node --import tsx --test tests/desktop/ai-core-chat.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "note": "Actual composer saves reply café 📝, History stays in right sidebar, exact main tab is reused, clean Quit/cold app restart retains reply and protocol log has one prompt. Evidence .local/native-test/core-chat-tSIgaY."
    },
    {
      "name": "native-files-after",
      "command": "node --import tsx --test tests/desktop/core-file-service.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "final-renderer-governance",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "tests": 420,
      "failures": 0,
      "note": "Final receipt initially omitted required failures:0 in archive runs; exact progress 11 and complete 420-case reruns pass after correcting the receipt only."
    },
    {
      "name": "final-ai",
      "command": "pnpm test:ai",
      "result": "pass",
      "tests": 744,
      "failures": 0
    },
    {
      "name": "final-hidden-ipc",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/core-file-service.test.mjs tests/desktop/search-provider.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-service-lifetime.test.mjs",
      "result": "pass",
      "tests": 7,
      "failures": 0,
      "note": "Uses the freshly built e2e application; no redundant rebuild."
    },
    {
      "name": "final-static",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "architecture-and-ownership",
      "command": "pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "format-existing-exception",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 1,
      "note": "New receipt/summary formatting corrected. Only immutable E-AI-109 remains; SHA256 16e50704e76ed720fdf280a28167714c23079fd13facd803580ca0aced74e93a is unchanged. Explicitly accepted historical exception; no historical file edited."
    }
  ],
  "files": [
    "catalog/plugins/ai/NativeTurns.stories.ts",
    "catalog/COVERAGE.md",
    "tests/desktop/ai-core-chat.test.mjs",
    "tests/desktop/native-turn-fixture.mjs",
    "spec/src/current/ai-adapter.md",
    "MIGRATION.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "src-tauri/Cargo.lock",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md"
  ],
  "remaining": [
    "R2.3 actual-provider detach and cold application recovery; R3-R7 and original M10 gates remain open.",
    "New Docker-first tooling and dependency refresh are separate slices, with their own source and consumer qualification.",
    "Visual review stays pending; renderer/Node defaults and M11 deferral remain unchanged."
  ]
}
```

Source and actual-host qualification are separate. The protocol peer uses the
production native admission and portable writer but is not a real provider.
Native acceptance uses isolated profiles and explicitly headed windows; the
quiet default stays unchanged. Complete catalog and committed archive intake
pass. Final logs are retained under `.local/chat-navigation-committed/`. Visual
review remains pending and no baseline is changed.
