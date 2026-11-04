# Current minimatch advisory finding refresh

```json
{
  "id": "E-DEPENDENCIES-004",
  "date": "2026-11-04",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-006", "LD-CI-004"],
  "files": [
    "config/dependency-audit.json",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-DEPENDENCIES-004.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/governance/ci-audit.test.mjs"
  ],
  "contractReview": "GHSA-g3hv-75wg-m249 changed its vulnerable range to minimatch >=7 and <11.0.1. The current Desktop graph therefore reports only the existing WebdriverIO development edges on 9.0.9 and 10.2.6; the former 3.1.5 and 5.1.9 entries are no longer advisory findings. Refresh the exact exception shape without changing its moderate severity, paths, approval, November 30 expiry, production prohibition or fail-closed handling of any new finding.",
  "acceptanceReview": "Complete PR run 41932220425 attempt 1 job 126933795107 remains failed evidence: production had zero advisories, but the exact audit correctly blocked the newly changed advisory shape and called the prior exception stale. The registry still offers WebdriverIO 10.1.0 with incompatible major dependency changes and no compatible patched minimatch edge for the current 9.32 cohort. This change updates no package, lock, assertion or expiry; a complete new workflow attempt remains required.",
  "runs": [
    {
      "name": "Hosted dependency audit rejected the changed advisory shape",
      "command": "GitHub Actions run 41932220425 attempt 1 job 126933795107 at 69b9b5e54242b3a4f40a6238f84f03b2eaa91708",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Local registry audit reproduced exactly two current minimatch findings",
      "command": "pnpm audit --json | jq advisory GHSA-g3hv-75wg-m249",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Exact exception regression",
      "command": "node --test tests/governance/ci-audit.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Current registry audit gate",
      "command": "node --input-type=module -e 'import { runAudit } from \"./scripts/ci-audit.mjs\"; process.exitCode = runAudit();'",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Host-native canonical specification and evidence validation",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check; LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:evidence",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Host-native complete static check",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.15.0 hosted; 26.8.2 local diagnostic",
    "pnpm": "10.34.5",
    "webdriverio": "9.32.0",
    "minimatch": "9.0.9 and 10.2.6",
    "expires": "2026-11-30"
  },
  "remaining": [
    "Rerun the complete hosted workflow from the updated PR head; failed-job-only reuse cannot qualify this repair."
  ]
}
```
