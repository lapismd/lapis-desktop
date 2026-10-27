# Default-workspace adoption of qualified Desktop Core intake

```json
{
  "id": "E-CORE-042",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.8", "M16.9"],
  "requirements": [
    "LD-MIG-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-006",
    "LD-GOV-008",
    "LD-GOV-010"
  ],
  "contractReview": "Adopt qualified cdf71da6 into default only after preserving its clean empty checkpoint. Retain exact runtime, tracked manifests/lock, native source selection and verified31public package bytes. Metadata-only adoption reuses E-CORE-040/041 product proof and checks its own changed documents; it cannot substitute for an original native gate.",
  "milestoneReview": "M16.8/M16.9 remain Done through immutable cdf71da6/E-CORE-040/041. Default adoption changes only metadata/canonical current checkpoint. All runtime/config/package/lock/Cargo/native selection bytes equal qualified code; actuallocal31publicarchives/116routes verify, includingAPI89e. No productretest or native/installedappreplacement. Final mainadoptiondocumentchecks pass; metadata/timestamp formatter/progress checks also runbeforecommit.",
  "versions": {
    "defaultBefore": "189a69d8",
    "defaultParentBefore": "f276120b30395860aebed67362bfb320ded6f22c",
    "qualifiedDesktop": "cdf71da6f5090436517ecc5597200465d11ff787",
    "qualifiedFrozenProduct": "4d5d64431ab13524b321e66f431faba19744ef79",
    "nativeCore": "03b8257d3d81b5c5c8970d16c7688f12f4ccc9ec",
    "apiCommittedSource": "000aef52d870d6812038b9877854926cd39ee344",
    "apiArchiveSha256": "89e81a5f13469fc3b52652e7822720ef0ec96b555df626a00a9de071f89de98e"
  },
  "files": [
    "MIGRATION.md",
    "PLAN.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/core/index.md",
    "spec/src/history/E-CORE-042.md"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Main workspace before and exact clean adoption",
      "command": "jjworkspace list;jjst;jjrebase -rpuqusqoz -ovpwvmspp;jjdiff --fromcdf71da6 --to@ --summary",
      "result": "pass",
      "failures": 0,
      "detail": "Actualdefault/Users/stevejuma/code/lapismd/lapis-desktop wascleanempty189a69d8 onf276120b. Rebasedonlyemptycheckpointontoqualifiedcdf;newacdce125empty, no tree differences. Preservedallotherworkspaces;no productconflict orretestnecessary."
    },
    {
      "name": "Main public archive installation path setup failure",
      "command": "Ignoredprivate31archiveprojection;officialpnpm --ignore-pnpmfile with originalabsoluteproducerpaths",
      "result": "fail",
      "failures": 1,
      "detail": "pnpmstoreindexfilename exceedsfilesystemlimitENAMETOOLONG forlongproducerpath. Trackedpackage/lockrestoredbyteexact. Stageexactarchivebytesatshortignoredpaths,rerunsameofficialinstallandpublicpayloadverification. No dependency patch or package rebuild."
    },
    {
      "name": "Adoption documentation setup attempt",
      "command": "Adoptionmetadata script;formatter",
      "result": "fail",
      "failures": 2,
      "detail": "An exactwrappedPLANtextanchor failedaftercanonicalmigrationintro waswritten; subsequentformattercorrectlyreportsmissingE042. Retrywithstableheadinganchor,createevidencebeforeformatting. No productfileschanged."
    },
    {
      "name": "Actual default public inputs and qualified tree equality",
      "command": "Ignoredshortarchiveprojection;officialpnpm --ignore-pnpmfile;verifyArchiveResolution;JJbytecomparisoncdf71da6",
      "result": "pass",
      "failures": 0,
      "detail": "All31exactqualifiedarchives/116activeimport routespass;bothtrackeddependencyfilesrestorebyteexact. Updatedtruthfulinstalledreceipt anddefaultvalidationselection;oldloaderfilesuntouched. PurgedonlyinactivegeneratedVite/Storybookcaches;no7480listener exists. Currentruntime,alltrackeddependency/Cargo/native selections identicalcdf; onlyPLAN/MIGRATION/specdocschanged. Preserve99native/2088catalog/537Node744AI/260Rustclock2/bothbundleproofwithoutrebuild."
    },
    {
      "name": "Final default-adoption documentary checks",
      "command": "final-docs Dockerc83d0c8d-f3ac-4617-8699-b8939d835545;finalpinnedNode24progress/formatter",
      "result": "pass",
      "failures": 0,
      "detail": "Exactcdfbase;formatonlyflagsbyte-identicalacceptedimmutableEAI109. Rustfmt,architecture/App/parity,progress57tasks319records andcanonical4lanes(validate,rustfmt,mdbook,specfirst)pass. Collectedterminal0/noOOM;defaultchangesonly7documents, allruntime/package/nativeinputsverifiedequal. No productretestneeded."
    }
  ]
}
```
