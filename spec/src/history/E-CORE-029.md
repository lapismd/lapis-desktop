# Staged native Desktop metadata owner

```json
{
  "id": "E-CORE-029",
  "date": "2026-10-26",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.4"],
  "requirements": [
    "LD-DB-001",
    "LD-DB-002",
    "LD-DB-003",
    "LD-DB-004",
    "LD-SESSION-001",
    "LD-NAV-004",
    "LD-NAV-006",
    "LD-CAT-003"
  ],
  "contractReview": "Explicit startup-fixed Core metadata shares the existing opaque database admission and one App observer; view closure drains calls without stopping native indexing. Renderer remains default and the metadata-only IPC rejects native Search selection. No fallback, raw SQL, paths, callbacks or renderer scheduler is introduced.",
  "milestoneReview": "M16.4 Done for explicit Core metadata intake: default/admission/lifetime, complete affected catalog and cold native Metadata/Search/Graph original gates pass. Renderer remains default. Native Search adoption, Tasks ordered writes/recovery, hosted adoption, R3 default cutover and distribution retain their own gates; no broader migration gate is completed.",
  "versions": {
    "desktopParent": "05d0e8abb802a7fc4ed1a762908b404406f2b9b6",
    "apiArchiveSha256": "ce16a703374eb634b8648fa9a001f52e2feb22e436ecc8cb6171215e53f20ee3",
    "jjStore": "5f4bf72984ccc2a8ab7487883cef32a579ef496f",
    "npmArchives": 26,
    "cohort": "Final APIce16 and Graph4164; other24archive digests unchanged from baseline",
    "notesNative": "19cd103a25c7c95997b1baa67fe47159d8aef263",
    "tasksNative": "fde58de0b03f97691a109b3448f414c5ac19eb5a",
    "pluginsNative": "5e0dffc3eb29efed5508c4914acca6b6bba0027f",
    "docsNative": "f772f2bacc20a914cef2f0398f294cefbac4ba3c",
    "activeImportRoutes": 101,
    "baselineApiArchiveSha256": "ae589c0d13e7f0eec47e67d62b5dbf95908ed82ff6ec0ec9d1cefac3a686e35e",
    "apiSource": "4b15f37a7563814a1b0ee11cfdaf407896a7352b",
    "graphArchiveSha256": "416488a35593be8ce5fa608cedf627e00a6e63cbc6b12c3b53c2519e6584fd13",
    "graphSource": "147ba6e2e3e4af1e1818179c1f309fc3b420ce44",
    "graphPeerOverride": "Private Design Core0.6 override, archived Graph^0.4 range; no registry/release qualification",
    "graphSourceQualification": "Retained147ba6e2 record:12exact/62Graph,strict,build,prepack,publint,audit,spec;52public outputs equal cleanaced6eee, same Graph source subtree"
  },
  "runs": [
    {
      "name": "exact-indexing-before",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test tests/renderer/native-indexing.test.mjs",
      "result": "fail",
      "tests": 5,
      "failures": 5,
      "note": "Before implementation: every Core/admission case fails; default provider behavior is retained but invalid selection was not rejected."
    },
    {
      "name": "exact-indexing-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test tests/renderer/native-indexing.test.mjs tests/renderer/native-database.test.mjs tests/renderer/shell-startup.test.mjs",
      "result": "pass",
      "tests": 17,
      "failures": 0,
      "note": "Exact transport/admission, existing complete database facade and shell-selection cases pass. Explicit host runtime for narrow diagnosis; canonical Docker qualification follows."
    },
    {
      "name": "initial-typecheck",
      "command": "node node_modules/svelte-check/bin/svelte-check --tsconfig tsconfig.json --fail-on-warnings",
      "result": "fail",
      "tests": 0,
      "failures": 2,
      "note": "Generated DTO aliases are not direct API root exports. Consume the public NativeBackgroundIndexing method parameter/result types instead; no private imports or source API changes."
    },
    {
      "name": "typecheck-after",
      "command": "node node_modules/svelte-check/bin/svelte-check --tsconfig tsconfig.json --fail-on-warnings",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Zero errors and warnings; Docker gate remains to be run."
    },
    {
      "name": "focused-catalog",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/desktop/MetadataOwner.stories.ts",
      "result": "pass",
      "tests": 16,
      "failures": 0,
      "note": "Cold Docker82f684bc-a358-4f33-9d7b-05ebdf7bb948:4stories in both themes/viewports; zero interaction, axe or fatal runtime failures. Exact API archive ae589c0d with25unchanged peers."
    },
    {
      "name": "docker-types",
      "command": "node scripts/validation.mjs run check:types",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Fresh Docker4a40f80d-254f-433b-ae6c-991c269c0322:zero errors/warnings."
    },
    {
      "name": "typed-native-service",
      "command": "node scripts/validation.mjs run test:rust -- --test database_indexing",
      "result": "pass",
      "tests": 3,
      "failures": 0,
      "note": "Private validation checkout, frozen Desktopdf6b496c, Docker97bfa068-e64f-42ed-bdbb-3a163e839634 with Notes19cd103a and exact qualified Tasks/Plugins/Docs pins plus Desktop jj5f4. Default/forged controls, physical-root and detached owner/rebuild all pass. Actual macOS views retain their separate gate."
    },
    {
      "name": "portable-complete-tests",
      "command": "node scripts/validation.mjs run test",
      "result": "pass",
      "tests": 1495,
      "failures": 0,
      "note": "Frozen Docker1f2639aa-91db-4d99-9272-5f8207095b7b:506renderer/governance,744AI and245Rust pass;2existing Rust ignores. Same native/API cohort as exact3case gate."
    },
    {
      "name": "strict-normal-and-e2e",
      "command": "node scripts/validation.mjs run check:rust; node scripts/validation.mjs run check:rust:e2e",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Normal883f6ee9-b12c-47d9-8939-b74e47b704aa and e2e4f9a368c-d215-491c-a604-a65187f41f1e pass all-target Clippy with warnings denied."
    },
    {
      "name": "native-normal-build-and-audit",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm exec tauri build --debug --bundles app; node scripts/check-bundle.mjs",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Isolated frozen arm64 app builds; ordinary audit reports0automation markers. Existing compact-unwind __eh_frame linker warning exactly reproduces retained parent native-final-watch-normal-build.log553 and native-normal-build.log890; this is not a new source or runtime failure. Helpers retain qualified AI6548 digests; signing remains Deferred."
    },
    {
      "name": "portable-spec",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Frozen Docker de321725-0e38-4016-bf6c-5f9ff99d5bfa: validation, Rust format, mdBook and mapped spec-first pass."
    },
    {
      "name": "portable-renderer-and-catalog-build",
      "command": "node scripts/validation.mjs run build; node scripts/validation.mjs run build-storybook",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Frozen Docker6f30dc4b-32f9-4fa0-9f36-107afc798512 and957da155-ee0a-460a-8f0d-c42e863fd6a8 pass with exact public archive cohort."
    },
    {
      "name": "portable-complete-format",
      "command": "node scripts/validation.mjs run format:check",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "note": "Docker092daf25-c936-418a-ac2c-83513c8ca2b2 flags only immutable E-AI-109.md; SHA256 16e50704e76ed720fdf280a28167714c23079fd13facd803580ca0aced74e93a equals parent. Previously explicitly accepted existing exception; no committed evidence is edited."
    },
    {
      "name": "native-e2e-initial-setup",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "note": "Isolated archive omitted .local/native-install/public.json, so Vite configuration stopped before compilation. Restored byte-identical qualified History fixture2d4a5c90; a direct regeneration also stopped because its portable candidate was not archived. Retain both setup failures; no product source repair."
    },
    {
      "name": "native-metadata-api-first",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test --test-concurrency=1 tests/desktop/metadata-owner.test.mjs",
      "result": "fail",
      "tests": 2,
      "failures": 2,
      "note": "First cold hidden process emitted no renderer acknowledgment; second boot reached real indexing/admission but existing e2e other-window fixture was denied by native-AI background policy. Preserve blank boot and failure logs. Permit only existing hidden/unfocused foreign-window creation before the AI fixture denial; do not loosen AI control admission or native assertions."
    },
    {
      "name": "native-metadata-api-fixture-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test --test-concurrency=1 tests/desktop/metadata-owner.test.mjs",
      "result": "fail",
      "tests": 2,
      "failures": 1,
      "note": "Renderer default passes; selected case proves foreign/closed/root admission, detached create/edit/rename/delete and idempotence, then fixture cleanup uses rmSync on an asserted-empty directory. Replace with rmdirSync, retaining the empty-directory assertion and all native checks; no product change or rebuild."
    },
    {
      "name": "native-e2e-build-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Initial complete2m53s Rust build and fixture-only30.7s rebuild pass. Existing compact-unwind linker warning retained; ordinary final bundle re-audit passes zeroautomation markers. Product/native snapshot matched before build; final equality is recorded separately."
    },
    {
      "name": "native-metadata-api-final",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test --test-concurrency=1 tests/desktop/metadata-owner.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "note": "Actual hidden WebViews: renderer default/forged selection denied; Core typed and physical admission, foreign window denial, unsupported contributions/Search controls, idempotence, detached external create/edit/rename/delete and cold restore/rebuild all pass. No foreground/animation claim."
    },
    {
      "name": "complete-hidden-native-api",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test --test-concurrency=1 tests/desktop/core-file-service.test.mjs tests/desktop/metadata-owner.test.mjs tests/desktop/search-provider.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-service-lifetime.test.mjs tests/desktop/repository-indexed-search.test.mjs tests/desktop/repository-backup-recovery.test.mjs tests/desktop/repository-backup-resume.test.mjs",
      "result": "pass",
      "tests": 14,
      "failures": 0,
      "note": "Final e2e fixture build passes full hidden inventory. No foreground/UI gate inferred; runtime ownership and legacy fixture-control denials retained."
    },
    {
      "name": "native-core-workspace-before",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=core node --import tsx --test --test-concurrency=1 tests/desktop/navigation-metadata.test.mjs tests/desktop/navigation-search.test.mjs tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "tests": 8,
      "failures": 5,
      "note": "3pass: metadata navigation/refresh/cold restore, disabledSearch and internal links. Native external-createSearch loses a metadata notification before renderer file admission; API owner confirms source ordering bug. Other failures: Graph3, stale TagsSearch result label."
    },
    {
      "name": "native-renderer-workspace-baseline",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=renderer node --import tsx --test --test-concurrency=1 tests/desktop/navigation-metadata.test.mjs tests/desktop/navigation-search.test.mjs tests/desktop/navigation-graph.test.mjs",
      "result": "fail",
      "tests": 8,
      "failures": 5,
      "note": "Same3Graph failures and stale TagsSearch label reproduce without Core. Search external-create passes default. DisabledSearch case hits existing palette-option readiness race; full counts retained separately."
    },
    {
      "name": "native-metadata-selector-after",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=renderer node --import tsx --test --test-concurrency=1 --test-name-pattern='hand off their exact query|recoverable while Search is disabled' tests/desktop/navigation-metadata.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "note": "Wait for actual filtered palette option, then match current public result filename/path label used by retained Search test. Both exact failures pass; no assertion loosened, timeout raised or product source changed."
    },
    {
      "name": "catalog-baseline-complete-matrix",
      "command": "node scripts/validation.mjs run test:storybook; isolated exact-source worker: node scripts/validation.mjs run test:storybook -- --shard=4/4",
      "result": "pass",
      "tests": 2032,
      "failures": 0,
      "note": "APIae589/Graph533d baseline.16unique shard/theme/viewport modes: original1\u20133=1464cases/12passingJUnit, privateb8b7902e shard4=568/4passingJUnit. Stop only original redundant4after copying/hash-validating all1\u20133reports; explicit interruption receipt retained. No matrix case omitted."
    },
    {
      "name": "strict-after-e2e-fixture",
      "command": "node scripts/validation.mjs run check:rust; node scripts/validation.mjs run check:rust:e2e",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Final fixture source all-target warnings-denied normal56c7a942-1cf7-4ca7-b024-3ae9d8161309 and e2e81a8ee70-105c-432b-95e3-0e84f309f149 pass; npm native-observer/Graph changes do not alter Rust inputs."
    },
    {
      "name": "affected-acp-first",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/acp-transport.test.mjs",
      "result": "fail",
      "tests": 6,
      "failures": 1,
      "note": "Five pass including actualforeignWebView. Cancelled-close uses obsolete shell-failure selector. Existing shared nativeFailure locator repairs it; retained Graph intake also restores debounced settings close admission."
    },
    {
      "name": "graph-intake-fixture-attempts",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=renderer node --import tsx --test --test-concurrency=1 --test-name-pattern='Graph controls enter close|Graph failed writes|cancelled application close' tests/desktop/navigation-graph.test.mjs tests/desktop/acp-transport.test.mjs",
      "result": "fail",
      "tests": 3,
      "failures": 2,
      "note": "Graph4164 source archive restores immediateClose/coldsettings (1pass/2oldUIselectorfail). Existing conflict-review helper removes old textarea/buttons; next2pass/1fail expects all virtualized JSON lines in DOM. Assert visibleincomingfilter plus exactsaved bytes instead; exactrecovery1/1passes. All full-version and laterpartialwrite assertions retained."
    },
    {
      "name": "graph-readiness-before-after",
      "command": "LAPIS_DESKTOP_METADATA_OWNER=renderer node --import tsx --test --test-concurrency=1 --test-name-pattern='native global/local Graph' tests/desktop/navigation-graph.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "note": "Hovercleanup alone0/1and diagnostic0/1preserved. Actualframes/body prove editor remains active after file-click/F7race. Await Alfa document then visibleGraph before canvas assertions; exact1/1passes global/local semantics, externalcreate/rename/delete, pointermenu and coldrestore. No timeout/assertion loosened."
    },
    {
      "name": "final-corrected-package-cold-catalog",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/desktop/MetadataOwner.stories.ts catalog/plugins/Workspace.stories.ts catalog/plugins/desktop/FileConflicts.stories.ts",
      "result": "pass",
      "tests": 88,
      "failures": 0,
      "note": "Fresh Dockeree5f96c5-3759-485b-a898-2c29efaa7cde:22cases in4viewport/theme modes, zerointeraction/axe/runtime failures, finalAPIce16+Graph4164 and24unchanged archives. Unaffected default2032matrix retained separately; only native observer branch changes."
    },
    {
      "name": "final-corrected-package-native-builds",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm exec tauri build --debug --bundles app; LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json; node scripts/check-bundle.mjs",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Finalce16+Graph4164 normal/e2e isolated macOS builds pass; ordinary bundle has zeroautomation markers. Existing parent compact-unwind linker warning retained; signing Deferred. Withdrawn API6267 compared copied TFile object identity and was replaced before app compilation; finalce16 uses path/presence and byte/disposal fences, qualified upstream1619API cases."
    },
    {
      "name": "final-corrected-core-native-workspace-and-acp",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native LAPIS_DESKTOP_METADATA_OWNER=core node --import tsx --test --test-concurrency=1 tests/desktop/navigation-metadata.test.mjs tests/desktop/navigation-search.test.mjs tests/desktop/navigation-graph.test.mjs tests/desktop/acp-transport.test.mjs",
      "result": "pass",
      "tests": 14,
      "failures": 0,
      "note": "Finalce16+Graph4164 actual macOS processes:8Metadata/Search/Graph plus6ACP. External-created Markdown Search, metadata handoff, Graph externalcreate/rename/delete and coldrestore, immediateClose admission, disk-conflict exactbytes recovery, cancelledACPclose and foreignWebView all pass. Native testreadiness/selector repairs retain original product assertions."
    },
    {
      "name": "final-corrected-complete-hidden-api",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test --test-concurrency=1 tests/desktop/core-file-service.test.mjs tests/desktop/metadata-owner.test.mjs tests/desktop/search-provider.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-service-lifetime.test.mjs tests/desktop/repository-indexed-search.test.mjs tests/desktop/repository-backup-recovery.test.mjs tests/desktop/repository-backup-resume.test.mjs",
      "result": "pass",
      "tests": 14,
      "failures": 0,
      "note": "Finalbundle10fileinventory passes with noactivation. Logged changed-storagesettings and unavailablebackup protocolerrors are intentional negative assertions; zerotestfailures."
    },
    {
      "name": "final-source-and-public-output-equality",
      "command": "Compare tracked non-doc/spec source/config with isolated native snapshot and hash every selected archive/public API+Graph file",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "1522source/configfiles byteequal;26archive SHA verified,24unchanged since baseline. InstalledAPI505 and Graph52publicfiles equal archives; no package-internal edits. Normalbinaryc92e539b, e2e2c2d24b1; stagedlapis-acp9181b386 and fixture37b78f4a retain qualified hashes."
    },
    {
      "name": "final-governance-before-status-closure",
      "command": "node scripts/validation.mjs run spec:check; pnpm exec prettier --check <all changed supported paths>; node scripts/source-audit.mjs; node scripts/source-audit.mjs --app-only; node scripts/progress.mjs",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Dockera499b18a-dac4-4321-8b03-e7215e5fcfb4 validate/Rustformat/mdbook/spec-first pass for frozen validation descendant. Changedformat, architecture and Appownership allpass; ledger52tasks/304evidence. Final explicit History-parent base05d0e8ab spec run follows Done projection before commit. Sole full-format immutableE-AI-109exception remains accepted; no functional failure waived."
    },
    {
      "name": "final-status-closure-before",
      "command": "node scripts/progress.mjs; LAPIS_DESKTOP_BASE=05d0e8abb802a7fc4ed1a762908b404406f2b9b6 node scripts/validation.mjs run spec:check",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "note": "Ledgerchanged Done but fresh evidence omitted required completedGates exact originalgate declaration; localchecker and Docker3cbfb982-fd8f-49a9-82ec-013e6241f23e correctly reject it. Add exactunchanged M16.4gate to qualified evidence; no checker or product assertion changes. Rerun samecompletebase beforecommit."
    },
    {
      "name": "final-status-closure-after",
      "command": "node scripts/progress.mjs; LAPIS_DESKTOP_BASE=05d0e8abb802a7fc4ed1a762908b404406f2b9b6 node scripts/validation.mjs run spec:check",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Docker aa334cf5-d277-4208-8c33-457f8db6e208 passes all4lanes against exact History parent05d0e8ab: canonical validation, Rustformat, mdbook and mapped spec-first. Localprogress52tasks/304evidence also passes. Exactunchanged originalgate declaration now present; failure is repaired, not waived. Final evidence/projection audit repeats beforecommit."
    }
  ],
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/desktop/MetadataOwner.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/desktop/MetadataOwnerDemo.svelte",
    "docs/validation.md",
    "scripts/desktop-acceptance.mjs",
    "scripts/desktop-api-tests.mjs",
    "scripts/source-audit.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/background.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/current/navigation.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-029.md",
    "spec/src/history/core/index.md",
    "src/components/views/Shell.svelte",
    "src/lib/desktop/shell-startup.ts",
    "src/lib/native/database/database-transport.ts",
    "src/lib/native/database/native-database-provider.ts",
    "src/lib/notes/notes-session.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/acceptance/acp.rs",
    "src-tauri/src/database/connection.rs",
    "src-tauri/src/database/indexing.rs",
    "src-tauri/src/database/mod.rs",
    "src-tauri/src/host/indexing.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/shell.rs",
    "src-tauri/tests/database_indexing.rs",
    "tests/desktop/acp-transport.test.mjs",
    "tests/desktop/metadata-owner.test.mjs",
    "tests/desktop/navigation-graph.test.mjs",
    "tests/desktop/navigation-metadata.test.mjs",
    "tests/renderer/native-indexing.test.mjs",
    "tests/renderer/shell-startup.test.mjs"
  ],
  "remaining": [],
  "completedGates": {
    "M16.4": "Explicit Core metadata selection shares the existing native database admission and observer; default/admission/lifetime regressions, full affected catalog and cold native Metadata/Search/Graph views pass while renderer metadata remains default."
  }
}
```

Signing/distribution, visual approval, hosted adoption and default cutover
retain their own gates and are outside this bounded opt-in slice.
