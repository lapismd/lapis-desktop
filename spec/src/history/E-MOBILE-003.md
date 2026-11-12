# Mobile layout integration on current main

```json
{
  "id": "E-MOBILE-003",
  "requirements": ["LD-SESSION-005", "LD-AI-002", "LD-HOST-001", "LD-GOV-008"],
  "revision": "enclosing-change",
  "versions": {
    "desktop": "2026.31.6-rc.1",
    "coreRegistry": "0.12.4",
    "coreRange": "^0.12.1",
    "sourceQualification": "46dae9b5e7bee31fe1d86e40c4a0975370dcfba4"
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/plugins/Workspace.stories.ts",
    "catalog/plugins/ai/Addressing.stories.ts",
    "catalog/support/NotesDemo.svelte",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/spec-contracts.mjs",
    "spec/src/backlog.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/mobile-layout.md",
    "spec/src/current/plugins.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "src/components/views/NotesWorkspace.svelte"
  ],
  "result": "pending",
  "remaining": [
    "Release and adopt the Core public mobile contracts and Notes workspace bindings.",
    "Run fresh hosted consumer qualification before merge. Native-window acceptance remains separate."
  ],
  "runs": [
    {
      "name": "original-responsive",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/Workspace.stories.ts -t 'Responsive Layout'",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 4
      },
      "note": "Original isolated source/archive cohort; not a registry-only or rebased-main result."
    },
    {
      "name": "original-catalog-attempt",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 1983,
        "failed": 1,
        "unrun": 148
      },
      "note": "Independent Participants lacked sent-draft acknowledgement before the next prompt."
    },
    {
      "name": "original-catalog-repair",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- --shard=4/4",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 592
      },
      "note": "With unchanged shards 1\u20133, complete original coverage is 2,132 cases. All 20 Addressing family cases also pass."
    },
    {
      "name": "integration-spec-first",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Nine protected paths and seven canonical chapters covered."
    },
    {
      "name": "integration-spec-before",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Adding the mobile cross-reference exceeded desktop.md byte budget. Compact navigation references preserve the current main contract and repair the budget."
    },
    {
      "name": "source-boundaries",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "integration-spec-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Seven validators, 502 chapters and 127 requirements pass against main b28836dc."
    }
  ],
  "contractReview": "Remove the production display-mode override; fixture preferences remain deterministic while the responsive story follows real App settings and root sizes. Preserve current main CI, native code, dependency policy, audit exceptions and navigation. The existing global Core override moves with the authorized root range to a released registry version.",
  "acceptanceReview": "The earlier source/archive evidence remains immutable in the original isolated source commits. This fresh record covers the separate integration onto current main b28836dc. It does not carry the six unrelated default-workspace edits or claim that the prior accepted audit findings describe current main. Dependency publication and registry adoption are explicit prerequisites; no native window or installed application was exercised."
}
```

Core PR: https://github.com/lapismd/design-core/pull/74. Notes PR:
https://github.com/lapismd/lapis-notes/pull/95. The latter currently fails two
hosted type diagnostics because released Core does not yet expose
`mobileNavigation` and `mobileSearchAction`. Consumer PRs remain draft until
their owning package releases are available.

Original source qualification is retained in the original isolated Desktop
commit and its E-MOBILE-001/002 receipts. This integration uses current main
navigation fragments rather than recreating its removed history index. Failed
attempts remain in their original records. Current package/lock changes preserve
all other mainline ranges and the existing Bits UI patch; the
unpublished-package projection used only to regenerate the portable registry
lock is restored immediately afterward.
