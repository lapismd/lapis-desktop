# Remove unused deepmerge audit approval

```json
{
  "id": "E-DEPENDENCIES-006",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-006", "LD-CI-004"],
  "files": [
    "config/dependency-audit.json",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-DEPENDENCIES-006.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Remove only unused GHSA-gcqx-w48m-w2h4 approval; the full and production audits no longer report it. Retain both exact WebdriverIO development advisory approvals, severity/version/path/expiry checks and production prohibition. No audit checker, dependency, lock, assertion, expiry or threshold changes.",
  "acceptanceReview": "Hosted dependency job134143600427 at89179848 fails only stale deepmerge approval after reporting3MODERATE development findings and0production. The same gate reproduces one stale-exception failure locally against the portable registry lock; private projection and source-lock evidence remain distinct. Full hosted consumer lanes remain required.",
  "runs": [
    {
      "name": "Hosted audit correctly rejects unused approval",
      "command": "CI run44112342253 job134143600427",
      "result": "fail",
      "failures": 1,
      "detail": "3MODERATE development findings match existing two advisories; production0; stale GHSA-gcqx-w48m-w2h4 is the sole gate error."
    },
    {
      "name": "Exact source-lock audit baseline",
      "command": "node --input-type=module -e 'import {runAudit} from \"./scripts/ci-audit.mjs\"; process.exitCode=runAudit();'",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/mvp-audit-before.log reproduces sole stale-exception error, with production0. No native acceptance inferred."
    },
    {
      "name": "Exact source-lock audit after stale approval removal",
      "command": "node --input-type=module -e 'import {runAudit} from \"./scripts/ci-audit.mjs\"; process.exitCode=runAudit();'",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/mvp-audit-after.log: sole stale error1\u21920;3MODERATE findings remain scoped to existing approved development paths; production0. Registry lock audit is distinct from hosted private projection."
    },
    {
      "name": "Complete audit policy controls",
      "command": "node --test tests/governance/ci-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "5pass/0fail/0skip. Exact version/path/severity/expiry, production rejection, incomplete reports and stale approvals remain fail-closed. No test source changed."
    },
    {
      "name": "Evidence record requires tool versions",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Report24a648c1-803a-40d5-b804-74f277b35ac9 rejects missing versions in new E-DEPENDENCIES-006. Add exact Node/pnpm/spec-validator/parent provenance; preserve checker and all earlier failed attempts."
    },
    {
      "name": "Specification snapshot blocked on task disk exhaustion",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/mvp-audit-spec-2.log ends ENOSPC before specification checks. Only162MiB free. Confirm no cargo/rustc/tauri process and remove inactive task-owned primary target/debug deps/build compiler caches. Preserve source, artifacts/resources, receipts and original repositories; repeat unchanged checks."
    }
  ],
  "remaining": [
    "Updated hosted dependency audit and complete consumer CI must pass before merge."
  ],
  "versions": {
    "parent": "89179848bf8daaf1d26942200adee6df0433c65e",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1"
  }
}
```
