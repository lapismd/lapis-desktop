# E-SHELL-001: governed native shell

This record captures implementation attempts before qualification. Results below
preserve actual failures and repaired regressions. [E-SHELL-002](E-SHELL-002.md)
records completed native and governance gates.

```json
{
  "id": "E-SHELL-001",
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
    "node": "24.10.0 initially; 26.9.0 in pnpm scripts",
    "pnpm": "10.34.5",
    "rust": "1.99.0"
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
  "result": "pending",
  "remaining": [
    "Physical header dragging requires native-input qualification. Complete foundation qualification is recorded in E-SHELL-002."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "before-native-shell",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 1,
      "counts": {
        "tests": 0
      },
      "note": "Before implementation the command did not exist."
    },
    {
      "name": "initial-rust-compatibility",
      "command": "cargo check --manifest-path src-tauri/Cargo.toml --locked",
      "result": "fail",
      "failures": 19,
      "note": "Tauri 2.11.5 with newer transitive runtime crates failed to compile; upgrading the released Tauri family."
    },
    {
      "name": "ambient-app-before",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 9,
        "failed": 1
      },
      "note": "Optional chaining was not detected by the new ownership audit."
    },
    {
      "name": "ambient-app-after",
      "command": "node --test --test-name-pattern='ambient App audit' tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1,
        "failed": 0
      }
    },
    {
      "name": "first-native-webview",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 3,
        "failed": 2
      },
      "note": "The native app booted and axe passed; two tests used a window API absent from the WDIO execute context. Use the actual test-only global Tauri window module."
    },
    {
      "name": "relaunch-after-forced-harness-teardown",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 1,
      "note": "The second launch did not restore geometry after the runner forcibly terminated its app. The lifecycle harness now owns each child and verifies normal Close before relaunch."
    },
    {
      "name": "embedded-session-close-cleanup",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 1,
      "note": "The runner attempted DELETE after native Close had correctly stopped the embedded server; ECONNREFUSED was a harness failure. Per-test totals were unavailable. UI assertions and independently owned close/relaunch processes now have separate owners."
    },
    {
      "name": "initial-spec-first-map",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 3,
      "note": "Mapped chapters used book-relative paths instead of repository paths; corrected to spec/src/current paths."
    },
    {
      "name": "initial-summary-formatting",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Prettier table separator padding was incorrectly treated as generated-summary drift; the projection now ignores formatting and has regression coverage."
    },
    {
      "name": "invalid-debug-bundle-invocation",
      "command": "pnpm desktop:bundle -- --debug",
      "result": "fail",
      "failures": 1,
      "note": "The literal separator reached Cargo. README and CI now use pnpm desktop:bundle --debug."
    },
    {
      "name": "synthetic-pointer-diagnostic",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 2,
      "counts": {
        "uiPassed": 5,
        "lifecyclePassed": 0,
        "lifecycleFailed": 2
      },
      "note": "The diagnostic DOM pointer drag did not move the AppKit window; its early abort also prevented geometry persistence for relaunch. Upstream driver dispatches DOM MouseEvents. Removed that incapable probe, retained real close/relaunch assertions and a separate physical-drag gate."
    },
    {
      "name": "initial-strict-bundle-signature",
      "command": "pnpm check:bundle",
      "result": "fail",
      "failures": 1,
      "note": "Strict codesign verification found an executable signature requiring absent resources. On 2026-10-15 the user explicitly deferred application signing. The explicit signing configuration and signature gate were removed; this historic failed attempt is retained."
    }
  ],
  "contractReview": "Introduces the canonical native shell and governance contracts before implementation.",
  "milestoneReview": "M0.1 remains In progress until its original native and governance gates pass."
}
```
