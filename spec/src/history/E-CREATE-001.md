# Exclusive native new-file creation

Targeted M5 component evidence; aggregate gates remain open.

```json
{
  "id": "E-CREATE-001",
  "tasks": ["M5"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-MIG-002",
    "LD-FILE-001",
    "LD-FILE-006"
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
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec-validator.config.mjs",
    "src/lib/native/native-bridge.ts",
    "src-tauri/src/file_commands.rs",
    "src-tauri/src/vault/creates.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/mutations.rs",
    "src-tauri/src/vault/staged.rs",
    "src-tauri/src/vault/writes.rs",
    "src-tauri/tests/vault_creates.rs",
    "tests/desktop/entry.ts",
    "tests/desktop/file-creation.test.mjs",
    "tests/governance/contracts.test.mjs",
    "tests/renderer/native-file-create.test.mjs",
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-CREATE-001.md",
    "spec/src/current/migration.md"
  ],
  "result": "pending",
  "remaining": [
    "Integrate attachment creation intent in the owning plugin and finish App watch/tree/metadata reconciliation, native actions and HTTP representation normalization.",
    "After M7 implementation, run all session-deferred full source, Storybook/accessibility, web, Desktop, normal bundle and original M4\u2013M7 gates."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-create-before",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_creates",
      "result": "fail",
      "failures": 10,
      "note": "Missing create_file produces ten compiler diagnostics; no test cases execute."
    },
    {
      "name": "native-create-exact",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_creates",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 5
      },
      "note": "Covers Unicode/binary bytes and mtime, existing and racing destinations, failure/size cleanup and capability containment."
    },
    {
      "name": "native-affected",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_creates --test vault_mutations --test vault_access --test vault_conditional --test vault_watch --test watch_registry",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 35,
        "files": 6
      }
    },
    {
      "name": "renderer-before",
      "command": "node --test tests/renderer/native-file-create.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Exclusive creation capability/transport unavailable before implementation."
    },
    {
      "name": "renderer-exact",
      "command": "node --test tests/renderer/native-file-create.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      }
    },
    {
      "name": "affected-node",
      "command": "node --test tests/renderer/native-file-create.test.mjs tests/renderer/native-file-operations.test.mjs tests/renderer/native-file-watch.test.mjs tests/renderer/vault-client.test.mjs tests/governance/contracts.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 25
      }
    },
    {
      "name": "source-creation",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/exclusive-native-create.test.ts src/lib/__tests__/new-file-creation.test.ts src/lib/__tests__/vault.test.ts src/lib/__tests__/pending-vault-operations.test.ts src/lib/__tests__/file-manager.test.ts src/lib/__tests__/desktop-native-storage.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 34
      },
      "note": "Notes 023259d9. Seven initial failures, one fixture-order repair and one additional incomplete-provider before failure are retained in the owning source record; final exact/affected cases pass."
    },
    {
      "name": "source-explorer-public-checks",
      "command": "pnpm --filter @lapis-notes/file-explorer test; pnpm --filter @lapis-notes/api check; pnpm --filter @lapis-notes/api build; pnpm --filter @lapis-notes/file-explorer check; pnpm --filter @lapis-notes/file-explorer build; pnpm check:app-ownership; pnpm spec:first; pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "explorerCases": 28,
        "svelteErrors": 0,
        "svelteWarnings": 0,
        "requirements": 1465
      },
      "note": "Separate commands pass. One requirement-sentence diagnostic is repaired without removing constraints; full session lanes stay deferred."
    },
    {
      "name": "public-archive-install",
      "command": "node scripts/local-archives.mjs .local/m5-create/desktop.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 12,
        "importRoutes": 12
      },
      "note": "Fresh API/Explorer outputs replace only those two in the complete qualified set; tracked semver dependency files remain portable."
    },
    {
      "name": "strict-native-checks",
      "command": "CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "fresh-consumer-build",
      "command": "pnpm check:types; CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Separate commands pass; actual native tests start only after the build terminal exits zero."
    },
    {
      "name": "evidence-snapshot-attempt",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "New evidence was absent from the last JJ snapshot used by read-only governance tools. Snapshot the new files with jj st and rerun; all protected files retain fresh evidence coverage."
    },
    {
      "name": "mapped-chapter-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Native runner change also maps to current/migration.md. Add the missing mapped chapter annotation without altering any completion gate and rerun."
    },
    {
      "name": "cold-webview-create",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-creation.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Public adapter preserves collisions and exact Unicode/binary bytes. Actual Explorer creates successive unique notes and tree rows. Native close exits normally."
    },
    {
      "name": "related-cold-mutations-lifecycle",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-operations.test.mjs tests/desktop/file-deletion.test.mjs tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 8
      },
      "note": "Real mutation collisions, protected deletion, failed saves, edit/quit/relaunch, switching and startup recovery remain qualified."
    },
    {
      "name": "specification-and-source-boundaries",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 30,
        "specificationLanes": 4
      },
      "note": "Separate commands pass. Snapshot new evidence before the governance tools read JJ state; aggregate gates remain open."
    }
  ],
  "contractReview": "Capability-opened staging writes bounded complete bytes and uses atomic no-replace publication. Existing and newly arriving destinations survive; failed staging cleans temporary files. Native capabilities advertise only implemented platforms. Shared FileManager creation intent selects optional exclusivity and retains admission through tree/cache/events; low-level legacy Vault overwrite semantics stay explicit. No consumer override or new screen is introduced.",
  "milestoneReview": "M5 remains In progress; this is component qualification. Preserve original gates and separately committed post-M7 planning. Deno host source is frozen. Publication, signing, visual baselines and review profiles are unchanged.",
  "archives": [
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "8930108af15d30ee42002b2bb7592694c329b370f987c39e53bffb79c751c12b",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "023259d96d4ff0414fec6427924ed917f89405a3",
        "packageDirectory": "packages/api"
      }
    },
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.1.2",
      "sha256": "d64d8227b37ef3777f718131b46542d1fb249b4bc931aa030b9b878feb4ccb9d",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "023259d96d4ff0414fec6427924ed917f89405a3",
        "packageDirectory": "packages/file-explorer"
      }
    }
  ]
}
```
