# Refresh the hosted private-profile source

```json
{
  "id": "E-CLI-005",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CLI-001", "LD-GOV-004", "LD-GOV-006"],
  "versions": {
    "notesSource": "d157d0eaf7be37a5d220d61fbadb7bcf2b35bb9f",
    "api": "0.6.1",
    "fileExplorer": "0.2.8",
    "languageService": "0.1.6",
    "ui": "0.2.0",
    "workspace": "0.4.4"
  },
  "files": [
    "scripts/ci-sources.json",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-CLI-005.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/validation-native.test.mjs"
  ],
  "contractReview": "Hosted private-profile preparation must use the same immutable Notes source as the adopted public cohort, while the independently qualified native Notes pin remains unchanged.",
  "acceptanceReview": "The old hosted profile source packed API 0.3.1 beside the root API 0.6.1 and caused three private-class type errors. Advancing only the JavaScript/private-profile source to the merged release commit packs API 0.6.1, File Explorer 0.2.8 and Workspace 0.4.4, matching the registry cohort without aliases or patches.",
  "remaining": [
    "Supported-platform installed-bundle and native credential-dialog qualification remains pending.",
    "Visual review remains pending; no baseline changed."
  ],
  "runs": [
    {
      "name": "hosted-quality-before-profile-refresh",
      "command": "GitHub Actions CI run 43661677951, Quality",
      "result": "fail",
      "failures": 3,
      "detail": "The old private-profile source installed API 0.3.1 beside API 0.6.1; Svelte rejected the separate private App and Component identities."
    },
    {
      "name": "profile-source-regressions",
      "command": "node --test tests/governance/ci-prerequisites.test.mjs tests/governance/validation-native.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Both source inventories require d157 for hosted JavaScript while preserving the existing native Notes revision and single API 0.6.1 context."
    },
    {
      "name": "governance-group",
      "command": "GITHUB_ACTIONS=true with complete producer context, LAPIS_DESKTOP_VALIDATION_RUNTIME=native LAPIS_CI_UNIT_GROUPS='[\"governance\"]' pnpm ci:unit",
      "result": "pass",
      "failures": 0,
      "detail": "All 376 governance tests pass with the refreshed source inventory."
    },
    {
      "name": "portable-quality-before-spec-compaction",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "The coherent profile installed successfully and reached specification validation, which rejected the newly expanded governance document at 402 lines against its 400-line limit."
    },
    {
      "name": "portable-quality",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "The exact d157 profile archive installs one API 0.6.1 context and the complete Quality lane passes without Svelte or Rust findings."
    },
    {
      "name": "portable-spec-check",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Validate, Rust formatting, mdBook and spec-first lanes pass."
    }
  ]
}
```
