# Native global and local Graph intake

Existing public Graph views, indexed data and App-owned settings lifecycle.

```json
{
  "id": "E-GRAPH-001",
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
    "package.json",
    "pnpm-lock.yaml",
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/navigation.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/writer-audit.md",
    "spec/src/history/index.md",
    "spec/src/history/E-GRAPH-001.md",
    "src/lib/notes/notes-plugins.ts",
    "tests/desktop/navigation-graph.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Final cohort verification and the observed sync-host startup failure are continued in E-GRAPH-002; Graph component acceptance already passes.",
    "Complete M7 implementation and all deferred full source/Storybook/axe/web/Desktop/ordinary-bundle lanes and original M4–M7 gates."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "native-graph-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 --test-name-pattern='native global/local Graph' tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The previous bundle has no Graph profile registration or command/view."
    },
    {
      "name": "source-admission-old-cohort",
      "command": "pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-admission.test.ts",
      "result": "fail",
      "failures": 1,
      "note": "Old source dependency cohort lacks settleOperations; install ten verified current core archives across 37 import routes, preserving tracked dependency files."
    },
    {
      "name": "source-admission-baseline",
      "command": "pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-admission.test.ts",
      "result": "fail",
      "failures": 1,
      "note": "Actual App operation drain completes while the unadmitted debounce still owns the latest Graph control snapshot."
    },
    {
      "name": "source-admission-and-existing-debounce",
      "command": "pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-admission.test.ts src/lib/__tests__/graph-plugin.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 11,
        "files": 2
      }
    },
    {
      "name": "source-recovery-id-fixture",
      "command": "pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-recovery.test.ts",
      "result": "fail",
      "failures": 1,
      "note": "Fixture uses graph instead of the preserved runtime id lapis-graph."
    },
    {
      "name": "source-combined-id-fixture",
      "command": "pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-admission.test.ts src/lib/__tests__/graph-settings-recovery.test.ts src/lib/__tests__/graph-plugin.test.ts",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 11
      },
      "note": "Correct the recovery fixture to the real manifest.id."
    },
    {
      "name": "source-recovery-baseline",
      "command": "pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-recovery.test.ts",
      "result": "fail",
      "failures": 1,
      "note": "Corrected runtime id against the missing-listener implementation reproduces stale runtime/view settings."
    },
    {
      "name": "source-exact-after",
      "command": "pnpm --filter @lapis-notes/graph exec vitest run src/lib/__tests__/graph-settings-admission.test.ts src/lib/__tests__/graph-settings-recovery.test.ts src/lib/__tests__/graph-plugin.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 12,
        "files": 3
      }
    },
    {
      "name": "source-package-checks",
      "command": "pnpm --filter @lapis-notes/graph test; pnpm --filter @lapis-notes/graph check; pnpm --filter @lapis-notes/graph build; pnpm audit; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 62,
        "files": 15,
        "specificationLanes": 3
      },
      "note": "Separate terminal-zero commands, normal prepack/publint and explicit App audit pass. Svelte reports zero errors/warnings. Existing moderate/high audit ignores remain unchanged. Source 147ba6e2e3e4af1e1818179c1f309fc3b420ce44."
    },
    {
      "name": "registry-contract",
      "command": "pnpm add @lapis-notes/graph@^0.1.3 --lockfile-only --ignore-scripts",
      "result": "pass",
      "failures": 0,
      "note": "Portable released semver range and registry lock remain tracked; archive redirection stays ignored."
    },
    {
      "name": "native-filter-fixture",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 3,
      "counts": {
        "passed": 0
      },
      "note": "All scenarios wait for collapsed Filters controls. Open the existing accordion before querying its switches."
    },
    {
      "name": "native-first-component-attempt",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 1
      },
      "note": "Failed-save/disk recovery passes. Local labels are hidden at the small viewport and the initial note open is not awaited before Graph activation."
    },
    {
      "name": "native-diagnostic-attempt",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 1
      },
      "note": "The test assumes Local Graph has global zoom buttons; it intentionally has only settings. An unawaited initial note open also races immediate Close. Preserve actual failed close/cleanup result."
    },
    {
      "name": "native-owned-note-ready",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 2
      },
      "note": "Wait for the real Alfa editor before Graph activation. Cold Close/restart and recovery both pass. Local node circles draw, but low-zoom labels correctly fade."
    },
    {
      "name": "native-pointer-observer-fixture",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 --test-name-pattern='native global/local Graph' tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0
      },
      "note": "A native pointer-action probe does not produce the expected label observation. The subsequent driver uses browser PointerEvent delivery for real hit testing and existing node menus; it does not claim a physical OS gesture."
    },
    {
      "name": "native-label-before-hover",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 --test-name-pattern='native global/local Graph' tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0
      },
      "note": "An initial direct-label assertion is zoom dependent; use actual hover-rendered labels rather than changing product rendering."
    },
    {
      "name": "native-moving-layout-hover",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 --test-name-pattern='native global/local Graph' tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0
      },
      "note": "Node sampling during the force layout moves the target. Wait for stable actual circle geometry before hover."
    },
    {
      "name": "native-menu-label-fixture",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 --test-name-pattern='native global/local Graph' tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0
      },
      "note": "Global/local semantics, follow and external mutations reach node navigation; query the existing role=menuitem instead of assuming a span label."
    },
    {
      "name": "native-restored-label-fixture",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 --test-name-pattern='native global/local Graph' tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0
      },
      "note": "Navigation and tag Search pass through existing node menus. Restored low-zoom labels also require actual hover."
    },
    {
      "name": "native-complete-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/navigation-graph.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3
      },
      "note": "Real global/local canvases, all supported node filters, active-note follow, external create/rename/delete, node-menu navigation, tag Search, cold restored views and settings close/failure/recovery pass. Driver observes forwarded Canvas calls and delivers browser pointer/context-menu events; source renderer semantics retain separate package tests."
    },
    {
      "name": "native-database-diagnostic",
      "command": "node --input-type=module - <<'JS'\nimport { DatabaseSync } from 'node:sqlite';\nimport { readdirSync } from 'node:fs';\nconst directory='.local/native-test/m5-watch-qualified/graph-probe-YE0rSc/profile/databases';\nconst name=readdirSync(directory).find(name=>name.endsWith('.db'));\nconst db=new DatabaseSync(`${directory}/${name}`,{readOnly:true});\nconsole.log(db.prepare('PRAGMA table_info(app_meta)').all());\nconsole.log(db.prepare(\"SELECT key, substr(value,1,110) AS value FROM app_meta WHERE key LIKE '%graph%'\").all());\ndb.close();\nJS",
      "result": "fail",
      "failures": 1,
      "note": "Node SQLite cannot parse Turso-specific FTS index syntax. This diagnostic does not indicate a native Turso database defect and is not used for qualification; no source or product behavior is changed."
    },
    {
      "name": "verified-profile-types-and-build",
      "command": "node scripts/local-archives.mjs .local/m6-graph/desktop.json; pnpm check:types; pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json; pnpm spec:check; node --test tests/governance/contracts.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 14,
        "importRoutes": 14,
        "governanceCases": 8,
        "specificationLanes": 4
      },
      "note": "Separate terminal-zero commands, zero Svelte errors/warnings. Final workspace projection API refresh remains pending."
    },
    {
      "name": "workspace-api-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'retains new ItemViews while sidebar projection and activation overlap'",
      "result": "fail",
      "failures": 1,
      "note": "An independent source probe reproduces an older queued controller snapshot discarding a newer local ItemView."
    },
    {
      "name": "workspace-api-after",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts -t 'retains new ItemViews while sidebar projection and activation overlap'",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      }
    },
    {
      "name": "workspace-api-affected",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace.test.ts; pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/workspace-state-persistence.test.ts src/lib/__tests__/plugin-state-persistence.test.ts src/lib/__tests__/editor-rename-persistence.test.ts src/lib/__tests__/editor-persistence.test.ts; pnpm --filter @lapis-notes/api check; pnpm --filter @lapis-notes/api build",
      "result": "pass",
      "failures": 0,
      "counts": {
        "workspaceCases": 128,
        "persistenceCases": 36,
        "persistenceFiles": 4
      },
      "note": "Separate terminal-zero commands. API build, publint and packed type contracts pass, with zero Svelte errors/warnings. Owning source 631aeec539e2fb061dc80c5c3a30a248ee15c529."
    },
    {
      "name": "workspace-spec-map-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 3,
      "note": "Update mapped architecture/package/plugin-model chapters in the owning API source."
    },
    {
      "name": "workspace-spec-budget-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "A new four-line release explanation exceeds the already-full 400-line release chapter. Move only that new explanation into the owning workspace API chapter."
    },
    {
      "name": "workspace-source-specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanes": 6,
        "specificationToolingCases": 38
      },
      "note": "App/metadata audits and all canonical, build, first and tooling validation lanes pass."
    },
    {
      "name": "final-verified-cohort-and-native-build",
      "command": "node scripts/local-archives.mjs .local/m6-graph/desktop-final.json; pnpm check:types; pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 14,
        "importRoutes": 14
      },
      "note": "Separate terminal-zero commands. Final API workspace source 631aeec5 and Graph source 147ba6e2 share one verified public runtime; tracked dependency files remain portable and Svelte reports zero errors/warnings."
    }
  ],
  "contractReview": "Register the public Graph plugin and styles after Search and before metadata/layout restoration. The source-owned repair admits debounce work through the existing App registry, preserves coalescing, awaits unload and updates original views from owning Configuration recovery. Native tests forward real Canvas drawing calls and deliver browser pointer/context-menu events through existing hit testing and node menus without supplying graph data or changing output. No native permission or replacement surface is added. The API additionally versions explicit view transitions/activation against older queued controller snapshots without changing public signatures. Its exact and complete affected source tests pass before archive refresh.",
  "milestoneReview": "Graph is the remaining M6 component after targeted Search/settings/metadata qualification. Keep original M4–M7 gates, final full qualification, frozen Deno, ordinary user profiles, publication and signing unchanged.",
  "archives": [
    {
      "name": "@lapis-notes/graph",
      "version": "0.1.3",
      "sha256": "416488a35593be8ce5fa608cedf627e00a6e63cbc6b12c3b53c2519e6584fd13",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-plugins.git",
        "revision": "147ba6e2e3e4af1e1818179c1f309fc3b420ce44",
        "packageDirectory": "packages/graph"
      }
    },
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "a060c2281cc774552307f2bab40be1416f72a4a0e4ebab2613b2add37597053c",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "631aeec539e2fb061dc80c5c3a30a248ee15c529",
        "packageDirectory": "packages/api"
      }
    }
  ]
}
```
