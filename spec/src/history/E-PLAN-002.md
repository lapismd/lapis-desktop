# E-PLAN-002: shared application state plan

On 2026-10-15 the user changed the default state directory to `.lapis` for the
entire application. The unreleased application needs no legacy-state migration
or preservation gate. This record verifies the plan update, not runtime support.

```json
{
  "id": "E-PLAN-002",
  "tasks": ["M1", "M2", "M12"],
  "requirements": ["LD-MIG-002"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "prettier": "3.3.3",
    "specValidator": "0.1.4"
  },
  "files": [
    "PLAN.md",
    "MIGRATION.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLAN-002.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "before-progress-validation",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidence": 3
      },
      "note": "Clean working copy before this planning change. The old plan still used .obsidian and required isolated Tauri paths, preserving Deno state, and importing legacy state at cutover."
    },
    {
      "name": "plan-and-ledger-semantic-review",
      "command": "node --input-type=module -",
      "result": "pass",
      "failures": 0,
      "counts": {
        "matchingRevisedGates": 3,
        "unchangedTaskStatuses": 14,
        "unchangedCompletedTasks": 2
      },
      "note": "Inline assertions compare M1/M2/M12 gates in PLAN.md and the ledger, compare every task status with @-, and verify both completed M0 task rows remain unchanged. Obsolete Tauri isolation, Deno-state preservation, and legacy import/rollback gates are absent."
    },
    {
      "name": "after-progress-validation",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidence": 4
      }
    },
    {
      "name": "document-formatting",
      "command": "pnpm exec prettier --check PLAN.md MIGRATION.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/SUMMARY.md spec/src/history/index.md spec/src/history/E-PLAN-002.md",
      "result": "pass",
      "failures": 0,
      "counts": {
        "files": 8
      }
    },
    {
      "name": "complete-specification-check",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanesPassed": 4,
        "failed": 0
      },
      "note": "Published Node validator, immutable evidence/progress/source audits, Rust formatting, mdBook and mapped spec-first pass. Product test suites are unnecessary for this documentation-only change."
    }
  ],
  "contractReview": "The user requested .lapis and explicitly clarified that it is the entire application default, not Tauri-only. M1 updates shared packages and all affected hosts; the user approved dropping pre-release state import/preservation gates. Note-save integrity and database transaction guarantees remain required. Existing source inventory and committed evidence stay immutable.",
  "milestoneReview": "Planning revision only. M0.0 and M0.1 remain Done with their existing evidence and gates. M1, M2 and M12 remain Planned; this record does not complete any implementation gate."
}
```
