# E-SKILL-003 — Current-main released native skill intake

```json
{
  "id": "E-SKILL-003",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SKILL-001", "LD-GOV-006", "LD-GOV-008"],
  "files": [
    ".github/workflows/ci.yml",
    ".gitignore",
    "config/dependency-audit.json",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/ci-sources.json",
    "scripts/ci/commands.mjs",
    "scripts/prepare-bundled-skills.mjs",
    "scripts/source-audit.mjs",
    "scripts/spec-contracts.mjs",
    "scripts/validation/lanes.json",
    "spec/src/backlog/distribution.md",
    "spec/src/current/ai.md",
    "spec/src/current/ci.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/skills.md",
    "spec/src/history/E-CI-102.md",
    "spec/src/history/E-CI-103.md",
    "spec/src/history/E-SKILL-001.md",
    "spec/src/history/E-SKILL-002.md",
    "spec/src/history/E-SKILL-003.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "spec/src/verification/ci.md",
    "spec/src/verification/skills.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/host/vault/skills.rs",
    "src-tauri/tauri.conf.json",
    "src/components/ai/plugin/register-commands.ts",
    "src/lib/ai/skills/seed.ts",
    "src/lib/native/skill-management.ts",
    "src/lib/notes/notes-session.ts",
    "tests/ai/skills/seed.test.ts",
    "tests/governance/ci-selection-commands.test.mjs",
    "tests/renderer/skill-management.test.mjs"
  ],
  "versions": {
    "desktop": "2026.31.6-rc.2",
    "server": "v2.4.0 / 83fca8ddd25b7b7913723e231779862f94f7dbcb",
    "validator": "0.2.1"
  },
  "contractReview": "Use admitted main-window native skill management, verified public package resources, protected receipts and normal registry ranges. Preserve current Sync source projections until their separate release boundary.",
  "acceptanceReview": "Current-main Docker checks and all 794 renderer/governance, 746 AI and 290 native cases pass. Two native subprocess helpers remain ignored. Ordinary/e2e strict Clippy, the production renderer build and revised exact audit policy pass. The complete cold catalog run and final specification lane remain running at publication; fresh hosted qualification is required before merge. This does not qualify installed-app/native-window or preview distribution.",
  "remaining": [
    "Complete cold catalog and final specification lanes; preserve any failure as a gate.",
    "Require a fresh full CI run including ordinary native bundle and both Linux binaries before merge.",
    "Preview version/publication and native distribution acceptance remain separate."
  ],
  "runs": [
    {
      "name": "current-main-Docker-types",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/skill-main-prerequisites-20261117/archives.json pnpm check:types",
      "result": "pass",
      "failures": 0,
      "detail": "Zero errors/warnings; eight prerequisite archive identities verified."
    },
    {
      "name": "current-main-governance",
      "command": "pnpm validation:check with explicit verified archives",
      "result": "pass",
      "failures": 0,
      "detail": "96 passed, zero skipped."
    },
    {
      "name": "current-main-native-clippy",
      "command": "pnpm validation run check:rust with explicit verified archives",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "initial-full-check",
      "command": "pnpm check with explicit verified archives",
      "result": "fail",
      "failures": 2,
      "detail": "Evidence metadata absent; verification page 33021 bytes exceeds 32768."
    },
    {
      "name": "evidence-revision-recheck",
      "command": "pnpm check with explicit verified archives",
      "result": "fail",
      "failures": 2,
      "detail": "Pending proposal receipt metadata differed from its unpublished parent; restoring main local-dependency policy needed explicit fresh receipt coverage. Move metadata into proposal creation and cover both parent/main changes in this fresh record."
    },
    {
      "name": "full-check-format-findings",
      "command": "pnpm check with explicit verified archives",
      "result": "fail",
      "failures": 3,
      "detail": "All 7 spec validators, types, ordinary/e2e strict Clippy pass; Prettier flags merged distribution/files paragraphs and the Tauri resource list. Repair formatting within unchanged page limits."
    },
    {
      "name": "complete-check",
      "command": "pnpm check with explicit verified archives",
      "result": "pass",
      "failures": 0,
      "detail": "Specification, zero-warning types, ordinary/e2e Clippy, composition and formatting pass."
    },
    {
      "name": "complete-test",
      "command": "pnpm test with explicit verified archives",
      "result": "pass",
      "failures": 0,
      "detail": "794 renderer/governance, 746 AI and 290 native cases pass; two native subprocess helpers ignored."
    },
    {
      "name": "renderer-build",
      "command": "pnpm build with explicit verified archives",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "audit-stale-exception",
      "command": "runAudit in owned Docker worker against its exact installed projection",
      "result": "fail",
      "failures": 1,
      "detail": "GitHub withdrew deepmerge GHSA-gcqx-w48m-w2h4 on 2026-11-16 at 18:55:38Z. Reports no longer include it; remove this stale exception per the existing fail-closed policy."
    },
    {
      "name": "current-audit-policy",
      "command": "auditFindings in the owned Docker worker with its actual audit reports and the tracked candidate policy over stdin; unchanged auditor SHA-256 verified",
      "result": "pass",
      "failures": 0,
      "detail": "Zero production findings; two existing approved development findings; stale withdrawn deepmerge exception removed."
    },
    {
      "name": "audit-regression",
      "command": "node --test tests/governance/ci-audit.test.mjs in the owned Docker worker",
      "result": "pass",
      "failures": 0,
      "detail": "5 passed; expiry, changed-path, production, new-advisory and stale-policy checks remain fatal."
    }
  ]
}
```

Requirements: LD-SKILL-001, LD-GOV-006, LD-GOV-008.

## Exact source and baseline

PR32 still points at 1e33082 and conflicts with Desktop main. Its latest
Quality, Unit and both Native Linux reruns stop before executing checks: they
request ci-tools-2, absent from the old run's retained attempt-one artifacts.
This is an infrastructure prerequisite failure, not evidence of new test
assertions failing. A complete fresh CI run is required after the branch
refresh.

Rebase the skill changes onto current Desktop main
9805eff8882eead854c3df2c46a29d724077c137, preserving Sync, remotes,
artifact-role validation, source hashes, private prerequisite handling and
published ranges. Resolve overlapping evidence at its topic boundaries without
dropping current requirements or raising the 400-line page limit.

Core, Protocol and Content HTTP use the actual released Server v2.4.0 source
83fca8ddd25b7b7913723e231779862f94f7dbcb. All three Cargo pins, Cargo.lock and
hosted source inventory agree. Retain main's JJ Store
086def182eae2ab6e5dc39aba030390d7ea8612c and independent fixture pins.

## Package intake and temporary public-build inputs

Published Markdown ^0.3.3 includes five supporting references. Bases ^0.4.1
retains its packaged references. Update spec-validator to the latest Deno-free
0.2.1 before checks. Manifests and the registry lock contain no local protocols;
the lock refresh temporarily omits the two unpublished root prerequisites and
restores the actual manifest in a finally block, following existing policy.

The older E-SKILL-002 projection-retirement proposal is superseded by current
main's native Sync source cohort: its six Notes packages, Tasks and AI still
require the documented temporary public-build projection. Do not discard these
source changes merely because an older registry profile is public. Canonical
local dependency policy remains main's contract; no new source alias or copied
implementation is introduced by this skill intake.

For local Docker acceptance, download private-packages-linux-x64-1 from the
successful immutable main CI run 43846630539 (source 9805eff8). Verify every
package SHA-256, size and exact source commit against the unchanged prerequisite
pins, retaining the original artifact manifest/provenance. Supply only its eight
dependency-role archives through LAPIS_DESKTOP_VALIDATION_ARCHIVES; the separate
native-fixture Tasks entry is not a replacement JavaScript dependency. The Core
revision changes independently of these unchanged package source identities. The
older prepared consumer lock is not reused; the worker computes a new projection
from this candidate's portable manifest and registry lock.

## Remaining qualification

Docker type and governance checks are running on this exact candidate. Ordinary
and e2e native checks, relevant renderer/AI tests, build, specification/audit,
complete catalog interaction/accessibility and native Linux CI remain gates. The
old PR's green catalog results are historical, not acceptance of this new source
cohort. No native macOS acceptance is inferred or requested.

The complete check/test/build lanes pass. An audit-policy follow-up removes only
the stale deepmerge exception after official GitHub withdrawal; no dependency
version, severity threshold or production exception is added. Other accepted
development-only findings remain constrained by the existing exact-path policy.

The candidate audit policy passes against the actual Docker projection reports:
zero production advisories, two existing approved development-only findings. The
five strict auditor regressions pass unchanged. Cold catalog and fresh hosted CI
remain merge gates; no source/data assertion or quarantine is weakened.
