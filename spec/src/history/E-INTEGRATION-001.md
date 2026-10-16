# Native desktop integration

M7 integration is qualified; E-QUALIFICATION-002 retains the final original
gates.

```json
{
  "id": "E-INTEGRATION-001",
  "tasks": ["M7"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-MIG-002",
    "LD-INT-001",
    "LD-INT-002",
    "LD-INT-003",
    "LD-INT-004",
    "LD-INT-005",
    "LD-INT-006",
    "LD-INT-007",
    "LD-INT-008",
    "LD-INT-009"
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
    "scripts/source-audit.mjs",
    "scripts/spec-contracts.mjs",
    "spec-validator.config.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/integration.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/writer-audit.md",
    "spec/src/history/E-INTEGRATION-001.md",
    "spec/src/history/index.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/app.rs",
    "src-tauri/src/application_menu.rs",
    "src-tauri/src/commands.rs",
    "src-tauri/src/desktop_services.rs",
    "src-tauri/src/integration.rs",
    "src-tauri/src/integration_acceptance.rs",
    "src-tauri/src/integration_policy.rs",
    "src-tauri/src/integration_urls.rs",
    "src-tauri/src/lib.rs",
    "src-tauri/src/lifecycle.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/window.rs",
    "src-tauri/tauri.conf.json",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/desktop/desktop-integration.ts",
    "src/lib/native/desktop-integration.ts",
    "src/lib/native/integration-urls.ts",
    "src/lib/native/native-bridge.ts",
    "src/lib/notes/notes-integration.ts",
    "src/main.ts",
    "tests/desktop/integration-ports.test.mjs",
    "tests/desktop/integration-urls.test.mjs",
    "tests/desktop/native-session.mjs",
    "tests/desktop/notes-conflicts.test.mjs",
    "tests/desktop/window-chrome.test.mjs",
    "tests/desktop/startup-recovery.test.mjs",
    "tests/governance/source-audit.test.mjs",
    "tests/renderer/integration-history.test.mjs",
    "tests/renderer/integration-ports.test.mjs",
    "tests/renderer/integration-urls.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "native-clipboard-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test tests/desktop/integration-ports.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Named native clipboard command is unavailable before M7 implementation."
    },
    {
      "name": "renderer-before",
      "command": "node --test tests/renderer/integration-ports.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Node strip-only mode rejects a constructor parameter property. Use a normal typed field and constructor assignment."
    },
    {
      "name": "renderer-after",
      "command": "node --test tests/renderer/integration-ports.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 4
      }
    },
    {
      "name": "renderer-url-lifetime",
      "command": "node --test tests/renderer/integration-urls.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 4
      }
    },
    {
      "name": "native-policy",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked integration_",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 4
      },
      "note": "URL ordering/acknowledgement, queue bounds, external authority and bounded clipboard/notification payloads."
    },
    {
      "name": "strict-renderer-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero Svelte errors/warnings. Final native/renderer acceptance and full lanes remain pending."
    },
    {
      "name": "native-clipboard-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-name-pattern='native text clipboard ports' tests/desktop/integration-ports.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Actual system clipboard, standard shared text API and native four-MiB bound."
    },
    {
      "name": "capability-policy-before",
      "command": "node --test --test-name-pattern='desktop integration retains exact' tests/governance/source-audit.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The exact capability guard has not yet admitted the seven new named ports; broad plugin permissions remain forbidden."
    },
    {
      "name": "capability-policy-after",
      "command": "node --test --test-name-pattern='desktop integration retains exact' tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      }
    },
    {
      "name": "specification-before-scope",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Exact capability audit requires the new explicitly bounded port grants."
    },
    {
      "name": "specification-before-final-file-map",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 3,
      "note": "Fresh evidence must include the native window fallback and capability-audit source/test files. No gate is waived."
    },
    {
      "name": "native-integration-builds",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json; pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json --config '{\"build\":{\"beforeBuildCommand\":\"\"}}'",
      "result": "pass",
      "failures": 0,
      "note": "Separate terminal-zero builds. The second changes only Rust navigation/new-window callbacks and reuses the just-built identical renderer assets. Subsequent renderer guard changes require the final fresh native qualification build."
    },
    {
      "name": "initial-native-profile",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/integration-ports.test.mjs tests/desktop/integration-urls.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 4
      },
      "note": "Actual clipboard, installed native menus, OS external open and notification payload bounds pass. Cold URL delivery is acknowledged before shell startup finishes, so startup layout replaces navigation. An isolated cold/warm probe confirms the identical URL works after startup. Await the public controller start before admitting URLs; no timeout or copied navigation code."
    },
    {
      "name": "absolute-url-policy-before-after",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked rejected_input_and_overflow_never_evict_accepted_requests",
      "result": "pass",
      "failures": 0,
      "note": "Exact new absolute-path URL assertion fails once before the policy repair and passes after it. The existing API/native admitted-vault resolver retains containment authority."
    },
    {
      "name": "focused-history-before-after",
      "command": "Native CUA Edit menu against disposable Menu.md; node --test tests/renderer/integration-history.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererCases": 2
      },
      "note": "Predefined native Undo did not change CodeMirror. Custom menu actions now dispatch to the focused control's existing keymap. Actual Edit > Undo removes NativeUndoSentinel; Edit > Redo restores it. No independent editor history is added."
    },
    {
      "name": "final-renderer-integration",
      "command": "node --test tests/renderer/integration-history.test.mjs tests/renderer/integration-ports.test.mjs tests/renderer/integration-urls.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 10
      }
    },
    {
      "name": "cold-url-notice-locator-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-name-pattern='cold and already-running application URLs' tests/desktop/integration-urls.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Cold/warm, OS and absolute-path requests pass; the wildcard text locator misses the existing rejection toast. Use its stable public notification host and retain the exact expected rejection text."
    },
    {
      "name": "cold-url-exact-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-name-pattern='cold and already-running application URLs' tests/desktop/integration-urls.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      }
    },
    {
      "name": "final-native-integration",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/integration-ports.test.mjs tests/desktop/integration-urls.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 6
      },
      "note": "Fresh full native build passes first. Actual clipboard, installed menus, safe OS opening, notification bounds, cold/second-instance/OS/absolute URLs, containment rejection, launcher retention, retirement, acknowledgements, note bytes and cold layout restoration pass."
    },
    {
      "name": "physical-native-services",
      "command": "Native CUA About, Edit Copy/Paste, File Open Vault, Return to previous vault, Edit Undo/Redo and Application Quit; .local/m7/native-ui-probe.mjs",
      "result": "pass",
      "failures": 0,
      "note": "About shows v0.1.0. Copy/Paste and the shared chooser return work. Final Undo/Redo and actual Quit pass in integration-ui-Ck8zbg: child exits code 0 with no signal, and Menu.md retains NativeUndoSentinelQuitSentinel. A valid notification request reports the existing OS permission denial; no delivered banner or changed OS permission is claimed."
    },
    {
      "name": "specification-sentence-budget-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Two invocations report the same LD-INT-001 five-sentence budget violation. Consolidate the menu identity clause without changing any requirement or validation limit."
    },
    {
      "name": "owned-external-link-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-name-pattern='component-owned external links' tests/desktop/integration-ports.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "One component-owned click produces two actual OS-open receipts because the global capture listener runs before the component claims the event."
    },
    {
      "name": "document-delegated-links-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-name-pattern='component-owned' tests/desktop/integration-ports.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Document-delegated component actions reproduce duplicate external opening and duplicate native application URL admission."
    },
    {
      "name": "document-delegated-links-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-name-pattern='component-owned' tests/desktop/integration-ports.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      },
      "note": "A fresh native bundle first. Window-level bubbling fallback respects default prevention after component/document delegation. Exactly one OS open and one accepted application URL remain; no new authority or assertion relaxation."
    }
  ],
  "contractReview": "Reuse native Tauri roles, existing host leave coordination, shared App commands and public AppUrlService. Bound native authority and keep ordinary bundles free of test drivers. Deno remains frozen. The standard text clipboard is a disposable host adapter for existing shared controls; binary clipboard methods retain their original receiver. The macOS notification port awaits UserNotifications authorization and request acceptance rather than discarding asynchronous delivery errors. App URLs are bounded to 32 accepted requests and 8192 bytes, remain queued until acknowledgement and join App-owned admitted operations. Only lapis/lapis-notes/web+lapis are registered as OS schemes; Obsidian-compatible requests remain accepted through existing API parsing without claiming its OS scheme. Passive native receipts and menu inspection are e2e-only.",
  "milestoneReview": "Component and aggregate qualification now pass. E-QUALIFICATION-002 records the final complete native/ordinary-bundle results and every original M4–M7 gate. The ordinary app is open for review; stop before M8."
}
```
