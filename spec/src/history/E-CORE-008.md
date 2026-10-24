# Native task facade dependency compatibility

```json
{
  "id": "E-CORE-008",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": ["LD-GOV-006", "LD-VAULT-002", "LD-VAULT-003", "LD-FILE-003"],
  "versions": {
    "desktopBaseline": "26989b92",
    "notesCore": "fa9581f0",
    "lapisAI": "6548afe0",
    "lapisTerminal": "d7e0a7cd",
    "jjStore": "95d46e44",
    "jjNativeSourceUnchangedFrom": "47a73e13",
    "chrono": "0.4.45"
  },
  "contractReview": "Consume the committed native task facade and staged-commit event publisher through the existing shared file dependency. Add only the required Core Chrono edge at the already-selected 0.4.45. Desktop retains its current database adapter and renderer frames.",
  "milestoneReview": "M16.2 remains Done through its original E-CORE-003/004 gates. This dependency check does not qualify database adoption or expand the E-CORE-005 cold native acceptance, hosted shell, backup, provider, Linux or distribution gates.",
  "runs": [
    {
      "name": "locked-before",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "fail",
      "failures": 1,
      "note": "The prior graph lacks the new direct Core Chrono edge. Cargo refuses the locked build; zero runtime cases. Log .local/core-db-tasks-before.log."
    },
    {
      "name": "offline-lock-refresh-and-narrowing",
      "command": "cargo update --manifest-path src-tauri/Cargo.toml --offline -p lapis-app-core; preserve every parent lockfile block except the updated Core block",
      "result": "pass",
      "failures": 0,
      "note": "One direct Chrono edge at existing 0.4.45. Restore the unrelated proposed generator downgrade and itertools removal; no package identities, versions or other edges change. Logs .local/core-db-tasks-lock.log and .local/core-db-tasks-resolved.lock."
    },
    {
      "name": "inactive-cache-cleanup",
      "command": "manifest inventory; process and lsof checks; unchanged-file identity checks; unlink listed old integration-test executables",
      "result": "pass",
      "failures": 0,
      "note": "Under standing approval removed 43 obsolete executables (0.666 GiB). Keep newest/current-run files, libraries, app binaries and all user data. Manifest .local/obsolete-task-consumer-test-executables.json. Free space 32.033 GiB before native checks."
    },
    {
      "name": "native-source-review",
      "command": "jj status in Notes, AI, Terminal and JJ Store; compare JJ native inputs from 47a73e13 to 95d46e44",
      "result": "pass",
      "failures": 0,
      "note": "All sources clean at recorded parents; JJ native inputs unchanged. Notes records 127 Rust cases, 1,255 API cases, 20 check/test and 11 build tasks, generated protocol and specification checks. No native source dependency is edited during consumer qualification."
    },
    {
      "name": "exact-native-service",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two pass, zero failed/ignored. Existing compact-unwind linker warning remains. Log .local/core-db-tasks-service.log."
    },
    {
      "name": "all-rust-native-cases",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "230 pass, zero failed; two subprocess helper functions remain ignored in direct enumeration and are invoked by the parent restart/interruption tests. No native windows launched. Log .local/core-db-tasks-native.log."
    },
    {
      "name": "initial-document-format",
      "command": "changed-file Prettier check; repeat after progress generation",
      "result": "fail",
      "failures": 3,
      "note": "Initial check flags the desktop chapter and new evidence record. After formatting those, progress generation rewrites unformatted MIGRATION.md. Format the generated document too. Logs .local/core-db-tasks-format-before.log and .local/core-db-tasks-format.log. No product assertion or source limit changes."
    },
    {
      "name": "strict-normal-and-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat with --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Both configurations pass. Logs .local/core-db-tasks-clippy.log and .local/core-db-tasks-clippy-e2e.log. Compilation does not qualify native UI or OS interactions."
    },
    {
      "name": "initial-progress-metadata",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "The new, uncommitted record accidentally contained repeated metadata fences after a drafting script appended its old JSON body. Rebuild this record with one metadata block and rerun the exact progress gate. No committed evidence is modified. Log .local/core-db-tasks-progress-check.log."
    },
    {
      "name": "governance-progress-format-final",
      "command": "pnpm progress:generate; format generated MIGRATION.md; snapshot JJ; pnpm check:progress; pnpm spec:check; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "45 tasks and 273 evidence records pass progress. All four canonical lanes and changed-document formatting pass. Governance and migration chapters retain 400 lines. Logs .local/core-db-tasks-progress-check-final.log, .local/core-db-tasks-spec.log and .local/core-db-tasks-format-final.log. No milestone gate or visual baseline changes."
    }
  ],
  "files": [
    "src-tauri/Cargo.lock",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-008.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "remaining": []
}
```

Desktop retains its existing database adapter. This dependency check is separate
from task/query source acceptance, host adoption and native UI/OS journeys.
