# Dependency automation CI rebase

```json
{
  "id": "E-DEPENDENCIES-003",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-002", "LD-GOV-004", "LD-CI-001", "LD-CI-004"],
  "files": [
    ".github/workflows/ci.yml",
    "scripts/ci/docs.mjs",
    "tests/governance/ci-bot-docs.test.mjs",
    "spec/src/current/ci.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "spec/src/current/governance.md"
  ],
  "runs": [
    {
      "name": "Initial selected governance probe",
      "command": "node --test tests/governance/ci-bot-docs.test.mjs tests/governance/ci-selection.test.mjs tests/governance/ci-selection-commands.test.mjs tests/governance/ci-selection-workflow.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "11 tests passed; one workflow-test module could not load the declared YAML dependency in this incomplete local node_modules. Linked the already cached, declared YAML 2.9.1 package for source-only governance validation; no private archive or native installation."
    },
    {
      "name": "Selected CI and dependency governance",
      "command": "node --test tests/governance/ci-bot-docs.test.mjs tests/governance/ci-selection.test.mjs tests/governance/ci-selection-commands.test.mjs tests/governance/ci-selection-workflow.test.mjs tests/governance/ci-prerequisites.test.mjs tests/governance/local-archives.test.mjs tests/governance/archive-development-dependencies.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "28 tests pass. Trusted dependency authors skip all three specification phases on human reruns while formatting remains active. Humans and untrusted bots retain validate/build/exact-range first; pushes retain spec checks. Selection/aggregation, Rust closure and archive/private API identity checks remain enabled."
    },
    {
      "name": "Initial rebase metadata validation",
      "command": "spec-validator validate; node scripts/evidence.mjs",
      "result": "fail",
      "failures": 2,
      "detail": "The fresh receipt omitted its required versions field, and combined main/feature prose exceeded the governance chapter cap by one line. Added versions and condensed only the feature policy sentence, retaining every main-branch contract and the 400-line limit."
    },
    {
      "name": "Final rebase specification validation",
      "command": "LAPIS_DESKTOP_BASE=5385f7e46a07387552d0485184ef384e3c1a7ba6 LAPIS_DESKTOP_HEAD=wvszwpvy node_modules/.bin/spec-validator validate",
      "result": "pass",
      "failures": 0,
      "detail": "7 validators, 444 chapters, 126 requirements pass."
    },
    {
      "name": "Final rebase evidence validation",
      "command": "LAPIS_DESKTOP_BASE=5385f7e46a07387552d0485184ef384e3c1a7ba6 LAPIS_DESKTOP_HEAD=wvszwpvy node scripts/evidence.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "391 records pass."
    },
    {
      "name": "Exact rebased PR range",
      "command": "node_modules/.bin/spec-validator first --base 5385f7e46a07387552d0485184ef384e3c1a7ba6 --head wvszwpvy",
      "result": "pass",
      "failures": 0,
      "detail": "8 protected files, 3 canonical chapters pass."
    },
    {
      "name": "Workflow lint",
      "command": "actionlint .github/workflows/ci.yml",
      "result": "pass",
      "failures": 0,
      "detail": "Pass; all selected-gate planning and platform contexts are retained."
    }
  ],
  "remaining": [
    "Fresh current-head hosted functional/native CI after the rebase. Earlier green jobs and the still-running old-head native lane do not qualify this new head."
  ],
  "contractReview": "Rebase onto merged Linux release and dependency-aware CI commit 5385f7e46a07387552d0485184ef384e3c1a7ba6. Preserve its planner, Rust caches, platform gates and release qualification. Carry the trusted author policy into its new docs runner; keep formatting and selected functional checks. Human PRs and pushes retain specification checks. UI 0.1.6, Markdown 0.2.1 and the user-pinned private Profile/API cohort are unchanged.",
  "acceptanceReview": "This receipt qualifies the conflict resolution and narrow source/governance regression surface. It adds no assertion relaxation, audit exception or quarantine. Existing main-branch release decisions are preserved; no package publication, signing, deployment or coordinator activation is performed.",
  "versions": {
    "node": "26.9.0 for source governance checks",
    "pnpm": "10.34.5",
    "ui": "0.1.6",
    "markdown": "0.2.1",
    "api": "0.2.3; private Profile source unchanged",
    "rebaseBase": "5385f7e46a07387552d0485184ef384e3c1a7ba6"
  }
}
```
