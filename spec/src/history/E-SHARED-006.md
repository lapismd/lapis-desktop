# Shared-screen final qualification and live view-state ordering

```json
{
  "id": "E-SHARED-006",
  "date": "2026-10-23",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M15.1"],
  "requirements": [
    "LD-CAT-001",
    "LD-AI-002",
    "LD-REPO-002",
    "LD-LIFE-001",
    "LD-POP-004"
  ],
  "versions": {
    "desktopParent": "22459b9c",
    "baseline": "52516ae9",
    "sharedUiCode": "5a88a348",
    "designCoreCode": "69f48e54",
    "notesApi": "e159faad",
    "plugins": "99806c68"
  },
  "contractReview": "Finish workspace projection and layout persistence while views are still mounted, then join rendered shell cleanup before retiring plugin resources. Early unmount loses operation pins; merely restoring synchronous ordering leaves the cold imported-view close failure. Preserve exact pins, normal native close, drafts and original source bytes. No timeout, visibility, or no-replay assertion is weakened.",
  "milestoneReview": "M15.1 remains In progress pending final four-mode interactions, source qualification, current-bundle native acceptance and final builds. Existing provider, distribution and visual-review gates remain separate.",
  "runs": [
    {
      "name": "native-first-current-bundle",
      "command": "node --test --test-concurrency=1 tests/desktop/repository-visible.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-local-imports.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-live-history.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "5 pass/2 fail. OpenCode cold close hit unchanged forced-cleanup bound; visible history lost the restored operation pin. Both require requalification and are not waived."
    },
    {
      "name": "live-host-state-before",
      "command": "node --import tsx --test --test-name-pattern='captures live view state' tests/renderer/notes-dispose.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Awaiting beforeDispose yields to shell unmount before the host snapshots its exact historical operation."
    },
    {
      "name": "live-host-state-after",
      "command": "node --import tsx --test tests/renderer/notes-dispose.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 6 pass after restoring synchronous capture-before-unmount order. Existing writer, failed-preflight, related-window and final-persistence assertions remain unchanged."
    },
    {
      "name": "corrected-visible-restart",
      "command": "node --test --test-concurrency=1 --test-name-pattern='OpenCode|cold visible history' tests/desktop/ai-local-imports.test.mjs tests/desktop/repository-visible.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Visible history preserves dirty source, exact pins and native restart. The uppercase OpenCode pattern did not select the lowercase opencode case; its file-level pass is not import qualification."
    },
    {
      "name": "sync-order-native-matrix",
      "command": "node --test --test-concurrency=1 tests/desktop/repository-visible.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-local-imports.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-live-history.test.mjs",
      "result": "fail",
      "failures": 5,
      "note": "2 pass/5 fail. Four fail renderer startup readiness under heavy concurrent paging, while OpenCode reaches the Notes-ready display bound. No limits changed."
    },
    {
      "name": "admission-startup-exact",
      "command": "node --test tests/desktop/ai-admission.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "The unchanged hidden admission case passes on isolated retry, including no activation/focus, real caller scopes and cold reset."
    },
    {
      "name": "opencode-sync-order-exact",
      "command": "node --test --test-name-pattern='native opencode' tests/desktop/ai-local-imports.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Cold imported-view close still hits the unchanged 10-second forced-cleanup limit. Synchronous ordering alone is insufficient."
    },
    {
      "name": "joined-host-state-before",
      "command": "node --import tsx --test --test-name-pattern='workspace teardown' tests/renderer/notes-dispose.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The stronger regression models the public host joining asynchronous projection before capturing exact live view state."
    },
    {
      "name": "joined-host-state-after",
      "command": "node --import tsx --test tests/renderer/notes-dispose.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 7 cases pass. Host disposal completes before the awaited shell cleanup; plugin and metadata owners remain live through that cleanup."
    },
    {
      "name": "renderer-governance-sync-order",
      "command": "node --import tsx --test --test-concurrency=2 tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "405 pass on the intermediate synchronous correction. The final joined-order change requires a fresh complete rerun."
    },
    {
      "name": "agent-source-qualification",
      "command": "source full checks, four-mode Agent interactions, build-storybook and clean packed acceptance",
      "result": "pass",
      "failures": 0,
      "note": "213 units, 632 interaction/accessibility cases, zero type diagnostics, both package builds/publint, 62 families/366 variations and 140 compiled public examples. Source evidence commit a43947f6; unchanged implementation/archive 5a88a348."
    },
    {
      "name": "design-core-source-qualification",
      "command": "source check, test:unit, four fresh Storybook shards, exact toast, full workspace pointer, build-storybook and check:no-tailwind",
      "result": "pass",
      "failures": 0,
      "note": "914 units, 972 interaction/accessibility cases across 277 files, exact toast and all 16 pointer cases, zero diagnostics and static build. Unchanged implementation/archive 69f48e54."
    },
    {
      "name": "joined-host-first-native-retry",
      "command": "node --test --test-concurrency=1 --test-name-pattern='native opencode|cold visible history' tests/desktop/ai-local-imports.test.mjs tests/desktop/repository-visible.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Under overlapping heavyweight jobs, OpenCode cold close still exceeded forced cleanup; the visible case lost native foreground/current-Space visibility. Neither native assertion was changed."
    },
    {
      "name": "temporary-teardown-trace",
      "command": "current debug acceptance bundle; node --test --test-name-pattern='native opencode' tests/desktop/ai-local-imports.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Both warm and cold processes completed host, shell, related-window, metadata, plugin and service retirement. Temporary diagnostic logging was removed and does not ship."
    },
    {
      "name": "clean-final-native-exact",
      "command": "node --test --test-concurrency=1 --test-name-pattern='native opencode|cold visible history' tests/desktop/ai-local-imports.test.mjs tests/desktop/repository-visible.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "2 pass on the freshly rebuilt clean 596.05 MiB bundle. OpenCode cold close exits normally; strict foreground history preserves dirty source and exact pins across restart. No readiness, close, source-byte or visibility gate changes."
    },
    {
      "name": "joined-renderer-governance",
      "command": "node --import tsx --test --test-concurrency=2 tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 406 pass after the stronger asynchronous capture and cleanup regressions."
    },
    {
      "name": "current-native-service-tests",
      "command": "CARGO_BUILD_JOBS=2 MACOSX_DEPLOYMENT_TARGET=13.0 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "228 pass and 2 existing ignored across 45 binaries. Earlier stdio cold-start attempts timed out in two cases; exact unchanged stdio rerun passes both, then the complete lane passes."
    },
    {
      "name": "strict-native-checks",
      "command": "normal pnpm check:rust; cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked --features e2e -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Normal and acceptance all-target Clippy pass with warnings denied. The separately recorded debug link-size warning remains nonfatal bundler output, with no suppression."
    },
    {
      "name": "current-final-types",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Zero Svelte errors/warnings; both ownership/source audits pass."
    },
    {
      "name": "community-readiness-before",
      "command": "pnpm test:storybook catalog/plugins/repository catalog/plugins/ai --reporter=verbose",
      "result": "fail",
      "failures": 1,
      "note": "Desktop/light 440 pass; narrow/light 439 pass and one Community Tool Opt In queried a still-booting fixture. Other completed cases retain their assertions; original runner stopped before dark modes."
    },
    {
      "name": "community-readiness-exact",
      "command": "LAPIS_CATALOG_THEME=light LAPIS_CATALOG_VIEWPORT=narrow pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/shell/CommunityToolOptIn.stories.ts --reporter=verbose",
      "result": "pass",
      "failures": 0,
      "note": "Exact 1 pass after awaiting the owned fixture.ready promise before the unchanged ready-state, permission and persistence assertions. No timeout changed."
    },
    {
      "name": "baseline-review-acceptance",
      "command": "desktop/light vitest catalog ChatLayoutReview, History and Operations -t 'Conversation$|Pinned History And Diff$|Operation Graph And Changes$'",
      "result": "pass",
      "failures": 0,
      "note": "All 3 matching before stories pass on source 52516ae9 and the corrected public dependency cohort; 32 unrelated cases deliberately filtered. Tracked baseline source/dependency files remain unchanged."
    }
  ],
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/shared-screen-integration.md",
    "spec/src/current/windows.md",
    "spec/src/history/E-SHARED-006.md",
    "src/components/views/NotesWorkspace.svelte",
    "src/lib/notes/notes-dispose.ts",
    "tests/renderer/notes-dispose.test.mjs",
    "catalog/plugins/ai/shell/CommunityToolOptIn.stories.ts",
    "docs/shared-ui-migration.md",
    "spec/src/current/ai.md",
    "spec/src/current/plugins.md",
    "spec/src/current/governance.md"
  ],
  "remaining": [
    "Complete four-mode Desktop matrix and current native rerun.",
    "Final production/static builds and current full checks.",
    "Visual review and distribution; accepted historical audit/format findings stay separate."
  ]
}
```

E-SHARED-005's additional asynchronous unmount ordering was incorrect for the
workspace host: unmount can discard the view state it still needs to capture.
Restoring the original synchronous boundary repaired visible pins but did not
repair OpenCode cold close. The public workspace host first joins asynchronous
projection and writes, so it must finish while rendered views remain mounted.
Only then does Desktop unmount its shell and join the Svelte cleanup before
retiring plugin resources. Stronger regressions cover both pin capture after
that asynchronous join and blocked cleanup retaining plugin owners. The
source-owned Explorer rejection fix remains responsible for late UI opens.
Historical evidence is unchanged and the unsuccessful approach stays recorded.

Transitive import analysis corrects the initial direct-import assumption: 31 of
the selected 99 families reach NotesWorkspace through NotesDemo. Across the
whole catalog, 36 families reach this lifecycle boundary, including the
Workspace, Background, desktop Shell/Startup and Terminal stories. Those
families require four-mode qualification after the final ordering change;
earlier passes remain evidence only for unchanged inputs.

Agent UI static and packed acceptance now pass: 62 foundation families, 366
variations, 140 public-import examples, strict types and Vite production build.
The ordinary registry attempt stopped on unpublished JJ History. A primary-file
replacement rejection and pnpm ENAMETOOLONG were resolved using a sibling-only
review hook and short copies of checksum-identical public archives. No tracked
manifest, lockfile, package source or assertion was altered for validation.

The first broad Design Core process stalled after 960 completed cases; the next
completed 971 cases but its Sheet Preview browser connection closed before a
result. Those attempts are not complete passes. Fresh process shards qualify the
whole source lane without waiving a runtime or test error.

The two separate dark consumer runs and a production build were interrupted to
reduce severe concurrent paging; they are not complete passes. The original
four-mode runner remains responsible for the complete matrix. No test inputs,
assertions, limits or tracked configuration changed for this scheduling choice.

The pinned cohort remains 19 checksum-verified archives across 70 actual import
routes. A freshness query without the isolated source map correctly refused an
unrelated dirty source checkout. With the source map it reports five newer
source revisions: three UI documentation revisions and two independently moving
JJ package revisions. This migration retains its tested code/archive inputs; it
does not silently refresh those unrelated packages during qualification.

The original comparison initially could not enable AI: its older MemoryVault
archive lacked conditional writes. The before checkout now uses 17 declared
packages from the same verified cohort through ignored local review setup.
Temporary dependency declarations align archive semver during installation and
are restored byte-for-byte afterward with the lockfile. The primary shared UI
packages are excluded because the original implementation does not declare or
use them. The first attempts correctly rejected undeclared UI archives and
incompatible old Mira/Design Core ranges. No source alias, dependency patch or
tracked baseline code changed; source 52516ae9 still owns the original layouts.
