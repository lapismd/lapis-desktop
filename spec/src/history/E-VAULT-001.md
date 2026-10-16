# E-VAULT-001: admitted native vault access

M2 qualification uses real temporary folders and isolated native profiles.
App/database startup and note editing remain M3.

```json
{
  "id": "E-VAULT-001",
  "tasks": ["M2"],
  "requirements": [
    "LD-MIG-002",
    "LD-VAULT-001",
    "LD-VAULT-002",
    "LD-VAULT-003",
    "LD-VAULT-004",
    "LD-VAULT-005",
    "LD-VAULT-006",
    "LD-DESK-005",
    "LD-GOV-007"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "capStd": "4.0.3",
    "target": "aarch64-apple-darwin"
  },
  "files": [
    "MIGRATION.md",
    "README.md",
    "scripts/check-bundle.mjs",
    "scripts/desktop-acceptance.mjs",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-VAULT-001.md",
    "spec/src/history/index.md",
    "src/Shell.svelte",
    "src/VaultLauncher.svelte",
    "src/main.ts",
    "src/native-bridge.ts",
    "src/shell.css",
    "src/vault-client.ts",
    "src/vault-launcher.css",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/app.rs",
    "src-tauri/src/lib.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/resources.rs",
    "src-tauri/src/vault/files.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/profiles.rs",
    "src-tauri/src/vault/writes.rs",
    "src-tauri/src/vault_commands.rs",
    "src-tauri/tauri.conf.json",
    "src-tauri/tests/vault_access.rs",
    "src-tauri/tests/vault_interruptions.rs",
    "src-tauri/tests/vault_resources.rs",
    "tests/desktop/native-session.mjs",
    "tests/desktop/vault.spec.mjs",
    "tests/desktop/wdio.conf.mjs",
    "tests/renderer/vault-client.test.mjs",
    "tsconfig.json"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M2": "Real temporary-folder tests cover cancellation, Unicode paths, binary data, permission failures, traversal/symlink escape, and interrupted writes."
  },
  "runs": [
    {
      "name": "before-native-vault-service",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test vault_access",
      "result": "fail",
      "failures": 1,
      "note": "The new regression target could not compile: no desktop-owned vault service/library existed (E0433)."
    },
    {
      "name": "initial-real-folder-tests",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test vault_access",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 6,
        "failed": 2
      },
      "note": "Root-level writes passed an empty parent path to open_dir; Unicode root-level binary writing and permission preservation exposed the same defect. Resolve an empty parent to the admitted root handle."
    },
    {
      "name": "initial-renderer-adapter-loader",
      "command": "node --test tests/renderer/vault-client.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Native Node TypeScript loading requires an explicit .ts extension for the owned relative import. Enabled the matching noEmit TypeScript option and corrected the import."
    },
    {
      "name": "repaired-renderer-adapter",
      "command": "node --test tests/renderer/vault-client.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 4,
        "failed": 0
      }
    },
    {
      "name": "repaired-original-real-folder-target",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test vault_access",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 8,
        "failed": 0
      }
    },
    {
      "name": "native-service-failure-and-resource-surface",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test vault_access --test vault_resources --test vault_interruptions --locked",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 12,
        "helperIgnored": 1,
        "failed": 0
      },
      "note": "The ignored subprocess helper is actually invoked by the parent test. Real process termination during staging preserves the old note. Concurrent directory/symlink substitution never reads or writes outside the admitted root."
    },
    {
      "name": "launcher-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "counts": {
        "errors": 0,
        "warnings": 0
      }
    },
    {
      "name": "initial-vault-canonical-table",
      "command": "pnpm check",
      "result": "fail",
      "failures": 24,
      "note": "Specification validation stopped the lane: a second requirements table outside the named Requirements section was treated as references, yielding 24 unknown/orphan findings. Moved the six definitions into the canonical Requirements table; no requirement or validator was weakened."
    },
    {
      "name": "desktop-full-check-and-tests",
      "command": "pnpm check; pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodePassed": 19,
        "rustPassed": 14,
        "subprocessHelperIgnored": 1,
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Complete check/test lanes passed before native acceptance; the ignored helper runs in a real child process under its parent interruption test."
    },
    {
      "name": "initial-actual-native-launcher",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 5,
      "counts": {
        "nativePassed": 9,
        "nativeFailed": 5
      },
      "note": "Shell 5/5; vault 4/9. Failures: hidden boot status selected; automation execute core omits convertFileSrc; its missing URL cascaded into revocation; invalid CSS/text compound selector; synthetic Tab did not provide native focus traversal. Product folder read/write and access denials passed. Correct the first four harness boundaries; retain native keyboard traversal as a separate real-input gate."
    },
    {
      "name": "repaired-actual-native-vault-surface",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nativePassed": 14,
        "nativeFailed": 0,
        "coldLifecyclePassed": 2,
        "axeViolations": 0
      },
      "note": "Shell 5/5 and vault 9/9 in real macOS WebViews, including actual binary image display/fetch, revoked-URL 404, disk byte comparisons, creation collisions, cancellation and missing recents. Two isolated cold processes close normally with no Node/Deno on the native process PATH."
    },
    {
      "name": "native-keyboard-and-system-picker-input",
      "command": "cua_repl on isolated Lapis Notes Acceptance.app, with LAPIS_DESKTOP_ACCEPTANCE_REAL_PICKER=1",
      "result": "pass",
      "failures": 0,
      "counts": {
        "verifiedNativeAssertions": 3
      },
      "note": "Native Tab focused Open vault; Return opened the real macOS Open panel; Escape cancelled it and the launcher displayed Selection cancelled. The embedded driver source (executor.rs 1354-1490) confirms synthetic KeyboardEvents do not perform Tab traversal. This independent native input covers the functional keyboard boundary."
    },
    {
      "name": "ordinary-m2-arm64-bundle",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "bundles": 1,
        "automationMarkers": 0,
        "rendererJavaScriptFiles": 1
      },
      "note": "30.69 MiB ARM64 ordinary app; no bundled Node/Deno and no acceptance-environment markers. Application signing/notarization stays deferred."
    },
    {
      "name": "initial-create-parent-race-probe",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test vault_interruptions create_cannot_admit --locked",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Initial no-delay interleaving did not expose the review concern; it does not disprove the ambient reopen race."
    },
    {
      "name": "create-parent-race-reproduced",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test vault_interruptions create_cannot_admit --locked",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0,
        "failed": 1
      },
      "note": "Bounded 50-microsecond symlink windows reproduced admission of an outside directory after mkdir. The native owner must open the new child through the already-selected parent capability, not canonicalize and ambient-open its pathname."
    },
    {
      "name": "repaired-create-parent-race",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test vault_interruptions create_cannot_admit --locked",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1,
        "failed": 0
      }
    },
    {
      "name": "complete-create-repair-check-and-tests",
      "command": "pnpm test; pnpm check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodePassed": 19,
        "rustPassed": 15,
        "subprocessHelperIgnored": 1,
        "svelteErrors": 0,
        "svelteWarnings": 0
      }
    },
    {
      "name": "create-repair-cold-launch-driver-race",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 1,
      "counts": {
        "nativePassed": 14,
        "coldLifecyclePassed": 1,
        "coldLifecycleFailed": 1
      },
      "note": "All WebView tests passed; second cold process driver execute timed out at its unchanged 10s request limit. Its native log contains renderer ready. The helper previously evaluated as soon as the driver socket listened, before initial WebView navigation/IPC readiness was established. Gate the first evaluation on the existing Rust acknowledgement under the same 15s startup deadline."
    },
    {
      "name": "exact-cold-relaunch-after-native-readiness-gate",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated-run-1FfgAH> LAPIS_DESKTOP_ACCEPTANCE_STATE=<isolated-run-1FfgAH>/window-state.json node --test --test-name-pattern=\"a second cold process\" tests/desktop/lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1,
        "failed": 0
      },
      "note": "The exact failing cold target passes with the same request/startup deadlines and assertions. Native acknowledgement now precedes script evaluation."
    },
    {
      "name": "final-native-surface-after-all-repairs",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nativePassed": 14,
        "nativeFailed": 0,
        "coldLifecyclePassed": 2,
        "coldLifecycleFailed": 0,
        "axeViolations": 0
      },
      "note": "Fresh actual WebViews and the complete shared cold lifecycle lane passed after both Create containment and test-driver readiness repairs."
    },
    {
      "name": "final-ordinary-bundle-after-create-repair",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "bundles": 1,
        "automationMarkers": 0
      },
      "note": "Final 30.69 MiB ARM64 ordinary application includes the capability-based Create repair. No Node/Deno or native acceptance hooks are bundled; signing remains deferred."
    }
  ],
  "contractReview": "M2 admits roots only through native selection or saved host profiles. Directory capabilities, opaque sessions and resource tokens enforce containment and revocation. Generic FS/plugin/process permissions remain denied; App and database startup are M3.",
  "milestoneReview": "M2 Done: the original temporary-folder gate is met, including the reproduced-and-repaired Create escape race, concurrent symlink substitution and actual process interruption. Full local tests/checks, actual native UI/resources, cold lifecycle and ordinary bundle passed. M3 database conformance is next; App editing and M4 safety are not claimed.",
  "qualificationLimits": [
    "Repeatable WebView tests replace only OS picker selection with a debug-only queued native path; filesystem operations and all resulting UI are real.",
    "Successful full Go-to-Folder confirmation was not established by the separate Cua exploration: the remote native sheet reset on automated confirmation. No successful physical folder confirmation is claimed; native picker activation/cancellation, typed selection callbacks, real-folder admission and the original M2 gate are independently qualified.",
    "App/database startup, streamed writes, file management, watching and note editing remain later slices."
  ]
}
```
