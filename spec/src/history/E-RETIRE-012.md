# Combine verified Desktop retirement slices

```json
{
  "id": "E-RETIRE-012",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "documentationHead": "d40998e6d3dd82053130c5def9c2cd1738adbfd9",
    "preservationHead": "5321742d33ca5eda04da0e2be536077182e070ea",
    "privateUiHead": "c4c4509e5c6b24516370c0abc4460b2d145b8e89",
    "nodeToolingHead": "bbbf12f202b701a30fb3924e2b6befed1a4765bd",
    "featureBase": "45d61a6c95d980892be8bb6a32f612137c1bb529",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1"
  },
  "requirements": ["LD-GOV-006", "LD-AI-002", "LD-AI-004", "LD-PLUG-001"],
  "files": [
    "spec/src/history/E-RETIRE-012.md",
    "spec/src/backlog/ai-qualification.md",
    "spec/src/current/ai-adapter.md",
    "spec/src/current/desktop.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md"
  ],
  "contractReview": "Combine independently scoped Desktop slices while preserving each original commit and all ten immutable receipts. Resolve only four overlapping documentation files; do not edit production, native fixture or Node helper bodies. Preserve core API services/functions, Language Service and its declaration/projection/build inventory, all Rust source pins and original plugin data. Hold generic helper/CSS cleanup outside scope.",
  "acceptanceReview": "Require each original published candidate head to finish its own applicable hosted qualification before publishing the combined candidate. Then qualify the exact combined head, retaining every original failure and native/release gate. Combining prepared native coverage does not execute it or authorize macOS lanes. Native product and App Profile storage/lifecycle remain distinct from ordinary Linux/browser CI.",
  "sourceHeads": [
    {
      "pr": 49,
      "head": "5321742d33ca5eda04da0e2be536077182e070ea",
      "run": 44211944371,
      "status": "success",
      "jobsPassed": 18,
      "configuredSkips": 2
    },
    {
      "pr": 51,
      "head": "c4c4509e5c6b24516370c0abc4460b2d145b8e89",
      "run": 44210561723,
      "status": "success",
      "jobsPassed": 18,
      "configuredSkips": 2,
      "finalValidate": 134538616514
    },
    {
      "pr": 52,
      "head": "bbbf12f202b701a30fb3924e2b6befed1a4765bd",
      "run": 44212059686,
      "status": "success",
      "jobsPassed": 18,
      "configuredSkips": 2
    },
    {
      "pr": 53,
      "head": "d40998e6d3dd82053130c5def9c2cd1738adbfd9",
      "run": 44219959330,
      "status": "success",
      "scope": "documentation only; product/private-package/catalog/audit/full-source lanes explicitly unselected"
    }
  ],
  "runs": [
    {
      "name": "Application source equivalence",
      "command": "jj --no-pager diff --from c4c4509e --summary -- src src-tauri catalog package.json pnpm-lock.yaml",
      "result": "pass",
      "failures": 0,
      "detail": "No differences. Production code is exactly the original private-UI candidate. Its prior 432-module runtime-reachability proof remains applicable; no core/API function, dependency range, native pin or application policy changes."
    },
    {
      "name": "Prepared native fixture equivalence",
      "command": "jj --no-pager diff --from 5321742d --summary -- tests/desktop/ai-notes-binding.test.mjs tests/desktop/ai-retirement-fixture.mjs tests/desktop/historical-ai-files.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "No differences. All ten cases remain prepared and unexecuted; the original archive/helper bytes and synthetic evaluation trap are unchanged."
    },
    {
      "name": "Node tooling and regression equivalence",
      "command": "jj --no-pager diff --from bbbf12f2 --summary -- scripts/refresh-local-dependencies.mjs tests/governance/refresh-local-dependencies.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "No differences. The verified Node-only refresh/preflight and all nine executable source-admission controls are preserved byte-for-byte."
    },
    {
      "name": "Immutable receipt preservation",
      "command": "Compare each original E-RETIRE-001/002/003/004/005/006/008/009/010/011 file with its source commit",
      "result": "pass",
      "failures": 0,
      "detail": "All ten files match original bytes. Preserve their original statuses, failed attempts, artifact identities and scope; E007 remains stopped and absent. Four merge conflicts occur only in backlog, Desktop context, history navigation and verification. All receipt links are retained; no generated artifact or product conflict is manually resolved."
    },
    {
      "name": "Combined canonical qualification",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "59b575c1-98c5-4c59-a4d4-dee59c33770e: all four canonical lanes pass after documentation-only merge resolution; source/evidence audits, Rust format, mdBook and spec-first pass. Existing page limits remain unchanged. omarchy Docker, 2 CPU/4 GiB, verified eight-package overlay; no native macOS execution."
    },
    {
      "name": "Complete combined Desktop owner qualification",
      "command": "node scripts/validation.mjs run check:all",
      "result": "pass",
      "failures": 0,
      "detail": "bfc67998-70d6-4e10-919e-6887d9594bba at snapshot 48900f6618ad3b4ece1762b4286f4928114c3f6d: 810 Node governance/renderer tests, 748 AI tests across 153 files and 290 Rust tests pass, with two existing ignores. Types have zero errors/warnings; parity covers 116 families with zero findings. Architecture, App ownership, source audits, ordinary/e2e strict Clippy, full formatting and production renderer build pass. Bounded omarchy Docker: 2 CPUs, 12 GiB and the established 6 GiB build heap. No macOS, native window or live provider action."
    },
    {
      "name": "Independent integration source review",
      "command": "Read-only source/receipt/conflict-resolution review of combined change yvrlsvrw",
      "result": "pass",
      "failures": 0,
      "detail": "Independent reviewer confirms production/manifests exactly match c4, native fixtures exactly match532 and Node helper/tests exactly match bbbf. All ten original receipts match bytes; no conflict marker, lost normative constraint or E007/helper-cleanup resurfacing. Core services, Language Service, terminal-last ordering and all native/release gates are retained. No extra runner or source edits were performed."
    },
    {
      "name": "All original code heads hosted qualification",
      "command": "GitHub current PR metadata and exact-head workflow verification for PR49/51/52",
      "result": "pass",
      "failures": 0,
      "detail": "Root verifies all three unchanged heads target feature base45d61a6c and each recorded workflow is completed/success. Each source run has18successful jobs and2configured skips, with all8selected gates passed. The earlier d409 documentation-only run is retained as documentation evidence, not used to qualify this combined code head."
    },
    {
      "name": "Final combined evidence validation",
      "command": "node scripts/validation.mjs run check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "e3a3118c-db9d-4214-8cba-4fd79c31b239: all517records pass. Final source-head status/review details are recorded and formatted after this run. All ten earlier receipts retain original bytes; no product or evidence-schema changes follow the combined owner run."
    }
  ],
  "remaining": [
    "Qualify the actual combined head after publication, then integrate through the PR47 feature branch; do not substitute the earlier documentation-only check.",
    "Native diagnostics require the pending explicit decision; actual native preservation and App Profile lifecycle remain separate and unexecuted.",
    "Package publication, registry-only adoption, Website deployment and installed-app replacement remain separate gates."
  ]
}
```

The individual removals remain separate commits. This integration changes no
core API services/functions and does not resume E007 or generic helper cleanup.
Terminal migration remains last.
