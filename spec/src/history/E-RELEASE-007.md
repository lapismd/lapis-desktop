# Affected CI gates and Rust dependency caching

```json
{
  "id": "E-RELEASE-007",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CI-001", "LD-CI-002", "LD-CI-003", "LD-CI-004"],
  "files": [
    ".github/ci-docs/package.json",
    ".github/ci-docs/pnpm-lock.yaml",
    ".github/workflows/ci.yml",
    ".github/workflows/release-desktop.yml",
    "docs/desktop-release.md",
    "package.json",
    "scripts/ci/commands.mjs",
    "scripts/ci/docs-setup.mjs",
    "scripts/ci/docs.mjs",
    "scripts/ci/impact.mjs",
    "scripts/ci/plan.mjs",
    "scripts/ci/run-selected.mjs",
    "scripts/ci/validate-results.mjs",
    "scripts/release/candidate.mjs",
    "scripts/release/gate.mjs",
    "scripts/release/publish.mjs",
    "scripts/release/source-ci.mjs",
    "scripts/spec-contracts.mjs",
    "spec/src/backlog/distribution.md",
    "spec/src/current/ci.md",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "spec-validator.config.mjs",
    "tests/desktop/startup-progress.test.mjs",
    "tests/governance/ci-catalog-shards.test.mjs",
    "tests/governance/ci-selection-commands.test.mjs",
    "tests/governance/ci-selection-workflow.test.mjs",
    "tests/governance/ci-selection.test.mjs",
    "tests/governance/native-lane-defaults.test.mjs",
    "tests/governance/release-gates.test.mjs",
    "tests/governance/release-publication.test.mjs",
    "turbo.json"
  ],
  "contractReview": "Maintainer requested dependency-aware selective gates and build caching before the next push. Docs must not build app/native helpers. Known changes select complete impacted families and downstream native consumers; unknown/shared controls fail closed to full. Preserve required Validate and all selected shard checks.",
  "acceptanceReview": "Require focused planner/aggregate/cache regressions, locked minimal docs toolchain validation, source/spec/evidence/style checks and hosted full CI on this CI-control change. Full exact-source release qualification remains separate from selective CI success. Caches reuse build dependencies and never count skipped tests as passing.",
  "runs": [
    {
      "name": "Before wiring, workflow selection/cache guards failed and a selective docs-green release was incorrectly accepted: 3 regressions failed.",
      "command": "node --test tests/governance/ci-selection-workflow.test.mjs tests/governance/release-gates.test.mjs",
      "result": "fail",
      "failures": 3
    },
    {
      "name": "Affected selection/command/workflow, release provenance and existing catalog gates:31passed, zero failed or skipped. Source audit and actionlint pass.",
      "command": "node --test tests/governance/ci-selection*.test.mjs tests/governance/release-*.test.mjs tests/governance/ci-catalog-shards.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance run241passed/1failed on the old unconditional CI command expectation; updated it to require the hosted-only selector plus full Docker fallback.",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Targeted follow-up exposed the exact native-selector inventory needing the CI-only dispatcher entry; retained both hosted/native preconditions.",
      "command": "node --test tests/governance/native-lane-defaults.test.mjs tests/governance/ci-selection*.test.mjs tests/governance/release-gates.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Native-default, selector and release-source guards:20passed,0failed/0skipped.",
      "command": "node --test tests/governance/native-lane-defaults.test.mjs tests/governance/ci-selection*.test.mjs tests/governance/release-gates.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Fresh minimal docs installation resolved only26published packages in488ms; validation correctly refused a newly modified native-selector test absent from fresh evidence. Added its coverage before retry. No app or helper build occurred.",
      "command": "node scripts/ci/docs-setup.mjs && node scripts/ci/docs.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Full governance after CI integration:242passed,0failed/0skipped.",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Minimal docs retry reached semantic validation and rejected oversized LD-CI-001 (5sentences/90words); split selection and aggregate policy into separate requirements.",
      "command": "node scripts/ci/docs.mjs",
      "result": "fail",
      "failures": 2
    },
    {
      "name": "Docker spec invocation stopped before validation because the local Docker daemon socket was unavailable; no host fallback.",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Fresh docs workspace with26published tool dependencies passed formatting,7specvalidators (441chapters/126requirements),mdBook and spec-first (42protectedfiles/4chapters); no private app package or helper build. Native-host docs-only tooling probe, not Docker product parity.",
      "command": "LAPIS_DESKTOP_BASE=b5a255bb LAPIS_DESKTOP_HEAD=@- node scripts/ci/docs.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker daemon restored; all4isolated spec lanes pass (validate,rust-format,mdbook,spec-first).",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "hostedNode": "24.22.1"
  },
  "remaining": [
    "Hosted full CI must validate this CI-control change; first cache save is cold and cache speedups are not yet measured.",
    "Full exact-main native/feature qualification and all3packaged Homebrew installs remain required before preview publication.",
    "lapis-plugin-docs source/release work is excluded by maintainer request; its existing pinned dependency remains unchanged."
  ]
}
```
