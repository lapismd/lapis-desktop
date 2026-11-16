# Integrate current release metadata with Sync delivery

```json
{
  "id": "E-SYNC-012",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CI-002", "LD-GOV-003", "LD-GOV-004", "LD-REL-005"],
  "contractReview": "Integrate qualified artifact-role fix and current main without rewriting earlier Sync or release evidence. Preserve source pins, application authority and release-workflow read-token admission; merging source authorizes no new publication or installed application change.",
  "acceptanceReview": "Main advances only release workflow, release documentation, receipt navigation and one release-workflow regression; runtime, Cargo/npm inputs, catalog and native sources are unchanged. Retain E009 catalog and E011 full source qualification, then exercise both artifact and new release-workflow boundaries and complete merged specification.",
  "versions": {
    "artifactRoles": "d552bc31d80e45ecd667b870e167197496ac1bd0",
    "foundation": "3b434932e558556b79f7a4f9b1777cfc4b72ffb0",
    "previousMain": "c2971126269530d67d3b3a88a2f5e76f9d4cec90",
    "main": "04560f8a2a96097578944189bcff0dc8fe2ae5db",
    "finalPriorDocs": "96db3e3c-9299-4ff7-a466-7d8282faa05f"
  },
  "files": [
    ".github/workflows/release-desktop.yml",
    "docs/desktop-release.md",
    "spec/src/backlog/distribution.md",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/history/E-RELEASE-024.md",
    "spec/src/history/E-RELEASE-025.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification-notes.md",
    "tests/governance/release-workflow.test.mjs",
    "spec/src/history/E-SYNC-012.md"
  ],
  "runs": [
    {
      "name": "Current-main release metadata merge admission",
      "command": "jj new internal/sync-artifact-roles-qualified main@origin",
      "result": "fail",
      "failures": 2,
      "detail": "One history-navigation conflict and merged governance401physical lines above400. Preserve both owners receipt links, condense only duplicated non-normative CLI/release overview without removing facts or normative gates; retain all committed receipts byte-for-byte. This is integration-state evidence, not a functional failure."
    },
    {
      "name": "Combined artifact and current release workflow regressions",
      "command": "pnpm validation -- run validation:check -- tests/governance/ci-artifacts.test.mjs tests/governance/release-workflow.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Report59101792-42bf-423d-8c9a-35862bfb0ed0:106pass/0fail/0skipped. Includes real role-aware packed archive reuse and current main read-token-before-App-authorization release workflow regression."
    },
    {
      "name": "Merged canonical chapter budget remains enforced after formatting",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Reportc8c474b8-4d38-450e-ba4c-dd8a3adbca1d:formatter kept the CLI/release overview at3lines, leaving governance401above400. Condense that non-normative overview to2lines while retaining two immutable revisions, source-specific outputs, build-schema stale-binary prevention and preview receipt link; no contract or limit waiver."
    }
  ],
  "remaining": [
    "Complete affected release/artifact tests and merged specification; update dependent PRs, qualify hosted reuse and merge green source layers.",
    "Actual connected-account/fullSync and release/publication gates remain separately open."
  ]
}
```
