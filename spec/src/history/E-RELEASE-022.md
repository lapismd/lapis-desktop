# Preserve capacity-blocked full qualification

```json
{
  "id": "E-RELEASE-022",
  "date": "2026-11-13",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "repairHead": "2902e04559cada94f556ef901ccecfe2d13b5e3d",
    "fullPrRun": 43456568626,
    "nativeBundleJob": 131996729780,
    "validateJob": 132013238253,
    "fullSourceJob": 132013354760,
    "hostedNode": "24.15.0",
    "specValidator": "0.2.0"
  },
  "requirements": ["LD-GOV-003", "LD-CI-003", "LD-CI-004"],
  "files": [
    "spec/src/history/E-RELEASE-022.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md"
  ],
  "contractReview": "A full qualification attempt with any cancelled selected job remains failed. Validate must reject the abandoned selected gate, and Full source qualification must reject failed Validate. Upstream runner capacity does not demonstrate a repository defect and cannot authorize a failed-job rerun, weaker gate or release action; qualification requires a wholly new complete workflow attempt for the exact repair head.",
  "acceptanceReview": "Explicit full PR run 43456568626 passed every acquired execution job. GitHub never assigned its selected macos-15 Native bundle job to a hosted runner, executed no steps and cancelled it after 15 minutes with annotations that macOS ARM64 capacity was constrained. Validate rejected bundle=abandoned and Full source qualification rejected Validate. The attempt is preserved as upstream capacity evidence; candidate preparation 43408364134 and both draft releases remain unchanged.",
  "remaining": [
    "Dispatch and pass a wholly new explicit full PR workflow for the exact current repair head.",
    "After merge, pass a wholly new exact-main full workflow before another protected publication."
  ],
  "runs": [
    {
      "name": "First explicit full PR qualification",
      "command": "GitHub Actions run 43456568626",
      "result": "fail",
      "failures": 1,
      "detail": "Every acquired execution job passed. Native bundle job 131996729780 had runner_id 0, no runner name, no steps and GitHub annotations stating that the macos-15 job was not acquired by a hosted runner after multiple attempts because macOS ARM64 capacity was constrained. Validate rejected bundle=abandoned and Full source qualification rejected Validate."
    },
    {
      "name": "Committed evidence immutability guard",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:evidence",
      "result": "fail",
      "failures": 1,
      "detail": "The checker rejected an attempted E-RELEASE-021 update and required this appended receipt; the committed record was restored byte-for-byte before continuing."
    },
    {
      "name": "Specification qualification before verification budget repair",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Evidence passed; specification validation found verification.md 129 bytes over its 32,768-byte limit after adding this receipt, so the two affected rows were compacted while retaining their evidence references."
    },
    {
      "name": "Capacity receipt evidence and specification qualification",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:evidence && LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All 459 evidence records and all four specification lanes passed; verification.md remained within its authored byte budget."
    }
  ]
}
```

Run `43456568626` is not release authority. No candidate or release bytes were
rebuilt, substituted, deleted or uploaded.
