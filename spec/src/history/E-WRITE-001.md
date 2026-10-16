# E-WRITE-001: native conditional text storage

This record qualifies the storage primitive separately from editor conflict
detection and recovery. It cannot complete M4 by itself.

```json
{
  "id": "E-WRITE-001",
  "tasks": ["M4"],
  "requirements": ["LD-LIFE-006"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "specValidator": "0.1.4"
  },
  "files": [
    "MIGRATION.md",
    "scripts/check-bundle.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-WRITE-001.md",
    "spec/src/history/index.md",
    "src-tauri/src/native_host.rs",
    "src-tauri/src/vault/conditional.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/writes.rs",
    "src-tauri/src/vault_commands.rs",
    "src-tauri/tests/vault_conditional.rs",
    "src/native-bridge.ts",
    "tests/desktop/conditional.spec.mjs",
    "tests/desktop/entry.ts",
    "tests/desktop/wdio.conf.mjs",
    "tests/renderer/vault-client.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "before-native-conditional-target",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_conditional",
      "result": "fail",
      "failures": 1,
      "note": "Compilation fails with nine errors for the absent conditional method and conflict type; no case runs."
    },
    {
      "name": "before-public-adapter-target",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/conditional-native-write.test.ts",
      "result": "fail",
      "failures": 5
    },
    {
      "name": "public-adapter-target",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/conditional-native-write.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tests": 6
      }
    },
    {
      "name": "source-affected-native-storage",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/conditional-native-write.test.ts src/lib/__tests__/desktop-native-storage.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tests": 18,
        "newConditionalCases": 6
      }
    },
    {
      "name": "source-spec-requirement-limit",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "A five-sentence requirement exceeded the four-sentence contract. Independent optional-port and native-transport concerns were split into LN-PKG-167 and LN-PKG-168; no existing ID was reassigned."
    },
    {
      "name": "source-spec-first-mappings",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "The App Database and Deno-host mapped chapters initially needed updates. Both now distinguish conditional file authority and unsupported legacy-host behavior."
    },
    {
      "name": "native-conditional-storage-target",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_conditional",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tests": 6
      },
      "note": "Exact Unicode/absence preconditions, stale/deleted/appeared files, external change during staging, permissions/mtime, symlink/traversal containment and 64 MiB bounds."
    },
    {
      "name": "source-full-qualification",
      "command": "pnpm build && pnpm check && pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "buildTasks": 10,
        "checkTasks": 18,
        "units": 1569,
        "existingSkips": 1,
        "apiCases": 992
      }
    },
    {
      "name": "desktop-node-and-rust",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs; cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "counts": {
        "node": 30,
        "rust": 34,
        "rustSubprocessHelpersIgnored": 2
      },
      "note": "Final Node run follows the two additional renderer transport regressions; full Rust coverage includes six conditional-storage cases."
    },
    {
      "name": "full-native-webview-and-cold-lifecycle",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "webview": 27,
        "conditionalStorage": 3,
        "coldLifecycle": 8
      },
      "note": "Actual macOS WebView consumes the verified API archive. Three new cases use its public adapter, inspect disk content and preserve ECONFLICT. The eight cold cases use isolated profiles and no Node/Deno on PATH."
    },
    {
      "name": "source-storybook-interaction-and-accessibility",
      "command": "pnpm test:storybook --force",
      "result": "pass",
      "failures": 0,
      "counts": {
        "interactions": 249
      },
      "note": "Fresh four-shard run: 90 + 65 + 40 + 54. No visual baselines were changed."
    },
    {
      "name": "source-package-and-release-policy",
      "command": "pnpm packages:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "packageBoundaryTests": 2,
        "localConsumerTests": 9,
        "releaseToolTests": 101
      }
    },
    {
      "name": "legacy-packaged-host-compatibility",
      "command": "pnpm --filter @lapis-notes/desktop-deno package:app && pnpm test:desktop:packaged --force --core && pnpm test:desktop:packaged --force",
      "result": "pass",
      "failures": 0,
      "counts": {
        "packagedModes": 2
      },
      "note": "The legacy host advertises no conditional capability and remains unsupported for the optional method. Its established local bundle factory uses an ad-hoc launch signature; production signing and notarization remain deferred."
    },
    {
      "name": "source-specification-check",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanes": 6,
        "validatorRegressions": 38
      }
    },
    {
      "name": "ordinary-application-bundle",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "bundleMiB": 108.26,
        "rendererJavaScriptFiles": 216,
        "automationMarkers": 0
      },
      "note": "Ordinary macOS ARM64 application contains neither native automation nor a Node/Deno runtime. Signing remains deferred."
    },
    {
      "name": "source-current-web-and-server-hosts",
      "command": "LAPIS_SERVER_E2E_IMAGE=lapis-server-desktop-migration:runtime pnpm test:web:e2e --force",
      "result": "pass",
      "failures": 0,
      "counts": {
        "browserCases": 12,
        "verifiedServerFrontendFiles": 445
      },
      "note": "Current Linux dependency/runtime images and host-built server frontend; OPFS reload, database owner takeover, server edits/sharing/restart. No Docker configuration or build-limit changes."
    },
    {
      "name": "unchanged-original-task-gates-and-statuses",
      "command": "node --input-type=module; pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "unchangedGates": 14,
        "unchangedStatuses": 14,
        "tasks": 14,
        "evidenceRecords": 12
      },
      "note": "Inline assertions compare every ledger gate and status with @-. M4 remains In progress, LD-LIFE-004 remains Planned and completedGates has no M4 entry."
    },
    {
      "name": "complete-desktop-check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Published specification validator, source/App ownership audits, Svelte diagnostics, strict Clippy and formatting pass."
    },
    {
      "name": "committed-archive-byte-equivalence",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --mira ../mira-mde-desktop-migration --plugins ../lapis-plugins-desktop-migration --already-built; node --input-type=module",
      "result": "pass",
      "failures": 0,
      "counts": {
        "matchingArchives": 10
      },
      "note": "readArchiveManifest verifies checksums and packed identity/version. Every committed-source archive matches the installed native-qualified SHA256 receipt; source revisions match the three committed owning repositories. No reinstall or further runtime qualification is needed for byte-identical archives."
    },
    {
      "name": "complete-desktop-specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanes": 4
      },
      "note": "Final source/App ownership and progress validation, Rust formatting, mdBook and mapped spec-first pass. All fourteen original task gates and statuses remain unchanged; M4 is still In progress."
    }
  ],
  "contractReview": "The native primitive receives caller-owned expected text or absence and retains admitted-root containment, metadata, bounds, staging and atomic replacement. Supporting hosts advertise the capability; unsupported shared native hosts reject before IO without retry/fallback. Own requests serialize and detect changes during staging, but the check/rename interval is not a filesystem transaction with uncoordinated external writers. No global last-read cache is introduced.",
  "milestoneReview": "LD-LIFE-006 storage component only. M4 remains In progress with its original gate and no completedGates.M4. The current editor still saves unconditionally; document-owned baselines, observable conflicts and explicit recovery remain required under LD-LIFE-004. No signing, publication or later milestone is completed.",
  "scope": "Qualified optional conditional native storage only; editor conflict integration and the original M4 aggregate gate remain open.",
  "archives": {
    "@lapis-notes/ui": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
    "@lapis-notes/api": "2a724cc9d513852ea8973a5c947cec76c284b867d20bf9ffff81333ec49e5b1f",
    "@lapis-notes/language-service": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
    "@lapis-notes/file-explorer": "79d46a57325cfa601633c776bc128759020b962426c7f43ff35f67370c77e470",
    "@lapis-notes/workspace": "7e968a3173149c547e1195ea48b9a82ba9b396eae4b18166c53c009681453cc7",
    "@lapismd/mira": "2319ccb6279bb6bd6032046e0a22080e8527050b7c90e2e773735bb3e4d54f2e",
    "@lapismd/mira-editor": "850272c678a8e2e5106290189190eade8edab19be444235053f0945eb8ec41c3",
    "@lapismd/mira-plugin-ai": "efe9d5b774a0545e3119818e58987a34e6efdd488c45018c6418214740118823",
    "@lapismd/mira-plugin-mermaid": "0a8e215a3212d3e5075688a07b5da96e5a4ef01fa5fe2937c145da7882bf868e",
    "@lapis-notes/markdown": "51de62aa1477dfb75a27aff747d7b33b5b18eef5744308d334259e29145df687"
  },
  "sourceRevisions": {
    "git+https://github.com/lapismd/lapis-notes.git": "fdee7e4defde17a1009e16138d78c93c3ead8e2f",
    "git+https://github.com/lapismd/mira-mde.git": "b422c110b0b1e1de898b65a5647cbe0ae0eceb12",
    "git+https://github.com/lapismd/lapis-plugins.git": "3664313883a10b5bfdfca8898c820c8b4d2e4db4"
  }
}
```
