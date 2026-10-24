# Native indexed-file facade dependency compatibility

```json
{
  "id": "E-CORE-012",
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
    "desktopBaseline": "790e0b23",
    "notesCore": "68f9c02e",
    "lapisAI": "6548afe0",
    "lapisTerminal": "d7e0a7cd",
    "jjStore": "4d660d4c",
    "jjStoreNativeBaseline": "95d46e44",
    "agentRedaction": "3c3dc0d7",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "contractReview": "Compile the new Notes indexed-file upsert/rename/delete facade and renamed-change journal through the retained Core dependency. The existing Desktop database transport, native file service, Cargo lock and renderer archives are unchanged. Refresh the UTC task-ledger timestamp and generated tracker. Group Core evidence navigation before the root history index exceeds its unchanged 400-line limit; preserve original evidence files and links.",
  "milestoneReview": "M16.2 retains its original E-CORE-003/004 file/admission Done gate. This record qualifies dependency compatibility, not new AppDatabase selection, semantic Search, R3 background indexing or R1.3 hosted shell/backup lifetime. E-CORE-008 retains 230 native cases against Notes fa9581f0; E-CORE-005 retains three cold WebView cases against 67a57aa9. Original native UI/OS, provider, hosted, Linux, visual and distribution gates remain open; Markdown Review stays Deferred.",
  "runs": [
    {
      "name": "exact-native-service",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two pass, zero failed/ignored. The existing compact-unwind linker warning remains non-fatal. No application window is launched. Log .local/core-indexed-mutations-service.log."
    },
    {
      "name": "strict-normal-and-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat with --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Both configurations pass. Logs .local/core-indexed-mutations-clippy.log and .local/core-indexed-mutations-clippy-e2e.log. No app window is launched."
    },
    {
      "name": "qualified-source",
      "command": "Notes pnpm check, pnpm test, pnpm build and pnpm spec:check, with exact native and retained-provider targets first",
      "result": "pass",
      "failures": 0,
      "note": "Notes 68f9c02e qualifies ten retained full-state cases, seven exact native cases, two protocol cases, 169 Rust cases, 1489 API cases and full source check/test/build/specification lanes. These native inputs match those used by the consumer checks. No renderer runtime or story helper changes; the prior 261-case cold catalog and older WebView receipts remain separate."
    },
    {
      "name": "source-provenance",
      "command": "Selected locked/offline Darwin cargo tree; source Jujutsu status and native input diffs",
      "result": "pass",
      "failures": 0,
      "note": "The Cargo lock and dependency selections are unchanged. AI 6548afe0, Terminal d7e0a7cd and Redaction 3c3dc0d7 are clean. JJ Store has 519 unrelated changed paths from 95d46e44 through the inspected working copy, with zero Rust/Cargo/desktop changes; preserve them. Notes inventory .local/rust-indexed-mutations-jj-store-inputs.txt. The source method-name inventory finds 60 direct matches among 68 retained remote methods, but does not qualify remaining modes, transport return shapes or host adoption."
    },
    {
      "name": "progress-and-documents",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; final changed-document Prettier and pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Full specification check passes four lanes. Core evidence links move into a navigation page to keep the root index under its unchanged line limit; original evidence files remain immutable. Final progress, UTC timestamp and metadata checks run before commit. Logs use .local/core-indexed-mutations-{progress,spec,format,validate}*."
    }
  ],
  "files": [
    "MIGRATION.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-012.md",
    "spec/src/history/index.md",
    "spec/src/history/core/index.md",
    "spec/src/SUMMARY.md"
  ],
  "remaining": []
}
```

This native dependency receipt changes no renderer runtime, catalog family,
production database adapter or native product completion gate. No app, visual
baseline, package publication or installed application is changed.
