# Unified indexed history in Search

```json
{
  "id": "E-REPO-045",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14", "M14.6"],
  "requirements": ["LD-REPO-002", "LD-REPO-005", "LD-CAT-003"],
  "versions": {
    "platform": "macOS ARM64",
    "jj": "0.45.1",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "api": "0.1.4 public archive",
    "search": "0.1.3 public archive",
    "source": "jj-store E-VAULT-BACKUP-017"
  },
  "contractReview": "Unified indexed history now extends the existing Search plugin through the App-owned provider registry. Disposable native indexing runs on bounded workers and reports App status; capture never awaits it. Exact operation/commit/path activation and guarded restore authority are unchanged. Main-window capability explicitly admits the new path-free command. Storage moves drain the same search semaphore.",
  "milestoneReview": "Focused implementation and native IPC/current-file rendering proofs complete; M14/M14.6 remain Partial at original wider cold full Search/restore and provider gates. Later unsnapshotted bytes remain preserved by the native index proof. No milestone gate is weakened or promoted.",
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/Search.stories.ts",
    "catalog/support/repository/SearchDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-clients.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/navigation.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-AI-065.md",
    "spec/src/history/E-REPO-045.md",
    "spec/src/history/index.md",
    "src-tauri/Cargo.lock",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/indexed_search.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/storage.rs",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-tools.ts",
    "src/components/repository/search/HistorySearchPanel.svelte",
    "src/components/repository/search/HistorySearchResults.svelte",
    "src/components/repository/search/search-provider.ts",
    "src/components/repository/search/search-view.ts",
    "src/lib/native/repository/indexed-search.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/history-index-controller.ts",
    "src/lib/repository/history-search-expression.ts",
    "src/lib/repository/indexed-search.ts",
    "src/lib/repository/search.ts",
    "tests/desktop/navigation-search.test.mjs",
    "tests/desktop/repository-indexed-search.test.mjs",
    "tests/renderer/repository-indexed-search.test.mjs"
  ],
  "runs": [
    {
      "name": "native-admission-before",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --bin lapis-desktop host::repository::indexed_search::tests -- --nocapture",
      "result": "fail",
      "failures": 1,
      "note": "Serde unit enum accepted extra action fields. Changed Step to an empty struct variant; same exact target then passes 1/1."
    },
    {
      "name": "cold-native-before",
      "command": "node --test --test-concurrency=1 tests/desktop/repository-indexed-search.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Missing generated command permission prevented native invocation. Added build.rs command and main-window capability."
    },
    {
      "name": "cold-native-after",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json --config {\"build\":{\"beforeBuildCommand\":\"\"}}; node --test --test-concurrency=1 tests/desktop/repository-indexed-search.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Reused freshly built acceptance renderer; rebuilt native capability. Exact saved version/context survives cold close/reopen, missing history remains neutral, and later disk edits and vault metadata placement stay unchanged. history-index-cold-qualified.log."
    },
    {
      "name": "native-lints",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check; cargo clippy --manifest-path src-tauri/Cargo.toml --bin lapis-desktop --locked -- -D warnings; cargo clippy --manifest-path src-tauri/Cargo.toml --bin lapis-desktop --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Normal and e2e strict bin checks pass. Native test build retains the pre-existing macOS compact-unwind linker warning."
    },
    {
      "name": "renderer-index",
      "command": "node --import tsx --test tests/renderer/repository-indexed-search.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "3 tests pass in history-index-final-renderer.log: serialized index jobs/generation, bounded admitted query/context and disposal."
    },
    {
      "name": "catalog-accessibility-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts --no-file-parallelism catalog/plugins/repository/Search.stories.ts catalog/plugins/ai/Clients.stories.ts catalog/plugins/ai/Settings.stories.ts catalog/plugins/terminal/Terminal.stories.ts --bail=1",
      "result": "fail",
      "failures": 1,
      "note": "Old explicitly labelled expanded version container failed axe 4.14 label-content-name-mismatch. Source now uses natural container names and named full-width header buttons. No axe rule suppressed. Subsequent run had 21 passing cases and one outdated Checkpoints label selector; selector now includes visible count."
    },
    {
      "name": "real-current-files-rendering",
      "command": "LAPIS_AI_CLIENT_INSTALL_TEST=1 node --test --test-concurrency=1 tests/desktop/ai-client-tooling.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Actual Notes native WebKit searches a real current-file fixture and proves a visible match row within a nonzero bounded viewport. Current-file totals count resolved live files; exact original user query was unavailable. No claim of reproducing every stale-index instance."
    },
    {
      "name": "final-focused-catalog",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts --no-file-parallelism catalog/plugins/repository/Search.stories.ts catalog/plugins/ai/Clients.stories.ts catalog/plugins/ai/Settings.stories.ts catalog/plugins/terminal/Terminal.stories.ts --bail=1",
      "result": "pass",
      "failures": 0,
      "note": "32/32 interaction/axe stories in four files pass in search-clients-terminal-final-catalog-2.log. This includes the exact expanded metadata regression, compact history spacing, narrow Sort and current-file viewport geometry. Visual baselines remain pending."
    },
    {
      "name": "final-native-lints",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check; cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Normal and e2e strict all-targets checks pass in ai-clients-final-{clippy,e2e-clippy}.log. Earlier real native install/handshake/shell acceptance remains separate."
    },
    {
      "name": "source-public-package",
      "command": "pnpm --filter @lapis-notes/search check; pnpm --filter @lapis-notes/search test; pnpm exec vitest run --project storybook --no-file-parallelism stories/plugins/search; pnpm --filter @lapis-notes/search build; pnpm --filter @lapis-notes/search --config.ignore-scripts=true pack --pack-destination .local/packages/history-search-natural-final; pnpm plugin:build -- --plugin search --out-dir .local/history-search-natural-release; pnpm plugin:verify .local/history-search-natural-release",
      "result": "pass",
      "failures": 0,
      "note": "Search source cd8debd7: 44 unit tests, 13 cold stories, check/build/publint/public pack and deterministic ZIP/signature validation pass. Payload SHA256 b629e8e0c1d4fe6748cd7aa529610fafeba9b5a11ae8542ed5bfa41f7fa67dde. Audit has only the two pre-existing ignored advisories; none added."
    },
    {
      "name": "final-public-archive-acceptance",
      "command": "pnpm local:install .local/archives/unified-history-search.json; pnpm exec vitest run --config vitest.catalog.config.ts --no-file-parallelism catalog/plugins/repository/Search.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 14 coherent archive routes verified; portable tracked manifests/lockfile preserved. Final Search source cd8debd7 archive passes all 7 consumer interaction/axe stories in search-final-archive-catalog.log. Only source whitespace formatting differs from the preceding 32-story qualified run."
    },
    {
      "name": "review-services",
      "command": "pnpm ai:prepare -- --reuse; CARGO_BUILD_JOBS=2 pnpm exec tauri dev --no-watch; pnpm storybook:restart -- --port 7491",
      "result": "pass",
      "failures": 0,
      "note": "Complete staged bundle verifies; current main normal review process reaches renderer ready at 1431 (ai-clients-final-review-app-2.log). Storybook 7491 restarted and Installed clients inside AI settings visibly inspected. Existing profile/vault preserved. Initial stop script rejected an integer ps argument before signaling; premature replacement launch reported occupied port. Corrected owner check then stopped only the old review process group and replacement succeeded. Existing compact-unwind/asset-URL warnings retained."
    },
    {
      "name": "governance",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Progress, spec and spec-first pass (41 tasks/181 evidence; 208 chapters; 67 protected files/8 canonical chapters). Initial draft pass records incorrectly kept deferred wider gates under remaining; moved them to explicit deferredQualification while preserving milestone gates. Formatting initially found 14 files; normal formatting and small prose compression retain document bounds."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Original wider cold visible full Search/restore, remote-provider, platform and release qualification remain open.",
    "Source Search/API/Design Core prerequisites use ignored coherent public archives; publication remains a later gate."
  ],
  "archives": [
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "tarball": "/Users/stevejuma/code/lapismd/lapis-notes/.local/packages/history-search-reveal/lapis-notes-api-0.1.4.tgz",
      "sha256": "1b95d2f2f4b072ceda98c1f67429920352b2a2dfcbafa87be2379619dfb90cd2",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "a8e0cfa4483877b3d1d2cfe6362948a151f21513",
        "packageDirectory": "packages/api"
      }
    },
    {
      "name": "@lapismd/design-core",
      "version": "0.5.1",
      "tarball": "/Users/stevejuma/code/lapismd/design-core/.local/packages/lapismd-design-core-0.5.1-history-syntax-refresh.tgz",
      "sha256": "19b6fc125cc7921c0cf4e54f8ceb793c023bb72a716b4672fdfceb232a96e504",
      "source": {
        "repository": "git+https://github.com/lapismd/design-core.git",
        "revision": "90a79b875bf280ebbb97efdb054b369c6488c3e7",
        "packageDirectory": "."
      }
    },
    {
      "name": "@lapis-notes/search",
      "version": "0.1.3",
      "tarball": "/Users/stevejuma/code/lapismd/lapis-plugins/.local/packages/history-search-natural-final/lapis-notes-search-0.1.3.tgz",
      "sha256": "40484714d2eb1c0c75e93a4b177db42f132aa211781f3bd7daf9b577dece8e4f",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-plugins.git",
        "revision": "cd8debd7cff7c18554e561dce9b9d3b4e49b3cb8",
        "packageDirectory": "packages/search"
      }
    }
  ]
}
```
