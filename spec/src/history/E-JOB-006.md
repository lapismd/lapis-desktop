# Notification acceptance release intent

```json
{
  "id": "E-JOB-006",
  "date": "2026-11-26",
  "revision": "enclosing-change",
  "result": "pass",
  "requirements": ["LD-REL-001", "LD-GOV-004"],
  "files": [
    ".changeset/background-job-notification-acceptance.md",
    "spec/src/current/distribution.md",
    "spec/src/navigation/history-01.md"
  ],
  "versions": {
    "source": "3903f05ae682509574e7dfebe328f70d54c8a8ff"
  },
  "contractReview": "The protected native acceptance files require explicit Desktop release intent even though the OS harness is absent from ordinary bundles. Add a patch Changeset without altering the release-intent gate.",
  "acceptanceReview": "PR70 governance job 139846699327 failed because the source slice had no Changeset. Its portable source qualification remains in E-JOB-004; this follow-up changes release metadata and evidence only. Actual macOS delivery remains pending.",
  "runs": [
    {
      "name": "PR release-intent gate before correction",
      "command": "node scripts/release/check-intent.mjs (PR70 run 45801682278)",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Exact PR release-intent gate and documentation checks after correction",
      "command": "pnpm --dir scripts/release-tools install --frozen-lockfile --ignore-scripts --ignore-workspace; node scripts/release/check-intent.mjs; pnpm spec:check; pnpm format:check (Omarchy lapis-desktop-validation-2394213b-bff8-4404-a1ef-c0805f26ca81)",
      "result": "pass",
      "failures": 0
    }
  ],
  "remaining": []
}
```
