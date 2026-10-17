# E-STRUCTURE-002: Native source organization

```json
{
  "id": "E-STRUCTURE-002",
  "tasks": ["M10.2"],
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-DESK-005",
    "LD-MIG-002"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "v26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4"
  },
  "files": [
    "AGENTS.md",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/integration.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/windows.md",
    "spec/src/history/E-STRUCTURE-002.md",
    "spec/src/history/index.md",
    "spec-validator.config.mjs",
    "src-tauri/src/acceptance/acp.rs",
    "src-tauri/src/acceptance/actions.rs",
    "src-tauri/src/acceptance/integration.rs",
    "src-tauri/src/acceptance/mod.rs",
    "src-tauri/src/acceptance/popouts.rs",
    "src-tauri/src/app.rs",
    "src-tauri/src/host/database.rs",
    "src-tauri/src/host/integration/menu.rs",
    "src-tauri/src/host/integration/mod.rs",
    "src-tauri/src/host/integration/services.rs",
    "src-tauri/src/host/lifecycle.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/shell.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/terminal.rs",
    "src-tauri/src/host/vault/files.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/host/vault/watch.rs",
    "src-tauri/src/host/windows/macos_chrome.rs",
    "src-tauri/src/host/windows/mod.rs",
    "src-tauri/src/host/windows/navigation.rs",
    "src-tauri/src/integration/mod.rs",
    "src-tauri/src/integration/policy.rs",
    "src-tauri/src/integration/urls.rs",
    "src-tauri/src/lib.rs",
    "src-tauri/src/lifecycle/mod.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/plugins/assets.rs",
    "src-tauri/src/plugins/mod.rs",
    "src-tauri/src/terminal/mod.rs",
    "src-tauri/src/terminal/policy.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/resources.rs",
    "src-tauri/src/vault/system_actions/macos.rs",
    "src-tauri/src/vault/system_actions/mod.rs",
    "src-tauri/tests/lifecycle_state.rs",
    "src-tauri/tests/macos_system_actions.rs",
    "src-tauri/tests/plugin_assets.rs",
    "src-tauri/tests/system_action_targets.rs",
    "src-tauri/tests/terminal_policy.rs",
    "src-tauri/tests/vault_resources.rs",
    "tests/governance/contracts.test.mjs",
    "tests/governance/source-audit.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "focused-baseline",
      "command": "node --test tests/governance/source-audit.test.mjs tests/governance/contracts.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 11
      }
    },
    {
      "name": "rust-baseline",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 77,
        "ignoredHelpers": 2
      }
    },
    {
      "name": "layout-guard-before",
      "command": "node --test tests/governance/source-audit.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 7
      },
      "note": "The new regression proves flat native implementation files were previously accepted."
    },
    {
      "name": "focused-after",
      "command": "node --test tests/governance/source-audit.test.mjs tests/governance/contracts.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 13
      }
    },
    {
      "name": "clippy-first-attempt",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "fail",
      "failures": 6,
      "note": "Five unresolved references and one unused self import after moving integration policy; corrected all callers to the new policy module."
    },
    {
      "name": "draft-evidence-before",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Generated MIGRATION.md after capturing evidence paths; validation rejected the uncovered generated path. Refreshed coverage without changing the validator."
    },
    {
      "name": "clippy-after",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "e2e-clippy",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "full-check",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Canonical validation, strict renderer types, normal all-target Clippy and repository formatting pass."
    },
    {
      "name": "full-test",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "node": 159,
        "policy": 300,
        "rust": 77,
        "total": 536,
        "ignoredRustHelpers": 2
      }
    },
    {
      "name": "app-ownership",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "equivalence-initial-comparators",
      "command": "python3 (two ad hoc module-path-normalized parent comparisons)",
      "result": "fail",
      "failures": 2,
      "note": "Both preliminary comparison scripts stopped at host/mod.rs because longer paths made rustfmt add expression blocks. The final comparison uses the actual Rust formatter on relocated parent code; no implementation change was needed."
    },
    {
      "name": "equivalence-final",
      "command": "python3 /tmp/lapis-native-layout-equivalence.py",
      "result": "pass",
      "failures": 0,
      "counts": {
        "movedImplementations": 27,
        "registeredCommands": 27,
        "nativeRootEntrypoints": 2
      },
      "note": "Each relocated implementation exactly matches the parent after explicit module-path replacement, module declarations and rustfmt. All registered IPC names and order are identical."
    },
    {
      "name": "canonical-check",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Validation, Rust format, mdBook and mapped spec-first pass; original task gates and statuses are preserved."
    },
    {
      "name": "normal-local-bundle",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app",
      "result": "pass",
      "failures": 0,
      "note": "Fresh normal Vite renderer and native macOS app build. Existing Vite large-chunk advisory remains; no threshold change."
    },
    {
      "name": "normal-bundle-audit",
      "command": "pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "automationMarkers": 0,
        "rendererJavaScriptFiles": 357
      },
      "note": "ARM64 ordinary bundle excludes all acceptance markers, fixture resources and Node/Deno runtimes. Signing remains deferred."
    },
    {
      "name": "e2e-rust-tests",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --features e2e --locked",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 77,
        "ignoredHelpers": 2
      }
    },
    {
      "name": "acceptance-resource-preparation",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node scripts/prepare-acp-acceptance.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Prepared the existing isolated native fixture from clean lapis-ai source revision 2d3a8b8c074839027cd7580e69f4dd0780e7be3c; no sibling source changes."
    },
    {
      "name": "e2e-local-bundle",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Fresh acceptance renderer and macOS app build with relocated adapters and the existing debug-only instrumentation."
    },
    {
      "name": "unchanged-task-gates",
      "command": "node --input-type=module (compare parseTasks against jj file show -r @- spec/src/current/progress/milestones.md, omitting only selected evidence)",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 26
      },
      "note": "Every status, dependency, requirement, original gate and next action matches the parent. Only selected maintenance evidence changes."
    },
    {
      "name": "cold-native-first",
      "command": "node --test --test-concurrency=1 tests/desktop/{lifecycle,notes-lifecycle,file-operations,file-watch,system-file-actions,integration-ports,integration-urls,plugin-assets,window-chrome,popout-host,terminal-lifecycle,acp-transport}.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 34,
        "total": 35
      },
      "note": "Fresh e2e artifact, isolated native-layout-ERJplg profiles and no Node/Deno app PATH. ACP reload hit a 10s execute/sync driver timeout at the readiness observation; the other 34 native cases passed. No code, timing or assertions were changed."
    },
    {
      "name": "acp-reload-exact-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/native-layout-ERJplg node --test --test-name-pattern=\"renderer reload reconnects retained work without prompting again\" tests/desktop/acp-transport.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "The exact unchanged case passed in a new native process with a new isolated profile in 1.90 seconds. Original permission, provider-count, retained-work and process-reaping assertions remain."
    },
    {
      "name": "cold-native-after",
      "command": "node --test --test-concurrency=1 tests/desktop/{lifecycle,notes-lifecycle,file-operations,file-watch,system-file-actions,integration-ports,integration-urls,plugin-assets,window-chrome,popout-host,terminal-lifecycle,acp-transport}.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 35,
        "files": 12
      },
      "note": "Fresh full rerun against the same freshly built e2e artifact and new isolated native-layout-fIEzHL profiles passes every selected case, including the exact ACP reload. Actual processes use /usr/bin:/bin with no Node/Deno runtime. Covers guarded note/database/vault closure, scoped files/watch, OS actions, URLs/menu/clipboard/notifications, installed assets, popup/traffic-light geometry, terminal scope and ACP cleanup. This is the listed affected-surface target, not a claim that the complete test:desktop command ran. No timing or assertion changes; no physical AppKit drag requalification is claimed for this code-only move."
    },
    {
      "name": "final-governance",
      "command": "pnpm progress:generate; pnpm check:progress; MACOSX_DEPLOYMENT_TARGET=13.0 pnpm spec:check; pnpm format:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 26,
        "evidenceRecords": 66,
        "specCheckLanes": 4
      },
      "note": "Regenerated the tracker, retained every milestone status/gate, and passed source budgets, canonical/path ownership, mdBook, spec-first, all repository formatting and immutable evidence checks. The preserved parent chat evidence remains pending; this maintenance record does not qualify M10.2."
    }
  ],
  "contractReview": "Group runtime-independent library services by feature, Tauri adapters under host by feature, and debug-only helpers under acceptance. Only main.rs and lib.rs remain at the source root. All registered IPC names, permission grants, application state, teardown, acceptance feature gates and audited unsafe-code boundaries remain unchanged. Update canonical path mappings and direct callers; no compatibility re-exports, path attributes, dependency changes or historical evidence edits.",
  "milestoneReview": "Requested native source organization is separate from the preserved unfinished AI chat change. M10.2 remains In progress; no original milestone status, dependency, gate or next action changes. This record qualifies maintenance only, with no production AI mounting, signing, publication or service installation."
}
```
