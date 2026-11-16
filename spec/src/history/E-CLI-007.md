# Qualify the bundled CLI delivery candidate

```json
{
  "id": "E-CLI-007",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-CLI-001",
    "LD-REL-001",
    "LD-REL-002",
    "LD-REL-003",
    "LD-REL-005",
    "LD-REL-006",
    "LD-GOV-004"
  ],
  "versions": {
    "candidate": "2026.31.6-rc.2",
    "source": "f60e45d885b02358ca6478f53b5e7cb596163ddf",
    "cliSource": "3b121d21bb32ca81da84cf750661509f097a7b43",
    "notesSource": "d157d0eaf7be37a5d220d61fbadb7bcf2b35bb9f"
  },
  "files": [
    "spec/src/backlog/distribution.md",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/history/E-CLI-007.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md"
  ],
  "contractReview": "A bundled CLI is complete only when exact-source full CI admits the ordinary resource on every retained target, the non-publishing candidate seals all three archives, and both Linux installed-app lifecycles retain the verified CLI resource. Publication remains a separate protected decision.",
  "acceptanceReview": "Exact merge source f60e45d passed all 21 selected full-CI jobs. Preparation run 43747067532 then built rc.2 for Linux x64, Linux ARM64 and macOS ARM64, assembled the complete candidate, passed both Homebrew install/reinstall/uninstall and retained-data jobs, and sealed the three archives plus Linux receipts. The publish and tap jobs were skipped, so no public tag, release or tap change occurred.",
  "remaining": [
    "Native content-access consent and credential-dialog qualification remain pending under LD-CLI-002 and LD-CLI-003.",
    "Visual review remains pending; no baseline changed.",
    "Public preview publication remains an environment-protected user decision."
  ],
  "runs": [
    {
      "name": "exact-source-full-ci",
      "command": "GitHub Actions CI 43742557161, full=true",
      "result": "pass",
      "failures": 0,
      "detail": "All 21 selected jobs pass for f60e45d, including Governance, Quality, unit tests, dependency audits, ordinary macOS bundle CLI audit, both Linux native builds, static Storybook, four interaction/accessibility shards, Validate and Full source qualification."
    },
    {
      "name": "non-publishing-candidate",
      "command": "GitHub Actions Desktop preview release 43747067532, operation=prepare, publish=false",
      "result": "pass",
      "failures": 0,
      "detail": "The three ordinary rc.2 platform builds, assembly, Linux x64 and ARM64 Homebrew lifecycles, and final archive/receipt seal pass for exact source f60e45d. Artifact desktop-preview-f60e45d885b02358ca6478f53b5e7cb596163ddf-1 is retained for 30 days; publication and tap jobs were skipped."
    }
  ]
}
```
