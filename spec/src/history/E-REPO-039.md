# Embedded repository plugin settings and forge styling

The user requested jj-store forge icons and Settings styling, with all backup
controls inside the actual Repository History plugin settings. The independent
workspace view is removed. Source cards, headings, footers and brand rendering
are copied/adapted with local provenance. Account/remote lifetimes follow the
visible settings panel, while storage/adoption, capture/sync and native progress
retain their plugin ownership. Nested restore/conflict review stays accessible.

```json
{
  "id": "E-REPO-039",
  "tasks": ["M14", "M14.4", "M14.7"],
  "requirements": [
    "LD-REPO-005",
    "LD-CAT-003",
    "LD-HOST-001",
    "LD-GOV-004",
    "LD-DESK-003",
    "LD-MIG-002",
    "LD-GOV-005"
  ],
  "date": "2026-10-19",
  "result": "pass",
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "storybook": "10.5.7",
    "vitest": "4.1.11",
    "designCore": "0.5.1",
    "sourceJjStore": "efc26dea6b8dab4e0317904a1395ad5a3b901981",
    "dependencies": "Existing checksum-verified local migration archives retained; no install or publication."
  },
  "contractReview": "LD-REPO-005 now places backup controls directly in registered plugin settings. Native permission, account custody, exact restore/publication identities, independent capture/sync and immutable read contracts are unchanged. LD-HOST-001/LD-CAT-003 retain owned App context, real production controls and public Design Core extension points.",
  "milestoneReview": "M14/M14.4/M14.7 remain Partial at their original actual-native/provider and wider qualification gates. This UI slice does not qualify those gates or start another implementation stage. Visual baseline approval remains separate.",
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/Forges.stories.ts",
    "catalog/plugins/repository/HistoryAdoption.stories.ts",
    "catalog/plugins/repository/HistoryStorage.stories.ts",
    "catalog/plugins/repository/Publication.stories.ts",
    "catalog/plugins/repository/RemoteBackup.stories.ts",
    "catalog/plugins/repository/Sync.stories.ts",
    "catalog/support/repository/ForgeDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "docs/provenance.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-039.md",
    "spec/src/history/index.md",
    "src/components/repository/backup/AdoptionSettings.svelte",
    "src/components/repository/backup/BackupCard.svelte",
    "src/components/repository/backup/BackupField.svelte",
    "src/components/repository/backup/BackupSettings.svelte",
    "src/components/repository/backup/BackupSettingsField.svelte",
    "src/components/repository/backup/ForgeAccounts.svelte",
    "src/components/repository/backup/ForgeAuthorization.svelte",
    "src/components/repository/backup/ForgeIcon.svelte",
    "src/components/repository/backup/RemoteSettings.svelte",
    "src/components/repository/backup/StorageSettings.svelte",
    "src/components/repository/backup/SyncSettings.svelte",
    "src/components/repository/backup/backup-settings.ts",
    "src/components/repository/backup/forge-icons.ts",
    "src/components/repository/backup/forge-view.ts",
    "src/components/repository/repository-status.ts",
    "src/components/repository/repository-tools.ts"
  ],
  "runs": [
    {
      "name": "embedded-settings-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Forges.stories.ts -t 'Empty Accounts'",
      "result": "fail",
      "failures": 1,
      "note": "New exact regression cannot find backup controls directly in plugin Settings. No product tests were weakened. .local/forge-settings-before.log."
    },
    {
      "name": "embedded-settings-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Forges.stories.ts -t 'Empty Accounts'",
      "result": "pass",
      "failures": 0,
      "note": "Exact regression passes in a fresh browser process; Settings remains open and no independent workspace settings leaf exists. .local/forge-settings-after.log."
    },
    {
      "name": "strict-types-before",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 1,
      "note": "Zero errors; one scoped unused-selector warning in the nested conflict overlay. Corrected the component-owned selector. .local/forge-settings-types.log was replaced by successful strict rerun; terminal output retains initial warning."
    },
    {
      "name": "strict-types-final",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and warnings. .local/forge-settings-types-final.log."
    },
    {
      "name": "node-runner-before",
      "command": "node --test tests/renderer/repository-{forges,remote,storage,adoption,sync,publication,working-copy,backup}.test.mjs",
      "result": "fail",
      "failures": 4,
      "note": "Node strip-only syntax cannot load existing TypeScript parameter properties. 23 tests pass and four load/test failures occur. Corrected invocation to the repository-used tsx runner; no source workaround. .local/forge-settings-renderer.log."
    },
    {
      "name": "renderer-controllers",
      "command": "pnpm exec tsx --test tests/renderer/repository-{forges,remote,storage,adoption,sync,publication,working-copy,backup}.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "47 focused tests pass. Account cancellation, original-request recovery, remote frames and independent capture/sync lifetimes remain covered. .local/forge-settings-renderer-tsx.log."
    },
    {
      "name": "catalog-first-matrix",
      "command": "pnpm test:storybook catalog/plugins/repository/{Forges,HistoryAdoption,HistoryStorage,Publication,RemoteBackup,Sync}.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "40 stories across six directly affected families, in four cold desktop/narrow light/dark processes: 160 interaction/accessibility executions pass. Final command-navigation story and small lifecycle/layout refinements receive a second final matrix. .local/forge-settings-catalog.log."
    },
    {
      "name": "production-renderer",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "Production renderer builds in 48 seconds. Existing non-fatal Rollup/PURE and large-chunk warnings remain. This is not a native bundle or actual-WebView proof. .local/forge-settings-build.log."
    },
    {
      "name": "source-ownership",
      "command": "pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Both ownership audits pass. No native code, dependencies, source aliases or shared package internals changed."
    },
    {
      "name": "ledger-before-record",
      "command": "pnpm spec:validate; pnpm exec tsx --test tests/governance/*.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Canonical/progress checks correctly reject missing fresh E-REPO-039 while the record is being assembled. Governance: 66 pass, one progress-contract failure for three task references. Add this record and rerun the original checks."
    },
    {
      "name": "ledger-canonical-before",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "The first checks ran before snapshotting the new record and before adding generated MIGRATION.md coverage, the SUMMARY entry and four mapped canonical chapters. Added explicit unchanged native/ownership/migration contracts and complete file coverage; rerun all original checks."
    },
    {
      "name": "final-settings-matrix",
      "command": "pnpm test:storybook catalog/plugins/repository/{Forges,HistoryAdoption,HistoryStorage,Publication,RemoteBackup,Sync}.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Final 41 stories x four cold light/dark desktop/narrow processes = 164 interaction/accessibility executions pass. Includes the command opening plugin Settings, OAuth close/reopen cancellation, storage completion beyond Settings closure and original remote restoration recovery. .local/forge-settings-catalog-final.log."
    },
    {
      "name": "governance-final",
      "command": "pnpm exec tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 67 governance regressions pass after recording the new slice. .local/forge-settings-governance-final.log."
    },
    {
      "name": "canonical-size-before",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 4,
      "note": "Adding new summaries exceeded one canonical byte limit and three 400-line limits. Consolidated existing current summaries with the new unchanged-contract confirmation; preserved owning requirements. One second repository paragraph wrap required an additional concise wording repair. No limits were raised."
    },
    {
      "name": "preview-refresh",
      "command": "pnpm storybook:restart -- --port 7490; pnpm storybook:status -- --port 7490",
      "result": "pass",
      "failures": 0,
      "note": "Cold main-workspace preview is running. Browser review confirms the full-width card and GitHub/Forgejo menu inside the actual Repository History Settings modal. Mock accounts only; no live authentication or credential entry. Screenshot: /tmp/lapis-embedded-forge-settings.png."
    },
    {
      "name": "final-conflict-dismissal",
      "command": "pnpm test:storybook catalog/plugins/repository/Sync.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "After retaining the existing busy Escape/close guard in the nested fullscreen dialog, all five sync stories pass in four cold viewport/theme processes: 20 interaction/accessibility reruns. .local/forge-settings-conflicts-final.log."
    },
    {
      "name": "final-renderer-build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "Final production renderer builds in 52 seconds after the overlay guard refinement; existing non-fatal chunk/PURE warnings remain. .local/forge-settings-build-final.log."
    },
    {
      "name": "canonical-final",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "41 tasks / 144 evidence records; six validators / 166 chapters / 95 requirements; spec-first: 28 protected files / six owning chapters. Original milestone gates and statuses stay unchanged. All canonical size limits remain enforced."
    },
    {
      "name": "format-and-ownership-final",
      "command": "pnpm exec prettier --check <all changed nondeleted files>; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Changed-file formatting and both source ownership audits pass. No native source/build changes, dependency edits or unapproved visual baselines."
    },
    {
      "name": "optional-whitespace-cli",
      "command": "jj --no-pager diff --check",
      "result": "fail",
      "failures": 1,
      "note": "This installed JJ does not offer Git-style --check. No Git write or configuration workaround used; the owning changed-file Prettier and source-audit checks validate formatting."
    },
    {
      "name": "focused-record-scope-before",
      "command": "pnpm check:progress; pnpm spec:validate; pnpm exec tsx --test tests/governance/*.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The pass-record schema rejects a nonempty remaining list. The listed gaps belong to the unchanged overall M14 native/provider/release gates, not this completed UI slice. Preserve them in deferredQualification and milestoneReview; remaining is empty only for this focused slice. Task statuses stay Partial."
    },
    {
      "name": "generated-format-before",
      "command": "pnpm exec prettier --check <all changed nondeleted files>",
      "result": "fail",
      "failures": 1,
      "note": "The regenerated MIGRATION.md table needs ordinary Prettier formatting. Formatted the generated projection and reran both exact formatting and progress consistency checks; no source or task semantics changed."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Visual approval, actual native account/restore/sync lifecycle and live GitHub/Forgejo acceptance remain deferred.",
    "Full repository/native/platform/release qualification remains outside this UI slice; no application bundle or live remote is restarted."
  ]
}
```
