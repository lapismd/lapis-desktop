# Notification artifact renderer prerequisite

```json
{
  "id": "E-JOB-007",
  "date": "2026-11-26",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-JOB-004", "LD-CI-001", "LD-GOV-004"],
  "files": [
    "scripts/build-notification-acceptance.mjs",
    "tests/governance/notification-acceptance.test.mjs",
    "spec/src/current/ci.md",
    "spec/src/current/governance.md",
    "spec/src/navigation/history-01.md"
  ],
  "versions": {
    "source": "3903f05ae682509574e7dfebe328f70d54c8a8ff",
    "portableSource": "221487f3d099facb03b4f7dd8bd72890483d64eb"
  },
  "contractReview": "Reuse the existing native-jobs-test production bootstrap for the narrow notification artifact. Keep e2e command gating, dedicated bundle/profile identity, ordinary bundle audit and real Notification Center acceptance unchanged.",
  "acceptanceReview": "Manual workflow 45801741654 job 139851259802 passed its ordinary macOS bundle build and audit. The extra notification build then stopped before Rust compilation because native-test requested missing distribution public.json. The narrow renderer needs no distribution fixture trust or provider fixtures.",
  "runs": [
    {
      "name": "First macOS notification artifact before prerequisite correction",
      "command": "node scripts/build-notification-acceptance.mjs (workflow 45801741654)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Focused notification/native-lane/CI policy regressions: 20 passed",
      "command": "node --test tests/governance/notification-acceptance.test.mjs tests/governance/native-lane-defaults.test.mjs tests/governance/ci-selection.test.mjs (Omarchy f4b82273)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Cold production bootstrap renderer, specification and formatting",
      "command": "build --mode native-jobs-test --outDir .local/native-test/ui; spec:check; format:check (lapis-desktop-validation-f4b82273-b1f7-4c45-ac82-d6dbc2665495)",
      "result": "pass",
      "failures": 0
    }
  ],
  "remaining": [
    "Instrumented macOS artifact",
    "Actual permission and Notification Center delivery"
  ]
}
```

The first portable renderer invocation inherited Node's default 2 GiB heap and
failed after twenty policy tests passed. Both the artifact and qualification now
use the existing build memory budget. A subsequent install-only ENOSPC attempt
ran no tests. Both setup failures remain logged, and no product assertion,
timeout or visual baseline changed.
