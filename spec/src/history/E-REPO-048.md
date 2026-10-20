# Native automatic capture recovery and retryable final closure

```json
{
  "id": "E-REPO-048",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14", "M14.2"],
  "requirements": ["LD-REPO-005", "LD-LIFE-001", "LD-DESK-005"],
  "versions": "macOS ARM64; Rust 1.99.0; Tauri 2.12.4; Node 26.9.0; Desktop parent 86411271; jj-vault source df31b5ca (E-VAULT-BACKUP-018)",
  "contractReview": "Final capture retains the same native backup owner and status forwarding on failure/cancelled await. Stop closes its watcher idempotently, requests borrowed retryable coordinator shutdown, and removes the owner only after successful final capture and worker join. All IO/send/join work stays off the renderer/UI thread. Stable vault bindings, native identity, immutable readers, checkpoint formats and network separation remain unchanged.",
  "milestoneReview": "M14/M14.2 remain Partial at their complete original ordinary-App capture/fault/recovery gates. Independent native identity/storage M14.1 remains Done. Source lifecycle tests and direct native IPC tests cannot replace ordinary editor-save/guarded-Quit coverage. M7.3, AI/conversations, restore/search, real providers and release/cutover remain separate.",
  "files": [
    "src-tauri/src/host/repository/backup.rs",
    "tests/desktop/repository-backup-recovery.test.mjs",
    "spec/src/current/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/desktop.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/history/E-REPO-048.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md",
    "spec/src/current/migration.md"
  ],
  "runs": [
    {
      "name": "native-crash-recovery-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup-recovery.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "recovery-before.log: the file then contained its first case only; 1/1 passes. Real native watchers capture external and admitted writes; excluded metadata/no-op scan preserves exact checkpoint; only the verified disposable Acceptance process is intentionally crashed; saved unsnapshotted bytes are absent before restart capture and retained after it. Immediate stop drains final saved files."
    },
    {
      "name": "native-close-retry-transport-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 --test-name-pattern='failed capture' tests/desktop/repository-backup-recovery.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "close-retry-before.log: embedded WebDriver interprets a top-level Status.error as a transport error. Private status getters now return { snapshot: status } and unwrap in the test; product assertions are unchanged."
    },
    {
      "name": "native-close-retry-product-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 --test-name-pattern='failed capture' tests/desktop/repository-backup-recovery.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "close-retry-wrapper-before.log: an unreadable saved file publishes Failed and rejects first stop. After permission repair, second stop falsely succeeds but immutable history contains zero repaired-version hits instead of one. Source cause: consuming close retires failed worker and host removes owner. The owning jj-vault repair is recorded in E-VAULT-BACKUP-018."
    },
    {
      "name": "native-rebuild",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json --config '{\"build\":{\"beforeBuildCommand\":null}}' ",
      "result": "pass",
      "failures": 0,
      "note": "recovery-native-build.log: independent Acceptance bundle builds in 1m06s. Current renderer is reused because only Rust changed; no package refresh or normal review process reload occurs. Existing compact-unwind linker advisory remains."
    },
    {
      "name": "native-close-retry-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 --test-name-pattern='failed capture' tests/desktop/repository-backup-recovery.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "close-retry-after.log: original regression passes 1/1. Two successive stops reject while unreadable, original failure/checkpoint remain observable, then repaired saved bytes and previous version both appear in retained immutable history after successful retry."
    },
    {
      "name": "native-recovery-complete",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup-recovery.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "recovery-after.log: both native cases pass 2/2, covering admitted/external capture, no-op/private exclusions, actual disposable-process crash and unsnapshotted restart, final drain, visible failure, repeated failed close and repaired-file retry."
    },
    {
      "name": "tracking-before-snapshot",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "recovery-progress.log: source test lacked fresh evidence coverage because new record was not yet in the Jujutsu snapshot. Explicit jj st includes E-REPO-048; rerun against the current snapshot without weakening coverage."
    },
    {
      "name": "final-native-and-source-checks",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check\ncargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets --features e2e,custom-protocol -- -D warnings\ncargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings\npnpm check:architecture\npnpm check:app-ownership\npnpm check:progress\npnpm spec:validate\npnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary and e2e/custom-protocol strict all-target lint pass; format, architecture and App ownership pass. Current progress passes 41 tasks/187 evidence records; canonical validation 6 validators/214 chapters/95 requirements; spec-first 44 protected files/8 canonical chapters. Source jj-vault package passes 20 tests, nine final lifecycle tests and strict all-target lint. Its file-specific source commit passes progress/spec-first separately. Full suites, providers and original ordinary editor-save/Quit remain separate."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Ordinary review-app dependency refresh awaits normal guarded shutdown; current running app and Vite graph are preserved.",
    "Original full editor-save/Quit, restore/search, storage/adoption, real GitHub/Forgejo, platform/release and visual-baseline gates remain open."
  ]
}
```
