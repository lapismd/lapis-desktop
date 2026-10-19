# Native forge repository validation for vault backup

```json
{
  "id": "E-REPO-030",
  "tasks": ["M14", "M14.4"],
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
    "jj": "0.45.1",
    "git": "2.55.0",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "sourceRemote": "26c4c417",
    "sourceWorker": "2a0573cd",
    "desktopAccounts": "867ee73f"
  },
  "files": [
    "MIGRATION.md",
    "docs/automatic-vault-backup-progress.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-030.md",
    "src-tauri/src/host/repository/backup_provider.rs",
    "src-tauri/src/repository/forges.rs",
    "src-tauri/src/repository/forges/repository.rs",
    "src-tauri/tests/repository_forges.rs"
  ],
  "contractReview": "LD-REPO-005 adds a native-only account repository resolver. The verified source manager supplies current account credentials and repository metadata; the host validates clone origin, project identity and branch before returning a non-serializable Git credential capability. LD-DESK-003/HOST-001 worker separation and installation custody remain unchanged. No Tauri permission or renderer authority is added by this helper slice. Configuration/fetch/restore controls remain required integration.",
  "milestoneReview": "M14.4 is the only active delivery stage. Account and repository-resolution native proofs pass; remote settings/fresh-device UI, automatic synchronization, history search, storage/adoption, Forgejo, cold native app and main integration remain pending. Original gates are retained.",
  "scope": "Native library account resolution, its directly affected account worker and focused tests, plus truthful progress updates. No live GitHub request, personal credential use, remote publication, main integration or review-app restart occurred. The desktop provider also forwards opaque native import and remote restore through its existing active-admission/file-IO guard; no RPC exposure is added yet.",
  "runs": [
    {
      "name": "source-remote-foundations",
      "command": "pnpm dev:cargo -- test -p jj-store-jj --no-default-features --features vault-backup --test vault_backup --test vault_restore --test vault_restore_all --test vault_remote; pnpm dev:cargo -- test -p jj-vault",
      "result": "pass",
      "failures": 0,
      "note": "Separate source E-VAULT-BACKUP-005/006 records nine existing capture/restore and four remote cases, plus seven scheduler/lifecycle/native-worker cases and strict focused Clippy. Actual disposable Git clones and stalled loopback HTTPS prove remote ancestry and capture independence. These source proofs do not substitute for desktop UI/provider acceptance."
    },
    {
      "name": "native-account-repository-resolution",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo test --manifest-path src-tauri/Cargo.toml --test repository_forges",
      "result": "pass",
      "failures": 0,
      "note": "All three actual native-service tests pass. The new case validates approved GitHub clone origin/full repository identity/default branch/push availability and rejects unrelated origins, URL-embedded secrets, project drift and ref injection. Existing worker custody and busy-poll cancellation cases still pass. All transports/secrets are injected; no OS keychain or personal credential is used. Ordinary native binary also compiles; informational linker unwind-size warning remains."
    },
    {
      "name": "focused-native-quality",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo clippy --manifest-path src-tauri/Cargo.toml --lib --test repository_forges -- -D warnings; cargo check --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop",
      "result": "pass",
      "failures": 0,
      "note": "Focused library/account-test Clippy and ordinary library/binary checks pass. The host provider uses the existing admitted file gate to forward remote import/restore to the serialized native worker. RPC/UI exposure and cold actual-WebView acceptance remain pending."
    },
    {
      "name": "bookkeeping-initial",
      "command": "pnpm progress:generate; pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "fail",
      "failures": 2,
      "note": "Both source audits and progress passed. The subsequent provider forwarding addition needed explicit evidence inventory coverage, and spec-first required a fresh governance confirmation. Added the exact file and governing scope statement without changing original gates."
    },
    {
      "name": "bookkeeping-qualified",
      "command": "pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Both final source/App audits, progress41tasks/135records, sixvalidators/157chapters/95requirements and spec-first7protected files/fivecanonical chapters pass. Native library/account-test Clippy and library/binary compilation are qualified separately above. All original product/provider, automatic sync/search/storage and main integration gates remain open."
    }
  ],
  "remaining": [
    "Native configuration/fetch/guarded restore command composition and production backup settings controls",
    "Automatic two-way sync/conflicts, historical search, advanced storage/adoption and Forgejo",
    "Complete cold actual-WebView/provider/full-suite/platform/release qualification deferred by user",
    "Complete required implementation before integrating into main workspaces and updating review app"
  ]
}
```
