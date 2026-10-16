# E-FILES-001: Contained native mutation component

```json
{
  "id": "E-FILES-001",
  "tasks": ["M5"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-MIG-002",
    "LD-FILE-001",
    "LD-FILE-002",
    "LD-FILE-003",
    "LD-FILE-004",
    "LD-FILE-005"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "files": [
    "scripts/desktop-acceptance.mjs",
    "scripts/progress.mjs",
    "scripts/spec-contracts.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec-validator.config.mjs",
    "src/lib/native/native-bridge.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/src/app.rs",
    "src-tauri/src/file_commands.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/native_host.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/mutations.rs",
    "src-tauri/src/vault_commands.rs",
    "src-tauri/tests/vault_mutations.rs",
    "tests/desktop/file-operations.test.mjs",
    "tests/governance/contracts.test.mjs",
    "tests/renderer/native-file-operations.test.mjs",
    "tests/renderer/vault-client.test.mjs",
    "MIGRATION.md",
    "spec/src/history/E-FILES-001.md",
    "spec/src/history/index.md"
  ],
  "result": "pending",
  "remaining": [
    "Implement native watching, bounded delivery, overflow/reconciliation and retirement with App-owned tree/metadata ingestion.",
    "Qualify existing File Explorer dirty rename/move/delete and closed/retired writers; audit deletion guard and operation lifetime.",
    "Prevent note/attachment creation collisions through the owning source contracts, then qualify attachment import.",
    "Implement and qualify native file reveal and available system-trash behavior.",
    "Retain and qualify the inherited renderer HTTP representation contract (LD-FILE-005 / LN-DENO-076).",
    "After M7 implementation, run all session-deferred full repository/consumer/native suites and original milestone gates."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "contract-discovery-before",
      "command": "node --test tests/governance/contracts.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "New files.md is not a governed role/spec-first chapter, and M5 requirement IDs are unknown to progress. Both exact cases pass after sharing the chapter list."
    },
    {
      "name": "file-change-map-before",
      "command": "node --test --test-name-pattern='M5 filesystem implementations' tests/governance/contracts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "M5 source/test paths lack an explicit files.md map. The exact target passes with the mapped contract; general desktop coverage remains."
    },
    {
      "name": "renderer-mutation-before",
      "command": "node --test tests/renderer/native-file-operations.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The bridge rejects desktop_fs_rename as unavailable. The exact target passes after typed relative-path forwarding; new destinations reject traversal before IPC."
    },
    {
      "name": "rust-absent-api-before",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_mutations",
      "result": "fail",
      "failures": 1,
      "counts": {
        "compilerDiagnostics": 23,
        "executedCases": 0
      },
      "note": "The six new mutation cases cannot compile because the native methods do not exist. Do not count missing-method diagnostics as executed test failures."
    },
    {
      "name": "portable-removal-before",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_mutations file_and_directory_removal_have_distinct_nonrecursive_semantics",
      "result": "fail",
      "failures": 1,
      "note": "macOS returns PermissionDenied for directory removal through unlink. Explicit supported-type checks now return IsADirectory/NotADirectory; the exact case passes."
    },
    {
      "name": "changed-contract-and-fixture-attempts",
      "command": "node --test tests/governance/contracts.test.mjs tests/governance/progress.test.mjs tests/governance/evidence-files.test.mjs tests/renderer/native-file-operations.test.mjs tests/renderer/vault-client.test.mjs",
      "result": "fail",
      "failures": 3,
      "note": "Two independent runs: one stale assertion expects remove to remain unavailable, then two unrelated call counts were accidentally changed by an over-broad text replacement. The public remove case now asserts admitted native success; shell/unknown-root denial remains. Restore the unrelated counts to their parent values. Final affected command plus the new map case passes all 22; no negative boundary is waived."
    },
    {
      "name": "node-affected-final",
      "command": "node --test tests/governance/contracts.test.mjs tests/governance/progress.test.mjs tests/governance/evidence-files.test.mjs tests/renderer/native-file-operations.test.mjs tests/renderer/vault-client.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 22
      }
    },
    {
      "name": "rust-filesystem-affected",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_mutations --test vault_access --test vault_conditional --test vault_resources --test vault_interruptions",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 28,
        "preexistingIgnoredChildHelpers": 1
      },
      "note": "Eight mutation cases include concurrent copy publication and bounds/cleanup, plus 20 affected admission, exact-write, resource and interruption regressions. The ignored child-process helper predates this slice; no new skips."
    },
    {
      "name": "public-checks",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Independent commands pass. Cargo.lock adds only the root dependency on already-locked rustix 1.1.5; no registry dependency versions change."
    },
    {
      "name": "fresh-native-build",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Fresh renderer and isolated Acceptance.app bundle; ordinary review profile and Documents/tauri-vault remain untouched."
    },
    {
      "name": "native-unavailable-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-files-before node --test --test-concurrency=1 tests/desktop/file-operations.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Old bundle rejects the rename request variant, before any mutation assertion can pass."
    },
    {
      "name": "native-revocation-fixture-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-files-after node --test --test-concurrency=1 tests/desktop/file-operations.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "All mutation/type/collision checks pass, but the fixture incorrectly expects EINVAL for revoked authority. Existing VaultManager.get intentionally returns EACCES. Correct the expectation to that authoritative contract; no product error mapping is relaxed."
    },
    {
      "name": "native-mutation-component",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-files-qualified node --test --test-concurrency=1 tests/desktop/file-operations.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Actual WebView command serialization/admission, Unicode paths, physical disk bytes, no-clobber rename/copy, distinct removal errors and closed-admission rejection pass. This component proof does not claim App/UI/watch qualification."
    },
    {
      "name": "specification-progress-and-format",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "specificationLanes": 4,
        "tasks": 14,
        "evidenceRecords": 26
      },
      "note": "The specification, mdBook, source budgets, roles, explicit M5 mapping and immutable evidence checks remain enabled. No original task gate changes."
    },
    {
      "name": "changed-source-and-document-format",
      "command": "pnpm exec prettier --check MIGRATION.md scripts/desktop-acceptance.mjs scripts/progress.mjs scripts/spec-contracts.mjs spec/src/SUMMARY.md spec/src/current/desktop.md spec/src/current/files.md spec/src/current/governance.md spec/src/current/index.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/history/E-FILES-001.md spec/src/history/index.md spec-validator.config.mjs src/lib/native/native-bridge.ts tests/desktop/file-operations.test.mjs tests/governance/contracts.test.mjs tests/renderer/native-file-operations.test.mjs tests/renderer/vault-client.test.mjs",
      "result": "pass",
      "failures": 0
    }
  ],
  "contractReview": "M5 retains its full original gate and all mapped inventory scope. The first native component adds contained rename/move, copy, file and recursive/nonrecursive directory removal under the existing vault_fs admission. rustix 1.1.5 (already locked) supplies safe atomic no-replace rename relative to capability-opened parents; no raw pointer interop, ambient paths, broader permission or destination overwrite is introduced. Copy stages bounded complete bytes with cleanup and preserved mode. Rename supports same-path and case-only names without replacing distinct existing destinations. Split picker/profile dispatch from file commands to retain the source budget. A shared canonical chapter list makes files.md authoritative in both specification and progress, with explicit source mapping and unchanged evidence/gate checks.",
  "milestoneReview": "M5 is In progress, not Done. Component Rust/renderer/native transport proof does not establish the full application UI, watcher, attachment/native-action or inherited proxy gate. M4 aggregate qualification and diagnostic clipboard delivery remain for the end of M7. Full suites remain deferred only for this resumed session. Deno, .lapis policy, ordinary profiles, signing, publication and visual baselines remain unchanged."
}
```
