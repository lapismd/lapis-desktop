# Authorized plugin delivery

The user resumed the current slice followed by all M8–M10 stages on 2026-10-17.
This records scope and ordering; it claims no plugin runtime gate. M7.2 is
committed and qualified separately. M7.3 ordinary popup admission remains
planned and is not substituted by plugin acceptance.

```json
{
  "id": "E-PLUGINS-003",
  "tasks": [
    "M8",
    "M9",
    "M10",
    "M8.0",
    "M8.1",
    "M8.2",
    "M8.3",
    "M9.1",
    "M10.1",
    "M10.2",
    "M10.3",
    "M10.4"
  ],
  "requirements": [
    "LD-MIG-002",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-PLUG-001",
    "LD-TERM-001",
    "LD-TERM-002",
    "LD-TERM-003",
    "LD-PLUG-002",
    "LD-PLUG-003",
    "LD-PLUG-004",
    "LD-INSTALL-001",
    "LD-INSTALL-002",
    "LD-AI-001",
    "LD-AI-002",
    "LD-AI-003",
    "LD-AI-004",
    "LD-COMP-001"
  ],
  "revision": "enclosing-change",
  "files": [
    "PLAN.md",
    "PLUGIN_MIGRATION.md",
    "AI_ACP_REFERENCE.md",
    "MIGRATION.md",
    "scripts/spec-contracts.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/index.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLUGINS-003.md",
    "scripts/progress-model.mjs",
    "tests/governance/progress.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "status-before",
      "command": "node --test --test-name-pattern=\"migration summary separates\" tests/governance/progress.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "status-after",
      "command": "node --test --test-name-pattern=\"migration summary separates\" tests/governance/progress.test.mjs",
      "result": "pass",
      "passed": 1,
      "failures": 0
    },
    {
      "name": "governance",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "passed": 27,
      "failures": 0
    },
    {
      "name": "projection-initial",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "The initial generated summary preceded formatting the detailed task table. Regenerated from the final canonical table and formatted again."
    },
    {
      "name": "verification-table-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 16,
      "note": "A blank line separated the new verification rows from their Markdown table. Join them to the governed table; requirement and verification coverage remains fail-closed."
    },
    {
      "name": "scope",
      "command": "pnpm check:progress && pnpm spec:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "verification-table-repair-attempt",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 15,
      "note": "The initial formatter had already reflowed the disconnected rows into prose. Regenerated all 16 rows from the committed parent and joined them into the table; final validation passes."
    },
    {
      "name": "gate-preservation",
      "command": "Compare parsed milestone gates against Jujutsu parent",
      "result": "pass",
      "passed": 17,
      "failures": 0
    }
  ],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "platform": "macOS ARM64"
  },
  "contractReview": "The full saved plugin sequence remains in scope, including dynamic signed packages, direct ACP, native app tools and optional compute. Distribution signing and publication remain deferred.",
  "milestoneReview": "M8 begins at Stage 0; M9 and M10 become Planned, with their original aggregate gates unchanged. Detailed tasks retain independent evidence. Scope authorization does not complete any product milestone."
}
```

Local `lapis-terminal` is clean at `d7e0a7cd`; it already owns a public rendered
viewport, injectable client, Tauri transport and native host policy. Its
existing JavaScript checks, tests and public build pass before integration.
Local `lapis-ai` is clean at `cf59a8fa`; its specification declares the Tauri
adapter as future work, so M10.1 must implement and qualify that boundary.

The old standalone Terminal source is read-only for handover; its working copy
contains unrelated manifest/lock changes. Preserve those changes. Desktop owns
the new plugin, while reusable defects belong to the native libraries. Preserve
licenses, source attribution, data identities and applicable story coverage.

Prefer local public-package links/builds and Rust path dependencies over making
releases. Tracked publishable JavaScript dependency declarations stay portable;
ignored overlays may select local public outputs. Commit without a signature
only if configured signing fails. Publication, service installation and
application signing remain outside this scheduling change.
