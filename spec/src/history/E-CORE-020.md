# Immutable native turn launch profiles

```json
{
  "id": "E-CORE-020",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M10.2"],
  "requirements": ["LD-GOV-006", "LD-AI-001", "LD-AI-002"],
  "versions": {
    "desktopBaseline": "6c9e55f7",
    "notesCore": "4650a10c",
    "lapisAI": "6548afe0",
    "rust": "1.99.0"
  },
  "contractReview": "Native turn policy prepares an immutable per-vault profile and environment with the existing verified helper implementation. Core resolves only an admitted physical scope and opaque vault identity; it never acquires NativeHost or retains the mutable legacy prepared-vault slot. No new execution owner is selected by this source checkpoint.",
  "milestoneReview": "M10.2 and Notes R2.2.3 remain Working. This source preparation does not qualify typed Tauri selection, existing-screen observer adoption, native provider/detach/cold-application acceptance or deferred AgentStore/ThreadStore.",
  "runs": [
    {
      "name": "snapshot-before",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop prepared_vault_snapshot_survives_another_vault_refresh_without_fallback",
      "result": "fail",
      "failures": 1,
      "note": "Exact regression cannot compile: E0599, FileProfile has no owned snapshot API. This is recorded before implementing the snapshot. The inactive dependency graph recompiles without opening app windows."
    },
    {
      "name": "snapshot-after",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop prepared_vault_snapshot_survives_another_vault_refresh_without_fallback",
      "result": "pass",
      "failures": 0,
      "note": "The identical target passes one case (0.07s); its initial missing-method failure moves to zero. Retained vault one and subsequently prepared vault two use the same profile ID with different model environments; the retained launch stays exact and unknown targets refuse."
    },
    {
      "name": "native-ai-family",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 RUST_TEST_THREADS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop host::ai",
      "result": "pass",
      "failures": 0,
      "note": "All 30 affected native AI cases pass (0.38s), including the new Core policy without a NativeHost lock, current admission/retained generations and all verified profile variants."
    },
    {
      "name": "spec-initial",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "note": "The first documentary checkpoint has a 402-line AI chapter and invalid partial evidence result. Keep its profile cross-reference on one line and use the existing pending result while wider checks run; no governance rule changes."
    },
    {
      "name": "core-policy",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop core_policy_resolves_only_native_configuration_without_window_host_lock",
      "result": "pass",
      "failures": 0,
      "note": "The exact Core policy case passes without a NativeHost/window lock; only configured targets and admitted physical scope can resolve launches. (40.92s)."
    },
    {
      "name": "native-test",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "All 237 native cases pass. The two retained ignored entries are subprocess helpers invoked by their parent tests; no new case is skipped. (233.40s)."
    },
    {
      "name": "rust-strict",
      "command": "pnpm check:rust",
      "result": "pass",
      "failures": 0,
      "note": "All-target normal Clippy passes with warnings denied. (120.45s)."
    },
    {
      "name": "rust-strict-e2e",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "All-target e2e Clippy passes with warnings denied. (95.38s)."
    },
    {
      "name": "native-build",
      "command": "cargo build --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop",
      "result": "pass",
      "failures": 0,
      "note": "Normal binary builds. The existing nonfatal macOS linker unwind-table advisory remains; no source warning is suppressed. (31.22s)."
    },
    {
      "name": "native-build-e2e",
      "command": "cargo build --manifest-path src-tauri/Cargo.toml --locked --features e2e --bin lapis-desktop",
      "result": "pass",
      "failures": 0,
      "note": "The e2e binary builds separately, retaining the same existing nonfatal linker advisory. No application is launched. (248.23s)."
    },
    {
      "name": "architecture",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "note": "Source boundaries pass. (1.53s)."
    },
    {
      "name": "app-ownership",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Explicit App ownership passes. (1.30s)."
    },
    {
      "name": "types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Svelte/type checks pass with zero errors and warnings. (13.24s)."
    },
    {
      "name": "renderer-build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "The unchanged renderer builds; its existing large-chunk advisory remains. (45.85s)."
    },
    {
      "name": "renderer-governance-tests",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 416 cases pass (26.16s); no skip."
    },
    {
      "name": "ai-tests",
      "command": "pnpm test:ai",
      "result": "pass",
      "failures": 0,
      "note": "All 151 files / 744 AI cases pass (74.79s)."
    },
    {
      "name": "spec-mapped-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Validate, Rust formatting and mdBook pass; spec-first requires confirmation in the mapped desktop and migration chapters. Add that source-versus-adoption contract without changing a gate or validator."
    },
    {
      "name": "format-before",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 3,
      "note": "The generated migration summary and this new receipt need formatting; normalize those owned outputs. The third finding is the previously accepted immutable E-AI-109 historical record, byte-identical to the committed parent. No historical evidence is edited."
    },
    {
      "name": "owned-format",
      "command": "pnpm exec prettier --check MIGRATION.md spec/src/current/ai.md spec/src/current/ai-adapter.md spec/src/current/verification.md spec/src/current/progress/milestones.md spec/src/history/index.md spec/src/SUMMARY.md spec/src/history/E-CORE-020.md",
      "result": "pass",
      "failures": 0,
      "note": "All owned Markdown and generated output pass. The canonical progress comparison tolerates Markdown formatting and retains every group/status/link."
    },
    {
      "name": "spec-corrected",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four lanes pass: validation, Rust formatting, mdBook and spec-first. The two mapped-chapter findings move to zero after recording the unchanged selection boundary."
    },
    {
      "name": "format-corrected",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 1,
      "note": "Only the previously accepted immutable E-AI-109 historical formatting finding remains. Its SHA-256 is 16e50704e76ed720fdf280a28167714c23079fd13facd803580ca0aced74e93a and it is byte-identical to the parent. All owned output passes its focused formatter; no historical evidence or formatter is modified."
    },
    {
      "name": "progress-final",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "All 51 task rows and 290 evidence records pass. M10.2 remains In progress; this source checkpoint does not close R2.2.3 or R2.3."
    }
  ],
  "files": [
    "src-tauri/src/host/ai/file_profile.rs",
    "src-tauri/src/host/ai/file_profile/prepared.rs",
    "src-tauri/src/host/ai/file_profile/agent_tests.rs",
    "src-tauri/src/host/ai/policy.rs",
    "src-tauri/src/host/ai/policy/native_turns.rs",
    "spec/src/current/ai.md",
    "spec/src/current/ai-adapter.md",
    "spec/src/current/verification.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-CORE-020.md",
    "MIGRATION.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md"
  ],
  "remaining": [
    "Tauri runtime and typed native turn IPC are not selected yet (Notes R2.2.3).",
    "Both existing Agent screens still need the observer-only native-writer adapter (Notes R2.2.3).",
    "Actual provider/detach/cold-application acceptance remains Notes R2.3; this source checkpoint cannot complete M10.2."
  ]
}
```

All implementation checks above are headless. This change shares the existing
launch implementation between legacy ACP and Core policy, with no copied engine,
renderer writer, provider request or application launch. Native/JS dependencies
retain their existing selected source and archive revisions. Lapis AI stays
clean and unchanged at `6548afe0`.

Under standing cache approval, qualification removes only inactive compiler
metadata and superseded library variants after checking Cargo ownership, open
files and exact identities: 1,558 Core cache files (1.56 GiB), then 435 older
Desktop variants (1.25 GiB). Current libraries, executables, bundles, vaults,
profiles and models remain preserved. These resource operations change no
source.

Final source qualification is complete. This record remains pending for the
listed original application/provider gates; its passing source results cannot
select the new native writer or complete the M10.2 product gate. The final
change is documentary, validated again before committing.
