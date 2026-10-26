# Staged Desktop native Tasks intake

```json
{
  "id": "E-CORE-036",
  "date": "2026-10-26",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M16.9"],
  "requirements": ["LD-TASK-001", "LD-TASK-002", "LD-TASK-003", "LD-CAT-003"],
  "contractReview": "Desktop selects the public native Tasks port only with Core metadata/editing prerequisites. The existing admitted App client, generated DTOs, Core journal and App observer retain authority; no alternate writer, provider engine or replay path is added.",
  "milestoneReview": "M16.9 remains In progress and depends on M16.7. Source aggregate823317ad and composed installed-plugin, native, provider/locale, full portable and catalog gates are pending. M16.7 receipts do not complete Tasks adoption.",
  "versions": {
    "desktopParent": "0dbf2307",
    "nativeNotesSource": "0ff929b1fe53a790c1cd4af777d4e9879e46e15f",
    "nativeNotesArchiveSha256": "6886d547263e5b7c1a8de97fb35eb2167097f1fd7c6d1cd42f38bbf8f6191644",
    "sourceAggregateReceipt": "823317ad - pending",
    "node": "26.9.0",
    "sharedHostRegistration": "Ignored tasks-host-integration.patch supplied to the Reader lane; composition required before runtime acceptance."
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/desktop/NativeTasks.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/desktop/NativeTasksDemo.svelte",
    "scripts/spec-contracts.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/tasks.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CORE-036.md",
    "spec/src/history/core/index.md",
    "spec-validator.config.mjs",
    "src/components/views/Shell.svelte",
    "src/lib/desktop/shell-startup.ts",
    "src/lib/native/tasks/tasks.ts",
    "src/lib/notes/notes-session.ts",
    "src-tauri/src/host/shell.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/host/vault/tasks.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/src/vault/tasks.rs",
    "src-tauri/tests/core_tasks_service.rs",
    "tests/desktop/tasks-owner.test.mjs",
    "tests/renderer/native-tasks.test.mjs",
    "tests/renderer/shell-startup.test.mjs"
  ],
  "runs": [
    {
      "name": "exact-native-tasks-before",
      "command": "node --import tsx --test tests/renderer/native-tasks.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Missing new adapter module before production implementation; no Task fallback existed."
    },
    {
      "name": "exact-native-tasks-after",
      "command": "node --import tsx --test tests/renderer/native-tasks.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All3 typed-admission/no-replay/prerequisite cases pass."
    },
    {
      "name": "affected-startup-transport",
      "command": "node --import tsx --test tests/renderer/native-tasks.test.mjs tests/renderer/shell-startup.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All9 cases pass."
    },
    {
      "name": "focused-native-service",
      "command": "cargo test --locked --manifest-path src-tauri/Cargo.toml --test core_tasks_service",
      "result": "pending",
      "failures": 0,
      "note": "Waiting for a coordinated focused Docker slot on the immutable source cohort."
    },
    {
      "name": "final-exact-native-task-transport",
      "command": "node --import tsx --test tests/renderer/native-tasks.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All5 native transport/public observer cases pass, including passive detach and retained uncertain identity."
    },
    {
      "name": "final-affected-native-tasks-startup",
      "command": "node --import tsx --test tests/renderer/native-tasks.test.mjs tests/renderer/shell-startup.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All11 cases pass."
    },
    {
      "name": "focused-rust-infrastructure-attempts",
      "command": "node scripts/validation.mjs run test:rust -- --test core_tasks_service",
      "result": "fail",
      "failures": 2,
      "note": "Both launch attempts failed before container creation: configured Docker host192.168.1.57 SSH port22 returned Connection refused. Zero compiler or test cases ran. This is not a product-test failure and no host fallback was used."
    },
    {
      "name": "source-format",
      "command": "prettier --check changed TS/Svelte/test files; rustfmt --check --edition2024 --config skip_children=true changed Rust files",
      "result": "pass",
      "failures": 0,
      "note": "Formatting passes. Rustfmt confirms parseability only; Rust compilation is unexecuted."
    },
    {
      "name": "production-component-parse",
      "command": "Svelte compiler generate=false for NotesDemo.svelte,NativeTasksDemo.svelte,Shell.svelte",
      "result": "pass",
      "failures": 0,
      "note": "All3 components compile without warnings; this is not browser or type acceptance."
    },
    {
      "name": "story-composition",
      "command": "node scripts/spec-validation/check-storybook-parity.mjs",
      "result": "pass",
      "failures": 0,
      "note": "112 families,0 findings; four new stories are unexecuted and visual-pending."
    },
    {
      "name": "bookkeeping",
      "command": "node scripts/progress.mjs",
      "result": "pass",
      "failures": 0,
      "note": "56 tasks,310 evidence records; bookkeeping only."
    },
    {
      "name": "canonical-document-limits",
      "command": "Check every changed spec Markdown file against400physical lines/32768UTF8 bytes",
      "result": "pass",
      "failures": 0,
      "note": "Tasks has its own registered canonical chapter; existing chapters remain within both limits."
    }
  ],
  "remaining": [
    "Source aggregate823317ad and verified compatible current public archives.",
    "Shared host command/permission integration and composed focused Rust checks; Docker SSH refused both pre-container launch attempts, with zero tests executed.",
    "Installed Tasks bundle, provider/locale, explicit disable, passive detach/recovery and cold native acceptance.",
    "Complete affected/full catalog, ordinary/e2e strict checks/builds and specification gates in composed Desktop cohort."
  ]
}
```

The new transport and startup selection are source-only staging. The native
service tests, actual WebView tests and production-component stories are added
for the composed cohort and have not yet been executed. No application window,
Mac build, full catalog or broad validation job was launched in this lane.
