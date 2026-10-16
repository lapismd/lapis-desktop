# E-SESSION-001: public Notes workspace on native storage

M3 Notes integration follows the qualified native database component.

```json
{
  "id": "E-SESSION-001",
  "tasks": ["M3"],
  "requirements": [
    "LD-MIG-002",
    "LD-GOV-006",
    "LD-DESK-005",
    "LD-VAULT-003",
    "LD-SESSION-001",
    "LD-SESSION-002"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "target": "aarch64-apple-darwin",
    "notesSource": "1e6458922b486c07f36a5bc7d85d020b5805cd49",
    "markdown": "0.1.6",
    "sourceEditor": "0.1.2"
  },
  "files": [
    "MIGRATION.md",
    "README.md",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/local-archives.mjs",
    "scripts/native-acceptance-binary.mjs",
    "scripts/pack-local-core.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-SESSION-001.md",
    "spec/src/history/index.md",
    "src-tauri/src/vault/files.rs",
    "src-tauri/tests/vault_access.rs",
    "src/NotesWorkspace.svelte",
    "src/Shell.svelte",
    "src/VaultLauncher.svelte",
    "src/main.ts",
    "src/native-connection.ts",
    "src/native-error.ts",
    "src/notes-plugins.ts",
    "src/notes-session.ts",
    "src/notes-workspace.css",
    "src/vault-client.ts",
    "tests/desktop/native-session.mjs",
    "tests/desktop/notes.spec.mjs",
    "tests/desktop/wdio.conf.mjs",
    "tests/governance/local-archives.test.mjs",
    "tests/renderer/vault-client.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "notes-workspace-before",
      "command": "pnpm exec tauri build --debug --no-bundle --features e2e --config src-tauri/tauri.e2e.conf.json; node .local/m3-notes-target.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0,
        "failed": 1
      },
      "note": "The launcher had no Open notes action and no mounted App/workspace."
    },
    {
      "name": "initial-notes-workspace-root",
      "command": "node .local/m3-notes-target.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1,
        "failed": 0
      },
      "note": "Only the initial mounted WorkspaceShell root; this is not the editing gate."
    },
    {
      "name": "expanded-notes-before-error-translation",
      "command": "node .local/m3-notes-target.mjs",
      "result": "fail",
      "failures": 6,
      "counts": {
        "passed": 0,
        "failed": 6
      },
      "note": "Configuration defaults were absent, Explorer and editor were unavailable, attachment and reopen could not pass, and axe found one list violation in the empty shell. The optional plugins reported native failures as [object Object]."
    },
    {
      "name": "notes-explorer-diagnostic-target",
      "command": "node .local/m3-notes-target.mjs --mochaOpts.grep 'mounts|opens a real'",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 1,
        "failed": 1
      },
      "note": "Repeated with UI/Problems diagnostics, then frontend logging. Three diagnostic runs each had 1 pass / 1 failure. Both Source Editor and Explorer failed configuration initialization; plugin discovery also failed."
    },
    {
      "name": "structured-native-errors-before",
      "command": "node --test --test-name-pattern='structured native failures' tests/renderer/vault-client.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0,
        "failed": 1
      }
    },
    {
      "name": "structured-native-errors-after",
      "command": "node --test --test-name-pattern='structured native failures' tests/renderer/vault-client.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1,
        "failed": 0
      },
      "note": "Normalize Tauri JSON rejections at the desktop transport boundary, preserving Error identity, code and message. The shared adapter already understands Error codes. Lost EEXIST had prevented nested plugin-folder creation and configuration persistence."
    },
    {
      "name": "nested-listing-before",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_access directory_listings_return_child_names_at_every_depth",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0,
        "failed": 1
      },
      "note": "Nested listings returned vault-relative paths and duplicated directory prefixes in the shared adapter."
    },
    {
      "name": "nested-listing-after",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test vault_access directory_listings_return_child_names_at_every_depth",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1,
        "failed": 0
      },
      "note": "Return immediate child names relative to each requested directory."
    },
    {
      "name": "native-notes-before-library-repairs",
      "command": "node .local/m3-notes-target.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 5,
        "failed": 2
      },
      "note": "Real editing and exact native disk save passed. Editing axe rejected hidden Mira gutter buttons; the Unicode attachment failed lookup. Source fixes belong to Mira and Markdown."
    },
    {
      "name": "archive-hook-repeat-before",
      "command": "node --test --test-name-pattern='idempotent only' tests/governance/local-archives.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0,
        "failed": 1
      },
      "note": "PNPM invoked readPackage again and the hook rejected its own verified file redirect as a semver range."
    },
    {
      "name": "archive-hook-repeat-after",
      "command": "node --test --test-name-pattern='idempotent only' tests/governance/local-archives.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1,
        "failed": 0
      },
      "note": "Permit only the exact verified redirect outside peerDependencies; arbitrary file paths and file peers still reject."
    },
    {
      "name": "ordinary-binary-refusal",
      "command": "node --input-type=module -e 'import {acceptanceBinary} from \"./scripts/native-acceptance-binary.mjs\"; try { acceptanceBinary(\"src-tauri/target/debug/lapis-desktop\"); process.exit(1); } catch(error) { if(!error.message.includes(\"Refusing a normal native build\")) throw error; console.log(error.message); }'",
      "result": "pass",
      "failures": 0,
      "counts": {
        "checks": 1
      },
      "note": "The launcher rejects the actual ordinary executable before spawning. Earlier, one diagnostic attempt used an ordinary Cargo artifact; it was stopped before vault selection. Its ordinary profile may have read recents and persisted geometry. Subsequent automation verifies both isolation/driver markers."
    },
    {
      "name": "complete-node-and-rust",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 47,
        "failed": 0
      },
      "note": "26 Node and 21 Rust cases pass; two Rust subprocess helpers remain explicitly ignored in the parent harness and are invoked by their interruption/restart tests."
    },
    {
      "name": "full-cohort-pack-before",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --mira ../mira-mde-desktop-migration --plugins ../lapis-plugins-desktop-migration --already-built",
      "result": "fail",
      "failures": 1,
      "note": "The tracked core-only pack command rejected the Mira/plugin options before packing. The complete editor cohort depended on an ignored one-off helper."
    },
    {
      "name": "full-cohort-pack-after",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --mira ../mira-mde-desktop-migration --plugins ../lapis-plugins-desktop-migration --already-built",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 10
      },
      "note": "Tracked CLI now packs the actual five core, four Mira and one Markdown public outputs, verifies source-owned identities and snapshots, and records checksums. No packages published."
    },
    {
      "name": "preliminary-seven-native-notes",
      "command": "node .local/m3-notes-target.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 7,
        "failed": 0
      },
      "note": "Original Notes disk-save, Unicode image, editing/reading axe and database reopen gate passes. Later broad source acceptance additionally repaired Markdown-versus-asset preview selection; final cohort and native qualification are recorded separately."
    },
    {
      "name": "preliminary-complete-native",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "webview": 24,
        "coldLifecycle": 2,
        "failed": 0
      },
      "note": "Actual WebViews and isolated cold processes pass without Deno on PATH; final source cohort qualification follows the last Markdown repair."
    },
    {
      "name": "initial-session-format",
      "command": "pnpm check",
      "result": "fail",
      "failures": 2,
      "note": "Type checking and Clippy pass; formatting reports only generated MIGRATION.md and the draft evidence. Prettier repairs both documents."
    },
    {
      "name": "session-format-after",
      "command": "pnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Prettier and rustfmt pass after formatting the generated tracker and evidence."
    }
  ],
  "contractReview": "Use an explicitly owned App, public plugins and WorkspaceShell over the admitted NativeDesktopVaultAdapter and direct native provider. The compatibility lease spans complete owned teardown. No private profile import or memory/runtime fallback.",
  "milestoneReview": "M3 intake regressions and targeted repairs are qualified here. E-SESSION-002 records the original combined native Notes gate, committed source cohort and ordinary bundle. This record does not promote M4 everyday-use qualification."
}
```
