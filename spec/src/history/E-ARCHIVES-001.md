# E-ARCHIVES-001: workspace peer archive verification

This tooling slice qualifies the archive cohort used for pending Markdown
preview integration. It does not complete the M4 application gate.

```json
{
  "id": "E-ARCHIVES-001",
  "tasks": ["M4"],
  "requirements": ["LD-GOV-006", "LD-GOV-008"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "specValidator": "0.1.4"
  },
  "files": [
    "MIGRATION.md",
    "scripts/archive-resolution.mjs",
    "scripts/local-archives.mjs",
    "tests/governance/local-archives.test.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-ARCHIVES-001.md",
    "spec/src/history/index.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "before-workspace-peer-target",
      "command": "node --test tests/governance/local-archives.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 4,
        "total": 6
      },
      "note": "Peer-only consumers receive no local archive dependency, and no workspace import-route verifier exists. The real Markdown target subsequently reports seven missing-constructor failures because its package-local peer still resolves the registry API."
    },
    {
      "name": "initial-import-verifier-attempts",
      "command": "installLocalArchives(pluginWorkspace, sourceManifest)",
      "result": "fail",
      "failures": 3,
      "note": "Physical-path identity incorrectly rejects valid TypeScript peer contexts; a filename-based retry encounters pnpm's truncated store names; the initial payload fingerprint also includes generated dependency bin shims. These attempts do not qualify installation. Verification now compares installed payload bytes with the checksum-verified tarball, preserving bundled dependency payloads when present."
    },
    {
      "name": "generated-shim-regression-before",
      "command": "node --test tests/governance/local-archives.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "An installed dependency shim absent from the packed payload must not count as modified package source."
    },
    {
      "name": "after-workspace-peer-and-payload-target",
      "command": "node --test tests/governance/local-archives.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tests": 6
      },
      "note": "Peer ranges stay unchanged, install-only dependencies select the verified archives, registry copies and changed payloads reject, valid peer contexts and pnpm-generated shims pass, and dependency-file restoration remains covered."
    },
    {
      "name": "real-installed-payload-verification",
      "command": "readArchiveManifest; pnpm list --recursive --depth -1 --json; verifyArchiveResolution",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 9,
        "importRoutes": 28
      },
      "note": "The active first-party plugin workspace's root and package-local peer payloads match their verified source tarballs. No node_modules edit, dependency patch or source alias is used."
    },
    {
      "name": "governance-check-before-record",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "The fail-closed progress gate requires fresh evidence coverage before checking the new installer. This new record supplies that coverage."
    },
    {
      "name": "final-source-and-governance",
      "command": "pnpm check; pnpm test; pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodeTests": 32,
        "rustTests": 34,
        "ignoredSubprocessHelpers": 2,
        "specificationLanes": 4
      },
      "note": "Complete check, test and specification lanes pass; final progress/format checks verify the completed tooling record. Original milestone gates/statuses remain unchanged."
    },
    {
      "name": "final-local-install",
      "command": "installLocalArchives(pluginWorkspace, sourceManifest)",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 9,
        "importRoutes": 28
      },
      "note": "The canonical installer succeeds and records the receipt after payload verification. Tracked registry dependency files remain byte-for-byte preserved."
    },
    {
      "name": "generated-summary-format-first-attempt",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Generated MIGRATION.md needs the repository formatter. Its exact format lane passes after formatting; the final complete check passes."
    }
  ],
  "contractReview": "Peer semver contracts and tracked registry manifests/lockfiles remain portable. Validation covers actual workspace imports and packed bytes, rather than assuming a successful root install qualifies package-local peers.",
  "milestoneReview": "M4 remains In progress under its original application gate. This tooling component does not qualify editable previews, complete writer coverage or native lifecycle behavior. LD-LIFE-004 and LD-LIFE-007 remain Planned; no completedGates.M4 is introduced."
}
```
