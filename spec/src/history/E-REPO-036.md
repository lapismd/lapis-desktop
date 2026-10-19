# Recoverable vault history storage selection

```json
{
  "id": "E-REPO-036",
  "tasks": ["M14", "M14.7"],
  "requirements": [
    "LD-REPO-005",
    "LD-FILE-002",
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
    "sourceStorage": "cea94fb2",
    "desktopParent": "798424a7",
    "jj": "0.45.1",
    "git": "2.55.0",
    "rust": "1.99.0",
    "node": "v26.9.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/HistoryStorage.stories.ts",
    "catalog/support/repository/StorageDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-036.md",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/backup.rs",
    "src-tauri/src/host/repository/commands.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/remote.rs",
    "src-tauri/src/host/repository/search.rs",
    "src-tauri/src/host/repository/storage.rs",
    "src-tauri/src/host/repository/sync.rs",
    "src-tauri/src/repository/mod.rs",
    "src-tauri/src/repository/storage.rs",
    "src-tauri/src/watch/mod.rs",
    "src-tauri/src/watch/pending.rs",
    "src-tauri/src/watch/registry.rs",
    "src-tauri/src/watch/snapshot.rs",
    "src-tauri/tests/repository_storage.rs",
    "src/components/repository/backup/BackupSettings.svelte",
    "src/components/repository/backup/StorageSettings.svelte",
    "src/components/repository/backup/forge-view.ts",
    "src/components/repository/backup/storage-settings.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/native/repository/storage.ts",
    "src/lib/repository/history-reader.ts",
    "src/lib/repository/storage-controller.ts",
    "src/lib/repository/storage.ts",
    "tests/renderer/repository-storage.test.mjs"
  ],
  "contractReview": "LD-REPO-005 owns explicit external/root storage selection with a native original-request journal, archive and guarded reload. LD-FILE-002 preserves ordinary scoped watching and adds only native-owned backup exclusions. LD-DESK-003/HOST-001 retain exact main-window admission, injected owned paths and bounded workers. LD-CAT-003 adds production settings/loading/recovery stories. LD-GOV-004/MIG-002 original qualification gates remain unchanged. Storage layout resolution uses a dedicated native worker permit independent of network-transfer availability.",
  "milestoneReview": "Only M14.7 is active. Focused native storage, renderer and catalog proof does not complete cold native/provider acceptance, existing-repository adoption/source selection or main integration. Earlier stages remain Partial and full Rust/UI/catalog and platform/release lanes remain deferred by the user.",
  "scope": "Advanced storage settings, native binding resolution shared by capture/history/search/sync, original-request move recovery and explicit guarded reload. Plugin-owned mutation/progress survives settings closure. The backup watcher ignores metadata names in hints and inventory, preventing self-capture in the root layout. No ordinary vault, review app or main workspace has been migrated.",
  "runs": [
    {
      "name": "source-storage-proof",
      "command": "Source E-VAULT-BACKUP-012: CARGO_INCREMENTAL=0 pnpm dev:cargo -- test -p jj-store-jj --no-default-features --features vault-backup --test vault_storage --test vault_backup --test vault_remote --test vault_publication",
      "result": "pass",
      "failures": 0,
      "note": "Source cea94fb2:16native tests, focused strict Clippy and jj-vault consumer check pass. Archives, original receipt bytes/path lineage, interrupted copy/install and rollback retain native identities. Separate source evidence records the initial nested-lease failure and guarded disk cleanup."
    },
    {
      "name": "native-initial-resolution",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked --test repository_storage --test repository_backup --test repository_admission",
      "result": "pass",
      "failures": 0,
      "note": "Initial12native tests pass. Both layout directions and reopen retain exact checkpoint identities; read-only resolution refuses a pending move without initialization and startup recovers the original request. Existing admission and real directory capture pass. storage-native.log. Linker emits its non-fatal compact-unwind section-size warning."
    },
    {
      "name": "native-filtered-watch",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked --test repository_storage --test repository_backup --test repository_admission --test vault_watch",
      "result": "pass",
      "failures": 0,
      "note": "All18native service tests pass. New actual watcher test skips a2100-file metadata directory, ignores its writes and still reports note edits. Generic native watching retains five existing scope, overflow, rename and close proofs. storage-native-filtered.log."
    },
    {
      "name": "native-command-hints-clippy",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop host::repository; CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked --lib watch::pending; CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --locked --lib --bin lapis-desktop --test repository_storage --test repository_backup --test repository_admission --test vault_watch -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Ten exact native frame/admission cases, three bounded hint cases and focused strict lib/bin/service Clippy pass. Renderer paths, archive/control roots, vault identity and caller authority remain rejected. storage-native-frames/watch-hints/native-clippy logs."
    },
    {
      "name": "renderer-ownership",
      "command": "node --import tsx --test tests/renderer/repository-storage.test.mjs tests/renderer/repository-native.test.mjs tests/renderer/repository-backup.test.mjs tests/renderer/repository-remote.test.mjs tests/governance/source-audit.test.mjs; pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "All39renderer/governance cases pass. Original request recovery, no duplicate move after unknown result, canceled editor guard, reload-only retry, late-state fencing and drain beyond observer close pass. Strict Svelte types report0errors/0warnings. Exact source/App ownership audits pass. storage-renderer-final/types-final logs."
    },
    {
      "name": "catalog-initial",
      "command": "pnpm test:storybook catalog/plugins/repository/HistoryStorage.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "First cold run cannot import the suite after Vite optimizes the new folder-cog icon and reloads. No tests execute. Retain storage-catalog.log; rerun the same target after optimization settles."
    },
    {
      "name": "catalog-contrast",
      "command": "pnpm test:storybook catalog/plugins/repository/HistoryStorage.stories.ts",
      "result": "fail",
      "failures": 4,
      "note": "All interactions work; four final states fail axe because the surrounding Field label is dimmed while waiting for reload. Disable the controls while retaining the readable label. No contrast rules or thresholds are weakened. storage-catalog-retry.log."
    },
    {
      "name": "catalog-focused",
      "command": "pnpm test:storybook catalog/plugins/repository/HistoryStorage.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Seven stories x4fresh width/theme runs=28interaction/axe executions pass after fixing the label. A repeat after promoting storage ownership from the settings tab to the enabled plugin also passes all28. The final closure story is checked separately. storage-catalog-final/owned logs."
    },
    {
      "name": "catalog-closure-before",
      "command": "pnpm test:storybook catalog/plugins/repository/HistoryStorage.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "The new closure story asserts teardown before releasing the original move. The App all-writer guard intentionally delays teardown until that admitted action drains. Keep the accepted-close, exact reload and final unmount assertions; complete the native fixture action before asserting unmount. Seven other stories pass. storage-catalog-closure.log."
    },
    {
      "name": "catalog-closure-qualified",
      "command": "pnpm test:storybook catalog/plugins/repository/HistoryStorage.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Final eight production-plugin stories x4fresh width/theme runs=32interaction/axe executions pass. Closing settings preserves the original native move, plugin-owned progress and one reload; the tab unmounts after its writer guard drains. Resume/rollback, App-toast recovery, default/root choices and loading also pass. storage-catalog-closure-final.log. Visual approval remains pending."
    },
    {
      "name": "native-final-worker-separation",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop host::repository; CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --locked --lib --bin lapis-desktop --test repository_storage --test repository_backup --test repository_admission --test vault_watch -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Ten exact frame/admission tests and strict Clippy pass after assigning layout resolution its own native worker slot. Capture startup never competes for the remote-transfer slots. storage-native-frames-final/native-clippy-final logs."
    },
    {
      "name": "bookkeeping-before",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate",
      "result": "fail",
      "failures": 45,
      "note": "Fresh evidence is initially absent from the JJ snapshot, producing41coverage messages; taking the normal status snapshot fixes them. Adding introductory summaries exceeds the existing desktop byte cap and two document line caps: three findings, then one remaining desktop byte finding after the first condensation. Consolidate duplicate introductions without removing requirements or changing limits. Original verification gates remain unchanged."
    },
    {
      "name": "generated-format-before",
      "command": "pnpm exec prettier --check <changed Markdown, TypeScript, Svelte, JavaScript and JSON files>; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "fail",
      "failures": 2,
      "note": "The generated MIGRATION.md needs normal Markdown formatting after progress generation. Rustfmt also requires sorting the new repository/storage module declaration. Format both without changing their behavior/projection or qualification gates, then rerun the exact formatting and progress checks."
    },
    {
      "name": "final-governance",
      "command": "pnpm progress:generate; pnpm exec prettier --write MIGRATION.md spec/src/history/E-REPO-036.md; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm check:architecture; pnpm check:app-ownership; pnpm check:types; pnpm exec prettier --check <changed supported files>; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "41tasks/141records, sixvalidators/163chapters/95requirements and spec-first34protected files/seven owning chapters pass. Source/App ownership, strict Svelte0errors/0warnings and changed-file/Rust formatting pass. Only focused source/native/renderer/catalog checks were run. Full Rust/UI/catalog, cold native app, live forge and release/platform lanes remain deferred by the user; nothing is integrated into main yet."
    }
  ],
  "remaining": [
    "Complete explicit existing-repository adoption and history source selection.",
    "Complete cold native app lifecycle and live provider acceptance after implementation. Full package/platform/release suites remain deferred and separately recorded.",
    "Integrate into main workspaces after functional implementation and focused acceptance."
  ]
}
```
