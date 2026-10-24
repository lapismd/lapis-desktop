# Native model-cache dependency intake

```json
{
  "id": "E-CORE-015",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": [
    "LD-GOV-004",
    "LD-GOV-006",
    "LD-VAULT-002",
    "LD-VAULT-003",
    "LD-FILE-003"
  ],
  "versions": {
    "desktopBaseline": "021f6a3b",
    "notesCore": "a18c84bb",
    "lapisAI": "6548afe0",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "contractReview": "Take the qualified Notes native Search runtime/model cache as an unused shared-core dependency. Refresh only the required native lock graph; retain package versions, portable manifests and all nineteen existing pnpm archives. Qualify the unchanged file-service boundary and strict normal/e2e native configurations.",
  "milestoneReview": "M16.2 retains its original native file/admission gate. This is library compatibility, not selected database, installed model, semantic-query, native UI, hosted shell or backup-lifetime adoption. M11 stays Deferred; R1.3/R3 and platform/distribution gates remain separate.",
  "runs": [
    {
      "name": "exact-before",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test core_file_service",
      "result": "fail",
      "failures": 1,
      "note": "One expected lock diagnostic, zero runtime cases; the new core dependency graph needs intake. Log .local/core-model-cache-before.log."
    },
    {
      "name": "initial-lock-review",
      "command": "cargo update --manifest-path src-tauri/Cargo.toml --offline -p lapis-app-core; compare every package and dependency edge",
      "result": "fail",
      "failures": 1,
      "note": "Cargo also re-resolved twenty unrelated wide-range edges and removed itertools 0.12.1. Reject that draft; restore the prior lock and add only the two required edges. Final locked validation preserves all package records and unrelated edges."
    },
    {
      "name": "final-lock-review",
      "command": "Compare parsed lock packages and edges against the parent",
      "result": "pass",
      "failures": 0,
      "note": "Exactly two additions: lapis-app-core -> reqwest 0.12.28; reqwest 0.12.28 -> futures-channel. No package/version changes or removals. Inventory .local/core-model-cache-final-lock-delta.json."
    },
    {
      "name": "exact-after",
      "command": "Same locked core_file_service target against the final two-edge lock",
      "result": "pass",
      "failures": 0,
      "note": "Both service cases pass. Log .local/core-model-cache-service-final.log. The __eh_frame linker warning is identical to earlier core-calls/ONNX/Search receipts and remains a non-fatal existing build warning."
    },
    {
      "name": "strict-native-configurations",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked [--features e2e] -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Normal and e2e all-target strict checks pass against the final lock. Logs .local/core-model-cache-clippy-{normal,e2e}-final.log."
    },
    {
      "name": "archive-integrity",
      "command": "Resolve manifest-relative archive paths and verify all SHA-256 values",
      "result": "pass",
      "failures": 0,
      "note": "All nineteen payloads are unchanged. The first ad-hoc probe used the checkout rather than manifest as its relative base and failed to locate a file; correcting that probe resolves all archives without modifying them. Inventory .local/core-model-cache-archives.json."
    },
    {
      "name": "final-documents",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "Progress validates 50 tasks / 284 evidence records. All four specification lanes pass, with 326 indexed chapters. Summary retains all 325 prior chapter paths in order and adds only E-CORE-015. No original milestone status or acceptance gate changes. Log .local/core-model-cache-spec-final.log."
    }
  ],
  "files": [
    "src-tauri/Cargo.lock",
    "MIGRATION.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CORE-015.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "remaining": []
}
```

Notes source `a18c84bb` qualifies native HTTPS installation into a fresh cache,
accepted work after detach and cold-process offline inference. Its real model
vectors retain the qualified reference; no JavaScript runtime or UI is added.
Desktop continues to use its prior database adapter. This intake does not
package a model/runtime or adopt the cache factory.

Only the native lock graph and tracking/evidence change. No renderer source,
manifest, npm lockfile, pnpm archive or installed payload is changed. Native
dependency checks do not substitute for later hosted/native database adoption.
Summary spacing is tightened to keep navigation under 400 lines while retaining
every existing chapter path and order. New evidence is appended; committed
historical records and visual baselines remain untouched.

The source receipt retains 216 ordinary Rust cases, four live-download and four
offline real-model targets, full source checks/build and 49 specification
regressions. Consumer documentation qualification is recorded before commit.

The first consumer spec run reports the Desktop chapter's existing near-limit
prose exceeds 32,768 bytes after the new intake note. Condense that introductory
context while preserving requirements and remaining adoption gates; retain the
original byte limit and rerun validation.

Final consumer specification and changed-file formatting checks pass. Native
model/cache dependency intake is complete; actual service adoption remains
waiting in Notes R1.3/R3.
