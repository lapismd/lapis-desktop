# Vault-return replacement input quarantine

```json
{
  "id": "E-RELEASE-013",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-VAULT-007", "LD-DESK-005", "LD-REL-002"],
  "files": [
    "tests/desktop/vault-return.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/current/distribution.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Maintainer instructed narrow documented quarantines for intermittent native RC tests. PR8 run41345056450/job124963038273 atd3f33f62e01393ecbd5177e6ea0a8fcb4a322b59 fails the vault-return/cancel/database case atvault-return.test.mjs:35 after5977.988958ms. The immediately preceding run41340718997/job124950772330 passed the same complete case in7000.684083ms. Only an unrelated Explorer-case skip and documentation changed; product,cohort,vault-return,shared input/navigation/session helpers match.",
  "acceptanceReview": "Downloaded artifact13099099342; verified ZIP SHA256576fd4ec49e48b623ff3732df0be943cf57ee147044866b7dca7568e5f5e5e8e. Actual Welcome.md contains new text followed by original text and launcher DOM is visible. The select-all/replacement sequence did not produce the expected complete replacement; exact focus/selection/driver cause is unknown. E012 exhibits a related concatenated filename symptom, but a common root cause is unproven. No database reopen/release,cancelled picker or subsequent return success is inferred after the failing early file assertion. Skip only the exact full case with original callback/assertions/deadlines/helpers intact.20quarantines:1startup+19feature. All13otherdirectgatespassed;Validate/Fullsourcefaildownstream. Laterresourcefamily notrun.",
  "runs": [
    {
      "name": "Preceding run exact vault-return case passes; native family91pass/1unrelatedExplorerfail/17skip,startup2pass/1skip.",
      "command": "pnpm ci:headed (run41340718997/job124950772330)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Latest native run startup2pass/1skip;feature90pass/1vaultreturnfail/18skip;laterresourcefamily notrun.",
      "command": "pnpm ci:headed (run41345056450/job124963038273)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Exact case registration:0passes,0failures,1explicit skip. No application launched; this is not native acceptance.",
      "command": "node --test --test-name-pattern='^the chooser returns to the previous vault after cancellation without retaining its old database$' tests/desktop/vault-return.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete callback AST,imports,shared session/navigation helpers,other cases and all12existing release receipts unchanged. Candidate LIMITATIONS includes E013 and all20quarantines.",
      "command": "node --input-type=module (TypeScript AST,immutable-byte and LIMITATIONS extraction assertions againstd3f33f62)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance248passed,0failed/0skipped. Changed-file formatting passes.",
      "command": "node --import tsx --test tests/governance/*.test.mjs; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "All4Docker specification lanes pass:validate,rust-format,mdbook,spec-first.",
      "command": "LAPIS_DESKTOP_BASE=d3f33f62e01393ecbd5177e6ea0a8fcb4a322b59 LAPIS_DESKTOP_HEAD=@ pnpm spec:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker immutable evidence passes397records.",
      "command": "LAPIS_DESKTOP_BASE=d3f33f62e01393ecbd5177e6ea0a8fcb4a322b59 LAPIS_DESKTOP_HEAD=@ pnpm check:evidence",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "hostedNode": "24.22.1"
  },
  "remaining": [
    "Local checks pass:0pass/1explicit skip registration,completecallback/helper/12receipt preservation,248governance,4Docker specification lanes,397Docker evidence records and formatting. These do not qualify the skipped native case; final-head hosted CI remains pending.",
    "Owner: Desktop native automation; Notes editing for any upstream selection defect. Diagnose shared native focus/select-all/input delivery and validate exact replacement before leaving; re-enable after reliable original-case/full-family hosted passes with assertions/deadlines intact.",
    "Full exact-main CI and ordinary three-platform Homebrew qualification remain required before publication approval. No tag or release published."
  ]
}
```
