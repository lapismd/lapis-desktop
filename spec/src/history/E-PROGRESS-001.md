# Live migration tracking and task navigation

```json
{
  "id": "E-PROGRESS-001",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M0.2"],
  "requirements": ["LD-GOV-001", "LD-GOV-002", "LD-GOV-004"],
  "versions": {
    "desktopBaseline": "a9ce8d9a",
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "contractReview": "The prior generated milestone table hid ongoing qualification and discarded an explicit activity checkpoint. Project ledger-owned verified/running/waiting activity and its UTC stamp. Emit separate nonempty gate-status tables in active-first order, naturally sort task IDs without changing ledger order, and link each task to its defining spec file, including the separate backup ledger. Refresh during work changes and in each commit.",
  "milestoneReview": "Workflow qualification only. Original milestone statuses, gates and prerequisites remain unchanged, including M0.2 quiet native testing. Ongoing Search-provider intake and its broader catalog qualification remain separate in E-CORE-014; no host database adoption, native product, semantic Search, UI/OS, provider, visual or distribution gate is completed here.",
  "runs": [
    {
      "name": "activity-before",
      "command": "node --test --test-name-pattern='migration summary shows explicit current activity' tests/governance/progress.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The flat prior generator discards the supplied activity checkpoint. Log .local/migration-activity-before.log."
    },
    {
      "name": "activity-after",
      "command": "Exact activity case; complete progress cases; regenerate/check summary",
      "result": "pass",
      "failures": 0,
      "note": "Exact activity case passes; the first complete set passes nine cases. Timestamp, explicit activity, milestone distinctions and malformed block rejection are covered. Logs .local/migration-activity-{after,tests,generate}.log."
    },
    {
      "name": "groups-and-links-before",
      "command": "node --test --test-name-pattern='migration tables|migration task links' tests/governance/progress.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Separate status sections and source-task links are absent. Log .local/migration-groups-before.log."
    },
    {
      "name": "groups-and-links-after",
      "command": "Exact groups/links cases; node --test tests/governance/progress.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Both regressions pass, and all 11 progress cases pass. Numeric IDs include M2, M10.2 and M10.10; the input array is frozen. Backup task links retain the source spec path. Logs .local/migration-groups-{after,tests}.log."
    },
    {
      "name": "all-renderer-and-governance",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "411 pass, zero failed/skipped/cancelled. Earlier activity-only stage passed 409 cases. Log .local/migration-groups-renderer-governance.log."
    },
    {
      "name": "progress-check",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes 50 tasks / 280 records at the pre-record checkpoint; spec-first passes nine protected files / five mapped chapters. Logs .local/migration-groups-{check,first}.log. Final fresh-record metadata and documentation checks follow."
    },
    {
      "name": "all-task-links",
      "command": "Read each generated task link and assert its spec file contains that exact task row",
      "result": "pass",
      "failures": 0,
      "note": "All 50 unique task links resolve to their defining spec rows, including backup tasks. Log .local/migration-tracker-link-check.log."
    },
    {
      "name": "document-intake-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The selected-slice navigation draft removes the pending E-CORE-014 entry while that separate uncommitted record is still in the full working tree. Restore its working-tree navigation entry. The tracker commit excludes both that unrelated record and its navigation line together; no validator rule is bypassed. Log .local/migration-tracker-commit-spec.log."
    },
    {
      "name": "final-specification",
      "command": "pnpm progress:generate; changed-file Prettier; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four working-tree specification lanes pass: validation, Rust formatting, mdBook and spec-first. Pending Core intake remains a separate uncommitted slice; its record and navigation are excluded together from this tracker-only commit. Final metadata, timestamp and selected-file formatting are checked before commit. Logs .local/migration-tracker-final-{generate,format,spec}.log."
    }
  ],
  "files": [
    "AGENTS.md",
    "MIGRATION.md",
    "scripts/progress-model.mjs",
    "scripts/progress.mjs",
    "tests/governance/progress.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-PROGRESS-001.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "remaining": []
}
```

This slice reports current activity without promoting the ongoing native Search
intake or changing any original product gate. The broader catalog remains
running.
