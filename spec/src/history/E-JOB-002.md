# Combined credentials and background jobs qualification

```json
{
  "id": "E-JOB-002",
  "date": "2026-11-25",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-JOB-001",
    "LD-JOB-002",
    "LD-JOB-003",
    "LD-JOB-004",
    "LD-JOB-005",
    "LD-GOV-004",
    "LD-TASK-001",
    "LD-TASK-002",
    "LD-TASK-003"
  ],
  "files": [
    ".changeset/plugin-background-jobs.md",
    ".github/dependency-automation/artifact-projection.json",
    "catalog/COVERAGE.md",
    "catalog/plugins/background-jobs/Settings.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/background/jobs.ts",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/ci-install.mjs",
    "scripts/ci-sources.json",
    "scripts/native-family-inventory.json",
    "scripts/plugin-host-modules.ts",
    "scripts/plugin-jobs-native-tests.mjs",
    "scripts/source-audit.mjs",
    "scripts/validation/Dockerfile",
    "scripts/validation/lanes.json",
    "scripts/validation/model.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/current/ai.md",
    "spec/src/current/background.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/integration.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/navigation.md",
    "spec/src/current/plugins.md",
    "spec/src/current/tasks.md",
    "spec/src/history/E-JOB-001.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-01.md",
    "spec/src/verification/background-jobs.md",
    "spec/src/verification.md",
    "src/lib/desktop/shell-startup.ts",
    "src/lib/native/background-jobs/jobs.ts",
    "src/lib/notes/notes-recovery.svelte.ts",
    "src/lib/notes/notes-session.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/acceptance/mod.rs",
    "src-tauri/src/acceptance/vault_admission.rs",
    "src-tauri/src/database/indexing.rs",
    "src-tauri/src/host/integration/services.rs",
    "src-tauri/src/host/lifecycle.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/shell.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/vault/jobs.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/vault/services/background.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/src/vault/tasks.rs",
    "src-tauri/tauri.e2e.conf.json",
    "src-tauri/tests/background_jobs.rs",
    "src-tauri/tests/core_tasks_service.rs",
    "src-tauri/tests/database_indexing.rs",
    "tests/ai/native/notes-session-transport.test.ts",
    "tests/desktop/background-jobs.test.mjs",
    "tests/desktop/editing-recovery.test.mjs",
    "tests/desktop/jobs-entry.ts",
    "tests/desktop/metadata-owner.test.mjs",
    "tests/desktop/navigation-metadata.test.mjs",
    "tests/desktop/released-job-artifact.mjs",
    "tests/desktop/tasks-owner.test.mjs",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/native-families.test.mjs",
    "tests/governance/profile-registry.test.mjs",
    "tests/governance/validation-native.test.mjs",
    "tests/renderer/background-jobs.test.mjs",
    "tests/renderer/native-tasks.test.mjs",
    "tests/renderer/plugin-host-modules.test.mjs",
    "tests/renderer/shell-startup.test.mjs",
    "vite.config.ts",
    "spec/src/history/E-JOB-002.md"
  ],
  "contractReview": "Desktop owns native IPC and window/OS policy; Server Core owns scheduling, vault-scoped jobs, checkpoints and guarded writes. Native metadata becomes the default and explicit renderer compatibility denies job controls. Public packages resolve through registry semver.",
  "acceptanceReview": "Combined source passes all eleven real native cases,975 Node,749 AI and295 Rust executions plus production build. E-JOB-001 retains the pre-credential2180 catalog cases. Final checks and exact-head hosted catalog/CI remain required; optional macOS system alerts are separately unqualified.",
  "versions": {
    "api": "0.6.16",
    "workspace": "0.4.11",
    "appProfile": "0.3.1",
    "serverSource": "b8824134a792cbd0aad449f9c02e659b28e2a88a",
    "desktopBase": "641de0857f535c102729c78beaac6604beb78b9e",
    "nativeRun": "a5e08a8c-e691-4e50-ad8e-6f497b17f4a4",
    "nativeSource": "4f7ccbf71e1df2b4e4fc261dfa8dd4ed933829da",
    "nativeExecutableSha256": "96c8a341f98e4ade7ed8d38f57e0bb8733eed501a241eefb8270e701cd545389"
  },
  "runs": [
    {
      "name": "Combined lock refresh",
      "command": "Omarchy cargo update --workspace; pnpm install --lockfile-only",
      "result": "fail",
      "failures": 1,
      "detail": "Cargo refresh succeeded and changed only six Server git package identities. Unprojected pnpm tried unpublished private AI and returned404. Repeat the existing public-only lock generation; preserve tracked AI semver and its checksummed validation overlay."
    },
    {
      "name": "First combined check:all",
      "command": "Omarchy pnpm check:all; runbd2b40fc-e616-46c1-9975-988f2d6bb1d2",
      "result": "fail",
      "failures": 1,
      "detail": "Specification/source checks, Svelte zero warnings and normal/e2e strict Clippy pass. Formatter rejects one two-line prose wrap in E-JOB-001. Whitespace-only correction prepared; pending user exception for immutable evidence. original commit ea32e0e2 and receipt facts unchanged. Original receipt SHA256 942ee304804bccd66f9053b8a703d54f3cc952dead49e61c7728df4752714dbf"
    },
    {
      "name": "Immutable receipt guard",
      "command": "Omarchy pnpm check:all; run43a49c3d-3025-4426-9a4e-9e84d2758f81",
      "result": "fail",
      "failures": 1,
      "detail": "Validator rejects the two-line whitespace correction to committed E-JOB-001. Original bytes restored; a narrow unpublished-commit formatting exception is requested. Neither formatter nor immutability guard is weakened."
    },
    {
      "name": "Combined native default cohort",
      "command": "Omarchy pnpm test:plugin-jobs:native; runa5e08a8c-e691-4e50-ad8e-6f497b17f4a4",
      "result": "pass",
      "tests": 11,
      "passed": 11,
      "failures": 0,
      "detail": "No skips; actual production GTK/WebKit/X11 window, native metadata/Search/Graph, editing/Tasks ownership, hidden jobs and explicit Quit drain, unchanged released Tasks0.4 digest with101 tasks, checkpoint/one persistent notification, cold restart and real planner completion/Logbook."
    },
    {
      "name": "Combined full unit suites",
      "command": "Omarchy pnpm test; rund925647c-9b83-4038-8dd1-8018493795ab",
      "result": "pass",
      "failures": 0,
      "detail": "975 governance/renderer,749 AI and295 Rust passing executions. Two ignored Rust helper entries execute through their parent subprocess cases, without a waived assertion."
    },
    {
      "name": "Combined production renderer build",
      "command": "Omarchy pnpm build; rund6a35e9c-9089-45ac-85a9-3cf721396b91",
      "result": "pass",
      "failures": 0,
      "detail": "Production renderer build succeeds. Retained Rollup pure-comment/large-chunk warnings are not new failures."
    },
    {
      "name": "Combined evidence validation",
      "command": "Omarchy pnpm check:evidence; rune2e074bd-b742-4fe0-9a7d-494ee0e2931d",
      "result": "pass",
      "failures": 0,
      "detail": "543 records validated; original E-JOB-001 bytes restored and both integration parents retained."
    },
    {
      "name": "Approved final combined check",
      "command": "Omarchy pnpm check; run504fb6e5-bf90-45c9-8b24-7d4fdc5651e7",
      "result": "pass",
      "failures": 0,
      "detail": "Canonical source/spec audits,118 story families with zero findings, Svelte zero errors/warnings, normal/e2e strict Clippy and full Prettier/Rust formatting pass after the approved two-line amendment."
    },
    {
      "name": "Approved final canonical spec check",
      "command": "Omarchy pnpm spec:check; run88aa1711-cca7-4528-9b23-8c95f785888a; pnpm validation collect retry",
      "result": "pass",
      "failures": 0,
      "detail": "All five lanes pass with worker exit0. Initial local report download hits ENOSPC; complete remote report retained. Collection retry after temporary inputs release succeeds and collects the full book/result/logs."
    },
    {
      "name": "Approved final evidence check",
      "command": "Omarchy pnpm check:evidence; run7c42319c-2526-470d-8519-c9e69db81100",
      "result": "pass",
      "failures": 0,
      "detail": "All543 records validate with amended feature and credential main as immediate integration parents. Formatting and immutability guards remain unchanged."
    }
  ],
  "remaining": [
    "Require green hosted CI, including the combined full catalog, at the final reviewed head before merge.",
    "Optional macOS system-alert delivery remains separately unqualified."
  ]
}
```

The user authorized fixing the formatting exception and completing push/merge
on2026-11-25. The unpublished feature commit was amended only to rewrap two
prose lines in E-JOB-001; all facts and failed attempts remain. Original commit
ea32e0e272bc7d68f57cb9c194b645cf90b9f87f remains recoverable through local
bookmark archive/plugin-jobs-preformat-20261125. Corrected feature a59b697f has
no product code delta from the qualified feature. Integration preserves
credential main641de085, API0.6.16 and E-REPO-060/061/062. Coreb8824134 includes
both features with an empty job-engine diff against758084f3. No guards were
changed and no native caches migrated across changed source/lock keys.
