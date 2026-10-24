# Native projection query dependency compatibility

```json
{
  "id": "E-CORE-007",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": ["LD-GOV-006", "LD-VAULT-002", "LD-VAULT-003", "LD-FILE-003"],
  "versions": {
    "desktopBaseline": "14a07f6b",
    "notesCore": "5deb28b0",
    "lapisAI": "6548afe0",
    "lapisTerminal": "d7e0a7cd",
    "jjStore": "95d46e44",
    "jjNativeSourceUnchangedFrom": "47a73e13",
    "icuCollator": "2.4.0"
  },
  "contractReview": "Consume committed Notes projection query DTOs and bounded native readers. Add the Base64/ICU edges and required ICU 2.4 group; preserve every unrelated package block and dependency selection. Desktop keeps its existing database adapter, renderer frames and native file policy.",
  "milestoneReview": "M16.2 remains Done through its original E-CORE-003/004 gates. This record qualifies two exact shared-file-service cases, 230 Rust cases and strict normal/e2e Clippy. E-CORE-005 remains the complete 230-case/three-cold-case qualification for Notes 67a57aa9. No database adoption, native WebView/UI/OS, provider, Linux, hosted shell, backup or distribution gate is widened.",
  "runs": [
    {
      "name": "locked-before",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "fail",
      "failures": 1,
      "note": "The old graph has ICU 2.3.1 and lacks the new direct edges. Cargo refuses the locked build; zero runtime cases. Log .local/core-db-projection-query-before.log."
    },
    {
      "name": "offline-lock-refresh-and-narrowing",
      "command": "cargo update --manifest-path src-tauri/Cargo.toml --offline -p lapis-app-core; restore unrelated package blocks from the parent lockfile",
      "result": "pass",
      "failures": 0,
      "note": "Retain only thirteen ICU packages at 2.4.0, required tinystr/yoke/zerovec/zerovec-derive updates and two Core edges. Restore resolver-proposed generator, certificate and schannel downgrades plus unrelated Windows/getrandom edges. No package identities added or removed. The exact locked rerun validates the narrowed graph. Logs .local/core-db-projection-query-lock.log and .local/core-db-projection-query-resolved.lock."
    },
    {
      "name": "exact-native-service",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two pass, zero fail/ignored. The existing compact-unwind linker warning remains. Log .local/core-db-projection-query-service.log."
    },
    {
      "name": "all-rust-native-cases",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "230 pass, zero failures. No app windows are launched. Log .local/core-db-projection-query-native.log."
    },
    {
      "name": "strict-normal-and-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat with --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Both native configurations pass. Logs .local/core-db-projection-query-clippy.log and .local/core-db-projection-query-clippy-e2e.log. These are compilation checks, not new native UI/OS acceptance."
    },
    {
      "name": "initial-progress-and-document-format",
      "command": "pnpm check:progress; changed-file Prettier and line-count review",
      "result": "fail",
      "failures": 1,
      "note": "Progress intentionally ignores unsnapshotted JJ files, so the first check could not see the new evidence. Snapshot the change before regenerating and validating progress. Formatting also put two current chapters one line above their existing limits; condense intake summaries without changing gates or limits."
    },
    {
      "name": "native-source-review",
      "command": "jj --no-pager diff --from 47a73e13 --to 95d46e44 --summary -- crates Cargo.toml Cargo.lock rust-toolchain.toml",
      "result": "pass",
      "failures": 0,
      "note": "No JJ Store native changes. Preserve its unrelated uncommitted documentation. AI and Terminal are clean at the recorded revisions. Notes source has 118 passing Rust cases and independent protocol/reference evidence."
    },
    {
      "name": "governance-progress-format-final",
      "command": "pnpm progress:generate && pnpm check:progress && pnpm spec:check; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes with 45 tasks and 272 evidence records. All four canonical lanes pass. Original milestone states/gates and visual baselines remain unchanged. Logs .local/core-db-projection-query-progress-check-final.log and .local/core-db-projection-query-spec-final.log."
    }
  ],
  "files": [
    "src-tauri/Cargo.lock",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-007.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "remaining": []
}
```

No product source changes. Shared query readers are source-qualified in Notes;
Desktop consumes their compiled dependency graph without selecting the new
database adapter. Native application review and original migration gates remain
separate from this compatibility result.
