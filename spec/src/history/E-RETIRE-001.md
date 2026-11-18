# Shared AI retirement public consumer intake

```json
{
  "id": "E-RETIRE-001",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "desktopBase": "18aac2800dcc69ea50b1e78b242b95c667af0447",
    "notesSource": "5ffb33c152404b6880debd1b5fd70762121d6196",
    "originalQualifiedNotesSource": "b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e",
    "hostNode": "26.9.0"
  },
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-AI-002",
    "LD-AI-004"
  ],
  "files": [
    "config/dependency-audit.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/ci-sources.json",
    "tests/ai/plugin/retired-distribution.test.ts",
    "spec/src/current/ai-adapter.md",
    "spec/src/current/ai.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/backlog/distribution.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "spec/src/history/E-RETIRE-001.md",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/validation-native.test.mjs"
  ],
  "contractReview": "Consume the Notes-owned retired-distribution guard through installed public exports. Keep current native/bundled AI, independent third-party origins, Rust pins and all saved data. The approved App Profile metadata cleanup preserves its active build helper. Adopt released Core0.13.5 through the existing override. The separately approved Picomatch exception matches only two exact development findings and expires2026-11-30; production findings still block.",
  "acceptanceReview": "The before/after target imports the installed public installer and in-memory vault adapter. It proves rejection before fetch for the original retired artifact, ordinary fetch admission for an independent ai origin and unchanged settings/transcript/memory bytes with no writes. The allowed origin deliberately returns404; this is not successful third-party bundle installation, installed-plugin migration or native cold lifecycle qualification.",
  "runs": [
    {
      "name": "Exact public consumer before",
      "command": "node scripts/validation.mjs run test:ai -- tests/ai/plugin/retired-distribution.test.ts",
      "result": "fail",
      "failures": 1,
      "detail": "bac4e318-95b7-41f3-acce-17767d3d15c5:1pass/1fail; old API fetches retired artifact."
    },
    {
      "name": "Exact public consumer after",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/validation/retirement-candidate-archives.json node scripts/validation.mjs run test:ai -- tests/ai/plugin/retired-distribution.test.ts",
      "result": "pass",
      "failures": 0,
      "detail": "2d6bd23a-253e-4b7d-97d6-a3f5ffb1fb1a:2pass. Legacy cached V1 metadata has no downloadUrl."
    },
    {
      "name": "Guard cohort AI suite",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/validation/retirement-candidate-archives.json node scripts/validation.mjs run test:ai",
      "result": "pass",
      "failures": 0,
      "detail": "b76cb1aa-2480-40c3-8609-b50cd46892aa:748pass/153files."
    },
    {
      "name": "Guard cohort types",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/validation/retirement-candidate-archives.json node scripts/validation.mjs run check:types",
      "result": "pass",
      "failures": 0,
      "detail": "e5a00b2b-3be5-489e-b263-773b43657585:0errors/0warnings."
    },
    {
      "name": "Actual private cohort audit before peer cleanup",
      "command": "Isolated pnpm audit --json and pnpm audit --prod --json against captured installed lock",
      "result": "fail",
      "failures": 1,
      "detail": "Picomatch is production via app-profile>vite. Earlier nested .local audit attempts accidentally selected the parent lock; they were discarded and replaced with actual installed-lock replays in OS temp directories outside every repository."
    },
    {
      "name": "Peer-cleaned actual public consumer suite",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/validation/retirement-peer-fixed-archives.json node scripts/validation.mjs run test:ai",
      "result": "pass",
      "failures": 0,
      "detail": "730c4e46-999a-4f7e-8ee8-7959a916af1a:748pass/153files; source-owned six Notes archives plus unchanged AI/Tasks prerequisites."
    },
    {
      "name": "Actual private cohort audit after peer cleanup before exception",
      "command": "node .local/validation/retirement-audit-peer-fixed.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Pinned pnpm10.34.5 audit runs outside every repo. Production0; sole gate error GHSA-fc5q-39xc-vjpf through exact Storybook/unplugin4.0.7 and WDIO/mocha/chokidar/anymatch2.3.2 development edges."
    },
    {
      "name": "Approved installed graph audit",
      "command": "node --input-type=module -e 'import {runAudit} from \"./ci-audit.mjs\"; process.exitCode=runAudit();' in the isolated actual installed projection with approved policy",
      "result": "pass",
      "failures": 0,
      "detail": "Production0; only exact approved development findings accepted. Five complete audit-policy controls pass, retaining production, expiry, incomplete-report and stale-approval rejection."
    },
    {
      "name": "Full consumer check specification size finding",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/validation/retirement-peer-fixed-archives.json node scripts/validation.mjs run check:all",
      "result": "fail",
      "failures": 1,
      "detail": "37686159-ab79-45b4-abb6-865f048f82b9 rejects a401-line governance page. Keep the page at400 and detailed installed-graph context in local-dependencies; preserve the limit and all mappings."
    },
    {
      "name": "Full intake exposes old exact cohort expectations",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/validation/retirement-peer-fixed-archives.json node scripts/validation.mjs run check:all",
      "result": "fail",
      "failures": 2,
      "detail": "b567a8e1-9b5f-49f0-ad33-32f72d20740f:types, ordinary/e2e strict Clippy and formatting pass; governance/renderer794cases have792pass/2fail. Two exact-source expectations still named old Notes01bf01f6. Refresh them to the qualified source and Core0.13.5 without changing native pins or weakening assertions."
    },
    {
      "name": "Exact source-pin expectation regressions",
      "command": "node --test --test-name-pattern='released Notes cohort|portable sources retain' tests/governance/ci-prerequisites.test.mjs tests/governance/validation-native.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Before2fail; after2pass/0fail. These source-only governance checks use Node on the host; product qualification remains Docker."
    },
    {
      "name": "Complete qualified consumer source lanes",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/validation/retirement-peer-fixed-archives.json node scripts/validation.mjs run check:all",
      "result": "pass",
      "failures": 0,
      "detail": "b64db6df-89ad-4585-8a8a-eea4190b9c0b:types0/0, ordinary/e2e strict Clippy, formatting,794governance/renderer,748AI over153files,290Rust pass/2existing ignores, production renderer build pass."
    },
    {
      "name": "Static catalog from actual installed graph",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/validation/retirement-peer-fixed-archives.json node scripts/validation.mjs run build-storybook",
      "result": "pass",
      "failures": 0,
      "detail": "5cd1a62c-de1a-49fd-a1ac-14903b09e9eb passes. Captured actual catalog installed graph adds only brace-expansion5.0.12 relative to first capture; independent isolated audit still has0production advisories and0approved-policy gate errors."
    },
    {
      "name": "Merged owner exact archive identity",
      "command": "Notes validation:consumer-pack at5ffb33c152404b6880debd1b5fd70762121d6196",
      "result": "pass",
      "failures": 0,
      "detail": "07cf0ce2-cf5f-4924-8620-3feae56b4313. All six SHA256s exactly match the tested b3a93b2f cohort. Final pin and ignored default overlay select these reachable merged-main archives; AI/Tasks archives remain unchanged."
    },
    {
      "name": "Remaining consumer qualification",
      "command": "pnpm check:all; pnpm spec:check; pnpm test:storybook; pnpm build-storybook",
      "result": "pending",
      "failures": 0,
      "detail": "Run in omarchy Docker with the explicitly selected candidate archives. No host fallback or baseline changes."
    }
  ],
  "remaining": [
    "Final exact-main pin expectations, focused public installer and canonical/evidence checks.",
    "Complete remaining consumer check/test/build/spec/catalog lanes and hosted CI.",
    "Actual old-external versus bundled/native AI data, Safe Mode and cold close/reopen acceptance remain open.",
    "API/Profile publication, registry-only intake, website deployment and installed-app replacement remain separate."
  ]
}
```

The owner repair and unchanged compiled helper are recorded in Notes PR164. The
full AI suite does not qualify every native migration backlog item.
