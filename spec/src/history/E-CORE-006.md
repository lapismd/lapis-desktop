# Focused native projection dependency compatibility

```json
{
  "id": "E-CORE-006",
  "date": "2026-10-24",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.2"],
  "requirements": ["LD-GOV-006", "LD-VAULT-002", "LD-VAULT-003", "LD-FILE-003"],
  "versions": {
    "desktopBaseline": "f043d1b9",
    "notesCore": "65a6c0e0",
    "lapisAI": "6548afe0",
    "lapisTerminal": "d7e0a7cd",
    "jjStore": "d6be1ae5",
    "jjNativeSourceUnchangedFrom": "47a73e13"
  },
  "contractReview": "Add the three ordered-map dependency edges required by committed Notes projection DTOs. Keep every previous package version and unrelated dependency edge. The existing Desktop database adapter, renderer frames and native file policy remain unchanged.",
  "milestoneReview": "M16.2 remains Done through its original E-CORE-003/004 gates. This record qualifies focused dependency compilation and two shared-file-service regressions only. E-CORE-005 remains the full 230-case/three-cold-case qualification for Notes 67a57aa9. No database adoption, native UI/OS, provider, Linux, hosted shell, backup or distribution gate is widened.",
  "runs": [
    {
      "name": "locked-before",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "fail",
      "failures": 1,
      "note": "Lockfile lacks the three new indexmap dependency edges; zero cases run. Log .local/core-db-projections-before.log."
    },
    {
      "name": "offline-lock-refresh",
      "command": "cargo update --manifest-path src-tauri/Cargo.toml --offline -p lapis-app-protocol",
      "result": "pass",
      "failures": 0,
      "note": "No package versions added or changed. The resolver also changed an unrelated gix-imara-diff hashbrown edge; restored its original selection, then reran the exact locked target."
    },
    {
      "name": "focused-native-final",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_file_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two pass, zero fail/ignored. Log .local/core-db-projections-service-final.log. The known linker unwind-size warning remains. Earlier candidate lock also passed both cases."
    },
    {
      "name": "source-native-review",
      "command": "jj --no-pager diff --from 47a73e13 --to d6be1ae5 --summary",
      "result": "pass",
      "failures": 0,
      "note": "JJ Store changed catalog/docs/config only; native crates and Cargo inputs are unchanged. AI and Terminal remain clean at their recorded revisions."
    },
    {
      "name": "canonical-before",
      "command": "pnpm spec:check; changed-file Prettier",
      "result": "fail",
      "failures": 4,
      "note": "New prose crossed the desktop byte limit and governance/migration line limits; initial navigation lacked the new record. Condensed only the intake summaries and added the history links. Generated MIGRATION needed formatting. No limits or requirements were relaxed."
    },
    {
      "name": "governance-progress-format",
      "command": "pnpm progress:generate && pnpm check:progress && pnpm spec:check; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "Original task statuses and completion gates remain unchanged."
    }
  ],
  "files": [
    "src-tauri/Cargo.lock",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-006.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "remaining": []
}
```

Notes owns the source-qualified projection writes, generated DTOs and shared
scalar fixtures. Desktop consumes their compiled dependency graph but retains
its existing database adapter. Complete native and product qualification is
explicitly distinct from this focused check. No product source changes.
