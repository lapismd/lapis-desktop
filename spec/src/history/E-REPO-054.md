# Sync recovery outside all-file writer protection

```json
{
  "id": "E-REPO-054",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14", "M14.5"],
  "requirements": ["LD-REPO-005"],
  "versions": "Desktop parent d97cf808; same native-review-close.json public archive graph (API ce1a786e, Design Core 2e6fa2d8); no dependency/native frame changes",
  "files": [
    "MIGRATION.md",
    "catalog/plugins/repository/Sync.stories.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-054.md",
    "spec/src/history/index.md",
    "src/lib/repository/sync-application.ts",
    "tests/renderer/repository-sync.test.mjs"
  ],
  "contractReview": "Restore the existing all-file writer boundary: preview and physical apply stay protected; persist/clear the original recovery request outside that guard so App configuration writers can run. Reacquire protection before applying the exact preview, preserving its original expected tree, connection revision and request ID. Native stale-tree/revision checks reject changes during the gap; unknown outcomes keep the original request and never republish blindly. This is Desktop orchestration, not an API or native authorization change. Source inspection confirms host/repository/sync.rs retains fresh revision admission and original receipt reconciliation.",
  "milestoneReview": "M14/M14.5 remain Partial on their original gates. Focused controller and cold production-component browser proof fixes a real persistence defect but does not replace cold actual-native/live-provider two-device, offline, conflict or unknown-outcome qualification. M14.7 retains its sync dependency and real Forgejo gate; E-REPO-053 retains storage/adoption qualification. AI, compute, release/publication/signing and visual approval remain separate.",
  "runs": [
    {
      "name": "protected-recovery-before",
      "command": "node --import tsx --test tests/renderer/repository-sync.test.mjs",
      "result": "fail",
      "failures": 6,
      "note": "sync-persistence-before.log: 9/15 pass, 6 fail after enforcing the actual App recovery-writer protection rule in the existing fixture. Automatic merge/publication, conflict resolution, unknown apply, keep-current recovery and explicit Pull cannot persist because applyCandidate calls save inside the all-file guard. The actual analogous import failure is retained in E-REPO-053."
    },
    {
      "name": "direct-controller-and-publication-after",
      "command": "node --import tsx --test tests/renderer/repository-sync.test.mjs tests/renderer/repository-publication.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "sync-persistence-after.log: 19/19 pass. Existing fixture now rejects every protected recovery write while requiring protected preview/apply. New post-persistence stale-file case retains the exact expected tree and original request, reports attention/recovery and cannot publish. Existing cancellation, pause, unknown apply, conditional clearing, original publication observation, pull-only intent and explicit Push/count cases remain intact."
    },
    {
      "name": "types-and-source-ownership",
      "command": "pnpm check:types\npnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "sync-persistence-types.log: zero Svelte errors/warnings. Both source-boundary logs pass; no copied API code, package changes, private App access or production fixtures."
    },
    {
      "name": "catalog-completion-race-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Sync.stories.ts catalog/plugins/repository/UpstreamStatus.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "sync-persistence-catalog.log: 11/12 pass. CleanMergeAndPush observed the fixture publication counter before the final controller/UI lastSuccess update. Replace only its immediate getByText with awaited findByText; retain the successful sync text and switch/disabled action assertions."
    },
    {
      "name": "cold-affected-catalog-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Sync.stories.ts catalog/plugins/repository/UpstreamStatus.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "sync-persistence-catalog-final.log: both exact families pass 12/12 in a fresh desktop/light Chromium process with production plugins and interaction/axe checks. Includes clean merge/push, conflict resolution, offline recovery, background transfer, unknown apply and footer actions/count states. Existing Storybook annotation/deprecation advisories remain. Fake transfers do not qualify native/live provider IO."
    },
    {
      "name": "generated-summary-evidence-coverage-before",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "sync-persistence-progress.log and sync-persistence-spec.log correctly reject missing fresh evidence coverage for generated MIGRATION.md after raw table regeneration. Add that actual generated file to this record and format it; do not alter a milestone status, gate or validator."
    },
    {
      "name": "mapped-progress-and-specification-after",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:check\npnpm exec prettier --write spec/src/history/E-REPO-054.md",
      "result": "pass",
      "failures": 0,
      "note": "sync-persistence-progress-final.log: 41 tasks/194 records pass. sync-persistence-spec-final.log: validation, Rust formatting, mdBook and mapped source-first pass, all four lanes. Generated summary/evidence coverage and scoped formatting are repaired without changing statuses or original completion gates. Main review remains renderer-ready with source HMR and Storybook remains running; no native/provider qualification or full product suite is claimed."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Original M14.4 GitHub sign-in/setup/fresh-device restore, M14.5 cold actual-app/live-provider two-device/offline/conflict/unknown-outcome flows and M14.7 real Forgejo remain open. No new native binary or provider run is claimed for this controller slice; those acceptance gates require the configured disposable providers requested from the user. Full root/catalog/platform matrices, managed AI, first-after-build readiness timing, release/signing/publication and visual baselines remain separate."
  ]
}
```
