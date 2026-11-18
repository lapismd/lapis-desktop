# Integrate held automation with the retired-AI main

```json
{
  "id": "E-DEPENDENCIES-017",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "blocked",
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-008"
  ],
  "files": [
    ".github/dependency-automation/artifact-projection.json",
    ".github/dependency-automation/canonical-intake.json",
    ".github/dependency-automation/development-high-proposal.json",
    ".github/workflows/dependency-completed.yml",
    "docs/proposals/desktop-picomatch-development.md",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/ci/commands.mjs",
    "scripts/dependency-automation/artifact-projection.mjs",
    "scripts/dependency-automation/check-canonical-intake.mjs",
    "scripts/dependency-automation/maintenance-note.mjs",
    "scripts/dependency-automation/projected-audit-admission.mjs",
    "scripts/dependency-automation/projected-audit-context.mjs",
    "scripts/dependency-automation/source-intake-reader.mjs",
    "scripts/validation/lanes.json",
    "scripts/validation/native-sources.mjs",
    "spec/src/backlog.md",
    "spec/src/current/ci.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-DEPENDENCIES-017.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "spec-validator.config.mjs",
    "tests/fixtures/desktop-audit-full.json",
    "tests/fixtures/desktop-audit-production.json",
    "tests/fixtures/desktop-validator-intake.json.gz",
    "tests/governance/artifact-projection.test.mjs",
    "tests/governance/completion-delegate.mjs",
    "tests/governance/dependency-automation-completion.test.mjs",
    "tests/governance/dependency-automation-intake.test.mjs",
    "tests/governance/dependency-intake-vcs.test.mjs",
    "tests/governance/dependency-note-consumption.test.mjs",
    "tests/governance/intake-vcs-fixture.mjs",
    "tests/governance/projected-audit-admission.test.mjs",
    "tests/governance/projected-audit-context.test.mjs",
    "tests/governance/validation-native.test.mjs",
    "tests/governance/validation.test.mjs"
  ],
  "contractReview": "Integrate only missing SDK canonical/source-VCS/immutable seeded-projection guards, held completion caller and read-only pinned JJ exports onto exact currentmain2015. Preserve all newer public archive/export admission, retirement source/private/native pins, removed UI/Deno bootstrap, main collector/evaluator and existing declared security authority. Exact SDK0.2.1 remains selected; root specifier/override metadata becomes exact without runtime graph update. No writer/capability/phase activation or transferred decision. All prior governance wording/requirements/maps preserved; only narrative paragraph boundaries join to retain physical budget.",
  "acceptanceReview": "The previous PR50/aaca hosted fixture is factual history only, not qualification of this new graph. Old aaca branch/bookmark and its immutable E012/E013/E014/E015 remain available at exact source URL. A new official-API-verified currentmain eight-archive projection and fresh source/raw audits must qualify this integrated head. Existing source-declared legacy HIGH behavior is unchanged and not independently authenticated here; allowed legacy evaluation is not a new adoption security decision.",
  "versions": {
    "baseline": "2015c1ead2042b6a9f5f8c52e37d205bdd4773b7",
    "historicalHeldHead": "aaca74041bfc80cd887093c3cd1a47df1382a3ba",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "reviewedSharedProjection": "c4b54f932cd4239d9a8f0b3e1fb327f28b63dfb2",
    "shapeSha256": "c0c86889045958d5ae1a4fbc4822c55aae6af01bcfabe907ee930ae7307be881",
    "descriptorSha256": "18ec13aa4cbaf0eac8db6af508dddf83aacec65cd5d8a43f68d9ded44d0df9a4",
    "sourceInputCount": 21,
    "mainArtifactRun": 44238333976,
    "mainArtifactId": 14398348381,
    "mainArtifactZIP": "96fcb395ea32b5ee4e7e7297d6f5e1a654c53ffa674579b3b9559edf2b9f7f91"
  },
  "runs": [
    {
      "name": "Original missing source boundary",
      "command": "node --test tests/governance/artifact-projection.test.mjs on2015 beforeimplementation",
      "result": "fail",
      "failures": 1,
      "detail": "Required module/descriptor/independent source guard is absent, not a fabricated product regression."
    },
    {
      "name": "Current-main trusted archive acquisition",
      "command": "gh API artifactZIP; independent SHA256/source/run/attempt/12identity-input/9entry checks; normal verifyPackageArchive for8dependency archives",
      "result": "pass",
      "failures": 0,
      "detail": "Exact2015 producer artifact, Notes5ff/Plugins969 source cohort, complete LanguageService9473byte archive and all public exports qualify explicit private overlay inputs. No cross-run same-run artifact admission is claimed."
    },
    {
      "name": "Real public-tool no-op",
      "command": "Reviewed c4 nativeProjectionArtifacts+mergeProjection on exact current5inputs SDK0.2.1",
      "result": "pass",
      "failures": 0,
      "detail": "Official Node24.15/pnpm10.34.5 bundle; genuine update and frozen install. changedfalse/all5originalbytesunchanged. This3node SDK/jiti/TypeScript proof is not full private graph qualification or fake update."
    },
    {
      "name": "First source integration run",
      "command": "Six directly affected governance files",
      "result": "fail",
      "failures": 1,
      "detail": "132/133 pass. Copied old audit-context test assumed full audit checkout history; current quality/governance already have full history and current audit collector remains unchanged, so new test now asserts retained actual owning audit recipe rather than changing workflow."
    },
    {
      "name": "Native read-only and completion controls",
      "command": "node --test tests/governance/validation-native.test.mjs tests/governance/dependency-automation-completion.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "14/14 pass with real dirty-sibling operationID/files unchanged and preserved newer JavaScript/native pin distinction. Missing-only note lifecycle controls also pass."
    },
    {
      "name": "Complete affected independent controls",
      "command": "Eight focused source guard/VCS/note/audit-context/completion/native files",
      "result": "pass",
      "failures": 0,
      "detail": "149/149 pass. Genuine historical SDK pair retains its original frozen source context; currentmain no-op independently binds new descriptor. Present note syntax/byte/path checks run before no-op; absent consumed notes require equal full dependency fact tuple. The original currentmain collector/policy/private/native/runtime/CI source inputs are byte-identical."
    }
  ],
  "remaining": [
    "Complete affected cold check/test/build/spec/evidence/catalog acceptance and fresh actual8archive full/production audit on exact new source.",
    "Freeze final21input/descriptor/source/archive/platform hashes only after coherent source commit; pending factual proposal remains disabled/nullauthority/emptyoperational projections.",
    "Exact-hosted newcandidate/main, real scheduled health and trusted metadata callback proof remain required. Oldaaca hosted source does not bind currentmain2015.",
    "Root reconciles separate source-declared legacy HIGH approval provenance before any future exact authority decision; no transfer/extension/removal/inference or newsecurity grant.",
    "Shared capability/SDK-only eligibility/hold/sourceactivation remain Root-owned and disabled. Native macOS/headed/model/provider/distribution/visual baselines remain separate."
  ]
}
```

Historical old source:
[immutable aaca evidence](https://github.com/lapismd/lapis-desktop/tree/aaca74041bfc80cd887093c3cd1a47df1382a3ba/spec/src/history).
