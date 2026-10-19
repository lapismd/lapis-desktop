# Automatic vault synchronization and guarded conflict recovery

```json
{
  "id": "E-REPO-032",
  "tasks": ["M14", "M14.5"],
  "requirements": [
    "LD-REPO-005",
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
    "sourceSync": "6942a269",
    "sourceRestore": "00c54474",
    "desktopRemote": "d7db2f94",
    "jj": "0.45.1",
    "git": "2.55.0",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/AutomaticBackup.stories.ts",
    "catalog/plugins/repository/Sync.stories.ts",
    "catalog/support/repository/SyncDemo.svelte",
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
    "spec/src/history/E-REPO-032.md",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/backup_provider.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/remote.rs",
    "src-tauri/src/host/repository/remote_transfer.rs",
    "src-tauri/src/host/repository/sync.rs",
    "src/components/repository/backup/BackupSettings.svelte",
    "src/components/repository/backup/SyncConflictEditor.svelte",
    "src/components/repository/backup/SyncSettings.svelte",
    "src/components/repository/backup/forge-view.ts",
    "src/components/repository/repository-backup.ts",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-sync.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/native/repository/sync.ts",
    "src/lib/repository/history-reader.ts",
    "src/lib/repository/sync-controller.ts",
    "src/lib/repository/sync-recovery.ts",
    "src/lib/repository/sync.ts",
    "tests/renderer/repository-sync.test.mjs"
  ],
  "contractReview": "LD-REPO-005 now owns plugin-lifetime automatic sync, exact connection-revision actions, retained native proposals, guarded apply, persisted original recovery and explicit immutable conflict resolution. Main-window/source/caller admission and native workers retain LD-DESK-003/HOST-001. Shared copied conflict presentation is reused under its owned AppShell; LD-CAT-003 inventory/provenance expands. LD-GOV-004 and LD-MIG-002 gates remain unchanged.",
  "milestoneReview": "M14.5 remains the only active stage. Normal automatic sync and conflict flows now have focused native and UI proof. Explicit resolution of an unconfirmable original unknown push and focused actual native-app acceptance remain in this stage. Stages6/7, all original cold provider/product gates and main integration are not complete.",
  "scope": "Open-vault scheduler and optional setting, account/remote settings direct consumers, native transfer/admission and serialized merge/apply provider, shared production conflict shell/text composition, recovery matching and independent App background progress. Network work never holds the capture worker/NativeHost mutex; close fences follow-up writes without awaiting remote IO. No personal credential, live forge push, review-app restart or main integration.",
  "runs": [
    {
      "name": "source-native-proof",
      "command": "Source E-VAULT-BACKUP-008: pnpm dev:cargo -- test -p jj-store-jj --no-default-features --features vault-backup --test vault_sync --test vault_remote --test vault_backup --test vault_restore --test vault_restore_all; pnpm dev:cargo -- test -p jj-vault",
      "result": "pass",
      "failures": 0,
      "note": "Separate source evidence records17actual native cases and seven coordinator cases, including disposable two-device Git merge/convergence, retained conflict resolution/stale apply, original receipt and accepted-ancestor observation. Source strict Clippy also passes. These do not substitute for actual desktop/provider acceptance."
    },
    {
      "name": "native-consumer",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo check --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop; cargo clippy --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop -- -D warnings; cargo test --manifest-path src-tauri/Cargo.toml --bin lapis-desktop host::repository",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary library/binary checks, strict Clippy and all eight exact repository admission/frame cases pass. New frames cannot choose native paths, credentials or callers. Connection revision is checked before apply/resolution; exact publication is reserved while configuration is serialized, before the child runs. All native Cargo lanes disable incremental/debug. Logs sync-native-first, sync-desktop-clippy-first and sync-native-frames."
    },
    {
      "name": "initial-renderer-and-types",
      "command": "node --import tsx --test tests/renderer/repository-sync.test.mjs; pnpm check:types; pnpm check:architecture",
      "result": "fail",
      "failures": 19,
      "note": "Initial six controller tests passed. Initial Svelte check found13errors from the state/rune name and wrong MergeEditor callback. A follow-up found five typed executable/view binding errors. Architecture found one source-size violation; moved sync ownership into existing backup lifetime rather than increasing limits. All corrected; no assertions weakened."
    },
    {
      "name": "renderer-qualified-before-scheduler-proof",
      "command": "node --import tsx --test tests/renderer/repository-sync.test.mjs tests/renderer/repository-backup.test.mjs tests/renderer/repository-remote.test.mjs tests/renderer/repository-restore.test.mjs tests/renderer/repository-forges.test.mjs tests/renderer/repository-native.test.mjs; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "40renderer cases and Svelte0errors/0warnings pass, including cold recovery matching and malformed recovery refusal before mutation. Logs sync-renderer-qualified and sync-ui-types-qualified. The subsequently added offline scheduler proof is recorded separately."
    },
    {
      "name": "scheduler-before",
      "command": "node --import tsx --test tests/renderer/repository-sync.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "New exact fake-clock proof found that a local checkpoint bypassed remote failure backoff (two attempts instead of one). It also covers pause/close stopping future network work. Preserve assertion; apply retry deadline even when capture events coalesce a wakeup."
    },
    {
      "name": "catalog-initial",
      "command": "pnpm test:storybook catalog/plugins/repository/Sync.stories.ts",
      "result": "fail",
      "failures": 8,
      "note": "Sequential attempts: five failures from missing AppShell context; then one selector assumed a dialog although maintained SurfaceLayer is a labelled section; then one failure showed the nested surface inherited Main hidden state; then one failure showed automatic resolution completion lost the close condition when proposal cleared. Add the ordinary owned RepositoryShell and render conflict surface beside Main, use its real labelled section semantics and close clean results. Final story strengthens resolution by accepting Left and checking saved text; narrow browser starts collapsed. Logs sync-catalog-first/after-shell/after-selector/after-surface."
    },
    {
      "name": "catalog-new-family-qualified",
      "command": "pnpm test:storybook catalog/plugins/repository/Sync.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All five stories pass in four fresh width/theme runs=20interaction/axe executions. Clean automatic merge/push, actual merge-editor resolution, offline recovery/toast clearing, visible transfer progress and original unknown-apply recovery. sync-catalog-resolution.log. Related existing settings/capture families are being checked separately."
    },
    {
      "name": "scheduler-and-notification-qualified",
      "command": "node --import tsx --test tests/renderer/repository-sync.test.mjs tests/renderer/repository-backup.test.mjs tests/renderer/repository-remote.test.mjs tests/renderer/repository-restore.test.mjs tests/renderer/repository-forges.test.mjs tests/renderer/repository-native.test.mjs; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Final42renderer cases pass, including nine sync cases. The exact fake-clock scheduler regression now preserves the retry deadline across new captures and stops automatic work after pause/close. Repeated identical failures publish only one episode until actual recovery; a new conflict publishes actionable feedback and successful resolution clears it. Final Svelte0errors/0warnings. Logs sync-backoff-after, sync-renderer-accepted and sync-types-accepted."
    },
    {
      "name": "capture-popover-timing",
      "command": "pnpm test:storybook catalog/plugins/repository/Sync.stories.ts catalog/plugins/repository/RemoteBackup.stories.ts catalog/plugins/repository/Forges.stories.ts catalog/plugins/repository/AutomaticBackup.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Broader related-family qualification found SavedLocally in desktop/dark asserting visible text during popover enter animation. DOM presence was insufficient. Retained the visibility assertion and await its real visible state before the next action. No assertion or product behavior weakened. sync-catalog-final.log."
    },
    {
      "name": "capture-popover-exact",
      "command": "LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/AutomaticBackup.stories.ts -t 'Saved Locally'",
      "result": "pass",
      "failures": 0,
      "note": "The exact previously failing desktop/dark case passes (one case, three filtered). sync-capture-popover-after.log."
    },
    {
      "name": "catalog-qualified",
      "command": "pnpm test:storybook catalog/plugins/repository/Sync.stories.ts catalog/plugins/repository/RemoteBackup.stories.ts catalog/plugins/repository/Forges.stories.ts catalog/plugins/repository/AutomaticBackup.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Final20stories x4fresh width/theme runs=80interaction/axe executions pass: five sync, six remote backup, five accounts and four automatic capture stories. This covers the complete directly affected settings composition and capture lifetime; whole catalog and native provider gates remain separate. sync-catalog-accepted.log. No visual baselines changed."
    },
    {
      "name": "bookkeeping-qualified",
      "command": "pnpm progress:generate; pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:validate; pnpm spec:first; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "Source/App audits,41tasks/137records progress, sixvalidators/159chapters/95requirements and spec-first31protected files/sixcanonical chapters pass. Changed-file Prettier and native Rust formatting pass. These are bookkeeping/quality checks, not product gate substitution. All original completion gates remain open as listed."
    },
    {
      "name": "changed-file-formatting",
      "command": "node --input-type=module <<'JS'\nimport {execFileSync} from 'node:child_process';\nexecFileSync('jj',['--no-pager','st']);\nconst files=execFileSync('jj',['--no-pager','diff','--name-only'],{encoding:'utf8'}).trim().split('\\n').filter(path=>/\\.(?:ts|svelte|mjs|json|md)$/.test(path));\nexecFileSync('pnpm',['exec','prettier','--check',...files],{stdio:'inherit'});\nJS",
      "result": "pass",
      "failures": 0,
      "note": "All changed Markdown/JSON/TS/Svelte/MJS files pass Prettier; native Rust formatting is checked in the preceding run. Check scope is the enclosing JJ change, preserving unrelated files."
    }
  ],
  "remaining": [
    "Complete explicit original unknown-push recovery controls when remote ancestry cannot confirm acceptance; no automatic replay",
    "Focused actual native-app synchronization/lifecycle acceptance; full provider/catalog/platform/release lanes remain explicitly deferred",
    "Historical search, root metadata/adoption, Forgejo and required main integration"
  ]
}
```
