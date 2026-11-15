# App-owned native Sync leave preparation

```json
{
  "id": "E-SYNC-006",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SYNC-001"],
  "contractReview": "Desktop prepares App-owned native Sync before stopping the watcher and entering the whole-vault writer guard. Accepted apply calls drain outside that guard. Refused leave and cleanup failure release the preparation without replacing the original lease; native work and host service lifetime remain independently owned. Notes API LN-PKG-189/193 owns the portable capability.",
  "acceptanceReview": "The original Desktop disposal regression, actual public-archive type boundary and all116affected infrastructure cases pass. Complete source qualification passes772governance/renderer cases,746AIpolicy cases,287Rust cases, strictnormal/e2eClippy, production/staticbuilds, fullspecification and2152coldinteraction/accessibility cases across16viewport/theme/shard batches. All32installedarchive import routes match verified bytes. Notes136 and Tasks24 are merged. ActualTauri/OS, registry-only distribution and full encryptedSync remain open.",
  "versions": {
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "coreSource": "5d3d463b57221e6e0be46618c0ec00db3c1938e6",
    "notesSource": "01bf01f61f91f31237ebcdbb07242b9b6f9a5943",
    "@lapis-notes/apiArchiveSha256": "8afe1aa0ae664c943e0ca0ae6600467304789e26a8ceef1413b293f4ddab83a3",
    "@lapis-notes/uiArchiveSha256": "97929afe5463da58c80c3c7f7e95ecf5a90c8b4f7609db8f3cfd8f164f5a1a04",
    "@lapis-notes/workspaceArchiveSha256": "81cd70fa15af0992ec57a80e43c9972f1795893fd48dfc224511522ae27c92a8",
    "@lapis-notes/file-explorerArchiveSha256": "5ab4ba28eb6a839bf64cfbc4031c77bb60b9883069ce9c0a510ecce32be3f342",
    "@lapis-notes/language-serviceArchiveSha256": "9b371f7c14850d73961f9d2a94aad126c964b7f3800576b38079185e821f28a0",
    "@lapis-notes/app-profileArchiveSha256": "53af31346513ff281e3a9bd147f544d9325caf64d959965e15648836c8f89c8e",
    "notesQualifiedRefreshSource": "01bf01f61f91f31237ebcdbb07242b9b6f9a5943",
    "historicalNotesSource": "d51d6acbabbbef1d6a04c187c696432705340661",
    "historical-@lapis-notes/apiArchiveSha256": "8afe1aa0ae664c943e0ca0ae6600467304789e26a8ceef1413b293f4ddab83a3",
    "historical-@lapis-notes/uiArchiveSha256": "97929afe5463da58c80c3c7f7e95ecf5a90c8b4f7609db8f3cfd8f164f5a1a04",
    "historical-@lapis-notes/workspaceArchiveSha256": "81cd70fa15af0992ec57a80e43c9972f1795893fd48dfc224511522ae27c92a8",
    "historical-@lapis-notes/file-explorerArchiveSha256": "5ab4ba28eb6a839bf64cfbc4031c77bb60b9883069ce9c0a510ecce32be3f342",
    "historical-@lapis-notes/language-serviceArchiveSha256": "9b371f7c14850d73961f9d2a94aad126c964b7f3800576b38079185e821f28a0",
    "historical-@lapis-notes/app-profileArchiveSha256": "b3bce3735fe621a844cfee0f10a00faa9ac0ff7aa4f94c4215b16f90583ea34e",
    "tasksSource": "7e25dc5cce821baca7831827f1711c1f18cbabf1",
    "tasksArchiveSha256": "1b32310580854d3828f636ebc064a7b9b17009d9e527a7ce79a05f405061cfa6"
  },
  "files": [
    "src/lib/notes/notes-dispose.ts",
    "tests/renderer/notes-dispose.test.mjs",
    "spec/src/current/lapis-sync.md",
    "spec/src/current/files.md",
    "spec/src/current/windows.md",
    "spec/src/backlog/lapis-sync.md",
    "spec/src/verification/lapis-sync.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-SYNC-006.md",
    "scripts/ci-install.mjs",
    "scripts/ci-prepare-links.mjs",
    "tests/governance/ci-prerequisites.test.mjs",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/governance.md",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/ci-sources.json",
    "scripts/archive-hook.mjs",
    "scripts/archive-resolution.mjs",
    "scripts/local-archives.mjs",
    "scripts/validation/worker.mjs",
    "tests/governance/local-archives.test.mjs",
    "tests/governance/archive-development-dependencies.test.mjs",
    "tests/governance/validation-archive-cohort.test.mjs",
    "tests/governance/validation-native.test.mjs",
    "spec/src/current/desktop.md"
  ],
  "runs": [
    {
      "name": "Desktop Sync preparation before writer guard, before implementation",
      "command": "pnpm validation -- run validation:check -- tests/renderer/notes-dispose.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Exact new case0/1: writer guard enters without Sync preparation. Combined selected renderer/governance lane105pass/1fail/0skipped,106total. Report lapis-desktop-validation-2fcb18bc-5fda-43e4-8843-5f472fe9eb27. Existing renderer assertions remain unchanged."
    },
    {
      "name": "Desktop Sync preparation and existing lifecycle regressions, after implementation",
      "command": "pnpm validation -- run validation:check -- tests/renderer/notes-dispose.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "109pass/0fail/0skipped:13Notes disposal cases plus96governed runner cases. Exact original case passes; new cases retain watcher until preparation drains, restore the same capability after final persistence refusal and release on watcher or metadata cleanup failure. Report lapis-desktop-validation-f86451a7-cce0-42fe-93b7-3ce1baadf05b. Actual API public-archive type/consumer and native gates remain open."
    },
    {
      "name": "Complete public Notes source cohort before CI projection repair",
      "command": "pnpm validation -- run validation:check -- tests/governance/ci-prerequisites.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Original new cohort case0/1: API remains its registry range instead of the verified source archive. Report lapis-desktop-validation-e80332b2-f3e0-4904-9857-0d926299b825. CI must prepare and project all six public Notes packages before consumer qualification."
    },
    {
      "name": "Source-owned verified Notes archive production",
      "command": "Notes pnpm validation:consumer-pack",
      "result": "pass",
      "failures": 0,
      "detail": "Six public package archives built/packed from exact reachable Notes source d51d6acb; provenance, package identities and SHA-256 verified before copying. API public native-sync.d.ts exposes prepareLeave. Report lapis-notes-validation-4aafc4f4-3c2c-4aa2-8f8f-6d84b672f7ea. New eight-package private prerequisite manifest is prepared but not yet installed/selected. This is artifact evidence, not consumer acceptance."
    },
    {
      "name": "Complete public Notes source cohort after CI projection repair",
      "command": "pnpm validation -- run validation:check -- tests/governance/ci-prerequisites.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "104pass/0fail/0skipped; original missing-API-cohort case passes after projecting all six public Notes packages. Every original input range remains exact. Profile preparation uses its normal public build rather than removed native-chat-only task. Report lapis-desktop-validation-7ec441bd-acd5-40e7-bb86-7a93df94e390. Broader infrastructure and actual candidate consumer qualification remain pending."
    },
    {
      "name": "Native Sync public App capability unavailable in installed Desktop cohort",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 1,
      "detail": "Exact consumer boundary:1error/0warnings/1file, App.nativeSync missing from existing API0.6.1 consumer graph in notes-dispose.ts. Report lapis-desktop-validation-ee673f18-8b5a-40c5-97cb-6d8de8baf9c9. Modern verified API/cohort intake must repair this same target; no shim, alias or local dependency source edit is permitted."
    },
    {
      "name": "Portable published registry cohort projection",
      "command": "Task-owned registry projection: pnpm install --lockfile-only --ignore-pnpmfile --ignore-scripts",
      "result": "pass",
      "failures": 0,
      "detail": "Updated normal public ranges and one exact Core0.13.4 context. First projection retained old Graph/Bases incompatible peers; released Graph0.1.12 and Bases0.4.1 admit API0.6/current Markdown. Final portable lock has one API0.6.5 and one Core0.13.4 snapshot. AI remains explicitly unpublished/omitted from registry projection; Tasks registry peer warning remains a release gate and the separately verified native fixture is required. A validation-script attempt incorrectly compared the raw Core range with its governed exact override; corrected expected override handling before importing the portable lock. No peer warnings suppressed."
    },
    {
      "name": "Qualified merged-source Notes archive production and prerequisite selection",
      "command": "Notes pnpm validation:consumer-pack; Desktop explicit verified archive selection",
      "result": "pass",
      "failures": 0,
      "detail": "Six public packages from exact committed01bf01f6, including Profile0.2.2, built/packed in report lapis-notes-validation-5d233931-dfbc-4871-80ad-b680f423a04b. Hashes, names/versions, API prepareLeave declaration and every root semver range verified before selecting the eight-package private manifest. AI and native Tasks fixture archives remain unchanged. Consumer type and application checks follow separately."
    },
    {
      "name": "Root-only verified archive installation retains a registry API copy",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 1,
      "detail": "Report73e6a3c5-afb9-48dc-97b0-2d71df51ae90:1error/0warnings, missing prepareLeave despite verified root API declaration containing it. Read-only failed-container inspection of installed lock proves two API6.5 contexts: candidate file and registry. Profile/Workspace/Explorer/LanguageService selected registry bytes. Original tracked registry graph had one API context; that does not prove actual projected installation."
    },
    {
      "name": "Strict transitive routing refuses incompatible Tasks fixture",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 1,
      "detail": "Report539d1190-c661-4f72-bef8-d03450f9a5a9: install admission refuses API0.6.5 against pinned Tasks0.1 fixture peer^0.1.4. Shared archive hook is retained without a peer waiver; current Tasks source owner must qualify API0.6 support before renewed consumer qualification."
    },
    {
      "name": "Qualified Tasks API 0.6 source candidate replaces rejected historical fixture",
      "command": "Tasks pnpm validation:all; pnpm release:prepare at exact committed source",
      "result": "pass",
      "failures": 0,
      "detail": "Source7e25dc5c, PR24. Exact cold NestedListRows0/1\u21921/1; full66cold interaction/axe, combined2929units/29Rust, check/build/publint/static/spec, unchanged registry media and actual cold development/production archive hosts pass. Exact-source archive report72cccdee; SHA256 1b32310580854d3828f636ebc064a7b9b17009d9e527a7ce79a05f405061cfa6. Candidate selected only after byte/name/version checks. Original incompatible0.1 fixture retained historically. Desktop installed type/graph checks follow separately."
    },
    {
      "name": "Exact Desktop type boundary after complete verified archive routing",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "detail": "Reportf7838793-d65b-4f24-a9f3-fbaba828bee4:0errors/0warnings; original missing App.nativeSync/prepareLeave errors repaired with real public candidate exports. Shared graph verifier checks one archive context per package and32actual dependency import routes against verified payload bytes. Tasks candidate7e25dc5c replaces incompatible historical0.1fixture; tracked registry lock still exposes the released Tasks0.2 API0.2/0.4 peer warning rather than suppressing it. Installed candidate graph is separately checked. No native/application or fullSync qualification claim."
    },
    {
      "name": "Complete archive helper and runner regressions expose stale intake expectations",
      "command": "pnpm validation -- run validation:check -- tests/governance/validation-archive-cohort.test.mjs tests/governance/local-archives.test.mjs tests/governance/archive-development-dependencies.test.mjs tests/governance/ci-prerequisites.test.mjs",
      "result": "fail",
      "failures": 2,
      "detail": "Reporte75adad5-aa9e-4819-980b-a2de0ac96a27:114pass/2fail/0skipped of116. Original new routing/range/context cases pass. Failing existing expectations retain root Tasks^0.1.1 and Notes JavaScriptd157d0ea despite intentionally selected Tasks^.2.0 and qualified Notes01bf. Update the exact expected intake identities, retaining immutable native Notes40b9 and all refusal/identity assertions."
    },
    {
      "name": "Complete affected archive helper and runner regression after intake expectation refresh",
      "command": "pnpm validation -- run validation:check -- tests/governance/validation-archive-cohort.test.mjs tests/governance/local-archives.test.mjs tests/governance/archive-development-dependencies.test.mjs tests/governance/ci-prerequisites.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Report1030ee4d-ab67-4ac9-845d-1f52f76ca06f:116pass/0fail/0skipped. Exact two stale intake expectations now match intentionally selected sources, retaining native Notes40b9 and all graph identity/refusal/range assertions. Shared helper consumers and complete runner regressions pass."
    },
    {
      "name": "Full Desktop check stops at incomplete fresh receipt schema",
      "command": "pnpm check (spec:validate phase)",
      "result": "fail",
      "failures": 1,
      "detail": "Reportb3fc433d-c667-4c34-9b92-d07441254397:LD-EVIDENCE reports E-SYNC-006 missing required remaining array. Add the explicit current incomplete qualification/native/end-to-end gates; preserve the validator and pending result. Product tests/build/catalog did not run after this first failure."
    },
    {
      "name": "Full Desktop portable checks after fresh receipt schema repair",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Reportf893419e-eafd-4ae0-b556-542cd8d9e267:storyparity115families/0findings, canonical/source/App-ownership audit,0typeerrors/warnings, normal/e2e strictClippy and fullformat pass. Exact original spec:validate phase separately passes32cd4261:7validators/538chapters/133requirements."
    },
    {
      "name": "Full Desktop governance, renderer, AI and native service tests",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "Reportc6abd3f2-dde2-452d-8a13-89d499929a20:772governance/renderer cases pass/0skipped,746AIpolicy cases in152files pass,287Rust cases pass/2existing subprocess-helper ignores across63summaries. Helpers are invoked by the actual restart/interruption tests. Linux service evidence does not qualify Tauri/WebView/macOS custody."
    },
    {
      "name": "Desktop renderer production build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Reportc10893b0-5947-4d48-b2d7-7c72744e4be5 passes with32verifiedarchiveimportroutes. Ordinary chunk-size advisories remain; no native application qualification."
    },
    {
      "name": "Complete specification check identifies missing mapped Desktop contract",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Reportd46964fc-2794-4bc9-a54e-1e95bd074a4c:validation, Rust format and mdBook pass; spec-first reports unchanged mapped current/desktop.md. Add the actual App leave contract there, retaining existing mapping and limits. Catalog lanes did not run after this first failure."
    },
    {
      "name": "Mapped Desktop contract exceeds existing authored byte limit",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Report2e18a8c3-f06e-47d4-ad24-79010aede097:32956bytes exceeds32768 in current/desktop.md. Replace duplicated Sync intake prose with a concise ownership link and retain the new lifecycle MUST contract. No limit or validator changes; static/catalog lanes did not run after validation failed."
    },
    {
      "name": "Complete specification after mapped contract and byte-limit repairs",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Reportaaff64e5-53a5-48e9-a34b-47d4a4376032:all4lanes pass(validate,Rustformat,mdBook,spec-first). Existing search-index size advisory remains. Desktop chapter32603bytes/328lines; no limit or validator change."
    },
    {
      "name": "Static Desktop catalog from the verified public archive graph",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Report3ccb296c-63d6-4269-8288-99cc05041dad passes;32installed import routes independently verified before build. Ordinary source-map/chunk-size advisories retained."
    },
    {
      "name": "Complete cold Desktop catalog interaction and accessibility",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Report2ebc28c0-dc32-406f-b7dc-f859213ea933:2152actual passing cases across all16sequential fresh viewport/theme/shard invocations:4\u00d7127,4\u00d7134,4\u00d7129,4\u00d7148. Each shard runs desktop/light,narrow/light,desktop/dark,narrow/dark. No functional or accessibility failure or baseline update. These browser/fixture cases do not qualify actual Tauri or OS behavior."
    },
    {
      "name": "Public portable lock dependency audits",
      "command": "node --input-type=module -e (existing ci-audit.mjs runAudit)",
      "result": "pass",
      "failures": 0,
      "detail": "Both full and production pnpm audit reports pass the unchanged exact approved development-only exception in config/dependency-audit.json. Supplementary public-lock evidence; hosted CI must independently audit its actual projected private graph."
    }
  ],
  "remaining": [
    "Tauri commands, observation, selection and lifecycle integration; actual OS custody and supported native application acceptance.",
    "Endpoint enrollment, encrypted transfer/apply, offline scheduling, continuous server capture, conflicts/recovery and independent-device end-to-end Sync qualification.",
    "Registry-only distribution, optional activation and separately authorized publication/release gates; visual review remains pending."
  ]
}
```

Source fixture qualification cannot satisfy native Tauri registration, OS
custody, installed application or full multi-device Sync gates. Visual review
remains pending without baseline updates.
