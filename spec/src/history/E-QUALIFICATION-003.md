# Approved historical formatting exception

```json
{
  "id": "E-QUALIFICATION-003",
  "date": "2026-10-22",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8.0"],
  "requirements": ["LD-GOV-003", "LD-GOV-007", "LD-CAT-001"],
  "versions": {
    "desktop": "bfa6a9b1",
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "contractReview": "Record the explicit user-approved pre-existing formatting exception without altering committed evidence, checks, product code or acceptance gates. The implementation slice is already committed at bfa6a9b1.",
  "milestoneReview": "M8.0 retains its original completed gate and selected 2,000 catalog executions in E-AI-126/E-CATALOG-017. No migration, native, provider, distribution or visual gate is promoted.",
  "runs": [
    {
      "name": "existing-formatting-before",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 2,
      "note": "Full formatter reports MIGRATION.md and unchanged spec/src/history/E-AI-109.md. Format the regenerated summary in this documentation slice. Log: /tmp/lapis-desktop-approved-format.log. Exact historical-only prettier target also fails once."
    },
    {
      "name": "historical-bytes",
      "command": "jj file show -r @ / @- / @-- spec/src/history/E-AI-109.md; SHA256 comparison",
      "result": "pass",
      "failures": 0,
      "note": "All three snapshots have SHA256 16e50704e76ed720fdf280a28167714c23079fd13facd803580ca0aced74e93a. The user explicitly approved recording this existing failure and committing the verified slice."
    },
    {
      "name": "documentation-spec-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "First appended migration paragraph exceeded the existing 400-line page limit by four lines; the next attempt exceeded it by one. Fold the exception into the existing introduction; retain the limit."
    },
    {
      "name": "documentation-qualification",
      "command": "pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes 42 tasks/262 evidence records. Final canonical validation, Rust format, mdBook and spec-first pass all four lanes. Product code is unchanged; existing source/catalog/native evidence remains selected."
    },
    {
      "name": "formatting-after",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 1,
      "note": "Only immutable historical E-AI-109.md remains flagged after generated MIGRATION.md formatting. User explicitly accepts this existing failure. Changed documentation is formatted."
    }
  ],
  "remaining": [],
  "acceptedExistingFailures": [
    "E-AI-109.md remains unchanged and fails Prettier; the user accepted this isolated existing formatting failure. No formatter ignore or assertion is weakened."
  ],
  "files": [
    "spec/src/current/progress/milestones.md",
    "spec/src/current/migration.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md",
    "spec/src/history/E-QUALIFICATION-003.md"
  ]
}
```
