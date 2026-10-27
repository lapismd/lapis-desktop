# Phase 2 qualification of the coherent cutover intake

```json
{
  "id": "E-CORE-047",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.10"],
  "requirements": [
    "LD-AI-005",
    "LD-AI-006",
    "LD-AI-007",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-GOV-010"
  ],
  "contractReview": "Phase 2 runs every deferred native, provider, bundle and catalog gate for the committed R7 intake on main b009d144 and repairs the one defect those gates exposed. This appended record resolves the pending current-cohort runs of immutable E-CORE-046 without rewriting them; E-CORE-045 keeps its older b2034168 provider proof. The repaired boundary is Desktop-owned acceptance tooling: the complete headed suite now preloads the governance-mandated tsx dev loader exactly as the hidden API lane already did, so production TypeScript that resolves public built API exports loads under Node. No alias, dependency patch, node_modules edit, copied module, weakened assertion, visual threshold or baseline was added, and the accepted immutable E-AI-109 formatting exception is unchanged. Installed application, feature defaults and user profile remain untouched; no publication, signing, default activation or ordinary-bundle automation capability is granted.",
  "milestoneReview": "M16.10 retains its original Done gate through E-CORE-043/044 and now carries current-cohort supplemental proof for the landed Notes cd997c2c pin and the freshly built API/AppProfile pair. No M10, M10.2, M12, M14, M15.1, Desktop default, distribution, signing, release or visual gate is completed or promoted. R5/R6 remain Deferred, Notes owns R7 cutover and final source validation, and the shared master tracker refresh stays with Notes while that repository holds concurrent uncommitted work.",
  "versions": {
    "desktopMain": "b009d1441727121a156caf95d27d52d88045b577",
    "desktopBaseline": "40b50d3e1e2ef375db62485b3dd594553aec902a",
    "providerSource": "85d9b5e10fcb1b70acfc1ad16f99259db6a20a5a",
    "nativePin": "cd997c2cf92ecfa1ce16de1f49ec085d58d026d5",
    "apiArchive": "f368081f2451057a56fc7e9ff163c31a1979b76dedf258c93c933179e958255a",
    "appProfileArchive": "bf1324f71af2cb146ae9be0ac047dd69187c46d047f510ad5ad8cb45d9ad161f",
    "candidateArchiveCount": 31,
    "verifiedImportRoutes": 117,
    "lapisAiSource": "b4a5f747c0dd11ec83027e78580875e1cd625c35",
    "pinnedLapisAi": "6548afe0f47c6fa2ff71d326a5f6e8ce4ebbebd8",
    "acpHelperSha256": "9181b38679aed2c713c225cf8d73a134743b736f113feeb8003f315521530be7",
    "acpFixtureSha256": "beef30ee441d8a6eb4645eb65123f0e8b193339bb5dfaab14f69ac763e33fe33",
    "tasksArtifactSha256": "ff64c349777bb4331f87dc2e6f8412dc92c7e05e423572fdaad455434f995c6b",
    "ordinaryBundleIdentifier": "com.lapismd.lapis-desktop.preview",
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "providerStopReceipt": ".local/native-test/queue-provider-9jD1EG",
    "providerResumeReceipt": ".local/native-test/queue-provider-cEeABL",
    "retentionRecord": ".local/qualification/r7-cohort/phase2/retention.json"
  },
  "files": [
    "MIGRATION.md",
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-queue.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CORE-047.md",
    "spec/src/history/core/index.md"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Phase 2 spec-first ranges on integrated main",
      "command": "pnpm spec:first; pnpm spec:first -- --base 40b50d3e1e2ef375db62485b3dd594553aec902a --head b009d1441727121a156caf95d27d52d88045b577; same tool for 85d9b5e1..70730562 and 70730562..b009d144",
      "result": "fail",
      "failures": 2,
      "detail": "The clean tree and the combined 40b50d3e..b009d144 range pass (6 protected files/6 canonical chapters) and the mapping repair alone is clean. The intake-only range 70730562..b009d144 reports SPEC-FIRST-MISSING for desktop.md and governance.md, confirming that the two Phase 1 commits must not be split."
    },
    {
      "name": "Phase 2 canonical validation and source audits",
      "command": "pnpm spec:validate; pnpm spec:check; pnpm check:progress; pnpm check:architecture; pnpm check:app-ownership; pnpm check:storybook-parity",
      "result": "pass",
      "failures": 0,
      "detail": "6 validators/368 chapters/116 requirements; spec:check passes all four lanes (validate, Rust format, mdBook, spec-first); progress passed 58 tasks/323 evidence records before this record; architecture and App ownership boundaries pass; 113 story families with 0 findings. Host execution was selected explicitly because the remote Docker context refused SSH for the whole session; Docker errors never fell back silently."
    },
    {
      "name": "Current-cohort strict normal/e2e Rust and TypeScript",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check; pnpm exec prettier --check .; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "fail",
      "failures": 1,
      "detail": "Strict Clippy passes for both configurations on the refreshed lock (--all-targets --locked -D warnings: 1m45s normal, 1m00s e2e, zero warnings), svelte-check reports 0 errors/0 warnings and Rust formatting passes. The single failure is the accepted immutable E-AI-109.md Prettier exception, byte-identical to committed main; no ignore, assertion or baseline was weakened."
    },
    {
      "name": "Quiet renderer, governance, AI and native-service suites",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test",
      "result": "pass",
      "failures": 0,
      "tests": 1550,
      "detail": "16:12:02Z-16:19:08Z: 544 governance/renderer Node cases pass, the AI lane passes 744 cases across 151 files, and locked cargo test passes 262 cases in 54 suites with the 2 retained ignores."
    },
    {
      "name": "Regenerated native prerequisites",
      "command": "node --import tsx tests/desktop/tasks-installed-artifact.mjs .local/qualification/r7-cohort/candidate-archives.json; node --import tsx tests/desktop/distribution-fixtures.mjs; pnpm ai:prepare -- --reuse",
      "result": "pass",
      "failures": 0,
      "detail": "The ignored .local/native-tasks payload was lost with .workspaces, so the signed Tasks artifact was rebuilt from the verified 31-archive manifest (0.1.0, sha256 ff64c349..., 4 files, provenance schema 1) and the signed distribution fixtures were regenerated. The staged Lapis AI 0.1.1 bundle verifies. Sibling lapis-ai is clean at b4a5f747 while native-sources.json pins 6548afe0; that range touches only CI, docs and scripts/validation (27 files, no crates/ or packages/ source), so the helper and bundle stay product-identical to the pin."
    },
    {
      "name": "First complete headed native attempt",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:desktop:headed",
      "result": "fail",
      "failures": 4,
      "tests": 108,
      "detail": "104/108 passed at 16:23:14Z-16:36:54Z. metadata-owner, search-owner and search-recovery died with ERR_MODULE_NOT_FOUND for @lapis-notes/api/dist/storage/app-database because the headed suite loaded production TypeScript under bare Node while governance.md requires the tsx dev loader for Node acceptance of public built API exports. The fourth failure SIGKILLed the native app on Close after 13.2s while a sibling cargo/rustc build held the shared compiler slot. One isolated rerun also used a relative LAPIS_DESKTOP_ACCEPTANCE_ROOT and tripped the native absolute-path assertion at host/mod.rs:22; it was repeated with an absolute root."
    },
    {
      "name": "Headed loader repair and its exact failing targets",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/metadata-owner.test.mjs tests/desktop/search-owner.test.mjs tests/desktop/search-recovery.test.mjs; then the same invocation for tests/desktop/terminal-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 9,
      "detail": "Before: 3 loader failures plus 1 lifecycle failure. After: 4/4 and 5/5 on a quiet machine, so the lifecycle SIGKILL was compiler-slot contention rather than a product defect. scripts/desktop-acceptance.mjs now preloads tsx for the complete headed suite exactly as the hidden API lane does, and governance.md names the shared loader for all three Node acceptance suites inside its unchanged 400 lines."
    },
    {
      "name": "Cold complete headed native acceptance after the repair",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:desktop:headed",
      "result": "pass",
      "failures": 0,
      "tests": 114,
      "detail": "Cold process 16:53:44Z-17:04:44Z: ACP resources rebuilt from lapis-ai b4a5f747 with fixture sha256 beef30ee..., startup-progress 3/3, real WebKit WebDriver 28 passing specs across 5 files with 0 failing, the complete native suite 109/109 and file-http-representation 2/2. Isolated window-state geometry persisted with no Node or Deno on PATH."
    },
    {
      "name": "Focused native admission and queue ownership",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/ai-native-queue-admission.test.mjs tests/desktop/ai-native-queue-owner.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 4,
      "detail": "4/4 in 15s (17:05:27Z-17:05:42Z) against the freshly built hidden acceptance app with an isolated absolute root and a node-symlink PATH."
    },
    {
      "name": "Complete hidden native API suite",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:desktop:api",
      "result": "pass",
      "failures": 0,
      "tests": 21,
      "detail": "21/21 with 0 skips in 2m31s (17:06:08Z-17:08:39Z) against the rebuilt debug e2e acceptance app in a hidden native WebView and no activation: caller-frame admission, queue admission/owner, Core turn owner, shared file service, editing, metadata, history with automatic capture and crash recovery, backup preflight/retention, Search owner and provider, and native Tasks transport."
    },
    {
      "name": "Actual installed-provider two-case acceptance",
      "command": "LAPIS_AI_TEST_CORE_QUEUE_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<private retained device runtime configuration> node --test --test-concurrency=1 tests/desktop/ai-native-queue-provider.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 2,
      "detail": "The first actual attempt passed 2/2 (Stop case 38.0s, completion/resume case 75.8s; 17:10:04Z-17:11:59Z) through the real Agent screen and installed provider. Fresh receipts: .local/native-test/queue-provider-9jD1EG holds stopped-native-unknown-no-resume and cold-unknown-retained-without-replay; queue-provider-cEeABL holds the real head/queued nonce completed without observers, the labelled offline retained fixture, explicit UI resume exactly once and cold retention without replay. No uncertain accepted turn was replayed, no retry was needed and no configuration or credential content was printed."
    },
    {
      "name": "Both bundle configurations and the packaged-asset audit",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm desktop:bundle --debug; pnpm check:bundle; diff -rq of both bundles' Contents/Resources/lapis-ai trees",
      "result": "pass",
      "failures": 0,
      "detail": "The ordinary debug bundle Lapis Notes Preview.app (com.lapismd.lapis-desktop.preview) built and audited in 1m55s (17:12:44Z-17:14:39Z): arm64 only, 23 bundled files, 331 renderer JavaScript files, zero automation markers, signing deferred and the complete lapis-ai resource tree present. The e2e Lapis Notes Acceptance.app was rebuilt by the hidden API lane, and both bundles' Contents/Resources/lapis-ai trees compare byte-identical."
    },
    {
      "name": "First complete catalog attempt",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "tests": 1033,
      "detail": "Cold shards 1 and 2 passed all four viewport/theme modes (29 files/128 cases and 28 files/127 cases per mode, 1,020 cases). Shard 3 aborted 27s in with one unhandled vitest error after 2 files/13 cases: the browser connection closed while running catalog/plugins/ai/QueuedMessages.stories.ts ([birpc] rpc is closed, cannot call createTesters) while host load peaked at 61.7 with ~68MB free pages. Shard 4 never started."
    },
    {
      "name": "Focused catalog rerun of the disconnected family",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/ai/QueuedMessages.stories.ts",
      "result": "pass",
      "failures": 0,
      "tests": 32,
      "detail": "8/8 cases in each of the four modes (32 executions, 17:43:47Z-17:45:28Z), so the shard abort was a host-resource browser disconnect rather than a story, capture-metadata or product defect. No baseline, threshold, tag or assertion changed; visual review stays pending."
    },
    {
      "name": "Complete cold catalog lane",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "tests": 2124,
      "detail": "Four sequential cold shards, each running the four viewport/theme modes (16 mode runs, 452 file runs) passed 2,124 executions with 0 failures and 0 unhandled errors in 45m57s (17:45:57Z-18:31:54Z): shard 1 29 files/128 cases per mode, shard 2 28/127, shard 3 28/128, shard 4 28/148. Interaction and accessibility failures stay enabled, changed stories keep visual-pending and no baseline was created or updated."
    },
    {
      "name": "Immutable-evidence refusal and appended record",
      "command": "pnpm progress:generate; pnpm check:progress",
      "result": "fail",
      "failures": 10,
      "detail": "Finalizing E-CORE-046 in place was refused by the repository's own gate: committed evidence is immutable, and protected changes require a fresh record that names every changed protected file. E-CORE-046 was restored byte-identical to b009d144 and this appended record was created instead; the pending E-CORE-046 runs stay unresolved in their own file and are resolved here."
    }
  ],
  "gaps": [
    "Every count above comes from fresh Phase 2 receipts retained under .local/qualification/r7-cohort/phase2 (lane logs, timings and retention.json), .local/native-test and .local/acp. Historical native and source counts stay scoped to their original receipts, and the destroyed E-CORE-045 helper/receipt lineage remains unreproducible.",
    "Upstream, owner Notes: published @lapis-notes/api dist emits extensionless relative specifiers (490 across 119 of 238 JS files, including the ./app-database host shim), so its public exports load only through a bundler or a resolving dev loader. The retained ef8170a6 archive ships the same shim and exports map, so this predates the cohort; Desktop keeps the governance-mandated tsx loader and adds no alias, patch or copied module.",
    "Two failures were host-resource events rather than product defects and each exact target passes on a quiet host: the native Close SIGKILL under a sibling cargo/rustc build, and the shard-3 browser disconnect under load 61.7. Heavy Mac builds stay serialized behind the free-space and pgrep guards, checked before each lane rather than inside its launch command.",
    "The remote Docker context refused SSH for this session, so every portable lane ran with explicit native host selection; Docker-first portable qualification keeps its own gate and no Docker error triggered a silent fallback.",
    "The shared Notes master tracker was not refreshed here because that repository holds concurrent uncommitted sibling work; the refresh is reported to its owner instead of committed across repositories."
  ]
}
```
