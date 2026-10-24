# E-PLAN-006: defer desktop distribution

The user requested that M11 also be Deferred. The roadmap, canonical migration
contract, milestone ledger and generated summary retain the full distribution
scope and its original gate. M11 waits for explicit resumption and still depends
on M10. M12 stays Planned with its unchanged gate and dependency on M11.

The shared Rust R1.3/R3 migration remains active. Pending Desktop provider and
catalog intake changes are preserved separately. This documentation-only slice
claims no signing, publication, platform, native or product acceptance.

```json
{
  "id": "E-PLAN-006",
  "tasks": ["M11"],
  "requirements": ["LD-GOV-002", "LD-GOV-004", "LD-MIG-002"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "PLAN.md",
    "MIGRATION.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLAN-006.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "baseline-progress",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 50,
        "evidence": 281
      }
    },
    {
      "name": "baseline-document-format",
      "command": "pnpm exec prettier --check PLAN.md MIGRATION.md spec/src/current/governance.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/SUMMARY.md spec/src/history/index.md",
      "result": "fail",
      "failures": 1,
      "detail": "Generated MIGRATION.md needs formatting; all seven other selected documents pass."
    },
    {
      "name": "draft-progress-metadata",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 2,
      "detail": "Draft omitted required review metadata and incorrectly classified future product gates as gaps in this documentation-only record; corrected without changing the validator."
    },
    {
      "name": "draft-specification-metadata",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "detail": "Same two evidence-metadata diagnostics as the draft progress run."
    },
    {
      "name": "draft-full-specification",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "detail": "Stopped at validation on the same draft evidence metadata."
    },
    {
      "name": "milestone-delta-audit",
      "command": "node --input-type=module",
      "result": "pass",
      "failures": 0,
      "detail": "Compared parsed before/after milestone rows: only M11 status, next action and selected evidence differ. Every original gate and dependency, including M12, is identical."
    },
    {
      "name": "document-format-after",
      "command": "pnpm exec prettier --check PLAN.md MIGRATION.md spec/src/current/governance.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/SUMMARY.md spec/src/history/index.md spec/src/history/E-PLAN-006.md",
      "result": "pass",
      "failures": 0,
      "counts": {
        "documents": 9
      }
    },
    {
      "name": "final-progress",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 50,
        "evidence": 282
      }
    },
    {
      "name": "final-specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanes": 4
      },
      "detail": "Validation, Rust formatting, mdBook and spec-first pass in the complete working tree; pending Core intake remains separate."
    }
  ],
  "contractReview": "LD-MIG-002 retains the full original distribution gate, M10 prerequisite and M12 dependency. Deferred work remains visible in the roadmap and generated summary. No runtime contract changes.",
  "milestoneReview": "M11 becomes Deferred until explicit resumption. M12 remains Planned with its original gate and dependency on M11. All other task statuses and gates are unchanged; no product gate is completed."
}
```

## Milestone review

M11: Deferred by user request, with no completed gate. M12 and every other task
retain their status, dependencies and original acceptance criteria.
