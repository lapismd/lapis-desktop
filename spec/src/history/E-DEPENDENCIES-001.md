# Dependency automation PR governance

```json
{
  "id": "E-DEPENDENCIES-001",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-002", "LD-GOV-004", "LD-GOV-006"],
  "versions": {
    "node": "26.9.0 for focused local tests",
    "pnpm": "10.34.5; release tooling unchanged"
  },
  "files": [
    ".github/workflows/ci.yml",
    "scripts/dependency-automation/spec-policy.mjs",
    "scripts/validation/docker.mjs",
    "scripts/validation/lanes.json",
    "spec/src/current/governance.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md"
  ],
  "runs": [
    {
      "name": "Initial hosted governance",
      "command": "CI Governance: pnpm spec:check",
      "result": "fail",
      "failures": 6,
      "detail": "Five source paths lacked fresh evidence and governance.md exceeded the 400-line contract. This receipt covers the CI policy slice and the paragraph is now within the limit."
    },
    {
      "name": "Focused portable governance",
      "command": "node --test tests/governance/validation.test.mjs tests/governance/turbo-task-graph.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "33 tests passed."
    }
  ],
  "remaining": [
    "Hosted checks must pass before merge; no native/product release qualification is asserted."
  ],
  "contractReview": "Dependency PR authors use the trusted bot specification exemption; functional commands and configured validator lanes remain active. Publication, signing, deployment and merge authority are unchanged. The integration is rebased onto current main.",
  "acceptanceReview": "This record qualifies only the source/CI governance boundary. Native ARM64, interaction, audit, packaging and normal release gates remain enabled and must pass separately."
}
```

Trusted dependency PR classification uses the PR author, so a human rerun
retains the exemption. Ordinary PRs retain the specification gate.
