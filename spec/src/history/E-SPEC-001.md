# Canonical specification and backlog consolidation

```json
{
  "id": "E-SPEC-001",
  "date": "2026-10-30",
  "revision": "enclosing-change",
  "result": "pass",
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-MIG-001",
    "LD-MIG-002",
    "LD-MIG-003"
  ],
  "files": [
    ".gitignore",
    ".qmd/index.yml",
    "AGENTS.md",
    "AI_ACP_REFERENCE.md",
    "MIGRATION.md",
    "PLAN.md",
    "PLUGIN_MIGRATION.md",
    "POPOUT_PLAN.md",
    "README.md",
    "RELEASE.md",
    "catalog/AI_COVERAGE.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "docs/automatic-vault-backup-progress.md",
    "docs/governance-checkpoints.md",
    "docs/shared-ui-migration.md",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/evidence-model.mjs",
    "scripts/evidence.mjs",
    "scripts/progress-model.mjs",
    "scripts/progress.mjs",
    "scripts/spec-contracts.mjs",
    "scripts/spec-plugin.mjs",
    "scripts/validation/lanes.json",
    "spec/evidence/migration-inventory.json",
    "spec/src/SUMMARY.md",
    "spec/src/backlog/ai-qualification.md",
    "spec/src/backlog/ai-tool-expansion.md",
    "spec/src/backlog/distribution.md",
    "spec/src/backlog/markdown-review-contract.md",
    "spec/src/backlog/markdown-review-mode.md",
    "spec/src/backlog/native-conversations.md",
    "spec/src/backlog/vault-synchronization.md",
    "spec/src/backlog.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/integration.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/shared-screen-integration.md",
    "spec/src/current/verification.md",
    "spec/src/current/windows.md",
    "spec/src/current/writer-audit.md",
    "spec/src/history/E-SPEC-001.md",
    "spec/src/history/current-intake.md",
    "spec/src/history/index.md",
    "spec/src/verification.md",
    "spec-validator.config.mjs",
    "src/lib/ai/NOTICE.md",
    "src-tauri/README.md",
    "src-tauri/tests/fixtures/acp-provider.rs",
    "tests/governance/contracts.test.mjs",
    "tests/governance/evidence-files.test.mjs",
    "tests/governance/evidence.test.mjs",
    "tests/governance/progress.test.mjs"
  ],
  "contractReview": "Current chapters and verification own behavior/status; topic backlogs own remaining implementation and original qualification. Tracking-only governance is deliberately replaced. All product requirement identities and acceptance boundaries are preserved. The source inventory is byte-preserved as historical provenance.",
  "acceptanceReview": "This slice qualifies specification consolidation and retained evidence tooling only. Historical native/provider/release receipts retain their original scope; existing product gaps move to owning topic backlogs without being marked passed.",
  "versions": {
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.0"
  },
  "runs": [
    {
      "name": "Original tracker regression baseline",
      "command": "node --test tests/governance/progress.test.mjs tests/governance/evidence-files.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Evidence model and historical file regression (8 pass)",
      "command": "node --test tests/governance/evidence.test.mjs tests/governance/evidence-files.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "First broad governance attempt (168 pass, three missing public-API dependencies)",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "fail",
      "failures": 3
    },
    {
      "name": "Exact missing-dependency targets after tooling install (11 pass)",
      "command": "node --import tsx --test tests/governance/desktop-test-mode.test.mjs tests/governance/dev-watch.test.mjs tests/governance/live-provider-exclusion.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance suite (179 pass)",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Existing acceptance fixture Rust-format drift",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Rust formatting after whitespace-only correction",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete specification check (4 lanes)",
      "command": "pnpm exec spec-validator check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Doctor and current/backlog semantic searches",
      "command": "pnpm exec spec-validator doctor --json && pnpm spec:search --semantic 'native admission and writer lifetime' && pnpm spec:search --scope backlog --semantic 'provider qualification'",
      "result": "pass",
      "failures": 0
    }
  ],
  "remaining": []
}
```

## Reconciliation and preserved evidence

The baseline f712d62c contains 58 milestone rows: 39 Done, five Partial, five In
progress, eight Deferred and one Planned. Before removal, 11 tracker and three
historical-file cases pass. The replacement evidence target passes eight cases,
including false passes, unknown requirements, modified/deleted receipts, fresh
deletion coverage and historical source resolution. Original E-\* receipts are
byte-identical; their milestone metadata describes their recorded revisions.

Root migration/plugin/popout/release plans, generated summaries, milestone
pages, status generators and duplicate progress notes are removed. Useful
contract content remains in feature chapters; unfinished outcomes and exact
acceptance boundaries are in topic backlogs. The full source-family story
mapping remains as catalog/AI_COVERAGE.md. Original source inventory bytes
remain under spec/evidence/migration-inventory.json, whose task fields are
historical.

Verification moves to the conventional spec/src/verification.md entrypoint so
validation and doctor agree. Partial AI/tools/Compute/backup scopes are labelled
Partial instead of Planned; the already-qualified ordinary native popup scope
uses E-POPOUT-004 rather than an obsolete pre-qualification row. No new product
acceptance is claimed. Review's planned contract moves alongside its backlog.

The public spec-validator graph is updated to Deno-free 0.2.0, using the exact
published integrity and dependency graph already consumed by Notes. The
attempted whole-root lock refresh fails on the existing unpublished app-profile
range. A tooling-only temporary install validates this slice, restoring the
exact product manifest/lock bytes afterward; it does not qualify a product
dependency cohort.

## Former milestone destinations

This one-time map accounts for every original row. Completed work maps to its
owning requirement; open parents/children may share one backlog topic. This map
is historical provenance and is not maintained as a status ledger.

| Former reference | Destination                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0.0             | [LD-GOV-006,LD-MIG-002](../verification.md)                                                                                                                                                      |
| M0.1             | [LD-GOV-001,LD-GOV-002,LD-GOV-003,LD-GOV-004,LD-GOV-005,LD-GOV-006,LD-GOV-007,LD-DESK-001,LD-DESK-002,LD-DESK-003,LD-DESK-004,LD-DESK-005,LD-MIG-001,LD-MIG-002](../verification.md)             |
| M1               | [LD-MIG-002,LD-GOV-006,LD-HOST-001](../verification.md)                                                                                                                                          |
| M2               | [LD-MIG-002,LD-VAULT-001,LD-VAULT-002,LD-VAULT-003,LD-VAULT-004,LD-VAULT-005,LD-VAULT-006](../verification.md)                                                                                   |
| M3               | [LD-MIG-002,LD-DB-001,LD-DB-002,LD-DB-003,LD-DB-004,LD-SESSION-001,LD-SESSION-002](../verification.md)                                                                                           |
| M4               | [LD-MIG-002,LD-GOV-008,LD-LIFE-001,LD-LIFE-002,LD-LIFE-003,LD-LIFE-004,LD-LIFE-005,LD-LIFE-006,LD-LIFE-007,LD-SESSION-003,LD-VAULT-007,LD-SESSION-004,LD-REC-001,LD-REC-002](../verification.md) |
| M5               | [LD-MIG-002,LD-FILE-001,LD-FILE-002,LD-FILE-003,LD-FILE-004,LD-FILE-005,LD-FILE-006,LD-FILE-007](../verification.md)                                                                             |
| M6               | [LD-MIG-002,LD-NAV-001,LD-NAV-002,LD-NAV-003,LD-NAV-004,LD-NAV-005,LD-NAV-006,LD-NAV-007,LD-NAV-008](../verification.md)                                                                         |
| M7               | [LD-MIG-002,LD-INT-001,LD-INT-002,LD-INT-003,LD-INT-004,LD-INT-005,LD-INT-006,LD-INT-007,LD-INT-008,LD-INT-009](../verification.md)                                                              |
| M7.1             | [LD-MIG-002,LD-POP-001](../verification.md)                                                                                                                                                      |
| M7.2             | [LD-MIG-002,LD-POP-002,LD-POP-003,LD-POP-004,LD-POP-006](../verification.md)                                                                                                                     |
| M7.3             | [LD-MIG-002,LD-POP-001,LD-POP-002,LD-POP-003,LD-POP-004,LD-POP-005,LD-POP-006](../verification.md)                                                                                               |
| M8               | [LD-MIG-002](../verification.md)                                                                                                                                                                 |
| M9               | [LD-MIG-002](../verification.md)                                                                                                                                                                 |
| M10              | [AI and shared-screen qualification](../backlog/ai-qualification.md)                                                                                                                             |
| M11              | [Distribution and frozen-host retirement](../backlog/distribution.md)                                                                                                                            |
| M12              | [Distribution and frozen-host retirement](../backlog/distribution.md)                                                                                                                            |
| M13              | [Deferred canonical conversation integration](../backlog/native-conversations.md)                                                                                                                |
| M13.1            | [LD-REPO-001](../verification.md)                                                                                                                                                                |
| M13.2            | [LD-REPO-002,LD-REPO-004](../verification.md)                                                                                                                                                    |
| M13.3            | [Deferred canonical conversation integration](../backlog/native-conversations.md)                                                                                                                |
| M8.0             | [LD-MIG-002,LD-CAT-001,LD-CAT-002](../verification.md)                                                                                                                                           |
| M8.1             | [LD-MIG-002,LD-PLUG-001,LD-TERM-001,LD-TERM-002,LD-TERM-003](../verification.md)                                                                                                                 |
| M8.2             | [LD-MIG-002,LD-PLUG-002](../verification.md)                                                                                                                                                     |
| M8.3             | [LD-MIG-002,LD-PLUG-003,LD-PLUG-004](../verification.md)                                                                                                                                         |
| M9.1             | [LD-MIG-002,LD-PLUG-001,LD-INSTALL-001,LD-INSTALL-002](../verification.md)                                                                                                                       |
| M10.1            | [LD-MIG-002,LD-AI-001](../verification.md)                                                                                                                                                       |
| M10.2            | [AI and shared-screen qualification](../backlog/ai-qualification.md)                                                                                                                             |
| M10.3            | [AI and shared-screen qualification](../backlog/ai-qualification.md)                                                                                                                             |
| M10.4            | [AI and shared-screen qualification](../backlog/ai-qualification.md)                                                                                                                             |
| M0.2             | [LD-GOV-002,LD-GOV-003,LD-GOV-009](../verification.md)                                                                                                                                           |
| M8.4             | [LD-GOV-002,LD-GOV-003,LD-CAT-003](../verification.md)                                                                                                                                           |
| M8.5             | [LD-CAT-001,LD-CAT-002,LD-CAT-003,LD-FILE-008](../verification.md)                                                                                                                               |
| M15.1            | [AI and shared-screen qualification](../backlog/ai-qualification.md)                                                                                                                             |
| M16.1            | [LD-GOV-006,LD-VAULT-001,LD-VAULT-002,LD-VAULT-003,LD-VAULT-004,LD-VAULT-005,LD-VAULT-006](../verification.md)                                                                                   |
| M16.2            | [LD-VAULT-002,LD-VAULT-003,LD-FILE-001,LD-FILE-003](../verification.md)                                                                                                                          |
| M16.3            | [LD-DB-001,LD-DB-002,LD-DB-003,LD-DB-004](../verification.md)                                                                                                                                    |
| M16.4            | [LD-DB-001,LD-DB-002,LD-DB-003,LD-DB-004,LD-SESSION-001,LD-NAV-004,LD-NAV-006,LD-CAT-003](../verification.md)                                                                                    |
| M16.5            | [LD-DB-001,LD-DB-002,LD-DB-003,LD-DB-004,LD-SESSION-001,LD-NAV-001,LD-NAV-002,LD-NAV-003,LD-NAV-005,LD-NAV-007,LD-NAV-008,LD-CAT-003](../verification.md)                                        |
| M16.6            | [LD-REPO-001,LD-REPO-002,LD-REPO-005,LD-CAT-003](../verification.md)                                                                                                                             |
| M16.7            | [LD-LIFE-001,LD-LIFE-004,LD-LIFE-007,LD-LIFE-008,LD-LIFE-009,LD-CAT-003](../verification.md)                                                                                                     |
| M16.8            | [LD-REPO-001,LD-REPO-002,LD-REPO-004,LD-REPO-005,LD-CAT-003](../verification.md)                                                                                                                 |
| M16.9            | [LD-TASK-001,LD-TASK-002,LD-TASK-003,LD-CAT-003](../verification.md)                                                                                                                             |
| M16.10           | [LD-AI-001,LD-AI-002,LD-AI-004,LD-AI-005,LD-AI-006,LD-AI-007,LD-CAT-003](../verification.md)                                                                                                     |
| M17.1            | [Deferred Review contract and original acceptance](../backlog/markdown-review-mode.md)                                                                                                           |
| M17.2            | [Deferred Review contract and original acceptance](../backlog/markdown-review-mode.md)                                                                                                           |
| M17.3            | [Deferred Review contract and original acceptance](../backlog/markdown-review-mode.md)                                                                                                           |
| M17.4            | [Deferred Review contract and original acceptance](../backlog/markdown-review-mode.md)                                                                                                           |
| M17.5            | [Deferred Review contract and original acceptance](../backlog/markdown-review-mode.md)                                                                                                           |
| M14              | [Provider, sync and turn-history qualification](../backlog/vault-synchronization.md)                                                                                                             |
| M14.1            | [LD-REPO-005,LD-VAULT-002](../verification.md)                                                                                                                                                   |
| M14.2            | [LD-REPO-005](../verification.md)                                                                                                                                                                |
| M14.3            | [LD-REPO-005](../verification.md)                                                                                                                                                                |
| M14.4            | [Provider, sync and turn-history qualification](../backlog/vault-synchronization.md)                                                                                                             |
| M14.5            | [Provider, sync and turn-history qualification](../backlog/vault-synchronization.md)                                                                                                             |
| M14.6            | [LD-REPO-005](../verification.md)                                                                                                                                                                |
| M14.7            | [Provider, sync and turn-history qualification](../backlog/vault-synchronization.md)                                                                                                             |
| M14.8            | [Provider, sync and turn-history qualification](../backlog/vault-synchronization.md)                                                                                                             |

## Historical paths and current authority

Old receipts may name deleted plan paths or commands. Those references describe
files at the receipt's recorded Jujutsu revision; they are not current
navigation or instructions. Evidence file validation resolves historical source
membership without changing committed receipts. Current SUMMARY and
feature/backlog links must resolve current files. Original command, failure,
scope, source/native, provider and platform distinctions remain intact.

## Validation attempts

Intermediate metadata checks exposed missing backlog navigation, fresh evidence
coverage and bounded-page budgets; those were repaired without disabling checks.
The first complete governance run passes 168 and fails three because the
temporary tooling install lacks the existing public API dependency. Installing
published API 0.1.4 for validation makes the exact targets pass 11/11; the
complete suite then passes 179/179. These are tooling/fixture tests, not product
dependency qualification. An existing one-line Rust formatting drift in the ACP
acceptance fixture blocks spec:check; rustfmt changes whitespace only and its
exact check then passes. Original fixture values and behavior are unchanged.

Doctor now passes under Node 24.10.0. Separate current/backlog semantic QMD
queries return canonical hits; immutable historical activity is outside both
collections. New verification/documentation paths are governed and linked from
SUMMARY. Original E-\* evidence remains byte-identical.

Final spec:check passes all four lanes: canonical validation, Rust formatting,
mdBook and spec-first (29 protected paths, nine owning canonical chapters). A
deleted inventory path initially lacks a source mapping; retaining its original
deletion mapping alongside the new provenance location repairs that exact gate.
All active Markdown document links resolve. Missing registry app-profile remains
an explicit distribution prerequisite, not a completed installation claim.
