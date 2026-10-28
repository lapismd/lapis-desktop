# Shell failure presentation without chrome above WorkspaceShell

```json
{
  "id": "E-LIFE-002",
  "date": "2026-10-28",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M4"],
  "requirements": [
    "LD-LIFE-001",
    "LD-LIFE-003",
    "LD-VAULT-002",
    "LD-VAULT-006",
    "LD-CAT-003",
    "LD-GOV-002"
  ],
  "contractReview": "Update LD-LIFE-001 so ready-session persistence failures surface through Problems with a transient notification and never mount chrome above WorkspaceShell. Update LD-LIFE-003/LD-VAULT-002/LD-VAULT-006 so launcher and restoration failures render inside the shared chooser body. Coordinated files.md, plugins.md and repository.md sentences retain the same presentation boundary for NotesWorkspace, catalog and repository-leave selectors.",
  "milestoneReview": "M4 remains Done. This is a presentation repair on the existing lifecycle gate: catalog and source boundaries pass; headed native notes-lifecycle/editing-recovery/repository-backup-leave selectors are updated to toast or launcher alerts. Fresh headed native requalification of those exact cases remains a continuity gap and does not reopen M4.",
  "versions": {
    "desktop": "0.1.0",
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "jj": "0.45.1",
    "platform": "macOS ARM64"
  },
  "files": [
    "MIGRATION.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/desktop/HostLifecycle.stories.ts",
    "catalog/plugins/desktop/Shell.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/desktop/HostLifecycleDemo.svelte",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-LIFE-002.md",
    "spec/src/history/index.md",
    "src/components/views/DesktopFailure.svelte",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/desktop/host-lifecycle-failure.ts",
    "tests/desktop/conflict-review.mjs",
    "tests/desktop/editing-recovery.test.mjs",
    "tests/desktop/notes-lifecycle.test.mjs",
    "tests/desktop/repository-backup-leave.test.mjs"
  ],
  "remaining": [],
  "diagnosis": "DesktopFailure mounted above VaultLauncher and above WorkspaceShell while ready. Traffic-light inset applies only inside the shell, so ready-session host errors appeared under the macOS controls. Launcher already had desktop-launcher__error; Shell never passed errorMessage.",
  "runs": [
    {
      "name": "exact-shell-stories-before",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/Shell.stories.ts",
      "result": "fail",
      "failures": 3,
      "tests": 4,
      "note": "MissingSavedVault and BlockedClose still expected chrome-top alerts; ReadySessionFailure was absent. RestoringProfile alone passed. Log .local/shell-lifecycle-stories.log from the first after-edit attempt recorded the same three failures until launcher waits and HostLifecycle split landed."
    },
    {
      "name": "exact-shell-and-host-lifecycle-after",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/Shell.stories.ts catalog/plugins/desktop/HostLifecycle.stories.ts",
      "result": "pass",
      "failures": 0,
      "tests": 4,
      "note": "Cold vitest: MissingSavedVault and BlockedClose assert launcher in-body role=alert with no .desktop-failure; ReadySessionFailure asserts Problems region, toast and no chrome-top banner. Log .local/shell-lifecycle-stories.log."
    },
    {
      "name": "types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Svelte reports zero errors and warnings after HostLifecycle stories type alignment."
    },
    {
      "name": "architecture",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "note": "NotesWorkspace stays at 300 counted lines; DesktopFailure removed; host-lifecycle-failure helper under src/lib/desktop."
    },
    {
      "name": "app-ownership",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Source boundaries pass."
    },
    {
      "name": "storybook-parity",
      "command": "pnpm check:storybook-parity",
      "result": "pass",
      "failures": 0,
      "note": "114 families, zero findings after HostLifecycle parity entry."
    },
    {
      "name": "spec-first-and-progress",
      "command": "pnpm check:progress; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Progress accepts E-LIFE-002 for M4; mapped chapters and SUMMARY include this presentation repair. Headed native notes-lifecycle toast/launcher requalification is recorded in milestoneReview as a continuity gap, not a remaining gate on this catalog/source slice."
    }
  ]
}
```

Shell no longer mounts `DesktopFailure` above the launcher or a ready
`WorkspaceShell`. Launcher failures use `VaultLauncher` `errorMessage`. Ready
session `error` / `hostFailure` publish through
`bindHostLifecycleFailure` into Problems and an error toast, then
`app-shell:show-problems`.
