# Staged native Desktop Search owner

```json
{
  "id": "E-CORE-030",
  "date": "2026-10-26",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.5"],
  "requirements": [
    "LD-DB-001",
    "LD-DB-002",
    "LD-DB-003",
    "LD-DB-004",
    "LD-SESSION-001",
    "LD-NAV-001",
    "LD-NAV-002",
    "LD-NAV-003",
    "LD-NAV-005",
    "LD-NAV-007",
    "LD-NAV-008",
    "LD-CAT-003"
  ],
  "contractReview": "Selected Core Search reuses the existing startup-fixed metadata authority, App observer and admitted database transport. Renderer remains the default; no additional flag, screen, scheduler or client writer fallback. Native recovery must use native rebuild controls.",
  "milestoneReview": "M16.5 Done: original default/admission, native lexical/semantic/provider, detached lifetime, disabled/safe-mode/re-enable, cold retained-workspace, visible recovery, catalog and source gates pass. Renderer remains default; Tasks adoption and complete R3/default cutover retain separate gates. M16.4 keeps its original metadata-only evidence.",
  "versions": {
    "desktopParent": "4bcb7e0911145453b30474bc80c2852cecb14f5b",
    "searchSource": "e0144c6a88f52fd2f71108728980830dc127fa1e",
    "searchArchiveSha256": "2e7f0c428c04344105305a755a657c53ff61b710ed47c95d2ad9596d2476f680",
    "apiArchiveSha256": "aa1a5d5212cd6a78d4f71a54193d8ceed9b0ab74fa4d22aadb56ab68cf552f5f",
    "npmArchives": 26,
    "otherArchiveDigests": "23unchanged from final M16.4; API,Search,DesignCore source-owned changes",
    "apiSource": "eea52e15aa55ad8988ffe2fda00b58f067333d0c",
    "designCoreArchiveSha256": "6f33b681e0050123cbd0501ffe6bfdc37d74625b2687a7e283e06943edda31f6",
    "designCoreSource": "0d7a92893bc645814581efe5e1fbd0a93a1e7eed",
    "searchQualifiedSnapshot": "37133463cf03435f14c5275c1daa89f715e7f336",
    "apiCommittedSource": "a1b0dfde5941e0f0dfd73b7b3735bdab990cb7e3"
  },
  "runs": [
    {
      "name": "native-search-before",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native LAPIS_DESKTOP_ACCEPTANCE_BINARY=<qualified M16.4 acceptance binary> node --import tsx --test --test-concurrency=1 tests/desktop/search-owner.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Actual hidden macOS WebView reaches selected Core vault/database but select_search is rejected by metadata-only IPC exactly as expected. Failed-call teardown also logs ECONNREFUSED after fixture cleanup; no original native assertion is loosened."
    },
    {
      "name": "native-recovery-story-fixture-before",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/desktop/SearchOwner.stories.ts --testNamePattern='Native Recovery'",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Cold Docker5852e09a-c975-4ca9-9659-4384a5c74546 first mode: new story asserted asynchronous Search view immediately after App startup. Await actual visible production Search panel; no timeout or product assertion loosened."
    },
    {
      "name": "native-recovery-story-before",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/desktop/SearchOwner.stories.ts --testNamePattern='Native Recovery'",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Cold Docker17472bed-1753-4f58-b546-636a7f8533ba reaches real Search view and safe-mode Rebuild Search, then direct client generated-state write is rejected. Expected native rebuild success is absent. Route action through the admitted App observer; native service proof remains separate."
    },
    {
      "name": "native-recovery-story-after-routing",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/desktop/SearchOwner.stories.ts --testNamePattern='Native Recovery'",
      "result": "fail",
      "tests": 3,
      "failures": 1,
      "note": "Coldb003721d: desktop/narrowlight2pass;desktopdark functional play passes but selected shared picker label fails axe contrast2.32required4.5. Source-owned DesignCore repair ouxvrpqu has exact before5pass/1fail,after6/6pass; full owner qualification/public package pending. No consumer CSS override, no a11y exemption. Fourth mode not reached."
    },
    {
      "name": "native-search-control-service",
      "command": "CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 cargo test --locked --manifest-path src-tauri/Cargo.toml --test database_indexing",
      "result": "pass",
      "tests": 3,
      "failures": 0,
      "note": "Frozen native source snapshot with current Desktop Rust files; explicit/default/window/physicalroot/lifetime assertions remain, select_search is parsed as typed control. Actual native lexical/semantic/recovery remain separate."
    },
    {
      "name": "concurrent-workspace-lease",
      "command": "node scripts/validation.mjs run check:types + test:storybook",
      "result": "fail",
      "tests": 0,
      "failures": 0,
      "note": "Initial simultaneous same-workspace requests rejected by the shared cache lease before product tests. Continue serially per workspace; separate frozen workspaces own parallel catalog halves."
    },
    {
      "name": "catalog-new-visible-states-before",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/desktop/SearchOwner.stories.ts",
      "result": "fail",
      "tests": 6,
      "failures": 3,
      "note": "6cc87417:firstmode3pass/3newfixture failures. Busybutton accessible label is Rebuilding Search\u2026, and failed recovery appears in both notification and SafeMode. Assert the actual busylabel and scope recovery text to production SafeMode; no product/assertion weakening."
    },
    {
      "name": "catalog-new-visible-states-after",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/desktop/SearchOwner.stories.ts",
      "result": "pass",
      "tests": 24,
      "failures": 0,
      "note": "Coldb103ca34:6stories x2themes x2viewports pass with final aa1aAPI,aa1cSearch and6f33DesignCore publicarchives; ordinary axe and fatalruntime guards retained."
    },
    {
      "name": "native-search-result-shape-before",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/search-owner.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "New native fixture incorrectly read hit.path. Public AppDatabaseSearchResult owns path at document.path; correct all query assertions, retaining exact expected paths."
    },
    {
      "name": "native-search-embedding-control-contract-before",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/search-owner.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "New fixture incorrectly expected database rebuildSearchIndex rejection. Notes rust-indexing-lifetime contract retains native embedding controls; Rust submits Rebuild through its existing actor. Replace invented denial with native rebuild success and retain/strengthen generated upsert+delete rejections. Recovery still requires full native owner refresh."
    },
    {
      "name": "native-search-owner-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native LAPIS_DESKTOP_ACCEPTANCE_BINARY=<frozen acceptance app> node --import tsx --test --test-concurrency=1 tests/desktop/search-owner.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "note": "Actual hiddenmacOSWebView: explicit Coretypedselection,lexical andnative token-hash vectorquery,clientdocument upsert/delete fence,admitted nativeembeddingcontrol,detach externalcreate/rename/delete,unsupported placement,rebuild anddisable pass. No ONNX/provider-download claim."
    },
    {
      "name": "native-recovery-absence-shape-before",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/search-recovery.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Fresh-App safe-mode journey already proves explicit owner release and metadata arrival; missing Search document is public undefined, not null. Correct exact absence expectation."
    },
    {
      "name": "native-recovery-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native LAPIS_DESKTOP_ACCEPTANCE_BINARY=<frozen acceptance app> node --import tsx --test --test-concurrency=1 tests/desktop/search-recovery.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "note": "Actual visibleCoreApp Searchselected -> guardedCmdR withoptionalSearchomitted -> generatedwriterprobe nowallowed ->externalfile metadataonly ->nativerebuild ->normalrestart reselectsSearch andindexesnewfile. Full app/coreplugin settings bytes preserved. Two expected WebDriver generated-write denial logs correspond to asserted fences, not functional failures."
    },
    {
      "name": "native-original-suite-fixture-before",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=core node --import tsx --test --test-concurrency=1 <originalMetadataSearchGraphSettingsACPfiles>",
      "result": "fail",
      "tests": 17,
      "failures": 17,
      "note": "Harness omitted required LAPIS_DESKTOP_ACCEPTANCE_ROOT. All17fail before native startup with undefined path. Supply fresh isolated temporary root without changing any original test."
    },
    {
      "name": "native-normal-and-e2e",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm exec tauri build --debug --bundles app [--features e2e --config src-tauri/tauri.e2e.conf.json]",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Both frozenarm64bundles build; staged helpers reused unchanged, no source helper rebuild. Ordinary bundleaudit0automationmarkers; signingdeferred. Strict normal/e2e all-targetClippy bothpass. Native-installed26packages9016files match verifiedarchives. Preliminary1527non-doc/spec sourcefiles match; refresh final receipt after fixture-only edits."
    },
    {
      "name": "native-original-core-first",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=core LAPIS_DESKTOP_ACCEPTANCE_ROOT=<fresh isolated root> node --import tsx --test --test-concurrency=1 <original Metadata/Search/Graph/settings/ACP files>",
      "result": "fail",
      "tests": 17,
      "failures": 3,
      "note": "14 pass. Two Search settings recovery cases target retired conflict banners; adapt only those selectors to existing Problems/merge helpers. Disabled-Search/Open Tags metadata case fails once but passes unchanged in a separate cold diagnostic; rerun complete original suite after source repair."
    },
    {
      "name": "native-search-settings-current-problems",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=core node --import tsx --test --test-concurrency=1 tests/desktop/navigation-search-settings.test.mjs",
      "result": "fail",
      "tests": 3,
      "failures": 1,
      "note": "2 pass. Current Problems/merge flow writes exact recovered disk bytes and clears conflict, but live Show more context remains stale. Confirmed source Search lacks configuration recovery observation. Repair plugin/panel in owning Plugins repository; no consumer workaround or loosened assertion."
    },
    {
      "name": "native-api-inventory",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_BINARY=<frozen acceptance app> LAPIS_DESKTOP_ACCEPTANCE_ROOT=<fresh isolated root> node --import tsx --test --test-concurrency=1 tests/desktop/core-file-service.test.mjs tests/desktop/metadata-owner.test.mjs tests/desktop/search-owner.test.mjs tests/desktop/search-provider.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-service-lifetime.test.mjs tests/desktop/repository-indexed-search.test.mjs tests/desktop/repository-backup-recovery.test.mjs tests/desktop/repository-backup-resume.test.mjs",
      "result": "pass",
      "tests": 15,
      "failures": 0,
      "note": "All original hidden native API cases plus new selected Search owner pass against API aa1a, Search aa1c and Design Core 6f33 public archives. No helper rebuild."
    },
    {
      "name": "source-design-core-contrast-qualified",
      "command": "Design Core pnpm checks, final spec/doc, public pack and cold consumer acceptance",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Owner commit 0d7a9289, aggregate e2eeeb50 and final governance abc3c624 pass. Includes 922 unit, 36 Node, 986 catalog, 16 browser, 17 shell, 3 AI and 153 Shadcn cases with one retained skip. Public archive SHA 6f33 unchanged; six existing low audit findings retained. No consumer override."
    },
    {
      "name": "source-search-settings-recovery-diagnostic",
      "command": "LAPIS_PLUGINS_VALIDATION_RUNTIME=native pnpm --dir packages/search exec vitest run src/lib/native-search-manager.test.ts --maxWorkers=1",
      "result": "pass",
      "tests": 25,
      "failures": 0,
      "note": "Private owner repair observes existing App configuration events, refreshes plugin/panel snapshots, preserves recovered values on next partial save and reconciles native controls. Original whole Search regression before 109 pass/1 fail, after 110 pass. Expanded exact lifecycle/filter/control target 25 pass. Owner Docker/full catalog/public artifact remain pending."
    },
    {
      "name": "catalog-complete-before-recovery-repair",
      "command": "node scripts/validation.mjs run test:storybook -- --shard=1/2; separate frozen workspace --shard=2/2",
      "result": "pass",
      "tests": 2056,
      "failures": 0,
      "note": "Cold receipts ca050f38 and 8fa6a1b8: all 514 cases across two themes/two viewports pass with API aa1a, Search aa1c and Design Core 6f33. Final recovery-only Search repair retains its own affected-cohort acceptance; no claim that this full run used the later package."
    },
    {
      "name": "native-settings-source-repair-after",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=core node --import tsx --test --test-concurrency=1 tests/desktop/navigation-search-settings.test.mjs",
      "result": "pass",
      "tests": 3,
      "failures": 0,
      "note": "Actual native1012 early public repair: immediate close/cold persistence, failed-save/blocked-close/retry and exact disk recovery/live-controls/next-partial-save all pass. Final stable-id type correction archive2e7 receives separate final native acceptance."
    },
    {
      "name": "native-original-suite-recovery-repair-after",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=core node --import tsx --test --test-concurrency=1 <original Metadata/Search/Graph/settings/ACP files>",
      "result": "fail",
      "tests": 17,
      "failures": 1,
      "note": "16 pass with early Search1012. Only disabled-Search/Open Tags fixture fails. Exact metadata file repeats 3 pass/1 fail. Diagnostic proves Settings remained mounted; unscoped dialog input receives Open Tags, while command palette query stays empty. No native query/index assertion fails."
    },
    {
      "name": "native-metadata-settings-close-after",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=core node --import tsx --test --test-concurrency=1 tests/desktop/navigation-metadata.test.mjs",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "note": "Wait for Search switch state change, use existing Close settings action, and await dialog unmount before opening command palette. All original navigation/disable/re-enable/query assertions retained; no timeout increase or shared-helper change. Full original suite repeats with final package."
    },
    {
      "name": "source-search-private-type-before",
      "command": "pnpm --dir packages/search check",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "note": "First owner Docker1ed952e2 catches panel private interface without manifest. Use existing stable search registry id instead of widening the interface. Exact host strict retry and final Docker strict both pass0errors/0warnings; final normal public pack is2e7."
    },
    {
      "name": "native-final-cohort",
      "command": "node .local/validation/native-final.mjs (sequential exact settings, original Core, new owner/recovery and canonical API inventory groups)",
      "result": "pass",
      "tests": 37,
      "failures": 0,
      "note": "Final2e7Search/aa1aAPI/6f33DesignCore actual macOS WebView:3settings+17originalCore+2newowner/recovery+15hiddenAPI pass in distinct fresh roots. Asserted denial logs remain expected. Original gates and final package payloads are retained. Vector control uses the actual native token-hash actor; downloaded ONNX/complete R3 provider journeys remain separate."
    },
    {
      "name": "catalog-final-recovery-impact",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/desktop/MetadataOwner.stories.ts catalog/plugins/desktop/SearchOwner.stories.ts catalog/plugins/desktop/Startup.stories.ts catalog/plugins/desktop/FileConflicts.stories.ts catalog/plugins/repository/Search.stories.ts",
      "result": "pass",
      "tests": 148,
      "failures": 0,
      "note": "Cold Docker27ae7d3d:5files/37cases in all4themes/viewports pass with final2e7Search,aa1aAPI,6f33DesignCore. This follows complete2056-case earlier cohort and source owning full Search17."
    },
    {
      "name": "portable-functional-and-build",
      "command": "node scripts/validation.mjs run test; run build; run build-storybook",
      "result": "pass",
      "tests": 1495,
      "failures": 0,
      "note": "All506Node+744AI+245Rust pass (2retained Rust ignores); final renderer and static catalog builds pass. Check/test snapshot used early1012Search; final builds/static and later strict checks select2e7. Rust/native source and all other package inputs are unchanged across that private stable-id correction."
    },
    {
      "name": "portable-check-format-before",
      "command": "node scripts/validation.mjs run check",
      "result": "fail",
      "tests": 0,
      "failures": 5,
      "note": "Parity,specvalidation,types and normal/e2e strictall-targetClippy pass. Formatter reports4newly edited/generated Markdown files and immutable E-AI-109. Format the4newfiles; retain only prior explicitly accepted E-AI-109 exception. Final exact formatter verification remains separate."
    },
    {
      "name": "desktop-mapped-chapters-before",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "fail",
      "tests": 0,
      "failures": 2,
      "note": "Canonicalvalidation,Rustformat and mdbook pass; spec-first identifies missing governance.md/migration.md mappings for native test registration. Both canonical chapter updates are now included. Final exact spec retry remains separate."
    },
    {
      "name": "source-recovery-owner-closure",
      "command": "Plugins source full1ed952e2, strict8f3debb2 and closure3a1819df",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Sourcee0144c6a is committed/clean; all runtime/test/story bytes equal qualifiedba1d987a and public2e7npm/0818495eruntime payloads.112units,25exact,Search17,all16strict/all16unit/all15buildtasks,static/public/spec pass. Reproduced parent shard4orchestratorloss plus unchanged Zod/CSV/release-lock findings remain recorded separately; latest standing user instruction accepts these inherited baselines for this slice. Exact last2LinkPreview cases pass; no assertion, threshold or runner changed. Fresh owner format/all3spec/Appownership pass."
    },
    {
      "name": "final-native-build-and-provenance",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm exec tauri build --debug --bundles app [--features e2e --config src-tauri/tauri.e2e.conf.json]; node scripts/check-bundle.mjs",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Final2e7 public Search: both macOS ARM64 bundles build. Ordinary bundle audit0automationmarkers,signingdeferred. Native26packages/9018files equal public archives; 1550non-spec/non-projected source inputs equal tested snapshot. Rustpins and existing AI acceptance helpers unchanged; no helper rebuild. Standing user cache approval used only for inactive compiler caches; apps/helpers/profiles/reports preserved."
    },
    {
      "name": "final-types",
      "command": "node scripts/validation.mjs run check:types",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Final2e7/aa1a/6f33 public archive cohort passes strict Svelte/TypeScript with0errors/0warnings."
    },
    {
      "name": "final-formatter-new-fixture-before",
      "command": "node scripts/validation.mjs run format:check",
      "result": "fail",
      "tests": 0,
      "failures": 2,
      "note": "Only immutable accepted E-AI-109 plus newly edited native metadata fixture need formatting. Format the fixture without changing its assertions, then repeat exact formatter; no historical evidence edit."
    },
    {
      "name": "final-spec-page-limits-before",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "fail",
      "tests": 0,
      "failures": 2,
      "note": "Generic governance and migration chapters each reached406physical lines after mapped notes. Consolidate their introductory checkpoint summaries within existing400linecap while preserving original requirements/gates; final exact specification retry remains separate."
    },
    {
      "name": "final-formatter-after",
      "command": "node scripts/validation.mjs run format:check",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "note": "All new source/tests/spec/generated files pass; only unchanged immutable E-AI-109 remains. Its prior explicit user formatting exception is retained, not widened."
    },
    {
      "name": "final-specification-after",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Cold Docker receipts 2549ecf9, 1cd17c91 and final status refresh 67591bba pass validation, Rust format, mdbook and mapped spec-first. Governance/migration remain within the original 400 physical-line limit. Local progress passes 53 tasks/305 evidence records. The final status-only timestamp refresh and generated summary pass targeted formatting; product assertions and historical evidence are unchanged."
    },
    {
      "name": "resume-frozen-input-verification",
      "command": "SHA256 verification of final-native-source-equality.json entries and the selected public archive inventory",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "All1550non-spec/non-projected source inputs still match the qualified native snapshot; all26selectedpublic archives retain exact digests. No native or product process is running. Shared source closure is being finalized in its owner; repeat only final changed-document checks."
    },
    {
      "name": "final-document-infrastructure-attempts",
      "command": "Docker ssh-cli and supported Docker-context spec:check; explicit-native check of frozen build copy",
      "result": "fail",
      "tests": 0,
      "failures": 0,
      "note": "All stop before checks: remoteSSH refused newconnections for both supported transports; unversioned native build copy lacksJujutsu metadata. No metadata/policy workaround added. Owned lease remains safely retained after inconclusive remote worker checks. Prior fullspec67591bba and all product receipts remain unchanged."
    },
    {
      "name": "final-changed-document-checks",
      "command": "Explicit-native spec:validate in versioned source; node scripts/progress.mjs; targeted Prettier",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Explicit-native spec:validate passes6validators/348chapters/108requirements in the versioned source; progress and targeted formatting pass. Only final source provenance,status,completedGates andUTCstamp changed after fullspec67591bba. Previous Rustformat,mdbook,spec-first and1550product/26archive inputs remain unchanged; no product/native test substitution. Initial targeted formatting found one generatedMIGRATION finding; format the generated projection and retain the progress check, then all3changed documents pass."
    }
  ],
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/desktop/SearchOwner.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/desktop/MetadataOwnerDemo.svelte",
    "catalog/support/desktop/SearchOwnerDemo.svelte",
    "scripts/desktop-acceptance.mjs",
    "scripts/desktop-api-tests.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/background.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/navigation.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-030.md",
    "spec/src/history/core/index.md",
    "src-tauri/src/database/indexing.rs",
    "src-tauri/src/host/indexing.rs",
    "src-tauri/tests/database_indexing.rs",
    "src/lib/notes/notes-recovery.svelte.ts",
    "tests/desktop/metadata-owner.test.mjs",
    "tests/desktop/navigation-metadata.test.mjs",
    "tests/desktop/navigation-search-settings.test.mjs",
    "tests/desktop/search-owner.test.mjs",
    "tests/desktop/search-recovery.test.mjs"
  ],
  "remaining": [],
  "completedGates": {
    "M16.5": "Explicit Core Search reuses the shared App observer and database admission; default/admission, lexical/semantic/provider, detached owner/disable/re-enable, cold Metadata/Search/Graph and recovery regressions plus all affected catalog cases pass without client writers or a new scheduler."
  }
}
```
