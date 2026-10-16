# E-SESSION-002: complete native Notes qualification

The original M3 gate passes against committed source-owned archives. Earlier
failures and repairs remain in E-SESSION-001 and the owning source records.

```json
{
  "id": "E-SESSION-002",
  "tasks": ["M3"],
  "requirements": [
    "LD-MIG-002",
    "LD-GOV-006",
    "LD-DESK-005",
    "LD-VAULT-003",
    "LD-DB-001",
    "LD-DB-002",
    "LD-DB-003",
    "LD-DB-004",
    "LD-SESSION-001",
    "LD-SESSION-002"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "turso": "0.7.2",
    "svelte": "5.56.10",
    "designCore": "0.4.0",
    "webview": "WebKit 605.1.15",
    "target": "aarch64-apple-darwin"
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
    "spec/src/current/verification.md",
    "spec/src/history/E-SESSION-001.md",
    "spec/src/history/E-SESSION-002.md",
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
  "sourceEvidence": [
    {
      "repository": "lapis-notes",
      "revision": "5ef0a6331c1b846b70357f990d919977a561112c",
      "record": "spec/records/2026-10-16-native-mira-intake.md",
      "unit": 1557,
      "storybook": 249,
      "webAndServer": 12,
      "legacyPackagedModes": 2
    },
    {
      "repository": "mira-mde",
      "revision": "b422c110b0b1e1de898b65a5647cbe0ae0eceb12",
      "implementation": "d4a2e60bdf91ea2c49a1ae5c5c61a6d8ec227b64",
      "record": "spec/records/2026-10-16-native-gutter-accessibility.md",
      "correction": "spec/records/2026-10-16-native-toolchain-correction.md",
      "pnpm": "10.32.1",
      "unit": 430,
      "storybook": 158,
      "browser": 50
    },
    {
      "repository": "lapis-plugins",
      "revision": "3664313883a10b5bfdfca8898c820c8b4d2e4db4",
      "record": "spec/records/2026-10-16-native-markdown-intake.md",
      "unit": 786,
      "storybook": 235,
      "releaseToolTests": 119,
      "npmArchives": 12,
      "payloadSha256": "6aeab38947a792cc68bccb4110fa281584f7f65616ec2f5124973b66076655f9"
    }
  ],
  "cohort": [
    {
      "name": "@lapis-notes/ui",
      "version": "0.1.3",
      "sha256": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
      "revision": "5ef0a6331c1b846b70357f990d919977a561112c"
    },
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "0a694c713920e7c3abb2c25feeb7c5b2bb32c1eb203231682ba4bc7910b12838",
      "revision": "5ef0a6331c1b846b70357f990d919977a561112c"
    },
    {
      "name": "@lapis-notes/language-service",
      "version": "0.1.1",
      "sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
      "revision": "5ef0a6331c1b846b70357f990d919977a561112c"
    },
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.1.2",
      "sha256": "79d46a57325cfa601633c776bc128759020b962426c7f43ff35f67370c77e470",
      "revision": "5ef0a6331c1b846b70357f990d919977a561112c"
    },
    {
      "name": "@lapis-notes/workspace",
      "version": "0.2.1",
      "sha256": "7e968a3173149c547e1195ea48b9a82ba9b396eae4b18166c53c009681453cc7",
      "revision": "5ef0a6331c1b846b70357f990d919977a561112c"
    },
    {
      "name": "@lapismd/mira",
      "version": "0.0.5",
      "sha256": "2319ccb6279bb6bd6032046e0a22080e8527050b7c90e2e773735bb3e4d54f2e",
      "revision": "b422c110b0b1e1de898b65a5647cbe0ae0eceb12"
    },
    {
      "name": "@lapismd/mira-editor",
      "version": "0.0.2",
      "sha256": "850272c678a8e2e5106290189190eade8edab19be444235053f0945eb8ec41c3",
      "revision": "b422c110b0b1e1de898b65a5647cbe0ae0eceb12"
    },
    {
      "name": "@lapismd/mira-plugin-ai",
      "version": "0.0.2",
      "sha256": "efe9d5b774a0545e3119818e58987a34e6efdd488c45018c6418214740118823",
      "revision": "b422c110b0b1e1de898b65a5647cbe0ae0eceb12"
    },
    {
      "name": "@lapismd/mira-plugin-mermaid",
      "version": "0.0.2",
      "sha256": "0a8e215a3212d3e5075688a07b5da96e5a4ef01fa5fe2937c145da7882bf868e",
      "revision": "b422c110b0b1e1de898b65a5647cbe0ae0eceb12"
    },
    {
      "name": "@lapis-notes/markdown",
      "version": "0.1.6",
      "sha256": "51de62aa1477dfb75a27aff747d7b33b5b18eef5744308d334259e29145df687",
      "revision": "3664313883a10b5bfdfca8898c820c8b4d2e4db4"
    }
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M3": "In the actual WebView, open a seeded vault, edit a note, verify disk content, display a local attachment, close the database, and reopen successfully. Database rollback and restart tests pass."
  },
  "runs": [
    {
      "name": "full-desktop-check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Specification and source/App audits, zero-error/warning Svelte diagnostics, strict Clippy, Prettier and rustfmt pass. Initial formatting failures and their repair remain in E-SESSION-001."
    },
    {
      "name": "native-transport-and-filesystem",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "node": 26,
        "rust": 21
      },
      "note": "Two Rust helper entrypoints are intentionally ignored and invoked by their parent interruption/restart tests. Rollback, restart, atomic replacement and containment pass."
    },
    {
      "name": "final-source-cohort-consumer",
      "command": "pnpm local:install && node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs && pnpm check:types",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 10,
        "node": 26
      },
      "note": "Installed verified public archives, portable tracked dependency files preserved; peers remain ranges. No source aliases, package patches or consumer styling overrides."
    },
    {
      "name": "final-actual-webview-and-cold-processes",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "webview": 24,
        "coldLifecycle": 2
      },
      "note": "5 shell, 9 vault, 3 database and 7 Notes cases pass in real WebViews. Notes covers .lapis initialization, Explorer, real editor entry, exact UTF-8 disk save, local Unicode PNG, editing/reading axe, database release and reopen. Two isolated cold native processes close and restore geometry without Node/Deno on their PATH."
    },
    {
      "name": "ordinary-arm64-bundle",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "bundleMiB": 107.85,
        "rendererJavaScriptFiles": 216,
        "automationMarkers": 0
      },
      "note": "ARM64 preview bundle passes identity and contents checks. No bundled Node or Deno runtime; automation plugins, permissions and frontend markers are excluded. Signing/notarization remains deferred."
    },
    {
      "name": "committed-source-repack",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --mira ../mira-mde-desktop-migration --plugins ../lapis-plugins-desktop-migration --already-built",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 10
      },
      "note": "Every source is committed and clean. Repacked identities/checksums match all ten archives in the actual installed native-qualification receipt byte for byte. Only source bookkeeping/revision metadata changed after native qualification; the packaged implementation and dependency graph are identical."
    },
    {
      "name": "committed-plugin-payload",
      "command": "pnpm plugin:build --plugin markdown && pnpm plugin:verify",
      "result": "pass",
      "failures": 0,
      "note": "Run from the clean lapis-plugins migration workspace after its commit. Deterministic payload and checksum verification pass; no package or release asset was published."
    },
    {
      "name": "installed-to-committed-cohort-equality",
      "command": "node --input-type=module -e 'import assert from \"node:assert/strict\"; import {readFileSync} from \"node:fs\"; import {readArchiveManifest} from \"./scripts/local-archives.mjs\"; const installed=JSON.parse(readFileSync(\".local/archives/installed.json\",\"utf8\")).packages; const packed=readArchiveManifest(\".local/archives/manifest.json\"); assert.equal(packed.length,10); for(const entry of packed) assert.equal(installed.find(p=>p.name===entry.name)?.sha256,entry.sha256);'",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 10
      },
      "note": "Reproducible equality check against the actual installer receipt after repacking clean committed sources. All archive bytes used for native and bundle qualification match the committed-source cohort."
    }
  ],
  "contractReview": "One explicitly owned App per admitted session, public NativeDesktopVaultAdapter and WorkspaceShell, three public core plugins, direct in-process native Turso and the shared application-wide .lapis default. Compatibility ownership spans normal boot and teardown; JSON errors preserve codes, nested listings return child names, and source-owned Markdown/Mira repairs are consumed as verified archives.",
  "milestoneReview": "M3 passes its original combined actual-WebView and native database gate. E-DB-001 retains the separately qualified database component; E-SESSION-001 preserves intake failures and targeted repairs. M4 remains Planned: safe close/quit/reload/switch, vault/layout restoration and external-edit/dirty-buffer protection must pass before everyday-use qualification. Signing, publication and advanced services remain deferred."
}
```
