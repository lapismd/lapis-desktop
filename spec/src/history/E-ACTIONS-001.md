# Native file actions through existing Explorer menus

Targeted M5 source/native evidence; original aggregate gates remain open.

```json
{
  "id": "E-ACTIONS-001",
  "tasks": ["M5"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-MIG-002",
    "LD-FILE-003",
    "LD-FILE-004",
    "LD-FILE-007"
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
    "MIGRATION.md",
    "scripts/check-bundle.mjs",
    "scripts/desktop-acceptance.mjs",
    "spec-validator.config.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-ACTIONS-001.md",
    "spec/src/history/index.md",
    "src-tauri/Cargo.toml",
    "src-tauri/src/action_acceptance.rs",
    "src-tauri/src/file_commands.rs",
    "src-tauri/src/lib.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/system_actions/macos.rs",
    "src-tauri/src/system_actions/mod.rs",
    "src-tauri/src/vault/action_targets.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/tests/macos_system_actions.rs",
    "src-tauri/tests/system_action_targets.rs",
    "src/lib/native/native-bridge.ts",
    "tests/desktop/entry.ts",
    "tests/desktop/file-deletion.test.mjs",
    "tests/desktop/system-file-actions.test.mjs",
    "tests/governance/contracts.test.mjs",
    "tests/renderer/native-system-actions.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Complete remaining M5 internal mutation UI consistency, attachment import/exclusive integration and inherited HTTP representation qualification.",
    "After M7 implementation, run all session-deferred full source, Storybook/accessibility, web, Desktop and ordinary bundle lanes and the original M4–M7 gates."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-targets-before",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test system_action_targets",
      "result": "fail",
      "failures": 9,
      "note": "Missing action_target produces nine compiler diagnostics; no cases execute. Initial implementation then has two NSArray generic diagnostics, fixed by borrowing the URL. Absolute conversion adds five missing-to_relative diagnostics before implementation. Logs retained under .local/m5-actions."
    },
    {
      "name": "native-affected",
      "command": "CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test system_action_targets --test macos_system_actions --test vault_mutations --test vault_access --test vault_watch",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 30,
        "files": 5
      },
      "note": "Includes pinned target replacement/root/symlink rejection and a real OS-trash/restore round trip preserving exact fixture bytes."
    },
    {
      "name": "strict-native-check",
      "command": "CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "source-trash-and-explorer-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-system-trash.test.ts; pnpm --filter @lapis-notes/file-explorer exec vitest run src/lib/native-explorer-actions.test.ts",
      "result": "fail",
      "failures": 7,
      "note": "Owning source record retains three initial trash failures, one invalid acknowledgement regression and three Explorer failures; no failing assertion is weakened."
    },
    {
      "name": "source-trash-and-explorer-after",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-system-trash.test.ts src/lib/__tests__/desktop-native-storage.test.ts src/lib/__tests__/vault.test.ts src/lib/__tests__/vault-reconciliation.test.ts src/lib/__tests__/file-manager-trash.test.ts; pnpm --filter @lapis-notes/file-explorer test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "apiPassed": 35,
        "explorerPassed": 31
      },
      "note": "Notes bac3e5ed: exact system-trash six cases and Explorer native-action seven cases pass. Explicit App notices, clipboard absence, optional unsupported fallback and valid acknowledgement are covered."
    },
    {
      "name": "source-public-lanes",
      "command": "pnpm --filter @lapis-notes/api check; pnpm --filter @lapis-notes/api build; pnpm --filter @lapis-notes/file-explorer check; pnpm --filter @lapis-notes/file-explorer build; pnpm spec:first; pnpm spec:validate; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "requirements": 1472
      },
      "note": "Separate commands, built types/publint and changed-file formatting pass. Full source/story/web qualification remains session-deferred. See spec/records/2026-10-16-native-system-trash-and-actions.md in the source repository."
    },
    {
      "name": "renderer-before",
      "command": "node --test tests/renderer/native-system-actions.test.mjs",
      "result": "fail",
      "failures": 4,
      "note": "Three initial failures and one later absolute-conversion failure. Exact after has four passing cases."
    },
    {
      "name": "governance-before",
      "command": "node --test --test-name-pattern='M5 filesystem implementations' tests/governance/contracts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Require explicit files.md mapping for the new native action modules instead of relying on general shell mapping."
    },
    {
      "name": "affected-renderer-governance",
      "command": "node --test tests/renderer/native-system-actions.test.mjs tests/renderer/native-file-operations.test.mjs tests/renderer/native-file-create.test.mjs tests/renderer/native-file-watch.test.mjs tests/renderer/vault-client.test.mjs tests/governance/contracts.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 29
      }
    },
    {
      "name": "native-menu-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/system-file-actions.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Previous bundle lacks Reveal in Finder in the real Explorer menu. This failure precedes archive refresh and fresh native build."
    },
    {
      "name": "verified-public-archives",
      "command": "node scripts/local-archives.mjs .local/m5-actions/desktop.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 12,
        "importRoutes": 12
      },
      "note": "Refresh only API/Explorer within the complete qualified archive cohort. Tracked registry dependency files remain unchanged."
    },
    {
      "name": "consumer-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      }
    },
    {
      "name": "fresh-native-build",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Renderer bundle and debug native application finish successfully before UI acceptance. Uses verified API/Explorer archives and isolated child profiles."
    },
    {
      "name": "native-menu-exact-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/system-file-actions.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Actual Explorer menus call Finder reveal, default-app open for a unique PNG and macOS Trash for the disposable note. Passive receipts confirm successful OS dispatch; no local-trash copy is created. The fixture is restored through Foundation and its exact bytes survive."
    },
    {
      "name": "native-affected-lifecycle-mutations-and-fallback",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-operations.test.mjs tests/desktop/file-deletion.test.mjs tests/desktop/file-creation.test.mjs tests/desktop/file-reconciliation.test.mjs tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 12
      },
      "note": "Retains explicit-unavailable local-trash fallback and failed dirty-writer protection independently of the real OS-trash scenario. Includes cold restore, failed close/reload, repeated vault switches, exclusive create and clean/dirty external reconciliation."
    },
    {
      "name": "specification-and-boundaries",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 32,
        "specificationLanes": 4
      },
      "note": "Separate commands pass; generated progress and all original gates remain intact. Broader qualification stays deferred until M7 implementation is complete."
    }
  ],
  "contractReview": "Existing Explorer menus and public API ports own presentation and shared projection. macOS actions pin an admitted descriptor and a validated file-reference URL before OS dispatch. Path conversion rejects outside prefixes without probing them. System trash rejects the root, acknowledges explicitly and projects once; unsupported platforms preserve the local-trash fallback. Passive acceptance receipts are e2e-only and excluded from normal bundles. No generic native permission or replacement screen is introduced.",
  "milestoneReview": "Targeted native file-action slice only. M5 remains In progress under its original gate, including import and HTTP representation requirements. M4–M7 aggregate and full qualification stay open. Deno remains frozen; signing, publishing, ordinary user profiles and the post-M7 plugin plan remain untouched.",
  "archives": [
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "35b4b1a8680ebb8357e8d456e02727aa516d1b1686b202f17961a0ad97288734",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "bac3e5eda6f467dbc86ec88c9f27a275f2b27953",
        "packageDirectory": "packages/api"
      }
    },
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.1.2",
      "sha256": "871bcc5efdb9ac6139fa7216d2d28dcbe19f2c14b4102304df0c12984330ccc5",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "bac3e5eda6f467dbc86ec88c9f27a275f2b27953",
        "packageDirectory": "packages/file-explorer"
      }
    }
  ]
}
```
