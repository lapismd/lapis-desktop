# Remote vault backup setup and guarded fresh-device restoration

```json
{
  "id": "E-REPO-031",
  "tasks": ["M14", "M14.4", "M14.5"],
  "requirements": [
    "LD-REPO-005",
    "LD-DESK-003",
    "LD-HOST-001",
    "LD-GOV-004",
    "LD-MIG-002"
  ],
  "date": "2026-10-19",
  "result": "pending",
  "revision": "enclosing-change",
  "versions": {
    "source": "2a0573cd",
    "jj": "0.45.1",
    "git": "2.55.0",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/RemoteBackup.stories.ts",
    "catalog/support/repository/RemoteDemo.svelte",
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
    "spec/src/history/E-REPO-031.md",
    "src-tauri/Cargo.lock",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/remote.rs",
    "src-tauri/src/repository/mod.rs",
    "src-tauri/src/repository/remote.rs",
    "src-tauri/tests/repository_remote.rs",
    "src/components/repository/backup/BackupSelect.svelte",
    "src/components/repository/backup/BackupSettings.svelte",
    "src/components/repository/backup/ForgeAccounts.svelte",
    "src/components/repository/backup/RemoteSettings.svelte",
    "src/components/repository/backup/forge-view.ts",
    "src/components/repository/backup/remote-restore.ts",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-status.ts",
    "src/components/repository/restore-controller.ts",
    "src/lib/native/repository/remote.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/history-reader.ts",
    "src/lib/repository/plugin-data.ts",
    "src/lib/repository/remote-controller.ts",
    "src/lib/repository/remote.ts",
    "tests/renderer/repository-remote.test.mjs"
  ],
  "contractReview": "LD-REPO-005 adds main-window-only exact remote action frames, versioned private configuration, immutable fetch and guarded remote restore. Desktop/HOST native workers never hold the service mutex or capture lease during network IO. LD-GOV-004 source/App ownership and LD-MIG-002 original gates remain unchanged; owning chapters retain explicit confirmations.",
  "milestoneReview": "M14.4 becomes Partial: implementation and focused proofs pass; cold actual-WebView/live-provider gate remains open. M14.5 is the only active stage. No original completion gate is replaced.",
  "scope": "Production remote setup/fetch/restoration and recovery, direct account/status/restore consumers, native permission/frame/binding and source audits. No personal credential, provider request, publication, main integration or review-app restart.",
  "runs": [
    {
      "name": "native-configuration",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo check --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop; cargo test --manifest-path src-tauri/Cargo.toml --test repository_remote; cargo test --manifest-path src-tauri/Cargo.toml --bin lapis-desktop remote_frames_cannot_choose_paths_tokens_or_caller_authority; cargo clippy --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop --test repository_remote -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Two actual configuration tests, one exact rejected-authority frame case and ordinary lib/bin check/strict Clippy pass. An initial cmp_owned Clippy failure was corrected to compare borrowed Path. Final logs remote-commands-check, remote-config-tests, remote-frame-tests and remote-native-clippy-final."
    },
    {
      "name": "renderer",
      "command": "node --import tsx --test tests/renderer/repository-remote.test.mjs tests/renderer/repository-restore.test.mjs tests/renderer/repository-forges.test.mjs tests/renderer/repository-native.test.mjs; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "26renderer cases; Svelte0errors/0warnings. Recovery clearing matches original request identity, per-App/plugin merges survive recreation, closed settings fence results while retaining activity until requests drain. Logs remote-renderer-qualified and remote-ui-types-qualified."
    },
    {
      "name": "catalog-initial",
      "command": "pnpm test:storybook catalog/plugins/repository/RemoteBackup.stories.ts catalog/plugins/repository/Restore.stories.ts catalog/plugins/repository/Forges.stories.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts",
      "result": "fail",
      "failures": 5,
      "note": "First import attempt reloaded after Vite optimized cloud-download. Then dialog visibility raced animation and affected subsequent pointer assertions; awaiting actual visible dialogs fixes the race. Three axe label failures found account Select name missing visible selected text; fixed the owned label. Recovery description visibility also now awaits animation. No assertions weakened or visual baselines changed."
    },
    {
      "name": "catalog-qualified",
      "command": "pnpm test:storybook catalog/plugins/repository/RemoteBackup.stories.ts catalog/plugins/repository/Restore.stories.ts catalog/plugins/repository/Forges.stories.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Final22stories x4width/theme runs=88interaction/axe executions pass. Six remote, five restore, five account, six working-copy status stories. Exact invoked runner arguments are retained in .local/vault-backup/remote-catalog-final.log. Source architecture audit passes."
    },
    {
      "name": "bookkeeping-initial",
      "command": "pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "fail",
      "failures": 4,
      "note": "Audits pass. Stage-five Active required selected evidence, native dependency lock refresh required inventory coverage, new evidence needed SUMMARY entry, and plugin registration required canonical confirmation. Added these exact records; original gates remain."
    },
    {
      "name": "source-native-refresh",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo clippy --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop --test repository_remote --test repository_backup -- -D warnings; cargo test --manifest-path src-tauri/Cargo.toml --test repository_remote --test repository_backup",
      "result": "pass",
      "failures": 0,
      "note": "Refresh against source00c54474 no-follow restore fix; optional cap-fs-ext4.0.3 lock refresh. Focused strict Clippy and four actual native configuration/capture tests pass. Remote native source logs retained."
    },
    {
      "name": "bookkeeping-final",
      "command": "pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Source/App audits and41task/136record progress pass. Final specification and spec-first qualify the exact scope. A first follow-up found a misspelled requirement ID; corrected to the existing LD-CAT-003 requirement. Cold app/provider/full-suite gates remain open."
    }
  ],
  "remaining": [
    "Automatic two-way sync/conflicts, historical search, root storage/adoption and Forgejo",
    "Cold actual-WebView/provider/full-suite/platform/release qualification deferred by user",
    "Complete implementation then integrate main and update review app"
  ]
}
```
