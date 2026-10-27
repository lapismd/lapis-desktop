# Final main and shared Core Desktop qualification

```json
{
  "id": "E-CORE-040",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.8", "M16.9"],
  "requirements": [
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-REPO-005",
    "LD-TASK-001",
    "LD-TASK-002",
    "LD-TASK-003",
    "LD-CAT-003",
    "LD-GOV-006",
    "LD-NAV-002",
    "LD-NAV-003"
  ],
  "contractReview": "Compose current main fileicons/tooling with Core editing/readers/Tasks; preserve both source histories, exact permissions, public import maps and immutable evidence. Qualify the final shared Core admission fix and matching icon-capable public packages before one actual native/full cohort.",
  "milestoneReview": "Final main/Core/Tasks composition qualified and completed by E-CORE-041. Core03b/API89e:all99actualnative,2088catalog,537Node/744AI,260Rust/clock2,strict,bothapps/completeassets andspec/audit/progress checks pass. All earlier failures preserved; no functional/native waiver. M16.8/M16.9 original gates complete, with final completed-ledger documentary checks passing.",
  "versions": {
    "desktopComposition": "1af133084de399b7352a1fcd10be4f82ec67c99e",
    "desktopMain": "f276120b3039",
    "nativeQualifiedKernel": "e699e6c9ae459cfd8f4265803d4d1e4cee138096",
    "notesFinalUnionCandidate": "9c9705f09a049db5ce3263f91b4805fb98f31aed",
    "designCoreArchive": "ad82a73a5323b70ac814a69f7db4ee10f032a1b1146eef11d38f341dad1543fb",
    "basesArchive": "a7ab0601c7feacca7341eea612b417f481ff40c276e400a3307f7c603fc40930",
    "finalAPIPack": "89e81a5f13469fc3b52652e7822720ef0ec96b555df626a00a9de071f89de98e",
    "macOSKernelArchiveSha256": "d767f3e6aa7d9b9ec93c1bf982dd06bae13589a993e022ca08bab35eb81159e6",
    "finalExplorerPack": "84063b673e988c40f1e7d42bb101e4cdddb0d8728c4d19234ca93cae4965cbae",
    "workspacePack": "b33e860549b8661fc8c7c0bb0b82c9beacf61bdc0ef612775a5ea6669e7ce775",
    "sourceOwnerQualification": "Committed API1c89 closure:exact3,affected118,API1708,check20/test20/build11,cold264,browser41 and finalspec78 pass; same d178b9d4 public archive. Final composedCore/consumer gates remain.",
    "notesHistoryRepairCandidate": "c1c6570f8b88e6c1c6b596587edb67b02656a837",
    "notesHistoryRepairArchiveSha256": "81e1c352152b4e655034232a7237b15a65a8c56038894c55bec8dd82532569f5",
    "priorAPIArchive": "09939582fc33c5aedda1bda8f70ed2a341e6951c96f67378e78139363f296275",
    "apiUndoCandidate": "3a6b623d39c63c3603f72a94a5f0639d9975ebf2",
    "notesRestoreDiagnosticCandidate": "9acb4e5cf70f831e0981a61c315ae0845d2096fd",
    "notesRestoreDiagnosticArchiveSha256": "c5df3474ac959af4d38977d8a8b6afbd511c5411d8b3ab015933ce4191c3b429",
    "apiUndoCommittedRevision": "1c89dfb13ce684fc9809c9894f3bec0122d04d7e",
    "finalComposedCore": "03b8257d3d81b5c5c8970d16c7688f12f4ccc9ec",
    "finalComposedCoreArchiveSha256": "24ba421bebba5d55387df7badfba89827d842b6ab50fd158f9d2ddfa927492a2",
    "finalAPICommittedRevision": "000aef52d870d6812038b9877854926cd39ee344"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/Workspace.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/desktop/PluginFileIconsDemo.svelte",
    "docs/validation.md",
    "scripts/validation/docker.mjs",
    "scripts/validation/model.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CORE-040.md",
    "spec/src/history/E-ICONS-001.md",
    "spec/src/history/E-ICONS-002.md",
    "spec/src/history/core/index.md",
    "spec/src/history/index.md",
    "tests/governance/validation.test.mjs",
    "tests/desktop/tasks-entry.ts",
    "tests/desktop/tasks-transport.ts",
    "tests/renderer/tasks-transport.test.mjs",
    "spec/src/current/tasks.md",
    "tests/desktop/plugin-entry.ts",
    "tests/desktop/runtime-entry.ts",
    "src/lib/desktop/bootstrap.ts",
    "src/components/views/Shell.svelte",
    "src/lib/notes/notes-session.ts",
    "tests/desktop/tasks-owner.test.mjs",
    "src/components/views/NotesWorkspace.svelte",
    "tests/desktop/tasks-installed-driver.mjs",
    "tests/desktop/repository-restore.test.mjs",
    "tests/desktop/repository-working-copy.test.mjs",
    "spec/src/current/vault-backup.md",
    "tests/desktop/search-onnx.test.mjs",
    "scripts/desktop-api-tests.mjs",
    "package.json",
    "spec/src/current/navigation.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/repository.md"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Static main plus staged Core composition",
      "command": "jj new 1af13308 f276120b; resolve documentation union only",
      "result": "pass",
      "failures": 0,
      "detail": "No product conflicts; main icon story, Docker transport updates, frozen Core/Tasks implementation and immutable records all retained."
    },
    {
      "name": "Qualified shared kernel macOS native services",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "tests": 260,
      "failures": 0,
      "detail": "54test binaries/doc targets;2intentional subprocess helper entrypoints exercised by real restart/interruption parents. ReaderOriginal4 andTasks4 pass. Desktop source6264b90/Notes e699 archive d767f3e6; no JS/public-icon/app/window qualification."
    },
    {
      "name": "Qualified kernel macOS ordinary and e2e strict hosts",
      "command": "cargo clippy --all-targets --locked -- -D warnings; cargo clippy --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "detail": "Both native configurations pass on the same e699 kernel/6264b90 Desktop Rust source; source/public-icon/app/window gates remain separate."
    },
    {
      "name": "Final main plus Core portable composition",
      "command": "composition-node private Docker snapshot58a6390b-0879-45fc-9c93-8015baa9f165",
      "result": "pass",
      "tests": 1279,
      "failures": 0,
      "detail": "Desktop24d54476/Notes9c9705f0/31archives/116routes:535Node and744AI;types0errors/0warnings,renderer/static builds,architecture/App/parity pass. Full catalog/native gates remain separate."
    },
    {
      "name": "Final installed Tasks signed fixture",
      "command": "node --import tsx tests/desktop/tasks-installed-artifact.mjs <verified31archiveManifest>;node --import tsx tests/desktop/distribution-fixtures.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Fresh artifact against final public import map; all four hashed resources and16host externals preserved before ephemeral signing. Actual native execution pending."
    },
    {
      "name": "Actual native cold startup before Tasks probe repair",
      "command": "LAPIS_NATIVE_SELECTION=fixtures node .local/qualification/native-tests.mjs final-api <canonical13files>; private cold-startup diagnostic",
      "result": "fail",
      "tests": 2,
      "failures": 2,
      "detail": "Stopped cohort after2pre-readiness failures. Native exception: Attempted to assign to readonly property, tasks-transport assignment to protected Tauri invoke. DOM/stack retained. Repair uses explicit Desktop NativeCall injection below shared observer bookkeeping, forwarding native frames and values unchanged; no protected global or Task policy changes."
    },
    {
      "name": "Forward-only probe and shared observer regression",
      "command": "node --import tsx --test tests/renderer/tasks-transport.test.mjs tests/renderer/tasks-installed-fixture.test.mjs tests/renderer/native-tasks.test.mjs;strict probe tsc;svelte-check",
      "result": "pass",
      "tests": 15,
      "failures": 0,
      "detail": "Frozen invoke target stays unchanged. Forwarding below NativeTasksSession retains pending drain, typed native values/options/refusals;15exact cases and strict types0errors/0warnings."
    },
    {
      "name": "Repaired e2e app and exact original cold startup",
      "command": "node .local/qualification/native-build.mjs final-e2e-probe;LAPIS_NATIVE_SELECTION=fixtures node .local/qualification/native-tests.mjs final-startup-after-probe tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "detail": "Desktop d3b4ae73:real macOS e2e bundle,4complete packaged helper hashes,original2cold admission/reload/reset cases pass. Ordinary bundle and full native/catalog cohorts remain separate."
    },
    {
      "name": "Original full hidden native API cohort after startup repair",
      "command": "LAPIS_NATIVE_SELECTION=fixtures node .local/qualification/native-tests.mjs final-api-after-probe <canonical13files>",
      "result": "fail",
      "tests": 19,
      "failures": 6,
      "detail": "13pass/6fail:4queries overlap native History index owner and fail unavailable;2Task refusal assertions lose typed error through WDIO reserved top-level error envelope. Metadata/Search/Core files/Original pins and other indexed/storage cases pass. No failures waived."
    },
    {
      "name": "Exact native Tasks error envelope repair",
      "command": "LAPIS_NATIVE_SELECTION=fixtures node .local/qualification/native-tests.mjs final-tasks-api-errors tests/desktop/tasks-owner.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "detail": "Serialize caught native refusal as failure, matching established native drivers; preserve exact ENOTSUP/EACCES assertions. Both original cases pass. Actual bundle remains d3b4ae73; only external test and documentary inputs changed."
    },
    {
      "name": "Installed Tasks first native fixture attempts",
      "command": "native-tests final-installed-tasks;native-tests final-installed-tasks-registry",
      "result": "fail",
      "tests": 8,
      "failures": 8,
      "detail": "First4fail before installer because multi-MiB base64 exceeds WDIO body limit. Use existing signed embedded registry by plugin identity; installer then succeeds with exact4resource hashes/sharedAPI. Next4fail default-provider wait:actual Core enabled=true with provider unavailable, no daily provider registered. Diagnose consumer App lifecycle, reuse public hosted registration; no timing/assertion relaxation."
    },
    {
      "name": "Actual installed native Tasks with default daily registration",
      "command": "LAPIS_NATIVE_APP_RECEIPT=native-build-final-e2e-daily-receipt.json node .local/qualification/native-tests.mjs final-installed-tasks-navigation tests/desktop/tasks-installed.test.mjs",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "detail": "Bundle5d9ac5f, external helper72b3d5ec:real signed/sharedAPI install,real editor save drain+coldLogbook,actual locale/defaultdaily+customprovider zero callbacks,stale version bytes,acceptedlostreply/read-only recovery/coldreopen without replay. Public planner aria labels cover expanded/collapsed navigation; original4text selectors failed before this helper correction."
    },
    {
      "name": "Daily provider focused portable and cold catalog",
      "command": "daily-exact Docker7b3ae8e4-9900-4793-9d71-d122f704e1d9",
      "result": "pass",
      "tests": 74,
      "failures": 0,
      "detail": "Desktop5d9ac5f:26Node plus48coldcatalog cases (NativeTasks,Workspace,Shell across all4theme/viewports);types0errors/0warnings. Whole catalog must be repeated after shared App registration."
    },
    {
      "name": "Daily registration full portable cohort",
      "command": "composition-node Docker78a0ba40-e277-411f-aaa7-cc85df9f2f4a",
      "result": "pass",
      "tests": 1280,
      "failures": 0,
      "detail": "Desktop9311c5a1:536Node+744AI,types0/0,renderer/static builds and architecture/App/parity. API09939582 remains selected; later actual native Undo defect requires a new qualified public source input."
    },
    {
      "name": "Actual headed navigation and original Metadata Undo regression",
      "command": "native-tests final-navigation <Search/settings/Metadata/Graph/recovery5files>;LAPIS_EXACT_TEST=^existing.metadata.panels native-tests final-metadata-exact navigation-metadata.test.mjs",
      "result": "fail",
      "tests": 12,
      "failures": 1,
      "detail": "11pass/1fail; exact originalMetadata case repeats1/1fail at Undo restore. Actual public CM trace:historyField exists,input.type createsdepth1,EmbeddedEditorSurface effect callsEditor.updateExtensions->setState twice during native hold/release and clears1to0. Same view andfocus retained; CmdZ delivered/prevented. Notes API source repair required; no keyboard workaround or waived assertion."
    },
    {
      "name": "Cancel obsolete public API catalog inputs",
      "command": "private stop-obsolete-catalog.mjs;only104dd56b/3d418ad8/22d2fa9d ownedcontainers",
      "result": "pending",
      "failures": 0,
      "detail": "One frozen377fea1d source/pack7775491e;complete firstmode159+174+189=522pass/0fail,then operator cancels143 for incoming requiredAPIUndo repair. All3report archives/cancellation receipts retained. No finalwholecatalog claim."
    },
    {
      "name": "Original four native History contention regressions",
      "command": "LAPIS_NATIVE_APP_RECEIPT=native-build-history-serialization-candidate-receipt.json LAPIS_EXACT_TEST=<original4names> native-tests final-history-contention-exact recovery,resume,service-lifetime",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "detail": "Desktop718b2db9/Corecandidatec1c6570f/archive81e1c352:actualMac e2e bundle+4helpers verify;original4query/capture/recovery/lifetime cases pass unchanged. Sourcefullqualification and broadernative gates remain separate."
    },
    {
      "name": "Actual Repository affected native family",
      "command": "native-tests final-repository-candidate <originalRepository10files>",
      "result": "fail",
      "tests": 12,
      "failures": 2,
      "detail": "10pass; stale file restore is intercepted by earlier stale editor fence, old working-copy selector is unreachable in the canonical M14 backup profile. Bytes and exact guard assertions retained while setup/current profile are diagnosed."
    },
    {
      "name": "Exact Repository current-profile and restore setup attempts",
      "command": "native-tests final-repository-contract-exact-v2 repository-restore.test.mjs repository-working-copy.test.mjs",
      "result": "fail",
      "tests": 2,
      "failures": 2,
      "detail": "Passive owned editor reconciliation preserves the stale native preview; exact expected stale error is masked by Notes Core with_backup generic failure. Restore receipt lookup now positively selects vault.json rather than .reader-cache. Current M14 backup status renders; Original revision selection requires graph diagnosis. No native assertion relaxed."
    },
    {
      "name": "Current M14 backup status and Original native UI",
      "command": "native-tests final-original-profile-scoped repository-working-copy.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "detail": "Current production profile reports managed backup, opens independentOriginal through its real source picker, selects Native status revision, captures new external file, hides status and retains choice through cold reopen. Strict vault/JJ/Git bytes equal the pre-open snapshot except intentional another.txt. Graph diagnostic attempts failed3times because unscoped first graph was the hidden Backup tab; use existing visibleOriginal panel scope. No source reader change or bypass."
    },
    {
      "name": "Complete canonical hidden native service/API acceptance",
      "command": "LAPIS_NATIVE_SELECTION=fixtures LAPIS_NATIVE_APP_RECEIPT=native-build-restore-reconciliation-probe-receipt.json native-tests final-api-c1c <canonical13files>",
      "result": "pass",
      "tests": 19,
      "failures": 0,
      "detail": "Original native profiles/selections acrossCorefile,editing,metadata,Search/provider,AIadmission/turn,Tasks,OriginalHistory,pins,indexsearch,backuprecovery/resume/lifetime. All19pass onc1c; includes fourpreviousHistorycontention failures and2repairedTasksfixtures. API099remains historical pendingUndo publicarchive; finalsource diagnostics/wholecatalog remain separate."
    },
    {
      "name": "Qualified Repository UI archive provenance audit",
      "command": "Verify final-composite-qualified-v2-6cd9b2e1 owner receipt and SHA256 equality to selected343885archive",
      "result": "pass",
      "failures": 0,
      "detail": "Final normal RepositoryUI pack343885947863 equals former provisional selected pack exactly; all699publicfiles equal and owner composite1944catalog/234unit/151distinctbrowser pass. Historical150/1browser attempt retained; finalbrowser coverage144unchanged+7final-source. Manifest now points to finalqualified archive, no package-byte changes."
    },
    {
      "name": "Undo API candidate public intake",
      "command": "bootstrap-native.mjs;verify-native-archives.mjs against31 explicit archives",
      "result": "pass",
      "failures": 0,
      "detail": "APIcandidate3a6b623d/d178b9d4 passes owner exact3/affected118/fullAPI1708,all20check/test+11build. Fresh Desktop install verifies31archives/116routes; actual nativeUndo,e2e/ordinary,fullcatalog and final source cold gates remain. Catalog1/3starts on frozenDesktop ecc53e8e; onlyoneDesktop remote worker allocated."
    },
    {
      "name": "Original native Metadata Undo after source repair",
      "command": "LAPIS_EXACT_TEST=^existing.metadata.panels native-tests final-undo-original-exact navigation-metadata.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "detail": "Completeasset e2e bundleecc53e8e/API d178b9d4:original case passes unchanged through realOutline navigation,edit/save,Undo,external refresh and cold retained workspace. FinalCore9ac wholefamily remains."
    },
    {
      "name": "Actual macOS ONNX semantic host composition",
      "command": "native-tests final-onnx-host-before tests/desktop/search-onnx.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "detail": "Real managed runtime685d2be5/model assets; retained macfixturefc735637,6x384vectors within1e-5+fingerprints and all6queryranks/scores2e-4+provider diagnostics,read-only revision,viewdetach/reopen,coldoffline cache and unchanged cachehashes. No tokenhash fallback or vault modelbytes. New opt-in --onnx script classification regression1failbefore/1passafter; original19API/defaultquiet modes retained. Final9ac native rerun pending."
    },
    {
      "name": "Original native exact stale restore after Core diagnostic repair",
      "command": "native-tests final-restore-diagnostic-exact tests/desktop/repository-restore.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "detail": "Core9ac/archivec5df3474/API d178b9d4/e2eff9d6774:exact original stale-preview text and externalbytes retained; actual file/vault restore and safetyhistory plus cold uncertain-reply receipt recovery bothpass. Macdebugbundle emits one linker compact-unwind section-size warning; build and completepackagedassets verify. Finalstrict source/native and broader families remain."
    },
    {
      "name": "Final macOS unattended day and operator timezone proof",
      "command": "cargo test --manifest-path ../lapis-notes/Cargo.toml -p lapis-app-core --lib --locked services::indexing::tasks::tests::clock -- --nocapture",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "detail": "Exact unchangedCore9ac/archivec5df3474 onmacOS:0client unattended-date projection withoutmaterialization;12Europe/London midnight/DST transitions,idempotentdaily observation,unchangedHabitbytes and0clients. Only sourceprivateClock + subprocessTZ used. Realhost retains default30s chronoLocal construction and actualinstalledlocale/day proof; no production clock API/systemtime change. Native runner governance fullmodule21/21also passes after exactclassification1failbefore/1passafter."
    },
    {
      "name": "Complete repaired native APIs with actual ONNX",
      "command": "LAPIS_NATIVE_SELECTION=fixtures native-tests final-api-with-onnx <original13files plussearch-onnx>",
      "result": "pass",
      "tests": 20,
      "failures": 0,
      "detail": "Core9ac/API d178/e2eff9d6774:alloriginal19API plusrealmanagedONNX passed. Default/refusal fixtures choosegenuineowners. Includes originalHistory4 and fullmodelvector/rank/coldoffline proof. Refresh/status sourcecandidate e606 is separately beingcomposed; no frontend/API/catalog input changes. Do not mark overallR3/M16.8/M16.9complete before composedsource/finalgates."
    },
    {
      "name": "Complete Repository native diagnostic impact",
      "command": "native-tests final-repository-diagnostic-family <original10Repositoryfiles>",
      "result": "pass",
      "tests": 12,
      "failures": 0,
      "detail": "Core9ac/API d178/e2eff9d6774:adoption,identity,backup/failedclose/retry,saved/liveHistorySearch,bothcoldrestore recoveries,storage,Originalpins/restart andcurrentM14status/coldvisibility allpass. Original12case10/12before isretained. No other restore/adoption/storage action diagnostic regressions found; composedRefresh source/finalcohort remain separate."
    },
    {
      "name": "Installed Tasks on the repaired public API",
      "command": "native-tests final-installed-tasks-undo-api tests/desktop/tasks-installed.test.mjs",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "detail": "Core9ac/API d178/e2eff9d6774:all4actual installed cases pass again after sharedAPIUndo repair. Real sourceeditor drain/coldLogbook,actualoperator locale/currentday/defaultdaily bytes,unsupportedprovider0callbacks,stale bytes and acceptedlostreply/read-onlycoldjournal/noReplay. Completes current9ac Macclock2+actualday composition; finalRefresh Core/currentcohort remain separate."
    },
    {
      "name": "Fresh full repaired public cohort portable checks",
      "command": "composition-node Docker61b2e511-88f2-4c2b-b413-b7c51a20c4aa",
      "result": "pass",
      "tests": 1280,
      "failures": 0,
      "detail": "Desktop723e2d35/API d178/31archives/116routes:536Node+744AI,types0errors/0warnings,renderer/staticStorybook builds,architecture/App/parity. JS/runtime inputs unchanged by subsequent03b nativepin. All narrow before/after failures retained."
    },
    {
      "name": "Complete final public catalog and frozen input equality",
      "command": "catalog-1-of-3 61174eb7;2-of-3 40e15052;3-of-3 a5891550;final-catalog-input-equality.json",
      "result": "pass",
      "tests": 2088,
      "failures": 0,
      "detail": "All4theme/viewports:636+696+756 pass, same frozenDesktop ecc53e8e/API d178. Every renderer/catalog/Storybook/config/lock byte and all31publicarchive digests equal latestsource; package onlyadds explicitnativeONNX test script. NativeCore composition changes no frontend/DTO/package inputs. Original cancelled522partialcases are not counted."
    },
    {
      "name": "Final coherent native and public closure",
      "command": "E-CORE-041 final frozen4d5d/Core03b/API89e cohort and documentary closure",
      "result": "pass",
      "failures": 0,
      "detail": "99actualnative+2088catalog+537Node/744AI,types/build/static/audits,260Rust/clock2/strict and ordinary/e2e packaged assets pass. Source000aef/Rootcombinedcanonical retains qualified package bytes; prior failed records remain historical. Final status and source provenance are in E-CORE-041."
    }
  ],
  "completedGates": {
    "M16.8": "Desktop Repository discovery and both immutable source readers delegate to the shared Core Client on one existing worker/preparation queue; foreign/stale scopes, source replacement, retirement, blocked-close preservation and cold retained UI pass without duplicate read admission or new mutation authority.",
    "M16.9": "Explicit native Tasks selection uses the existing admitted App client, shared Task storage/journal and retained installed-plugin surfaces; full source/public archive, provider/locale, passive lifecycle, recovery and cold native/catalog acceptance pass without renderer fallback."
  }
}
```
