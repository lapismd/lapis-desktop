# Verified historical deletion provenance

```json
{
  "id": "E-EVIDENCE-001",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pass",
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-004", "LD-GOV-007"],
  "files": [
    "scripts/evidence-corrections.mjs",
    "scripts/evidence.mjs",
    "tests/governance/evidence-corrections.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/verification.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "versions": {
    "node": "24.10.0",
    "specValidator": "0.2.0"
  },
  "contractReview": "Append verified deletion provenance when a historical receipt was written after the named deletion. Require unchanged receipt hashes, exact ancestral source and actual deleted paths. Preserve immutable receipts and missing-file diagnostics.",
  "acceptanceReview": "Tooling-only proof; does not qualify product behavior or change the old receipt results. New evidence cannot claim unrelated historical paths.",
  "runs": [
    {
      "name": "Original historical paths",
      "command": "node scripts/evidence.mjs",
      "result": "fail",
      "failures": 7
    },
    {
      "name": "New regression before implementation",
      "command": "node --test tests/governance/evidence-corrections.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Complete evidence model and provenance family",
      "command": "node --test tests/governance/evidence-corrections.test.mjs tests/governance/evidence.test.mjs tests/governance/evidence-files.test.mjs tests/governance/legacy-evidence.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 13
    },
    {
      "name": "Initial display-summary provenance attempt",
      "command": "node scripts/evidence.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Rename summaries are not deletion lines; use source-tree membership before and after the exact revision."
    },
    {
      "name": "Real delayed receipt resolution",
      "command": "node scripts/evidence.mjs",
      "result": "pass",
      "failures": 0,
      "records": 345,
      "note": "Original seven historical findings resolve; immutable records are unchanged. Exact first correction rejected moved paths; tree-difference proof then handles both deletion and rename without interpreting display summaries."
    },
    {
      "name": "Complete evidence family including actual Jujutsu history",
      "command": "node --test tests/governance/evidence-corrections.test.mjs tests/governance/evidence.test.mjs tests/governance/evidence-files.test.mjs tests/governance/legacy-evidence.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 14
    },
    {
      "name": "Normal Docker evidence gate",
      "command": "pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-ae7b5173-195e-47cc-a5f3-806a13b34300"
    },
    {
      "name": "Normal Docker specification gate",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-18374ce6-bb49-40d9-8955-ebf7bbe7ea53"
    },
    {
      "name": "Full Docker check including strict Rust and formatting",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-27ca8755-9cad-4147-a7b9-2c6fe30f2a92"
    },
    {
      "name": "Full governance, renderer, AI and Rust suites",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "receipt": "lapis-desktop-validation-b41d8bb9-5230-48a0-b781-2bc60c62d971"
    }
  ],
  "historicalFileCorrections": [
    {
      "record": "E-CI-003",
      "sha256": "ff347c28cf391c17c7912e75051df3219ddf6a0af61c7f1ac5438f26453dc2ff",
      "deletionRevision": "ad20df2924ecac648c43593c22a8c636dc80236e",
      "files": [
        "src/components/files/ConflictReview.svelte",
        "src/components/files/ConflictReviewControls.svelte",
        "src/components/files/conflict-review-state.svelte.ts",
        "src/components/files/conflict-review-view.ts",
        "src/components/files/register-conflict-reviews.ts"
      ]
    },
    {
      "record": "E-CI-004",
      "sha256": "76967687fef1425a6a9052e7a5ae205c073f66a5de098bf78f4491dcecfe6441",
      "deletionRevision": "d605d69ea0d742b14928ab106aafdd50479140b1",
      "files": [
        "catalog/AI_MIGRATION.md",
        "spec/src/current/markdown-review.md"
      ]
    }
  ],
  "remaining": []
}
```

The seven references belong to actual earlier deletions. E-CI-003 and E-CI-004
were appended later, so their immediate snapshots cannot resolve those paths.
The correction verifies the unchanged receipt bytes and exact ancestral
deletions without rewriting a historical result or accepting a missing source
path.
