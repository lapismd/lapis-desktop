# Shared Desktop OS credential storage

```json
{
  "id": "E-REPO-060",
  "date": "2026-11-25",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-REPO-001", "LD-REPO-005", "LD-SYNC-002", "LD-GOV-006"],
  "versions": {
    "nativeCore": "f42eb264402b333dda2dd7a4c04ee9c1e55433a2",
    "rust": "1.99.0"
  },
  "files": [
    ".github/dependency-automation/artifact-projection.json",
    "scripts/ci-sources.json",
    "scripts/source-audit.mjs",
    "spec/src/backlog/vault-synchronization.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/lapis-sync.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/repository-remotes.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-REPO-060.md",
    "spec/src/navigation/history-01.md",
    "spec/src/verification.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/ai/configuration/secrets.rs",
    "src-tauri/src/credentials/keychain.rs",
    "src-tauri/src/credentials/mod.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/vault/credentials.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/lib.rs",
    "src-tauri/src/repository/remote_installation.rs",
    "src-tauri/src/sync/custody.rs",
    "src-tauri/tests/plugin_credentials.rs"
  ],
  "contractReview": "Desktop now delegates Repository, Forge, AI, Sync and approved plugin credentials to one OS adapter implementing the shared Core contract. Existing native domains retain their existing identifiers. Plugin paths are separate and admitted by the local main window and its opaque vault session.",
  "acceptanceReview": "Linux native integration exercises the actual host build with the pinned CLI and verified AI helper resources. A targeted macOS harness runs the committed credential scope test against the production adapter and the operating system Keychain. The macOS WebView, Tauri command path and release bundle still need independent acceptance.",
  "runs": [
    {
      "name": "Cold Linux build without CLI bundle",
      "command": "cargo test --locked --lib",
      "result": "fail",
      "failures": 1,
      "detail": "Tauri rejected the missing pinned CLI resource before running tests. Built and staged the pinned native CLI and AI helper resources before retry."
    },
    {
      "name": "Linux native library",
      "command": "cargo test --locked --lib",
      "result": "pass",
      "failures": 0,
      "detail": "18 passed after generating the actual runtime resources."
    },
    {
      "name": "Linux custody and admission",
      "command": "cargo test --locked --test repository_remote_credentials --test sync_custody --test ai_provider_keychain --test sync_account_admission",
      "result": "pass",
      "failures": 0,
      "detail": "9 passed. The macOS-specific AI Keychain test is excluded by target configuration."
    },
    {
      "name": "Linux strict Clippy",
      "command": "cargo clippy --locked --all-targets -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Actual macOS Keychain adapter",
      "command": "rustc test harness for src-tauri/tests/plugin_credentials.rs",
      "result": "pass",
      "failures": 0,
      "detail": "One case uses temporary scopes in the actual Keychain and proves persistence after reopening the adapter, identical-name isolation and deletion."
    },
    {
      "name": "Full Desktop Linux Rust tests",
      "command": "cargo test --locked",
      "result": "pass",
      "failures": 0,
      "detail": "293 passed and two existing tests were ignored."
    },
    {
      "name": "Desktop renderer against built credential API",
      "command": "pnpm check:types && node --import tsx --test tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Zero Svelte diagnostics and 402 renderer tests passed with the verified Notes API 0.6.15 archive built from Notes PR #204."
    }
  ],
  "remaining": [
    "Qualify the admitted credential commands in a cold macOS application and complete the exact-source hosted checks.",
    "Consume the released Notes credential API and qualify the Desktop renderer on that registry graph."
  ]
}
```
