# Provision Homebrew before candidate installation

```json
{
  "id": "E-RELEASE-002",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-REL-002", "LD-REL-005"],
  "files": [
    ".github/workflows/release-desktop.yml",
    "tests/governance/release-workflow.test.mjs",
    "spec/src/current/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Candidate installation requires the Homebrew trust/audit interface used by the tap. Provision its existing pinned Homebrew setup action rather than relying on the runner image. App packaging, source identity, publication approval and native coverage remain unchanged.",
  "acceptanceReview": "The missing-bootstrap guard changed from one failure to one pass; release tests and workflow lint pass. Actual candidate native installation remains required after final-head hosted CI. E-RELEASE-001 remains immutable.",
  "runs": [
    {
      "name": "Missing Homebrew bootstrap regression",
      "command": "node --test tests/governance/release-workflow.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Corrected complete release regressions",
      "command": "node --test tests/governance/release-*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Workflow lint",
      "command": "actionlint .github/workflows/release-desktop.yml",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "homebrewSetup": "f9676f1ffe2e1a720f81b2c54c51cfb99915ec14",
    "releaseRegressionPasses": 11
  },
  "remaining": [
    "Final-head hosted Desktop CI and real Homebrew candidate installation are required."
  ]
}
```
