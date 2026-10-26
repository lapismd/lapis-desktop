# Shared Desktop History controls

```json
{
  "id": "E-CORE-032",
  "date": "2026-10-26",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.6"],
  "requirements": [
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-REPO-005",
    "LD-CAT-003",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-006",
    "LD-GOV-008"
  ],
  "contractReview": "Core owns typed immutable History request/source/status/context policy. Public History package owns observation and response validation. Desktop retains current caller/session/root admission, existing search slots, owned async completion and bound egress; relocation drain/reselect remains native. No new command, renderer scheduler, capture path or fallback.",
  "milestoneReview": "M16.6 Done under its original completion gate: public shared controls/observation/validation replace private policy; exact native cancellation/admission, cold saved-context/cache/pause/relocation, full affected catalog and portable/native/bundle/governance checks pass. Native Tasks/shared reader adoption, full R3, renderer/default cutover, M10/provider qualification, signing/distribution and visual review retain separate gates.",
  "versions": {
    "desktopParent": "cb8309fa190a4741c0186380023a10d0b7ce8042",
    "apiArchiveSha256": "c91a8d15f4af9cb3ac7f8f7dee75553adc31bc0e70fa7fc77049ddbf315782a6",
    "historyArchiveSha256": "0fa89766e6501c7d868772e2da4617598b31c13d385d5942d5448f858ae534f0",
    "historyCoreQualifiedSource": "7cbb8713c7cff3e7f75b3c9e0672fbad4b95d980",
    "finalNativeNotesSource": "8bd2f3d83026c200958d1013d3a600698f0af861",
    "nativeCohort": [
      {
        "name": "lapis-notes",
        "revision": "8bd2f3d83026c200958d1013d3a600698f0af861"
      },
      {
        "name": "lapis-ai",
        "revision": "6548afe0f47c6fa2ff71d326a5f6e8ce4ebbebd8"
      },
      {
        "name": "jj-store",
        "revision": "4e74e423966180576da89229e02da49dcd014dfd"
      },
      {
        "name": "agent-redaction",
        "revision": "3c3dc0d768afbe197e796d4bf94c0be5074faa4c"
      },
      {
        "name": "lapis-plugins",
        "revision": "5e0dffc3eb29efed5508c4914acca6b6bba0027f"
      },
      {
        "name": "lapis-terminal",
        "revision": "d7e0a7cd710fef626e1350c116ca6e4b18986972"
      },
      {
        "name": "lapis-plugin-tasks",
        "revision": "da17eba0c7d9a6c90056cb957ef88fb60b975a43"
      },
      {
        "name": "lapis-plugin-docs",
        "revision": "f772f2bacc20a914cef2f0398f294cefbac4ba3c"
      }
    ],
    "apiQualifiedSource": "2d250f66f9fe2b2d01bb33c2c2b02bfebf1f7771",
    "historyQualifiedSource": "214917c849e7e9440bd6792d480677c745db6873",
    "publicFiles": 9386,
    "physicalPackageContexts": 29,
    "apiBuildSource": "34650276261fc34c98725d9b25be82f25587f36f",
    "historyBuildSource": "fd82f08e72549863218ed4f672eea1c8841a9210",
    "nativeProductSnapshot": "5aa82c9f1530bede421d0a0700d5d4a84082613e",
    "catalogProductSnapshot": "135c600663953ee421ccd5deccdc5b97b9f2003e",
    "finalPublicArchives": 27,
    "normalBinarySha256": "7e7b2a505291e4ba082f80699fc016dbd63aa75cb97f6deda09755b8c13bb9e4",
    "acceptanceBinarySha256": "334f67e6ebaefdb46c4f9c02593189e13a6af90e45a342e79e9fc11a9c335542",
    "manifestSha256": "0cfc0c61d7a5c707b9e20cd360519b1de98232ea95a90fdcb583f1965f67306e",
    "lockSha256": "9c653d470cf165b549b066422466f5ee5744b1ad5fab0a0e03c6c1004c32f7ab",
    "nativePinsSha256": "a36f067f7711d195f69b2eff8de09fe6d96ecbe7ffb920407d69ec4164e0cf42"
  },
  "runs": [
    {
      "name": "before-native",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "report": "history-native-before.json",
      "note": "Exact original cold saved-context/cache rebuild and paused storage moves; existing qualified native binary.",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/repository-indexed-search.test.mjs"
    },
    {
      "name": "before-renderer",
      "result": "pass",
      "tests": 9,
      "failures": 0,
      "note": "Exact indexed and legacy repository search cases in clean default; tool output preserved in session.",
      "command": "node --import tsx --test tests/renderer/repository-indexed-search.test.mjs tests/renderer/repository-search.test.mjs"
    },
    {
      "name": "first-packed-renderer",
      "result": "fail",
      "tests": 6,
      "failures": 1,
      "report": "history-renderer-exact-after.log",
      "note": "5 legacy passes; aggregate repository import eagerly loaded an unrelated Svelte UI module before indexed tests. Use existing public pure controller leaf routes; owner confirms intended boundary.",
      "command": "node --import tsx --test tests/renderer/repository-indexed-search.test.mjs tests/renderer/repository-search.test.mjs"
    },
    {
      "name": "packed-renderer-leaves",
      "result": "pass",
      "tests": 10,
      "failures": 0,
      "report": "history-renderer-exact-after-leaves.log",
      "command": "node --import tsx --test tests/renderer/repository-indexed-search.test.mjs tests/renderer/repository-search.test.mjs"
    },
    {
      "name": "repository-renderer-family",
      "result": "pass",
      "tests": 159,
      "failures": 0,
      "report": "history-renderer-family-after.log",
      "command": "node --import tsx --test --test-concurrency=2 tests/renderer/repository-*.test.mjs"
    },
    {
      "name": "strict-types",
      "result": "pass",
      "errors": 0,
      "warnings": 0,
      "report": "history-types-provisional.log",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:types",
      "failures": 0
    },
    {
      "name": "source-and-App-audits",
      "result": "pass",
      "note": "node scripts/source-audit.mjs and --app-only; no architecture or explicit-App finding.",
      "command": "node scripts/source-audit.mjs; node scripts/source-audit.mjs --app-only",
      "failures": 0
    },
    {
      "name": "rust-format",
      "result": "pass",
      "note": "rustfmt --edition 2024 on both changed Rust files; no compilation claimed.",
      "command": "rustfmt --check --edition 2024 src-tauri/src/host/repository/indexed_search.rs src-tauri/src/host/repository/history_owner.rs",
      "failures": 0
    },
    {
      "name": "cold-search-catalog",
      "result": "fail",
      "tests": 0,
      "failures": 0,
      "report": "history-search-catalog-provisional.log",
      "note": "SSH connection refused during Docker volume creation; retained lease 0b16bcddf12027eb. No browser/host fallback.",
      "command": "node scripts/validation.mjs run test:storybook -- catalog/plugins/repository/Search.stories.ts"
    },
    {
      "name": "archive-auditor-attempts",
      "result": "pending",
      "tests": 0,
      "failures": 0,
      "note": "Initial inefficient tar-per-member auditor hit its 1MiB child-process buffer on a large declaration. Streaming tarfile auditor then correctly rejected omitted optional overlay prerequisites. Install projection now includes every selected archive and restores portable manifests/lock.",
      "command": "Private ignored public archive payload audit"
    },
    {
      "name": "duplicate-cache-cleanup",
      "result": "pass",
      "files": 908,
      "allocatedBytes": 10441109504,
      "retainedCopies": 28,
      "report": "history-cache-cleanup-applied.json",
      "note": "Only byte-identical older source-input archives from completed runs; active, hosted and Tasks inputs excluded. Hash/stat/terminal/open-file checks passed. Reports, metadata, binaries and profiles retained.",
      "command": "Private ignored exact-hash, terminal-state, stat and open-file cache verification",
      "failures": 0
    },
    {
      "name": "complete-overlay-payloads-and-exact-cases",
      "command": "python3 .local/validation/verify-history-overlay.py; node --import tsx --test tests/renderer/repository-indexed-search.test.mjs tests/renderer/repository-search.test.mjs",
      "result": "pass",
      "tests": 10,
      "failures": 0,
      "note": "All27selected archives/9386publicfiles/29physical contexts match payload bytes. Exact10cases pass after ignored projection includes every selected prerequisite. Portable manifest and lock byte-equal frozen01cb25b1 after install."
    },
    {
      "name": "cold-search-catalog-resumed",
      "command": "Resume exact frozen135c6006 owned Docker worker through supported ssh-cli transport; normal catalog command and guards unchanged",
      "result": "pass",
      "tests": 28,
      "failures": 0,
      "note": "7productionSearchstories x2themes x2viewports pass with ordinary accessibility and fatal-runtime checks. No source re-export or host-browser fallback."
    },
    {
      "name": "full-portable-node-before-evidence-selection",
      "command": "node --import tsx --test --test-concurrency=2 tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "fail",
      "tests": 507,
      "failures": 1,
      "note": "506pass; the live-ledger regression requires selected evidence for an active task. M16.6 still had its initial dash while qualification was running. Attach this truthful pending receipt; do not change its In progress status or weaken validation."
    },
    {
      "name": "native-cancellation-and-admission",
      "command": "CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 cargo test --locked --manifest-path src-tauri/Cargo.toml --bin lapis-desktop host::repository::indexed_search::tests",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "note": "Final Notes8bd common sibling cohort. Actual production lifetime helper retains the relocation permit during Core and bound egress even after aborting its caller. Original path/window-authority frame denial also passes. This is native unit evidence, separate from macOS WebView acceptance."
    },
    {
      "name": "full-cold-catalog",
      "command": "Canonical test:storybook with four sequential cold shards on frozen135c6006 public UI source",
      "result": "pass",
      "tests": 2056,
      "failures": 0,
      "note": "Final selected public UI source/27archives; four sequential cold shards x2themes x2viewports produce16ordinary JUnit receipts, all2056cases pass with axe and fatal-runtime guards. Metadata/native-pin-only deltas afterward are separately verified; no UI/runtime/test source changed."
    },
    {
      "name": "first-native-cohort-compile",
      "command": "CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 cargo test --locked --manifest-path src-tauri/Cargo.toml --bin lapis-desktop host::repository::indexed_search::tests",
      "result": "fail",
      "tests": 0,
      "failures": 5,
      "note": "Stopped in Core compilation before Desktop assertions: retained Desktop Tasks fde58de0 lacks five lifecycle exports now required by qualified Notes8bd2f3d8. Align every common sibling pin with Notes authoritative cohort (Tasksda17eba0/JJ4e74e423), retain Desktop-only pins, clear only stale lapis-task-services artifacts and refresh changed restored-input mtimes."
    },
    {
      "name": "portable-node-after-pending-receipt",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test --test-concurrency=2 tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "tests": 507,
      "failures": 0,
      "note": "Complete renderer/governance suite passes after truthful pending E-CORE-032 selection; original assertions retained."
    },
    {
      "name": "pending-spec-before-file-budgets",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:validate",
      "result": "fail",
      "tests": 0,
      "failures": 2,
      "note": "New documentation exceeded existing Desktop contract bytes by12 and migration chapter lines by2. Shorten only the new reference/summary, retaining the native gates and limits."
    },
    {
      "name": "pending-spec-after-file-budgets",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:validate; node scripts/progress.mjs",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "6validators/350chapters/108requirements and54tasks/307evidence pass; E-CORE-032 remains pending while original product gates run."
    },
    {
      "name": "full-ai-portable",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:ai",
      "result": "pass",
      "tests": 744,
      "failures": 0,
      "note": "All151AIpolicy files pass with final APIc91a/public archive overlay; no live-provider or compute gate inferred."
    },
    {
      "name": "full-native-rust",
      "command": "CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 cargo test --locked --manifest-path src-tauri/Cargo.toml",
      "result": "pass",
      "tests": 250,
      "failures": 0,
      "note": "52Rust suite receipts; two subprocess helpers remain intentionally ignored and are invoked by their real restart/interruption tests. Normal/e2e strict Clippy --all-targets -- -D warnings also pass."
    },
    {
      "name": "original-native-after-shared-controls",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/repository-indexed-search.test.mjs with explicit rebuilt acceptance binary and isolated background profiles",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "note": "Actual macOS ARM64 WebView: neutral missing source, exact saved-version/context, cache-loss cold rebuild, later unsnapshotted bytes, paused capture and successful/stale storage relocation all pass. Expected stale-revision denial is retained. No foreground activation, screenshots or mocks substitute for these native assertions."
    },
    {
      "name": "normal-and-e2e-bundles",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json; pnpm desktop:bundle --debug; pnpm check:bundle",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Both macOS ARM64 bundles build; normal frontend build passes and AI6548resources verify unchanged. Ordinary bundle audit finds328rendererJSfiles and0automation markers; no Node/Deno/WDIO/fixture executable leaks. Signing stays Deferred. Existing large-chunk and debug unwind linker advisories remain visible; no check or limit changed."
    },
    {
      "name": "full-specification-and-format",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Canonical actual-versioned-workspace full spec validate/rust-format/mdbook/spec-first lanes pass. Rust and every changed file format correctly. Full Prettier separately retains exactly the existing user-accepted immutable E-AI-109 warning; unchanged parent SHA16e50704e76ed720fdf280a28167714c23079fd13facd803580ca0aced74e93a. Do not rewrite committed evidence."
    },
    {
      "name": "final-public-payload-and-runtime-provenance",
      "command": "Private ignored streaming archive/binary/source equivalence audits",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "27archives/9386publicfiles/29physical contexts match qualified archives; portable manifests/lock restored. Native snapshot5aa82c9f and catalog135c6006 differ from final product only in governance/native-input metadata. Full raw checksums, input pins and cleanup receipts remain in .local/validation/history-final-provenance.json and associated reports."
    },
    {
      "name": "strict-native-configurations",
      "command": "CARGO_BUILD_JOBS=2 CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings; repeat with --features e2e",
      "result": "pass",
      "tests": 0,
      "failures": 0,
      "note": "Both ordinary and acceptance native configurations pass strict diagnostics; no warning or test assertion suppressed."
    },
    {
      "name": "inherited-full-format-exception",
      "command": "prettier --check .",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "note": "Exactly one existing warning: committed immutable E-AI-109 is byte-identical to parent (SHA16e50704e76ed720fdf280a28167714c23079fd13facd803580ca0aced74e93a). The user previously explicitly accepted this exception; every changed file formats correctly. No evidence/baseline rewrite or diagnostic suppression."
    },
    {
      "name": "final-ledger-before-exact-gate-receipt",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "fail",
      "tests": 0,
      "failures": 1,
      "note": "Final Done validation correctly required the exact original completion-gate string in completedGates. Attach the unchanged gate verbatim after the actual native/catalog/portable/bundle proofs; no task requirement or validator changed."
    }
  ],
  "files": [
    "MIGRATION.md",
    "package.json",
    "pnpm-lock.yaml",
    "spec/src/SUMMARY.md",
    "spec/src/current/background.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/core/index.md",
    "src/components/repository/search/search-provider.ts",
    "src/lib/native/repository/indexed-search.ts",
    "src/lib/native/repository/search.ts",
    "src/lib/repository/history-index-controller.ts",
    "src/lib/repository/history-search-expression.ts",
    "src/lib/repository/indexed-search.ts",
    "src/lib/repository/search.ts",
    "src-tauri/src/host/repository/history_owner.rs",
    "src-tauri/src/host/repository/indexed_search.rs",
    "tests/renderer/repository-indexed-search.test.mjs",
    "scripts/validation/native-sources.json"
  ],
  "remaining": [],
  "completedGates": {
    "M16.6": "Desktop consumes the public shared History controls, observer and validators without duplicate policy; original cold native saved-search/context, missing source, paused capture, cache rebuild and storage relocation plus all affected service, renderer and catalog checks pass while native admission and accepted-call drain remain intact."
  }
}
```
