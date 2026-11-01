# Native watcher shutdown cancellation

```json
{
  "id": "E-RELEASE-003",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-FILE-002", "LD-REL-002"],
  "files": [
    "src-tauri/src/watch/mod.rs",
    "src-tauri/src/watch/tests.rs",
    "spec/src/current/files.md",
    "spec/src/current/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Session closure must join and retire every native watcher. Cancellation remains durable when debounce drains the wake queue and an unchanged snapshot skips delivery. Preserve bounded changes, callback ownership, IO serialization and all existing release gates.",
  "acceptanceReview": "Reproduce the exact hosted registry capacity/closure test, exercise cancellation while unchanged debounce is active, then run both native watch families and required normal/e2e source checks. No test deadline is extended and no new quarantine is added. Final-head hosted native acceptance remains required.",
  "runs": [
    {
      "name": "Hosted Unit tests at 885268ad hang in registry_bounds_subscriptions_and_releases_capacity_after_close from 12:15:20 UTC until job timeout at 12:41:27 UTC; the other registry test passes. Original run 41303987128, job 124840793649 retained.",
      "command": "node scripts/run-turbo.mjs ci:unit --summarize --log-order=stream",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Separate hosted Quality preparation fails because static.crates.io DNS cannot resolve anstream/1.0.0; no Quality checks execute. Job 124840793714 retained for infrastructure retry.",
      "command": "pnpm ai:prepare -- --reuse",
      "result": "fail",
      "failures": 0
    },
    {
      "name": "Initial isolated local build could not find resources/lapis-ai; no tests ran. The existing pinned 0.2.0 bundle was subsequently staged through the source verifier without rebuilding or using developer profiles.",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test watch_registry registry_bounds_subscriptions_and_releases_capacity_after_close -- --exact --nocapture",
      "result": "fail",
      "failures": 0
    },
    {
      "name": "Original registry capacity/close target passes locally once, confirming the hosted failure is intermittent.",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test watch_registry registry_bounds_subscriptions_and_releases_capacity_after_close -- --exact --nocapture",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Focused unchanged-debounce cancellation regression fails once before the fix: shutdown lost its wake; bounded failure in 1.10s.",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --lib watch::tests::close_during_unchanged_debounce_retires_the_worker_without_another_event -- --exact --nocapture",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Same focused cancellation regression passes after the fix, including eight new watcher lifetimes; 1 pass in 0.49s.",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --lib watch::tests::close_during_unchanged_debounce_retires_the_worker_without_another_event -- --exact --nocapture",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Both complete native watch families pass: six vault-watch tests plus two registry tests, zero ignored.",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test watch_registry --test vault_watch",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Strict normal Rust Clippy all-target check passes.",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete governance suite: 226 passed, zero failures or skips.",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Strict e2e-feature Rust Clippy all-target check passes.",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Evidence validation passes for 385 records, including both new release records.",
      "command": "node scripts/evidence.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Full Prettier and Rust formatting pass after shortening the AI chapter to its existing 400-line limit.",
      "command": "pnpm exec prettier --check . && cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Initial Docker specification run stops before checks because the default eight CPUs exceed the daemon allocation of five. Retried through ignored resource configuration at four CPUs, 12 GiB memory; no host fallback.",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 0
    },
    {
      "name": "Four-CPU Docker retry stops during frozen installation because the private app-profile and AI inputs were not supplied. Retried with the existing checksummed CI package archives through the documented ignored prerequisite inventory. Source manifests and tracked lock remain portable.",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 0
    },
    {
      "name": "Archive-equipped Docker validation finds the Desktop chapter 39 bytes above its existing 32768-byte limit after the quarantine note. Condensed its existing overview without dropping contracts or raising the limit, then reran all specification lanes.",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Final Docker specification check passes all four lanes: validation, Rust format, mdBook and spec-first, using verified private archives at four CPUs and 12 GiB.",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "rust": "1.99.0",
    "notify": "8.2.0",
    "source": "885268aded6fd2f329d04b5bd2d4479768aa8275",
    "watchFamilyPasses": 8
  },
  "remaining": [
    "Final-head hosted full Rust tests and enabled native acceptance remain required.",
    "Real release candidate installation and protected publication remain required."
  ]
}
```
