# Physical repository admission

```json
{
  "id": "E-REPO-001",
  "tasks": ["M13", "M13.1"],
  "requirements": [
    "LD-REPO-001",
    "LD-VAULT-003",
    "LD-DESK-003",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-MIG-002"
  ],
  "revision": "enclosing Jujutsu change nlxztkov",
  "versions": {
    "rust": "1.99.0",
    "desktop": "0.1.0",
    "jj-lib/stock-jj": "0.45.1",
    "jj-store": "5397a56e",
    "platform": "macOS ARM64"
  },
  "files": [
    "MIGRATION.md",
    "docs/repository-admission.md",
    "scripts/spec-contracts.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-001.md",
    "spec/src/history/index.md",
    "spec-validator.config.mjs",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/README.md",
    "src-tauri/src/lib.rs",
    "src-tauri/src/repository/mod.rs",
    "src-tauri/src/repository/source.rs",
    "src-tauri/tests/repository_admission.rs",
    "tests/governance/contracts.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "before",
      "command": "jj file list -r @- src-tauri/src/repository src-tauri/tests/repository_admission.rs",
      "result": "pass",
      "failures": 0,
      "note": "No repository-specific admission service existed; shared VaultAdmissions and existing AI have retained E-AI-025 qualification."
    },
    {
      "name": "initial-real-jj",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --test repository_admission --offline",
      "result": "pass",
      "failures": 0,
      "note": "Initial four real stock-JJ service cases pass. Discovery/byte-preservation includes colocated and internal Git; no new IPC or host integration."
    },
    {
      "name": "lock-restoration",
      "command": "cargo update --manifest-path src-tauri/Cargo.toml -p generator --precise 0.8.11 --offline; cargo update --manifest-path src-tauri/Cargo.toml -p rustls-native-certs --precise 0.8.5 --offline; cargo update --manifest-path src-tauri/Cargo.toml -p schannel --precise 0.1.30 --offline; cargo update --manifest-path src-tauri/Cargo.toml -p toml_edit@0.25.15+spec-1.1.0 --precise 0.25.17+spec-1.1.0 --offline",
      "result": "pass",
      "failures": 0,
      "note": "Initial offline resolution selected four cached downgrades; explicitly retained all four original locked versions. Final package-pair comparison records actual additions and proves no existing version removed."
    },
    {
      "name": "source-proof",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --test repository_admission --locked",
      "result": "pass",
      "failures": 0,
      "note": "Seven real-JJ cases pass: pending/AI isolation, exact windows/session, reload/retirement/stale tickets, full source bytes and dirty files, linked workspaces/external heads, replaced vault/JJ/metadata/Git directories, bounded file/symlink witnesses and closure fences."
    },
    {
      "name": "normal-clippy",
      "command": "CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Strict ordinary all-target lint passes."
    },
    {
      "name": "normal-native",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "Full native service suite:108 pass/2 existing ignored subprocess helpers,25 result sets. Current final semantic source includes retirement cleanup. No actual WebView product claim."
    },
    {
      "name": "source-audit",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "note": "Native reusable policy/source modules and all existing source boundaries pass."
    },
    {
      "name": "app-ownership",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Owned App boundary audit passes; renderer unchanged."
    },
    {
      "name": "initial-spec-first",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "12 protected files/four canonical chapters pass before fresh evidence expansion."
    },
    {
      "name": "initial-spec",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Expected missing fresh evidence/generated summary and verification-table byte cap before record creation. New rows joined the existing verification table; shortened its widest summary while preserving every historical evidence reference."
    },
    {
      "name": "e2e-clippy",
      "command": "CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Strict e2e all-target lint passes, after final source formatting."
    },
    {
      "name": "e2e-native",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --features e2e --locked",
      "result": "pass",
      "failures": 0,
      "note": "Full e2e-feature service suite:108 pass/2 existing ignored subprocess helpers,26 result sets. This is not an actual native WebView run."
    },
    {
      "name": "e2e-build",
      "command": "CARGO_INCREMENTAL=0 cargo build --manifest-path src-tauri/Cargo.toml --features e2e --bins --locked",
      "result": "pass",
      "failures": 0,
      "note": "Both e2e native binaries compile successfully."
    },
    {
      "name": "ordinary-build",
      "command": "CARGO_INCREMENTAL=0 cargo build --manifest-path src-tauri/Cargo.toml --bins --locked",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary native binary compiles, after e2e build; no installed application replaced or launched."
    },
    {
      "name": "governance",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All46pass, including new owning repository contract mapping."
    },
    {
      "name": "lock-metadata",
      "command": "CARGO_INCREMENTAL=0 cargo metadata --manifest-path src-tauri/Cargo.toml --format-version 1 --no-deps --locked",
      "result": "pass",
      "failures": 0,
      "note": "Native metadata valid. TOML set comparison with exact parent lock proves109new package versions and zero removed existing versions after the four offline-resolution restorations."
    },
    {
      "name": "jj-version",
      "command": "/opt/homebrew/bin/jj --version",
      "result": "pass",
      "failures": 0,
      "note": "Stock JJ0.45.1 matches fixtures and owned library profile."
    },
    {
      "name": "progress",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "32tasks/84evidence records pass; M13/M13.1 Inprogress and original M10.2 unchanged."
    },
    {
      "name": "specification",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Six validators/99chapters/92requirements pass after fresh evidence and bounded verification-table summary adjustment."
    },
    {
      "name": "final-format",
      "command": "node .local/reusable-conversations/check-persistence-format.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All changed authored Markdown/TypeScript passes; exact source formatter and Rustfmt pass."
    },
    {
      "name": "rust-format",
      "command": "CARGO_INCREMENTAL=0 cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "Native Rust formatting passes."
    },
    {
      "name": "final-spec-first",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "13 protected files/four canonical chapters pass."
    },
    {
      "name": "final-spec",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Six validators/99 chapters/92 requirements pass with current evidence."
    }
  ],
  "contractReview": "LD-REPO-001 adds an independent service registry with native physical JJ/Git witnesses, installation-derived repository identity, monotonic native registration generation and exact pending/reload/retirement transitions over shared VaultAdmissions. Reads and discovery never initialize, snapshot or reconcile source state. Existing LD-VAULT-003/LD-DESK-003 file, AI, database and caller behavior are unchanged: this service is not registered as product IPC. Owned JJ companion APIs are temporarily consumed through versioned sibling paths; no upstream jj-lib imports in Notes. Source, runtime and publication authority remain separate. New repository topic and M13 stage gates preserve the later native history/durable conversation acceptance requirements.",
  "milestoneReview": "M13/M13.1 become In progress for this service-only prerequisite. Complete native caller/origin/capability policy, drained history transport, Design Core UI and AgentStore/ThreadStore conversation recovery remain required. M10.2 retains its original stage and gates. Compilation and real-JJ source tests do not complete native WebView history, raw-event ownership or first usable Notes milestone; no completedGates, publication or distribution claim.",
  "scope": "Service-only M13.1 physical repository admission. No NativeServices registration, IPC/permission change, active query reader, renderer dependency, history panel, source mutation, raw-event owner or JJ-backed conversation yet. Existing Notes and Design Core previews remain fixture-based; opening/serving them for the user adds no product acceptance claim. Logs under jj-store/.local/reusable-conversations/notes-repository-*. Guarded root maintenance independently reclaimed idle first-party build outputs from23.1to47.1GiB; no active services or fixtures touched, final free42GiB."
}
```
