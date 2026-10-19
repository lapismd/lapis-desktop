# Separate backup settings section and table surfaces

The user requested Backup and synchronisation as its own section, with tinted
headers and white table body rows. The implementation uses the existing public
settings page extension; general fields keep the same controller and source.
Backup panel creation/closure and plugin-owned work remain unchanged. Existing
stories cover the affected production controls; no implementation-mirroring
tests are introduced for this reversible presentation change.

```json
{
  "id": "E-REPO-041",
  "tasks": ["M14", "M14.4", "M14.7"],
  "requirements": [
    "LD-REPO-005",
    "LD-CAT-003",
    "LD-HOST-001",
    "LD-DESK-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-MIG-002"
  ],
  "date": "2026-10-19",
  "result": "pass",
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "storybook": "10.5.7",
    "designCore": "0.5.1",
    "deps": "Existing verified private migration archives retained; no install/publication."
  },
  "contractReview": "Backup and synchronisation is now a labelled section outside the grey general-settings body. The public settings page extension composes controlled AppSettings fields with the existing backup panel; its original reveal/search field ID remains. Maintained cards keep tinted headers and use --background for body rows and footers, white in light mode and theme-aware in dark mode. No dependency-internal selectors, ambient App, native commands, account custody, original mutation identity or worker/controller lifetime changed.",
  "milestoneReview": "M14/M14.4/M14.7 remain Partial at original native/provider and broader qualification gates. This UI slice cannot qualify those product gates. Visual review remains separate, with no baseline changes.",
  "files": [
    "catalog/COVERAGE.md",
    "docs/automatic-vault-backup-progress.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-041.md",
    "spec/src/history/index.md",
    "src/components/repository/backup/BackupCard.svelte",
    "src/components/repository/backup/BackupSettingsField.svelte",
    "src/components/repository/backup/RepositorySettingsPage.svelte",
    "src/components/repository/backup/backup-settings.ts",
    "src/components/repository/repository-status.ts"
  ],
  "runs": [
    {
      "name": "visual-before",
      "command": "Read current 7490 Empty Accounts story",
      "result": "fail",
      "failures": 1,
      "note": "Backup and synchronization is an ordinary custom field inside the grey general Settings block; card body/footer match the muted surface. User requested a separate section and white light-theme rows."
    },
    {
      "name": "visual-after",
      "command": "Read HMR-updated production Settings story",
      "result": "pass",
      "failures": 0,
      "note": "Separate Backup and synchronisation region and heading, full-width table-style cards, tinted headers and white body/footer visible. Screenshot /tmp/lapis-backup-section.png; manual observation does not approve a baseline."
    },
    {
      "name": "strict-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and warnings. .local/backup-section-types.log."
    },
    {
      "name": "source-boundaries",
      "command": "pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Both audits pass. Production remains independent of catalog data and uses public Design Core settings/card extension points."
    },
    {
      "name": "mapped-ownership-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "The new application-owned Settings page requires its mapped governance chapter confirmation. Extend the existing unchanged ownership summary; no rule or gate is relaxed."
    },
    {
      "name": "affected-cold-story-matrix",
      "command": "pnpm test:storybook catalog/plugins/repository/{Forges,HistoryAdoption,HistoryStorage,Publication,RemoteBackup,Sync}.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "41 existing stories in four fresh light/dark desktop/narrow processes: 164 interaction/accessibility executions pass. Account cancellation/reopen, original restoration recovery, storage completion beyond settings closure, sync conflicts and publication controls remain covered. .local/backup-section-catalog.log."
    },
    {
      "name": "production-renderer-build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "Renderer bundle passes in 52.76 seconds. Existing large-chunk/PURE warnings stay non-fatal, with no changed thresholds. No native build/bundle or real-provider gate is claimed. .local/backup-section-build.log."
    },
    {
      "name": "canonical-and-format",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0,
      "note": "41 tasks / 146 evidence records, six validators / 168 chapters / 95 requirements and all mapped owning chapters. Formatting and original canonical size limits pass. Original native/provider/wider gates and visual baselines remain unchanged."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Actual native account/restore/sync lifecycle, live GitHub/Forgejo acceptance, visual baseline approval and full-suite/platform/release gates remain unchanged and deferred."
  ]
}
```
