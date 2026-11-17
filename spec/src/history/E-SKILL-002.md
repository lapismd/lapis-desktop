# E-SKILL-002 — Public profile and skill release intake

```json
{
  "id": "E-SKILL-002",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SKILL-001", "LD-GOV-006", "LD-GOV-008"],
  "files": [
    ".github/workflows/ci.yml",
    ".gitignore",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/ci/commands.mjs",
    "scripts/ci-sources.json",
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
    "spec/src/current/skills.md",
    "spec/src/history/E-CI-102.md",
    "spec/src/history/E-CI-103.md",
    "spec/src/history/E-SKILL-001.md",
    "spec/src/history/E-SKILL-002.md",
    "spec/src/history/E-SKILL-003.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification/ci.md",
    "spec/src/verification/skills.md",
    "spec/src/verification.md",
    "src/components/ai/plugin/register-commands.ts",
    "src/lib/ai/skills/seed.ts",
    "src/lib/native/skill-management.ts",
    "src/lib/notes/notes-session.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/host/vault/skills.rs",
    "src-tauri/tauri.conf.json",
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
  "acceptanceReview": "Source and release-input qualification remain distinct. Earlier projection-retirement proposal is superseded by E-SKILL-003. Exact current-main Docker types and 96 governance cases pass; strict ordinary native Clippy passes. The initial full check reports missing receipt metadata and the verification page byte limit; subsequent complete gates remain required.",
  "remaining": [
    "Complete normal/e2e native and renderer/AI checks, build and catalog lanes on current source.",
    "Require fresh exact-head CI and native/distribution acceptance before release."
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
    }
  ]
}
```

Requirements: LD-GOV-006, LD-GOV-008, LD-SKILL-001.

## Contract and reproduction

Desktop must consume App Profile ^0.2.1 / API ^0.6.5 and packaged skill
resources through public built registry exports. The normal CI installer must
preserve the profile's registry range, build no private Notes profile and retain
the separate private AI prerequisite. Existing native/fixture pins remain
separate gates.

The exact regression is
`node --test --test-name-pattern='public application profile' tests/governance/validation.test.mjs`.
Before retiring the projection, it fails 1/1 because the public profile range
becomes a private archive path. The private AI projection and rejection of
invalid private ranges remain tested.

## Candidate and acceptance limits

The skills stack is rebased on Desktop main 1717bbe3. Conflict resolution
retains both existing rc.2 CLI qualification and the skill history/backlog. New
registry floors use the compatible Notes/Plugins/Mira cohort. Tracked ranges
stay portable; no source aliases or dependency patches are added.

Registry lock resolution, complete Docker functional/catalog/native checks, Core
pin adoption after Server merge and distribution remain pending. Native macOS
lanes stay on demand. No installed app or user profile is replaced.
