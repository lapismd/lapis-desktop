# Native memory storage dependency compatibility

```json
{
  "id": "E-CORE-009",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": ["LD-GOV-006", "LD-VAULT-002", "LD-VAULT-003", "LD-FILE-003"],
  "versions": {
    "desktopBaseline": "889121c6",
    "notesCore": "575bef1f",
    "lapisAI": "6548afe0",
    "lapisTerminal": "d7e0a7cd",
    "jjStore": "95d46e44"
  },
  "contractReview": "Consume committed Notes memory storage types and methods through the existing Core dependency. The native Cargo graph and Desktop database adapter remain unchanged. These new methods are source-qualified but not selected by the production Desktop database transport.",
  "milestoneReview": "M16.2 remains Done through E-CORE-003/004. This record qualifies focused dependency/service compilation, not memory adapter adoption or R5 scheduling. E-CORE-008 retains the 230-case Desktop qualification against Notes fa9581f0; E-CORE-005 retains the three-cold-native gate against 67a57aa9. No native UI/OS, provider, hosted, Linux or distribution gates are widened.",
  "runs": [
    {
      "name": "qualified-baseline",
      "command": "Review E-CORE-008 and unchanged Core file-service tests/Cargo inputs",
      "result": "pass",
      "failures": 0,
      "note": "The two existing service cases passed against Notes fa9581f0. Notes memory intake adds no dependency edge or version. Source qualification now passes nine focused storage cases, two protocol cases, 138 full Rust cases, 1,261 API cases, 20 check/test and 11 build tasks, plus all nine canonical lanes."
    },
    {
      "name": "exact-native-service",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two pass, zero failed/ignored. Existing compact-unwind linker warning remains. Log .local/core-db-memory-service.log. This proves dependency compatibility; these cases do not exercise the unadopted memory facade."
    },
    {
      "name": "strict-normal-and-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat with --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Both native configurations pass. Logs .local/core-db-memory-clippy.log and .local/core-db-memory-clippy-e2e.log. No app is launched; compilation is distinct from native UI acceptance."
    },
    {
      "name": "native-source-state",
      "command": "jj status in Notes, AI, Terminal and JJ Store; inspect native inputs",
      "result": "pass",
      "failures": 0,
      "note": "All owning sources clean at the recorded revisions before qualification. No source input changes during consumer checks. Cargo.lock is unchanged."
    }
  ],
  "files": [
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-009.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "remaining": []
}
```

Commit verification commands are `pnpm progress:generate`, formatting generated
`MIGRATION.md`, snapshotting JJ before `pnpm check:progress`, `pnpm spec:check`
and changed-document Prettier. Logs use `.local/core-db-memory-progress*`,
`.local/core-db-memory-spec.log` and `.local/core-db-memory-format.log`.

No Desktop runtime code, dependency selection, UI or lifecycle changes. The full
native suite is not repeated for unused database catalogue additions; new
storage behavior is independently qualified in the owning Notes source.
