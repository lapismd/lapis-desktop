# Native editable conflict presentation acceptance

```json
{
  "id": "E-CATALOG-016",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8.5"],
  "requirements": [
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-FILE-008",
    "LD-GOV-002",
    "LD-GOV-009"
  ],
  "versions": "macOS ARM64; Desktop parent aaa08cd1; API ce1a786e076af84ad35a5f20d337a0a679090100; Design Core 2e6fa2d8; local public archives only; API archive e301a7fe5733155fe932570387cdbcee58865fc9f391aa8b30aedf946f7ccce3",
  "files": [
    "tests/desktop/conflict-review.mjs",
    "tests/desktop/notes-conflicts.test.mjs",
    "spec/src/history/E-CATALOG-016.md",
    "tests/desktop/preview-conflicts.test.mjs",
    "src/components/files/conflict-review-view.ts",
    "catalog/plugins/desktop/FileConflicts.stories.ts",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "PLAN.md",
    "PLUGIN_MIGRATION.md",
    "MIGRATION.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/plugins.md",
    "spec/src/current/verification.md",
    "vite.config.ts",
    "tests/governance/dev-watch.test.mjs"
  ],
  "contractReview": "Unchanged original M8.5 native presentation gate. Retained conflicts must reveal Problems and open the shared editable three-way comparison. Actual native actions must preserve stale-decision refusal, exact file bytes, original and retired writer reset, retained drafts, diagnostic cleanup and guarded teardown. Adapt obsolete native harness selectors to the maintained Problems and MergeEditor controls; never substitute private App mutations or weakened byte/persistence assertions. The native run exposes a real shared-API defect: the blanket writer guard blocks closing a merge review whose state belongs to its App model. Source LN-WS-101 adds an explicit View close scope defaulting to full application protection, with identity/policy revalidation after awaits; only the Desktop review opts into layout-only closure. Whole-App shutdown and file editors retain the original global barrier. No consumer workaround or private type exception.",
  "milestoneReview": "M8.5 is Done at its unchanged original macOS ARM64 gate. E-CATALOG-009/010 retain complete source and theme/viewport qualification; the current source Design Core is clean at the consumed 2e6fa2d8. E-CATALOG-016 adds thirty affected interaction/axe executions and all eight actual native cases, including stale decisions, original and genuinely retired writer reset, staged merge retention, native accessibility and guarded teardown. M10/M13 managed AI, M14 provider/storage, release/cutover and visual-baseline approval remain separate.",
  "runs": [
    {
      "name": "native-conflict-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 --test-name-pattern='external changes block Close' tests/desktop/notes-conflicts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "presentation-conflict-before.log: the first native case still waits for the retired File conflicts overlay. Current production uses Problems and the editable merge view. Keep its stale-snapshot, exact-byte, shutdown and cold-reopen assertions while adopting the public UI path. No product behavior is waived."
    },
    {
      "name": "native-current-controls",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 --test-name-pattern='external changes block Close' tests/desktop/notes-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "presentation-conflict-after.log first refuses the obsolete shell-failure selector; presentation-conflict-body-after.log exposes an explicit-role selector on an implicitly named section. Use the existing body-owned native failure and named MergeEditor sections. presentation-conflict-region-after.log then passes the unchanged stale refusal, exact bytes and cold reopen case 1/1."
    },
    {
      "name": "native-complete-family-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs",
      "result": "fail",
      "failures": 3,
      "note": "presentation-native-family.log: 4/7 pass, including both actual native axe scans. Two old expectations assume an inactive tab close control and the original hover card stay displayed while the new review tab is active. Assert that the original tab remains reachable and its complete draft is in the review. The edited-result case exposes the real source defect: the global writer guard prevents closing its review. Exact disk and shutdown assertions remain unchanged."
    },
    {
      "name": "consumer-review-close-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/FileConflicts.stories.ts -t 'Retained Merge After Review Close'",
      "result": "fail",
      "failures": 1,
      "note": "presentation-review-close-before.log: the real-shell production-component reproduction fails 1/1 against the preceding API, even with the review declaring its proposed layout-only policy. This confirms the fix is required upstream rather than a consumer-only opt-out."
    },
    {
      "name": "source-close-policy-qualified",
      "command": "See lapis-notes/spec/records/2026-10-20-layout-only-view-close.md",
      "result": "pass",
      "failures": 0,
      "note": "API ce1a786e: before 1 fail/5 pass; final 153/153 direct workspace/file-view/persistence tests include seven close-policy cases. New view method and matching public declaration are generic and default to application; absent/unknown/mixed targets, changed identity/policy and App shutdown retain full protection. API check/build/publint/packed types, all six canonical lanes, App ownership and specification regressions pass. No release/signing."
    },
    {
      "name": "public-close-policy-intake",
      "command": "pnpm --dir packages/api pack --out /Users/stevejuma/code/lapismd/lapis-notes/.local/packages/layout-only-close/lapis-notes-api-0.1.4.tgz\nNormal AppKit terminate of verified review PID 4182\npnpm storybook:stop -- --port 7491\npnpm local:install .local/archives/native-review-close.json",
      "result": "pass",
      "failures": 0,
      "note": "presentation-review-normal-quit.log returns true; review/dev processes exit normally. All fourteen archives verify before installation, then all fourteen public routes resolve. Only API changes to ce1a786e, SHA256 e301a7fe5733155fe932570387cdbcee58865fc9f391aa8b30aedf946f7ccce3; other thirteen routes, tracked dependency files and review/vault data remain unchanged. Existing Svelte peer and optional build-script warnings remain."
    },
    {
      "name": "exact-review-close-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/FileConflicts.stories.ts -t 'Retained Merge After Review Close'",
      "result": "pass",
      "failures": 0,
      "note": "presentation-review-close-after.log: the exact formerly failing case passes 1/1 against the new public archive, with no private App state or consumer guard override. Uses the real tab close button, confirms the unresolved draft and disk bytes remain, reopens through Problems, restores the exact staged merge, then saves and clears its diagnostic."
    },
    {
      "name": "type-option-correction",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 1,
      "note": "presentation-types.log finds an unsupported Testing Library exact option. The literal role name already matches exactly; remove the unsupported redundant option while retaining the full literal accessible name. No product or assertion semantics change."
    },
    {
      "name": "affected-catalog-configurations",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/FileConflicts.stories.ts\nLAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/FileConflicts.stories.ts\nLAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/FileConflicts.stories.ts -t 'Retained Merge After Review Close'\nLAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/FileConflicts.stories.ts -t 'Retained Merge After Review Close'\npnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "All thirty focused interaction/axe executions pass: fourteen complete conflict-family cases per desktop theme and the new close/reopen case in both narrow themes. presentation-catalog-{desktop,narrow}-{light,dark}.log. Final types report zero errors/warnings in presentation-types-final.log. Original full source/catalog theme/viewport qualifications remain in E-CATALOG-009/010; they are not claimed as new aggregate runs."
    },
    {
      "name": "native-current-ui-seven-cases",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json\nLAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "presentation-native-build.log builds the actual ARM64 bundle with the new public API and production review opt-in. presentation-native-family-after.log passes all seven cases: both actual native axe scans, stale-decision refusal and cold retained results, original editor and preview recovery, preserved owner tabs after refused closure, editable staged merge retained across review close/reopen, application Quit still refused after the review UI closes, exact merged UTF-8 bytes, cleared diagnostic and later ordinary writer saving. Existing annotation/empty-worker/chunk-size and linker unwind warnings are retained."
    },
    {
      "name": "retirement-completion-audit",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 --test-name-pattern=\"closing a preview's owning tab\" tests/desktop/preview-conflicts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "presentation-preview-retirement.log: the proposed assertion that opening a review retires the modified preview is false; that editor remains mounted. Do not use those seven cases as retired-writer proof. Remove the incorrect retirement assumption and add a separate real external-deletion scenario that actually removes the preview editor while its failed write stays retained."
    },
    {
      "name": "actual-native-retired-writer",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 --test-name-pattern='deleted preview recovery' tests/desktop/preview-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "presentation-native-deleted-retired.log passes 1/1. Real filesystem deletion retires the actual editable preview DOM/binding; the complete local draft remains in the App-owned conflict. Quit stays blocked while the native file remains absent. Editing and saving the merged result recreates exactly its UTF-8 bytes through conditional native IO, resets the retired writer and permits ordinary native shutdown. No fake writer, forced teardown, private App access or mocked file service. Final complete helper-consuming family rerun follows."
    },
    {
      "name": "complete-native-family-final",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "presentation-native-family-final.log: all eight actual native cases pass in serial cold processes. Includes the separate externally deleted preview and retired-writer reset, both native axe scans, original draft/disk recovery, fresh-vs-stale decisions and cold reopening, editable merge retained after review closure, full application barrier while the review is closed, exact merged bytes and later writer saving. No shortened assertions, fake native IO, forced review quit or private App access."
    },
    {
      "name": "source-provenance-and-review-readiness",
      "command": "jj st in design-core\nCARGO_BUILD_JOBS=2 pnpm exec tauri dev --no-watch\npnpm storybook:start -- --port 7491",
      "result": "pass",
      "failures": 0,
      "note": "Design Core default is clean; its last source commit is the consumed 2e6fa2d8. presentation-review-main.log: ordinary main review app compiles, runs and reports renderer ready; process PID 77190 and Vite HTTP 200 confirm the live restart. Storybook reports owned listener PID 41379 at 7491. Normal AppKit Quit preserved the previous profile/vault before dependency installation; no force termination or reset. Existing linker/logo URL advisories remain. This startup is separate from the eight actual native acceptance cases."
    },
    {
      "name": "catalog-contract-mapping-draft",
      "command": "pnpm check:progress\npnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "presentation-progress-final.log passes 41 tasks/192 records; presentation-spec-final.log passes validation, Rust format and mdBook, then requires the catalog-owning plugins chapter. Add the M8.5 production-component/native-IO boundary acknowledgement without changing a gate or validator. Current canonical limits remain enforced."
    },
    {
      "name": "bounded-verification-prose",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "presentation-spec-qualified.log refuses verification.md at 32920 bytes. Condense the new qualification summary to retain the existing 32768-byte limit; no chapter limit or requirement is relaxed."
    },
    {
      "name": "review-generated-output-watch-before",
      "command": "node --import tsx --test tests/governance/dev-watch.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "presentation-dev-watch-before.log reproduces five real Vite full-reload messages from generated spec/book, spec/.generated, .local preview, src-tauri/target and storybook-static HTML. This matches the repeated generated-page reloads observed in the normal review log while building docs. The real source HTML control also reloads correctly. Fix only development watch exclusions; no application vault watcher, resource grant or production build changes."
    },
    {
      "name": "development-watch-cold-after",
      "command": "node --import tsx --test tests/governance/dev-watch.test.mjs\nCARGO_BUILD_JOBS=2 pnpm exec tauri dev --no-watch\npnpm check:types\npnpm check:architecture\npnpm check:app-ownership\npnpm check:progress\npnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "presentation-dev-watch-after.log: cold real Vite regression passes 1/1, retaining positive source HTML reloads while all five generated HTML roots emit zero full-reload messages. Development ignores generated specs/builds, .local and JJ metadata; production/vault watching and resource admission are unchanged. Verified review PID 77190 exits by normal AppKit terminate before configuration change. presentation-review-watch-fixed.log reports the fresh ordinary renderer ready; no generated-spec page reloads occur during the subsequent mdBook build. Final types report zero errors/warnings; source/App ownership and progress (41 tasks/192 records) pass. presentation-spec-complete.log passes all four canonical lanes. Original M8.5 is complete; broader unrelated and release gates remain separate."
    }
  ],
  "remaining": [],
  "completedGates": {
    "M8.5": "Latest local Design Core, themed editor/recovery presentation, Problems-based conflict decisions and product-only Terminal previews pass their affected source/catalog and native acceptance lanes."
  },
  "deferredQualification": [
    "No new full repository/catalog/platform matrix or visual baseline is claimed. Earlier completed source/catalog matrices remain selected evidence; focused direct consumers are qualified here. Managed AI, real-provider backup/storage gates, release/publication/signing and final cutover remain separate."
  ]
}
```
