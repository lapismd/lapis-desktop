# Native metadata navigation

Existing Markdown panels and Search handoffs in the actual native workspace.

```json
{
  "id": "E-NAV-001",
  "tasks": ["M6"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-MIG-002",
    "LD-NAV-003",
    "LD-NAV-004",
    "LD-NAV-005",
    "LD-NAV-008"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "files": [
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/navigation.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/index.md",
    "spec/src/history/E-NAV-001.md",
    "tests/desktop/navigation-metadata.test.mjs",
    "MIGRATION.md"
  ],
  "result": "pending",
  "remaining": [
    "Complete global/local Graph, its settings writer and remaining M6 qualification.",
    "Complete M7 implementation then every deferred full source/Storybook/axe/web/Desktop/ordinary-bundle lane and original M4–M7 gate."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-metadata-baseline",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-search.test.mjs tests/desktop/settings-persistence.test.mjs tests/desktop/plugin-persistence.test.mjs tests/desktop/navigation-metadata.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 8
      },
      "note": "New Outline cursor probe uses browser-global typing after DOM focus and changes no note bytes. Route typing through the actual contenteditable element. All Properties intentionally emits a property-presence query without a colon; correct that fixture expectation to the existing contract. Eight affected Search/settings/plugin cases pass."
    },
    {
      "name": "native-metadata-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-metadata.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      },
      "note": "Corrected input delivery and canonical property-presence query qualify actual Outline insertion/undo at source position, linked panel navigation, external edits/rename/delete, properties/tags refresh and cold restored panels."
    },
    {
      "name": "native-metadata-complete",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-metadata.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 4
      },
      "note": "Add and pass disabled/re-enabled Search handoffs and ordinary reading-view internal-link navigation. Verify the final active file in the persisted native workspace. All previous metadata cases still pass."
    },
    {
      "name": "desktop-specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanes": 4
      },
      "note": "Canonical validation, source/App audits, progress, Rust formatting, mdBook and spec-first pass. M4–M7 aggregate and full source/consumer/native lanes remain deferred."
    }
  ],
  "contractReview": "Use existing registered Markdown views and Search commands with the owning native App, indexed metadata and saved layout. Native acceptance adds no component replacement or product hook. Preserve original M6 and full qualification gates.",
  "milestoneReview": "Metadata navigation is a component of M6; Search/settings evidence and a metadata intake attempt do not complete it. Keep Graph and every original end-of-M7 gate explicit."
}
```
