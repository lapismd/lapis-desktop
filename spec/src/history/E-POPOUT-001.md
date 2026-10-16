# Related native window hosting

M7.1 records and qualifies the session-only popup workstream. The user added
explicit popup traffic-light clearance on 2026-10-16; LD-POP-006 and the M7.2
browser gate require it in top and stacked modes before ordinary admission.

```json
{
  "id": "E-POPOUT-001",
  "tasks": ["M7.1"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-MIG-002",
    "LD-POP-001"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "wry": "0.57.0",
    "embeddedWebDriver": "1.5.0",
    "platform": "macOS ARM64"
  },
  "files": [
    "MIGRATION.md",
    "PLAN.md",
    "POPOUT_PLAN.md",
    "scripts/check-bundle.mjs",
    "scripts/desktop-acceptance.mjs",
    "scripts/spec-contracts.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/integration.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/windows.md",
    "spec/src/history/E-POPOUT-001.md",
    "spec/src/history/index.md",
    "spec-validator.config.mjs",
    "src-tauri/src/app.rs",
    "src-tauri/src/commands.rs",
    "src-tauri/src/lifecycle.rs",
    "src-tauri/src/macos_chrome.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/popout_acceptance.rs",
    "src-tauri/src/window.rs",
    "src-tauri/tauri.e2e.conf.json",
    "tests/desktop/PopoutProof.svelte",
    "tests/desktop/entry.ts",
    "tests/desktop/popout-entry.ts",
    "tests/desktop/popout-host.test.mjs",
    "tests/desktop/popout-process.mjs",
    "tests/desktop/popout-runner.ts"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M7.1": "An isolated actual native WebView opens a related window with an accessible Window and Document, mounts an existing shared surface, and proves focus, resize, close and cleanup. Ordinary bundles retain denied popup creation and contain no proof instrumentation."
  },
  "runs": [
    {
      "name": "native-host-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/popout\" node --test tests/desktop/popout-host.test.mjs > .local/popout/native-before.log 2>&1",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "embedded-driver-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/popout\" node --test tests/desktop/popout-host.test.mjs > .local/popout/native-after.log 2>&1",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "embedded-driver-pointer",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/popout\" node --test tests/desktop/popout-host.test.mjs > .local/popout/native-gesture.log 2>&1",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "embedded-driver-diagnostic",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/popout\" node --test tests/desktop/popout-host.test.mjs > .local/popout/native-diagnostic.log 2>&1",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "standalone-window-focus",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/popout\" node --test tests/desktop/popout-host.test.mjs > .local/popout/native-standalone.log 2>&1",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "standalone-native-close",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/popout\" node --test tests/desktop/popout-host.test.mjs > .local/popout/native-focus.log 2>&1",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "focused-native-proof",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/popout\" node --test tests/desktop/popout-host.test.mjs > .local/popout/native-qualified.log 2>&1",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "initial-verification-table",
      "command": "pnpm spec:validate > .local/popout/spec-initial.log 2>&1",
      "result": "fail",
      "failures": 5
    },
    {
      "name": "mapped-governance-before",
      "command": "pnpm spec:first > .local/popout/spec-first.log 2>&1",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "format-before",
      "command": "pnpm format:check > .local/popout/format-final.log 2>&1",
      "result": "fail",
      "failures": 2
    },
    {
      "name": "source-check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "unit-and-integration",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "proof-rust-clippy",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e,custom-protocol --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "complete-native",
      "command": "pnpm test:desktop > .local/popout/native-complete.log 2>&1",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "ordinary-bundle",
      "command": "pnpm exec tauri build --debug --bundles app && pnpm check:bundle",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "final-governance-and-progress",
      "command": "pnpm check:progress && pnpm spec:check && pnpm format:check",
      "result": "pass",
      "failures": 0
    }
  ],
  "milestoneReview": "M7.1 meets its original native-hosting and ordinary-exclusion gate. M0\u2013M7 remain Done without gate changes. Pause before M7.2; M7.2 and M7.3 remain Planned, including the user-requested LD-POP-006 safe area. M8 remains paused.",
  "contractReview": "Only debug acceptance with explicit fixture opt-in creates popups. The shared surface uses related Window/Document references and public Tauri native focus, resize and close operations. No Notes tab transfer, save lifecycle or safe-area implementation is claimed by this proof.",
  "qualification": {
    "rendererGovernance": 71,
    "rust": 68,
    "native": {
      "startup": 2,
      "foundation": 27,
      "profile": 64,
      "resourceRepresentation": 2,
      "total": 95
    },
    "ordinaryBundle": {
      "architecture": "arm64",
      "automationMarkers": 0,
      "signing": "deferred"
    },
    "failuresAfter": 0
  }
}
```

## Results and repaired attempts

The initial platform call returned no Window. Pointer and native-function
capture checks reproduced it. The installed embedded driver's macOS executor
replaces WKUIDelegate (`tauri-plugin-wdio-webdriver` 1.5.0,
`platform/macos.rs`), removing Wry's popup callback. No dependency or
node_modules was modified. Dedicated cold proof processes keep Wry's delegate,
use the normal renderer, and emit passive receipts through the acceptance
console bridge. All other native cases retain the embedded driver.

The real related windows mounted the existing public Design Core surface.
Window.focus and Window.close did not provide native shell control; the proof
now resolves registered Tauri windows and uses their public native methods. It
proves two related documents, independent surfaces, actual focus and resize,
measured native controls centered at y=20, denied nested/file windows, and
observer counts returning from three to two to one after independent closes. A
separate cold process proves creation denial without the enabling opt-in. Actual
app processes have only `/usr/bin:/bin` on PATH and isolated native state.

The renderer proof composes public components; it creates no Notes App or vault
session and provides no replacement product screen. Shared layout projection,
file-backed editing, popup document command routing, full top/stacked safe-area
clearance and protected native close remain M7.2/M7.3 work. The existing shared
top-tab CSS currently applies native clearance beside a sidebar toggle; the
popup tree needs its own top-left clearance under LD-POP-006. No consumer CSS
workaround was introduced.

Temporary verification-row formatting and a missing governance mapping update
were repaired; canonical validation and spec-first then passed. Vite's existing
large-chunk advisory remains visible. Svelte fixture capture warnings were fixed
with an explicit untracked initial prop. The final source check has zero Svelte
errors or warnings; the complete test lane has 71 JS and 68 Rust passes.

## Final qualification and review stop

The canonical native command passes 95 cases: 2 startup, 27 foundation, 64
profile (including both popup proof cases) and 2 resource-representation cases.
The cold resource harness retains its build toolchain while its actual app
processes continue to have no Node/Deno on PATH. The ordinary macOS arm64 bundle
passes the audit with zero proof/automation markers. Source checks, 71 JS tests,
68 Rust tests and strict e2e/custom-protocol Clippy pass.

Only acceptance builds admit proof windows. M7.2 will implement live projection,
editor/command ownership and shared top/stacked safe-area support; M7.3 will
qualify protected native close and expose the ordinary tab action. The popup
button is not enabled in the ordinary app by M7.1. Pause here for review.
