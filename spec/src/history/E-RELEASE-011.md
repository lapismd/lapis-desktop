# Manual full CI receipt ancestry

```json
{
  "id": "E-RELEASE-011",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-002", "LD-GOV-004", "LD-CI-001", "LD-CI-003"],
  "files": [
    "scripts/ci-revisions.mjs",
    "tests/governance/ci-revisions.test.mjs",
    "spec/src/current/ci.md",
    "spec/src/current/governance.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Full manual qualification on exact main2e63d223 used root() because workflow_dispatch has no PR/push before field. Run41339715598 Governance124947318923 failed historical receipt/path validation; other unfinished jobs were cancelled, never counted as passes. Require the actual source first parent for manual runs and reject missing/invalid parent ancestry. Preserve existing PR/push/initial-root semantics and every committed evidence payload. No native test or production policy changes.",
  "acceptanceReview": "Reproduce3manual regressions before repair, then pass all5revision tests including an actual two-commit colocated Git/Jujutsu fixture exercising the CLI/GITHUB_ENV output. Run complete governance, Docker specification/evidence and style checks. Hosted full exact-main qualification remains mandatory; local wiring cannot qualify product/release gates. Quarantine count remains18.",
  "runs": [
    {
      "name": "Manual full Governance rejected old receipt paths because base=root(); run cancelled after failure, other incomplete lanes not qualified.",
      "command": "CI workflow_dispatch full=true (run41339715598/job124947318923)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Before repair:2existing range/wiring tests pass,3new manual regressions fail, including real CLI export of root() instead of source parent.",
      "command": "node --test tests/governance/ci-revisions.test.mjs",
      "result": "fail",
      "failures": 3
    },
    {
      "name": "After repair:all5revision tests pass,0fail/0skip; actual CLI exports the first parent from a two-commit colocated checkout.",
      "command": "node --test tests/governance/ci-revisions.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance248passed,0failed/0skipped.",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "All4Docker specification lanes pass:validate,rust-format,mdbook,spec-first.",
      "command": "LAPIS_DESKTOP_BASE=2e63d223e029ac229b9e5656c611bf450c24acaf LAPIS_DESKTOP_HEAD=@ pnpm spec:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker immutable-evidence validation passes395records; changed-file formatting passes.",
      "command": "LAPIS_DESKTOP_BASE=2e63d223e029ac229b9e5656c611bf450c24acaf LAPIS_DESKTOP_HEAD=@ pnpm check:evidence; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "hostedNode": "24.22.1"
  },
  "remaining": [
    "Local qualification passes:5revision/real-CLI tests,248governance tests,4Docker spec lanes,395Docker evidence records and formatting. Hosted manual qualification remains pending.",
    "Full hosted qualification on the repaired main source remains required before preparing the three-platform candidate with publication disabled."
  ]
}
```
