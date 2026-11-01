# Saved Lapis Sync implementation plan

This receipt covers the user's requested documentation for future implementation
in Desktop and Plugins. They confirmed the full enrolled/readable Server scope
and selected Rust algorithms in Plugins with retained TypeScript parity
fixtures. Native core owns durable effects/scheduling; Desktop owns Tauri/OS
admission. No product requirement or native acceptance is completed here.

```json
{
  "id": "E-PLAN-007",
  "date": "2026-11-14",
  "revision": "enclosing-change",
  "result": "blocked",
  "requirements": ["LD-GOV-001", "LD-GOV-004", "LD-MIG-002", "LD-MIG-003"],
  "files": [
    "spec/src/backlog/lapis-sync.md",
    "spec/src/backlog/vault-synchronization.md",
    "spec/src/backlog.md",
    "spec/src/current/plugins.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLAN-007.md"
  ],
  "versions": {
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.0"
  },
  "contractReview": "Documentation-only backlog/navigation update. Existing product requirements, verification statuses, parked Sync exclusions and frozen Deno policy remain intact. Future APIs and native implementations need owning contracts before protected code changes.",
  "acceptanceReview": "Only saved-plan documentation is under review. Earlier API and Deno receipts retain their scope; current skipped Sync tests do not qualify Rust, Tauri, Server or release gates. Existing Desktop governance failures are recorded independently below.",
  "remaining": [
    "Repository-wide specification qualification retains 14 pre-existing findings; saved-plan formatting, book, local links and edited-file limits pass with no new findings."
  ],
  "runs": [
    {
      "name": "Node 24 doctor: QMD native modules and index healthy; existing alias warning",
      "command": "pnpm exec spec-validator doctor --json",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "QMD backlog discovery before editing",
      "command": "pnpm spec:search --scope backlog 'Lapis Sync'",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Unchanged source baseline: seven missing historical paths, six unrelated files without evidence, one overlong governance page",
      "command": "pnpm exec spec-validator validate --json",
      "result": "fail",
      "failures": 14
    },
    {
      "name": "Initial scoped file-limit check: added standalone pointer exceeds plugin chapter limit",
      "command": "node --input-type=module (read-only scoped Markdown links and file limits)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Scoped links and file limits after integrating the pointer: seven files, 706 local links; zero errors",
      "command": "node --input-type=module (read-only scoped Markdown links and file limits)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Portable Docker specification attempt retains the same 14 baseline findings; no new plan findings",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 14
    },
    {
      "name": "Current host toolchain independently confirms the same 14 baseline findings, 393 chapters and 116 unchanged requirements",
      "command": "pnpm exec spec-validator validate --json",
      "result": "fail",
      "failures": 14
    },
    {
      "name": "Owning evidence checker: 13 baseline evidence findings, no new plan coverage findings",
      "command": "node scripts/evidence.mjs",
      "result": "fail",
      "failures": 13
    },
    {
      "name": "Host documentation book build; existing large search-index warning",
      "command": "pnpm exec spec-validator build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Spec-first passes: four protected files, three canonical chapters",
      "command": "pnpm exec spec-validator first --json",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Scoped document formatting: seven files pass",
      "command": "pnpm exec prettier --check spec/src/backlog/lapis-sync.md spec/src/backlog/vault-synchronization.md spec/src/backlog.md spec/src/current/plugins.md spec/src/SUMMARY.md spec/src/history/index.md spec/src/history/E-PLAN-007.md",
      "result": "pass",
      "failures": 0
    }
  ]
}
```

## Baseline and preservation

The baseline working copy `d24cbd57` (parent `ea80efee`) has unrelated edits in
`package.json`, `pnpm-lock.yaml`, `scripts/ci-prepare-links.mjs`,
`spec/src/current/governance.md`, `spec/src/current/local-dependencies.md` and
`tests/governance/turbo-task-graph.test.mjs`. Their contents are preserved and
excluded from the scoped documentation commit.

Before editing, specification validation reports 14 findings. E-CI-003 names
five missing historical files under `src/components/files`: ConflictReview,
ConflictReviewControls, conflict-review-state, conflict-review-view and
register-conflict-reviews. E-CI-004 names missing `catalog/AI_MIGRATION.md` and
`spec/src/current/markdown-review.md`. The six unrelated files lack fresh
coverage and `current/governance.md` has 407 physical lines (limit 400). No
finding is suppressed or repaired by this slice. Fresh evidence covers only the
new plan/navigation changes; committed historical receipts remain immutable.

Both repositories already declare the current Deno-free spec-validator 0.2.0; no
dependency update is necessary. Node 24.10.0 resolves the prior QMD ABI issue.
The observation commands (85 passing API cases, 205 skipped Sync tests and clean
Sync source checks) belong to the preceding investigation and are not rerun as
document checks or presented as native qualification.

Product/native/provider/Storybook suites are intentionally deferred to the saved
implementation stages. No visual baseline, package publication, server
deployment, installed application or user vault changes.

## Final documentation review

The saved plan and navigation add no new specification/evidence finding. The
initial 405-line pointer attempt was corrected by integrating the link into the
existing exclusion paragraph; the plugin chapter remains at 400 lines. All seven
changed Markdown files pass formatting, local-link and file-limit checks. The
host mdBook builds with its existing large search-index warning. No existing
product requirement or verification row changed.

The normal portable command ran in Docker and stopped at the same 14 baseline
findings. Its report is
`.local/validation/runs/lapis-desktop-validation-514c06fc-4508-41d0-a1f7-3e4228aa696b`.
That worker's prerequisite graph reports spec-validator 0.1.4 even though the
tracked manifest and host toolchain use 0.2.0; the independent current-toolchain
validation confirms exactly the same findings. These are separate receipts, and
the host book/format checks do not claim Docker or native product parity.

The blocked result above retains repository-wide qualification gaps rather than
claiming a clean specification lane. The requested documentation itself is
complete. The six original unrelated files have unchanged SHA-256 hashes.
Plugins saved its independently qualified counterpart as `1c0bba269a5b`. Both
repositories retain local commits; no conflicted main bookmark is moved or
pushed, and no source release is authorized by this record.
