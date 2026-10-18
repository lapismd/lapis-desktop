# External vault backup foundation

```json
{
  "id": "E-REPO-026",
  "tasks": ["M14", "M14.1", "M14.2"],
  "requirements": [
    "LD-REPO-005",
    "LD-VAULT-002",
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-GOV-004"
  ],
  "date": "2026-10-19",
  "result": "pending",
  "revision": "enclosing-change",
  "versions": {
    "jj": "0.45.1",
    "node": "26.9",
    "pnpm": "10.34.5",
    "sourceBase": "7fa3a4b4",
    "desktopBase": "12609898"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/AutomaticBackup.stories.ts",
    "catalog/support/repository/BackupDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "scripts/progress-model.mjs",
    "scripts/progress.mjs",
    "scripts/source-audit.mjs",
    "scripts/spec-contracts.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-026.md",
    "src/components/repository/RepositoryBackupStatus.svelte",
    "src/components/repository/repository-backup.ts",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-status.ts",
    "src/lib/native/repository/backup.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/backup.ts",
    "src/lib/repository/history-reader.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/backup.rs",
    "src-tauri/src/host/repository/backup_provider.rs",
    "src-tauri/src/host/repository/commands.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/repository/mod.rs",
    "src-tauri/src/repository/source.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/profiles.rs",
    "src-tauri/src/vault/registry.rs",
    "src-tauri/tests/repository_backup.rs",
    "src-tauri/tests/vault_identity.rs",
    "tests/renderer/repository-backup.test.mjs"
  ],
  "contractReview": "LD-REPO-005 adds the separately admitted backup writer and durable external vault identity. Existing immutable reads remain operation pinned and do not snapshot. LD-REPO-001/002 authority is unchanged. Native-only roots, shared IO gate, existing bounded watcher and a reusable worker own capture. Unknown pause outcomes retain cleanup ownership.",
  "milestoneReview": "M14.1 Partial: native identity/capture/watch/relink proofs passed; cold WebView gate deferred. M14.2 is the sole active delivery stage. Original M13, AI, release and visual gates unchanged.",
  "scope": "External storage and automatic local capture foundation only. Main workspaces and running review data preserved. Full suites deferred by explicit user instruction while implementation proceeds.",
  "runs": [
    {
      "name": "source",
      "command": "pnpm dev:cargo -- test -p jj-store-jj --no-default-features --features vault-backup --test vault_backup; pnpm dev:cargo -- test -p jj-vault",
      "result": "pass",
      "failures": 0,
      "note": "Source workspace: four native capture/relink and five scheduler/worker tests pass. Initial compile/rebase failures and disk reserve recovery retained in source E-VAULT-BACKUP-001."
    },
    {
      "name": "native-check",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo check --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop",
      "result": "pass",
      "failures": 0,
      "note": "Native compilation passed before final relink integration. Latest focused native tests recorded below."
    },
    {
      "name": "native-watch-identity",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test repository_backup --test vault_identity",
      "result": "pass",
      "failures": 0,
      "note": "Latest serialized relink integration run: two real watch/admission tests and two durable vault identity tests pass. Informational unwind linker warning remains."
    },
    {
      "name": "renderer",
      "command": "node --test tests/renderer/repository-backup.test.mjs tests/renderer/repository-native.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "15 tests pass, including seven backup lifecycle regressions. New failed-pause case fails before fix and passes after."
    },
    {
      "name": "source-audits",
      "command": "node --test tests/governance/source-audit.test.mjs; pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Earlier 11 permission/source checks and strict types pass; final changed-file checks follow."
    },
    {
      "name": "catalog",
      "command": "pnpm test:storybook catalog/plugins/repository/AutomaticBackup.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Three stories, four viewport/theme runs, 12 passing interaction/accessibility executions. Saving skeleton and failure/recovery toast covered. Visual pending."
    },
    {
      "name": "focused-final",
      "command": "pnpm check:types; node --test tests/governance/progress.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Zero type errors/warnings; 17 progress and source/permission regressions pass."
    },
    {
      "name": "bookkeeping-first",
      "command": "pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "Progress initially read a pre-evidence pinned JJ revision. Snapshot after evidence and inventory edits before rerunning; no gate weakened."
    },
    {
      "name": "spec-first-owner",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "New catalog requires owning plugins chapter. Added unchanged-contract catalog scope confirmation and retained original gates."
    },
    {
      "name": "document-size-first",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Migration chapter was 403 lines. Folded new scope note into existing opening paragraph to retain the 400-line limit."
    },
    {
      "name": "final-bookkeeping",
      "command": "pnpm progress:generate; pnpm exec prettier --write MIGRATION.md; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Progress41 tasks/131 evidence records, spec-first35 protected files/six canonical chapters pass. File-size correction then validated separately. Stage status and pending gates retained."
    }
  ],
  "remaining": [
    "Cold actual-WebView backup lifecycle acceptance",
    "Guarded restore and default live-follow",
    "GitHub/Forgejo accounts and automatic two-way sync, historical search, root storage/adoption",
    "Full repository/platform/release suites deferred by user; main integration after implementation completion"
  ]
}
```
