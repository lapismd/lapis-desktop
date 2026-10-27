# Focused Desktop native Tasks qualification

```json
{
  "id": "E-CORE-037",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M16.9"],
  "requirements": ["LD-TASK-001", "LD-TASK-002", "LD-TASK-003", "LD-CAT-003"],
  "contractReview": "The exact Core Task integration preserves the existing App client, physical profile storage, shared writer guards and typed outcomes. Public observer tests preserve passive drain and uncertain identity. No shared host registration, new Task engine, default change or source repair is included.",
  "milestoneReview": "M16.9 remains In progress, depending only on M16.7. Combined Notes0ff source and focused Desktop Rust/current-API transport pass. Shared registration, strict host, installed-plugin/provider/locale, full catalog and cold native gates remain pending. E-CORE-036 remains immutable staged history.",
  "versions": {
    "desktopProduct": "e26813bf36a6e23e0a10ff26de6b22b9790f7658",
    "focusedRustSnapshot": "34e5374cd8e7be1a38429563de6462c7ffc5a0d8 - empty child/tree equal to Desktop product",
    "nativeNotesSource": "0ff929b1fe53a790c1cd4af777d4e9879e46e15f",
    "nativeNotesArchiveSha256": "6886d547263e5b7c1a8de97fb35eb2167097f1fd7c6d1cd42f38bbf8f6191644",
    "sourceAggregateReceipt": "823317ad - source0ff/status passed independently verified; parent records586Rust/2414package/263coldcatalog/26ordinarybrowser",
    "apiArchiveSha256": "419b47c5b7857cb9e2106aacf519671deba7d34bb79f364f642a378c4db094b9",
    "historyArchiveSha256": "e714935f9f0a9365f74aaeca3aa67f8b0fef089e95ef107d24eabe915710b028",
    "privateArchives": 31,
    "publicArchiveRoutes": 116,
    "focusedRust": "1.99.0 (b940084d7 2026-09-28)",
    "focusedNode": "24.15.0",
    "focusedPnpm": "10.34.5",
    "worker": "lapis-desktop-validation-464c0f5c-1e26-4e28-bbe3-4a92349d31d0"
  },
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/tasks.md",
    "spec/src/history/E-CORE-037.md",
    "spec/src/history/core/index.md"
  ],
  "runs": [
    {
      "name": "canonical-rust-retry-infrastructure",
      "command": "node scripts/validation.mjs run test:rust -- --test core_tasks_service",
      "result": "fail",
      "failures": 1,
      "note": "SSH again refused lease creation immediately after successful inventory. Zero compiler/tests ran. The first two pre-container failures remain in E-CORE-036; no host or settings fallback was used."
    },
    {
      "name": "exact-native-tasks-rust",
      "command": "node .local/qualification/snapshot-batch.mjs tasks-rust (worker: pnpm test:rust -- --test core_tasks_service)",
      "result": "pass",
      "failures": 0,
      "note": "All4 cases pass,0ignored. Frozen product tree, Notes0ff and31 current archives;116 public routes verified. Exit0 at2026-10-27T00:11:25.424Z. The expected unregistered vault_tasks dead-code warning remains pending shared registration/strict host checks; no lint exception added."
    },
    {
      "name": "current-public-api-observer",
      "command": "node --import tsx --test tests/renderer/native-tasks.test.mjs tests/renderer/shell-startup.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All11 pass against verified public API419b/Historye714 exports through an ignored archive overlay; no source alias, dependency patch or published-manifest change."
    }
  ],
  "remaining": [
    "Integrate shared command/state/permission registration, then strict ordinary/e2e host checks.",
    "Qualify installed Tasks bundle/provider/locale, explicit disable, passive detach/recovery and cold native behavior.",
    "Run complete affected/full catalog and specification gates in the composed Desktop cohort."
  ]
}
```

[E-CORE-036](E-CORE-036.md) retains the initial missing-module regression,
source staging and first two infrastructure failures unchanged. The current
receipt is
`.local/validation/runs/lapis-desktop-validation-464c0f5c-1e26-4e28-bbe3-4a92349d31d0/`,
containing `result.json`, `input/source.json` and `batch-container.log`.

The four production-component stories and two actual WebView cases remain
unexecuted. No Mac build, application window, full catalog or broad Desktop
validation ran in this lane. Shared registration must remove the expected
unused-command warning before strict host acceptance.
