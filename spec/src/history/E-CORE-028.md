# Vault-owned Desktop History indexing

```json
{
  "id": "E-CORE-028",
  "date": "2026-10-26",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14.6"],
  "requirements": [
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-REPO-005",
    "LD-DESK-001",
    "LD-GOV-006",
    "LD-GOV-007"
  ],
  "contractReview": "Replace renderer batch scheduling with cached observation of the existing vault-owned History scheduler. Preserve zero-client/reload lifetime, capture pause, native admission, neutral absence, cold immutable rebuild and storage relocation drain. No metadata, Search writer or AI default changes.",
  "milestoneReview": "M14.6 retains its original completed historical-search gate. This bounded shared-owner adoption now has separate qualified source repairs, complete catalog/renderer/service proof and cold actual macOS IPC. No metadata/current-file writer, AI/default cutover, provider, visual or distribution gate is completed.",
  "versions": {
    "desktopParent": "8289c310",
    "notes": "211bff3cc63a414fe9c8869cbf05bcad847effae",
    "tasks": "fcb2a8b514d68464034173e2aed886133d2a2e99",
    "plugins": "6af2420ff720cf8ce04581306c9c7b8d12b126e4",
    "npmArchives": 26,
    "svelte": "5.56.10",
    "jjStore": "5f4bf72984ccc2a8ab7487883cef32a579ef496f",
    "portableNode": "v24.15.0",
    "nativeHarnessNode": "v26.9.0",
    "pnpm": "10.34.5",
    "rustc": "1.99.0 b940084d7",
    "nativePlatform": "macOS27.0 (26A428), ARM64; deployment target13.0"
  },
  "runs": [
    {
      "name": "exact-renderer-before",
      "command": "node --import tsx --test tests/renderer/repository-indexed-search.test.mjs",
      "result": "fail",
      "tests": 3,
      "failures": 1,
      "note": "Isolated Docker snapshot 4b8d8b74, run lapis-desktop-history-before-83bd353d-a8fd-4de9-995e-b8e44550b228: 2 pass / 1 fail. Legacy controller lacks native-owner selection and cached-only observation."
    },
    {
      "name": "exact-renderer-after",
      "command": "node --import tsx --test tests/renderer/repository-indexed-search.test.mjs",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "note": "Fresh isolated Docker snapshot 248127fc, run lapis-desktop-history-after-a73e9cec-c3c0-49f1-8381-51f6b0bab4da: 4 pass. Covers no batch dispatch, no native stop on disposal, one selection, cached failure recovery, immutable transport and unchanged expression lowering."
    },
    {
      "name": "full-test-lock-before",
      "command": "pnpm test",
      "result": "fail",
      "tests": 1244,
      "failures": 1,
      "note": "Canonical Docker run87fc74a4-2cef-4cdc-9348-b2cb1be90d6c: all500 governance/renderer and744 AI cases pass. Rust stops before compile at --locked because the qualified Tasks reader adds its recurrence closure. No functional case fails. The bounded offline lock update adds four new packages, path-crate edges and md5; it preserves the existing num_enum_derive\u2192proc-macro-crate2.0 edge."
    },
    {
      "name": "native-service-before",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test core_history_service -- --nocapture",
      "result": "fail",
      "tests": 2,
      "failures": 1,
      "note": "Docker run96f2291c-6ee8-4d16-bfe9-621928b3d4c2: one detach/pause case passes; cold rebuild reaches a harness-only synchronous NativeHistory query on the Tokio thread. Move that assertion onto the required blocking worker without changing assertions."
    },
    {
      "name": "native-service-after",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test core_history_service -- --nocapture",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "note": "Exact cold Docker rerunfb2f7496-9da7-48ac-bd6b-d25a2c3f7506, source14b6f7e1: both native adapter cases pass. This proves shared service intake only; actual cold macOS IPC remains separate."
    },
    {
      "name": "portable-check",
      "command": "pnpm check",
      "result": "fail",
      "tests": 0,
      "failures": 3,
      "note": "Canonical cold Docker9c65a1b7-fcb2-4a45-b135-80710afac4ff passes Storybook parity, specification, renderer types and strict normal/e2e Clippy, then exits1for three formatting files: generated MIGRATION.md, current milestones.md and immutable E-AI-109.md. The first two are corrected; exact final full formatter retains only the unchanged historical user-accepted exception (parent-byte equality16e50704). Initial authoring-limit failures c486b9c9 and5105aadd are retained and corrected by splitting/condensing current prose; historical evidence is untouched. Do not describe the aggregate check as passed."
    },
    {
      "name": "focused-cold-search-catalog",
      "command": "pnpm test:storybook -- catalog/plugins/repository/Search.stories.ts",
      "result": "pass",
      "tests": 28,
      "failures": 0,
      "note": "Cold Docker1e961704-b624-4e82-9814-4cc3f762bc53: seven Search examples in four theme/viewport modes;28pass."
    },
    {
      "name": "hidden-history-ipc-before-source-reader",
      "command": "node --import tsx --test tests/desktop/repository-indexed-search.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "note": "Actual hidden macOS ARM64 IPC:2pass in12.4s, normal/e2e bundles built and normal bundle audit reports0automation markers. Covers neutral absent source, immutable checkpoint/context, paused cold cache rebuild, unsnapshotted bytes, relocation and stale-storage refusal. No foreground/UI/provider qualification."
    },
    {
      "name": "hidden-api-before-source-reader",
      "command": "node --import tsx --test --test-concurrency=1 <nine exact files from scripts/desktop-api-tests.mjs>",
      "result": "fail",
      "tests": 12,
      "failures": 3,
      "note": "Actual cold hidden native inventory:9pass/3fail. Backup recovery/resume queries reject transient History index Busy despite cached complete status. No assertion was weakened. The independent shared native scheduler exposed the existing jj-vault reader/writer admission defect."
    },
    {
      "name": "owning-native-reader-source",
      "command": "node scripts/managed-cargo.mjs test --locked -p jj-vault; node scripts/managed-cargo.mjs check --locked -p jj-vault; node scripts/managed-cargo.mjs build --locked -p jj-vault; node scripts/managed-cargo.mjs clippy --locked -p jj-vault --all-targets -- -D warnings",
      "result": "pass",
      "tests": 33,
      "failures": 0,
      "note": "Owning jj-store E-VAULT-BACKUP-022/commit5f4bf729 qualifies bounded committed-reader admission. Exact new source cases0/4before then4/4after; full crate33pass. One unrelated mac-only test executable path failed in widening, then exact1/1and full33/33passed using provisioned PATH jj. Readers never initialize/repair derived bytes or own capture/scheduling; five-second sustained Busy remains explicit. No public DTO/API/format or npm archive changes."
    },
    {
      "name": "reader-consumer-rust",
      "command": "pnpm test:rust; pnpm check:rust; pnpm check:rust:e2e",
      "result": "pass",
      "tests": 242,
      "failures": 0,
      "note": "Fresh Docker consumer ec824d22-d2fd-492c-bbf3-586c794aad11 at5959c3b0, jj-store5f4bf729:242Rust pass,2explicitly ignored; strict normal/e2e all-target Clippy pass. Other native/npm pins stay fixed."
    },
    {
      "name": "refreshed-native-bundles",
      "command": "pnpm exec tauri build --debug --bundles app <normal/e2e qualified build overrides>; node scripts/check-bundle.mjs",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Fresh normal/e2e arm64 bundles at eadc14d5 with reader5f4bf729. Normal audit reports0automation markers. Retained e2e renderer proven equal across624source/config inputs,26archives and93active routes. Direct initial normal prebuild failed because archived AI helper source lacks @iarna/toml; reused original qualified renderer-only beforeBuildCommand and hash-verified helper resources. Signing remains deferred."
    },
    {
      "name": "hidden-backup-after-reader",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/repository-backup-recovery.test.mjs tests/desktop/repository-backup-resume.test.mjs",
      "result": "fail",
      "tests": 3,
      "failures": 1,
      "note": "Reader repair removes all Busy IPC failures:2pass/1fail. Final-close query sees no final file at repository-backup-recovery.test.mjs232. Cached complete status is not a current query coverage barrier. Add passive page.status.complete observation with fatal IPC errors; separately investigate Notes final sender-close notification, never hide it with waiting."
    },
    {
      "name": "hidden-final-close-query-readiness-before",
      "command": "node --import tsx --test --test-concurrency=1 --test-name-pattern='native automatic capture retains admitted' tests/desktop/repository-backup-recovery.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Exact cold before with passive page.status.complete barrier:0/1. Final-close query coverage remains incomplete for20seconds; no Busy IPC errors. Saved-file assertion is preserved. A helper probe confirms one selection and fatal status/query errors despite WDIO callback retry behavior (three local scenarios). Notes owns final-watch closure repair; waiting alone is not qualification."
    },
    {
      "name": "owning-final-watch-source",
      "command": "pnpm rust:core -- test -p lapis-app-core --lib services::backup::history::tests --locked -- --nocapture; complete Notes native/build/strict/spec lanes",
      "result": "pass",
      "tests": 382,
      "failures": 0,
      "note": "Bounded Notes211bff3c on exactly0b05c990 repairs closed backup-watch observation in the private History worker. Exact before1pass/2fail then3/3after; all14backup and382Rust pass,6existing ignores; locked build, strict Clippy, ten spec lanes and78governance checks pass. Product bytes equal d9e5195e; final delta documentation only. No public API, native source pin or npm/JS default change. Notes source record2026-10-26-history-final-notification.md retains its receipts."
    },
    {
      "name": "passive-query-helper-probe",
      "command": "node .local/qualification/query-ready-probe.mjs",
      "result": "pass",
      "tests": 3,
      "failures": 0,
      "note": "Three isolated harness scenarios prove one selection across repeated queries, immediate status IPC failure and immediate query IPC failure even when a WDIO-like wait loop would retry thrown callbacks. This helper probe supplements separate actual macOS checks; it grants no product/UI/provider acceptance."
    },
    {
      "name": "final-watch-consumer-rust",
      "command": "pnpm test:rust; pnpm check:rust; pnpm check:rust:e2e",
      "result": "pass",
      "tests": 242,
      "failures": 0,
      "note": "Fresh Docker0349f58e-8980-4da6-b9e6-12037b9dba1e at db050c92 selects bounded Notes211bff3c plus jj-store5f4bf729:242Rust pass,2explicitly ignored; strict normal/e2e all-target Clippy pass. Other native pins and26archives/93routes remain fixed."
    },
    {
      "name": "final-watch-native-builds",
      "command": "CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm exec tauri build --debug --bundles app <normal/e2e configs with retained verified renderer>; node scripts/check-bundle.mjs; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Final source13e7c0b6 builds both arm64 app bundles with Notes211bff3c/jj-store5f4bf729; normal audit0automation markers, signing deferred.624unchanged renderer inputs and retained normal/e2e output digests recorded. All actual bundled helper copies match qualified AI6548afe0 (normal1; e2e3copies across inherited/acceptance paths); fixture absent from normal. Resource-proof authoring initially assumed a fixture in normal and one helper copy in e2e; corrected inventory assumptions only, without changing any product or helper bytes. Rust formatting passes through complete archived sibling layout."
    },
    {
      "name": "final-watch-after-platform-startup-failure",
      "command": "node --import tsx --test --test-concurrency=1 --test-name-pattern='native automatic capture retains admitted' tests/desktop/repository-backup-recovery.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "First refreshed invocation exits before any History action: native renderer-ready assertion fails after15seconds, app log empty. OS log for acceptancePID48277 shows WebKitGPU PID48344 unresponsive and terminated01:13:09UTC, then closed rendering connection. Distinct platform-startup failure; no History assertion was exercised or waived. Original output/system-log summary retained."
    },
    {
      "name": "final-watch-exact-native-after",
      "command": "node --import tsx --test --test-concurrency=1 --test-name-pattern='native automatic capture retains admitted' tests/desktop/repository-backup-recovery.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "note": "Fresh isolated process/profile, identical binary and input/assertion/timeout bytes:1/1passes in9.0seconds, including crash recovery and final saved-file assertion. Own-process sample and OS logs diagnose the preceding WebKit GPU startup failure; no renderer activation, batch stepping, index reselection or IPC retry added."
    },
    {
      "name": "final-watch-three-case-native-family",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/repository-backup-recovery.test.mjs tests/desktop/repository-backup-resume.test.mjs",
      "result": "pass",
      "tests": 3,
      "failures": 0,
      "note": "Fresh actual hidden macOS family:3/3passes in20.3seconds. Automatic capture/crash/final close, repaired failed capture and resumed watching retain their exact saved-file/checkpoint assertions. Passive query coverage and all status/query IPC errors are fatal. No source scheduling, extra selection, test retry or timeout change."
    },
    {
      "name": "full-portable-final-before-spec-navigation",
      "command": "pnpm test; pnpm build; pnpm build-storybook; pnpm test:storybook; pnpm spec:check",
      "result": "fail",
      "tests": 3502,
      "failures": 2,
      "note": "Frozen Dockerfb0591be-682c-476d-9d7e-fed74e2e1264 at6c88a217 passes500renderer/governance,744AI,242Rust(2ignored), renderer/static Storybook builds and all2016catalog cases across16serialized theme/viewport/shard invocations with no interaction/axe/runtime-diagnostic failures. Final spec validates/builds/formats Rust, then reports two missing mapped entry chapters (repository.md,plugins.md). Their existing summaries now explicitly document native History observation; no mapping/validator weakened, both stay399lines. Current native pin changes are qualified separately by fresh Rust consumer and actual macOS runs; full catalog renderer inputs remain equal."
    },
    {
      "name": "final-nine-file-native-api",
      "command": "node --import tsx --test --test-concurrency=1 <nine exact files from scripts/desktop-api-tests.mjs>",
      "result": "pass",
      "tests": 12,
      "failures": 0,
      "note": "Complete cold actual macOS hidden API inventory:12/12passes in61.5seconds. Original9pass/3Busy failures and2pass/1final-close failure remain preserved; committed reader admission plus final watch notification repair remove them. Expected stale-storage and failed retained-vault-preflight rejections are asserted negatives, not ignored errors. No foreground/OS/provider gate inferred."
    },
    {
      "name": "final-canonical-specification",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Fresh canonical Dockerb01d6575-833a-48fb-bce8-cfe281a8ab54 at d7086c3b passes all four lanes: validate, Rust formatting, mdBook and spec-first. Both previously missing mapped entry chapters now pass; full spec authoring scan has zero400line/32768byte violations. Product inputs equal native-build source13e7c0b6; only current prose/progress/evidence differs. Exact full Markdown formatting still reports only the unchanged previously user-accepted historical E-AI-109; no new exception."
    },
    {
      "name": "final-projection-scope-before",
      "command": "node scripts/validation.mjs run spec:validate",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "note": "Final projection b1623ba6-bc77-427a-9f14-9f26d177f499 correctly rejects pass with nonempty remaining gate gaps. Those entries named unrelated R3\u2013R7/default/provider/visual/distribution gates; move them into the explicit out-of-scope narrative and retain their owning task statuses. This bounded History gate has no remaining gap. No validator or gate is weakened."
    }
  ],
  "files": [
    "MIGRATION.md",
    "catalog/support/repository/SearchDemo.svelte",
    "scripts/desktop-api-tests.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/background.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/migration.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-CORE-028.md",
    "spec/src/history/core/index.md",
    "src-tauri/Cargo.lock",
    "src-tauri/src/host/repository/history_owner.rs",
    "src-tauri/src/host/repository/indexed_search.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/storage.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/tests/core_history_service.rs",
    "src/components/repository/search/search-provider.ts",
    "src/lib/native/repository/indexed-search.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/history-index-controller.ts",
    "src/lib/repository/indexed-search.ts",
    "tests/desktop/history-index-observation.mjs",
    "tests/desktop/repository-backup-recovery.test.mjs",
    "tests/desktop/repository-backup-resume.test.mjs",
    "tests/desktop/repository-indexed-search.test.mjs",
    "tests/desktop/repository-service-lifetime.test.mjs",
    "tests/renderer/repository-indexed-search.test.mjs"
  ],
  "remaining": []
}
```

The 26-package final UI cohort is retained. History source qualification,
Desktop service intake and cold native acceptance remain distinct boundaries.

Metadata/current-file Search writers, AI defaults and Notes R3–R7 remain
independent work. Original real-provider, signing/distribution and visual gates
retain their existing statuses; this bounded History adoption does not close
them.
