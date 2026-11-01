# Tauri preview release automation

```json
{
  "id": "E-RELEASE-001",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-REL-001",
    "LD-REL-002",
    "LD-REL-003",
    "LD-REL-004",
    "LD-REL-005",
    "LD-GOV-002",
    "LD-GOV-006",
    "LD-INT-009"
  ],
  "files": [
    "scripts/release/candidate.mjs",
    "scripts/release/window-probe.swift",
    "scripts/release/smoke-installed.mjs",
    "scripts/release/select-candidate.mjs",
    "scripts/release/contract.mjs",
    "scripts/release/publish.mjs",
    "scripts/release/verify-installed.mjs",
    "scripts/release/build.mjs",
    "scripts/release/gate.mjs",
    "scripts/release/github.mjs",
    "scripts/release/verify-candidate.mjs",
    "tests/governance/release-workflow.test.mjs",
    "tests/governance/release-publication.test.mjs",
    "tests/governance/release-gates.test.mjs",
    ".github/workflows/release-desktop.yml",
    "docs/desktop-release.md",
    "package.json",
    "scripts/ci-install.mjs",
    "scripts/spec-contracts.mjs",
    "spec-validator.config.mjs",
    "src-tauri/tauri.conf.json",
    "src-tauri/tauri.preview.conf.json",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/current/desktop.md",
    "spec/src/current/integration.md",
    "spec/src/current/index.md",
    "spec/src/backlog/distribution.md",
    "spec/src/navigation/current.md",
    "README.md",
    "spec/src/verification.md",
    "spec/src/verification-notes.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "The user explicitly resumed preview distribution: Apple Silicon macOS 15+, ad-hoc signing, separate preview cask and CalVer. Preview publication is manual and protected. Stable cask and Linux archives remain available. Pinned private public exports remain recorded prerequisites; no registry-only claim is made. Ordinary bundles retain their identity and exclude e2e instrumentation.",
  "acceptanceReview": "Release tooling regressions pass. Original full hosted native acceptance and installed ordinary-release qualification remain required before publication. Existing RC quarantines are carried into release notes without being reported as passing. Stable cutover remains separately approved.",
  "runs": [
    {
      "name": "Initial release regression attempt",
      "command": "node --test tests/governance/release-*.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Release regression correction",
      "command": "node --test tests/governance/release-*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "External native probe typecheck",
      "command": "swiftc -typecheck scripts/release/window-probe.swift",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Pinned prerequisite regression",
      "command": "node --test tests/governance/ci-prerequisites.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance tests",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Initial specification validation",
      "command": "spec-validator validate",
      "result": "fail",
      "failures": 5
    },
    {
      "name": "GitHub workflow lint",
      "command": "actionlint .github/workflows/release-desktop.yml",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete specification check after bounded-page fixes",
      "command": "spec-validator check --base 260a21d00948b056b575fa7910e6ca2edad1948e --head @",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.0",
    "app": "2026.31.6-rc.1",
    "tapSource": "971d0793f9de1f8d124e74cf7a128491c30597b7",
    "releaseRegressionPasses": 11,
    "prerequisiteRegressionPasses": 7,
    "governancePasses": 226,
    "specificationRequirements": 121,
    "specificationChapters": 434,
    "specificationLanes": 4
  },
  "remaining": [
    "Hosted final-head Desktop CI and native release packaging/installation are pending.",
    "Protected publication approval follows review of the actual qualified candidate.",
    "First preview upgrade is not run until a previous different preview exists."
  ]
}
```

The initial regression attempt exposed a malformed YAML insertion (8 passing
tests, 1 failing test file). It was corrected without weakening the publication
guards.

Tap compatibility PR #6 merged after all four checks passed: Tap checks and
native installation on macOS ARM64, Linux ARM64 and Linux x64. Desktop bot
credentials and the main-only protected release environment are configured; the
temporary key-verification installation token was revoked. No preview has been
published.
