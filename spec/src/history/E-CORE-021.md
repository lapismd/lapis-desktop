# Native turn selection and existing chat observer

```json
{
  "id": "E-CORE-021",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M10.2"],
  "requirements": ["LD-GOV-006", "LD-AI-001", "LD-AI-002", "LD-AI-004"],
  "versions": {
    "desktopBaseline": "d098b218",
    "notesNative": "4650a10c",
    "lapisAI": "6548afe0",
    "rust": "1.99.0",
    "pnpm": "10.34.5",
    "notesObserver": "58dc50ac8c039a08c843dddf626486bfc8407d2f",
    "nativeChatArchiveSha256": "8d2d8a3cbaaad7afb23d905b015e5e7698d3e0dd0ee4358bdf4e0f2832066746",
    "archiveReceipts": "20 installed; six Notes entries from 58dc50ac; fourteen peer receipts retained"
  },
  "contractReview": "The staged startup-fixed Core owner admits typed native turn commands and denies legacy ACP execution. The existing public Agent screens observe native state and portable files through one Notes-owned observer. No renderer transcript writer or authoritative background engine is created in the selected profile. Reload detaches; explicit disable and close retain native drain.",
  "milestoneReview": "The staged observer/transport checkpoint is verified against committed Notes archives. R2.2.3 and M10.2 remain Working for mounted chat, retained History routing and trust/recovery. Actual-provider detach/cold application recovery remains R2.3. Source, catalog and hidden IPC do not substitute for those original gates. Node and renderer defaults remain selected; M11 stays Deferred.",
  "runs": [
    {
      "name": "owner-selector-before",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop shared_turn_owner_selection_is_fixed_and_invalid_values_refuse",
      "result": "fail",
      "failures": 1,
      "note": "E0432: selected owner module absent before implementation."
    },
    {
      "name": "owner-selector-after",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop shared_turn_owner_selection_is_fixed_and_invalid_values_refuse",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "native-ai",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop host::ai",
      "result": "pass",
      "tests": 33,
      "failures": 0
    },
    {
      "name": "service-owner",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test core_turn_service",
      "result": "pass",
      "tests": 2,
      "failures": 0
    },
    {
      "name": "renderer",
      "command": "node --import tsx --test tests/renderer/native-chat.test.mjs tests/renderer/shell-startup.test.mjs",
      "result": "pass",
      "tests": 5,
      "failures": 0
    },
    {
      "name": "catalog-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/NativeTurns.stories.ts",
      "result": "fail",
      "tests": 3,
      "failures": 2,
      "note": "Test selectors used Send; public component labels the button Send message."
    },
    {
      "name": "catalog-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/NativeTurns.stories.ts",
      "result": "pass",
      "tests": 3,
      "failures": 0
    },
    {
      "name": "full-native",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm test",
      "result": "pass",
      "note": "All 419 renderer/governance, 744 AI and 242 native cases pass. Two ignored Rust entries are retained subprocess helpers invoked by parent cases.",
      "failures": 0
    },
    {
      "name": "strict",
      "command": "pnpm check:rust; cargo clippy --manifest-path src-tauri/Cargo.toml --features e2e --all-targets --locked -- -D warnings",
      "result": "pass",
      "note": "Normal and e2e all-target checks pass separately.",
      "failures": 0
    },
    {
      "name": "catalog-first-matrix",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "note": "First light/desktop matrix: 502 passes, one User commands global-text selector matches the catalog alert and notifications; 1264.73 seconds. Later matrices are not run after this failure."
    },
    {
      "name": "catalog-owned-alert",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/UserCommands.stories.ts",
      "result": "pass",
      "note": "Both stories pass with the error asserted in the owning catalog alert, preserving unreadable/retained/recovered behavior. Original isolated target also passes separately.",
      "failures": 0
    },
    {
      "name": "node24-archive-fixture",
      "command": "node --import tsx --test --test-name-pattern=installation tests/governance/local-archives.test.mjs",
      "result": "pass",
      "note": "Original pinned Node 24 target has one EISDIR; replacing a fixture symlink with unlinkSync moves the exact target to one pass. Original Node 26 target passes separately. No archive identity assertion is weakened.",
      "failures": 0
    },
    {
      "name": "vault-token-before",
      "command": "node --import tsx --test tests/renderer/native-chat.test.mjs tests/renderer/shell-startup.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Missing owning sessionId in native turn request."
    },
    {
      "name": "vault-token-after",
      "command": "node --import tsx --test tests/renderer/native-chat.test.mjs tests/renderer/shell-startup.test.mjs",
      "result": "pass",
      "tests": 6,
      "failures": 0,
      "note": "Every turn retains the exact owning vault-session token; foreign tokens refuse before Core access."
    },
    {
      "name": "governance-evidence-before",
      "command": "node --import tsx --test tests/governance/contracts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "New pending evidence omitted explicit zero failure counts in four passing run entries; the checker refuses that evidence shape."
    },
    {
      "name": "governance-evidence-after",
      "command": "node --import tsx --test tests/governance/contracts.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 8
    },
    {
      "name": "fresh-renderer-ai",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs && pnpm test:ai",
      "result": "pass",
      "failures": 0,
      "note": "Renderer/governance phase: 420 passes; AI phase: 744 passes. Native executable cases pass; the following doctest attempt is recorded separately."
    },
    {
      "name": "doctest-artifacts-before",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "fail",
      "failures": 1,
      "note": "Doctest compilation records eight E0463 dependency lookups while a concurrent acceptance build changes the same Cargo artifact set. Executable native cases pass."
    },
    {
      "name": "doctest-artifacts-after",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 cargo test --manifest-path src-tauri/Cargo.toml --locked --doc",
      "result": "pass",
      "failures": 0,
      "tests": 0,
      "note": "Exact serial doctest compilation passes without changes."
    },
    {
      "name": "native-final-serial",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "tests": 242,
      "note": "Complete serial native suite and doctest compilation pass. Two ignored subprocess helpers are exercised by their owning parent cases."
    },
    {
      "name": "ipc-first",
      "command": "pnpm test:desktop:api",
      "result": "fail",
      "failures": 1,
      "tests": 7,
      "note": "Six passes, including the new Core/vault-token case; one existing admission case misses renderer readiness before driver evaluation."
    },
    {
      "name": "ipc-admission-exact",
      "command": "node --import tsx --test tests/desktop/ai-admission.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 1,
      "note": "Unchanged exact target passes on the fresh bundle."
    },
    {
      "name": "ipc-seven-after",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/core-file-service.test.mjs tests/desktop/search-provider.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-service-lifetime.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 7,
      "note": "Complete hidden native API suite passes in 39.32 seconds; native visibility and keyboard focus remain false."
    },
    {
      "name": "mobile-catalog-interrupted",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "note": "Restarted light/desktop matrix reports one Mobile failure and is stopped for exact reproduction before completion. No full-matrix total is claimed."
    },
    {
      "name": "mobile-catalog-exact",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/shell/Mobile.stories.ts",
      "result": "pass",
      "failures": 0,
      "tests": 1,
      "note": "Fresh exact target passes unchanged in 13.19 seconds; final full matrix remains required."
    },
    {
      "name": "committed-source-archives",
      "command": "pnpm local:pack ../lapis-notes --already-built; pnpm local:install .local/turn-chat-committed-archives.json; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Five Notes public packages and the rebuilt private app-profile entry are packed from clean committed source 58dc50ac8c039a08c843dddf626486bfc8407d2f. All twenty archive checksums/import routes validate; fresh types report zero errors/warnings. Other fourteen peer receipts retain their earlier source qualification."
    },
    {
      "name": "committed-exact-catalog",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/NativeTurns.stories.ts catalog/plugins/ai/UserCommands.stories.ts catalog/plugins/ai/shell/Mobile.stories.ts",
      "result": "pass",
      "failures": 0,
      "tests": 6,
      "note": "Fresh public-archive cold run: all three native observer cases, both User commands cases and Mobile pass."
    },
    {
      "name": "committed-light-desktop",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts",
      "result": "pass",
      "failures": 0,
      "tests": 503,
      "note": "First full mode: light/desktop, 598.19 seconds. The canonical command continues through three remaining modes; no complete matrix claim yet."
    },
    {
      "name": "ordinary-bundle-and-audit",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Fresh committed archives; macOS ARM64 app has zero native/renderer automation markers. Signing remains Deferred; no installed application is replaced."
    },
    {
      "name": "static-catalog",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Fresh static build completes against committed public exports."
    },
    {
      "name": "committed-acceptance-bundle",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "committed-hidden-api",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/core-file-service.test.mjs tests/desktop/search-provider.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-service-lifetime.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 7,
      "note": "Fresh acceptance bundle with committed public archives; all seven cases pass in 43.73 seconds."
    },
    {
      "name": "combined-check-existing-format",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Specification, types and strict normal Rust pass. Formatter reports only the previously accepted immutable E-AI-109. Its bytes match the parent exactly; SHA-256 16e50704e76ed720fdf280a28167714c23079fd13facd803580ca0aced74e93a. The separate Rust formatting check passes. No historical file is edited."
    },
    {
      "name": "committed-light-narrow",
      "command": "LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts",
      "result": "pass",
      "failures": 0,
      "tests": 503,
      "note": "Second full mode completes in 562.72 seconds. Two dark modes remain active."
    },
    {
      "name": "committed-dark-desktop",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts",
      "result": "pass",
      "failures": 0,
      "tests": 503,
      "note": "Third full mode completes in 568.86 seconds; narrow/dark remains active."
    },
    {
      "name": "committed-full-catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "tests": 2012,
      "note": "All four cold modes pass 503 cases each: desktop/light 598.19s, narrow/light 562.72s, desktop/dark 568.86s, narrow/dark 570.98s. No assertion, baseline or test policy is relaxed."
    }
  ],
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/ai/NativeTurns.stories.ts",
    "catalog/plugins/ai/UserCommands.stories.ts",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/ai/native-turns/NativeTurnDemo.svelte",
    "catalog/support/ai/native-turns/fixture.ts",
    "package.json",
    "scripts/desktop-api-tests.mjs",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-adapter.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CORE-021.md",
    "spec/src/history/index.md",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/components/views/notes-bundled-plugins.ts",
    "src/lib/desktop/shell-startup.ts",
    "src/lib/native/ai/native-chat.ts",
    "src/lib/notes/notes-navigation.ts",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/ai/mod.rs",
    "src-tauri/src/host/ai/owner.rs",
    "src-tauri/src/host/ai/policy/tests.rs",
    "src-tauri/src/host/ai/policy.rs",
    "src-tauri/src/host/ai/turns/mod.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/shell.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/tests/core_turn_service.rs",
    "tests/desktop/ai-turn-owner.test.mjs",
    "tests/governance/local-archives.test.mjs",
    "tests/governance/source-audit.test.mjs",
    "tests/renderer/native-chat.test.mjs",
    "tests/renderer/shell-startup.test.mjs"
  ],
  "remaining": [
    "Mounted chat, retained History routing and trust/recovery through both actual hosts retain R2.2.3 gates.",
    "Actual-provider detach/cold recovery remains Notes R2.3; no M10.2 gate is completed."
  ]
}
```

The staged observer/transport checkpoint is verified. Original mounted
application and provider gates remain open; no default profile is promoted. The
immutable E-AI-109 formatting exception remains explicitly accepted. The earlier
Markdown image exception applies to R1.3 intake only.
