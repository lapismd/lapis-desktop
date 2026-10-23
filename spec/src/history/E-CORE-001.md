# Shared native vault engine intake

```json
{
  "id": "E-CORE-001",
  "date": "2026-10-23",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.1"],
  "requirements": [
    "LD-GOV-006",
    "LD-VAULT-001",
    "LD-VAULT-002",
    "LD-VAULT-003",
    "LD-VAULT-004",
    "LD-VAULT-005",
    "LD-VAULT-006"
  ],
  "versions": {
    "desktopBaseline": "40a5d97c",
    "notesBaseline": "29f8698d",
    "core": "lapis-app-core 0.1.0; Notes 0e95da98dece"
  },
  "contractReview": "Extract the existing native file engine into Notes-owned core and import its public Rust types directly. Retain physical vault admission, the host IO gate, profiles, resource/OS policy, exact native requests and current public screens. No new job, provider, HTTP or renderer lifetime is enabled.",
  "milestoneReview": "M16.1/R1.1 is complete: direct source-core intake passes original affected native cases, the complete Rust suite, normal/e2e Clippy/build and governance. R1.2/R1.3/R2, M15.1, original providers and distribution retain their gates.",
  "runs": [
    {
      "name": "vault-baseline",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_conditional --test vault_access --test vault_creates --test vault_interruptions --test vault_mutations --test vault_watch --test watch_registry --test vault_identity --test vault_resources --test vault_admission --test plugin_assets",
      "result": "pass",
      "failures": 0,
      "note": "52 pass and one subprocess helper ignored before extraction."
    },
    {
      "name": "first-consumer-imports",
      "command": "same exact eleven native test targets",
      "result": "fail",
      "failures": 2,
      "note": "Two nested test imports still referenced the removed module. Updated callers directly without old-path exports."
    },
    {
      "name": "vault-after",
      "command": "same exact eleven native test targets",
      "result": "pass",
      "failures": 0,
      "note": "52 pass and one helper ignored; file/metadata, crash, link containment, admission, resources, watch and plugin asset assertions retained."
    },
    {
      "name": "broader-import",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "fail",
      "failures": 1,
      "note": "The terminal-policy test had one additional old nested import. Fixed the direct core import and selected that target before retrying the full suite."
    },
    {
      "name": "governance-draft",
      "command": "pnpm spec:check; pnpm check:progress",
      "result": "fail",
      "failures": 3,
      "note": "New record initially lacked the required SUMMARY entry, files and remaining metadata. Added the actual paths, remaining gates and navigation; no validation policy changed."
    },
    {
      "name": "complete-native",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "228 pass, zero fail, two existing ignored helpers; exact repaired terminal_policy also passes 2 cases."
    },
    {
      "name": "normal-and-e2e-native",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets [--features e2e] --locked -- -D warnings; cargo build --manifest-path src-tauri/Cargo.toml [--features e2e] --locked",
      "result": "pass",
      "failures": 0,
      "note": "Both configurations pass strict Clippy and compile. The baseline linker unwind-size warning remains; no suppression added."
    },
    {
      "name": "document-limits",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 5,
      "note": "Expanded context confirmations exceeded five existing chapter budgets. Shortened the confirmations to E-CORE-001 references; preserved original contracts and limits. A first shortening still exceeded four physical-line budgets before the final compact references."
    },
    {
      "name": "consumer-governance",
      "command": "pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Source/App audits, progress (44 tasks/266 records), Rust formatting, canonical validation, mdBook and spec-first pass. No TypeScript runtime or screens changed; broad UI/Storybook qualification retains M15.1."
    },
    {
      "name": "scoped-gate-metadata",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 2,
      "note": "The completed extraction record initially listed later project milestones as its remaining gate gaps. Kept those follow-ups explicit in milestoneReview and prose, and scoped remaining to this record\u2019s original M16.1 gate."
    },
    {
      "name": "original-gate-receipt",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "Added the required exact completedGates receipt after the original M16.1 gate passed. The gate text and its required native checks were unchanged."
    }
  ],
  "files": [
    "AGENTS.md",
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-CORE-001.md",
    "spec/src/history/index.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/src/ai/user_commands.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/vault/files.rs",
    "src-tauri/src/plugins/assets.rs",
    "src-tauri/src/terminal/policy.rs",
    "src-tauri/src/vault/action_targets.rs",
    "src-tauri/src/vault/admission.rs",
    "src-tauri/src/vault/conditional.rs",
    "src-tauri/src/vault/creates.rs",
    "src-tauri/src/vault/files.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/mutations.rs",
    "src-tauri/src/vault/profiles.rs",
    "src-tauri/src/vault/staged.rs",
    "src-tauri/src/vault/system_actions/macos.rs",
    "src-tauri/src/vault/system_actions/mod.rs",
    "src-tauri/src/vault/writes.rs",
    "src-tauri/src/watch/mod.rs",
    "src-tauri/src/watch/registry.rs",
    "src-tauri/src/watch/snapshot.rs",
    "src-tauri/tests/macos_system_actions.rs",
    "src-tauri/tests/system_action_targets.rs",
    "src-tauri/tests/terminal_policy.rs",
    "src-tauri/tests/vault_access.rs",
    "src-tauri/tests/vault_conditional.rs",
    "src-tauri/tests/vault_creates.rs",
    "src-tauri/tests/vault_interruptions.rs",
    "src-tauri/tests/vault_mutations.rs",
    "src-tauri/tests/vault_watch.rs",
    "src-tauri/tests/watch_registry.rs"
  ],
  "remaining": [],
  "completedGates": {
    "M16.1": "Desktop directly consumes the extracted Notes-owned vault engine; original native file/admission/watch/resource regressions and normal/e2e native configurations pass, with no duplicate engine or old-path exports."
  }
}
```

Seven implementation modules move upstream; none remain as copied engines or
compatibility exports. The shared core is transport-independent and retains
caller-owned mutation serialization. Native witnesses/accessors never enter
Tauri frame types. Source and consumer qualification remain separate.

Out-of-scope follow-ups remain open: R1.2/R1.3/R2, M15.1, original
provider/model, distribution and visual gates. They are not M16.1 gate gaps.
