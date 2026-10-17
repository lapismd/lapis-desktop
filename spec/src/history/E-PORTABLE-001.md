# Portable native plugin qualification

```json
{
  "id": "E-PORTABLE-001",
  "tasks": ["M8", "M8.3"],
  "requirements": [
    "LD-MIG-002",
    "LD-PLUG-003",
    "LD-PLUG-004",
    "LD-INSTALL-001"
  ],
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
    "spec/src/current/windows.md",
    "spec/src/history/E-PORTABLE-001.md",
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
  "completedGates": {},
  "runs": [
    {
      "name": "native-assets-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/m83/native-before node --test tests/desktop/plugin-assets.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Actual bundled WebView cannot fetch the missing installed-asset route; same-origin fetch is not yet allowed by CSP."
    },
    {
      "name": "native-assets-foundation",
      "command": "Same exact native installed-asset target against fresh e2e app",
      "result": "pass",
      "passed": 1,
      "failures": 0,
      "note": "Initial same-origin module, module worker, WASM compilation, MIME, GET/HEAD and admission-close proof. Expanded shared API identity and scoped-directory hardening require final rerun."
    },
    {
      "name": "native-asset-rust-initial",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test plugin_assets",
      "result": "pass",
      "passed": 5,
      "failures": 0
    },
    {
      "name": "scoped-read-compile-before",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test plugin_assets --locked",
      "result": "fail",
      "failures": 1,
      "note": "No tests ran: two Rust field diagnostics from shadowing metadata with a file handle; renamed the handle."
    },
    {
      "name": "native-asset-rust-final",
      "command": "Same locked Rust asset target",
      "result": "pass",
      "passed": 7,
      "failures": 0,
      "note": "Includes cross-language UTF-16 vector and symlink escape to another location inside the same vault."
    },
    {
      "name": "safe-mode-harness-before",
      "command": "node --test tests/renderer/notes-startup.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "No product assertion ran: strip-only Node cannot import the startup parameter-property class. Extracted the existing plugin policy into its feature-owned pure module."
    },
    {
      "name": "safe-mode-policy-before",
      "command": "Same exact Safe Mode policy target",
      "result": "fail",
      "passed": 0,
      "failures": 2,
      "note": "Community loading incorrectly follows the optional-core flag instead of its own flag."
    },
    {
      "name": "safe-mode-policy-after",
      "command": "Same exact Safe Mode policy target",
      "result": "pass",
      "passed": 2,
      "failures": 0
    },
    {
      "name": "import-map-unit",
      "command": "node --test tests/renderer/plugin-host-modules.test.mjs",
      "result": "pass",
      "passed": 2,
      "failures": 0
    },
    {
      "name": "strict-types",
      "command": "pnpm check:types; pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "note": "Zero Svelte errors or warnings; production boundaries pass."
    },
    {
      "name": "consumer-check-draft",
      "command": "pnpm check",
      "result": "fail",
      "failures": 10,
      "note": "Specification precheck only: stale generated MIGRATION and nine changed paths missing from draft evidence. No types, Rust, formatter or product tests ran. Refreshed file coverage and generated progress."
    },
    {
      "name": "consumer-format-draft",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Product types and Rust lint pass; formatter flags only draft task ledger. Formatted the ledger and regenerated progress."
    },
    {
      "name": "consumer-archive-refresh",
      "command": "node .local/m83/refresh-core.mjs; pnpm local:install",
      "result": "pass",
      "failures": 0,
      "note": "Five Notes public archives from 2416dc77; all 14 installed import routes verified. Other nine unchanged. Portable lock gains only 30 importer lines. Initial registry metadata selected older editor versions; restored parent lock and declared the already-qualified versions without peer mismatch."
    },
    {
      "name": "portable-fixture-verification",
      "command": "node .local/m83/prepare-portable-candidates.mjs in lapis-plugins-desktop-migration",
      "result": "pass",
      "failures": 0,
      "note": "Seven existing release payloads match 147ba6e2. Ephemeral Ed25519 test signatures, reproducible archive creation, file lists/hashes and independent verification pass. Private key deleted. No source rebuild, release or publication. Seeding is not an installation gate."
    },
    {
      "name": "native-shared-modules",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/m83/shared-native node --test tests/desktop/plugin-assets.test.mjs",
      "result": "pass",
      "passed": 1,
      "failures": 0,
      "note": "Actual packaged same-origin module shares API class identity; module worker, WASM, MIME, GET/HEAD and closed admission pass. /tmp/lapis-m83-shared-native.log."
    },
    {
      "name": "portable-basic-final",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/m83/portable-native node --test --test-concurrency=1 tests/desktop/portable-plugins.test.mjs",
      "result": "pass",
      "passed": 3,
      "failures": 0,
      "note": "Bookmarks and Wordcount UI writes, external rename, cold restoration; Slides Markdown embed, keyboard, freshness and return; disabled choices and vault isolation. /tmp/lapis-m83-portable-basic-pass.log."
    },
    {
      "name": "portable-workers-final",
      "command": "Same isolated node runner with tests/desktop/portable-workers.test.mjs",
      "result": "pass",
      "passed": 2,
      "failures": 0,
      "note": "Real Markdown Lint MD018 and Harper diagnostics, signed worker URLs, embedded WASM MIME and disable/re-enable/vault-return termination. /tmp/lapis-m83-portable-five.log (separate Slides locator failure retained below)."
    },
    {
      "name": "portable-database-final",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/m83/portable-native node --test --test-concurrency=1 tests/desktop/portable-database.test.mjs",
      "result": "pass",
      "passed": 2,
      "failures": 0,
      "note": "Bases native metadata, frontmatter writes, exact document bytes, external refresh and cold state; History internal/external captures, persisted revisions and selected baseline restore. /tmp/lapis-m83-portable-database.log."
    },
    {
      "name": "consumer-check-final",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Six validators, 64 chapters, 87 requirements; strict types zero errors/warnings; all-target Rust lint denies warnings; formatter and Rust formatting pass. /tmp/lapis-m83-check-final.log."
    },
    {
      "name": "consumer-unit-all",
      "command": "pnpm test",
      "result": "pass",
      "passed": 162,
      "failures": 0,
      "note": "85 JS/governance and 77 Rust cases, including seven native asset cases. /tmp/lapis-m83-test-all.log."
    },
    {
      "name": "consumer-source-audits",
      "command": "pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Production boundaries and explicit App ownership pass; /tmp/lapis-m83-audits.log."
    },
    {
      "name": "consumer-catalog-all",
      "command": "pnpm test:storybook",
      "result": "pass",
      "passed": 84,
      "failures": 0,
      "note": "21 cases in each light/dark desktop/narrow run from cold processes. /tmp/lapis-m83-catalog.log."
    },
    {
      "name": "consumer-catalog-static",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Production composition builds statically; known chunk-size advisory remains informational. /tmp/lapis-m83-catalog-build.log."
    },
    {
      "name": "consumer-spec-final",
      "command": "pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Complete configured spec check and 26-task/51-record progress audit. /tmp/lapis-m83-spec-final.log and /tmp/lapis-m83-progress-final.log."
    },
    {
      "name": "consumer-native-full-initial",
      "command": "pnpm test:desktop",
      "result": "fail",
      "passed": 104,
      "failures": 2,
      "note": "2 startup, 27 WebDriver and 75/77 lifecycle pass; final 2 HTTP not reached. Missing F-Mode in public Core Settings and stale detached History panel handle. /tmp/lapis-m83-native-full.log."
    },
    {
      "name": "consumer-two-target-reproduction",
      "command": "Isolated node runner tests/desktop/plugin-persistence.test.mjs tests/desktop/portable-database.test.mjs",
      "result": "fail",
      "passed": 4,
      "failures": 1,
      "note": "F-Mode missing before any mutation; all Bases/History data assertions pass. /tmp/lapis-m83-native-two-repro.log."
    },
    {
      "name": "history-stale-observation",
      "command": "Isolated node runner --test-name-pattern=portable History tests/desktop/portable-database.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Two independent runs fail at cached visibility. Repro and stale-probe logs show detached cached element with zero rectangle while live replacement is connected, visible and 256x720 with all 3 persisted rows. No History data/runtime failure."
    },
    {
      "name": "history-restore-ready-before",
      "command": "Same exact History target with fresh visibility locator",
      "result": "fail",
      "failures": 2,
      "note": "Fresh-locator and restore-probe runs reach comparison but immediate sidebar Restore clicks a detached projection. Exact selected first snapshot and external bytes remain visible. Await rendered comparison, then use its real Restore action."
    },
    {
      "name": "history-restore-ready-after",
      "command": "Isolated node runner tests/desktop/portable-database.test.mjs",
      "result": "pass",
      "passed": 2,
      "failures": 0,
      "note": "Live panel locator, completed comparison and real selected-revision restore pass with all original disk assertions. /tmp/lapis-m83-history-restore-ready.log."
    },
    {
      "name": "managed-settings-source",
      "command": "Source pnpm check, test, build, test:storybook:run, build-storybook:run, test:specification:static:run, spec:check and full Playwright Web lane",
      "result": "pass",
      "failures": 0,
      "note": "Exact F-Mode story: 1 failure to 1 pass. 18 check tasks, 1710 unique units, 10 builds, 259 catalog/axe, 172 static chapters, 6 documentation navigation/axe and 13 cold Web/server cases pass; two development-only docs skips. Committed ad8729bf. Full individual commands/counts and intermediate formatter/spec diagnostics retained in the owning source record."
    },
    {
      "name": "refreshed-check-draft-format",
      "command": "pnpm check after managed Settings archive refresh",
      "result": "fail",
      "failures": 1,
      "note": "Specification, strict types and all-target Rust lint pass. Formatter flags only newly expanded draft evidence; no product failure and unit command was not reached. Format evidence before rerun."
    }
  ],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauriApi": "2.12.4",
    "tauriCli": "2.12.3",
    "svelte": "5.56.10"
  },
  "contractReview": "Reuse public Notes lifecycle, installed metadata, portable host-module registry and existing worker implementations. Native resources remain scoped to admitted physical vaults and plugin directories. No Node/Deno runtime or additional IPC grant.",
  "milestoneReview": "Implementation, source qualification and focused regressions pass. E-PORTABLE-002 completes the unchanged M8.3 and aggregate M8 gates using the final committed-source archives. Actual signed installation remains M9.1; signing/publication and visual baselines remain deferred.",
  "sourceRevision": "ad8729bf25db77549f2157c0b5dbe151c2d0ca04",
  "sourceEvidence": "lapis-notes-desktop-migration/spec/records/2026-10-17-tauri-plugin-runtime.md",
  "sourceQualification": "18 check tasks, 1710 unique units (1836 executions including build prerequisites), 1134 API cases, 10 build tasks, 259 catalog/axe, 172 static chapters, 13 cold Web/server cases and six spec lanes/38 validator cases. All pass. Source commit 2416dc77; Deno untouched.",
  "archives": {
    "@lapis-notes/ui": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
    "@lapis-notes/api": "2356c597e57c318d1470d7f468eb4ac67fce16292f236de3c3c9b85ed858beae",
    "@lapis-notes/language-service": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
    "@lapis-notes/file-explorer": "be3815ebf920370dfb113be69862117670333ec755f179b322f718f7fb44c481",
    "@lapis-notes/workspace": "f28225e0daa5620cacc69284612dc2c6800b877db3654eaf6c60ddde81ac7105"
  },
  "pluginRevision": "147ba6e2e3e4af1e1818179c1f309fc3b420ce44",
  "pluginArchives": {
    "bookmarks@0.1.3": "608f62c271ad569be24b88c90999c42bd8a9641387489f886d3fb2194c2b5f8f",
    "wordcount@0.1.2": "dde16d1d0631a60339a12e14ff577b6ccff2349c8076a6c6f631219b0cda83ec",
    "lapis-slides@0.1.0": "c6995a5ed2b67f9e34479cd356395212645574e21a916867b31c913250bad091",
    "bases@0.1.4": "f2012ababe80ba2a5e324e8c3fca1582383c24e876ba125df9a7716013248775",
    "history@0.1.4": "2e5086310c921dd5e5aef36117a31c714c3daee9091227823ff897997269a7e4",
    "lapis-markdown-lint@0.1.2": "a66d4bc258092fc6d02e6ff9f87852329041feb1a493796dd73bcda31a5c05b7",
    "spellcheck@0.1.3": "bc162baff7d4b1b5fef3992883bfaff339a4f7d2cfb6c6d547e882a9c657632b"
  },
  "dependencyCohort": {
    "designCoreSourceReceipt": "a65dcf6d5b40199aadbaa22f4934215202f07f55",
    "designCoreSha256": "0d31cc17e3be99bff4eea941de0ab828aabc5f94a12dddcf5a24ec6d3629a4fd",
    "note": "Unchanged public archive, temporary validation prerequisite; M11 publication remains deferred."
  },
  "dockerRestoration": "Only Web/server compatibility was tested in Docker image lapis-server:desktop-m83-local, sha256:620d662c8083b7dd24ddad3bac265a967f0ae1f077904968e423cf00b4822291. Docker returned to original stopped state and 3072 MiB; .local/m83/docker-memory.json restored=true.",
  "sourceFoundationRevision": "2416dc779054bb5655f13823d633b9be903215e9",
  "managedSettingsSourceEvidence": "lapis-notes-desktop-migration/spec/records/2026-10-17-managed-plugin-settings.md",
  "managedServerQualification": {
    "originalMemoryMiB": 3072,
    "temporaryMemoryMiB": 8192,
    "originalState": "stopped",
    "restored": true,
    "image": "lapis-server:desktop-m83-managed-local",
    "sourceSnapshot": "24ba968f131301df41a7fdca868626a7f1c228eb",
    "imageId": "sha256:43e5f94094bf6abec7eb79aaf3858b68c424cbd6690623e0c0fb87fe00bda0f1",
    "webPassed": true,
    "restoredState": "stopped"
  }
}
```

## Retained native acceptance attempts

All commands used the isolated packaged native runner: node --test
--test-concurrency=1 tests/desktop/portable-plugins.test.mjs,
portable-workers.test.mjs or both, with LAPIS_DESKTOP_ACCEPTANCE_ROOT set. Logs
below live under /tmp/lapis-m83-; counts are failed cases per run.

| Log suffix                        | Failures | Finding and resolution                                                                                                           |
| --------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| portable-native.log               | 2        | Rename raced a pending save; Slides opened before editor readiness. Await physical save/editor.                                  |
| portable-native-after.log         | 2        | Atomic save raced watcher baseline; invalid CSS/text selector. Await observed new-file snapshot and scope text selector to deck. |
| portable-native-final-attempt.log | 1        | Slides embedded focus requires pointerdown omitted by driver click.                                                              |
| slides-after-locator.log          | 1        | Same embedded focus failure.                                                                                                     |
| slides-diagnostic.log             | 1        | Same failure; actual focus/drawing diagnostics recorded.                                                                         |
| workers-native.log                | 1        | Harper uses Blob worker, not plugin-ID URL; fix observer assertion.                                                              |
| spellcheck-probe.log              | 1        | Same Blob identification mismatch; runtime reported real diagnostics.                                                            |
| portable-all.log                  | 2        | Same Slides focus and fetch of intentionally revoked Harper Blob URL.                                                            |
| slides-key-receipt.log            | 1        | Same focus failure, plus cleanup ECONNRESET; real key/keyCode receipt correct.                                                   |
| portable-five.log                 | 1        | Both workers pass; remaining Slides external-refresh locator invalid.                                                            |

Final tests assert Reveal focus after pointerdown, deliver real driver arrow
keys and verify their key/keyCode. Harper MIME is observed before worker
construction and intentional Blob revocation; signed embedded WASM is read in
the WebView. No product keyboard shim, fallback renderer, fixed sleep, weakened
freshness assertion or dependency patch remains. Physical pointer gestures and
visual baselines remain separate from browser-event acceptance.
