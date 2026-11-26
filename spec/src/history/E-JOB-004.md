# Isolated macOS notification acceptance preparation

```json
{
  "id": "E-JOB-004",
  "date": "2026-11-26",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-JOB-004", "LD-CI-001", "LD-GOV-004"],
  "files": [
    ".github/dependency-automation/artifact-projection.json",
    ".github/workflows/ci.yml",
    "package.json",
    "scripts/build-notification-acceptance.mjs",
    "scripts/ci/plan.mjs",
    "scripts/macos-native-lanes.mjs",
    "scripts/notification-acceptance.mjs",
    "spec/src/current/background.md",
    "spec/src/current/ci.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/navigation/history-01.md",
    "src-tauri/build.rs",
    "src-tauri/src/acceptance/mod.rs",
    "src-tauri/src/acceptance/notifications.rs",
    "src-tauri/src/host/mod.rs",
    "tests/desktop/notification-session.mjs",
    "tests/governance/notification-acceptance.test.mjs",
    "tests/governance/validation.test.mjs",
    "spec/src/current/desktop.md"
  ],
  "contractReview": "Adds an explicit build-only artifact request and a separately inventoried local macOS lane. Ordinary bundles have no inspection command. The dedicated generated bundle identity and isolated profile keep OS state separate from installed applications.",
  "acceptanceReview": "The driver requires native Notification Center delivery, not send completion. It preserves undetermined permission during unattended refusal, requests foreground permission explicitly, exercises the production job sink and repeats authorized delivery after a cold process. Portable source checks and actual macOS acceptance remain separate.",
  "versions": {
    "base": "1235dbf8feee5aaecc891e2c04d8e031bf543c60",
    "portableSource": "2d0c07701b11eb4824e5e5cf95baea515088a105"
  },
  "runs": [
    {
      "name": "Focused notification and governance source suite after alias inventory correction",
      "command": "pnpm validation:check -- tests/governance/notification-acceptance.test.mjs tests/governance/native-lane-defaults.test.mjs tests/governance/ci-selection.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Initial focused governance suite: new notification alias missing from inventory",
      "command": "Focused governance suite before inventory correction (115 of 116 passed)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Full portable qualification stopped at evidence coverage",
      "command": "pnpm check (Omarchy lapis-desktop-validation-340d86de-50bc-489b-ad22-6a1a4bb957d7)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Full portable check and tests, followed by missing Desktop chapter mapping",
      "command": "node .local/remote-thin-validation.mjs desktop check test spec:check (source 2d0c0770, retained notification-acceptance-portable-final.log)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Full portable check",
      "command": "pnpm check (Omarchy source 2d0c0770)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Full portable tests: 978 governance, 749 TypeScript/policy, 295 Rust; two existing native-only ignored",
      "command": "pnpm test (Omarchy source 2d0c0770)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Mapped specification and formatting after chapter correction",
      "command": "node .local/remote-thin-validation.mjs desktop spec:check format:check (lapis-desktop-validation-9eb5ecf9-5550-4b9a-b9fd-a50122005668)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Prior full qualification formatting findings in two Markdown files",
      "command": "node .local/remote-thin-validation.mjs desktop check test spec:check (notification-acceptance-evidence-retry.log)",
      "result": "fail",
      "failures": 2
    }
  ],
  "remaining": [
    "Build-only macOS artifact",
    "Actual permission and Notification Center delivery",
    "Authorized cold-process delivery"
  ]
}
```

This prepared harness does not close LD-JOB-004 or qualify ordinary release
bytes.

Earlier full attempts also retained the SDK artifact projection mismatch and the
governance chapter's thirteen-byte size excess in their original local logs. The
projection was regenerated from source and the chapter shortened before the
passing complete check. Failed transfer attempts ran no product tests.
