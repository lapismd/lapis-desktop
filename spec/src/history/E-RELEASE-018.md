# Release tracker integration into main

```json
{
  "id": "E-RELEASE-018",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M11", "M12"],
  "requirements": ["LD-GOV-001", "LD-GOV-002", "LD-GOV-003", "LD-MIG-002"],
  "contractReview": "Land the preserved codex/release-coordination evidence and its operational tracker in the default workspace without rewriting immutable evidence. E-RELEASE-017 is copied byte-identical from a8572603; the factual reconciliation lives in this appended record and in RELEASE.md's own non-immutable maintenance paragraph, which now states the integration date and source, main's existing ^0.6.0 consumption and that E-RELEASE-001-016 remain unlanded. No canonical requirement, task status, gate string, dependency range, wave approval or publication decision changes, and publication stays a separate gate.",
  "milestoneReview": "M11 remains Deferred and M12 remains Planned; neither is promoted and no signing, distribution, installation, upgrade, rollback or publication gate is completed. Neither record is selected into the task ledger, so no status, dependency or next action moves. Desktop consumption of @lapismd/design-core ^0.6.0 is unchanged and stays recorded by the dependency intake chapters.",
  "versions": {
    "sourceBookmark": "a8572603654ef8342162f7a29f9cd041850ab762",
    "sourceParent": "28c0224c63ad8793909fb4a456954c1510788532",
    "trackerBaseLanding": "5c46fe5997f55c2206c1fa9e1956e67f6de97588",
    "desktopMainBeforeLanding": "09fedef9d176a4d08cb24d48b5af582c16c054dd",
    "unlandedLineageCommits": 17,
    "designCoreRange": "^0.6.0",
    "designCoreReleased": "0.6.0",
    "landedRecordSha256": "3f0d0b209e72133828014b6a552c7242dd64090f4083cd79ae98bb52b5aecfd9",
    "trackerLines": 396,
    "node": "24.10.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "RELEASE.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/E-RELEASE-017.md",
    "spec/src/history/E-RELEASE-018.md"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Provenance audit before landing",
      "command": "jj log -r 'ancestors(a8572603) & ~ancestors(@)'; jj file show -r {40b50d3e,bfa6a9b1,28c0224c,a8572603} RELEASE.md; ls spec/src/history | grep -i RELEASE",
      "result": "pass",
      "failures": 0,
      "detail": "17 commits of the release lineage are unlanded. Main contained no RELEASE.md and no E-RELEASE-* record at 40b50d3e or bfa6a9b1; the tracker exists only from 28c0224c onward, and the bookmark tip merely modifies it. Landing therefore needs the tracker's own integration note rather than a cherry-picked delta."
    },
    {
      "name": "Verbatim evidence landing and lane probe",
      "command": "jj file show -r a8572603 spec/src/history/E-RELEASE-017.md > spec/src/history/E-RELEASE-017.md; jj file show -r a8572603 RELEASE.md > RELEASE.md; pnpm check:progress; pnpm spec:first; pnpm spec:validate; pnpm spec:check; pnpm exec prettier --check RELEASE.md spec/src/history/E-RELEASE-017.md spec/src/SUMMARY.md",
      "result": "pass",
      "failures": 0,
      "detail": "E-RELEASE-017 lands byte-identical (sha256 3f0d0b20... both sides). With the record, tracker and SUMMARY entry present, progress passed 58 tasks/326 evidence records, canonical validation reported 6 validators/371 chapters/116 requirements, spec:check passed all four lanes, spec:first reported no protected files changed and Prettier was clean on all three files."
    },
    {
      "name": "Factual reconciliation without rewriting evidence",
      "command": "Edit only the RELEASE.md stamp and maintenance paragraph; sha256 comparison of E-RELEASE-017.md against a8572603; wc -l RELEASE.md; prettier --check",
      "result": "pass",
      "failures": 0,
      "detail": "The immutable record stays untouched. The operational tracker grows 394 to 396 lines and now records the 2026-10-27 integration into the default workspace from a8572603 (qualified Desktop landing 5c46fe59), main's existing ^0.6.0 range, that E-RELEASE-001-016 remain on the unlanded lineage and that this record documents the integration. No wave, approval, version, next-step or gate statement changed."
    },
    {
      "name": "Final documentation lanes for this slice",
      "command": "pnpm exec prettier --check RELEASE.md spec/src/history/E-RELEASE-017.md spec/src/history/E-RELEASE-018.md spec/src/SUMMARY.md; pnpm check:progress; pnpm spec:first; pnpm spec:validate; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "With this appended record present, Prettier is clean on all four touched files, progress passes 58 tasks/327 evidence records, canonical validation reports 6 validators/372 chapters/116 requirements, spec:first reports no protected files changed and spec:check passes all four lanes. SUMMARY.md stays at 395 lines and RELEASE.md at 396."
    }
  ],
  "gaps": [
    "E-RELEASE-001-016, releases #1-#31 and evidence #32 referenced by the tracker remain on the unlanded codex/release-coordination lineage (17 commits). Main holds only E-RELEASE-017 and this record, so the tracker's numbered release history does not resolve inside main.",
    "The tracker's 'Next is Wave 5 Lapis Notes reconciliation' has no owning task in main. M11 stays Deferred, M12 stays Planned, and signing, publication, deployment and installed-application replacement remain separate gates.",
    "Neither record is selected into the task ledger: selecting them would force an edit to migration.md at its 400-line cap for a documentation landing that promotes no gate. The record set is discoverable through SUMMARY.md and mdBook."
  ]
}
```
