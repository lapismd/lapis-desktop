# Native storage migration and original-history adoption

```json
{
  "id": "E-REPO-053",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14", "M14.7"],
  "requirements": ["LD-REPO-005", "LD-VAULT-002", "LD-FILE-003"],
  "versions": "macOS ARM64; Desktop parent 23c35d9a; public archive graph native-review-close.json with API ce1a786e and Design Core 2e6fa2d8",
  "files": [
    "MIGRATION.md",
    "PLAN.md",
    "docs/automatic-vault-backup-progress.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-053.md",
    "spec/src/history/index.md",
    "src/lib/repository/adoption-controller.ts",
    "tests/desktop/repository-adoption.test.mjs",
    "tests/desktop/repository-storage.test.mjs",
    "tests/renderer/repository-adoption.test.mjs"
  ],
  "contractReview": "Unchanged LD-REPO-005 native acceptance. Storage changes must use the real plugin Settings and guarded native move/reload, preserve current editor/file bytes and exact retained checkpoints, and remain selected through cold processes. External layout must keep repository metadata outside the vault. Original-history adoption must preserve the separate repository and current files while making recorded ancestry available through managed history. No private App state, mock filesystem/provider, arbitrary native path or substitute authority qualifies these UI gates. Adoption prepares editor writers before persisting the original request outside the all-file guard, reacquires protection for native import, and clears recovery after release. This fixes reentrant App configuration writes without weakening writer protection or changing native request identity.",
  "milestoneReview": "M14.7 stays Partial: actual native storage/adoption and independent source readers are qualified here, but real Forgejo and its original M14.5 synchronization dependency remain open. M8.5 and M14.6 remain Done. No AI/provider/release gate is promoted and no native request, admission or writer contract is weakened.",
  "runs": [
    {
      "name": "native-storage-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-storage.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "storage-ui-before.log: root move, exact saved file and cold checkpoint survive; test incorrectly expected aria-pressed on the single-selection radio. Public ToggleGroup uses data-state=on (and aria-checked), unlike multiple-selection aria-pressed. Correct only the harness assertion."
    },
    {
      "name": "native-storage-round-trip",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-storage.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "storage-ui-after.log: 1/1 actual native test passes across three cold processes. Real Settings moves external -> root .jj -> original external vault-ID directory, with actual reloads, preserved latest editor bytes, exact checkpoint through root reopening, original retained commit still in JJ Log and external selection after cold reopening. storage-ui-vJBQFD/storage-ui-receipt.json retains exact witness values."
    },
    {
      "name": "native-adoption-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-adoption.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "adoption-ui-before.log: actual Settings import fails with App toast File editing is protected: .lapis/app.json. Recovery persistence was called inside the all-file writer guard. No original-history proof is claimed; adoption-ui-JbUBWT retains body/screenshot diagnostics."
    },
    {
      "name": "controller-preparation-expectation",
      "command": "node --import tsx --test tests/renderer/repository-adoption.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "adoption-controller-before.log: 6/7 pass after separating persistence from native protection; old expectation of one guard is now two (preparation and guarded mutation). Update that count and add explicit protected-writer regressions; keep all identity/cancellation assertions."
    },
    {
      "name": "focused-controller-and-types",
      "command": "node --import tsx --test tests/renderer/repository-adoption.test.mjs\npnpm check:types\npnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "adoption-controller-after.log: 11/11 pass, including protected persistence for import/resume/stop, failed reacquisition retaining the exact request, cancellation without intent, lost-response identity and close/drain. storage-adoption-types.log reports zero errors/warnings; architecture and ownership logs pass. No shared API change."
    },
    {
      "name": "adoption-catalog",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/HistoryAdoption.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "adoption-catalog.log: 10/10 existing production-component interaction/axe cases pass in a fresh desktop/light browser process, including failure toast, lost reply, original request recovery, loading, unavailable source and independent JJ/Op Log sources. Existing Storybook annotation/deprecation advisories remain."
    },
    {
      "name": "rebuilt-native-acceptance-app",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "storage-adoption-native-build.log: renderer and ARM64 Acceptance bundle build against unchanged native service sources and the same verified archive graph. Existing Rollup annotation/worker/chunk and compact-unwind linker advisories remain. No installed application replacement, signing or publication."
    },
    {
      "name": "native-adoption-harness-settlement",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-adoption.test.mjs",
      "result": "fail",
      "failures": 5,
      "note": "adoption-ui-after.log, adoption-ui-refetched.log, adoption-ui-close-control.log, adoption-ui-qualified.log and adoption-ui-picker-diagnostic.log retain five failed harness attempts after the product fix. Reacquire the button replaced during import, use the public Close settings action after its focus is removed, await asynchronous source options and normalize their leading whitespace, and preserve an already-selected commit after cold reopening instead of toggling it off. Managed import/diff and original metadata checks already pass before source/reopen harness failures. Exact byte, source hash, full SHA and cold-process assertions are retained."
    },
    {
      "name": "cold-native-adoption-and-source-readers",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-adoption.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "adoption-ui-final.log: 1/1 actual native test passes across two cold processes. Fixture uses explicit stock JJ 0.45.1 with isolated config. Real plugin Settings imports recorded ancestry; exact original commit and before/after file diff open in both managed and original source tabs before and after normal Quit/reopening. Current editor bytes and the unsnapshotted independent file are preserved; every original .jj/.git file hash matches before/after import, reads and both closes. No mock service or private App access. adoption-ui-*/adoption-ui-receipt.json retains exact SHA, current bytes and original metadata witnesses."
    },
    {
      "name": "mapped-progress-and-document-gates",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "storage-adoption-progress.log: 41 tasks/193 records pass with all original statuses/dependencies/gates retained. storage-adoption-spec.log: validation, Rust formatting, mdBook and mapped source-first pass (four lanes). M14.7 selects this native evidence while retaining real-provider acceptance. No full product/platform suite or visual baseline is claimed."
    },
    {
      "name": "cold-independent-file-and-final-document-confirmation",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-adoption.test.mjs\npnpm check:progress\npnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "adoption-ui-final-cold-files.log: 1/1 passes after explicitly adding the independent unsnapshotted file assertion after cold reopening, alongside the exact editor bytes and all original metadata hashes. storage-adoption-progress-final.log and storage-adoption-spec-final.log retain passing progress and all four canonical lanes after final tracking/formatting. Wider lanes remain out of scope."
    },
    {
      "name": "assembled-evidence-format-before",
      "command": "pnpm exec prettier --check spec/src/history/E-REPO-053.md tests/desktop/repository-adoption.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Final JSON evidence assembly changes wrapping in E-REPO-053 only. Apply repository Prettier; native test/source and all original completion gates are unchanged."
    },
    {
      "name": "formatted-evidence-and-main-review",
      "command": "pnpm exec prettier --write spec/src/history/E-REPO-053.md\npnpm exec prettier --check spec/src/history/E-REPO-053.md tests/desktop/repository-adoption.test.mjs\npnpm check:progress\npnpm spec:check\nCARGO_BUILD_JOBS=2 pnpm exec tauri dev --no-watch\npnpm storybook:status -- --port 7491",
      "result": "pass",
      "failures": 0,
      "note": "Scoped formatting passes after the recorded JSON formatting repair. storage-adoption-progress-commit.log and storage-adoption-spec-commit.log pass progress and all four canonical lanes. Previous review PID 14399 and port 1431 listener were confirmed absent before starting one ordinary main review (no forced stop). storage-adoption-review-main.log reports renderer ready, live PID 11320 and Vite PID 10786; loopback renderer and Storybook both return HTTP 200. Storybook owned PID 41379 remains running. Original profile/vault and verified archive graph are preserved; no publication/signing or unrelated daemon restart."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "M14.4 real GitHub sign-in/setup/fresh-device restore, M14.5 live two-device/offline/conflict/unknown-outcome synchronization and M14.7 real Forgejo remain open. Full root/catalog/theme/platform matrices, managed AI, first-after-build readiness timing, release/publication/signing and visual baselines remain separate. No new Rust service check/test lane is needed for this renderer/controller correction; native bundle rebuilding and actual UI proof are recorded."
  ]
}
```
