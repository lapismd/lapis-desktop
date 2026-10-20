# Restore native backup watching after a failed final capture

```json
{
  "id": "E-REPO-049",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "versions": "macOS ARM64; Rust 1.99.0; Tauri 2.12.4; Node 26.9.0; Desktop parent ef53bf74",
  "result": "pass",
  "tasks": ["M14", "M14.2"],
  "requirements": ["LD-REPO-005", "LD-FILE-002", "LD-LIFE-001", "LD-DESK-005"],
  "files": [
    "src-tauri/src/host/repository/backup.rs",
    "src-tauri/src/host/repository/backup_close.rs",
    "src-tauri/src/host/repository/backup_watch.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/state.rs",
    "tests/desktop/repository-backup-resume.test.mjs",
    "spec/src/current/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/desktop.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/migration.md",
    "MIGRATION.md",
    "spec/src/history/E-REPO-049.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "contractReview": "Failed final capture retains the same coordinator/status owner and restores its native filtered watcher. Later saved files still schedule capture after the quiet period. An interrupted close with no watcher is resolved before reattachment/replacement. Shared watcher setup retains the exact existing admission, native worker, private-name exclusions and physical-root boundary. NativeError gains only internal Display formatting for combined failure diagnostics; its serialized code/message DTO is unchanged. The separate destructive renderer-teardown defect is tracked in E-REPO-050 and is not claimed fixed here.",
  "milestoneReview": "M14/M14.2 remain Partial at their original ordinary editor-save/Quit and recovery gates. M14.1 stays Done. Native IPC watcher recovery is separate from normal App leave preflight, managed AI, provider, release and visual qualification.",
  "runs": [
    {
      "name": "native-watch-resume-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup-resume.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "resume-before.log: 0/1 passes. Failed final capture retains the worker, its automatic retry captures the repaired file, then a newly saved Later.md receives no automatic checkpoint within 30s because the native watcher was closed. This does not substitute an explicit capture command for watching."
    },
    {
      "name": "native-watch-resume-build-before",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json --config '{\"build\":{\"beforeBuildCommand\":null}}' ",
      "result": "fail",
      "failures": 1,
      "note": "resume-native-build.log: E0277 because NativeError did not implement Display when composing final-capture and watcher-recovery failures. Added the private native error Display implementation without changing IPC data."
    },
    {
      "name": "native-watch-resume-size-before",
      "command": "pnpm check:architecture",
      "result": "fail",
      "failures": 1,
      "note": "The expanded backup adapter exceeds the existing 300-counted-line limit. Split native watcher setup and close/drain ownership into backup_watch and backup_close; no limit or audit was weakened."
    },
    {
      "name": "native-watch-resume-after",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json --config '{\"build\":{\"beforeBuildCommand\":null}}'\nLAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup-resume.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "resume-native-build-after.log builds the independent Acceptance bundle in 29.45s with the existing compact-unwind advisory. resume-after.log passes 1/1: repair automatically captures, a later new file is captured automatically, and immutable indexed history confirms its exact checkpoint. No manual capture substitutes for watching."
    },
    {
      "name": "native-watch-direct-consumers",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup-recovery.test.mjs tests/desktop/repository-backup-identity.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "resume-consumers.log: 3/3 pass, preserving cold identity/relink/replacement, admitted/external capture, private exclusions, real disposable-process crash recovery, final drain and repeated failed-close repair."
    },
    {
      "name": "native-watch-source-checks",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml\ncargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets --features e2e,custom-protocol -- -D warnings\ncargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings\npnpm check:architecture\npnpm check:app-ownership\npnpm spec:validate\npnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Strict ordinary/e2e all-target lint, format, architecture and App ownership pass. resume-spec.log: six validators/216 chapters/95 requirements; resume-first.log: 47 protected files/eight canonical chapters. The renderer preflight changes following this source slice belong to E-REPO-050 and retain their own native acceptance."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Renderer leave preflight and live watcher reattachment are E-REPO-050; the current review/Vite processes remain preserved until guarded shutdown.",
    "Original ordinary-App editor-save/Quit, restore/search, real providers, platform/release and visual gates remain separate."
  ]
}
```
