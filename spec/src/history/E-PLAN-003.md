# E-PLAN-003: local archive migration workflow

Shared source fixes will be verified and packed locally. This record documents
the user-authorized qualification path; publication remains deferred.

```json
{
  "id": "E-PLAN-003",
  "tasks": ["M1"],
  "requirements": ["LD-GOV-006", "LD-MIG-002"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "PLAN.md",
    "AGENTS.md",
    "MIGRATION.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLAN-003.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "workflow-plan-progress",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidence": 5
      }
    },
    {
      "name": "workflow-plan-specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanesPassed": 4,
        "failed": 0
      }
    }
  ],
  "contractReview": "The user explicitly authorized pnpm local archives for shared source changes and deferred publication to the end. This revises the future M1 gate and preserves source ownership and portable tracked dependency metadata.",
  "milestoneReview": "M1 starts implementation in a clean Notes JJ workspace at 8d748436. Unrelated Bases edits remain in the original checkout. No product gate is complete in this planning record."
}
```
