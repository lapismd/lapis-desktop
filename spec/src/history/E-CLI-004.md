# Align the Notes cohort governance regression

```json
{
  "id": "E-CLI-004",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CLI-001", "LD-GOV-004"],
  "versions": {
    "api": "0.6.1",
    "fileExplorer": "0.2.8",
    "languageService": "0.1.6",
    "ui": "0.2.0",
    "workspace": "0.4.4"
  },
  "files": [
    "spec/src/current/governance.md",
    "spec/src/history/E-CLI-004.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/governance/ci-prerequisites.test.mjs"
  ],
  "contractReview": "The dependency-cohort governance regression must track the registry ranges adopted by the application and continue proving exactly one resolved API peer context. It does not expand native CLI authority or qualify remaining platform acceptance.",
  "acceptanceReview": "The stale API 0.3.1, File Explorer 0.2.5, UI 0.1.10 and Workspace 0.4.0 assertions now require the coherent released API 0.6.1, File Explorer 0.2.8, Language Service 0.1.6, UI 0.2.0 and Workspace 0.4.4 cohort. The exact regression and all 376 governance tests pass with one API 0.6.1 peer context.",
  "remaining": [
    "Supported-platform installed-bundle and native credential-dialog qualification remains pending.",
    "Visual review remains pending; no baseline changed."
  ],
  "runs": [
    {
      "name": "hosted-unit-before-repair",
      "command": "GitHub Actions CI run 43661677951, Unit tests",
      "result": "fail",
      "failures": 1,
      "detail": "762 of 763 tests passed; the cohort regression still expected API 0.3.1 and rejected the intentional API 0.6.1 range."
    },
    {
      "name": "exact-regression-before-repair",
      "command": "node --test tests/governance/ci-prerequisites.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "The seven-test file reproduced the stale API 0.3.1 assertion locally."
    },
    {
      "name": "exact-regression-after-repair",
      "command": "node --test tests/governance/ci-prerequisites.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "All seven cases pass while asserting the coherent cohort and one API 0.6.1 peer context."
    },
    {
      "name": "governance-group-before-host-context",
      "command": "GITHUB_ACTIONS=true LAPIS_DESKTOP_VALIDATION_RUNTIME=native LAPIS_CI_UNIT_GROUPS='[\"governance\"]' pnpm ci:unit",
      "result": "fail",
      "failures": 1,
      "detail": "375 of 376 tests passed; the local hosted simulation omitted GitHub artifact-producer context and failed closed before provenance export."
    },
    {
      "name": "governance-group-with-host-context",
      "command": "GITHUB_ACTIONS=true with complete GitHub producer context, LAPIS_DESKTOP_VALIDATION_RUNTIME=native LAPIS_CI_UNIT_GROUPS='[\"governance\"]' pnpm ci:unit",
      "result": "pass",
      "failures": 0,
      "detail": "All 376 governance tests pass, including the exact cohort and artifact-provenance contracts."
    },
    {
      "name": "spec-check-before-new-record",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm spec:check",
      "result": "fail",
      "failures": 3,
      "detail": "The validator rejected modification of committed E-CLI-003 and the uncovered governance/test changes; this new immutable record repairs all three findings."
    },
    {
      "name": "spec-check-before-schema-repair",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm spec:check",
      "result": "fail",
      "failures": 3,
      "detail": "The draft record lacked version metadata, used pass despite retained platform gaps and expanded verification beyond its byte limit."
    },
    {
      "name": "spec-check-after-new-record",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Validate, Rust formatting, mdBook and spec-first lanes pass with E-CLI-003 unchanged."
    }
  ]
}
```
