# Quiet desktop test entrypoints

```json
{
  "id": "E-TEST-001",
  "tasks": ["M0.2"],
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-009"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4"
  },
  "files": [
    "scripts/desktop-tests.mjs",
    "tests/governance/desktop-test-mode.test.mjs",
    "package.json",
    "README.md",
    "AGENTS.md",
    "spec/src/current/governance.md",
    "spec/src/current/verification.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/migration.md",
    "spec/src/history/E-TEST-001.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md",
    ".github/workflows/ci.yml"
  ],
  "result": "pass",
  "completedGates": {
    "M0.2": "Default and explicit headless runs execute renderer/catalog and native-service checks without native UI or session clipboard changes; explicit headed mode retains the complete native suite, with clear separate qualification."
  },
  "remaining": [],
  "runs": [
    {
      "name": "mode-before",
      "command": "node --test tests/governance/desktop-test-mode.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The exact new suite cannot import the absent runner; no test cases run."
    },
    {
      "name": "mode-after",
      "command": "node --test tests/governance/desktop-test-mode.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Four cases pass: default/explicit quiet execution, retained headed runner, fail-closed flags before any child, and failure propagation."
    },
    {
      "name": "hidden-webkit-probe",
      "command": "node .local/probe-headless.mjs in the diagnostic parent workspace",
      "result": "pass",
      "failures": 0,
      "note": "Actual hidden native app opens a vault, saves an edit and opens its menu with no window visibility or key focus. A 1500 ms native-frame probe returns no-frame even with public disabled background throttling and prohibited activation. This establishes the unsupported full-hidden-UI boundary; it is not native lifecycle qualification. Isolated root ../lapis-desktop-e20-parent/.local/native-test/headless-probe-3RAfrR. Diagnostic source changes are not adopted."
    },
    {
      "name": "spec-first",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "New verification rows were separated from the table header, so Markdown formatting treated them as prose. Put both rows in the existing table; retain the one-to-one verification rule."
    },
    {
      "name": "ci-mode-before",
      "command": "node --test tests/governance/desktop-test-mode.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Four cases pass; the added CI guard fails because the workflow still selects the local default. Update the existing native step to explicit headed acceptance."
    },
    {
      "name": "mode-final",
      "command": "node --test tests/governance/desktop-test-mode.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All five mode regressions pass, including explicit headed CI selection, resource environment, rejected conflicting flags and failure propagation."
    },
    {
      "name": "quiet-cohort-refresh",
      "command": "pnpm test:desktop",
      "result": "pending",
      "failures": 0,
      "note": "The first quiet run passes 164 Node, 360 AI and 83 Rust cases (two inherited helpers ignored). The catalog starts; stop and drain this run to install the qualified Search cohort. No catalog result is claimed."
    },
    {
      "name": "spec-after-table-repair",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Validation, mdBook, specification-first and ownership checks pass after putting verification rows inside the existing table."
    },
    {
      "name": "evidence-result-enum",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The interrupted-run record used an unsupported result enum. Record it as pending with its completed sub-lanes; the schema and product gates remain unchanged."
    },
    {
      "name": "ordinary-bundle-final",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Fresh ordinary ARM64 application and renderer build pass. Audit finds no native/renderer acceptance markers, fixture provider or bundled Node/Deno. Signing remains deferred; the application is not launched."
    },
    {
      "name": "repository-check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Canonical validation, strict types (zero errors/warnings), normal all-target strict Clippy, Prettier and Rust formatting pass."
    },
    {
      "name": "generated-summary-format",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 1,
      "note": "The generated MIGRATION.md table requires normal Prettier formatting. Format that file; the subsequent full check passes without changing progress comparisons or formatting rules."
    },
    {
      "name": "quiet-full-final",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "note": "The actual default command passes 165 Node, 360 AI and 83 Rust cases (two inherited subprocess helpers ignored), followed by all 564 catalog interaction/accessibility cases: 141 each in desktop/light, narrow/light, desktop/dark and narrow/dark. Cold processes consume corrected verified public Search exports. No native UI is launched; clipboard stories use injected/stubbed ports. Persistent log .local/qualification/commands-review/quiet-full.log."
    }
  ],
  "milestoneReview": "M0.2 meets its original requested workflow/review gate. Native product gates remain separate, M10.2 stays in progress and no visual baseline is approved.",
  "contractReview": "The user explicitly accepted the quiet browser/service default and separate headed native gate. No actual UI assertion is removed, native gate replaced, or browser frame function emulated. Ordinary native builds and permissions are unchanged."
}
```
