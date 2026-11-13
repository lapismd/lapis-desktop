# Align the Design Core cohort pin with mobile layout

```json
{
  "id": "E-MOBILE-004",
  "date": "2026-11-13",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "failedRun": 43434271354,
    "sourceCommit": "63d127cac6e3a6e0329dfa0f910f8b72463984d3",
    "coreOverride": "0.12.4",
    "coreRange": "^0.12.1"
  },
  "requirements": ["LD-GOV-006", "LD-GOV-008", "LD-SESSION-005"],
  "files": [
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-MOBILE-004.md",
    "spec/src/navigation/history-02.md",
    "tests/governance/ci-prerequisites.test.mjs"
  ],
  "contractReview": "The released Notes cohort keeps one Design Core peer context. After mobile-layout intake selected registry Core 0.12.4 and range ^0.12.1, the governance pin and local-dependency minima must name that same override and range. Historical 0.10.1 receipts stay immutable.",
  "acceptanceReview": "Hosted Unit tests on 63d127ca failed 1 of 756 cases because ci-prerequisites still required workspace override 0.10.1. The exact file now passes 7/7 after the pin matches 0.12.4 and ^0.12.1. Fresh hosted unit remains required. E-MOBILE-003 is unchanged.",
  "remaining": ["Pass hosted Unit tests on the repaired commit before merge."],
  "runs": [
    {
      "name": "hosted-unit-before",
      "command": "GitHub Actions run 43434271354 job 131918999731",
      "result": "fail",
      "failures": 1,
      "detail": "755 passed. ci-prerequisites required \"@lapismd/design-core\": \"0.10.1\" while the lock override is 0.12.4."
    },
    {
      "name": "exact-prerequisites-after",
      "command": "node --import tsx --test tests/governance/ci-prerequisites.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "7/7 pass, including the released Notes cohort Design Core peer-context case."
    }
  ]
}
```

The hosted failure is the original acceptance boundary. This record does not
rewrite E-MOBILE-003 or claim native-window qualification.
