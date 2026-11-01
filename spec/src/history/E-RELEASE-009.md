# Reconcile RC quarantine with dependency automation

```json
{
  "id": "E-RELEASE-009",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-002", "LD-GOV-004", "LD-DESK-005"],
  "files": [
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "spec/src/history/E-RELEASE-008.md",
    "tests/desktop/ai-admission.test.mjs"
  ],
  "contractReview": "Concurrent main8dc6305536886d416c129388583a9534c3aa01bd landed dependency automation and compatible UI/Markdown patch ranges while quarantine PR7 was created. Rebase preserves every upstream source, dependency and governance change. The only conflict was the history navigation append; retain E-DEPENDENCIES-001/002/003 and E-RELEASE-008. The committed E008 receipt body remains byte-identical to b344329f.",
  "acceptanceReview": "Recheck the original callback AST against currentmain, quarantine registration, complete governance, Docker specification/evidence lanes and formatting on this combined source. No product source or shared readiness helper changes. Sixteen quarantines remain disclosed. Full merged-source native CI and three-platform candidate acceptance still gate publication.",
  "runs": [
    {
      "name": "Callback AST equals current8dc63055main; committed E008 bytes exactly match its first pushed b344329f revision.",
      "command": "node --input-type=module (AST and immutable receipt comparison)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Exact case registration0passed/0failed/1explicit skip; no app launched.",
      "command": "node --test tests/desktop/ai-admission.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete current-base governance245passed,0failed,0skipped.",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Combined tree against8dc63055main passes all4Docker specification lanes:validate,rust-format,mdbook,spec-first.",
      "command": "LAPIS_DESKTOP_BASE=8dc6305536886d416c129388583a9534c3aa01bd LAPIS_DESKTOP_HEAD=@ pnpm spec:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Combined-tree Docker immutable-evidence validation passes393records; changed-file formatting passes.",
      "command": "LAPIS_DESKTOP_BASE=8dc6305536886d416c129388583a9534c3aa01bd LAPIS_DESKTOP_HEAD=@ pnpm check:evidence; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0"
  },
  "remaining": [
    "All current-base tooling checks pass:callback and receipt preservation,exact0pass/1skip registration,245governance tests,4Docker spec lanes,393Docker evidence records and formatting. E008 original qualification remains immutable.",
    "Enabled native qualification and full exact-main CI remain pending; source checks and skipped cases are not native product passes."
  ]
}
```
