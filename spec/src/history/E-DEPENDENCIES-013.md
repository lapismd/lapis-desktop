# Match Desktop intake comparison revisions across Git and Jujutsu

```json
{
  "id": "E-DEPENDENCIES-013",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "blocked",
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-010"
  ],
  "files": [
    "scripts/dependency-automation/source-intake-reader.mjs",
    "scripts/dependency-automation/check-canonical-intake.mjs",
    "tests/governance/dependency-automation-intake.test.mjs",
    "tests/governance/dependency-intake-vcs.test.mjs",
    "tests/governance/intake-vcs-fixture.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/verification.md",
    "spec/src/backlog.md",
    "spec/src/navigation/history-02.md",
    ".github/dependency-automation/development-high-proposal.json",
    "docs/proposals/desktop-picomatch-development.md",
    "spec/src/history/E-DEPENDENCIES-013.md"
  ],
  "contractReview": "The Desktop-owned VCS caller must capture one immutable comparison baseline/head for previous bytes and changed-file selection. Honor paired actual hosted source revisions, reject unavailable/stale ancestry, distinguish clean Git, selected JJ candidate/local working change and empty JJ bootstrap atop checked-out HEAD. The installed SDK default working-copy semantics remain correct and unchanged. Private runtime/native/archive/CalVer contracts, audit admission and central writer hold do not change.",
  "acceptanceReview": "Actual owning CLI subprocesses exercise the real released SDK0.2.0\u21920.2.1 fixture with an actual managed empty note in real disposable Git/JJ repositories. Original false acceptances are reproduced before implementation; matching baseline/changed-path selection restores existing note/scope checks. The fixture is controlled source acceptance, not unchanged-private-root bot end-to-end. Product/UI/native payload bytes and all eight archive inputs remain unchanged; original cold2168 UI proof is reused for unaffected presentation only. All8 final cold source stages pass:904Node/746AI/290Rust+2existingignored; fullcheck/build,5spec lanes and513evidence records. Exact implementation/test bytes match the final source snapshot. HIGH/private/hosted gates remain held.",
  "versions": {
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "priorSource": "311b3dd838a2c71cbe80512a0b28a3dd0d9743c1",
    "immutablePriorPacket": "E-DEPENDENCIES-012",
    "image": "sha256:36d8f2ab59683921ee66ef0f48b3dfa62c921dd958dd1f13342ec765ff6082d4",
    "finalSourceSnapshot": "be35d4fee2938a445f1678554d6c03ca7b38919b",
    "finalSourcePackSha256": "7e3cd72d229766716b6a3b97015f42d9ee1f42c8f948d2ad1685f95519cbbd22"
  },
  "runs": [
    {
      "name": "Actual initial VCS regression",
      "command": "node --test tests/governance/dependency-intake-vcs.test.mjs",
      "result": "fail",
      "failures": 11,
      "detail": "Before implementation:5 concrete false clean-Git acceptances (unrelated source and malformed/runtime/oversized/null notes),3 ignored hosted-pair negative groups,3 absent captured-reader contract assertions. Baseline bytes selected HEAD^1 while public changesFromVcs({}) intentionally selected Git HEAD\u2192working files. JJ bootstrap selected an empty working change, not its checked-out candidate. Log desktop-vcs-before.log retained."
    },
    {
      "name": "Exact first repaired transport target",
      "command": "node --test tests/governance/dependency-intake-vcs.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "11/11 pass, including actual owning CLI; no injected changedFiles substitutes for transport."
    },
    {
      "name": "Complete focused canonical and transport controls",
      "command": "node --test tests/governance/dependency-intake-vcs.test.mjs tests/governance/dependency-automation-intake.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "53/53 pass:4 actual positive transport modes,15 actual malformed/note/scope negatives across Git/JJ-selected/JJ-bootstrap,3 hosted-pair groups including missing/stale revisions,3 changed-candidate negatives,28 existing independent guard controls. Real before-byte SDK0.2.0 and exact selected source/head are asserted. Local fixtures use JJ for commit/selection; moving only disposable JJ metadata exposes genuine Git transport. Original5 unsafe acceptance cases now fail at owning CLI."
    },
    {
      "name": "Exact original committed transport negative control",
      "command": "execute original311b guard/reader/note bytes and current guard against identical real Git/JJ SDK fixtures",
      "result": "pass",
      "failures": 0,
      "detail": "6 controls: original cleanGit and emptyJJbootstrap incorrectly accept unrelated source and runtime release notes (4 false accepts); new CLI rejects all4. ExplicitlyselectedJJ rejects both before/after (2 preserved controls). Immutable original311b bytes exported to owned ignored cache only; no source swaps, consumer override or sibling edit. Receipts desktop-vcs-original311-control/results.json."
    },
    {
      "name": "Non-colocated JJ compatibility exploration",
      "command": "expanded actual VCS target during adapter revset probe",
      "result": "fail",
      "failures": 9,
      "detail": "Intermediate54-case probe45pass/9fail exposed unavailable git_head() revset in installedJJ0.46 plus absent HEAD@git alias. Probe was not a coherent qualified source and is retained as failed exploration. Final adapter removes both assumptions: optional actual colocated GitHEAD only for bootstrap detection; nativeJJ captured commit/ancestry reads for non-colocated sources. Original3MiB buffer bound restored."
    },
    {
      "name": "Final coherent canonical and five-transport controls",
      "command": "node --test tests/governance/dependency-intake-vcs.test.mjs tests/governance/dependency-automation-intake.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "54/54 pass; added real non-colocatedJJ selectedcandidate to existing4 transport positives. Beforebytes use captured baseline, changed paths use the exact same captured base/head, hosted pairs must match candidate and real ancestry. All malformed/runtime/oversized/null/scope and stale-selection cases retained."
    },
    {
      "name": "First immutable cold full source qualification",
      "command": "owned eight-archive controller desktop-vcs-complete-source: smoke,Profile,audit-collection,check,test,build,spec,evidence",
      "result": "pass",
      "failures": 0,
      "detail": "All8 stages0 on snapshotfd49a7f65ed6e68ba581f0efbc01e97f95a48601/pack1769b721460d1fa709fee2677ec68edea6259bb80db99a9b9b505eafea46ef38. 903Node,746AI,290Rust+2existingignored,normal/e2e strictClippy,rendererbuild,5spec lanes and513evidence records pass. Actual8archive and native inventories byte-identical to preceding full consumer proof. This earlier53-focused-case implementation predates non-colocatedJJ compatibility correction and does not qualify that newer source; final coherent full run follows."
    },
    {
      "name": "Latest Deno-free tooling discovery",
      "command": "npm view @lapismd/spec-validator version; pnpm spec:search --semantic dependency intake; spec-validator doctor",
      "result": "pass",
      "failures": 0,
      "detail": "Latest publishedNodeSDK0.2.1 already installed/pinned. QMDsemantic search returns owning governance/local-dependency chapters; doctor10passes and1intentional portable-script-alias warning (no repair/configuration changes)."
    },
    {
      "name": "Final coherent cold complete source qualification",
      "command": "run-desktop-vcs-final-complete-source.mjs: frozen smoke,Profile,audit-collection,pnpmcheck,pnpmtest,pnpmbuild,pnpmspec:check,pnpmcheck:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "All8 stages0 on exactsnapshotbe35d4fee2938a445f1678554d6c03ca7b38919b/pack7e3cd72d229766716b6a3b97015f42d9ee1f42c8f948d2ad1685f95519cbbd22. 904Node/746AI/290Rust+2existingignored; normal/e2e strictClippy,0Svelteerrors/warnings,116storyfamilies,rendererbuild,5spec lanes and513evidence records pass. All5 affected implementation/test modules match snapshotbytes. Actual8archives and fullnativeinventory match prior fullsource evidence byte-for-byte;2168coldUI cases reused only for unchanged product. InstalledrawallHIGH2/MODERATE3,production0; auditcollectionstage0 is NOT aggregateHIGHadmission. Coherent node/QMD/formatter/normalguard budgets pass; no secret/sourceRuntime/privatepublication or baseline changes."
    }
  ],
  "remaining": [
    "No sourceHIGH activation or final operatorquestion: the proposal remains disabled and old E012/14-input source context is immutable historical evidence, not qualification for this new caller. Future reviewed shared projection descriptor may change relevant bindings; root owns final context freeze/decision.",
    "Private original-root native pnpm updater still fails on unpublished AI/Tasks; no publication, fake version, candidate-code execution or skip-installs introduced.",
    "Hosted current-head/default/scheduled/callback settlement and central private write activation remain independently gated; foreign retirement drafts remain untouched."
  ]
}
```
