# Queue readiness and deleted-preview quarantine

```json
{
  "id": "E-RELEASE-010",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-AI-005", "LD-FILE-008", "LD-DESK-005", "LD-REL-002"],
  "files": [
    "tests/desktop/ai-native-queue-admission.test.mjs",
    "tests/desktop/preview-conflicts.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/ai.md",
    "spec/src/current/ai-queue.md",
    "spec/src/current/files.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/current/distribution.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Maintainer authorized documenting/disabling confirmed intermittent RC cases. Queue admission failed main8dc63055 run41332697278/job124925996739 at native-session.mjs:124 before driver evaluation (16372.17ms), after PR5 pass3684.871208ms; PR7 passed9343.755041ms. Deleted-preview recreation passed PR5/main8dc63055 (5211.512416ms/8409.686792ms), failed unchanged PR7 head93c75a08 run41333250465/job124927638150 at preview-conflicts.test.mjs:252 after15000ms wait (23661.083583ms). PR7 changes only docs and an unrelated exact AI-case skip, not product source, package cohort or shared acceptance helpers.",
  "acceptanceReview": "Skip only these two complete cases; preserve original callback ASTs and options except explicit skip reasons, including90000ms/60000ms case limits and15000ms readiness/file waits. Queue admission/refusal and deleted-preview file recreation/shutdown remain unqualified. Failed preview receipt retains visible merged/draft text, no Target.md, and blocked recovery; it is not a successful save. Total18quarantines:1startup+17feature. Main artifact13094867223 SHA256ee14f418831485e6bb490e61e26b3276491b096d2c724dbb90d7db5f2de946aa; PR7 artifact13095249631 SHA25671a4f94352e779631c4ab4daf1bc0dca65e98a56e74c9724293ebff0ed14c4ee. Both ZIP hashes verified after download. No later resource/development-WebView qualification is claimed for either failed run.",
  "runs": [
    {
      "name": "PR5 native family95pass/14skip, startup2pass/1skip and later resource family2pass; both exact cases passed.",
      "command": "pnpm ci:headed (run41329397152/job124916613683)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Main8dc63055 startup2pass/1skip; feature93pass/2fail/14skip. Queue and background admission missed renderer readiness; later resource family not run.",
      "command": "pnpm ci:headed (run41332697278/job124925996739)",
      "result": "fail",
      "failures": 2
    },
    {
      "name": "PR7 startup2pass/1skip; feature93pass/1fail/15skip. Queue passes, deleted-preview recreation times out; later resource family not run.",
      "command": "pnpm ci:headed (run41333250465/job124927638150)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Both exact case registrations:0passes,0failures,2explicit skips. No app launched; this is not native acceptance.",
      "command": "node --test --test-name-pattern='^native queue requires|^deleted preview recovery' tests/desktop/ai-native-queue-admission.test.mjs tests/desktop/preview-conflicts.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Both complete callback ASTs and original options except skip match93c75a08. Shared native-session helper and committed E008/E009 bytes unchanged.",
      "command": "node --input-type=module (callback/options AST and immutable-byte comparison)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance245passed,0failed/0skipped.",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "All4Docker specification lanes pass:validate,rust-format,mdbook,spec-first.",
      "command": "LAPIS_DESKTOP_BASE=93c75a0857c5bd941c825133852baecaf7099d24 LAPIS_DESKTOP_HEAD=@ pnpm spec:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker immutable evidence passes394records; all changed-file formatting passes.",
      "command": "LAPIS_DESKTOP_BASE=93c75a0857c5bd941c825133852baecaf7099d24 LAPIS_DESKTOP_HEAD=@ pnpm check:evidence; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "hostedNode": "24.22.1"
  },
  "remaining": [
    "All local tooling checks pass:0pass/2explicit skip registration,callback/options preservation,245governance tests,4Docker specification lanes,394Docker evidence records and formatting. These do not qualify skipped native coverage.",
    "Owners: Desktop native automation; Desktop/Notes editing for file recovery. Re-enable each original case plus complete native family after its boundary is understood and passes reliably on fresh hosted runners with unchanged assertions/deadlines.",
    "Enabled native qualification,full exact-main CI and three-platform ordinary package/Homebrew acceptance remain required before publication approval."
  ]
}
```
