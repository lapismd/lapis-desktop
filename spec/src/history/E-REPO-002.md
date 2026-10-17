# Native admitted history and vault lifetime

```json
{
  "id": "E-REPO-002",
  "tasks": ["M13", "M13.1", "M13.2"],
  "requirements": [
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-VAULT-003",
    "LD-DESK-003",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-MIG-002",
    "LD-AI-001"
  ],
  "revision": "enclosing Jujutsu change zzyuzypm",
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
    "package.json",
    "pnpm-lock.yaml",
    "scripts/desktop-api-tests.mjs",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-002.md",
    "spec/src/history/index.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/README.md",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/ai/policy/tests.rs",
    "src-tauri/src/host/database.rs",
    "src-tauri/src/host/lifecycle.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/commands.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/policy.rs",
    "src-tauri/src/host/repository/policy/tests.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/repository/mod.rs",
    "src-tauri/tests/repository_admission.rs",
    "tests/desktop/repository-admission.test.mjs",
    "tests/governance/source-audit.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "before",
      "command": "jj file list -r @- src-tauri/src/host/repository tests/desktop/repository-admission.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "No repository IPC host or hidden native history acceptance existed in the exact parent; independent service admission retained E-REPO-001 proof."
    },
    {
      "name": "initial-format",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "fail",
      "failures": 1,
      "note": "Initial formatting reported the declared policy/tests module did not yet exist. Added its actual native origin/window/session/retained-grant regressions; no formatter contract changed."
    },
    {
      "name": "native-check",
      "command": "CARGO_INCREMENTAL=0 cargo check --manifest-path src-tauri/Cargo.toml --bins --offline",
      "result": "pass",
      "failures": 0,
      "note": "Native command/plugin integration compiles; resolution adds six package versions and removes none of the parent lock versions."
    },
    {
      "name": "exact-policy",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --bin lapis-desktop host::repository --locked",
      "result": "pass",
      "failures": 0,
      "note": "Two exact host tests pass: strict authority frames and actual policy checks for main-window origin, physical vault/session and retained generation."
    },
    {
      "name": "first-cold-api",
      "command": "pnpm test:desktop:api",
      "result": "pass",
      "failures": 0,
      "note": "Fresh hidden macOS ARM64 WebView: both existing AI and new repository API cases pass before the database-open/close race guard extension. Test bundles only; no installed app or user profile touched."
    },
    {
      "name": "cold-race-attempt",
      "command": "pnpm test:desktop:api",
      "result": "fail",
      "failures": 1,
      "note": "After database opening joined the transition guard, existing AI passes; repository case reaches the new closure race assertion and returns EACCES while the test incorrectly expected ENOENT. Source VaultManager::descriptor/get intentionally uses PermissionDenied. Corrected the exact assertion to EACCES; native error behavior is unchanged."
    },
    {
      "name": "final-cold-api",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/ai-admission.test.mjs tests/desktop/repository-admission.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Final unchanged freshly built app: 2 pass / 0 fail, 10.05s. Actual hidden WebView verifies native caller frames, physical JJ source and bytes, pinned log/diff after external advance, AI independence, strict text frames, blocker-preserving close, both database-open/close request orders, pending preparation drain, reload/old handles, replacement and cold restart. Artifacts: .local/native-test/ai-admission-background-F4WHj8 and repository-background-vKC2dZ. No visibility, focus, animations, live provider or rendered history-panel acceptance. Build retains existing Vite >500k chunk warnings."
    },
    {
      "name": "ordinary-clippy",
      "command": "CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Strict ordinary all-target lint passes."
    },
    {
      "name": "ordinary-native",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "111 pass / 0 fail / 2 existing ignored subprocess helpers, 25 result sets. Includes eight stock-JJ physical service cases and two native host policy/frame cases."
    },
    {
      "name": "e2e-clippy",
      "command": "CARGO_INCREMENTAL=0 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Strict e2e all-target lint passes."
    },
    {
      "name": "e2e-native",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --features e2e --locked",
      "result": "pass",
      "failures": 0,
      "note": "111 pass / 0 fail / 2 existing ignored subprocess helpers, 26 result sets. Service-suite success is separate from the actual hidden WebView proof above."
    },
    {
      "name": "e2e-build",
      "command": "CARGO_INCREMENTAL=0 cargo build --manifest-path src-tauri/Cargo.toml --features e2e --bins --locked",
      "result": "pass",
      "failures": 0,
      "note": "Both e2e binaries compile."
    },
    {
      "name": "ordinary-build",
      "command": "CARGO_INCREMENTAL=0 cargo build --manifest-path src-tauri/Cargo.toml --bins --locked",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary native binary compiles after e2e build; installed application remains unchanged."
    },
    {
      "name": "source-audit",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "note": "Source boundaries pass after the exact local-history/admit/release permission allowset and native module ownership updates."
    },
    {
      "name": "app-audit",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Owned App boundary passes; renderer implementation unchanged."
    },
    {
      "name": "governance",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "47 pass / 0 fail, including the new exact repository permission-set regression."
    },
    {
      "name": "rust-format",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "All native Rust formatting passes."
    },
    {
      "name": "progress-generation",
      "command": "pnpm progress:generate",
      "result": "pass",
      "failures": 0,
      "note": "Generated current MIGRATION summary; M13.1 completes original gate, M13.2 retains visible Notes UI requirement."
    },
    {
      "name": "initial-final-progress",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "Current combined working copy additionally contains three concurrent unrelated Terminal catalog edits without their fresh evidence. This native slice does not edit, claim or commit those paths."
    },
    {
      "name": "initial-final-first",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "Combined working copy requires the unrelated Terminal plugin chapter; this slice also needed explicit unchanged AI policy and migration milestone notes. Added the two owning-topic notes; retained unrelated Terminal work."
    },
    {
      "name": "initial-final-spec",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Combined-working-copy progress reports the same unrelated Terminal evidence gaps and the new E-REPO-002 SUMMARY entry was initially missing. Added its exact SUMMARY entry; no validator changed."
    },
    {
      "name": "authored-format",
      "command": "pnpm exec prettier --check [changed authored native-slice Markdown/JSON/scripts]",
      "result": "pass",
      "failures": 0,
      "note": "Exact selected file inventory retained at jj-store/.local/reusable-conversations/notes-history-format-files.txt. Native Rustfmt also passes; concurrent package/catalog edits are outside this slice."
    },
    {
      "name": "scoped-doc-gates",
      "command": "node .local/reusable-conversations/check-history-docs.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Exact native-slice inventory:36files; source-owned spec-first passes26protected files/sixcanonical chapters; structural progress32tasks/85evidence records and fresh selected-file coverage pass. Initial invocation used an unsnapshotted diff, then correctly rejected newly arrived unrelated file-conflict edits; snapshot/explicit owned evidence-file selection fixed the diagnostic script. Product validators are unchanged. Full combined-working-copy checks retain unrelated concurrent catalog/package/UI scope; selected snapshot checks follow after commit."
    }
  ],
  "completedGates": {
    "M13.1": "Real JJ physical-source admission, native caller frames and independent AI/history authority."
  },
  "contractReview": "LD-REPO-001/002 now register actual native history IPC with main-window/exact-origin admission, native source/cache/identity/generation authority, retained grant revalidation, strict full-width text frames and exact local-history permissions. Repository transitions serialize admit/release/vault closure; database opening shares the guard, and database blockers are checked before closure fences. Drained predecessor retirement cannot invalidate a newer grant. Destruction invalidates pending/current admissions and the plugin drains its reader owner. Existing LD-VAULT-003/LD-DESK-003 database blockers and caller authority remain intact; the new guard closes the database-open/close gap. UI, AI execution and companion publication are not enabled by a repository grant. M13.2 gate wording explicitly includes visible Notes history/diffs already required by M13; this tightens clarity and never completes the first usable milestone from service/hidden-WebView proof.",
  "milestoneReview": "M13.1 completes its original physical-source/native-caller/independent-authority gate using real stock-JJ, native policy, source-preservation and cold hidden WebView evidence. M13 stays In progress; M13.2 becomes In progress for qualified native transport/drain prerequisites and still requires the visible Notes Design Core history/diff UI. M13.3 remains Planned: one raw-event owner and durable AgentStore/ThreadStore conversation/restart acceptance are unimplemented. Existing M10.2, distribution and visual approval gates retain their status.",
  "scope": "Native Notes repository admission/history transport and drained lifetime only. Shared native commands, database opening, source audit and API runner justify full ordinary/e2e Rust, governance and both hidden native API cases. No renderer production implementation or shared presentation changed, so UI/Storybook/release lanes are out of scope for this slice. Concurrent unrelated catalog/terminal edits are preserved and excluded from this evidence/commit. Logs: jj-store/.local/reusable-conversations/notes-history-*."
}
```
