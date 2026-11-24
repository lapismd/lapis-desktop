# Linux preview startup resource omission

```json
{
  "id": "E-RELEASE-028",
  "date": "2026-11-24",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-REL-002", "LD-REL-003", "LD-REL-006"],
  "files": [
    ".changeset/linux-startup-skills.md",
    "scripts/release/build-linux.mjs",
    "scripts/release/verify-linux.mjs",
    "tests/governance/release-linux.test.mjs",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/verification.md",
    "spec/src/backlog.md",
    "spec/src/navigation/history-01.md",
    "spec/src/history/E-RELEASE-028.md"
  ],
  "versions": {
    "source": "245924d93227c12e14abc9fc12742d78b6b120ab",
    "failedCandidate": "45483877596",
    "validator": "0.2.1",
    "privateAi": "9a98293c26524c9320acdd9767e34e8ffdd7170c"
  },
  "contractReview": "Linux must retain every mandatory startup resource independently of its self-inventory; preserve immutable candidate bytes and native qualification gates.",
  "acceptanceReview": "Both original native checks fail ENOENT before a window. The archive omits the skills resource read during setup. The exact synthetic omission regression fails before repair and passes after. Repaired verifier also rejects the actual downloaded failed archive. Fresh native qualification remains pending.",
  "runs": [
    {
      "name": "Omission before",
      "command": "node --test --test-name-pattern='omits the startup skills resource' tests/governance/release-linux.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Omission after",
      "command": "node --test --test-name-pattern='omits the startup skills resource' tests/governance/release-linux.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 1
    },
    {
      "name": "Release contract suite",
      "command": "node --test tests/governance/release-*.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 42
    },
    {
      "name": "Initial isolated check missing archive",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Isolated check without explicit base",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/linux-startup-validation-archives.json pnpm check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Documentation line limit before split",
      "command": "LAPIS_DESKTOP_BASE=245924d93227c12e14abc9fc12742d78b6b120ab LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/linux-startup-validation-archives.json pnpm check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Moved backlog link before correction",
      "command": "pnpm check (same isolated archive and base)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Backlog formatting before correction",
      "command": "pnpm check (same isolated archive and base)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Formatting",
      "command": "LAPIS_DESKTOP_BASE=245924d93227c12e14abc9fc12742d78b6b120ab LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/linux-startup-validation-archives.json pnpm format:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Full checks",
      "command": "LAPIS_DESKTOP_BASE=245924d93227c12e14abc9fc12742d78b6b120ab LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/linux-startup-validation-archives.json pnpm check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Full tests",
      "command": "LAPIS_DESKTOP_BASE=245924d93227c12e14abc9fc12742d78b6b120ab LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/linux-startup-validation-archives.json pnpm test",
      "result": "pass",
      "failures": 0,
      "passed": 2015,
      "ignored": 2
    },
    {
      "name": "Production renderer",
      "command": "LAPIS_DESKTOP_BASE=245924d93227c12e14abc9fc12742d78b6b120ab LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/linux-startup-validation-archives.json pnpm build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Specification",
      "command": "LAPIS_DESKTOP_BASE=245924d93227c12e14abc9fc12742d78b6b120ab LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/linux-startup-validation-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0
    }
  ],
  "remaining": [
    "Fresh exact-source CI and both actual native candidate installation receipts before publication."
  ]
}
```

Requirements: LD-REL-002, LD-REL-003, LD-REL-006.

## Failed release attempts

Source `245924d93227c12e14abc9fc12742d78b6b120ab` passed full CI
[45470046451](https://github.com/lapismd/lapis-desktop/actions/runs/45470046451).
Preparation
[45480312802](https://github.com/lapismd/lapis-desktop/actions/runs/45480312802)
built both Linux archives; GitHub cancelled the macOS job without assigning a
runner after reporting hosted ARM64 capacity constraints. One explicit clean
recovery
[45483877596](https://github.com/lapismd/lapis-desktop/actions/runs/45483877596)
built all three archives and assembled the complete candidate. Both unchanged
native Homebrew checks then failed: the installed application exited 101 before
presenting its window, with setup-hook ENOENT. Nothing was published.

The downloaded x64 artifact's tar inventory omits `bundled-skills.json`.
`host/vault/skills.rs::bundled` unconditionally reads that file beneath Tauri's
resource directory during setup. macOS Tauri packaging includes the declared
resource; Linux's manual packager copied only the AI and CLI directories. The
verifier checked the inventory against itself, allowing an intact inventory with
a missing mandatory startup resource.

## Regression and repair

Before editing production, ran:

```sh
node --test --test-name-pattern='omits the startup skills resource' tests/governance/release-linux.test.mjs
```

One failure: missing expected exception. The fixture's inventory is internally
consistent, reproducing the incomplete archive's admission. Linux packaging now
copies the generated skills file to its actual Tauri resource root; verification
requires that regular file independently of the inventory. Existing identity,
CLI provenance, checksums, permissions and native smoke assertions remain.

After repair the exact regression passes: 1 pass, 0 failures. All release
contract tests pass: 42 passes, 0 failures. Full isolated check, test (973
governance/renderer + 749 AI + 293 Rust; two existing Rust ignores), production
build and all five specification lanes pass. The initial isolated attempts
retained failures for missing archive/base inputs, a 409-line backlog entry, its
moved relative link and formatting; all corrected.

The Changeset requests the next reviewed preview version. Failed rc.3 archives
and workflow attempts remain immutable. Fresh full source CI and actual native
Homebrew installation/window/quit/data-retention receipts remain required before
publication. No macOS runtime qualification is inferred from its build.
