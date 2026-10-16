# Bounded native watch transport

Targeted transport evidence; App ingestion and aggregate gates remain pending.

```json
{
  "id": "E-WATCH-001",
  "tasks": ["M5"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-DESK-003",
    "LD-MIG-002",
    "LD-FILE-002"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "notify": "8.2.0",
    "platform": "macOS ARM64"
  },
  "files": [
    "MIGRATION.md",
    "scripts/check-bundle.mjs",
    "scripts/desktop-acceptance.mjs",
    "scripts/source-audit.mjs",
    "spec-validator.config.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-WATCH-001.md",
    "spec/src/history/index.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/app.rs",
    "src-tauri/src/file_commands.rs",
    "src-tauri/src/lib.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/native_host.rs",
    "src-tauri/src/vault/files.rs",
    "src-tauri/src/vault_commands.rs",
    "src-tauri/src/watch/mod.rs",
    "src-tauri/src/watch/pending.rs",
    "src-tauri/src/watch/registry.rs",
    "src-tauri/src/watch/snapshot.rs",
    "src-tauri/src/watch_commands.rs",
    "src-tauri/tests/vault_watch.rs",
    "src-tauri/tests/watch_registry.rs",
    "src/lib/native/file-watch.ts",
    "src/lib/native/native-bridge.ts",
    "src/lib/native/vault-client.ts",
    "src/lib/native/vault-path.ts",
    "tests/desktop/entry.ts",
    "tests/desktop/file-watch.test.mjs",
    "tests/desktop/watch-entry.ts",
    "tests/governance/contracts.test.mjs",
    "tests/renderer/native-file-watch.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Implement shared App-owned vault tree, metadata and editor reconciliation, including dirty external rename/delete, overflow and resuming after failed leave.",
    "Qualify M5 File Explorer guards, exclusive creation/import, Finder/system trash and inherited HTTP representation behavior.",
    "After M7 implementation, complete all session-deferred Notes, Design Core, web/Storybook and Desktop full suites and original M4–M7 gates.",
    "Run the normal bundle automation-exclusion audit with final M7 qualification; the new e2e watch marker is now rejected by that audit."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-library-before",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_watch",
      "result": "fail",
      "failures": 1,
      "counts": {
        "compilerDiagnostics": 2,
        "executedCases": 0
      },
      "note": "No native watch module exists at the original regression boundary."
    },
    {
      "name": "native-channel-before",
      "command": "node --test --test-concurrency=1 tests/desktop/file-watch.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Old bundle rejects vault_watch_start as an unknown/disallowed command."
    },
    {
      "name": "renderer-module-before",
      "command": "node --test tests/renderer/native-file-watch.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "executedBehaviorCases": 0
      },
      "note": "The watch transport module does not exist."
    },
    {
      "name": "renderer-native-before",
      "command": "node --test --test-concurrency=1 --test-name-pattern='renderer watch bridge' tests/desktop/file-watch.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The old Acceptance bundle lacks the new test-only public bridge driver; this is a fixture-before state, not App reconciliation evidence."
    },
    {
      "name": "affected-node-final",
      "command": "node --test tests/renderer/native-file-watch.test.mjs tests/renderer/vault-client.test.mjs tests/renderer/native-file-operations.test.mjs tests/governance/contracts.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 23
      },
      "note": "Complete-frame validation, scope, gaps, bounds, startup failure, closure before start, cleanup retry and admission ownership pass with all directly affected existing bridge/client/map/audit cases."
    },
    {
      "name": "first-clippy-attempt",
      "command": "CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "fail",
      "failures": 1,
      "note": "One collapsible-if diagnostic in the native event callback; fix the source without an allowlist."
    },
    {
      "name": "overflow-fixture-attempt",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_watch --test watch_registry",
      "result": "fail",
      "failures": 1,
      "note": "Four watch cases pass; the burst fixture times out expecting only incremental delivery after the first overflow. Native hint deliveries may cover the burst more than once. Preserve the normative full-reconciliation path: every overflow list remains empty, and a fresh complete disk listing must include all 301 files. Do not require an incremental list after unresolved overflow."
    },
    {
      "name": "stale-development-archive-attempt",
      "command": "pnpm local:install; pnpm check:types; CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "fail",
      "failures": 2,
      "note": "The default five-package archive manifest is older than the qualified recovery set and lacks DesktopRecoveryBanner. One type diagnostic and one renderer build fail. Restore the eleven other qualified archives from the preceding recovery manifest and replace only API; no product workaround or dependency policy change."
    },
    {
      "name": "source-owned-watch-contracts",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/directory-watcher.test.ts src/lib/__tests__/native-watch-adapter.test.ts src/lib/__tests__/browser-storage.test.ts src/lib/__tests__/desktop-native-storage.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 52
      },
      "note": "Owning Notes commits ad4490ca and bdd49235; retirement and registration readiness records retain all before failures and source check/build/spec evidence. Full source suites remain deferred."
    },
    {
      "name": "native-watch-library-final",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_watch --test watch_registry",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 7
      },
      "note": "Actual Unicode changes and rename identity, shared-IO staging isolation, user filenames, scope/containment, root replacement, atomic replacement, overflow/full recovery, session ownership and capacity release."
    },
    {
      "name": "bounded-hint-library",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --lib watch",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      },
      "note": "Overflowed accumulation is bounded and requests reconciliation; nonrecursive/scoped hints retain containment."
    },
    {
      "name": "verified-archive-install",
      "command": "node scripts/local-archives.mjs .local/m5-watch/desktop.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 12,
        "importRoutes": 12
      },
      "note": "Replace only API in the preceding qualified recovery set; all hashes/source revisions are verified and portable tracked dependency files are restored."
    },
    {
      "name": "desktop-types-and-boundaries",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Separate commands pass against the corrected public archive set."
    },
    {
      "name": "fresh-native-consumer-build",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Fresh renderer and Acceptance.app consume all twelve archives. The test-only bridge driver awaits actual native registration; production does not import it."
    },
    {
      "name": "actual-native-watch-transport",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-watch.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      },
      "note": "Actual channel DTOs, scoped external create/modify/rename/delete, increasing sequences, stop/admission retirement and the production renderer bridge pass. App/UI ingestion is not claimed."
    },
    {
      "name": "canonical-specification-and-progress",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 27,
        "specificationLanes": 4
      },
      "note": "Original task gates and the full M5 inventory remain unchanged. The native watch directory, command and renderer modules explicitly map to files.md."
    },
    {
      "name": "strict-rust-and-format",
      "command": "CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; pnpm exec prettier --check MIGRATION.md scripts/check-bundle.mjs scripts/desktop-acceptance.mjs scripts/source-audit.mjs spec-validator.config.mjs spec/src/SUMMARY.md spec/src/current/desktop.md spec/src/current/files.md spec/src/current/governance.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/history/E-WATCH-001.md spec/src/history/index.md src-tauri/capabilities/main.json src/lib/native/file-watch.ts src/lib/native/native-bridge.ts src/lib/native/vault-client.ts src/lib/native/vault-path.ts tests/desktop/entry.ts tests/desktop/file-watch.test.mjs tests/desktop/watch-entry.ts tests/governance/contracts.test.mjs tests/renderer/native-file-watch.test.mjs; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "Strict Rust checks, changed-source/document formatting and source budgets pass. End-of-M7 full tests and normal bundle exclusion remain pending."
    }
  ],
  "contractReview": "Native notify watchers use capability-cloned roots and a shared IO gate, never the services mutex. Snapshots, pending hints, wire delivery and registry capacity are bounded. Unique physical identities supply rename hints; real similarly named user files are not filtered. Only exact local start/stop permissions are added. Close joins all session-owned workers before admission release, and renderer callbacks retire before asynchronous stop. Scope/continuity failures request full reconciliation without partial renderer delivery. App reconciliation remains source-owned and pending. Cargo.lock adds seven notify/backend packages and the required mio logging edge; no existing package versions or other dependency edges change.",
  "milestoneReview": "M5 remains In progress with its original gate and inventory unchanged. This native/renderer transport component does not qualify application tree, metadata or dirty-editor consistency. Full suites remain deferred only for this active delivery session until M7 implementation is complete. The ordinary review app/profile, Documents/tauri-vault, frozen Deno source, signing, publication and visual baselines are untouched.",
  "archives": [
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "33a07c006e1c54d5d4294e3a2ac4d496e52df97651ae0853f60ab0053a0df348",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "bdd492357135de2cc0175fa42413709b2a38cd63",
        "packageDirectory": "packages/api"
      }
    }
  ],
  "archiveSet": "The other eleven entries preserve E-RECOVERY-001 source revisions and hashes. The local installer verifies all twelve archives and public import routes; tracked portable manifests/registry lockfiles remain unchanged."
}
```
