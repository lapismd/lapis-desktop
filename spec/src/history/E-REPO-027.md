# Guarded file restore and live backup follow

```json
{
  "id": "E-REPO-027",
  "tasks": ["M14", "M14.2", "M14.3"],
  "requirements": [
    "LD-REPO-005",
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-DESK-003",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-GOV-004"
  ],
  "date": "2026-10-19",
  "result": "pending",
  "revision": "enclosing-change",
  "versions": {
    "jj": "0.45.1",
    "node": "26.9",
    "pnpm": "10.34.5",
    "sourceFoundation": "8f92eb95",
    "desktopFoundation": "4a9773cc"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/AutomaticBackup.stories.ts",
    "catalog/plugins/repository/Restore.stories.ts",
    "catalog/support/repository/BackupDemo.svelte",
    "catalog/support/repository/RestoreDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-027.md",
    "src/components/repository/RepositoryDiffColumn.svelte",
    "src/components/repository/RepositoryPanel.svelte",
    "src/components/repository/RepositoryRestoreDialog.svelte",
    "src/components/repository/file-history-view.ts",
    "src/components/repository/operation-view.ts",
    "src/components/repository/repository-backup.ts",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-view.ts",
    "src/lib/native/repository/restore.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/backup-follow.ts",
    "src/lib/repository/file-history-controller.ts",
    "src/lib/repository/history-controller.ts",
    "src/lib/repository/history-reader.ts",
    "src/lib/repository/operation-controller.ts",
    "src/lib/repository/operation-graph.ts",
    "src/lib/repository/restore.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/backup.rs",
    "src-tauri/src/host/repository/backup_provider.rs",
    "src-tauri/src/host/repository/backup_restore.rs",
    "src-tauri/src/host/repository/commands.rs",
    "src-tauri/src/host/repository/mod.rs",
    "tests/renderer/repository-history.test.mjs",
    "tests/renderer/repository-restore.test.mjs"
  ],
  "contractReview": "LD-REPO-005 adds guarded file previews/apply, native safety checkpoint and durable request identity. App fileEditingSessions.guard protects saves. Source-owned restore primitive never invokes shell commands. Backup live-follow stops for explicit operation or revision selection and live state remains live on layout persistence. Existing backup history is admitted read-only while paused. Initial capture is background work, not a shell startup gate. LD-REPO-001/002 immutable read/caller authority stays unchanged.",
  "milestoneReview": "M14.2 Partial with original cold app gate deferred. M14.3 is the sole active stage: file restore/live-follow implemented, whole-vault restore and complete native WebView proof remain. M13/AI and visual/release gates unchanged.",
  "scope": "Focused source, renderer, native permission and production-component catalog slice. Full suites/platform/release lanes explicitly deferred while implementing a working version. Original app, vault and main workspaces preserved.",
  "runs": [
    {
      "name": "source-restore",
      "command": "pnpm dev:cargo -- test -p jj-store-jj --no-default-features --features vault-backup --test vault_restore; pnpm dev:cargo -- test -p jj-vault",
      "result": "pass",
      "failures": 0,
      "note": "Three native file restore cases and six scheduler/lifecycle/native worker cases pass in the source workspace. Tests cover safety bytes, stale previews, cold session reopen, request collision/replay after later edits, partial receipt recovery, binary/deletion/mode/exclusion guards."
    },
    {
      "name": "renderer-first",
      "command": "node --test tests/renderer/repository-{restore,history,file-history,operations,selection,native}.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "File-history refresh initially lost its implicit historical pin. Preserve existing refresh behavior; separate checkpointChanged follows live captures only."
    },
    {
      "name": "source-size-first",
      "command": "pnpm check:architecture",
      "result": "fail",
      "failures": 1,
      "note": "Operation controller exceeded 300 counted lines. Moved workspace metadata query into its existing graph helper without changing semantics."
    },
    {
      "name": "startup-before",
      "command": "node --test tests/renderer/repository-native.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Unconditional await of undefined backup startup added a microtask and delayed native admission. Await only an active startup promise and fence closure before admission."
    },
    {
      "name": "renderer-qualified",
      "command": "node --test tests/renderer/repository-{restore,history,file-history,operations,selection,native}.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "50 tests pass. Source architecture audit and strict Svelte types pass with zero errors/warnings."
    },
    {
      "name": "native",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo check --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop; cargo test --manifest-path src-tauri/Cargo.toml --bin lapis-desktop restore_frames_reject_renderer_authority",
      "result": "pass",
      "failures": 0,
      "note": "Native compilation and the exact restore permission/authority frame regression pass. This is not complete actual-WebView qualification."
    },
    {
      "name": "catalog-first",
      "command": "pnpm test:storybook catalog/plugins/repository/Restore.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Cold Vite optimized the newly imported icon and reloaded the test module; zero tests executed. Exact rerun exposed two failures, one dialog-visibility race and one ensuing stale-overlay failure. Await real dialog visibility before interacting; no product assertion weakened."
    },
    {
      "name": "catalog-qualified",
      "command": "pnpm test:storybook catalog/plugins/repository/Restore.stories.ts catalog/plugins/repository/AutomaticBackup.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Six stories in each desktop/narrow light/dark run: 24 passing interaction/accessibility executions. Actual App toast and successful cleanup/retry are asserted. ResponsiveInitialCapture proves a usable shell before a withheld initial native response resolves. Visual pending."
    },
    {
      "name": "bookkeeping-first",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "Generated MIGRATION.md was not yet in the evidence inventory. Refreshed the exact changed-files inventory, retaining task statuses and gates."
    },
    {
      "name": "bookkeeping-final",
      "command": "pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "41 tasks/132 evidence records, six validators/154 chapters/95 requirements and spec-first37 protected files/six canonical chapters pass. Repository chapter scope moved into its existing opening paragraph after first validation found403lines; now399. Full suites and remaining product gates stay pending."
    }
  ],
  "remaining": [
    "Whole-vault restore",
    "Complete cold actual-WebView capture/restore/reopen acceptance",
    "Remote accounts, automatic sync, search, storage/adoption and main integration",
    "Full repository/platform/release qualification deferred by explicit user instruction"
  ]
}
```
