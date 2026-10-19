# Historical checkpoint search and exact version navigation

```json
{
  "id": "E-REPO-034",
  "tasks": ["M14", "M14.6"],
  "requirements": [
    "LD-REPO-005",
    "LD-REPO-002",
    "LD-DESK-003",
    "LD-HOST-001",
    "LD-CAT-003",
    "LD-GOV-004",
    "LD-MIG-002"
  ],
  "date": "2026-10-19",
  "result": "pending",
  "revision": "enclosing-change",
  "versions": {
    "sourceRecovery": "e500adb1",
    "desktopRecovery": "c05a7d7d",
    "jj": "0.45.1",
    "git": "2.55.0",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "sourceSearch": "482807c4"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/Search.stories.ts",
    "catalog/support/repository/SearchDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "docs/provenance.json",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-034.md",
    "src-tauri/Cargo.lock",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/search.rs",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-tools.ts",
    "src/components/repository/search/HistorySearchPanel.svelte",
    "src/components/repository/search/HistorySearchResults.svelte",
    "src/components/repository/search/search-view.ts",
    "src/lib/native/repository/search.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/history-controller.ts",
    "src/lib/repository/history-graph.ts",
    "src/lib/repository/history-reader.ts",
    "src/lib/repository/open-history-revision.ts",
    "src/lib/repository/search-controller.ts",
    "src/lib/repository/search.ts",
    "tests/renderer/repository-search.test.mjs"
  ],
  "contractReview": "LD-REPO-005 owns immutable historical text/path/metadata search, exact checkpoint/version navigation, path-only limits, projection rebuild and native restore revalidation. LD-REPO-002 selection fencing is preserved for out-of-page exact commits. LD-DESK-003/HOST-001 retain native worker/admission and no renderer source authority. LD-CAT-003 inventory/provenance expands; LD-GOV-004/MIG-002 original gates remain unchanged.",
  "milestoneReview": "M14.5 is Partial with focused original push recovery; M14.6 is the only active stage. Search implementation and focused proof do not complete its original cold native product gate. Root storage/adoption/source selector, Forgejo and main integration remain required.",
  "scope": "Native main-window search command, one bounded worker and owned session-derived paths; injected source projection consumed by production plugin search UI. Native transport/service closure drains pending search; renderer queries fence late responses. Exact commit navigation uses existing native commit read, without widening authority. Guarded restore is reused. No live provider, credential, review restart or main integration.",
  "runs": [
    {
      "name": "source-proof",
      "command": "Source E-VAULT-BACKUP-010: pnpm dev:cargo -- test -p jj-vault; pnpm dev:cargo -- test -p jj-store-jj --no-default-features --features vault-backup --test vault_history --test vault_backup --test vault_remote --test vault_restore --test vault_restore_all --test vault_sync --test vault_publication",
      "result": "pass",
      "failures": 0,
      "note": "Separate evidence records20actual native cases, nine coordinator/native-worker/search cases and strict Clippy. Lost deleted-file text, exact line/revision, metadata filters, corruption/loss rebuild, current exclusions and unknown anchor rejection pass. Immutable reader works while the capture writer lease is held; no snapshot or operation change. Not actual desktop/provider acceptance."
    },
    {
      "name": "renderer-initial",
      "command": "node --import tsx --test tests/renderer/repository-search.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Initial authored test imported a nonexistent fixture path. Corrected to maintained fixture.ts; subsequent four new tests and45related cases passed. search-renderer-first/second/qualified logs."
    },
    {
      "name": "types-initial",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 16,
      "note": "Two initial UI attempts each found five errors: a state/rune name collision and nonconforming view command id/name. Correct those; subsequent story typing found six unsupported ByRole exact options. Use exact string names with the documented role query, preserving assertions. Initial source types passed before UI. search-ui-first/second and search-types-final logs."
    },
    {
      "name": "architecture-initial",
      "command": "pnpm check:architecture",
      "result": "fail",
      "failures": 2,
      "note": "Search panel exceeded300counted lines and main capability inventory did not include the new exact native command. Split maintained result composition into its own production component; add only this command to the fail-closed inventory. Audit passes. search-architecture-first/qualified logs."
    },
    {
      "name": "catalog-initial",
      "command": "pnpm test:storybook catalog/plugins/repository/Search.stories.ts",
      "result": "fail",
      "failures": 12,
      "note": "First two attempts each failed six stories: the row time control was an interactive descendant of an option, and remaining stories encountered modal pointer suppression after that failure. Replace it with the maintained noninteractive RepositoryComparisonTime and await actual input readiness; no axe rule or assertion weakened. search-catalog-first/second logs."
    },
    {
      "name": "catalog-new-family",
      "command": "pnpm test:storybook catalog/plugins/repository/Search.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Six new stories x4fresh width/theme runs=24interaction/axe executions pass. New query, filters, continuation, skeleton loading, shadcn empty, App toast recovery and restore actions. search-catalog-third.log."
    },
    {
      "name": "navigation-catalog-before",
      "command": "pnpm test:storybook catalog/plugins/repository/Search.stories.ts catalog/plugins/repository/History.stories.ts catalog/plugins/repository/FileHistory.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Stronger real navigation proof exposed modal leave pointer suppression immediately after restore (28other stories passed). Await the actual Open version pointer-ready state; exact Text And File Restore then passes with actual blame navigation. search-catalog-qualified and search-navigation-exact logs."
    },
    {
      "name": "exact-selection-before",
      "command": "node --import tsx --test --test-name-pattern='late exact revision' tests/renderer/repository-search.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "New concurrency proof found a late exact-commit reply replacing a newer selected graph row. Pass the comparison-generation predicate into HistoryGraph.exact before publishing either graph or selection; preserve the assertion. search-exact-race-before.log."
    },
    {
      "name": "renderer-qualified",
      "command": "node --import tsx --test tests/renderer/repository-search.test.mjs tests/renderer/repository-history.test.mjs tests/renderer/repository-history-paging.test.mjs tests/renderer/repository-parent-picker.test.mjs tests/renderer/repository-selection.test.mjs tests/renderer/repository-inspection.test.mjs tests/renderer/repository-file-history.test.mjs tests/renderer/repository-native.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All46cases pass, including five search proofs. Old query response fencing/drain, empty page continuation, failed original-cursor retry, filter/path/token whitelisting, malformed response rejection, exact out-of-page commit selection and late-exact selection race. search-renderer-accepted.log."
    },
    {
      "name": "native-admission",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo clippy --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop -- -D warnings; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo test --manifest-path src-tauri/Cargo.toml --bin lapis-desktop host::repository",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary lib/bin strict Clippy and nine exact repository frame/admission tests pass. Search cannot supply index/source paths, caller authority, exclusions or credentials; native code derives stable vault binding and revalidates after the worker read. Search takes no capture/file IO lock and remains available while capture is paused. search-native-clippy/frames logs."
    },
    {
      "name": "affected-catalog-qualified",
      "command": "pnpm test:storybook catalog/plugins/repository/Search.stories.ts catalog/plugins/repository/History.stories.ts catalog/plugins/repository/FileHistory.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All29directly affected stories x4fresh width/theme runs=116interaction/axe executions pass. Search proves actual plugin registration, file restore then blame navigation, metadata checkpoint navigation, fixed-anchor older continuation, loading skeleton, shadcn empty and App toast recovery. Existing JJ Log and active-file history families pass after exact-selection support. search-catalog-accepted.log. No baselines changed."
    },
    {
      "name": "governance-before-ledger",
      "command": "node --test tests/governance/source-audit.test.mjs tests/governance/native-readiness.test.mjs tests/governance/contracts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "During new evidence authoring the running ledger test observed M14.6 In progress without selected evidence. E-REPO-034 is now selected; rerun the same target after bookkeeping. No product assertion weakened. search-governance.log."
    },
    {
      "name": "controller-size-followup",
      "command": "pnpm check:architecture",
      "result": "fail",
      "failures": 1,
      "note": "Formatting the added exact-selection generation predicate pushed the main controller over300counted lines. Move its existing native conflict-read/validation into the owning HistoryGraph helper, preserving commit/change and current-selection checks. All46renderer cases pass again; dedicated loading/live conflict stories are being checked. No size limit was raised."
    },
    {
      "name": "bookkeeping-qualified",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; node --test tests/governance/source-audit.test.mjs tests/governance/native-readiness.test.mjs tests/governance/contracts.test.mjs; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Svelte0errors/0warnings, source/App audits,41tasks/139records progress,21governance cases, sixvalidators/161chapters/95requirements and spec-first28protected files/sixcanonical chapters pass. The existing conflict-reader extraction retains LD-REPO-002 contracts and comparison-generation fencing. Final46renderer cases also pass. search-governance-qualified, search-renderer-final and search-bookkeeping logs."
    },
    {
      "name": "current-source-consumer",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo clippy --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop -- -D warnings; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "Consumer compiles against committed source482807c4including the bounded cache; strict native Clippy and Rust formatting pass. search-native-final.log. Earlier nine actual frame cases remain applicable; no caller/permission changes followed them."
    },
    {
      "name": "conflict-reader-consumers",
      "command": "pnpm test:storybook catalog/plugins/repository/LivePlugin.stories.ts catalog/plugins/repository/Loading.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Allnineadditional direct conflict/loading consumers x4fresh width/theme runs=36interaction/axe executions pass after moving the unchanged native conflict read into HistoryGraph. Combined with search/log/file-history152focused catalog executions pass. search-conflict-consumers.log. Full catalog and native app/provider qualification remain separate."
    }
  ],
  "remaining": [
    "Focused actual native-app search/backup/restore/sync lifecycle and live provider acceptance remain open; full suite/platform/release checks remain user-deferred.",
    "Root storage/adoption, existing-repository source selector, Forgejo and main integration remain required."
  ]
}
```
