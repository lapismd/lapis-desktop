# Qualify native Sync delivery against current main

```json
{
  "id": "E-SYNC-008",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-SYNC-001",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-004",
    "LD-GOV-003"
  ],
  "contractReview": "Preserve the qualified disabled native Sync source and current main release-candidate identity without rewriting earlier slices or committed receipts. Main changes application version and CLI qualification metadata; admission, content authority and release gates remain unchanged.",
  "acceptanceReview": "E-SYNC-006 qualifies the exact functional source before this metadata integration:772governance/renderer,746AIpolicy,287Rust and2152coldcatalog passes plus all checks/builds/specs. This merge imports current main versionrc2 and untouched CLI receipts. Combined check/test/build/spec and affected version-presentation acceptance follow. Actual Tauri/OS/fullSync and release gates remain open.",
  "versions": {
    "source": "3fd0c987f79c7d09ebeaf90e108645cb6b526a0a",
    "catalogSource": "6fe0833674c782b20432acc2c406873cb82bdd6d",
    "main": "1717bbe3ccc35701b66b8bd4b54bb9fa936cd8aa",
    "application": "2026.31.6-rc.2",
    "core": "5d3d463b57221e6e0be46618c0ec00db3c1938e6"
  },
  "files": [
    "docs/desktop-release.md",
    "package.json",
    "spec/src/backlog/distribution.md",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/history/E-CLI-006.md",
    "spec/src/history/E-CLI-007.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/tauri.conf.json",
    "spec/src/history/E-SYNC-008.md",
    "scripts/evidence.mjs",
    "tests/governance/evidence-history.test.mjs"
  ],
  "runs": [
    {
      "name": "Merged verification table exceeds existing byte limit",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Report28fb12cd-308a-46fc-8784-89726a0d0b0d:verification.md32796bytes exceeds32768 after combining current-main CLI metadata with nativeSync qualification. Normalize redundant spaces in its longest evidence row; preserve every quarantine, boundary, receipt and limit. Later pipeline lanes did not execute."
    },
    {
      "name": "Merged source exposes scalar parent assumption in evidence audit",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Report70b8c7bd-ad16-4129-ae69-0e2ef270e3bf:custom evidence audit invokes jj file list -r @- at a two-parent merge and fails before tests/build. Replace scalar parent handling with comparisons against every parent plus explicit PR base, retaining immutable-history and fresh-coverage rules."
    },
    {
      "name": "Exact multi-parent evidence regression before implementation",
      "command": "pnpm validation -- run validation:check -- tests/governance/evidence-history.test.mjs",
      "result": "fail",
      "failures": 3,
      "detail": "Report3157b4d6-475f-4793-8843-8d74e6207163:98pass/3fail/0skipped of101. New actual JJ merge cases require independent receipts to survive, forbid rewriting either parent receipt, and forbid inherited receipts from covering new post-merge work. All three fail on ambiguous @-. Existing2history and96runner cases pass."
    },
    {
      "name": "Intermediate multi-parent checks identify unsnapshotted fixture input",
      "command": "pnpm validation -- run validation:check -- tests/governance/evidence-history.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Report05c0c272-1498-41b1-9a5d-606419767279:100pass/1fail. Both immutable-parent cases pass; post-merge source-edit case had not snapshotted its filesystem edit before read-only JJ queries. Snapshot the fixture as the real runner does, retaining every assertion."
    },
    {
      "name": "Exact complete evidence history and runner regressions after repair",
      "command": "pnpm validation -- run validation:check -- tests/governance/evidence-history.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Reportfcca9dcc-30d2-4487-829d-fdea03b50445:101pass/0fail/0skipped; all3original new merge cases now pass. Every parent and explicit base remains authoritative for immutable history and fresh source coverage; no single-parent shortcut."
    },
    {
      "name": "Combined current-main complete checks",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Report58862dac-040f-4a40-b25c-a674ef1c4948:full check passes types, architecture, App ownership, native Rust and formatting; verified32archive import routes. Original ambiguous-parent and chapter-size failures are resolved without weakening boundaries."
    },
    {
      "name": "Combined current-main complete test surface",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "Report07057cc9-622b-47a2-a0a9-539ed3c43cd3:775governance/renderer,746AIpolicy across152files,287Rust passes;0failures. Two existing subprocess-helper ignores remain invoked by real restart/interruption cases, not new qualification exclusions."
    },
    {
      "name": "Combined current-main production renderer build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Reportcc0119ab-5d9a-4cc7-9a40-100a4d02334e:production build passes against32verified archive import routes. Source retains the exact UI/runtime inputs qualified by2152coldcatalog cases before the versionrc2 metadata integration; no baseline update or native platform claim."
    },
    {
      "name": "Combined current-main complete specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Report4773ce67-b4ce-4005-8e4b-85f6c46ff7b7:all4specification lanes pass, including canonical audits and spec-first. Final documentation validation follows after adding these results."
    }
  ],
  "remaining": [
    "Hosted exact-head CI and source PR delivery/merge.",
    "Tauri/OS and full encrypted Sync qualification; separately authorized publication/distribution and visual review."
  ]
}
```
