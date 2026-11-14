# CLI installation and scoped desktop access

```json
{
  "id": "E-CLI-001",
  "date": "2026-11-14",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-CLI-001",
    "LD-CLI-002",
    "LD-CLI-003",
    "LD-REL-002",
    "LD-GOV-004"
  ],
  "files": [
    ".github/workflows/ci.yml",
    ".gitignore",
    "catalog/COVERAGE.md",
    "catalog/plugins/cli/Settings.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/cli/fixture.ts",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/check-bundle.mjs",
    "scripts/verify-cli-resource.mjs",
    "scripts/ci-acceptance-artifact.mjs",
    "scripts/ci-sources.json",
    "scripts/prepare-cli.mjs",
    "scripts/release/build-common.mjs",
    "scripts/release/build-linux.mjs",
    "scripts/release/verify-linux.mjs",
    "scripts/source-audit.mjs",
    "spec/src/backlog/distribution.md",
    "spec/src/current/ci.md",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/integration.md",
    "spec/src/current/plugins.md",
    "spec/src/history/E-CLI-001.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification-notes.md",
    "spec/src/verification.md",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/native/cli-settings.ts",
    "src/lib/notes/notes-settings.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/cli/content.rs",
    "src-tauri/src/cli/credential.rs",
    "src-tauri/src/cli/mod.rs",
    "src-tauri/src/host/cli/access.rs",
    "src-tauri/src/host/cli/installation.rs",
    "src-tauri/src/host/cli/mod.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/lib.rs",
    "src-tauri/src/vault/profiles.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/tauri.conf.json",
    "src-tauri/tests/cli_content.rs",
    "src-tauri/tests/cli_credential.rs",
    "tests/governance/cli-preparation.test.mjs",
    "tests/governance/ci-artifacts.test.mjs",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/release-linux.test.mjs"
  ],
  "contractReview": "General Advanced binds the public UI port to two exact main-window commands. Installer authority is confined to the bundled CLI; per-user setup requires shell consent. Optional loopback HTTP reuses existing admitted Core vault clients and starts disabled. Native create-new 0600 export refuses vault paths, existing files and symlinks; bearer values never reach renderer IPC. Close/disable/shutdown revoke and drain grants without bypassing writer guards. The server source pin is retrievable dda488690a3db9567ed90088152baf2e0dbc0daf. Mac build configuration does not qualify native execution.",
  "acceptanceReview": "Initial source installer and real HTTP regression targets were absent. Four native loopback/export cases and four production-adapter catalog cases now pass. Strict normal and e2e Clippy pass against the retrievable Git pin; full native tests pass 264 with two existing ignored. All 757 governance/renderer tests pass after correcting package assertions and packaging fixtures. A stale private profile artifact produced three App type errors; rebuilding the unchanged pinned cdad0cde source restored zero errors/warnings. Full portable lanes are recorded in follow-up evidence. Superseded broad-cohort catalog run was deliberately cancelled after eight passing variant/shard combinations; it does not qualify the final UI-only cohort. Packaging review added an exact regression: the Linux verifier accepted a stale CLI source whose outer inventory matched (one failure before). The shared resource check now rejects source/target/profile/checksum drift on both packaging paths; all five Linux verifier cases and all 759 governance/renderer cases pass. Mac success metadata is emitted only after CLI validation.",
  "runs": [
    {
      "name": "Native loopback and private token export",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test cli_content --test cli_credential",
      "result": "pass",
      "failures": 0,
      "passed": 4
    },
    {
      "name": "Normal and e2e strict native checks",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Full native regression suite",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "passed": 264,
      "ignored": 2
    },
    {
      "name": "Governance and renderer",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 757
    },
    {
      "name": "Final CLI catalog",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/cli/Settings.stories.ts",
      "result": "pass",
      "failures": 0,
      "passed": 4
    },
    {
      "name": "Final types",
      "command": "pnpm exec svelte-check --tsconfig tsconfig.json --fail-on-warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Release CLI resource preparation",
      "command": "pnpm cli:prepare",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "CLI resource source and integrity regression",
      "command": "node --test tests/governance/release-linux.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 5
    },
    {
      "name": "Full governance/renderer after resource integrity checks",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 759
    }
  ],
  "versions": {
    "node": "26.8.2",
    "rust": "1.99.0",
    "pnpm": "10.34.5",
    "uiCandidate": "0.1.10 source candidate pending UI 0.2.0 release",
    "uiSha256": "87b70824eba9a0ab2ba48fea74739bb758de514609ad11ae1246940d07d33159",
    "privateProfileSource": "cdad0cde972f64bc0f20896d493c97268cc97b51",
    "privateProfileSha256": "778c4257d712d58c9c7f823b991a0fc50bac66043bd0be1e0d03357fdd45e70b"
  },
  "remaining": [
    "Full portable check/test/build/catalog/static/spec qualification follows in E-CLI-002.",
    "Ordinary registry adoption requires the UI release containing /cli, then raising both consumers to the released range. Temporary public archives are validation inputs only.",
    "Actual native dialog/installed-bundle qualification on supported platforms, hosted release CI and publication remain separate distribution gates.",
    "Visual review remains pending; no baselines changed."
  ]
}
```
