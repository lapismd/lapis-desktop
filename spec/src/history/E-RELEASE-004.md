# Hosted ACP renderer-reload quarantine

```json
{
  "id": "E-RELEASE-004",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-AI-001", "LD-DESK-005", "LD-REL-002"],
  "files": [
    "tests/desktop/acp-transport.test.mjs",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Maintainer-approved temporary RC quarantine for one intermittent hosted ACP renderer-reload case. Preserve its assertions and all product contracts. Prior main run 41267757854, job 124734022019, passed the exact case in 4379.870625ms at 260a21d0. Release branch run 41303987128, job 124840793734, timed out in WebDriver execute/sync at acp-transport.test.mjs:202 after refresh; case duration 14825.897334ms. The complete family ran, with aggregate native result 95 pass, 1 fail and 13 pre-existing skips. Uploaded artifact 13083867957 retains the renderer and provider logs.",
  "acceptanceReview": "Only this single case is skipped. Its saved provider log has one session/prompt and the new renderer booted the launcher; reconnect and final provider reaping were not reached. Owner: Desktop native automation. Retained ACP reconnection across reload remains unqualified in this preview. Re-enable only after a cold hosted run passes the original case and complete ACP family with unchanged deadlines/assertions and no transport timeout or provider replay. Enabled exact-source native acceptance and ordinary installed-app qualification still block release.",
  "runs": [
    {
      "name": "Prior successful hosted main case, no skip for the target; full feature suite 96 passed and 13 skipped.",
      "command": "pnpm ci:headed",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Original hosted release-branch native run: 95 passed, 1 failed, 13 existing skips; target fails on WebDriver request after refresh.",
      "command": "pnpm ci:headed",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Exact quarantine registration check: 0 passed, 0 failed, 1 explicitly skipped. This validates disclosure only, not native behavior.",
      "command": "node --test --test-name-pattern='^renderer reload reconnects' tests/desktop/acp-transport.test.mjs",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.22.1",
    "failedRun": "41303987128",
    "failedJob": "124840793734",
    "failedHead": "885268aded6fd2f329d04b5bd2d4479768aa8275",
    "previousPassedRun": "41267757854",
    "artifact": "13083867957"
  },
  "remaining": [
    "Native ARM64 acceptance must pass on the final source with 14 disclosed quarantines.",
    "The skipped case is not a passing product acceptance result."
  ]
}
```
