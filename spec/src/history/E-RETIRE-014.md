# Adopt released Notes retirement packages

```json
{
  "id": "E-RETIRE-014",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "pass",
  "versions": {
    "desktopBase": "9769c7febbdf7717ec5cac26b83b2ca7c0b51467",
    "notesPublishedSource": "6b2b39f583a30be4e6dfa734050c20af862384ba",
    "remainingNotesSource": "5ffb33c152404b6880debd1b5fd70762121d6196",
    "api": "0.6.9",
    "ui": "0.2.5",
    "appProfile": "0.2.6",
    "specValidator": "0.2.1",
    "node": "24.15.0",
    "pnpm": "10.34.5"
  },
  "requirements": [
    "LD-GOV-006",
    "LD-GOV-008",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-005",
    "LD-CLI-001",
    "LD-CLI-002",
    "LD-CLI-003"
  ],
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    "scripts/ci-install.mjs",
    "tests/governance/profile-registry.test.mjs",
    "tests/governance/ci-prerequisites.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/plugins.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-RETIRE-014.md",
    "catalog/support/NotesDemo.svelte",
    "catalog/plugins/cli/Workspace.stories.ts",
    "catalog/story-parity.json",
    "catalog/COVERAGE.md",
    "spec/src/current/integration.md"
  ],
  "contractReview": "Adopt only released API/UI/App Profile root ranges and remove only their mandatory CI archive projection. Preserve source producer groups, explicit Language Service preparation and archive/export/declaration admission, Notes5ffb source, every Rust pin, core functions, native AI, controller contracts and the five remaining private prerequisite identities.",
  "acceptanceReview": "Qualify the actual three normal npm packages plus five checksummed private archives in fresh bounded omarchy Docker. Reproduce the projection regression before editing, then run the public installed retirement guard, app-tool schema, real CLI General/Advanced registration/disposal, complete source/spec/evidence and cold catalog/static-build lanes. No host fallback, native/provider or registry-only application qualification.",
  "runs": [
    {
      "name": "Authoring discovery",
      "command": "pnpm spec:search \"local dependency released archive\"",
      "result": "fail",
      "failures": 1,
      "detail": "Fresh workspace has no host spec-validator dependencies. Use documented text fallback; no host install."
    },
    {
      "name": "Projection regression before",
      "command": "node --test tests/governance/profile-registry.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "detail": "Isolated Docker2CPU/4GiB,source de614d6e:0pass/1fail (^0.6.5 versus ^0.6.9). Probe52cb70ed."
    },
    {
      "name": "Initial registry lock regeneration",
      "command": "pnpm install --lockfile-only --ignore-scripts --ignore-pnpmfile --no-frozen-lockfile",
      "result": "fail",
      "failures": 1,
      "detail": "Isolated metadata-only Docker94a7ebd6: existing portable lock omits private AI/Tasks, so unprojected AI root fetch returns npm404. No product test ran."
    },
    {
      "name": "Portable registry lock regeneration",
      "command": "Omit only already-unlocked private AI/Tasks from scratch manifest; pnpm install --lockfile-only --ignore-scripts --ignore-pnpmfile --no-frozen-lockfile; restore exact tracked manifest",
      "result": "pass",
      "failures": 0,
      "detail": "Isolated Dockerf5566c1c. No host dependencies. Preserve every unrelated root range/selected version; release-required nested Search/SourceEditor/AgentUI entries and API/UI peer-context rekeys are explicit."
    },
    {
      "name": "Related package projection governance",
      "command": "node --test tests/governance/profile-registry.test.mjs tests/governance/ci-prerequisites.test.mjs",
      "result": "pass",
      "tests": 9,
      "failures": 0,
      "detail": "Isolated Docker4c895668,sourcee1dd591b:9pass/0fail, including preserved JavaScript/native pins and oneAPIcontext."
    },
    {
      "name": "Exact projection regression after",
      "command": "node --test tests/governance/profile-registry.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "detail": "Fresh isolated Docker exact-target replay1pass/0fail; receipts under ignored released-cohort."
    },
    {
      "name": "Installed public retirement guard and schema",
      "command": "node scripts/validation.mjs run test:ai -- tests/ai/plugin/retired-distribution.test.ts tests/ai/tools/app-tool-schema.test.ts",
      "result": "pass",
      "tests": 10,
      "failures": 0,
      "detail": "Run02edc50c,sourcee1dd591bcaf646ad8c0de24185bfaf9086d4d5d3:8schema+2retirement cases pass. Real final three normal npm packages plus five verified private archives;12private archive import routes verified. OriginalAIorigin0fetches, thirdparty1fetch; zero writes and settings/transcript/memory bytes preserved."
    },
    {
      "name": "Scratch formatter preparation",
      "command": "pnpm dlx prettier@3.3.3 --write selected files",
      "result": "fail",
      "failures": 1,
      "detail": "Dependency-free scratch probe could not resolve configured prettier-plugin-svelte. Corrected by installing only formatter/plugin in Docker scratch and preserving the repository configuration with an absolute plugin path. Corrected formatter89b8085a passes; no host package installation or product fallback."
    },
    {
      "name": "Initial CLI workspace acceptance",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/cli/Workspace.stories.ts",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "detail": "Run26efa48e,source5f61f46fec05f511ce63d260eb110aacdb483c0a:public-controller registration/disposal passes, but UI test queried Open settings before rendered NotesWorkspace ready. notesReady joins startup callback, not final controller/render readiness. Add existing data-notes-ready wait without changing30000ms deadline; later display modes not run."
    },
    {
      "name": "Released CLI field actual render",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/cli/Workspace.stories.ts",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "detail": "Runf9f1da25,sourced0a0ea137db888ad80fd471d07ddefd045838bcb:desktop/light1failed and1unhandled error. General selection reaches published UI0.2.4 CliSettingsField but throws CLI settings field host is not bound. Public controller registration/disposal passes; real General/Advanced presentation and laterCLI/leave assertions unqualified. Later display modes not run. Stop at source boundary; no consumer workaround, source/public function change or broad lane started."
    },
    {
      "name": "Independent actual installed npm graph and audits",
      "command": "Isolated full-worker install with five verified private archives; inspect node_modules/.pnpm/lock.yaml and all public target import routes; pnpm audit --json and pnpm audit --prod --json against restored actual projected manifest/lock",
      "result": "pass",
      "failures": 0,
      "detail": "Probelapis-released-cohort-probe-f7f3e18a-44bb-4869-b8c1-987d4f49c4a5,source85c9c1ef928b0cd9fd0fb85d9ce0c281ad63f765:API0.6.9/UI0.2.4/Profile0.2.6 resolve via normal npm integrity entries, each exactly one installed context, with15/5/2verified public import routes respectively; no target file/archive substitution. Five private archives and12import routes retained. Actual production0advisories; full audit3moderate/2high matches unchanged approved development policy with0gate errors. This does not qualify the failing CLI renderer or registry-only application distribution."
    },
    {
      "name": "Installed pinned specification discovery",
      "command": "pnpm exec spec-validator doctor --json; pnpm spec:search \"released retirement cohort\"",
      "result": "pass",
      "failures": 0,
      "detail": "Same isolated installed probe:doctor exit0, current Node spec-validator0.2.1. Search explicitly reports missing system qmd and degrades to documented rg fallback; semantic search is not claimed. Existing alias/global-skill warnings retained without global repair."
    },
    {
      "name": "Private fixed UI exact original replay",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run test:storybook -- catalog/plugins/cli/Workspace.stories.ts",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "detail": "Run58a3c48c,source53ee35039ae7b2c15357c02090005e4b7a50f5bd:desktop/light1failed,0unhandled; old host-binding error absent. General/Advanced, installedCLI and enable/create/token-file/revoke pass. Previously unreached final action requests nonexistent button Vault; observed production trigger is Current workspace: Catalog vault. Remaining three display modes not run. Parent authorized only this action locator correction; original teardown assertions/deadlines remain unchanged."
    },
    {
      "name": "Private fixed UI complete original CLI acceptance",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run test:storybook -- catalog/plugins/cli/Workspace.stories.ts",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "detail": "Run006af14a,source662e47aa1bc0aaf06b3d165e7ea4c730ae4885f4:all four cold desktop/narrow×light/dark modes pass,0unhandled/axe failures. Public registration/disposal, actual General/Advanced CLI render, scoped credential creation/revocation and real Back-to-vaults teardown pass. UI2dafcac private fixed candidate only; no published-UI or native acceptance inference."
    },
    {
      "name": "Private fixed UI directly affected Desktop families",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run test:storybook -- catalog/plugins/cli/Settings.stories.ts catalog/plugins/Workspace.stories.ts",
      "result": "pass",
      "tests": 44,
      "failures": 0,
      "detail": "Run3194b375,source7a4225f038387fe6adc8ab4fcee06508b617ebcd:11cases per each of four cold desktop/narrow×light/dark modes:7realNotesWorkspace settings/mobile/editing/reading/file-icon cases plus4CLIcomponent cases.44pass/0functional,unhandled oraxe failures. Fake scoped native clients only, no native/provider; privateUI2dafcac only."
    },
    {
      "name": "Initial complete consumer source gate",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run check:all",
      "result": "fail",
      "failures": 2,
      "detail": "Runaa27835f,source860d1309:catalog composition117families/0findings passes; specvalidation stops on distribution415physical lines>400 and verification33514bytes>32768. Types,Rust,unit,AI andbuild lanes not reached. Intake notes retain full detail in local-dependencies/E014; compact only duplicate backlog text and new verification annotations. No limits,suppressions,requirements,existing statuses or historical receipts changed."
    },
    {
      "name": "Exact specification validation after document repair",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run spec:validate",
      "result": "pass",
      "failures": 0,
      "detail": "Run661c87b0,source4ed142a0f0217996cd0f9b3684d78a29e894801e:all7validators pass across581chapters/134requirements. Distribution399lines; verification32745bytes. Existing native/CLI statuses and all prior evidence references preserved; only two short owning-intake links added. No document limits or validator behavior changed."
    },
    {
      "name": "Consumer source typing of the new CLI story",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run check:all",
      "result": "fail",
      "failures": 2,
      "detail": "Run8bdfde61,source7241a819cf6d4192cf5ea6775cbd1759684c7f85:parity117/0 and specification7validators pass. svelte-check finds2errors/0warnings only in newCLIWorkspace story:StoryObj<typeofmeta> requires productionNotesWorkspace args despite fixedfixture render, and getByRole does not accept exact. Apply existing Workspace story type pattern and remove the ignored unsupported option; literal General name matching, assertions, deadlines and intended UI flow remain unchanged. Rust,unit,AI andbuild not reached."
    },
    {
      "name": "Exact new-story typing replay",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run check:types",
      "result": "pass",
      "failures": 0,
      "detail": "Run06ae40f3,source06165c7619cd85c5620c188737a55da461fb04a7:svelte-check0errors/0warnings after type-only fixture repair. Production/Core/API/Language source and all public contracts unchanged; no test assertions, deadlines or intended flow weakened."
    },
    {
      "name": "Complete consumer source qualification with private fixed UI",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run check:all",
      "result": "pass",
      "failures": 0,
      "detail": "Rune2fb8c38,source56a31d394297e30f735356aaffd719a700fa9791:811governance/renderer cases;748AIcases/153files;290LinuxRustpasses with2existinghelperignores. Ordinary/e2e strictClippy,types0errors/0warnings,fullformat,spec7validators andparity117families/0findings pass. Productionrendererbuild passes (50.55s); existingRollupannotation/largechunkwarnings retained.2CPU/12GiB,6GiBbuildheap,fresh workspace-owned caches. ExplicitprivateUI2dafcac only;API/Profile normalnpm;17archiveimportroutes verified. No core/API/services/functions/Language code,pins orfuturecapabilities changed; no native/providerexecution."
    },
    {
      "name": "Private fixed UI catalog shard 1 original failures",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run test:storybook -- --shard=1/4",
      "result": "fail",
      "tests": 134,
      "failures": 2,
      "detail": "Run45d33720,source98e14c119b03:desktop/light stops with2failures/0unhandled. ChatLayoutReview CompactComposer remains data-status=booting; UpstreamStatus IncomingAndOutgoing leaves two tooltip nodes. Later modes not run. Preserve exact original failures."
    },
    {
      "name": "Private fixed UI catalog shard 2 original failure",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run test:storybook -- --shard=2/4",
      "result": "fail",
      "tests": 132,
      "failures": 1,
      "detail": "Run2c5a3e5a,sourceb0d713d258f7:narrow/light stops with1failure. ChangeHistory ViewNavigation leaves pointer-events:none. Preserve exact original failure; later modes not claimed."
    },
    {
      "name": "Private fixed UI catalog shards 3 and 4",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run test:storybook -- --shard=3/4; same for --shard=4/4",
      "result": "pass",
      "tests": 1108,
      "failures": 0,
      "detail": "Runscd8a5864/source6a79db20 and9620d538/sourceaeb8f137:shard3 126×4=504 and shard4 151×4=604 cold cases pass with0functional/unhandled/axe failures. PrivateUI2dafcac only; no published-UI inference."
    },
    {
      "name": "Private fixed UI focused three-family replay",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<explicit-six-archive-inventory> node scripts/validation.mjs run test:storybook -- catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/repository/UpstreamStatus.stories.ts catalog/plugins/ai/ChangeHistory.stories.ts",
      "result": "pass",
      "tests": 88,
      "failures": 0,
      "detail": "Run238012cb,source98e14c119b03:22cases×4cold desktop/narrow×light/dark modes=88/88 pass,0unhandled/axe. Original aggregate shard failures remain recorded and are not treated as clean aggregate admission."
    },
    {
      "name": "Public UI 0.2.5 original CLI workspace acceptance",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<public-ui025-five-archives> LAPIS_DESKTOP_BASE=9769c7febbdf7717ec5cac26b83b2ca7c0b51467 node scripts/validation.mjs run test:storybook -- catalog/plugins/cli/Workspace.stories.ts",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "detail": "Run5d5175cc,source4a9969f942fb:all four cold modes pass on published UI0.2.5/API0.6.9/AppProfile0.2.6 plus five private archives. Public registration/disposal, General/Advanced CLI render and Back-to-vaults teardown pass;0unhandled/axe. No private fixed-UI overlay."
    },
    {
      "name": "Public UI 0.2.5 specification check",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<public-ui025-five-archives> LAPIS_DESKTOP_BASE=9769c7febbdf7717ec5cac26b83b2ca7c0b51467 node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Run752cf669,source0e9a8dbdc645:canonical specification check passes on the public-UI graph after restoring the validator intake HTML slot and mapped governance/plugins notes. Ancestry uses Desktop base9769c7fe."
    },
    {
      "name": "Public UI 0.2.5 evidence check",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<public-ui025-five-archives> LAPIS_DESKTOP_BASE=9769c7febbdf7717ec5cac26b83b2ca7c0b51467 node scripts/validation.mjs run check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "Run809e1dbe,source0e9a8dbdc645:523evidence records pass;12archive import routes verified on the five-private/three-npm public-UI graph."
    },
    {
      "name": "Public UI 0.2.5 cold static Storybook build",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<public-ui025-five-archives> LAPIS_DESKTOP_BASE=9769c7febbdf7717ec5cac26b83b2ca7c0b51467 node scripts/validation.mjs run build-storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Runf3a76e26,source0e9a8dbdc645:cold build-storybook completes successfully on published UI0.2.5 with five private archives. Existing large-chunk Vite warnings retained; no private fixed-UI overlay."
    },
    {
      "name": "Pre-rebase hosted Picomatch exception and formatter repair",
      "command": "On the original PR56 head, remove GHSA-fc5q-39xc-vjpf from config/dependency-audit.json; format affected Markdown; run projected-audit-admission and ci-audit",
      "result": "pass",
      "tests": 46,
      "failures": 0,
      "detail": "Original PR56 Governance/Quality failed Prettier on four Markdown files; Dependency audits failed solely on the stale Picomatch exception while production stayed0 and only approved glob/minimatch development edges remained. PR57 later landed the same policy removal plus a fail-closed historical-finding regression on main. The rebased candidate inherits both from main and does not claim them as enclosing-change edits."
    }
  ],
  "remaining": [],
  "privateFixedUi": {
    "published": false,
    "historicalOnly": true,
    "version": "0.2.4",
    "sha256": "2dafcac8173701265ade22583c517fc582e3c2cbfcbe80fa4cd9f038097a8d5f",
    "source": "a8f11e338fbd0a34dd214264e7a48e8e223eaa0b",
    "producerRun": "b2a39b5d-d0bd-4ef2-8d4b-6be3b32497ad",
    "scope": "Historical temporary six-archive validation inventory only. Final consumer proof uses published UI 0.2.5 on normal npm; official published UI 0.2.4 remains broken and must not be reused.",
    "publicManifestAndExports": "Package manifest byte-identical to official0.2.4; export admission/map and four public declarations verified identical.",
    "baselinePreserved": "Original five-only inventory and validation config remain byte-identical; archive env override selected a separate ignored temporary config."
  }
}
```

Public UI 0.2.5 seals CLI workspace acceptance, specification, evidence and cold
static Storybook on the three npm packages plus five private archives. Original
catalog shard failures stay recorded; the 88/88 focused replay does not replace
aggregate admission. Fresh exact-main CI after merge, native installed-data
acceptance, registry-only distribution and frozen Deno host removal remain
separate program gates outside this intake.
