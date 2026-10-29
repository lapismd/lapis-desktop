# Parallel hosted CI

```json
{
  "id": "E-VALIDATION-007",
  "date": "2026-10-29",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8"],
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-005", "LD-GOV-010"],
  "contractReview": "Hosted CI keeps the portable lanes, spec:first over the pull-request range, the debug bundle gate and explicit headed acceptance. Those commands move onto a Turbo task graph and run as separate jobs when they do not share Cargo output or a dev-server port. Governance, quality, unit tests, Storybook, the native bundle and headed acceptance stay required. Docker remains the code-level default. The headed script is still the only manifest task allowed to chain on-demand native acceptance. Published pins stay @lapismd/mira ~0.1.2, @lapismd/jj-history ~0.1.0, and lapis-ai git tag v0.2.0.",
  "milestoneReview": "M8 keeps its original Done gate. This record qualifies the hosted workflow and Turbo task graph only. It does not promote a product, native, provider, catalog, distribution or visual gate.",
  "versions": {
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "governanceTests": "16/16"
  },
  "files": [
    ".github/workflows/ci.yml",
    ".gitignore",
    "MIGRATION.md",
    "docs/validation.md",
    "package.json",
    "scripts/ci-siblings.mjs",
    "scripts/lib/concurrency.mjs",
    "scripts/report-turbo-cache.mjs",
    "scripts/run-turbo.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/index.md",
    "tests/governance/desktop-test-mode.test.mjs",
    "tests/governance/native-lane-defaults.test.mjs",
    "tests/governance/turbo-task-graph.test.mjs",
    "turbo.json"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Governance and Turbo task tests",
      "command": "node --test tests/governance/turbo-task-graph.test.mjs tests/governance/native-lane-defaults.test.mjs tests/governance/desktop-test-mode.test.mjs tests/governance/local-macos-build-exclusion.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "16/16. Portable lanes stay on ci:quality, ci:unit and ci:governance. Cargo tasks and the catalog browser stay in separate Turbo invocations. Hosted CI still selects the native runtime on macos-15. Headed acceptance remains ci:headed."
    },
    {
      "name": "Source audit",
      "command": "node scripts/source-audit.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Source boundaries pass."
    },
    {
      "name": "Spec-first mapping",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "detail": "14 protected files, 2 canonical chapters (governance.md and migration.md)."
    },
    {
      "name": "Specification check",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Validate passed, including progress coverage and chapter limits. rust-format then failed on the untouched canary fixture. This slice does not edit that file."
    }
  ]
}
```

The hosted workflow is the design-core job shape for the lanes this
repository actually has. Pointer-browser suites that do not exist here are not
added. Dependency installation on a clean runner still needs the unpublished
path checkouts beside the workspace.
