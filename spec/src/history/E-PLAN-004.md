# E-PLAN-004: saved AI tool expansion backlog

The user requested that the agreed six-stage plan be saved for later
implementation. The working copy was clean before this documentation-only
change. The backlog retains the two selected decisions: deliver all stages and
write explicit remembered facts to both daily and curated memory.

```json
{
  "id": "E-PLAN-004",
  "tasks": ["M10.2", "M10.3"],
  "requirements": ["LD-MIG-002", "LD-GOV-004"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "PLAN.md",
    "spec/src/backlog/ai-tool-expansion.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLAN-004.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "initial-document-format",
      "command": "pnpm exec prettier --check PLAN.md spec/src/backlog/ai-tool-expansion.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/SUMMARY.md spec/src/history/index.md spec/src/history/E-PLAN-004.md",
      "result": "fail",
      "failures": 2,
      "counts": {
        "unformattedFiles": 2
      }
    },
    {
      "name": "generate-progress",
      "command": "pnpm progress:generate",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "backlog-progress",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 42,
        "evidence": 253
      }
    },
    {
      "name": "backlog-format",
      "command": "pnpm exec prettier --check PLAN.md spec/src/backlog/ai-tool-expansion.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/SUMMARY.md spec/src/history/index.md spec/src/history/E-PLAN-004.md",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "backlog-specification",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "validators": 6,
        "chapters": 291,
        "requirements": 95
      }
    },
    {
      "name": "backlog-book",
      "command": "pnpm spec:build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "backlog-spec-first",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "counts": {
        "protectedFiles": 2,
        "canonicalChapters": 1
      }
    }
  ],
  "contractReview": "LD-MIG-002 and LD-GOV-004 remain unchanged. This saves a deferred implementation proposal and navigation links; no runtime behavior, requirement, original acceptance gate or migration dependency changes.",
  "milestoneReview": "M10.2 and M10.3 remain In progress with their existing qualification gaps. All six tool-expansion stages remain deferred; no product gate is completed by saving this plan."
}
```

Product, native, provider and Storybook tests are out of scope for this saved
backlog. There are no application changes, restarts or package releases.

The initial formatting check flagged the new backlog and the migration chapter;
Prettier corrected both. `pnpm progress:generate` refreshed the generated
ledger, then Prettier restored its normal table formatting. The generated ledger
is unchanged; task statuses and completion gates remain intact.
