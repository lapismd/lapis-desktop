# Explorer filename replacement quarantine

```json
{
  "id": "E-RELEASE-012",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-FILE-003", "LD-DESK-005", "LD-REL-002"],
  "files": [
    "tests/desktop/file-ui-mutations.test.mjs",
    "spec/src/current/files.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Maintainer authorized documenting/disabling confirmed intermittent native RC cases. PR8 run41340718997/job124950772330 at627d214817fc52e60b3d74e103a40ca4ccbf0d2e failed the exact Explorer rename/move/cold-layout case after11187.844875ms: Renamed.md not displayed after5000ms at file-ui-mutations.test.mjs:130. PR7 run41337362311/job124939943968 passed the unchanged complete case in11110.81825ms. Only manual CI revision selection, its governance tests and documentation differ; app,cohort,case and native helpers match.",
  "acceptanceReview": "Downloaded artifact13098307647; verified ZIP SHA256838b90d8b6a9ffaf2765d4768319d5a1343f7c00a004f5726a2ae732ca4d2198. DOM and actual vault contain Note.mdRenamed.md with exact draft, while Keep.md and Archive/Renamed.md preserve collision bytes. Filename replacement did not produce the requested name; this is not evidence of a slow tree. Exact clear/input mechanism remains undiagnosed. Preserve complete callback,assertions,shared helpers and deadlines; skip only this exact case. Total19quarantines:1startup+18feature. Combined rename/move/cold-layout boundary remains unqualified. All13other direct gates passed; Validate/Full source fail only downstream. Later native resource family not run.",
  "runs": [
    {
      "name": "PR7 same-input native proof: startup2pass/1skip, feature92pass/0fail/17skip, resource2pass/0skip; exact Explorer case passes.",
      "command": "pnpm ci:headed (run41337362311/job124939943968)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "PR8 startup2pass/1skip; feature91pass/1fail/17skip. Resource family not run; both aggregate gates fail downstream.",
      "command": "pnpm ci:headed (run41340718997/job124950772330)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Exact case registration:0passes,0failures,1explicit skip. No application launched; not native acceptance.",
      "command": "node --test --test-name-pattern='^Explorer rename and move preserve collisions, the active editor and restart layout$' tests/desktop/file-ui-mutations.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete original callback AST preserved; only explicit skip added. Imports,helpers,other cases,native-session and committed release receipts001through011 unchanged.",
      "command": "node --input-type=module (TypeScript callback/helper AST and immutable-byte comparison against627d2148)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance248passed,0failed/0skipped.",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Initial changed-file formatting found the newly extended draft receipt needed reformatting; preserved before repair.",
      "command": "pnpm exec prettier --check <changed files>",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "All4Docker specification lanes pass:validate,rust-format,mdbook,spec-first.",
      "command": "LAPIS_DESKTOP_BASE=627d214817fc52e60b3d74e103a40ca4ccbf0d2e LAPIS_DESKTOP_HEAD=@ pnpm spec:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "The unchanged candidate limitations extractor includes E012,wrong-name evidence and all19disclosed quarantines.",
      "command": "node --input-type=module (assembly LIMITATIONS extraction assertions)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker immutable evidence passes396records; changed-file formatting passes after formatting the draft receipt.",
      "command": "LAPIS_DESKTOP_BASE=627d214817fc52e60b3d74e103a40ca4ccbf0d2e LAPIS_DESKTOP_HEAD=@ pnpm check:evidence; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "hostedNode": "24.22.1"
  },
  "remaining": [
    "Local checks pass:0pass/1explicit skip registration,completecallback/helper/receipt preservation,248governance,4Docker specification lanes,396Docker evidence records and formatting. These do not qualify the skipped native case; final-head hosted CI remains pending.",
    "Owners: Desktop native automation; Notes Explorer for any upstream input defect. Diagnose filename replacement; require exact input before submit and reliable original-case/full-family hosted passes before re-enabling. Preserve assertions and deadlines.",
    "Full exact-main CI and ordinary three-platform Homebrew candidate qualification remain required before publication approval. No tag,release or production preview cask published."
  ]
}
```
