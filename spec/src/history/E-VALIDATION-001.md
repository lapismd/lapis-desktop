# Docker-first portable validation and story composition

```json
{
  "id": "E-VALIDATION-001",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M8"],
  "requirements": [
    "LD-GOV-009",
    "LD-GOV-010",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-CAT-005",
    "LD-AI-001",
    "LD-POP-003",
    "LD-REPO-001",
    "LD-VAULT-003",
    "LD-VAULT-004",
    "LD-REPO-005",
    "LD-MIG-002"
  ],
  "versions": {
    "desktopBaseline": "5f165fc9223c3e5a9cb7c7985e406f9f2b5c85d0",
    "referenceNotes": "e293bf8f",
    "referencePlugins": "6cfcb148",
    "pnpm": "10.34.5",
    "nodeDocker": "24.15.0",
    "rust": "1.99.0",
    "playwright": "1.61.1",
    "archives": "24 explicit portable prerequisites; E-CORE-023 owns dependency identities"
  },
  "contractReview": "Portable lanes select isolated Docker by default with exact JJ snapshots/ancestry, bounded keyed caches and retained reports; native Mac WebView/OS qualification stays separate. Composition follows actual CSF factories and selected literal props to a real public or Desktop production subject. Local private archive projection is explicit and does not claim a working registry-only lock.",
  "milestoneReview": "M8 existing native/plugin completion and its historical evidence remain unchanged. This supports portable local tooling and current-dependency intake; M10.2/R2.3 live-provider recovery, migration defaults, distribution and visual approval are not completed by Docker.",
  "runs": [
    {
      "name": "missing-boundary-before",
      "command": "node --test tests/governance/validation.test.mjs tests/governance/storybook-parity.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Invocation fails before collection: neither requested new runner/guard test file exists."
    },
    {
      "name": "adaptation-first-run",
      "command": "node --test tests/governance/validation.test.mjs tests/governance/validation-native.test.mjs tests/governance/storybook-parity.test.mjs",
      "result": "fail",
      "tests": 47,
      "failures": 22,
      "note": "Initial copied path/compound-subject adaptations plus not-yet-routed manifest and CI fail. Subsequent guard runs had 19, then 2, then 0 failures. No product behavior or assertion was weakened."
    },
    {
      "name": "focused-runner-guard-native-source",
      "command": "node --test tests/governance/validation.test.mjs tests/governance/validation-native.test.mjs tests/governance/storybook-parity.test.mjs",
      "result": "pass",
      "tests": 50,
      "failures": 0
    },
    {
      "name": "per-mode-reports",
      "command": "node --test tests/governance/catalog-reports.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "complete-composition-inventory",
      "command": "node scripts/spec-validation/check-storybook-parity.mjs",
      "result": "pass",
      "families": 108,
      "failures": 0
    },
    {
      "name": "docker-smoke",
      "command": "pnpm validation:smoke",
      "result": "pass",
      "failures": 0,
      "note": "Remote omarchy Docker, exact source/archive install, pinned tools and both headless Chromium/WebKit. Run lapis-desktop-validation-6aa36909-7999-4eb5-9e13-65e926e56338."
    },
    {
      "name": "full-linux-image",
      "command": "pnpm validation:images -- --target full",
      "result": "pass",
      "failures": 0,
      "note": "Pinned Rust1.99 and Linux Tauri development libraries; no macOS artifact claim."
    },
    {
      "name": "baseline-catalog-interrupted",
      "command": "pnpm test:storybook",
      "result": "pending",
      "failures": 0,
      "completedCases": 52,
      "note": "Interrupted after7 completed files in first mode;6 derived_inert diagnostics prompted adoption of same fatal runtime guard before qualification. No full mode or full-suite pass claimed. Retained run1771ec6f-973f-4dff-95fc-23affac3bac3."
    },
    {
      "name": "drafts-fatal-guard-before",
      "command": "pnpm test:storybook -- catalog/plugins/ai/Drafts.stories.ts -t 'Reopen Without Sending'",
      "result": "fail",
      "failures": 1,
      "unhandledErrors": 1,
      "filteredCases": 5,
      "note": "Cold actual public Agent screen emits derived_inert from queued shared composer completion. Owner DesignCore/composer-suggestions.ts; source repair and consumer requalification pending."
    },
    {
      "name": "linux-resource-before",
      "command": "pnpm test:rust -- --test repository_original --test repository_admission",
      "result": "fail",
      "failures": 1,
      "tests": 0,
      "note": "Build fails before collection: ignored resources/lapis-ai absent. Portable full-worker test-only bundle.resources=[] overlay added; actual helper/bundle qualification remains separate."
    },
    {
      "name": "linux-deep-link-before",
      "command": "pnpm test:rust -- --test repository_original --test repository_admission",
      "result": "fail",
      "failures": 1,
      "tests": 0,
      "note": "After resource overlay, external deep-link2.6.2 fails compiling against rust-ini0.21.3 ParseOption. Lock selects latest unyanked compatible0.21.1; no crate/vendor patch. Mac dependency graph excludes this Linux parser."
    },
    {
      "name": "cache-overlay-regressions",
      "command": "node --test tests/governance/validation-native.test.mjs tests/governance/validation.test.mjs",
      "result": "pass",
      "tests": 20,
      "failures": 0
    },
    {
      "name": "linux-jj-fixtures-after",
      "command": "pnpm test:rust -- --test repository_original --test repository_admission",
      "result": "pass",
      "tests": 10,
      "failures": 0,
      "note": "StockJJ fixture selection uses JJ_STORE_TEST_STOCK_JJ or PATH. Exact cold remote run57b0368c-7e60-4082-833d-f64d0b569bf4."
    },
    {
      "name": "linux-complete-native-before",
      "command": "pnpm test:rust",
      "result": "fail",
      "tests": 65,
      "failures": 1,
      "note": "17 library and47 binary cases pass before inline native repository policy fixture fails with NotFound. Same fixture still used macOS-only JJ path. Runba5d41c8-9274-4527-bc9a-e856032ac4f1. Strict compiler warnings additionally exposed unused macOS-only window callback bindings and nonmacOS credential-backend fields; source uses existing OS guards without weakening native authority."
    },
    {
      "name": "complete-tooling-final",
      "command": "node --test tests/governance/validation.test.mjs tests/governance/validation-native.test.mjs tests/governance/storybook-parity.test.mjs tests/governance/catalog-reports.test.mjs tests/governance/storybook-runtime-warnings.test.mjs",
      "result": "pass",
      "tests": 63,
      "failures": 0,
      "note": "Includes mounted native-cache bootstrap exclusion, fatal runtime diagnostics, exact archive/source transfer and JavaScript metadata image-key regression."
    },
    {
      "name": "image-key-before-after",
      "command": "node --test --test-name-pattern='JavaScript metadata' tests/governance/validation-native.test.mjs",
      "result": "pass",
      "beforeFailures": 1,
      "tests": 1,
      "failures": 0,
      "note": "Image fingerprint uses actual recipe/tool-install bytes, exact packageManager/Rust pins and architecture. Script/dependency graph edits no longer create a new toolchain image; JavaScript lock/archive identities still key pnpm caches."
    },
    {
      "name": "linux-policy-after",
      "command": "pnpm test:rust -- --bin lapis-desktop host::repository::policy::tests::native_repository_policy_rechecks_window_session_origin_and_retained_grant",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "filteredCases": 47,
      "note": "Exact original policy target passes with portable stock-JJ selection. Run b189b187-d8ee-42bf-9a8c-55806b165496."
    },
    {
      "name": "linux-user-commands-before",
      "command": "pnpm test:rust",
      "result": "fail",
      "tests": 121,
      "failures": 5,
      "note": "116 completed cases pass before all five UserCommands cases fail with EBADF syncing cap-std O_PATH directory handles. Run 18deedce-822e-46b8-973f-4138784b73d1. Product repair reopens the owned directory capability as readable before sync; no assertion/error propagation weakened."
    },
    {
      "name": "lease-and-nested-dispatch-regressions",
      "command": "node --test tests/governance/validation-leases.test.mjs tests/governance/validation-dispatch.test.mjs",
      "result": "pass",
      "tests": 14,
      "failures": 0,
      "beforeFailures": 2,
      "note": "A missing lease boundary and bypassed native aggregate sharding fail before repair. Completed-state ownership, immutable cleanup IDs, unknown/preparing/paused lease retention and literal filtered dispatch pass after. Complete local tooling77 passes."
    },
    {
      "name": "cold-docker-tooling-final",
      "command": "pnpm validation:check",
      "result": "pass",
      "tests": 77,
      "failures": 0,
      "note": "Cold exact snapshot runs all tooling/guard/native-input/report/lease/dispatch regressions. Run a49394bd-d4ce-4712-93cf-02351cbd2f2d."
    },
    {
      "name": "cold-docker-smoke-final",
      "command": "pnpm validation:smoke",
      "result": "pass",
      "failures": 0,
      "note": "Fresh exact source, checksummed archives, pinned Node/pnpm/JJ/mdBook and real Chromium/WebKit. Run f3128531-1878-4dfb-a996-0f2046da2f46."
    },
    {
      "name": "user-commands-after",
      "command": "pnpm test:rust -- --test ai_user_commands",
      "result": "pass",
      "tests": 5,
      "failures": 0,
      "note": "Readable capability-directory sync preserves exclusive creation, parallel seeding, atomic replacement, UTF-8/read failures, name guards and symlink confinement. Run dba170e3-f853-4885-a05e-f35ad840f528."
    },
    {
      "name": "core-services-before",
      "command": "pnpm test:rust",
      "result": "fail",
      "tests": 122,
      "failures": 1,
      "note": "121 completed cases pass before core_backup_service sees EBADF applying mode bits through O_PATH handles. Remaining two Desktop conversions audited and replaced by readable relative capability handles. Run f1c77958-592a-43b5-814a-4dd865ab97e4."
    },
    {
      "name": "linux-normal-clippy-before-final",
      "command": "pnpm check:rust",
      "result": "pass",
      "failures": 0,
      "note": "Strict all-target normal configuration passes after initial OS guards. Run d6037dab-0e5d-45f4-a535-afcb99c7129d. Final fd fixes receive another check."
    },
    {
      "name": "linux-e2e-clippy-before",
      "command": "pnpm check:rust:e2e",
      "result": "fail",
      "failures": 1,
      "note": "Existing e2e configuration compiles except an unused macOS-only callback binding in acceptance/popouts.rs. Binding renamed with its guarded use; no Linux UI support or warning suppression added. Run 7fa50f10-381c-45fe-a061-440be78eb62b."
    },
    {
      "name": "core-services-after",
      "command": "pnpm test:rust -- --test core_backup_service --test core_turn_service",
      "result": "pass",
      "tests": 3,
      "failures": 0,
      "note": "Existing reload/turn lifecycle and new mode assertions pass after confined readable-handle permission updates. Run 813d0084-814d-4787-8e79-e8251d8aff87."
    },
    {
      "name": "permission-capabilities-before-after",
      "command": "pnpm test:rust -- --test vault_access",
      "result": "pass",
      "beforeFailures": 1,
      "tests": 9,
      "failures": 0,
      "note": "Full run reached191passes before denied-directory write unexpectedly succeeded under root DAC_OVERRIDE. Dropping all worker capabilities restores actual Unix DAC; exact9cases pass. Runs 9c60eb05-33c5-4203-80f2-9cc04fcd6f87 then ba1ad759-2640-45a3-ab08-c40ad5f06c7a."
    },
    {
      "name": "complete-linux-native-qualified",
      "command": "pnpm test:rust",
      "result": "pass",
      "tests": 238,
      "failures": 0,
      "note": "Complete Linux service suite across50targets; actual macOS native/OS gate remains separate. Run ca4c552e-3164-4d4c-995b-eaa837fa44da."
    },
    {
      "name": "strict-normal-e2e-linux",
      "command": "pnpm check:rust && pnpm check:rust:e2e",
      "result": "pass",
      "failures": 0,
      "note": "Strict all-target Clippy passes for normal and acceptance-feature configurations. Runs 49353f19-f8c3-4d4f-b7b2-ef96e15e4ded and a1c716d8-86ba-4841-b9d6-7001035f7890. Compilation is not native window qualification."
    }
  ],
  "files": [
    ".github/workflows/ci.yml",
    ".storybook/vitest.setup.ts",
    "AGENTS.md",
    "MIGRATION.md",
    "catalog/FixtureControls.svelte",
    "catalog/story-parity.json",
    "docs/governance-checkpoints.md",
    "docs/validation.md",
    "package.json",
    "scripts/catalog-tests.mjs",
    "scripts/spec-plugin.mjs",
    "scripts/spec-validation/check-storybook-parity.mjs",
    "scripts/spec-validation/story-parity/csf.mjs",
    "scripts/spec-validation/story-parity/presentation.mjs",
    "scripts/spec-validation/story-parity/render.mjs",
    "scripts/spec-validation/story-parity/svelte.mjs",
    "scripts/spec-validation/story-parity/syntax.mjs",
    "scripts/spec-validation/story-parity/values.mjs",
    "scripts/spec-validation/storybook-parity.mjs",
    "scripts/storybook-runtime-warnings.mjs",
    "scripts/validation.mjs",
    "scripts/validation/Dockerfile",
    "scripts/validation/caches.mjs",
    "scripts/validation/catalog.mjs",
    "scripts/validation/docker.mjs",
    "scripts/validation/images.mjs",
    "scripts/validation/install-tools.mjs",
    "scripts/validation/lanes.json",
    "scripts/validation/leases.mjs",
    "scripts/validation/model.mjs",
    "scripts/validation/native-sources.json",
    "scripts/validation/native-sources.mjs",
    "scripts/validation/paths.mjs",
    "scripts/validation/process.mjs",
    "scripts/validation/runs.mjs",
    "scripts/validation/smoke.mjs",
    "scripts/validation/source.mjs",
    "scripts/validation/worker.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/current/windows.md",
    "src-tauri/Cargo.lock",
    "src-tauri/src/acceptance/popouts.rs",
    "src-tauri/src/ai/configuration/secrets.rs",
    "src-tauri/src/ai/user_commands.rs",
    "src-tauri/src/host/repository/policy/tests.rs",
    "src-tauri/src/host/windows/mod.rs",
    "src-tauri/src/host/windows/related.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/tests/core_turn_service.rs",
    "src-tauri/tests/repository_admission.rs",
    "src-tauri/tests/repository_original.rs",
    "tests/governance/catalog-reports.test.mjs",
    "tests/governance/storybook-parity.test.mjs",
    "tests/governance/storybook-runtime-warnings.test.mjs",
    "tests/governance/validation-dispatch.test.mjs",
    "tests/governance/validation-leases.test.mjs",
    "tests/governance/validation-native.test.mjs",
    "tests/governance/validation.test.mjs"
  ],
  "remaining": [
    "Consumer dependency/catalog qualification continues in E-VALIDATION-002 and E-CORE-023; native macOS product/provider, distribution and visual gates remain separate."
  ]
}
```

Visual review and native product gates remain separate. No baselines changed.
