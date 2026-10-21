# Shared native history service intake

```json
{
  "id": "E-REPO-056",
  "date": "2026-10-21",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M13.2"],
  "requirements": ["LD-REPO-001", "LD-REPO-002"],
  "versions": {
    "rust": "1.99.0",
    "jj": "0.45.1",
    "tauri": "2.12.4",
    "jjStore": "f58b9363",
    "desktopParent": "8990cb57"
  },
  "contractReview": "JJ Store mechanically extracted jj-history-service and retained all Tauri adapter reexports and version-one wire bytes. Desktop native admission, physical witnesses, operation pins, full-width frames and drain policy are unchanged. The private lockfile adds the shared service without updating registry versions.",
  "milestoneReview": "M13.2 remains Done at its original qualified native gate; M13 and M13.3 remain Deferred. This is native dependency compatibility evidence, not a fresh native UI, provider, release or visual qualification.",
  "runs": [
    {
      "name": "locked-before",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked repository",
      "result": "fail",
      "failures": 1,
      "note": "The extracted sibling service is absent from the old private lockfile; --locked refuses resolution."
    },
    {
      "name": "native-policy-after",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml repository --offline",
      "result": "pass",
      "failures": 0,
      "note": "15 matching cases pass: 13 host repository policy/frame cases plus two admission matches. Unrelated filtered tests are not counted. Offline resolution changes only the extracted dependency boundary."
    },
    {
      "name": "repository-integration",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test repository_admission --test repository_original --test repository_storage --test repository_backup --test repository_forges --test repository_remote",
      "result": "pass",
      "failures": 0,
      "note": "All 23 cases pass (8 admission, 2 backup, 4 forge, 2 original, 3 remote, 4 storage), including real temporary repositories, guarded source ownership and close/reopen."
    },
    {
      "name": "strict-normal",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary native targets compile with the extracted service through the retained Tauri adapter."
    },
    {
      "name": "strict-e2e",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Feature-gated native instrumentation also compiles. No application is launched and no native UI acceptance is claimed."
    },
    {
      "name": "initial-document-gates",
      "command": "pnpm check:progress; pnpm spec:check",
      "result": "fail",
      "failures": 7,
      "note": "Four fresh-evidence findings preceded the Jujutsu snapshot. Three document budgets then rejected newly appended notes. Kept the limits, shortened only supporting summaries and retained all contract/milestone meanings."
    },
    {
      "name": "migration-budget-followup",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The supporting migration paragraph still wrapped to 401 lines. Its backlog reference was shortened to fit the unchanged 400-line bound."
    },
    {
      "name": "progress",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "42 tasks / 254 evidence records. Bookkeeping only; existing milestone statuses unchanged."
    },
    {
      "name": "specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four lanes pass: canonical validation, Rust formatting, mdBook and spec-first. Original requirement and milestone gates are unchanged."
    }
  ],
  "remaining": [],
  "scope": "Rust dependency intake only. Shared service source passed 14 real-JJ/frame/schema tests and strict enabled-Tauri Clippy in JJ Store. No renderer source, permissions, application profile, installed app or native review window is changed.",
  "files": [
    "src-tauri/Cargo.lock",
    "spec/src/current/repository.md",
    "spec/src/current/desktop.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/migration.md",
    "spec/src/current/verification.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-REPO-056.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ]
}
```
