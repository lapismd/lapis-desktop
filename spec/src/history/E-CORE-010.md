# Native Search storage and preparation dependency compatibility

```json
{
  "id": "E-CORE-010",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": ["LD-GOV-006", "LD-VAULT-002", "LD-VAULT-003", "LD-FILE-003"],
  "versions": {
    "desktopBaseline": "6699a167",
    "nativeDesktopBaseline": "4b775fdb",
    "notesCore": "113cb2ec",
    "lapisAI": "6548afe0",
    "lapisTerminal": "d7e0a7cd",
    "jjStore": "4d660d4c",
    "jjStoreNativeBaseline": "95d46e44",
    "agentRedaction": "3c3dc0d7",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "contractReview": "Consume committed Notes Search storage and document preparation through the existing Core dependency. Desktop already pins Turso 0.7.2 with FTS; the Cargo lockfile, native adapters and renderer archive cohort remain unchanged. The new database methods are compiled but not selected by the production Desktop database transport.",
  "milestoneReview": "M16.2 remains Done through its original E-CORE-003/004 file/admission gate. This record qualifies dependency and service compilation, not Search/database adapter adoption, model inference or R3 scheduling. E-CORE-008 retains 230 native cases against Notes fa9581f0; E-CORE-005 retains three cold WebView cases against 67a57aa9. Native UI/OS, providers, hosted, Linux and distribution gates remain unchanged. The separate Markdown Review plan at 6699a167 remains deferred.",
  "runs": [
    {
      "name": "qualified-baseline",
      "command": "Review E-CORE-009, committed Notes 3aa8abaa/113cb2ec and unchanged Core file-service tests/Cargo inputs",
      "result": "pass",
      "failures": 0,
      "note": "The original two service cases passed against Notes 575bef1f. New source qualification passes 13 focused native Search cases including the 17-record preparation fixture, 81 affected API cases, 153 full Rust cases, 1303 API cases and 261 catalog cases. All source check/test/build/specification lanes pass; initial source failures and successful reruns remain in Notes evidence."
    },
    {
      "name": "exact-native-service",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two pass, zero failed/ignored. The native dependencies rebuild after cache cleanup. The unchanged compact-unwind linker warning remains. Log .local/core-search-service.log. These cases qualify dependency compatibility and file services, not the unadopted Search facade."
    },
    {
      "name": "strict-normal-and-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat with --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Both configurations pass. Logs .local/core-search-clippy.log and .local/core-search-clippy-e2e.log. No application window is launched."
    },
    {
      "name": "offline-all-platform-inventory",
      "command": "cargo metadata --manifest-path src-tauri/Cargo.toml --format-version 1 --locked --offline",
      "result": "fail",
      "failures": 1,
      "note": "An inspection attempt requests uncached optional antithesis_sdk 0.2.9 outside the selected native build. No compilation/test fails. Use the selected Darwin dependency tree for actual input inventory; this is not a product acceptance gate."
    },
    {
      "name": "selected-native-source-state",
      "command": "cargo tree --manifest-path src-tauri/Cargo.toml --locked --offline --target aarch64-apple-darwin --prefix none --format {p}; jj status and native-path diffs in selected source roots",
      "result": "pass",
      "failures": 0,
      "note": "The selected graph has exactly six local roots: Desktop, Notes, AI, Terminal, JJ Store and Agent Redaction. Notes/AI/Terminal/Redaction inputs are committed and clean. JJ Store has unrelated uncommitted documentation; its consumed Rust/Cargo paths are unchanged from 95d46e44 through parent 4d660d4c and the current working copy. Desktop gains the separate committed Review plan during checks; its Rust, Cargo, permissions and runtime sources are unchanged from 4b775fdb. Preserve all other work. Cargo.lock remains unchanged."
    }
  ],
  "files": [
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-010.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "remaining": []
}
```

Commit verification uses `pnpm progress:generate`, changed-document formatting,
snapshotting JJ before `pnpm check:progress`, and `pnpm spec:check`. Logs use
`.local/core-search-progress*`, `.local/core-search-format.log` and
`.local/core-search-spec.log`.

No Desktop runtime code, dependency selection, UI, archives or lifecycle
changes. The full native suite is not repeated for unused database additions;
new storage and preparation behavior is independently qualified in Notes. No
native product gate is widened, no app is launched and no visual baseline is
updated.
