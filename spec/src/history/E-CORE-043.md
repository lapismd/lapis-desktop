# Explicit Tauri shared queue intake

```json
{
  "id": "E-CORE-043",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.10"],
  "requirements": [
    "LD-AI-001",
    "LD-AI-002",
    "LD-AI-004",
    "LD-AI-005",
    "LD-AI-006",
    "LD-AI-007",
    "LD-CAT-003"
  ],
  "contractReview": "Explicit CORE-036/037 queue intake uses one existing builtin recipient declaration, sealed native runner kind and complete host metadata. Shared app-profile owns capture and observation; Core owns the queue, journal and advancement. Tauri owns admitted transport. No target-label inference, renderer scheduler, uncertain retry or default activation.",
  "milestoneReview": "M16.10 completes its original transport, trusted capture, production-screen, full catalog, strict native, actual WebView/lifetime/cold recovery and complete-asset app gates on Core 0eec0811 and the declared final public cohort. R3/M16.8/M16.9 remain complete. Notes R4.1.6 installed-provider acceptance, broader M10 and default/release gates stay separate.",
  "versions": {
    "qualifiedDesktopMain": "6c6243202e05b04e57de0a737829ca3a48e3ed3e",
    "R3Core": "03b8257d3d81b5c5c8970d16c7688f12f4ccc9ec",
    "R3APIArchive": "89e81a5f13469fc3b52652e7822720ef0ec96b555df626a00a9de071f89de98e",
    "R4APIArchive": "ef8170a6f77d811f1d62c3c567dc1b07a8c30418ec3fce538f4e3838a09c1cfc",
    "AgentUiSendCapability": "2bee4ed673f4fbb82b721268091d75b2392e95d0",
    "AgentUiArchive": "58bd5870d6d67bd60a1d1c8724eb31d4359c3d923eb673474f6818b9e7f90b95",
    "R4CoreFinal": "0eec081174c3314a58636fecc4a0c227e1f30acf",
    "R4AppProfileFinalArchive": "fe45dedb08125257a84e57933fcddc9685fa6d559a41821a73b0e654608e2068",
    "finalProductSnapshot": "e3d1b54561ddd4eeba6977de895b72c08c8b773e",
    "supportingR4CoreCandidate": "cdbffcedc3ce41c796334dfbe91c864e32127faf",
    "supportingR4AppProfileArchive": "0e792e5aa693ce69aada8690c3f78f74084bc82e192632907db5fed9106471fd",
    "supportingR4AppProfileSource": "6dcd67776cccdada84f62c29af318d4ad8eb17ce",
    "finalNativeHarness": "20bc19c9d9e43ee96023e80e82e3ddff7e100125"
  },
  "files": [
    "MIGRATION.md",
    "scripts/spec-contracts.mjs",
    "spec-validator.config.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/index.md",
    "spec/src/current/ai.md",
    "spec/src/current/ai-queue.md",
    "spec/src/current/governance.md",
    "spec/src/current/verification.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/core/index.md",
    "spec/src/history/E-CORE-043.md",
    "tests/renderer/ai-native-queue.test.mjs",
    "tests/renderer/ai-native-queue-catalog.test.mjs",
    "config/ai/queue-recipients.json",
    "src/lib/native/ai/native-chat.ts",
    "src/lib/native/ai/native-queue.ts",
    "src/lib/ai/conversations/builtin-recipients.ts",
    "src/lib/ai/chat/controller/queue-capture.ts",
    "src-tauri/src/host/ai/policy.rs",
    "src-tauri/src/host/ai/policy/native_turns.rs",
    "src-tauri/src/host/ai/policy/native_queue.rs",
    "src-tauri/src/host/ai/turns/mod.rs",
    "src-tauri/src/host/ai/turns/access.rs",
    "src-tauri/src/host/ai/turns/queue.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "scripts/source-audit.mjs",
    "scripts/validation/native-sources.json",
    "catalog/support/ai/native-queue/fixture.ts",
    "catalog/support/ai/native-queue/NativeQueueDemo.svelte",
    "catalog/plugins/ai/NativeQueue.stories.ts",
    "catalog/COVERAGE.md",
    "catalog/story-parity.json",
    "tests/desktop/native-queue-fixture.mjs",
    "tests/desktop/ai-native-queue-owner.test.mjs",
    "tests/desktop/ai-native-queue-admission.test.mjs",
    "tests/desktop/ai-native-queue-screen.test.mjs",
    "scripts/desktop-api-tests.mjs",
    "scripts/desktop-acceptance.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/plugins.md",
    "spec/src/current/migration.md"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Tracker generation before task-row normalization",
      "command": "node scripts/progress.mjs --write",
      "result": "fail",
      "failures": 1,
      "detail": "NewM16.10rowhadphysicalwraps;parserrequiresseveninlinecolumns. Normalizedtheauthoredrowwithoutchangingitsgate;regenerationrerun."
    },
    {
      "name": "Combined public queue renderer and catalog checks",
      "command": "queue-focused Docker c5dd141f-7633-49fe-be7e-9d81aec2830d",
      "result": "pass",
      "tests": 10,
      "failures": 0,
      "detail": "Host5/catalog2/existingnative-chat3pass;types0errors/0warnings;architecture/Appauditspass. Public31archives/117routes:APIef817,AppProfile148645. Follow-upcandidate0e792fixessourcemetadataNonebusycapability;currentprovenanceupdatedandrerunrequired. Nativecdbffcedequalityproofrecordsqualified620Rust/0fail/7existingignores;normal/e2eTauricompilationremainsconsumer-owned."
    },
    {
      "name": "Isolatedworkspaceandowningcontractintake",
      "command": "jjworkspaceadd desktop-native-queue-20261027 -r6c624320;readAGENTS/index/AI/CORE036/037/publicDTOs",
      "result": "pass",
      "failures": 0,
      "detail": "Cleannewchangeuvnkxqsvonverifiedmain. Sourcequeue_selectiontypedshapeinspected; noRustcompilebeforequalifiedproducer. ExistingpublicrecipientcodecalreadyDesktopdependency; exactbuiltinmentiontokensobtainedthroughpublicexports. Someinitiallookupcommandsusednonexistentpaths; diagnosticsetuponly, no productfailure."
    },
    {
      "name": "Exact missing native queue renderer port",
      "command": "queue-exact Docker eaf38897-3acd-4f49-9bdf-e05dd6aa2292;node --importtsx --test tests/renderer/ai-native-queue.test.mjs",
      "result": "fail",
      "tests": 5,
      "failures": 5,
      "detail": "All5exactcasesfailatmissingNativeChatHost.queue assertions;imports/setupvalid. Terminal1/noOOMonqualifiedR3public31/API89e/Core03b. Coversall5commands,scope,typeduncertainty/no-retry,exactdeclaredmetadata,missingmetadataandinapplicablereply. NativecompileheldforqualifiedCORE037."
    },
    {
      "name": "Exact renderer queue transport after thin adapter",
      "command": "queue-exact Docker99a6b543-d161-45d8-bb83-645be5df1a30",
      "result": "pass",
      "tests": 5,
      "failures": 0,
      "detail": "Same5missingportregressionsnowpass: exact5nativecommands/scope,typeduncertaintywithoutretry,completeopaquehostmetadata,missing/non-targetmetadatafailclosed. SupportingunitproofagainstR3public31; newR4types/native/sourceclosure remainseparate."
    },
    {
      "name": "Shared recipient declaration before extraction",
      "command": "queue-catalog-exact Docker935a2066-b0d9-4fb9-af6b-d2b683955ecb",
      "result": "fail",
      "tests": 2,
      "failures": 1,
      "detail": "Missingnewhostcatalog1fail;originalfallbackcapturecasepassesall4builtinidentity/modeassertions. ActualpubliccodecIDs/tokensretained. Frozenbeforeinput054e9802hasnoconfigJSON."
    },
    {
      "name": "Rust source formatting before normalization",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check; cargo fmt",
      "result": "fail",
      "failures": 3,
      "detail": "3newsourcefilesneedstandardrustfmtwrapping;appliedformatterwithoutRustcompile. Fullstrict/native gatesremainpending."
    },
    {
      "name": "Refreshed public AppProfile consumer regression",
      "command": "queue-focused Docker35e5d25e-8f27-47cc-8af3-f9c8671ae7bd",
      "result": "pass",
      "tests": 10,
      "failures": 0,
      "detail": "APIef817/AppProfile0e792;31archives/117activeimportsroutes;host5/catalog2/existingnativechat3;types0errors/0warnings;normalarchitecture/Appownershipauditspass."
    },
    {
      "name": "Qualified Core native ABI intake",
      "command": "queue-rust Docker7e61c450-2c64-443f-8601-dc08d071fd82;macOS cargo test --locked --features e2e --bin lapis-desktop native_queue",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "detail": "Strictnormal/e2eClippybothpassonnativecdbffced/public31. FreshisolatedmacOSpublic31/117routesfixturecompilesandsealedrunnerdeclarationtestpasses;all55hosttests,realAPI/Screen/bundlegatesremainopen. APFSCOWtargetreusepreservesR3executables;standingapprovalinactivecompiler/byte-identicaltransfercachecleanupreceiptsretained."
    },
    {
      "name": "New queue story initial control selectors",
      "command": "queue-stories Dockerb42663cd-4b27-4ece-9881-f946a1fb33e2",
      "result": "fail",
      "tests": 12,
      "failures": 7,
      "detail": "NewEmptyandexisting4NativeTurnspass;7newstoriesusedSendmessagewhiletheproductionbusycomposerislabelledQueuemessage(orStopagentwhenmetadataabsent). Correctedharnesslabelstoexistingpublicsemanticsandremovedunnecessarydefault-openqueueexpansion;noassertionorproductcontractweakened. Types0errors/0warnings,parity113families/0finding. Trackerrowneededjoiningtotheexistingprettier-ignoredtable;secondgenerationfailurekept."
    },
    {
      "name": "Queue stories second cold run",
      "command": "queue-stories Docker7f86a973-c5bc-4b50-8330-af05d2cd1f83",
      "result": "fail",
      "tests": 12,
      "failures": 2,
      "detail": "10pass/2fail:cancelclickedbeforeacknowledgementfinished(buttonpointer-eventsnone);missing-declarationcheckincorrectlyrequiredStopagentbesidestheactualno-send/no-queuecontract. Waitforexactcancelreadiness;assertretaineddraft/runningheadandnoavailableSend/Queueinstead. Productunchanged;exactfamilyrerunrequired."
    },
    {
      "name": "All native host unit contracts",
      "command": "macOS cargo test --manifest-path .local/native-queue/lapis-desktop/src-tauri/Cargo.toml --locked --features e2e --bin lapis-desktop",
      "result": "pass",
      "tests": 55,
      "failures": 0,
      "detail": "Allnativehost55passincludingqueueframepreservationforall5commands,top-level/browserauthorityrefusal,sealedrunnerdeclarationandallpriorAI/repository/windowcontracts."
    },
    {
      "name": "Full-shell queue capability regression",
      "command": "queue-stories Dockerc9deac08-2eae-4fea-b2b6-6e0d8fa4014d",
      "result": "fail",
      "tests": 12,
      "failures": 2,
      "detail": "10pass/2fail. Cancelcontrolrequireskeyboardfocus(hover/focusrevealedlinks);addedpublicfocusreadiness. MissingDeclarationexposesactualupstreamAgentUibug:observeromitssendcapabilitybutcompletefooterstillenablesQueuefromdraft. Ownerrepairisolateduywnnwuoon0e549;nohostworkaroundorloweredassertion."
    },
    {
      "name": "Native app packaging setup failures and verification",
      "command": "native-build-r4-queue;native-build-r4-queue-retry;exactpinnedverifyBundle",
      "result": "pass",
      "failures": 0,
      "detail": "Firstattemptfailedbeforebuildbecauseisolatedfixturelackedpublicsignedinstallationdata. Stagedidenticalqualifieddisposablepublicfixture. Retrybuilt649.21MiBapp;postbuildverifierfailedtoload@iarna/tomlinexportedsibling. Ranbyte-identicalpinnedsourceverifierwithexistingdependencies:4helpers/completenativeruntimepass. Separateinitial30GiBguardfailed;privatebuildhelpernowownsafail-fastcheckandadditionalinactivecatalogcachereclamationrestoredmarginbeforenativeCargo. Failedsetupattemptsretained;noappreplacement."
    },
    {
      "name": "Actual native queue admission and cold recovery before picker reset",
      "command": "native-queue-api-exact.log",
      "result": "fail",
      "tests": 2,
      "failures": 1,
      "detail": "Admission1pass. Ownercasepasseslostacknowledgementobservation/exactcapture/cancel/Stop/detachbutcoldvault_selectfailsENOENTbecauseacceptancepickerfilewasconsumed. Restagefixturepickerperlaunch;productunchanged."
    },
    {
      "name": "Actual native queue admission and cold recovery",
      "command": "native-queue-api-retry.log;node --import tsx --test --test-concurrency=1 tests/desktop/ai-native-queue-{admission,owner}.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "detail": "HiddenmacOSWebViewremainsinactive. Physical-root/stale/foreign/browserauthorityrefusals;exact5commands;lostacknowledgementobservedwithoutacceptreplay;distinctaction/capture/authored/nativeIDs;cancel/Stop;detachdenial;coldpausedjournal;explicitresume;exactuser/outcomeonce;only2nativeprompts. Supportingcdbffced/ef817/0e792cohort;sourcefinalclosureandscreen/fullgatesseparate."
    },
    {
      "name": "Native screen initial composer selection",
      "command": "native-queue-screen-exact.log;native-queue-screen-diagnostic.log;native-queue-screen-visible.log",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "detail": "3attemptsstopatfollow-updraft:unscopedMessageeditorincludestranscriptreadersbesidestheactualcomposer. Firstturnsubmittedonce;noqueueaccept. Diagnosticretained;scopetothepublicMessagecomposergroup,thenrerunexactscreen.Noassertionweakened."
    },
    {
      "name": "Real native screen queue lifetime and cold History",
      "command": "native-queue-screen-scoped.log;node --import tsx --test tests/desktop/ai-native-queue-screen.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "detail": "ActualvisiblemacOSWebView:Pause/resume,freezeexecutionMode,retainedworkduringordinaryNotesreloadwithallobserversdisposed,noCorecallsafterdetach,exactuser/outcomeonce,Historyafterreloadandcoldrestart,exact3nativeprompts/no-replay. PublicMessagecomposergroupscopingexcludestranscriptreaders.NoUIreplacementorbaselineapproval. FinalAgentUi/Coreinputqualificationseparate."
    },
    {
      "name": "Upstream Send capability producer closure",
      "command": "Agent UI 2bee4ed6; composite receipt final-composite-send-capability-d2fd86fc; closing spec 472aa6fe",
      "result": "pass",
      "tests": 16,
      "failures": 0,
      "detail": "Exact source 0/2 before to 16/16 final; full source 234 units, 1960 catalog/axe, 151 browser, 149 packed examples and static build pass. Failed full aggregate retains its canonical-only finding; mapped chapter repaired and fresh spec/workflow/format pass. All 333 public Agent UI members equal full output and focused/full dist; archive stays 58bd. Consumer acceptance remains separate."
    },
    {
      "name": "Final-input exact renderer and full-shell queue stories",
      "command": "Docker 00b56354 queue-focused and 4881c942 queue-stories; immutable Core 0eec0811, UI 58bd, API ef817, Profile fe45",
      "result": "pass",
      "tests": 62,
      "failures": 0,
      "detail": "Transport 10/10 and NativeQueue/NativeTurns 13 cases across four modes (52/52); types zero diagnostics and source/App/parity audits pass. Fresh isolated 31 public archives resolve through 117 active routes; portable manifest/lock bytes restored."
    },
    {
      "name": "Final-input native strict and host units",
      "command": "Docker b4ae6137 queue-rust; macOS mac-rust-final-queue-host",
      "result": "pass",
      "tests": 313,
      "failures": 0,
      "detail": "Linux strict normal/e2e and 258 ordinary Rust tests pass; macOS host binary 55 passes. The two existing ignored cases are subprocess helpers exercised by their parent tests; no ignore or platform-selection change."
    },
    {
      "name": "Final-input complete portable runtime and public static build",
      "command": "Docker 42f721bc composition-node",
      "result": "pass",
      "tests": 1288,
      "failures": 0,
      "detail": "All 544 Node and 744 AI cases pass; renderer and static catalog build, types, architecture/App ownership and 113-family parity pass. These immutable product/build inputs remain unchanged by subsequent native harness-only fixes."
    },
    {
      "name": "Final-input hidden native queue and retained admission regressions",
      "command": "final-native-queue-api.log; final-native-ai-admission-regressions.log",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "detail": "Actual native queue API 2 plus existing AI admission/turn-owner 2. Malformed capture returns EINVAL without creating a queue; physical/stale/foreign/browser authority refusal, exact capture, Stop/cancel/resume, lost acknowledgement, detach and cold recovery remain native."
    },
    {
      "name": "Expanded native screen harness diagnosis",
      "command": "final-native-queue-screen.log; -ready.log; -ready-diagnostic.log; -hover.log; -focus.log",
      "result": "fail",
      "tests": 5,
      "failures": 5,
      "detail": "Expanded pointer target initially stays hidden: native driver moveTo does not establish CSS :hover, proven by false matches/none pointer events. Shared/browser actual hover passes unchanged source. Private send helper also typed before prior clear; wait now excludes standard noneditable placeholder. One ready attempt used wrong fixture cwd (old test ran); one focus attempt serialized an unresolved element. All setup attempts retained; no source assertions or product styles changed."
    },
    {
      "name": "Expanded actual native screen pointer and lifetime",
      "command": "final-native-queue-screen-pointer.log; checked harness 20bc19c9",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "detail": "Standard public focus reveals keyboard-accessible Cancel, exact center hit owns the button and normal driver click cancels only unstarted work. Pause/resume, exact declared mode/capture, completed work while observers detached, no calls after detach, History reload/cold restart and exactly 3 provider prompts/no replay pass. Browser hover and native focus/pointer evidence stay distinct."
    },
    {
      "name": "Ordinary app preparation missing isolated verifier dependencies",
      "command": "native-build-final-queue-ordinary",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "detail": "Normal beforeBuildCommand reached staged AI reuse but exported lapis-ai development tool dependencies were not installed (@iarna/toml missing). E2e asset verification already passes using the byte-identical qualified verifier. Install the exported owner frozen lock normally, then rerun ordinary app build; no source alias, shim or original lapis-ai source change."
    },
    {
      "name": "Complete final app configurations and assets",
      "command": "native-build-final-queue-e2e; native-build-final-queue-ordinary-tools-ready",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "detail": "Both actual macOS app configurations build with pinned Core/UI inputs and complete AI runtime resources verified. Ordinary beforeBuild uses exported lapis-ai frozen-lock tool install and staged AI reuse; no source alias, dependency shim or original AI source edit. Initial relative log-path install setup did not run a command and is retained separately."
    },
    {
      "name": "Preclosure generated summary formatting",
      "command": "Docker cbdd15d3 final-docs",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "detail": "Full format correctly flags generated MIGRATION.md in addition to accepted unchanged immutable E-AI-109. Formatted generated summary without changing its projection; progress check passes. Documentary gates rerun after final catalog closure; no new formatting waiver."
    },
    {
      "name": "Completed first catalog shard checkpoint",
      "command": "c809b7c5 full command interrupted after completed shard1; final-catalog-shard-1-receipt.json",
      "result": "pass",
      "tests": 512,
      "failures": 0,
      "detail": "Only the completed first sub-invocation is qualified here: all four modes, 29 identical file inventories, 128 cases each. Enclosing sequential aggregate was intentionally interrupted during shard2 (exit143) to parallelize remaining exact partitions; it is never relabelled passed. Guard initially refused unexpected Docker entrypoint metadata, then matched the actual pinned docker-entrypoint.sh/node command before stopping only its owned container. The final complete composite follows below."
    },
    {
      "name": "Canonical ownership review before closure",
      "command": "Read mapped spec-first rules for named grants, catalog inventory and generated progress",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "detail": "Current Desktop, Plugins and Migration chapters now link the owning native queue contract and retain existing caller/catalog/provider gates. These documentation-only corrections preserve every qualified product/build input and avoid treating a generated tracker as the product contract."
    },
    {
      "name": "Canonical chapter byte budget during documentary preclosure",
      "command": "Docker e7b3441c final-docs",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "detail": "Format (only accepted immutable E-AI-109), Rust fmt, architecture/App/parity and progress pass. Canonical validation rejects Desktop chapter at 33066 bytes after an added explanatory paragraph. Removed that redundant paragraph and linked its existing scoped-AI requirement to the owning queue contract instead; original admission requirements stay unchanged. No size limit or validator waiver."
    },
    {
      "name": "Complete final catalog composite",
      "command": "Completed c809b7c5 shard1 checkpoint; explicit a2192228 shard2, 4c3acbc5 shard3, 25c49347 shard4; final-catalog-composite-receipt.json",
      "result": "pass",
      "tests": 2124,
      "failures": 0,
      "detail": "All 113 disjoint story files and 531 cases execute in each of four theme/viewports: 512 + 508 + 512 + 592. Source/native/public cohort is identical e3d1b545 in every partition. Shards2-4 retain zero-failure/zero-skip JUnit cases with identical identities across modes; shard1 retains complete passing per-file inventories. No source, target, assertion, threshold or baseline changed for the private parallel handoff; original interrupted aggregate remains explicit."
    },
    {
      "name": "Ordinary app capability and runtime audit",
      "command": "node scripts/check-bundle.mjs; final-ordinary-bundle-audit.log",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "detail": "Actual ordinary macOS bundle is arm64 with expected identifier, 330 renderer JavaScript files and zero acceptance/automation markers, Node/Deno executables or fixture peers. Complete packaged AI resource verification passes separately. Signing remains deferred and no installed application is replaced."
    },
    {
      "name": "Mapped documentary preclosure",
      "command": "Docker 1498d738 final-docs at 69893fb7",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "detail": "Canonical validation, mdBook/spec-first, progress58/evidence320, Rust formatting, architecture/App ownership and 113-family parity pass. Full formatting retains only the previously accepted byte-identical immutable E-AI-109 finding. Final status/evidence-only edits receive their final document check before commit; unchanged product gates are not repeated."
    },
    {
      "name": "Final evidence completion-schema correction",
      "command": "Docker d8cff868 final-docs",
      "result": "fail",
      "tests": 0,
      "failures": 2,
      "detail": "Progress rejects the pass record because outside-scope gates remained in remaining and original completedGates text had not been copied. Moved separate adoption/provider/release work to outOfScope, left remaining empty, and copied the exact unchanged M16.10 gate through the canonical parser. No task gate, validator or product test changed."
    }
  ],
  "completedGates": {
    "M16.10": "Explicit native queue selection routes generated accept/read/Stop/cancel/resume through the admitted Core owner; complete trusted recipient and mode capture, exact identities, uncertain observation, existing screen controls and cold no-replay recovery pass source/public, quiet/catalog and actual native gates without renderer scheduling or ordinary default activation."
  },
  "outOfScope": [
    "No remaining original M16.10 product gate; default-workspace adoption and Notes master update follow this commit.",
    "Notes R4.1.6 actual installed-provider, visual review, ordinary default activation and release remain separate."
  ]
}
```
