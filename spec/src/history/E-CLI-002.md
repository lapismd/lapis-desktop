# Final CLI source and consumer qualification

```json
{
  "id": "E-CLI-002",
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
    "scripts/ci-acceptance-artifact.mjs",
    "scripts/ci-sources.json",
    "scripts/prepare-cli.mjs",
    "scripts/release/build-common.mjs",
    "scripts/release/build-linux.mjs",
    "scripts/release/verify-linux.mjs",
    "scripts/source-audit.mjs",
    "scripts/verify-cli-resource.mjs",
    "spec/src/backlog/distribution.md",
    "spec/src/current/ci.md",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/integration.md",
    "spec/src/current/plugins.md",
    "spec/src/history/E-CLI-001.md",
    "spec/src/history/E-CLI-002.md",
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
    "tests/governance/ci-artifacts.test.mjs",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/cli-preparation.test.mjs",
    "tests/governance/release-linux.test.mjs"
  ],
  "contractReview": "E-CLI-001 retains the implementation contract. Final CLI/Core source is retrievable commit 3b121d21bb32ca81da84cf750661509f097a7b43. Core, Protocol and content HTTP source trees are byte-identical to the earlier dda48869 qualification; the final source change fixes CLI shell-cleanup lease ownership. Desktop builds that CLI from the same pin. Cargo output is isolated by source revision and the buildSchema marker fences older preparation metadata. Resource checks require the pin, target, release profile, executable mode and actual SHA-256 before recording bundle success. General Advanced uses the UI public port on the owned controller, without changing the host App API cohort.",
  "acceptanceReview": "The exact CLI-cache regression initially staged revision A while recording revision B: one unit failure and a real bundled PATH-only cleanup incorrectly succeeding under a held lease. Revision-specific output plus buildSchema 1 fixes staging; the actual desktop-built resource now installs, executes, refuses the held lease, preserves shell bytes and removes its own entries after release. Its SHA-256 is 2a33375e5b2c665fd269558bdcd4a3e1b45a19ac65219a9b8659b64cdc14cf8e. The Linux verifier stale-source regression had one failure before repair; all six preparation/resource tests pass. The old portable root image failed one permission test when its setuid child was denied after dropping capabilities. Adopted main eca0a36f supplies dedicated unprivileged workers; the original exact test now passes with actual DAC assertions, then the complete native suite passes. One desktop-dark One Authored Message interaction failed in an earlier full attempt; its exact target passes all four variants, followed by every full shard/variant passing without assertion or timing changes. All failed attempts remain in local qualification logs and copied catalog receipts. Portable renderer build and static catalog pass. Final local-only diagnostics never replaced the installed application; no macOS runtime acceptance or publication was invoked.",
  "runs": [
    {
      "name": "Final portable check",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Exact original permission regression",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm test:rust -- --test vault_access permission_failures_preserve_notes_and_existing_modes -- --exact",
      "result": "pass",
      "failures": 0,
      "passed": 1
    },
    {
      "name": "Final portable tests",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm test",
      "result": "pass",
      "failures": 0,
      "governanceRendererPassed": 763,
      "aiPassed": 746,
      "rustPassed": 264,
      "rustExistingIgnored": 2
    },
    {
      "name": "All catalog shards and display variants",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=/home/steve/Projects/lapis-desktop/.local/cli-ui-validation-archives.json pnpm test:storybook -- --shard=N/4 (N=1,2,3,4 in isolated jj workspaces)",
      "result": "pass",
      "failures": 0,
      "passed": 2152,
      "files": 115,
      "variants": 4
    },
    {
      "name": "Source cache and bundle identity regressions",
      "command": "node --test tests/governance/cli-preparation.test.mjs tests/governance/release-linux.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 6
    },
    {
      "name": "Actual native Linux application build",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm exec tauri build --debug --no-bundle --ci",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Actual desktop resource identity and lifecycle",
      "command": "node --input-type=module -e 'import {verifyCliResource} from \"./scripts/verify-cli-resource.mjs\"; verifyCliResource(\"src-tauri/target/debug/lapis-cli\", \"x86_64-unknown-linux-gnu\")' && python3 .local/cli-built-resource-final.py",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Verified resource reuse",
      "command": "pnpm cli:prepare -- --reuse",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Portable renderer build",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Portable static catalog",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm build-storybook",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Final portable specification and source audit",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "portableNode": "24.15.0",
    "localDiagnosticNode": "26.8.2",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "jj": "0.45.1",
    "mainBase": "eca0a36fec2160baf78020443efc5275bdad2137",
    "cliSource": "3b121d21bb32ca81da84cf750661509f097a7b43",
    "uiSource": "5d24ddc3d0d023f6af3957268818dd75283204f7",
    "uiArchiveSha256": "87b70824eba9a0ab2ba48fea74739bb758de514609ad11ae1246940d07d33159",
    "privateProfileSource": "cdad0cde972f64bc0f20896d493c97268cc97b51",
    "privateProfileSha256": "778c4257d712d58c9c7f823b991a0fc50bac66043bd0be1e0d03357fdd45e70b",
    "specValidator": "0.2.0"
  },
  "remaining": [
    "UI 0.2.0 publication and consumer range adoption gate ordinary registry-only builds. Temporary archive inputs are explicitly documented validation prerequisites.",
    "Actual native credential-dialog/installed ordinary-bundle qualification on macOS ARM64 and Linux ARM64/x64, hosted release CI and publication remain separate distribution gates. The local Linux no-bundle build is not all-platform release qualification.",
    "Visual review remains pending; no baselines changed. No installed user application was replaced."
  ]
}
```
