# Final M6 cohort and startup ordering

Continuation of E-GRAPH-001; original full gates remain open.

```json
{
  "id": "E-GRAPH-002",
  "tasks": ["M6"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-MIG-002",
    "LD-NAV-001",
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
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/navigation.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/writer-audit.md",
    "spec/src/history/index.md",
    "spec/src/history/E-GRAPH-002.md",
    "tests/desktop/native-session.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Complete M7 implementation and deferred full source/Storybook/axe/web/Desktop/ordinary-bundle lanes plus original M4–M7 gates."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "final-affected-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/startup-progress.test.mjs tests/desktop/startup-recovery.test.mjs tests/desktop/plugin-persistence.test.mjs tests/desktop/settings-persistence.test.mjs tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/file-ui-mutations.test.mjs tests/desktop/navigation-search.test.mjs tests/desktop/navigation-search-settings.test.mjs tests/desktop/navigation-metadata.test.mjs tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 36
      },
      "note": "Search immediate Close exceeded the unchanged ten-second deadline. All three Graph, four metadata and other affected cases passed."
    },
    {
      "name": "exact-close-reproduction",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-name-pattern='Search controls persist through immediate' tests/desktop/navigation-search-settings.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 6
      },
      "note": "One isolated pass, then four passes/one failure, then one pass/one failure with timeout diagnostics. Visible failure identifies SyncHostService readiness exhausting concurrent sequence retries; the Search setting is already durable."
    },
    {
      "name": "api-startup-order-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/sync-host-startup-ordering.test.ts",
      "result": "fail",
      "failures": 1,
      "note": "A held startup identity transaction is overtaken by an observed file modification."
    },
    {
      "name": "api-startup-order-after",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/sync-host-startup-ordering.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      }
    },
    {
      "name": "api-startup-affected",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/sync-host-startup-ordering.test.ts src/lib/__tests__/sync-host.test.ts src/lib/__tests__/sync-host-local-provider.test.ts src/lib/__tests__/sync-host-plugin-harness.test.ts src/lib/__tests__/sync-host-security-provider.test.ts src/lib/__tests__/sync-host-security-store.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 74,
        "files": 6
      }
    },
    {
      "name": "api-startup-source-checks",
      "command": "pnpm --filter @lapis-notes/api check; pnpm --filter @lapis-notes/api build; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "specificationLanes": 6,
        "specificationToolingCases": 38
      },
      "note": "Separate terminal-zero commands. Strict types, zero Svelte errors/warnings, publint, packed types and App/metadata audits pass. Source record spec/records/2026-10-16-sync-host-startup-ordering.md."
    },
    {
      "name": "final-cohort-build",
      "command": "node scripts/local-archives.mjs .local/m6-graph/desktop-final-startup.json; pnpm check:types; pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 14,
        "importRoutes": 14
      },
      "note": "Separate terminal-zero commands. Strict Svelte types report zero errors/warnings."
    },
    {
      "name": "exact-close-after-source-fix",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-name-pattern='Search controls persist through immediate' tests/desktop/navigation-search-settings.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 5
      },
      "note": "Five consecutive cold runs; both native Close and cold restoration must exit normally."
    },
    {
      "name": "desktop-spec-budget-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "New Close diagnostic prose exceeds the already-full desktop chapter byte limit. Retain it in the dedicated navigation chapter."
    },
    {
      "name": "desktop-canonical-and-governance",
      "command": "pnpm spec:check; node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "specificationLanes": 4,
        "governanceCases": 24
      },
      "note": "Separate terminal-zero commands."
    },
    {
      "name": "affected-after-startup-repair",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/startup-progress.test.mjs tests/desktop/startup-recovery.test.mjs tests/desktop/plugin-persistence.test.mjs tests/desktop/settings-persistence.test.mjs tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/file-ui-mutations.test.mjs tests/desktop/navigation-search.test.mjs tests/desktop/navigation-search-settings.test.mjs tests/desktop/navigation-metadata.test.mjs tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 36
      },
      "note": "All Search, metadata and lifecycle cases pass. The global Graph case times out hovering a previously sampled point after cold restoration; native connection-loss noise follows cleanup. Exact stack is hoverNodes, not native Close."
    },
    {
      "name": "graph-restore-exact",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-name-pattern='native global/local Graph' tests/desktop/navigation-graph.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "The isolated unchanged case passes. The force layout still moves after a short stable sampling interval, so the fixture now resamples each real drawn node before pointer delivery and waits for its next actual drawing frame. No product rendering or label assertions are changed."
    },
    {
      "name": "native-graph-and-search-settings-qualified",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-graph.test.mjs tests/desktop/navigation-search-settings.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 6
      },
      "note": "All three Graph and three Search settings cases pass with the final verified cohort and current drawn-node sampling. Complete canonical native qualification remains scheduled after M7 implementation."
    },
    {
      "name": "final-exact-graph-and-record-checks",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-name-pattern='native global/local Graph' tests/desktop/navigation-graph.test.mjs; pnpm spec:check; pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nativeCases": 1,
        "specificationLanes": 4
      },
      "note": "Separate terminal-zero commands. Updated graph fixture passes its exact original case; final canonical, progress and source-budget checks pass. Full canonical native lane remains due after M7 implementation."
    }
  ],
  "contractReview": "Native Close diagnostics capture visible error text without extending its deadline or weakening normal-exit assertions. The API queues observed file events behind initial identity reconciliation; sequence CAS and bounded retries remain intact. No native source or consumer retry conceals the failure. Graph hover sampling follows each currently drawn circle through the next real animation frame instead of reusing earlier force-layout coordinates.",
  "milestoneReview": "M6 Search, metadata and global/local Graph component qualification is complete. Original M4–M7 gates remain open until M7 implementation and deferred full qualification. Continue to M7, preserving isolated profiles, frozen Deno, publication and signing deferral.",
  "archives": [
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "c81f16628a3d9e7a52e42583efff86ab9ced4dd7074394f717076cfba3eb1ad4",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "69cb664e49204f4474fb8ff44b14cf3ebc397107",
        "packageDirectory": "packages/api"
      }
    }
  ]
}
```
