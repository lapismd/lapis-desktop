# Search settings native recovery

Source-owned repair and actual Search controls; remaining M6 gates stay open.

```json
{
  "id": "E-SEARCH-002",
  "tasks": ["M6"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-MIG-002",
    "LD-NAV-007",
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
    "spec/src/current/navigation.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/writer-audit.md",
    "spec/src/history/E-SEARCH-002.md",
    "spec/src/history/index.md",
    "tests/desktop/navigation-search-settings.test.mjs",
    "MIGRATION.md",
    "spec/src/current/migration.md",
    "spec/src/current/verification.md"
  ],
  "result": "pending",
  "remaining": [
    "Complete global/local Graph, its settings writer and remaining M6 qualification.",
    "Complete M7 implementation and all deferred full M4–M7 source, Storybook/axe, web, Desktop and ordinary-bundle gates."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-selector-fixture",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-search-settings.test.mjs",
      "result": "fail",
      "failures": 3,
      "note": "Compound WDIO text syntax was incorrectly passed as CSS. Scope the existing label query from the public Search host."
    },
    {
      "name": "native-baseline",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-search-settings.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 2
      },
      "note": "Close/restart and permission failure protection pass. Use disk version leaves mounted Search controls stale."
    },
    {
      "name": "source-dom-fixture",
      "command": "pnpm --filter @lapis-notes/search exec vitest run src/lib/search-settings-recovery.test.ts",
      "result": "fail",
      "failures": 2,
      "note": "Add the existing createDiv host stub to the Node fixture."
    },
    {
      "name": "source-baseline",
      "command": "pnpm --filter @lapis-notes/search exec vitest run src/lib/search-settings-recovery.test.ts",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 1
      },
      "note": "Owning Configuration recovery leaves the private plugin snapshot stale; failure draft retention already passes."
    },
    {
      "name": "source-exact-after",
      "command": "pnpm --filter @lapis-notes/search exec vitest run src/lib/search-settings-recovery.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      }
    },
    {
      "name": "source-package-and-specification",
      "command": "pnpm --filter @lapis-notes/search test; pnpm --filter @lapis-notes/search check; pnpm --filter @lapis-notes/search build; pnpm audit; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 45,
        "files": 12,
        "specificationLanes": 3
      },
      "note": "Separate terminal-zero commands, normal prepack/publint, zero Svelte errors/warnings, explicit App audit. Audit retains existing moderate/high ignores only. Source ed85b8367868e33d3eeb704c5566aa026fe6ded5."
    },
    {
      "name": "native-clean-config-race",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-search-settings.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 2
      },
      "note": "The clean external config can reload before the click, so expecting a conflict races legitimate live settings refresh. External bytes and outside keys remain intact. Retain a real permission failure before the external write to exercise deterministic recovery."
    },
    {
      "name": "native-stale-decision-fixture",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-search-settings.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 2
      },
      "note": "The retained failure initially displays the old disk snapshot. The original M4 safety check rejects accepting it after another external write. Use Check disk again and assert the actual reviewed bytes before the recovery choice."
    },
    {
      "name": "verified-archive-types-and-build",
      "command": "node scripts/local-archives.mjs .local/m6-search-settings/desktop.json; pnpm check:types; pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 13,
        "importRoutes": 13
      },
      "note": "Separate terminal-zero commands; tracked dependency files preserved, zero Svelte errors/warnings and fresh bundled acceptance renderer."
    },
    {
      "name": "native-settings-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-search-settings.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3
      },
      "note": "Actual controls survive immediate close/cold restore, retain failed local drafts and block Close, and refresh after explicit disk recovery before another partial setting write. External outside key survives."
    },
    {
      "name": "affected-native-and-metadata-intake",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-search.test.mjs tests/desktop/settings-persistence.test.mjs tests/desktop/plugin-persistence.test.mjs tests/desktop/navigation-metadata.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 8
      },
      "note": "All eight affected Search, Settings and plugin persistence cases pass. Two new metadata intake cases fail; E-NAV-001 records their exact diagnostics and follow-up rather than treating the combined command as passing."
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
  "contractReview": "Keep settings on the owning Configuration event and App-managed writer. Apply recovered snapshots to the existing plugin and controls, retain failed local drafts before awaiting IO and dispose panel listeners. No consumer override, duplicate persistence or native permission.",
  "milestoneReview": "This is targeted Search settings qualification within M6. Metadata/Graph, original aggregate gates and end-of-M7 full lanes remain pending. Frozen Deno, normal user profiles, publication and signing remain unchanged.",
  "archives": [
    {
      "name": "@lapis-notes/search",
      "version": "0.1.3",
      "sha256": "5e98170ac31c559c2b98820b35749925d62f7b006842dfa14b933fa660ba1f47",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-plugins.git",
        "revision": "ed85b8367868e33d3eeb704c5566aa026fe6ded5",
        "packageDirectory": "packages/search"
      }
    }
  ]
}
```
