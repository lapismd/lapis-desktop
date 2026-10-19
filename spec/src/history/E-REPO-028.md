# Whole-vault restore and retained UI recovery

```json
{
  "id": "E-REPO-028",
  "tasks": ["M14", "M14.3"],
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
    "desktopBase": "09309648",
    "sourceBase": "5ca5ec42",
    "sourceRestoreRevision": "1d9d7c3e"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/Restore.stories.ts",
    "catalog/support/repository/RestoreDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-028.md",
    "src/components/repository/RepositoryPanel.svelte",
    "src/components/repository/RepositoryRestoreDialog.svelte",
    "src/components/repository/RepositoryRevisionActions.svelte",
    "src/components/repository/RepositoryRevisions.svelte",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-status.ts",
    "src/components/repository/repository-view.ts",
    "src/components/repository/restore-controller.ts",
    "src/lib/native/repository/restore.ts",
    "src/lib/repository/restore-recovery.ts",
    "src/lib/repository/restore.ts",
    "src-tauri/src/host/repository/backup_provider.rs",
    "src-tauri/src/host/repository/backup_restore.rs",
    "tests/renderer/repository-restore.test.mjs"
  ],
  "contractReview": "LD-REPO-005 adds whole-vault previews/apply with the original safety checkpoint, per-file guards/progress and complete-tree verification. The renderer saves the original command before mutation, protects every registered editor writer, and restores that command for explicit receipt reconciliation. Keep current files confirms a native worker capture barrier before clearing recovery. Feedback uses one stable restore identity across recreated views. Read-only grants and source roots remain native-owned; no new shell execution, server authority or codec profile.",
  "milestoneReview": "M14.3 remains the only active delivery stage. Local capture, file/whole-vault restore and focused recovery proofs do not complete the cold actual-WebView gate. Remote accounts/sync/search/storage and main integration remain required. M13/AI/visual/release gates are unchanged.",
  "scope": "Native regular-file whole-vault restore and renderer recovery. Symlinks/file-directory transitions fail explicitly until qualified. Existing main workspaces, running review app and data preserved. Full suites and platform/release checks deferred by user.",
  "runs": [
    {
      "name": "source",
      "command": "pnpm dev:cargo -- test -p jj-store-jj --no-default-features --features vault-backup --test vault_backup --test vault_restore --test vault_restore_all; pnpm dev:cargo -- test -p jj-vault --test native_restore",
      "result": "pass",
      "failures": 0,
      "note": "Nine actual native capture/file/whole-vault restore cases pass plus one extended serialized native worker case. Source E-VAULT-BACKUP-003 retains exact results. Safety ancestry, runtime exclusions, lost response/reopen, partial progress and later-edit refusal are covered."
    },
    {
      "name": "native",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo check --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop; cargo test --manifest-path src-tauri/Cargo.toml --bin lapis-desktop restore_frames_reject_renderer_authority",
      "result": "pass",
      "failures": 0,
      "note": "Native check and exact file/whole-vault command-frame test pass. Whole-vault apply rejects renderer root/path/generation/window/metadata authority."
    },
    {
      "name": "renderer",
      "command": "node --test tests/renderer/repository-{restore,history,file-history,native,operations}.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "51 cases pass before the final keep-current barrier regression. Final focused recovery and source/type/audit checks recorded below."
    },
    {
      "name": "catalog-first",
      "command": "pnpm test:storybook catalog/plugins/repository/Restore.stories.ts; pnpm check:types",
      "result": "fail",
      "failures": 3,
      "note": "New recovery harness initially used a legacy detach method on the host UI leaf: one runtime and one type failure. API compatibility detach did not remove the host tab. Use public owning AppWorkspace.closeLeaf. Its closing modal briefly retains pointer protection; wait for actual pointer availability before reopening. No pointer checks or assertions bypassed."
    },
    {
      "name": "catalog-final",
      "command": "pnpm test:storybook catalog/plugins/repository/Restore.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Final five-story family passes at desktop/narrow widths in light/dark themes:20 interaction/accessibility executions. Includes the real App persistence/guard/modal/feedback path for file restore, whole-vault restore, unknown-response retry, view recreation with original request, and keep-current recovery. Pointer availability is awaited after actual modal close. Visual review remains pending."
    },
    {
      "name": "recovery-controller-final",
      "command": "node --test tests/renderer/repository-restore.test.mjs; pnpm check:types; pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "note": "Eight recovery controller tests pass, including original-request reload, failed recovery-state persistence preventing native mutation and the keep-current worker barrier. Strict types and source-size/architecture audit pass. No native restore begins before recovery state is retained."
    },
    {
      "name": "bookkeeping-first",
      "command": "pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "Progress41tasks/133records and six validators/155chapters/95requirements pass. Spec-first required a fresh migration-owner confirmation after the task next action changed; updated the existing scope paragraph, retaining original gates."
    },
    {
      "name": "bookkeeping-qualified",
      "command": "pnpm progress:generate; pnpm exec prettier --write MIGRATION.md; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "41tasks/133evidence records, six validators/155chapters/95requirements and spec-first20protected files/sixcanonical chapters pass. Original gates/statuses retained. Whole-vault source and consumer commits remain isolated; main integration waits for remaining implementation."
    },
    {
      "name": "final-source-consumer-checks",
      "command": "pnpm check:types; node --test tests/renderer/repository-{backup,restore,history,file-history,native,operations,selection}.test.mjs tests/governance/source-audit.test.mjs; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Final61renderer/governance cases pass, strict Svelte diagnostics0errors/0warnings, both source/App audits pass. Final five restore stories at four viewport/theme combinations also pass:20interaction/accessibility executions. Main integration, review-app refresh and original cold app/product/provider/release gates remain pending."
    }
  ],
  "remaining": [
    "Complete cold actual-WebView capture/restore/reopen acceptance",
    "GitHub/Forgejo accounts, automatic remote sync, historical search, storage/adoption and main integration",
    "Full repository/platform/release qualification deferred by explicit user instruction"
  ]
}
```
