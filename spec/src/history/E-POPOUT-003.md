# Native workspace-window session registry

```json
{
  "id": "E-POPOUT-003",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "tasks": ["M7.3"],
  "requirements": [
    "LD-POP-004",
    "LD-POP-005",
    "LD-DESK-003",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-004",
    "LD-MIG-002"
  ],
  "result": "pass",
  "remaining": [],
  "contractReview": "M7.3 gains a private desktop-owned native registry, without enabling ordinary popups or granting filesystem/IPC authority. It admits only the active main session and exact blank related-window requests, bounds reservations/live windows to sixteen, fences pending creation, and retains windows after failed saves. Native-generated generation tickets and close receipts reject stale, duplicate and cross-session completion. Existing LD-POP-004/005 window/save ownership and LD-DESK-003 authority are retained. Governance maps this service and its regression tests to the window contract; no public package interface, data format, release or source dependency changes.",
  "milestoneReview": "M7.3 is now In progress under the user request to implement outstanding desktop work while deferring release. This registry slice is complete; native creation, renderer adapter, attachment admission, menu/drag routing and actual packaged multiple-window save/close qualification remain required by the unchanged original M7.3 gate. All other milestone gates/statuses remain unchanged. No release, publication, signing or baseline work is started.",
  "versions": "macOS ARM64; Rust 1.99.0; existing locked desktop dependencies",
  "files": [
    "src-tauri/src/lib.rs",
    "src-tauri/src/windows/mod.rs",
    "src-tauri/tests/workspace_windows.rs",
    "spec-validator.config.mjs",
    "PLAN.md",
    "MIGRATION.md",
    "spec/src/current/windows.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-POPOUT-003.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "runs": [
    {
      "name": "before",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test workspace_windows",
      "result": "fail",
      "failures": 1,
      "note": "The new six-case native regression cannot import lapis_desktop::windows because the registry does not exist. Compiler E0432; exit 101."
    },
    {
      "name": "after",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test workspace_windows",
      "result": "pass",
      "failures": 0,
      "note": "6/6 pass: active main owner and exact blank URL; failed creation/capacity; failed-save retention and close receipt identity; fencing and recovery; session replacement; identity validation. Existing native linker warns that the compact-unwind encoding exceeds 16 MB; this does not fail compilation/tests."
    },
    {
      "name": "native-check",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --locked --lib --test workspace_windows -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Owning library and exact native regression compile with strict lint and no diagnostics."
    },
    {
      "name": "scoped-rust-format",
      "command": "rustfmt --edition 2024 src-tauri/src/windows/mod.rs src-tauri/tests/workspace_windows.rs",
      "result": "pass",
      "failures": 0,
      "note": "Formats only the new module and regression file."
    },
    {
      "name": "document-limit-repairs",
      "command": "pnpm spec:validate (three attempts before the final pass)",
      "result": "fail",
      "failures": 5,
      "note": "First attempt: Desktop 32970 and milestones 33161 bytes; second: 32918/32876; third: milestones 32818. Condensed narrative without changing requirements or original gates. An intermediate compaction script updated Desktop then stopped on an unmatched ledger-paragraph assertion; corrected against the current text. Final files are 32752/32709 bytes."
    },
    {
      "name": "documents-after",
      "command": "pnpm spec:validate; pnpm spec:first; pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "Six specification validators, 210 chapters and 95 requirements pass; source-first passes seven protected files/four canonical chapters; progress passes 41 tasks/183 evidence records. No completion gate is promoted."
    },
    {
      "name": "boundaries-and-format",
      "command": "pnpm check:architecture; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check; pnpm exec prettier --check PLAN.md MIGRATION.md spec-validator.config.mjs spec/src/current/windows.md spec/src/current/desktop.md spec/src/current/governance.md spec/src/current/migration.md spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/history/E-POPOUT-003.md spec/src/history/index.md spec/src/SUMMARY.md",
      "result": "pass",
      "failures": 0,
      "note": "Source boundaries, complete Rust formatting and the explicitly selected changed document/config formatting pass."
    }
  ]
}
```

The source JJ checkout has concurrent workflow-plan edits, which are preserved.
The Desktop checkout was clean before this independent window slice. No review
profile, vault contents, installed app or running service was modified.

Focused native policy evidence does not prove actual popup creation, editor
transfer, browser lifecycle, native control geometry or multiple-window saves.
Those remain the next implementation/acceptance surface. UI matrices and native
runtime restart are outside this registry-only slice; release stays deferred.
