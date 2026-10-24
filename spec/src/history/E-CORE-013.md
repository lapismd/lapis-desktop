# Native ONNX encoder dependency compatibility

```json
{
  "id": "E-CORE-013",
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
    "desktopBaseline": "39fba424",
    "notesCore": "6e56d581",
    "lapisAI": "6548afe0",
    "lapisTerminal": "d7e0a7cd",
    "jjStore": "4d660d4c",
    "jjStoreNativeBaseline": "95d46e44",
    "agentRedaction": "3c3dc0d7",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "ort": "2.0.0-rc.15 / API 30",
    "tokenizers": "0.22.2"
  },
  "contractReview": "Qualify the new Notes native ONNX encoder as an unused shared-core dependency. The existing Desktop database transport, native file service and renderer archives remain unchanged. Target the core dependency lock refresh and retain all existing dependency versions. Refresh the task ledger and generated migration summary with a UTC date/time in the same commit.",
  "milestoneReview": "M16.2 retains its original E-CORE-003/004 file/admission Done gate. This receipt qualifies native dependency compatibility only. Notes source qualification does not select a Desktop semantic provider or AppDatabase adapter, package a runtime/model, or qualify R1.3 hosted shell/backup lifetime and R3 unattended indexing. Existing UI/OS, provider, Linux, visual and distribution gates remain open. Markdown Review remains Deferred.",
  "runs": [
    {
      "name": "exact-native-baseline",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "fail",
      "failures": 1,
      "note": "One lockfile diagnostic, zero runtime cases: the new native dependency graph is absent from the prior consumer lock. Log .local/core-onnx-service-before.log."
    },
    {
      "name": "targeted-lock-refresh",
      "command": "cargo update --manifest-path src-tauri/Cargo.toml --offline -p lapis-app-core; parsed package/version lock comparison",
      "result": "pass",
      "failures": 0,
      "note": "Adds 29 required package/version pairs; removes/upgrades none. The 31 existing packages behind latest remain untouched. Logs .local/core-onnx-lock-refresh.log and .local/core-onnx-lock-diff.json."
    },
    {
      "name": "qualified-source",
      "command": "Notes exact pnpm test:search:onnx --force, root pnpm check/test/build, pnpm spec:check and routing/cache regressions",
      "result": "pass",
      "failures": 0,
      "note": "Notes 6e56d581 qualifies actual pinned MiniLM CPU outputs: exact tokens, long postprocessed truncation, mixed padding and a nine-input batch, normalized/raw vectors within 1e-5, independent/reopened sessions and runtime-identity rejection. 173 ordinary Rust cases pass with one explicit model case ignored there and separately executed successfully; 1489 API cases pass, plus all 20 check/test tasks, 11 build tasks, nine spec lanes/38 regressions and ten routing/cache cases. Only the Notes real model lane loads the temporary qualification library; Desktop does not select or bundle it."
    },
    {
      "name": "source-provenance",
      "command": "Sibling Jujutsu status; JJ Store native-input diff from 95d46e44 through working copy",
      "result": "pass",
      "failures": 0,
      "note": "AI 6548afe0, Terminal d7e0a7cd and Redaction 3c3dc0d7 remain clean. JJ Store has 529 unrelated paths relative to its native baseline and zero crates/Cargo/toolchain/desktop inputs changed; preserve them. Inventory in Notes .local/rust-onnx-jj-store-inputs.txt."
    },
    {
      "name": "exact-native-service",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two pass, zero failed/ignored. The existing compact-unwind linker warning remains non-fatal. No app window or user profile is opened. Log .local/core-onnx-service.log."
    },
    {
      "name": "strict-normal-and-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat with --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Both configurations pass. Logs .local/core-onnx-clippy.log and .local/core-onnx-clippy-e2e.log. The locked/offline Darwin feature tree confirms dynamic API 30, without a runtime download feature; log .local/core-onnx-runtime-features.log."
    },
    {
      "name": "progress-authoring-before",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "The unfinished evidence draft used result partial, which is not an accepted evidence result. The validator rejects that metadata once. The finalized record uses pass only after native qualification and retains all failed attempts. Log .local/core-onnx-progress-check-first.log."
    },
    {
      "name": "specification-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "One canonical byte-budget diagnostic: the expanded desktop.md checkpoint reaches 32836 bytes against the unchanged 32768-byte limit. Condense only that new checkpoint prose, retaining evidence links and all existing requirements. Exact rerun follows; log .local/core-onnx-spec-final.log."
    },
    {
      "name": "specification-byte-fix-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The first condensation still exceeds the unchanged byte limit by nine bytes (32777). Shorten the same new checkpoint further, preserving its qualification boundary and every existing requirement. Log .local/core-onnx-spec-pass.log."
    },
    {
      "name": "progress-and-specification",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; changed-document Prettier check",
      "result": "pass",
      "failures": 0,
      "note": "All four specification lanes pass after retaining both byte-limit failures. Progress inventory passes with 50 tasks and 279 evidence records; this is bookkeeping, not new product acceptance. Refresh the UTC ledger timestamp and generated MIGRATION.md, format/check changed documents and validate final metadata before commit. Logs .local/core-onnx-spec-accepted.log and .local/core-onnx-{progress,progress-check,format,validate}-commit.log. No baseline, package or installed application changes."
    }
  ],
  "files": [
    "src-tauri/Cargo.lock",
    "MIGRATION.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-013.md",
    "spec/src/history/core/index.md",
    "spec/src/SUMMARY.md"
  ],
  "remaining": []
}
```

This is a dependency receipt. It does not select native semantic Search, change
renderer behavior, or complete an original hosted/native product gate.
