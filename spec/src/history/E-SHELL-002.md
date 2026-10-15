# E-SHELL-002: native shell qualification

This completes M0.1. [E-SHELL-001](E-SHELL-001.md) preserves the earlier
implementation failures. Physical dragging was confirmed by the user; native
movement, resize, Close and relaunch also have actual WebView/process evidence.

For the full checks and bundle build, `.local/deno-free/env.sh` selected only
Node, pnpm, Rust, Jujutsu, mdBook and macOS system tools. Deno was absent.
Native lifecycle children and the ordinary app used only `/usr/bin:/bin`.

Signing/notarization remains M11 work. The configured workflow has not run
remotely; visual review remains `visual-pending` with no baseline changes. These
are not M0.1 gate substitutions.

```json
{
  "id": "E-SHELL-002",
  "tasks": ["M0.1"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-DESK-001",
    "LD-DESK-002",
    "LD-DESK-003",
    "LD-DESK-004",
    "LD-DESK-005",
    "LD-MIG-001",
    "LD-MIG-002"
  ],
  "revision": "enclosing-change",
  "versions": {
    "macOS": "27.0 (26A428)",
    "architecture": "arm64",
    "node": "26.9.0 in all recorded pnpm scripts",
    "declaredNode": "24.10.0; hosted CI has not executed",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "tauriBuild": "2.7.3",
    "tauriCLI": "2.12.3",
    "windowState": "2.5.0",
    "wdioTauri": "1.5.0",
    "webView": "WebKit 605.1.15",
    "mdbook": "0.5.4",
    "jj": "0.45.1"
  },
  "files": [
    ".github/workflows/ci.yml",
    ".gitignore",
    ".node-version",
    ".prettierignore",
    ".prettierrc.json",
    "AGENTS.md",
    "LICENSE.md",
    "MIGRATION.md",
    "PLAN.md",
    "README.md",
    "docs/provenance.json",
    "index.html",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "public/lapis-logo.svg",
    "rust-toolchain.toml",
    "rustfmt.toml",
    "scripts/check-bundle.mjs",
    "scripts/ci-revisions.mjs",
    "scripts/desktop-acceptance.mjs",
    "scripts/progress-model.mjs",
    "scripts/progress.mjs",
    "scripts/repository-files.mjs",
    "scripts/source-audit.mjs",
    "scripts/spec-plugin.mjs",
    "spec/book.toml",
    "spec/migration-inventory.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-PLAN-001.md",
    "spec/src/history/E-SHELL-001.md",
    "spec/src/history/E-SHELL-002.md",
    "spec/src/history/index.md",
    "spec-validator.config.mjs",
    "src/Shell.svelte",
    "src/main.ts",
    "src/shell-startup.ts",
    "src/shell.css",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/icons/icon.icns",
    "src-tauri/icons/icon.png",
    "src-tauri/src/app.rs",
    "src-tauri/src/commands.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/navigation.rs",
    "src-tauri/src/window.rs",
    "src-tauri/tauri.conf.json",
    "src-tauri/tauri.e2e.conf.json",
    "svelte.config.js",
    "tests/desktop/lifecycle.test.mjs",
    "tests/desktop/native-session.mjs",
    "tests/desktop/shell.spec.mjs",
    "tests/desktop/wdio.conf.mjs",
    "tests/governance/ci-revisions.test.mjs",
    "tests/governance/progress.test.mjs",
    "tests/governance/source-audit.test.mjs",
    "tests/renderer/shell-startup.test.mjs",
    "tsconfig.json",
    "vite.config.ts"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M0.1": "Cold launch, resize, drag, close, and relaunch work; a local `.app` launches without Deno; governance checks pass."
  },
  "runs": [
    {
      "name": "frozen-registry-install",
      "command": "pnpm install --frozen-lockfile",
      "result": "pass",
      "failures": 0,
      "note": "Lockfile current, no resolution changes. Registry dependencies only."
    },
    {
      "name": "repaired-native-acceptance",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "webViewPassed": 5,
        "lifecyclePassed": 2,
        "failed": 0,
        "accessibilityViolations": 0
      },
      "note": "Actual WebKit: branding/native readiness, denied set-title, 640x480 resize with header inset/no overflow, native movement and axe. Independent processes close normally then restore 900x640. Native children run with PATH=/usr/bin:/bin; no Node or Deno. Isolated state under .local/native-test/run-*."
    },
    {
      "name": "rust-navigation-regression",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked navigation::tests",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2,
        "failed": 0
      }
    },
    {
      "name": "complete-foundation-check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0,
        "specValidators": 6,
        "requirements": 14
      },
      "note": "Includes source/progress/App audits, Svelte, clippy --all-targets -D warnings, Prettier and Rust formatting. Ran with the Deno-free toolchain PATH described below."
    },
    {
      "name": "complete-foundation-tests",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodePassed": 12,
        "rustPassed": 2,
        "failed": 0
      },
      "note": "Full governance, renderer readiness and Rust navigation tests under the Deno-free toolchain PATH."
    },
    {
      "name": "complete-specification-check",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanesPassed": 4,
        "failed": 0
      },
      "note": "Published Node CLI: validate, rust-format, mdBook build and mapped spec-first."
    },
    {
      "name": "ordinary-app-build",
      "command": "pnpm desktop:bundle --debug",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary production renderer and debug ARM64 .app; approximately 27.22 MiB. Deno-free toolchain PATH. Final build removes explicit signing configuration at the user's request."
    },
    {
      "name": "ordinary-bundle-content",
      "command": "pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "normalAutomationMarkers": 0
      },
      "note": "Identifier and ARM64 confirmed; no bundled Node/Deno/WDIO files or automation markers in native/renderer output. Signing is deferred and is not a gate."
    },
    {
      "name": "native-input-tool-diagnostics",
      "command": "CUA preview.drag on the ordinary .app",
      "result": "fail",
      "failures": 2,
      "note": "Two final pointer calls returned noWindowsAvailable despite available AX state. Earlier automated probes did not qualify physical dragging. These automation limitations were resolved for acceptance by the user's actual native-input observation below, not by claiming synthetic dragging passed."
    },
    {
      "name": "ordinary-app-physical-drag-and-close",
      "command": "PATH=/usr/bin:/bin <ordinary .app>/Contents/MacOS/lapis-desktop; user physical drag; native Close",
      "result": "pass",
      "failures": 0,
      "note": "User explicitly confirmed “The window moves normally”. Native renderer-ready log and branded AX content observed. Persisted physical position changed from (628,184) to (618,196); normal native Close exited the owned child code 0 with no signal. No dev server, Node or Deno was available on the app PATH. Local report: .local/regular-app-manual.json."
    }
  ],
  "contractReview": "The original M0.1 gate is retained. Signing/notarization is explicitly deferred to M11 per the user's 2026-10-15 instruction. Shell capability and navigation boundaries remain narrow; automation is feature/configuration gated.",
  "milestoneReview": "M0.1 satisfies cold launch, resize, physical drag, normal Close, cold relaunch, ordinary .app launch without Deno and governance checks. M1 and later tasks remain unimplemented; this shell cannot open or edit a vault."
}
```
