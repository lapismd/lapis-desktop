# Native Forgejo vault backup accounts

```json
{
  "id": "E-REPO-035",
  "tasks": ["M14", "M14.7"],
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
    "sourceParent": "482807c4",
    "desktopParent": "04d9a446",
    "jj": "0.45.1",
    "git": "2.55.0",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "sourceForgejo": "890d8220"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/Forges.stories.ts",
    "catalog/plugins/repository/RemoteBackup.stories.ts",
    "catalog/support/repository/ForgeDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-035.md",
    "src-tauri/src/host/repository/forges.rs",
    "src-tauri/src/repository/forges.rs",
    "src-tauri/src/repository/forges/repository.rs",
    "src-tauri/tests/repository_forges.rs",
    "src/components/repository/backup/ForgeAccounts.svelte",
    "src/components/repository/backup/ForgeAuthorization.svelte",
    "src/components/repository/backup/RemoteSettings.svelte",
    "src/lib/repository/forge-accounts.ts",
    "src/lib/repository/forge-controller.ts",
    "tests/renderer/repository-forges.test.mjs"
  ],
  "contractReview": "LD-REPO-005 owns explicit Forgejo HTTPS/PAT setup and provider-selected Git login while sharing exact remote guards and recovery. LD-DESK-003/HOST-001 keep native workers, caller admission and secret custody. The additive native account action uses the existing main-window permission and denies injected authority. LD-CAT-003 inventory expands; LD-GOV-004/MIG-002 original gates remain unchanged.",
  "milestoneReview": "M14.6 is Partial with focused search proof and original cold native gate open. M14.7 is the only active stage. Forgejo implementation does not complete storage migration/adoption, existing-repository source selection, cold native/provider proof or main integration.",
  "scope": "Reuse the jj-forge native account manager, OS credential namespace and existing settings/controller/remote flow. Forgejo PAT endpoints explicitly use HTTPS /api/v1; GitHub OAuth/Enterprise commands stay unchanged. No personal credential, live provider push, review restart or main integration.",
  "runs": [
    {
      "name": "source-proof",
      "command": "Source E-VAULT-BACKUP-011: pnpm dev:cargo -- test -p jj-forge; pnpm dev:cargo -- test -p jj-store-jj --no-default-features --features vault-backup --lib vault_workspace::remote::credentials_tests; pnpm dev:cargo -- test -p jj-store-jj --no-default-features --features vault-backup --test vault_remote --test vault_publication",
      "result": "pass",
      "failures": 0,
      "note": "All29forge package cases, one credential and six transfer/publication cases pass with strict Clippy. Instance admission, no secrets in inventory/metadata, correct API/Git authentication, injection denial and original unknown-push recovery remain proven. Separate source evidence retains missing-API and authored test compile attempts."
    },
    {
      "name": "renderer-types",
      "command": "node --import tsx --test tests/renderer/repository-forges.test.mjs tests/renderer/repository-remote.test.mjs; pnpm check:types; pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "note": "All11renderer cases, Svelte0errors/0warnings and source audit pass. Explicit Forgejo action closes the form after success and never exposes its token in observable state. Existing GitHub cancellation and remote recovery pass. forgejo-renderer/types-qualified/architecture logs."
    },
    {
      "name": "catalog-before",
      "command": "pnpm test:storybook catalog/plugins/repository/Forges.stories.ts catalog/plugins/repository/RemoteBackup.stories.ts catalog/plugins/repository/Sync.stories.ts catalog/plugins/repository/Publication.stories.ts",
      "result": "fail",
      "failures": 20,
      "note": "Generic account-menu accessible label changed while visible text remained Add account. Axe found a name mismatch; subsequent stories inherited pointer suppression after a failed overlay. Make visible text match the accessible label; retain all interaction/axe assertions. forgejo-catalog.log."
    },
    {
      "name": "catalog-qualified",
      "command": "pnpm test:storybook catalog/plugins/repository/Forges.stories.ts catalog/plugins/repository/RemoteBackup.stories.ts catalog/plugins/repository/Sync.stories.ts catalog/plugins/repository/Publication.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All21directly affected stories x4fresh width/theme runs=84interaction/axe executions pass. Forgejo PAT uses explicit instance/action and clears the transient form. GitHub OAuth/PAT/loading/error recovery, remote setup, sync and publication recovery pass. forgejo-catalog-second.log. Visual approval and live provider proof remain separate."
    },
    {
      "name": "native-consumer",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo test --manifest-path src-tauri/Cargo.toml --test repository_forges; cargo test --manifest-path src-tauri/Cargo.toml --bin lapis-desktop host::repository; cargo clippy --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop --test repository_forges -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Four actual native account/service cases, nine frame/admission cases and strict lib/bin/service Clippy pass. Forgejo custody/resolution runs off the caller thread, rejects another clone origin and keeps tokens out of responses. Account action frames cannot choose caller/secret scope/native paths. All Cargo lanes disable incremental and dev/test debug. Existing large eh_frame linker warning is retained. forgejo-native-services/frames/clippy logs."
    },
    {
      "name": "bookkeeping-qualified",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:validate; pnpm spec:first; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "Svelte0errors/0warnings, source/App audits,41tasks/140records progress, sixvalidators/162chapters/95requirements and spec-first17protected files/sixcanonical chapters pass. Changed-file formatting and Rust format check pass. None substitutes for cold native app/live provider acceptance. forgejo-bookkeeping.log."
    }
  ],
  "remaining": [
    "Actual live Forgejo/GitHub provider and cold app acceptance remain open; full platform/release checks are deferred.",
    "Recoverable external/root .jj migration, explicit existing-repository adoption/source selection and main integration remain required."
  ]
}
```
