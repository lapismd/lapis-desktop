# Native turn-core dependency compatibility

```json
{
  "id": "E-CORE-019",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.3"],
  "requirements": ["LD-GOV-006", "LD-DB-001", "LD-DB-002"],
  "versions": {
    "desktopBaseline": "efa44bb0",
    "notesCore": "1c793d8b",
    "lapisAI": "6548afe0",
    "rust": "1.99.0"
  },
  "contractReview": "Unchanged-contract confirmation: the committed shared Core adds an optional native ACP turn owner. Desktop still selects its existing file/database/backup profile; the new owner is not selected. Keep native admission, high-level database calls, reload detach and close/drain unchanged. Refresh only the required private dependency lock edge.",
  "milestoneReview": "M16.3 and R1.3 retain their committed intake qualification and explicit existing Markdown exception. This is native dependency compatibility, not Desktop adoption of R2 execution, hosted/provider qualification, a new JS archive cohort or distribution acceptance. Notes R2.1 source is qualified; R2.2/R2.3 remain required.",
  "runs": [
    {
      "name": "locked-before",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test core_file_service --test core_backup_service --test database_service",
      "result": "fail",
      "failures": 1,
      "note": "Cargo correctly refuses the stale lock graph before any case runs. The only required graph change adds the existing lapis-ai-service package to lapis-app-core's dependencies. No version is upgraded."
    },
    {
      "name": "native-services-after",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --test core_backup_service --test database_service",
      "result": "pass",
      "failures": 0,
      "note": "All six cases pass: two shared file-owner cases, one actual backup-engine lifecycle case and three high-level database/lifetime cases. Cargo refreshes only the one missing dependency edge; no package version changes."
    },
    {
      "name": "strict-normal",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm check:rust",
      "result": "pass",
      "failures": 0,
      "note": "All-target normal Clippy passes with warnings denied (51.31s)."
    },
    {
      "name": "strict-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "All-target e2e Clippy passes with warnings denied (52.16s)."
    },
    {
      "name": "exact-locked-after",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test core_file_service --test core_backup_service --test database_service",
      "result": "pass",
      "failures": 0,
      "note": "The original locked command now passes all six cases. The stale-lock preflight improves from one failure to zero. Native compilation retains its existing nonfatal unwind-table advisory; no source lint is suppressed."
    },
    {
      "name": "spec-first-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Governance evidence alone omits the mapped Desktop and migration chapters for the native lock/tracker change. Record the unchanged host contract and source-versus-adoption scope in both owning chapters; no validator or product gate is weakened."
    }
  ],
  "files": [
    "src-tauri/Cargo.lock",
    "MIGRATION.md",
    "spec/src/current/governance.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-CORE-019.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md"
  ],
  "remaining": []
}
```

Core's source-only execution receipt records 303 ordinary Rust cases/doctests,
twenty focused journal/execution cases and complete source check/test/build/spec
qualification. The protocol peer is a fixture; it does not qualify a provider.
The existing native application, signing and final cutover gates stay separate.

All tests are headless native-service checks. No app window, model download, JS
archive refresh or installed application replacement is performed. Existing
Desktop application receipts remain at their recorded revisions; this slice
qualifies compatibility with the new Core, not selection of its AI owner.
