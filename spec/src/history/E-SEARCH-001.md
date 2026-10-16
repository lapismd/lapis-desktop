# Search and native indexed navigation intake

First M6 component; metadata navigation, Graph and aggregate gates remain open.

```json
{
  "id": "E-SEARCH-001",
  "tasks": ["M6"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-MIG-002",
    "LD-NAV-001",
    "LD-NAV-002",
    "LD-NAV-003",
    "LD-NAV-004",
    "LD-NAV-005",
    "LD-NAV-006",
    "LD-NAV-007",
    "LD-NAV-008"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "files": [
    "MIGRATION.md",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/desktop-acceptance.mjs",
    "scripts/spec-contracts.mjs",
    "spec-validator.config.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/navigation.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/writer-audit.md",
    "spec/src/history/E-SEARCH-001.md",
    "spec/src/history/index.md",
    "src/lib/notes/notes-plugins.ts",
    "tests/desktop/navigation-search.test.mjs",
    "tests/governance/contracts.test.mjs",
    "scripts/progress-model.mjs",
    "tests/governance/progress.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Complete M6 indexed metadata/link/outline/tag/property navigation, global/local Graph and its settings-writer/native lifecycle qualification.",
    "Complete M7 desktop integration, then every session-deferred full source/Storybook/axe/web/Desktop/ordinary-bundle lane and original M4–M7 gate."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-profile-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-search.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The previous bundle has no Search panel/registered opener; the existing F6 override cannot reveal it."
    },
    {
      "name": "source-notice-before",
      "command": "pnpm --filter @lapis-notes/search exec vitest run src/lib/search-notice-ownership.test.ts",
      "result": "fail",
      "failures": 1,
      "note": "A real Notice routes background failure to the other compatibility App instead of its owner."
    },
    {
      "name": "source-view-fixture-before",
      "command": "pnpm --filter @lapis-notes/search exec vitest run src/lib/search-view-state.test.ts",
      "result": "fail",
      "failures": 2,
      "note": "The initial Node fixture lacks the existing createDiv host hook. Supply the fixture hook without changing product behavior."
    },
    {
      "name": "source-view-state-before",
      "command": "pnpm --filter @lapis-notes/search exec vitest run src/lib/search-view-state.test.ts",
      "result": "fail",
      "failures": 2,
      "note": "The corrected fixture reproduces the missing typed-query state callback and unchanged-restore boundary."
    },
    {
      "name": "source-exact-after",
      "command": "pnpm --filter @lapis-notes/search exec vitest run src/lib/search-notice-ownership.test.ts src/lib/search-view-state.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3,
        "files": 2
      }
    },
    {
      "name": "source-search-package",
      "command": "pnpm --filter @lapis-notes/search test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 43,
        "files": 11
      }
    },
    {
      "name": "source-check-build-and-audit",
      "command": "pnpm --filter @lapis-notes/search check; pnpm --filter @lapis-notes/search build; pnpm audit; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "requirements": 610,
        "svelteErrors": 0,
        "svelteWarnings": 0,
        "specificationLanes": 3
      },
      "note": "Separate commands and normal prepack/publint pass. App audit passes. Audit exits zero using the two existing ignored findings; no ignore/dependency is added. Search source c8db9717. Full source/Storybook/web lanes remain pending."
    },
    {
      "name": "source-spec-map-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 2,
      "note": "The Changeset also requires distribution and governance chapters. Add their actual source-archive and qualification boundaries."
    },
    {
      "name": "source-formatter-before",
      "command": "pnpm exec prettier --write packages/search/src/lib/search-panel.svelte",
      "result": "fail",
      "failures": 1,
      "note": "Generic unpinned formatter has no Svelte parser. Use the existing pinned desktop formatter/plugin for new tests/docs, preserve existing source style and build the final source snapshot."
    },
    {
      "name": "portable-registry-dependency",
      "command": "pnpm add @lapis-notes/search@^0.1.3 --lockfile-only --ignore-scripts",
      "result": "pass",
      "failures": 0,
      "note": "Declare a normal registry range and portable lockfile before installing the ignored archive overlay; existing published Design Core peer warnings remain separate from the verified source cohort."
    },
    {
      "name": "verified-public-archives",
      "command": "node scripts/local-archives.mjs .local/m6-search/desktop.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 13,
        "importRoutes": 13
      },
      "note": "Keep the qualified twelve-archive cohort and add only verified Search. Tracked dependency files are preserved."
    },
    {
      "name": "native-search-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-search.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Actual indexed query/result navigation, editor disk save, external rename/create/delete and cold query/layout restoration pass."
    },
    {
      "name": "desktop-types-and-native-build",
      "command": "pnpm check:types; pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Separate terminal-zero commands. Fresh acceptance WebView consumes the final verified 13-archive cohort; Svelte reports zero errors and warnings."
    },
    {
      "name": "summary-before",
      "command": "node --test tests/governance/progress.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 5
      },
      "note": "The summary mislabeled the oldest pending M4 gate as current work and claimed native services were deferred."
    },
    {
      "name": "summary-after",
      "command": "node --test tests/governance/progress.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 6
      },
      "note": "Current M6 implementation and oldest pending M4 gate are separate projections of the task ledger; original Done enforcement is retained."
    },
    {
      "name": "affected-native-profile-lifecycle",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/startup-progress.test.mjs tests/desktop/startup-recovery.test.mjs tests/desktop/plugin-persistence.test.mjs tests/desktop/settings-persistence.test.mjs tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/file-ui-mutations.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 26
      },
      "note": "Actual cold native startup, note/layout/settings/plugin writers, preview conflicts and internal rename/move remain qualified with Search enabled."
    },
    {
      "name": "governance-and-source-audit",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 24
      }
    },
    {
      "name": "desktop-specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanes": 4
      },
      "note": "Canonical validation includes source budgets, App ownership and progress; Rust formatting, mdBook and spec-first pass."
    }
  ],
  "contractReview": "Introduce navigation.md as a first-class mapped contract and preserve the complete M6 inventory including Graph. Consume the existing public Search plugin and styles before metadata/layout. Source-owned fixes bind notices to the original App and retain typed queries in existing view state before debounce without redundant startup writes. Expand the writer audit and retain original workspace, metadata, persistence and API class ownership. No replacement surface or native permission is introduced. The generated summary distinguishes latest-started implementation from oldest pending qualification without changing milestone status or original gates.",
  "milestoneReview": "Search is the first M6 component; its original gate and Graph remain open. M4/M5 implementation evidence does not waive deferred full qualification. Keep source publication/signing, frozen Deno, normal user profiles and the independently planned post-M7 plugin work unchanged.",
  "archives": [
    {
      "name": "@lapis-notes/search",
      "version": "0.1.3",
      "sha256": "955ccf57835370aa75c015703edb0e6b40f03de5ee762d6c0a0171755e2b2241",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-plugins.git",
        "revision": "c8db9717a7b4bea35e8be77aea6e500ec426594f",
        "packageDirectory": "packages/search"
      }
    }
  ]
}
```
