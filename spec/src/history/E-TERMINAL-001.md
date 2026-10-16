# Bundled Terminal qualification

```json
{
  "id": "E-TERMINAL-001",
  "tasks": ["M8", "M8.1"],
  "requirements": [
    "LD-MIG-002",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-008",
    "LD-PLUG-001",
    "LD-TERM-001",
    "LD-TERM-002",
    "LD-TERM-003",
    "LD-LIFE-001",
    "LD-VAULT-003",
    "LD-INT-001",
    "LD-DESK-003"
  ],
  "revision": "enclosing-change",
  "files": [
    "AGENTS.md",
    "MIGRATION.md",
    "README.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/terminal/Terminal.stories.ts",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/terminal/TerminalDemo.svelte",
    "catalog/support/terminal/color-checks.ts",
    "catalog/support/terminal/colored-frames.ts",
    "catalog/support/terminal/fixture.ts",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/desktop-acceptance.mjs",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/integration.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-TERMINAL-001.md",
    "spec/src/history/index.md",
    "src/components/terminal/TerminalPanel.svelte",
    "src/components/terminal/register-terminal-settings.ts",
    "src/components/terminal/terminal-plugin.ts",
    "src/components/terminal/terminal-view.ts",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/desktop/desktop-lifecycle.ts",
    "src/lib/native/native-terminal.ts",
    "src/lib/notes/notes-startup.ts",
    "src/lib/terminal/LICENSE.txt",
    "src/lib/terminal/NOTICE.md",
    "src/lib/terminal/terminal-binding.ts",
    "src/lib/terminal/terminal-preferences.ts",
    "src/lib/terminal/terminal-sessions.ts",
    "src/lib/terminal/terminal-settings.ts",
    "src/lib/terminal/terminal-tab.ts",
    "src/main.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/app.rs",
    "src-tauri/src/lib.rs",
    "src-tauri/src/main.rs",
    "src-tauri/src/terminal.rs",
    "src-tauri/src/terminal_policy.rs",
    "src-tauri/src/vault/files.rs",
    "src-tauri/src/vault_commands.rs",
    "src-tauri/tests/terminal_policy.rs",
    "tests/desktop/terminal-lifecycle.test.mjs",
    "tests/governance/source-audit.test.mjs",
    "tests/renderer/terminal-sessions.test.mjs",
    "vite.config.ts"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M8.1": "Bundled Terminal stories and cold native input, retention, reload, close, disable, vault isolation and restart-Start acceptance pass."
  },
  "runs": [
    {
      "name": "sessions-before",
      "command": "node --test tests/renderer/terminal-sessions.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Missing coordinator module."
    },
    {
      "name": "sessions-after",
      "command": "node --test tests/renderer/terminal-sessions.test.mjs",
      "result": "pass",
      "passed": 6,
      "failures": 0
    },
    {
      "name": "stories-first",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/terminal/Terminal.stories.ts",
      "result": "fail",
      "passed": 8,
      "failures": 2,
      "note": "Fixture echoed each key on a separate line; error text was correctly present in both the Empty component and notification. Fixed fixture accumulation and scoped the error assertion."
    },
    {
      "name": "stories-exact-retry",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/terminal/Terminal.stories.ts -t \"Input Resize And Scroll|Unavailable\"",
      "result": "pass",
      "passed": 2,
      "failures": 0
    },
    {
      "name": "catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "passed": 64,
      "failures": 0
    },
    {
      "name": "static-catalog",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "native-policy",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test terminal_policy",
      "result": "pass",
      "passed": 2,
      "failures": 0
    },
    {
      "name": "native-initial",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/m81/native\" node --test --test-concurrency=1 tests/desktop/terminal-lifecycle.test.mjs",
      "result": "fail",
      "passed": 1,
      "failures": 2,
      "note": "Tab Close lives in the existing context menu; disable-state presentation preceded asynchronous revocation. Cancelled-close case passed."
    },
    {
      "name": "native-retry1",
      "command": "Same native suite filtered to cold Terminal and explicit terminal disable",
      "result": "fail",
      "passed": 1,
      "failures": 1,
      "note": "Disable/re-enable and return passed. WebDriver right-click did not produce the established contextmenu event."
    },
    {
      "name": "native-retry2",
      "command": "Same native suite filtered to cold Terminal and switching vaults",
      "result": "fail",
      "passed": 0,
      "failures": 2,
      "note": "Shared PluginManager registration deletes legacy settings before loadData adoption. Fix in Notes API; do not conceal it in desktop."
    },
    {
      "name": "native-revocation-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/m81/native\" node --test --test-concurrency=1 --test-name-pattern=\"revoked physical vault\" tests/desktop/terminal-lifecycle.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "IPC denial alone left the shell alive. Desktop policy now retires the affected window runtime using the public native host; native rerun pending."
    },
    {
      "name": "release-retry-before",
      "command": "node --test --test-name-pattern=\"failed native release can be retried\" tests/renderer/terminal-sessions.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "release-retry-after",
      "command": "node --test --test-name-pattern=\"failed native release can be retried\" tests/renderer/terminal-sessions.test.mjs",
      "result": "pass",
      "passed": 1,
      "failures": 0
    },
    {
      "name": "owned-session-tests",
      "command": "node --test tests/renderer/terminal-sessions.test.mjs",
      "result": "pass",
      "passed": 7,
      "failures": 0
    },
    {
      "name": "source-boundaries-and-js",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "passed": 81,
      "failures": 0
    },
    {
      "name": "controlled-settings",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/terminal/Terminal.stories.ts -t \"Settings Source\"",
      "result": "pass",
      "passed": 1,
      "failures": 0
    },
    {
      "name": "additional-migrated-stories",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/terminal/Terminal.stories.ts -t \"Installed|Colored Output\"",
      "result": "pass",
      "passed": 3,
      "failures": 0
    },
    {
      "name": "multiple-terminals",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/terminal/Terminal.stories.ts -t \"Multiple Terminals\"",
      "result": "pass",
      "passed": 1,
      "failures": 0
    },
    {
      "name": "sessions-final",
      "command": "node --test tests/renderer/terminal-sessions.test.mjs",
      "result": "pass",
      "passed": 7,
      "failures": 0
    },
    {
      "name": "js-final",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "passed": 81,
      "failures": 0
    },
    {
      "name": "check-final",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Canonical checks, zero Svelte errors/warnings, all-target Clippy and complete formatting."
    },
    {
      "name": "catalog-final",
      "command": "pnpm test:storybook",
      "result": "pass",
      "passed": 84,
      "failures": 0,
      "note": "21 production stories across four fresh theme/viewport runs, including interaction and axe."
    },
    {
      "name": "rust-final",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "passed": 70,
      "failures": 0,
      "note": "Two existing ignored provider helpers."
    },
    {
      "name": "static-catalog-final",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "native-fresh-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/m81/native\" node --test --test-concurrency=1 tests/desktop/terminal-lifecycle.test.mjs",
      "result": "fail",
      "passed": 4,
      "failures": 1,
      "note": "Reload retained the shell; test incorrectly required a marker scrolled out by resize commands. A fresh pre-reload marker retains the same snapshot assertion."
    },
    {
      "name": "native-reload-termination-before",
      "command": "Same native suite --test-name-pattern=\"cold Terminal\"",
      "result": "fail",
      "failures": 1,
      "note": "Reload snapshot and PID passed. Native list removal precedes asynchronous PTY shutdown; require bounded actual process termination, matching runtime lifecycle tests."
    },
    {
      "name": "native-reload-exact",
      "command": "Same native suite --test-name-pattern=\"cold Terminal\"",
      "result": "pass",
      "passed": 1,
      "failures": 0,
      "note": "Real input/resize, visible snapshot, same PID after reload, actual-exit termination, cold Start and tab-close PID termination."
    },
    {
      "name": "terminal-native-final",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$PWD/.local/m81/native\" node --test --test-concurrency=1 tests/desktop/terminal-lifecycle.test.mjs",
      "result": "pass",
      "passed": 5,
      "failures": 0,
      "note": "Real isolated WebView and PTYs, /usr/bin:/bin PATH, scoped cleanup, guarded close and physical-root revocation."
    },
    {
      "name": "native-complete",
      "command": "pnpm test:desktop",
      "result": "pass",
      "passed": 100,
      "failures": 0,
      "note": "2 startup, 27 WebdriverIO, 69 lifecycle/file/integration and 2 HTTP-representation cases. Fresh packaged native processes, isolated state and no Node/Deno application PATH."
    },
    {
      "name": "ordinary-bundle",
      "command": "pnpm exec tauri build --debug --bundles app && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "macOS arm64 bundle, 216 renderer JS files, no acceptance instrumentation or Node/Deno/WDIO runtime. Signing remains deferred."
    },
    {
      "name": "final-governance",
      "command": "pnpm progress:generate && pnpm check:progress && pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Original M8.1 gate retained verbatim; canonical validation, native formatting, mdBook and spec-first pass."
    }
  ],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "platform": "macOS ARM64",
    "terminal": "0.1.1"
  },
  "contractReview": "Desktop owns plugin policy, native target admission and App session lifetime; public lapis-terminal owns PTYs, rendered frames and viewport. Existing components and notification service remain the UI.",
  "milestoneReview": "M8.1 meets its unchanged native/catalog gate. M8 remains In progress for M8.2\u2013M8.3; LD-PLUG-001 retains its AI handover gate. Continue with Web service retirement.",
  "sourceRepair": {
    "revision": "d06be79d0bb3fc4cb6db120473b69bc0cbe7b2f4",
    "requirement": "LN-PLUG-112",
    "before": "1 legacy-adoption failure / 1 pass",
    "after": "4 targeted passes; 1716 unique unit tests; 18 check tasks; 10 build tasks; 258 cold catalog cases; spec check and 38 validator tests",
    "archive": "@lapis-notes/api 0.1.4",
    "sha256": "563c6303c8afe543dcfdeb58b3409075bd26a68df2365e8ce269f3e9c7e6e97e",
    "refresh": "14 verified local public archives installed without changing tracked dependency routes."
  }
}
```

Terminal source reference: `lapis-plugin-terminal` revision
`61f4ef24a6f27ab4538fe76519f67f71e51143c3`. Adapted command/settings
presentation retains AGPL-3.0-or-later attribution and licence. The new public
engine is `lapis-terminal` revision `d7e0a7cd`, Apache-2.0. Its unpublished JS
build is an explicit private-app link; Rust uses a sibling path. No release was
created.

Initial strict typing attempts exposed 6 errors/2 warnings, followed by 3, 2, 14
and 2 errors in fixture/story typings. Final strict typing has zero findings.
The uncertain-open Node regression initially found unsupported
parameter-property syntax; its source now uses strip-compatible fields and all
seven tests pass.

An initial second bundle build was stopped before packaging to avoid replacing a
running acceptance artifact. Builds and native runs are kept sequential. Default
user profiles and vaults are untouched; native evidence uses isolated
`.local/m81/native` profiles and a Node/Deno-free application PATH.

Shared source broad qualification initially observed three five-second timeouts;
the unchanged affected files then passed 14/14 and the final bounded-concurrency
full lane passed. Non-failing AI catalog RangeError diagnostics remain distinct
from Terminal assertions and axe results. No visual baseline was changed.
