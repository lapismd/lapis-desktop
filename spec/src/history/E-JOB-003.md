# Close completed native background-job verification

```json
{
  "id": "E-JOB-003",
  "date": "2026-11-26",
  "revision": "enclosing-change",
  "result": "pass",
  "requirements": [
    "LD-JOB-001",
    "LD-JOB-002",
    "LD-JOB-003",
    "LD-JOB-005",
    "LD-GOV-004"
  ],
  "files": [
    "spec/src/history/E-JOB-003.md",
    "spec/src/verification/background-jobs.md",
    "spec/src/navigation/history-01.md"
  ],
  "contractReview": "Closes completed v1 native ownership/default-cutover verification without changing runtime behavior or immutable receipts. Optional macOS system-alert delivery remains under LD-JOB-004 and is not claimed by build evidence.",
  "acceptanceReview": "Eleven actual GTK/WebKit/X11 cases cover the shared native vault, native metadata/Tasks defaults, guarded editing, hidden work and drafts, explicit Quit drain, cold ownership restore, unchanged signed Tasks digest and persistent notification/checkpoint recovery. Both exact-head hosted workflows pass; the merged tree equals the reviewed tree. This receipt does not claim real macOS system-alert delivery.",
  "versions": {
    "qualifiedHead": "f01152187a567bd7da0bcfcbc5c48410baa99366",
    "desktopMerge": "5da6fd481d9796518ef88b44f874d3d902b78184",
    "mergedTree": "4ce5ed0dc3dc9c1057287a5439afae321e06d676",
    "rc5Source": "4b20715fa78d83f7ef147b9943e2e0a2b485555c",
    "core": "b8824134a792cbd0aad449f9c02e659b28e2a88a",
    "tasks": "0.4.0"
  },
  "runs": [
    {
      "name": "Native cohort",
      "command": "Omarchy pnpm test:plugin-jobs:native; a5e08a8c-e691-4e50-ad8e-6f497b17f4a4",
      "result": "pass",
      "tests": 11,
      "passed": 11,
      "failures": 0
    },
    {
      "name": "Complete source suites",
      "command": "Omarchy pnpm test; d925647c-9b83-4038-8dd1-8018493795ab; final check504fb6e5 and spec88aa1711",
      "result": "pass",
      "failures": 0,
      "detail": "975 Node,749 AI and295 Rust executions; normal/e2e strict Clippy, Svelte0errors0warnings, formatting, renderer build and all five canonical spec lanes."
    },
    {
      "name": "Hosted exact reviewed head",
      "command": "GitHub CI45570627327 and full qualification45571406013 on f0115218",
      "result": "pass",
      "failures": 0,
      "detail": "Both workflows success. Full profile includes macOS bundle/audit and both Linux release architectures. Catalog2180 cases pass,536/536/504/604 across the four shards."
    },
    {
      "name": "Released Tasks registry delivery",
      "command": "Publish registry45580060837; Omarchy live registry acceptance2026-11-25T08:55:01Z",
      "result": "pass",
      "failures": 0,
      "detail": "Index, revocation and Tasks metadata signatures verified against pinned trust root; Tasks0.4 archive SHA04953bda8012f50263ac2224a649a64d0892a43b0a70cd6d92132985af2eee3b and701741-byte download match qualified bytes."
    }
  ],
  "remaining": []
}
```

[E-JOB-001](E-JOB-001.md) and [E-JOB-002](E-JOB-002.md) remain immutable,
including their original failures and then-pending hosted gates. This receipt
closes the completed gates recorded by
[Desktop PR68](https://github.com/lapismd/lapis-desktop/pull/68). Actual macOS
alert delivery and the separately requested network/credential capability
extension retain independent acceptance.
