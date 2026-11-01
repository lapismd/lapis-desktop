# Hosted initial progress geometry quarantine

```json
{
  "id": "E-RELEASE-006",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-DESK-001", "LD-DESK-002", "LD-DESK-005", "LD-REL-002"],
  "files": [
    "tests/desktop/startup-progress.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/distribution.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Maintainer-authorized RC quarantine for a single intermittent cold-shell case. The exact unchanged application passed this case on main b5a255bb in run 41312175583, job 124864653873, 6168.600791ms. Run 41318358534, job 124883118088, synthetic merge 90846565 / PR head 0e8028df failed initial.logoTop > 52 at startup-progress.test.mjs:33, 8081.951584ms. Other two startup cases passed. Artifact13089557346 preserves the failure. No app implementation changed in the distribution PR.",
  "acceptanceReview": "Only this case is skipped; its complete original assertions/deadlines remain. Initial branding/progress/control clearance is unqualified. The later full feature/lifecycle suite was not reached on the failed run. Owner: Desktop native automation. Re-enable after the capture/layout boundary is understood and the original case plus full startup family pass reliably in fresh hosted runs. There are15disclosed quarantines (one cold startup,14feature cases). Enabled exact-source native qualification still blocks publication.",
  "runs": [
    {
      "name": "Exact prior hosted case passed; subsequent full feature family95passed/14skipped.",
      "command": "pnpm ci:headed",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Cold startup family2passed/1failed; later feature and lifecycle family not run.",
      "command": "pnpm ci:headed",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Quarantine registration:0passed,0failed,1explicitly skipped; this is disclosure, not native product acceptance.",
      "command": "node --test --test-name-pattern='^cold shell mounts' tests/desktop/startup-progress.test.mjs",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.10.0",
    "hostedNode": "24.22.1"
  },
  "remaining": [
    "Enabled exact-source native acceptance and complete cold startup family must still qualify; the quarantined initial-frame case remains unqualified."
  ]
}
```
