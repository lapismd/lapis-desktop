# Background AI cold readiness quarantine

```json
{
  "id": "E-RELEASE-008",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-DESK-003", "LD-DESK-005", "LD-AI-001", "LD-REL-002"],
  "files": [
    "tests/desktop/ai-admission.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/current/distribution.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/current/ai.md"
  ],
  "contractReview": "Maintainer authorized documenting/disabling confirmed flaky RC cases. Exact background admission/cold-reset case passed on PR c6a37f74 in run41324538550/job124901661158 (7063.707666ms); merged main5385f7e4 has an identical tree (jj diff empty). Run41327592484/job124910729657 failed the second hidden process readiness at native-session.mjs:124 from ai-admission.test.mjs:171 (21568.4285ms). Original15000ms deadline and full test body remain. No product/runtime/helper changes.",
  "acceptanceReview": "Only the complete failing case is skipped. Its caller/frame, reload-scope, vault-closure and cold-reset coverage remains unqualified. Other enabled native gates and ordinary package/Homebrew acceptance remain mandatory. Total16quarantines:1startup+15feature. Artifact13093916788 ZIP hash805f9e89be854524cb39c4d8fc8d0a56ac82e0922d68d8d4fa6f73c9a6be6b7c verified after download. Later resource/development-WebView family was not reached and is not a pass.",
  "runs": [
    {
      "name": "Prior exact case passed; native feature family95passed/14skipped, startup2passed/1skip, resource family2passed.",
      "command": "pnpm ci:headed",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Main startup2passed/1skip; feature94passed/1failed/14skipped; later resource family not run. Failed original readiness assertion retained.",
      "command": "pnpm ci:headed",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Quarantine registration only:0passed,0failed,1explicit skip. No app launched; this is not product acceptance.",
      "command": "node --test tests/desktop/ai-admission.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Initial callback comparison used the TypeScript printer and failed on Prettier line wrapping/trailing-comma formatting; no callback semantic change was found.",
      "command": "node --input-type=module (TypeScript printed-body comparison)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Structural callback AST comparison ignores trivia and formatting while retaining node kinds, children and literal values; complete original body matches main. Shared native-session helper remains unchanged.",
      "command": "node --input-type=module (TypeScript structural-body comparison)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance:242passed,0failed/0skipped.",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker validate,rust-format and mdbook passed; spec-first rejected the missing mapped AI chapter for ai-admission.test.mjs. Added its quarantine disclosure without relaxing the readiness boundary.",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Second Docker snapshot rejected AI chapter at401physical lines after formatting; shortened only its release-status paragraph to400lines while retaining the existing15sreadiness contract.",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Corrected Docker snapshot passes all4lanes:validate,rust-format,mdbook,spec-first.",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Actual quarantine diff selects governance,quality,unit(governanceonly),headed; no Linux,ordinary bundle,dependency audit or catalog gates. Full release qualification remains separately required.",
      "command": "node --input-type=module (planChanges over jj diff paths)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker immutable-evidence validation passes389records; changed Markdown/test formatting passes.",
      "command": "pnpm check:evidence; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "hostedNode": "24.22.1"
  },
  "remaining": [
    "Owner: Desktop native automation. Re-enable after the readiness boundary is understood and original case plus complete native family pass reliably in fresh hosted runs, with unchanged assertions/deadlines.",
    "All local quarantine registration,body preservation,242governance tests,4Docker spec lanes,389Docker evidence records and formatting checks pass. New hosted enabled-native qualification remains pending; skipped coverage is not a product pass.",
    "Full merged-source CI and complete three-platform candidate/Homebrew qualification remain required before publication approval."
  ]
}
```
