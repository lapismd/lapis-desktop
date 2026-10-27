# Composed Core reader and Tasks admission

```json
{
  "id": "E-CORE-038",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M16.8", "M16.9"],
  "requirements": [
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-TASK-001",
    "LD-TASK-002",
    "LD-TASK-003",
    "LD-CAT-003"
  ],
  "contractReview": "Compose the independently focused Core reader and Tasks source intakes without changing their engines. Register only the typed local Task command after declared owner prerequisites; retain the dedicated read client and App-owned editing/database client.",
  "milestoneReview": "M16.8/9 In progress. Bridge/selection/registration and native test fixtures are implemented; the older fixed cohort passes531Node/744AI/types/builds/audits and focused service/strict checks. Final integration must preserve newly qualified mainf276 fileicons and refreshed source packages before any complete native/catalog claim. All old/partial proof remains scoped; no Mac build has run.",
  "versions": {
    "reader": "b4839394a0f265f83a66c529492b2eb9dfd92eda",
    "tasks": "67b3aea21b5b9856e8fd4a46e44fc8b2e653d07a",
    "nativeNotesFocused": "0ff929b1fe53a790c1cd4af777d4e9879e46e15f",
    "apiArchive": "419b47c5b7857cb9e2106aacf519671deba7d34bb79f364f642a378c4db094b9",
    "historyArchive": "e714935f9f0a9365f74aaeca3aa67f8b0fef089e95ef107d24eabe915710b028",
    "latestDesktopMainToPreserve": "f276120b3039"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/desktop/NativeTasks.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/desktop/NativeTasksDemo.svelte",
    "scripts/check-bundle.mjs",
    "scripts/desktop-acceptance.mjs",
    "scripts/desktop-api-tests.mjs",
    "scripts/source-audit.mjs",
    "scripts/spec-contracts.mjs",
    "spec-validator.config.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/tasks.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CORE-036.md",
    "spec/src/history/E-CORE-037.md",
    "spec/src/history/E-CORE-038.md",
    "spec/src/history/E-CORE-039.md",
    "spec/src/history/core/index.md",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/shell.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/host/vault/tasks.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/src/vault/tasks.rs",
    "src-tauri/tests/core_tasks_service.rs",
    "src/components/views/Shell.svelte",
    "src/lib/desktop/shell-startup.ts",
    "src/lib/native/tasks/tasks.ts",
    "src/lib/notes/notes-session.ts",
    "tests/desktop/distribution-fixtures.mjs",
    "tests/desktop/plugin-entry.ts",
    "tests/desktop/tasks-entry.ts",
    "tests/desktop/tasks-installed-artifact.mjs",
    "tests/desktop/tasks-installed-assets.mjs",
    "tests/desktop/tasks-installed-driver.mjs",
    "tests/desktop/tasks-installed.test.mjs",
    "tests/desktop/tasks-owner.test.mjs",
    "tests/desktop/tasks-transport.ts",
    "tests/governance/validation.test.mjs",
    "tests/renderer/native-tasks.test.mjs",
    "tests/renderer/shell-startup.test.mjs",
    "tests/renderer/tasks-installed-fixture.test.mjs",
    "tests/renderer/tasks-transport.test.mjs"
  ],
  "remaining": [
    "Compose latest mainf276 fileicons/tooling without losing Reader/Tasks changes",
    "Adopt source-qualified combined Core/icon public package inputs; existing31 pre-icon inputs are historical",
    "Full Rust, complete catalog and actual macOS Original/installedTask gates on the final combined input"
  ],
  "runs": [
    {
      "name": "Pre-composition parent focused proof",
      "command": "ReaderE-CORE-035 and TasksE-CORE-036/037 immutable retained records",
      "result": "pass",
      "failures": 0,
      "detail": "Reader2exact/161affected/11governance/4service+bothstrict; Tasks4service/11Node. Parent gates remain pending."
    },
    {
      "name": "Focused combined native registration14a92f90",
      "command": "composition-focused frozen Docker worker",
      "result": "pass",
      "tests": 53,
      "failures": 0,
      "detail": "26renderer+11governance+16coldbrowser cases; types0errors/0warnings, ordinary/e2e strictRust,112family parity.31archives/116routes verified."
    },
    {
      "name": "Composed doc gatebd3d6464",
      "command": "final-docs frozen worker with explicit Reader base",
      "result": "fail",
      "failures": 1,
      "detail": "Spec-first required the file-authority chapter for native Task service intake; now updated. Format retains only previously accepted unchangedE-AI-109. Architecture/App/parity/progress/mdbook pass."
    },
    {
      "name": "First full portable Node cohort38a5abbd",
      "command": "pnpm test",
      "result": "fail",
      "tests": 522,
      "failures": 2,
      "detail": "520pass; two existing snapshot self-fixtures inherit an unrelated outer commit. Exact0dd37f97 repeats0/2; no AI/Rust/build command ran after failure."
    },
    {
      "name": "Exact snapshot fixture after isolated parent selectiond98dc797",
      "command": "node --test --test-name-pattern snapshot preserves a dirty JJ commit tests/governance/validation.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "detail": "Each disposable source repository exports its own explicit parent; same and separate-workspace restoration asserts exact base, dirty bytes and deletion. Outer revision is restored in finally."
    },
    {
      "name": "Complete validation self-fixture familyb7234ac3",
      "command": "node --test tests/governance/validation.test.mjs",
      "result": "pass",
      "tests": 17,
      "failures": 0
    },
    {
      "name": "Composed portable JS and static closurec2e040ea",
      "command": "composition-node frozen Docker worker",
      "result": "pass",
      "tests": 1275,
      "failures": 0,
      "detail": "531Node/744AI; strict types0errors/0warnings; renderer and static Storybook builds, architecture/App audits and112family parity pass. Rust/native aggregate waits final shared Core pin."
    },
    {
      "name": "Real installed public Task artifactd6108a88",
      "command": "public Tasks artifact builder in frozen Docker worker",
      "result": "pass",
      "failures": 0,
      "detail": "Same31 archives/116routes; full installed Task fingerprint,16 host imports and all4 emitted resource hashes verified. Signed fixture prepared in isolated native tree. No native app built or run."
    },
    {
      "name": "First catalog shard complete; operator-stop570cdf08",
      "command": "pnpm test:storybook; first canonical --shard=1/4 sub-invocation",
      "result": "pass",
      "tests": 480,
      "failures": 0,
      "detail": "All4theme/viewports120cases each complete. Serial controller stopped afterward(exit143) to avoid duplicate shard2; logs/operator-stop metadata retained. Remaining explicit shards2/3/4 still required."
    },
    {
      "name": "Checkpoint specification closure722c8dda",
      "command": "final-docs frozen worker with explicit Reader base",
      "result": "pass",
      "failures": 0,
      "detail": "Format retains only previously accepted unchangedE-AI-109; Rust format, architecture/App audits,112family parity,57task/314record progress and4spec lanes pass."
    },
    {
      "name": "Superseded pre-icon catalog operator stops c4e67af2/3ea2f56e",
      "command": "Stop only exact owned old-cohort workers; preserve logs/source/operator receipts",
      "result": "pending",
      "failures": 0,
      "detail": "Shard2:121+121 complete modes plus44 cases in incomplete dark mode; shard4:148complete-mode cases. Exited143 by operator, not OOM; no failure markers. Shard3 never started. These do not qualify final latest-main icon inputs."
    }
  ]
}
```
