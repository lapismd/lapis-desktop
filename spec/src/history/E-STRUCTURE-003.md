# Dedicated AI contract

```json
{
  "id": "E-STRUCTURE-003",
  "tasks": ["M10.2"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-AI-002"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4"
  },
  "files": [
    "MIGRATION.md",
    "scripts/spec-contracts.mjs",
    "spec-validator.config.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-STRUCTURE-003.md",
    "spec/src/history/index.md",
    "tests/governance/contracts.test.mjs"
  ],
  "result": "pass",
  "completedGates": {},
  "remaining": [],
  "runs": [
    {
      "name": "ai-contract-before",
      "command": "node --test --test-name-pattern=\"AI is a canonical|AI policy, transport\" tests/governance/contracts.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "The former registry does not recognize ai.md, and AI implementations map only to the combined plugin chapter."
    },
    {
      "name": "ai-contract-after",
      "command": "node --test --test-name-pattern=\"AI is a canonical|AI policy, transport\" tests/governance/contracts.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Both new canonical-role and dedicated-owner regressions pass."
    },
    {
      "name": "all-node-consumers",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 167 cases pass, including progress, source audits, chapter roles and mapped protection. Product code is unchanged; no native/UI acceptance is inferred."
    },
    {
      "name": "original-contract-comparison",
      "command": "Node comparison of canonical requirement rows and parsed task gates against @-",
      "result": "pass",
      "failures": 0,
      "note": "All 89 requirement texts and all 28 task gate/status/dependency/requirement fields are unchanged. The new AI chapter is 281 lines/19645 bytes and plugins is 135 lines/12673 bytes."
    },
    {
      "name": "canonical",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Validation, Rust formatting, mdBook and specification-first pass, including source and App-ownership guards."
    }
  ],
  "milestoneReview": "M10.2 stays in progress. This maintenance slice separates the existing AI/compute contract so native admission and recovery can evolve within the unchanged document limits. It does not qualify runtime behavior or advance a product gate.",
  "contractReview": "Move the five AI/compute requirement rows and retained AI prose verbatim to current/ai.md; keep plugin identity/catalog/Terminal/portable contracts in plugins.md. The shared chapter registry governs document roles, progress IDs and specification-first. Map AI policy, renderer adapter, views, tests and catalog to its dedicated owner; retain explicit default desktop and tooling maps. Historical evidence remains immutable. No product code, dependency, test deadline, native authority or completion gate changes."
}
```
