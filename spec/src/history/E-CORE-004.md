# Shared byte-writer dependency intake

```json
{
  "id": "E-CORE-004",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": ["LD-GOV-006", "LD-VAULT-002", "LD-VAULT-003", "LD-FILE-003"],
  "versions": {
    "desktopBaseline": "e58d2cd2",
    "notesCore": "e615d1b5",
    "lapisAI": "6548afe0",
    "acceptanceSha256": "13d77eb4104dfe734ed1a43ef73d9dd372c4335dad847e38d5526f94bb84e38e"
  },
  "contractReview": "Refresh the private core dependency after byte publication is extracted behind the existing content-version writer. Preserve Desktop file frames, file IO gate, admission, resource MIME policy and lifecycle. Hosted byte routes remain source-qualified separately in Notes.",
  "milestoneReview": "M16.2 remains Done through E-CORE-003; this source intake does not complete R1.3 browser-shell or backup ownership, M15.1, provider or distribution gates.",
  "runs": [
    {
      "name": "locked-baseline",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "fail",
      "failures": 1,
      "note": "Cargo refuses the new shared core normal tempfile dependency until the native lock is refreshed; no cases run."
    },
    {
      "name": "focused-lock-refresh",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --offline",
      "result": "pass",
      "failures": 0,
      "note": "Both native service cases pass. The lock adds only the normal tempfile dependency edge; every existing locked package version is retained."
    },
    {
      "name": "canonical-budget",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "New non-normative core references exceeded desktop.md by 26 bytes and governance.md by one line. Compacted those introductions while retaining all requirements, evidence and original gates."
    },
    {
      "name": "wrapped-reference-budget",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The first compacting edit missed Prettier's wrapped governance reference. Replaced the actual wrapped text and compacted the non-normative Desktop introduction; all requirement text and gates remain unchanged."
    },
    {
      "name": "complete-native",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "230 cases pass; zero fail and the same two ignored helpers. Existing native database, admission, resources, watching, history and file cases remain green."
    },
    {
      "name": "clippy-normal",
      "command": "CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "clippy-e2e",
      "command": "CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "normal-build",
      "command": "CARGO_INCREMENTAL=0 cargo build --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary app builds; the pre-existing linker unwind-size warning remains unchanged."
    },
    {
      "name": "cold-native-api",
      "command": "CARGO_INCREMENTAL=0 pnpm test:desktop:api",
      "result": "pass",
      "failures": 0,
      "note": "Freshly rebuilt e2e package passes all three actual cold hidden-native file, AI-admission and history-admission cases. Native visibility/focus assertions remain false. No headed window/OS or real-provider gate is claimed."
    },
    {
      "name": "source-audits",
      "command": "pnpm check:architecture && pnpm check:app-ownership",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "canonical-corrected",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four configured lanes pass after compacting only the non-normative references. Final evidence/progress/format closure is checked before commit."
    }
  ],
  "files": [
    "src-tauri/Cargo.lock",
    "spec/src/current/files.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-004.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "remaining": []
}
```

The native dependency graph adds only the shared core's normal `tempfile`
dependency edge. No registry package version changes, renderer command changes,
resource-policy changes or new public permission is introduced. Notes qualifies
raw HTTP streaming separately in its 2026-10-24 source record.
