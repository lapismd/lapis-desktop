# E-PLAN-005: saved Markdown Review plan and contract

The user requested a repository plan and specification for future document
commenting through a dedicated Review mode, reusing the chat transcript's
cursor-based interaction. The Desktop working copy was clean before this slice.
No application behavior, package dependency or sibling repository is changed.

The plan names source owners, inspected public seams, five deferred slices and
an acceptance matrix. Eleven planned requirements govern mode/input behavior,
shared presentation, immutable source mapping, native JJ authority, receipts,
placement, lifetime, discussions and optional explicit agent handoff.

```json
{
  "id": "E-PLAN-005",
  "tasks": ["M17.1", "M17.2", "M17.3", "M17.4", "M17.5"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-004",
    "LD-MIG-002",
    "LD-REVIEW-001",
    "LD-REVIEW-002",
    "LD-REVIEW-003",
    "LD-REVIEW-004",
    "LD-REVIEW-005",
    "LD-REVIEW-006",
    "LD-REVIEW-007",
    "LD-REVIEW-008",
    "LD-REVIEW-009",
    "LD-REVIEW-010",
    "LD-REVIEW-011"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "PLAN.md",
    "MIGRATION.md",
    "scripts/spec-contracts.mjs",
    "spec/src/backlog/markdown-review-mode.md",
    "spec/src/current/markdown-review.md",
    "spec/src/current/index.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLAN-005.md"
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
      "counts": { "tasks": 45, "evidence": 274 }
    },
    {
      "name": "baseline-specification",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": { "validators": 6, "chapters": 313, "requirements": 95 }
    },
    {
      "name": "baseline-format",
      "command": "pnpm exec prettier --check PLAN.md spec/src/current/index.md spec/src/current/governance.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/SUMMARY.md spec/src/history/index.md scripts/spec-contracts.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "baseline-governance",
      "command": "node --test tests/governance/contracts.test.mjs tests/governance/progress.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": { "tests": 14 }
    },
    {
      "name": "generate-progress",
      "command": "pnpm progress:generate",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "review-existing-document-format",
      "command": "pnpm exec prettier --check PLAN.md spec/src/current/index.md spec/src/current/governance.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/SUMMARY.md spec/src/history/index.md scripts/spec-contracts.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "review-new-document-format",
      "command": "pnpm exec prettier --check MIGRATION.md spec/src/backlog/markdown-review-mode.md spec/src/current/markdown-review.md spec/src/history/E-PLAN-005.md",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "review-progress",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": { "tasks": 50, "evidence": 275 }
    },
    {
      "name": "review-specification",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": { "validators": 6, "chapters": 316, "requirements": 106 }
    },
    {
      "name": "review-book",
      "command": "pnpm spec:build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "review-spec-first",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "counts": { "protectedFiles": 4, "canonicalChapters": 3 }
    },
    {
      "name": "review-governance",
      "command": "node --test tests/governance/contracts.test.mjs tests/governance/progress.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": { "tests": 14 }
    }
  ],
  "contractReview": "Add LD-REVIEW-001 through LD-REVIEW-011 as Planned. Register the chapter for document roles, requirement coverage and spec-first recognition. Existing runtime contracts and publication/admission policies remain unchanged; owning sibling specifications must be updated before implementation there.",
  "milestoneReview": "M17.1 through M17.5 are Deferred, with explicit dependencies and product gates. This record verifies planning only and completes no product gate. Existing M10/M13/M14 and other milestone statuses, dependencies and gates remain unchanged."
}
```

The current Tauri history transport has no comment mutation command. JJ anchor
types and transcript reader behavior are source foundations, not proof of the
selected local provider or native consumer. Those gaps are explicit in M17.2.

Product, Storybook, native/provider and screenshot runs are out of scope for
this documentation slice. The existing contract/progress tests are relevant
because the canonical chapter registry is extended. No implementation,
application restart, package publication or installed-app replacement is
started.

Two patch attempts rejected a mismatched roadmap context before writing; the
working copy remained unchanged after the first atomic rejection, and the
roadmap update was then applied against its observed heading. No verification
assertion or gate was weakened.

Before/after functional governance failures: 0/0 (14/14 tests pass in both
runs). Progress and specification failures: 0/0; the new contract raises the
registered requirements from 95 to 106 and adds five Deferred tasks. All 13
changed files are formatted, and the book and spec-first gate pass. Product
functional/interaction/accessibility tests were not run for this planning slice;
their future gates remain in the plan and task ledger.
