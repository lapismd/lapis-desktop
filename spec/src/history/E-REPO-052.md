# Native saved-version Search and exact restore

```json
{
  "id": "E-REPO-052",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14", "M14.6"],
  "requirements": ["LD-REPO-005", "LD-NAV-001"],
  "versions": "macOS ARM64; Desktop parent 9d670516; Search source bbf6e174b07854d938001df1aeb53f2f8a3693f9; @lapis-notes/search 0.1.3 verified archive 5ad06cb86f75d4b29b15fc87d654cc863e503d4d357fff679f1130341852997a; other 13 public routes unchanged; API source 8e27866d3b884cc3cb539c3e49287b3a0fcfd1b3 archive 42f3602271f62cad9ceb02e2d26b9480143a30f14b3195b90c9b5b60acdfc38e",
  "files": [
    "tests/desktop/repository-history-search.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/history/E-REPO-052.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "PLAN.md",
    "MIGRATION.md",
    "docs/automatic-vault-backup-progress.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md"
  ],
  "contractReview": "Unchanged-contract actual native acceptance for retained history search. Search must filter saved text and author metadata, open its exact checkpoint in pinned blame and JJ Log without changing current disk bytes, persist its selection/query through a cold native process, then restore only through the existing preview/writer guard and receipt path. No private App state, mock search provider or new capture/read authority is introduced.",
  "milestoneReview": "M14.6 is Done on macOS ARM64: actual native text/author filtering, immutable exact pinned blame/JJ Log selection, authored-query and version retention through two cold processes, then guarded restore of that exact hit pass. M14 remains Partial for real GitHub, two-device/provider, storage/adoption and Forgejo acceptance. M14.1/2/3 remain Done; AI, presentation and release/cutover gates remain separate.",
  "runs": [
    {
      "name": "native-search-ui-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-history-search.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "search-ui-before.log: negative/positive text-author filters work and the correct saved version appears, but the harness expands only the file group. The real version group is still collapsed, so its Open saved version action is unavailable. Expand that displayed version group like the maintained Storybook interaction; no product change or assertion weakening."
    },
    {
      "name": "cold-native-query-persistence-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-history-search.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "search-ui-expanded-version.log: filtering and exact immutable blame activation pass, but cold Search restores its placeholder. The actual persisted workspace has query=\"\", confirming a product defect rather than delayed rendering. SearchView stores initial command state and never reads the current panel model. The upstream fix is required; the consumer is not patched."
    },
    {
      "name": "source-owned-search-state-fix-and-archive",
      "command": "See lapis-plugins/spec/records/2026-10-20-search-live-view-state.md\npnpm local:install .local/archives/native-search-view-state.json",
      "result": "pass",
      "failures": 0,
      "note": "Source bbf6e174b07854d938001df1aeb53f2f8a3693f9 fixes live query/scope snapshots, save scheduling and unmounted state. Source regression goes 3 fail/2 pass \u2192 5/5; full Search units 49/49, package check/build/publint, 9 cold interaction/axe cases, 12 local packaging/signature-fixture tests, audit (same two pre-existing ignored advisories) and specification/App ownership pass. Final local payload is reproduced and verified after the clean source commit. Public npm archive SHA256 5ad06cb86f75d4b29b15fc87d654cc863e503d4d357fff679f1130341852997a. All 14 graph archives are checked before normal guarded review Quit; review/Vite exit is confirmed, Storybook stops, and local installation verifies all 14 import routes while preserving tracked dependency files. No publication or production signing."
    },
    {
      "name": "consumer-command-query-regression",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Search.stories.ts",
      "result": "fail",
      "failures": 7,
      "note": "search-view-consumer-catalog.log: all seven cases fail. Fresh command-supplied Search query is reset to empty/files by a queued API layout replay. Temporary setter/stack diagnostics show correct command state followed by Workspace.restoreLayoutJson, then are fully removed. The equivalent fresh-view source plugin story passes without another Search runtime change."
    },
    {
      "name": "source-api-inflight-fence",
      "command": "See lapis-notes/spec/records/2026-10-20-workspace-inflight-view-state.md; pnpm --filter @lapis-notes/api check; pnpm --filter @lapis-notes/api build; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "API 8e27866d fences stale snapshots after global activation, per-leaf plugin activation and asynchronous candidate preparation. Retains newer state, view identity and selected leaf, with no public signature or layout-format change. Three timing regressions and eight direct-consumer files pass 174/174. Initial two Settings fixture failures reproduce against parent; fixture now seeds files.exclude defaults and keeps exact saved-state/two-write assertions. API check, public build/publint/packed types, all six canonical lanes, App ownership and spec regressions pass. Broader suites remain deferred under minimal-verification scope."
    },
    {
      "name": "api-archive-graph-intake",
      "command": "pnpm --dir packages/api pack --out /Users/stevejuma/code/lapismd/lapis-notes/.local/packages/inflight-view-state/lapis-notes-api-0.1.4.tgz\npnpm storybook:stop -- --port 7491\npnpm local:install .local/archives/native-search-projection.json",
      "result": "pass",
      "failures": 0,
      "note": "Checksum-verified API archive 42f3602271f62cad9ceb02e2d26b9480143a30f14b3195b90c9b5b60acdfc38e replaces only API in the preceding manifest. Fourteen archives and public import routes verify; tracked manifests/lockfiles remain unchanged. Review already stopped normally; owned Storybook listener is confirmed stopped before installation. Existing Svelte peer mismatch and optional build-script warnings remain; no publication/signing."
    },
    {
      "name": "cold-consumer-command-query-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Search.stories.ts\npnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "search-api-catalog.log: all seven original interaction/axe cases pass in a fresh browser process against installed public archives, with production Search and no temporary diagnostic wrapper. search-api-types.log: zero Svelte errors/warnings."
    },
    {
      "name": "rebuilt-native-search-and-restore",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json\nLAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-history-search.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "search-api-native-build.log: actual ARM64 Acceptance bundle builds against the refreshed archives. Existing annotation/empty-worker/chunk-size and compact-unwind linker warnings remain. search-api-native-after.log: original exact test passes 1/1 across two cold processes. Automatically captures text, excludes it using a nonmatching author, opens the original commit in pinned blame without disk writes, persists the live authored query through normal close, preserves query and exact hit after a newer external save and cold reopening, opens that commit in JJ Log, and applies its original bytes only through the native preview/guarded Restore file dialog. Real IO, no mocked Search or source alias. Receipt saved in history-search-ui-*/history-search-ui-receipt.json."
    },
    {
      "name": "completion-evidence-draft-validation",
      "command": "pnpm check:progress\npnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "search-progress-final.log/search-spec-final.log: draft completion record omitted completedGates and four newly updated tracking files. Prettier also wrapped repository.md to 401 lines. Add the exact unchanged original gate and complete file coverage, and condense introductory prose under the existing 400-line bound. No validator, requirement or acceptance assertion changes."
    },
    {
      "name": "mapped-native-proof-acknowledgement",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "search-spec-qualified.log: validation, Rust formatting and mdBook pass; source-first correctly requires governance and migration chapter acknowledgements for the new native test. Add unchanged-contract native-proof/deferred-release confirmations; correct stale M7.3 introductory prose to its already qualified status. No original completion gate is changed."
    },
    {
      "name": "qualified-source-and-progress-gates",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm check:architecture\npnpm check:app-ownership\npnpm spec:check\npnpm storybook:start -- --port 7491",
      "result": "pass",
      "failures": 0,
      "note": "search-progress-qualified.log: 41 tasks/191 records pass with the exact original M14.6 gate. Source and App ownership audits pass. search-spec-mapped-final.log: all four canonical lanes pass, including Rust format, mdBook and mapped source-first. Scoped formatting passes and authored limits remain enforced. Storybook starts from main at 7491, PID 44760, with a verified owned listener. Review restart uses the ordinary main application and preserves its profile/vault. No release, signing or publication."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Full root/catalog/theme/platform matrices, real GitHub/Forgejo and two-device provider acceptance, storage/adoption, managed AI, distribution/publication/signing and visual-baseline approval remain separate. Only M14.6 is promoted in this slice."
  ],
  "completedGates": {
    "M14.6": "Historical text and metadata search opens exact restorable checkpoint versions"
  }
}
```
