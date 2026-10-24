# Native Search retrieval compatibility and tracker timestamps

```json
{
  "id": "E-CORE-011",
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
    "desktopBaseline": "c2aa31af",
    "notesCore": "77398e4e",
    "lapisAI": "6548afe0",
    "lapisTerminal": "d7e0a7cd",
    "jjStore": "4d660d4c",
    "jjStoreNativeBaseline": "95d46e44",
    "agentRedaction": "3c3dc0d7",
    "rust": "1.99.0",
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "contractReview": "Compile the Notes lexical/structured Search reader through the retained Core dependency. Add only regress 0.12.0 and its dependency edge to the Desktop lock; no unrelated version upgrades or database transport selection. Persist the task ledger UTC update time in the generated tracker, and require tracker refreshes in each slice commit.",
  "milestoneReview": "M16.2 retains its original E-CORE-003/004 Done gate. These checks qualify dependency compatibility and tracker governance, not native Search adoption or R3 scheduling. E-CORE-008 retains 230 native cases against Notes fa9581f0; E-CORE-005 retains three cold WebView cases against 67a57aa9. Original hosted, provider, Linux, visual and distribution gates remain open. The Markdown Review plan stays Deferred.",
  "runs": [
    {
      "name": "rename-before-after",
      "command": "Strict source and Desktop Clippy after private document bindings become record",
      "result": "fail",
      "failures": 1,
      "note": "One multiline binding is missed and fails compilation. Fix the source reference; strict normal/e2e reruns below pass. Logs .local/core-search-retrieval-clippy.log and .local/core-search-retrieval-clippy-final.log."
    },
    {
      "name": "strict-normal-and-e2e",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat with --features e2e",
      "result": "pass",
      "failures": 0,
      "note": "Both configurations pass against the final native source. Logs .local/core-search-retrieval-clippy-final.log and .local/core-search-retrieval-clippy-e2e.log. No app is launched."
    },
    {
      "name": "exact-native-service",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two pass, zero failed/ignored, after the final source correction. The unchanged compact-unwind linker warning remains. Log .local/core-search-retrieval-service-final.log. This is service/dependency qualification, not a WebView gate."
    },
    {
      "name": "timestamp-before",
      "command": "node --test --test-name-pattern=\"migration summary retains\" tests/governance/progress.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The new timestamp export is absent. Log .local/migration-timestamp-before.log."
    },
    {
      "name": "timestamp-after",
      "command": "node --test --test-name-pattern=\"migration summary retains\" tests/governance/progress.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "One pass: exact UTC date/time survives generation, a changed timestamp fails summary comparison, and date-only input is rejected. Log .local/migration-timestamp-after.log."
    },
    {
      "name": "full-governance",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 78 cases pass, zero failed/skipped. Log .local/migration-timestamp-governance.log."
    },
    {
      "name": "selected-native-graph",
      "command": "cargo tree --manifest-path src-tauri/Cargo.toml --locked --offline --target aarch64-apple-darwin; jj source status and native input diffs",
      "result": "pass",
      "failures": 0,
      "note": "Six local roots retained. AI, Terminal and Redaction are clean at their recorded source revisions. JJ Store has unrelated UI/catalog/docs work; all 497 changed paths from 95d46e44 through the current tree omit Rust/Cargo/desktop inputs. Preserve that work. Notes records the final source commit before this evidence is committed. Offline Cargo updates propose 31 unrelated upgrades; discard them and retain only the new package/edge. Log .local/core-search-retrieval-tree.log; Notes inventory .local/rust-search-retrieval-jj-store-inputs-final.txt."
    },
    {
      "name": "canonical-document-limit",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The expanded Desktop introduction is 32,791 bytes, 23 above the unchanged 32,768-byte limit. Shorten only explanatory dependency prose; preserve every requirement and the validator. Log .local/core-search-retrieval-spec.log. The final rerun is recorded below."
    },
    {
      "name": "canonical-size-correction-noop",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The initial prose replacement no longer matches after formatting, so the document remains unchanged at 32,791 bytes. Apply the correction using its explicit introduction boundary and verify the actual byte count. Log .local/core-search-retrieval-spec-pass.log. No requirement or validator changes."
    },
    {
      "name": "qualified-source",
      "command": "Notes pnpm check, pnpm test, pnpm build, pnpm spec:check and cold pnpm test:storybook; final native workspace test/build rerun",
      "result": "pass",
      "failures": 0,
      "note": "Notes 77398e4e qualifies 76 complete Search queries per retained provider, four exact native retrieval cases, 160 Rust cases, 1479 API cases, 261 catalog interaction/accessibility cases and every source check/build/specification lane. The native inputs used above are byte-identical to that source commit. Unicode snippets are repaired in the retained API; this native dependency check does not refresh the Desktop renderer archives."
    },
    {
      "name": "final-document-governance",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; changed-file Prettier and final pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Specification check passes all four lanes after the prose-size correction. Progress qualifies 50 tasks / 277 evidence records as bookkeeping; 6 validators cover 318 chapters / 106 requirements. The last-updated UTC stamp comes from the task ledger and survives generation. Logs .local/core-search-retrieval-spec-final.log, .local/core-search-retrieval-progress.log and .local/core-search-retrieval-doc-validate.log. Final metadata/format validation is retained in the commit checks."
    }
  ],
  "files": [
    "AGENTS.md",
    "MIGRATION.md",
    "scripts/progress.mjs",
    "scripts/progress-model.mjs",
    "tests/governance/progress.test.mjs",
    "src-tauri/Cargo.lock",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-011.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "remaining": []
}
```

The renderer archive cohort, existing database transport and native UI stay
unchanged. No application window, visual baseline, publication or installed app
replacement is part of this dependency/governance slice.
