# Final portable plugin qualification

```json
{
  "id": "E-PORTABLE-002",
  "tasks": ["M8", "M8.3"],
  "requirements": ["LD-MIG-002", "LD-PLUG-003", "LD-PLUG-004"],
  "revision": "enclosing-change",
  "files": [
    "MIGRATION.md",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/check-bundle.mjs",
    "scripts/desktop-acceptance.mjs",
    "scripts/plugin-host-modules.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/windows.md",
    "spec/src/history/E-PORTABLE-001.md",
    "spec/src/history/E-PORTABLE-002.md",
    "spec/src/history/index.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/src/lib.rs",
    "src-tauri/src/plugin_assets.rs",
    "src-tauri/src/window.rs",
    "src-tauri/tauri.conf.json",
    "src-tauri/tests/plugin_assets.rs",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/native/plugin-assets.ts",
    "src/lib/notes/notes-startup.ts",
    "src/lib/notes/plugin-policy.ts",
    "tests/desktop/entry.ts",
    "tests/desktop/plugin-assets.test.mjs",
    "tests/desktop/plugin-entry.ts",
    "tests/desktop/portable-database.test.mjs",
    "tests/desktop/portable-fixtures.mjs",
    "tests/desktop/portable-plugins.test.mjs",
    "tests/desktop/portable-workers.test.mjs",
    "tests/renderer/notes-startup.test.mjs",
    "tests/renderer/plugin-host-modules.test.mjs",
    "vite.config.ts"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M8": "Storybook build, interaction and accessibility checks pass; native Terminal lifecycle and portable-plugin persistence are qualified; web has no AI/Terminal activation or connection paths.",
    "M8.3": "Portable plugins preserve native writes, freshness and vault isolation; packaged Markdown Lint and Spellcheck workers/WASM start and terminate correctly."
  },
  "runs": [
    {
      "name": "final-cohort-refresh",
      "command": "node .local/m83-managed/refresh-core.mjs; pnpm local:install",
      "result": "pass",
      "failures": 0,
      "note": "Five committed-source Notes archives refreshed; all 14 import routes match declared archive payloads. Tracked manifests/lock preserved. Source ad8729bf; installation and refresh logs /tmp/lapis-m83-managed-core-{refresh,install}.log."
    },
    {
      "name": "refreshed-check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Six validators, 65 chapters, 87 requirements; strict types zero errors/warnings; all-target Rust lint, Prettier and Rust formatter pass. /tmp/lapis-m83-refreshed-desktop-check.log."
    },
    {
      "name": "refreshed-unit",
      "command": "pnpm test",
      "result": "pass",
      "passed": 162,
      "failures": 0,
      "note": "85 JS/governance and 77 Rust cases. /tmp/lapis-m83-refreshed-desktop-unit.log."
    },
    {
      "name": "exact-native-repair",
      "command": "Fresh e2e build; isolated node runner tests/desktop/plugin-persistence.test.mjs tests/desktop/portable-database.test.mjs",
      "result": "pass",
      "passed": 5,
      "failures": 0,
      "note": "Both previously failing Settings/History targets now pass, with original persistence/recovery assertions, plus core choices, Explorer close and Bases. /tmp/lapis-m83-refreshed-native-exact.log."
    },
    {
      "name": "refreshed-catalog",
      "command": "pnpm test:storybook; pnpm build-storybook",
      "result": "pass",
      "passed": 84,
      "failures": 0,
      "note": "21 cases in each light/dark desktop/narrow cold run, then static build. /tmp/lapis-m83-refreshed-catalog.log and /tmp/lapis-m83-refreshed-catalog-static.log."
    },
    {
      "name": "refreshed-native-full",
      "command": "pnpm test:desktop",
      "result": "pass",
      "passed": 108,
      "failures": 0,
      "note": "Fresh packaged macOS ARM64 WebView: 2 startup, 27 WebDriver, 77 lifecycle and 2 HTTP representation cases. Isolated profiles and app PATH without Node/Deno. All seven portable plugins plus workers/WASM, full Terminal lifecycle and existing file/navigation/integration cases pass. /tmp/lapis-m83-refreshed-native-full.log."
    },
    {
      "name": "ordinary-bundle",
      "command": "pnpm exec tauri build --debug --bundles app; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary macOS ARM64 Lapis Notes Preview.app; 356 renderer JS files, zero automation markers, no Node/Deno runtime or native sidecar. Application signing remains deferred. /tmp/lapis-m83-refreshed-ordinary-{build,audit}.log."
    },
    {
      "name": "final-governance",
      "command": "pnpm check:progress; pnpm check:architecture; pnpm check:app-ownership; pnpm format:check; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "26 tasks and 52 records; explicit ownership/source boundaries, formatter and all four configured specification lanes pass. Original M8/M8.3 gate strings unchanged. /tmp/lapis-m83-completion-{progress,audits,format-check,spec}.log."
    }
  ],
  "sourceRevision": "ad8729bf25db77549f2157c0b5dbe151c2d0ca04",
  "archives": {
    "@lapis-notes/ui": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
    "@lapis-notes/api": "2356c597e57c318d1470d7f468eb4ac67fce16292f236de3c3c9b85ed858beae",
    "@lapis-notes/language-service": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
    "@lapis-notes/file-explorer": "be3815ebf920370dfb113be69862117670333ec755f179b322f718f7fb44c481",
    "@lapis-notes/workspace": "f28225e0daa5620cacc69284612dc2c6800b877db3654eaf6c60ddde81ac7105"
  },
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "svelte": "5.56.10"
  },
  "contractReview": "E-PORTABLE-001 retains implementation, original failures, source qualification and portable archive identities. This record qualifies the final committed-source cohort, including App Shell Settings preservation and live History comparison acceptance.",
  "milestoneReview": "M8.3 and aggregate M8 meet their unchanged original gates. Bookmarks, Wordcount, Slides, Bases and History preserve native persistence/freshness; Markdown Lint and Harper run and release real workers/WASM. Existing Search/Graph and Terminal gates remain passing. Dynamic installation is M9.1; M7.3 ordinary popups, app signing/publication and visual baselines retain their separate gates."
}
```
