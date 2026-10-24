# Shared database-foundation dependency intake

```json
{
  "id": "E-CORE-005",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": ["LD-GOV-006", "LD-VAULT-002", "LD-VAULT-003", "LD-FILE-003"],
  "versions": {
    "desktopBaseline": "5c0cce11",
    "notesCore": "67a57aa9",
    "lapisAI": "6548afe0",
    "jjStore": "47a73e13",
    "acceptanceSha256": "e17b93fd54a1b81c1eece1b6a6a46c0d7bafb8bb783e8e3a50e902e896de0424"
  },
  "contractReview": "Refresh the native dependency graph for the shared high-level AppDatabase metadata foundation and additive protocol DTOs. Existing Desktop database adapter, file frames, media policy and lifecycle remain unchanged; hosted shell and full database intake are separate gates.",
  "milestoneReview": "M16.2 remains Done through E-CORE-003. This native dependency intake does not complete R1.3 browser-shell or backup lifetime, R3 database/indexing, M15.1, provider or distribution gates.",
  "runs": [
    {
      "name": "locked-baseline",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "fail",
      "failures": 1,
      "note": "Cargo requires the new normal serde_json/tokio/turso core dependency edges; no cases run."
    },
    {
      "name": "focused-lock-refresh",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --offline",
      "result": "pass",
      "failures": 0,
      "note": "Both native shared-file-service cases pass. Only three core dependency edges are added; all existing locked packages/versions are retained."
    },
    {
      "name": "complete-native",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "230 cases pass; zero fail and the same two ignored helpers."
    },
    {
      "name": "clippy-normal",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "clippy-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "normal-build",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo build --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary app builds; the previously recorded linker unwind-size warning is unchanged."
    },
    {
      "name": "source-audits",
      "command": "pnpm check:architecture && pnpm check:app-ownership",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "cold-native-api",
      "command": "CARGO_INCREMENTAL=0 pnpm test:desktop:api",
      "result": "pass",
      "failures": 0,
      "note": "The rebuilt e2e bundle passes all three actual cold hidden-native file, AI-admission and history-admission cases. Visibility/focus remain false; no headed OS or provider gate is claimed."
    },
    {
      "name": "canonical-before-reference",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Spec-first requires the mapped desktop.md chapter for the dependency-lock change. Extended its existing core-intake range from E-CORE-001\u2013004 to E-CORE-001\u2013005; no requirement or gate changes."
    },
    {
      "name": "canonical-progress-format",
      "command": "pnpm progress:generate && pnpm check:progress && pnpm spec:check; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "All configured specification/progress lanes and changed-document formatting pass. Original task statuses and completion gates are unchanged."
    }
  ],
  "files": [
    "src-tauri/Cargo.lock",
    "spec/src/current/files.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-005.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "remaining": []
}
```

Notes owns the source-qualified metadata worker and generated DTOs. Desktop
still uses its existing database adapter; this record qualifies dependency
compatibility, not adoption of the new native database facade. No renderer or
product screen changes, new public permission, registry version update or Node
cutover occurs.
