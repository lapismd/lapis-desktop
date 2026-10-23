# Shared native file-service adapter

```json
{
  "id": "E-CORE-003",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": [
    "LD-VAULT-002",
    "LD-VAULT-003",
    "LD-FILE-001",
    "LD-FILE-003"
  ],
  "versions": {
    "desktopBaseline": "ebcadc34",
    "notesFiles": "b64952b4",
    "notesAdmission": "8a918d38"
  },
  "contractReview": "Preserve original vault_fs frames and JSON results while delegating portable actions to the shared vault owner. Retain existing native admission, physical capabilities, OS actions, file IO gate, resource/watch policy and POSIX error codes. HTTP and backup lifetime remain separate R1.3 gates.",
  "milestoneReview": "M16.2 is Done: Desktop file-service intake passes its exact, complete native, normal/e2e build/Clippy and cold native IPC gates. This does not complete R1.3, M15.1, provider journeys or distribution.",
  "runs": [
    {
      "name": "adapter-before",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "fail",
      "failures": 2,
      "note": "Missing protocol dependency and native service adapter module; no cases ran. Existing linker unwind-size warning retained."
    },
    {
      "name": "adapter-after",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --offline",
      "result": "pass",
      "failures": 0,
      "note": "Both cases pass: two native admissions share file state, independent close/reopen works, and unknown/replaced physical admissions reject."
    },
    {
      "name": "complete-native",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "230 cases pass; zero fail and two existing ignored helpers. Normal application binary also compiles; the existing linker unwind-size warning remains."
    },
    {
      "name": "native-frame-baseline",
      "command": "node --test --test-concurrency=1 tests/desktop/core-file-service.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "One cold hidden-process case passes against the pre-existing acceptance package, SHA256 e22be6a4463a695a42f347511ee931ce7d456daa090b6a1b9b34c189a1c8d0ca. Proves the preserved frame/operation baseline; it does not qualify the changed implementation."
    },
    {
      "name": "mapped-fixture-context",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Shared NativeServices fixture fields require the mapped AI and Repository chapters. Updated their existing compact core references, keeping both 400-line limits and every validation rule."
    },
    {
      "name": "native-api-rebuilt",
      "command": "pnpm test:desktop:api",
      "result": "pass",
      "failures": 0,
      "note": "Rebuilt the isolated e2e application; all three cold hidden-native cases pass (files, AI admission, Repository admission). File operations preserve frames, Unicode/binary content, mtime, errors, admission and independent close/reopen. Each process remains hidden and unfocused. Acceptance executable SHA256 03360594fd92fc53317844e4fb3f3315a3e90c50e6e9a5bfaccf8dfdf336af2f."
    },
    {
      "name": "native-clippy-normal",
      "command": "CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "native-clippy-e2e",
      "command": "CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "native-build-normal",
      "command": "CARGO_INCREMENTAL=0 cargo build --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary binary builds; existing linker unwind-size warning remains. The e2e bundle build is included in native-api-rebuilt."
    },
    {
      "name": "governance",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 77 governance cases pass."
    },
    {
      "name": "source-boundaries",
      "command": "pnpm check:architecture && pnpm check:app-ownership",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four configured lanes pass after the mapped chapter correction. Closure bookkeeping is verified again before commit."
    },
    {
      "name": "closure-bookkeeping-first",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 2,
      "note": "The passing M16.2 record listed later R1.3 work as remaining gaps. Kept those explicitly outside this record in milestoneReview and prose, with no change to either gate."
    },
    {
      "name": "completion-gate-binding",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "Added the required completedGates binding to the exact unchanged M16.2 gate string after native qualification. No gate text or validation rule changed."
    }
  ],
  "files": [
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/src/host/vault/files.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/ai/imports/tests.rs",
    "src-tauri/src/host/ai/policy/tests.rs",
    "src-tauri/src/host/repository/policy/tests.rs",
    "src-tauri/tests/core_file_service.rs",
    "tests/desktop/core-file-service.test.mjs",
    "scripts/desktop-api-tests.mjs",
    "spec/src/current/files.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-003.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md",
    "spec/src/current/ai.md",
    "spec/src/current/repository.md"
  ],
  "remaining": [],
  "completedGates": {
    "M16.2": "Existing native file IPC delegates portable actions to the shared owner; admission, close, file errors and real native read/edit/mutation acceptance pass with original renderer frames."
  }
}
```

The source ownership/lifecycle layer is qualified separately in Notes. Existing
renderer editors and writer guards remain authoritative for their unsaved
buffers until later R1.3 editor-claim intake. No additional screen or scheduler
is added.

User-approved cleanup removed the 2,165 unchanged obsolete library/metadata
files in the local audit manifest (8.58 GiB), after checking compiler inactivity
and open files. Current application packages and executables were retained.

Later R1.3 gates remain HTTP/browser shell intake, streamed file/resource
routes, service-owned backup after detach and controlled Quit. They are outside
M16.2.
