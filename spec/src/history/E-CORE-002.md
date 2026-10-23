# Shared core protocol dependency intake

```json
{
  "id": "E-CORE-002",
  "date": "2026-10-23",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.1"],
  "requirements": ["LD-GOV-006", "LD-VAULT-002", "LD-VAULT-003"],
  "versions": {
    "desktopBaseline": "6700f104",
    "notesCore": "c5ffe1b9 (R1.2)"
  },
  "contractReview": "Refresh the native dependency lock after Notes adds its private protocol crate and service module. No Desktop source, IPC command, window policy or runtime service selection changes. Existing callers still use the qualified low-level vault engine and host IO gate.",
  "milestoneReview": "This is dependency intake for the completed M16.1 extraction. R1.2 is source-qualified in Notes; Desktop/HTTP service adapter and backup ownership acceptance remain R1.3. Existing M15.1 and provider/distribution gates remain open.",
  "runs": [
    {
      "name": "locked-baseline",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test vault_conditional --locked",
      "result": "fail",
      "failures": 1,
      "note": "Cargo correctly refused the stale lock after the new protocol dependency. No cases ran."
    },
    {
      "name": "focused-lock-refresh",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test vault_conditional --offline",
      "result": "pass",
      "failures": 0,
      "note": "All six conditional-write cases pass. Offline resolution initially selected three older registry versions; restored the exact original generator, rustls-native-certs and schannel versions with cargo update --precise before final qualification."
    },
    {
      "name": "complete-native",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "228 pass, zero fail, two existing ignored helpers. Tests and the normal application binary compile. The same baseline linker unwind-size warning remains. Source modules compiled against Notes c5ffe1b9 before the R1.3 modules were connected."
    },
    {
      "name": "fresh-evidence-discovery",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 2,
      "note": "The ignore-working-copy reader still saw the pre-edit Jujutsu snapshot and missed the new record. Snapshotted with jj st and reran; no evidence rule changed."
    },
    {
      "name": "document-budget",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The added migration context exceeded its 400-line budget by three. Replaced the existing compact core reference rather than expanding the chapter or changing the limit."
    },
    {
      "name": "consumer-governance",
      "command": "pnpm check:progress; pnpm spec:check; pnpm exec prettier --check changed Markdown files",
      "result": "pass",
      "failures": 0,
      "note": "44 tasks and 267 evidence records validate; all four spec lanes and changed-file formatting pass. No renderer/native command source changed. Broad UI and existing e2e/provider milestone gates are not claimed by this lock refresh."
    }
  ],
  "files": [
    "src-tauri/Cargo.lock",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-002.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "remaining": []
}
```

Cargo also regenerated existing target-specific dependency edges while resolving
the new crate. No registry package version upgrade or Desktop product behavior
is introduced. Windows packaging is not qualified by this macOS native run.

The approved inactive incremental cache was removed only after no compiler was
running. Final qualification disabled incremental output to avoid regenerating
that cache. The separately requested removal of obsolete test executables has
not been performed without approval.
