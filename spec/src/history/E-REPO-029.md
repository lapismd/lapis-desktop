# Native GitHub accounts for automatic vault backup

```json
{
  "id": "E-REPO-029",
  "tasks": ["M14", "M14.4"],
  "requirements": [
    "LD-REPO-005",
    "LD-REPO-002",
    "LD-DESK-003",
    "LD-HOST-001",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-GOV-004",
    "LD-MIG-002"
  ],
  "date": "2026-10-19",
  "result": "pending",
  "revision": "enclosing-change",
  "versions": {
    "jj": "0.45.1",
    "node": "26.9",
    "pnpm": "10.34.5",
    "sourceBase": "1d9d7c3eabb8a206517f6870801e3210db2e9dfe",
    "desktopBase": "d411f377",
    "sourceAccountsRevision": "52b2f24a"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/Forges.stories.ts",
    "catalog/support/repository/ForgeDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "docs/provenance.json",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-029.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/forges.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/repository/forges.rs",
    "src-tauri/src/repository/mod.rs",
    "src-tauri/tests/repository_forges.rs",
    "src/components/repository/backup/BackupField.svelte",
    "src/components/repository/backup/ForgeAccounts.svelte",
    "src/components/repository/backup/ForgeAuthorization.svelte",
    "src/components/repository/backup/forge-view.ts",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-status.ts",
    "src/lib/native/repository/forges.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/forge-accounts.ts",
    "src/lib/repository/forge-controller.ts",
    "src/lib/repository/history-reader.ts",
    "tests/renderer/repository-forges.test.mjs"
  ],
  "contractReview": "LD-REPO-005 adds desktop installation-owned forge accounts, separate native credential namespace/metadata and bounded worker commands. Only configured public OAuth identity is reused. Main-window admission and exact frames prevent renderer selection of native custody. LD-REPO-002 immutable read scope and original LD-DESK-003/HOST-001, catalog, migration gates remain unchanged. Production account/auth/field/controller presentation is copied/adapted from jj-store through public Design Core components; provenance retained.",
  "milestoneReview": "M14.3 is Partial with focused restore proofs and deferred cold actual-WebView acceptance. M14.4 is the only active stage. Accounts alone do not complete its remote setup/fresh-device restore gate. Full sync, search, storage/adoption, Forgejo and main integration remain required.",
  "scope": "GitHub device OAuth and PAT/Enterprise installation account management. No personal credential use, live forge effects, remote push, publication or integration into main. Network work cannot hold the vault lock or saved-file closure. Progress tracks fenced outstanding native calls through actual drain.",
  "runs": [
    {
      "name": "source",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 pnpm dev:cargo -- test -p jj-forge --test accounts",
      "result": "pass",
      "failures": 0,
      "note": "Seven existing native source account cases pass. Source evidence E-VAULT-BACKUP-004 records namespace composition and unchanged jj-store default."
    },
    {
      "name": "native-check-and-workers",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo check --manifest-path src-tauri/Cargo.toml --lib --bin lapis-desktop; cargo test --manifest-path src-tauri/Cargo.toml --test repository_forges",
      "result": "pass",
      "failures": 0,
      "note": "Native check and two actual account-worker cases pass. Tests inject private memory secrets and synthetic network transport. Busy poll cancellation prevents late credential persistence; vault work remains responsive. Informational linker unwind-size warning remains."
    },
    {
      "name": "native-frames",
      "command": "CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 cargo test --manifest-path src-tauri/Cargo.toml --bin lapis-desktop forge_frames_cannot_select_custody_or_caller_authority",
      "result": "pass",
      "failures": 0,
      "note": "One main-window command-frame test passes; unknown root/scope/service/window/generation/session/client-ID fields fail closed."
    },
    {
      "name": "renderer",
      "command": "node --test tests/renderer/repository-forges.test.mjs tests/governance/source-audit.test.mjs; pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Four account regressions and source audit tests pass, including slow begin/late-grant cancellation, busy-poll fencing, transient tokens, activity lifetime and exact transport frames. Strict types0errors/0warnings; both audits pass."
    },
    {
      "name": "types-initial",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 6,
      "note": "Initial Svelte state binding conflicted with the rune name. Renamed local state to snapshot and corrected authorization.state. Six errors/six warnings resolved; exact strict types then pass."
    },
    {
      "name": "catalog-initial",
      "command": "pnpm test:storybook catalog/plugins/repository/Forges.stories.ts",
      "result": "fail",
      "failures": 5,
      "note": "Initial five failures remained after a cold settled dependency cache. The Settings action is labelled by its field title and stays inside the canvas; menus/toasts portal to document body. Fixed selectors and awaited real pointer availability without bypassing assertions."
    },
    {
      "name": "catalog-followup",
      "command": "pnpm test:storybook catalog/plugins/repository/Forges.stories.ts",
      "result": "fail",
      "failures": 5,
      "note": "The initial selector repair exposed one visible-label accessibility mismatch and a menu portal query mistake; later tests inherited an open modal. Corrected Add GitHub account visible text and proper portal query. Next run: four pass/one failure because loading helper waited for an intentionally disabled Add button. Moved that wait to choose, retaining explicit loading skeleton acceptance."
    },
    {
      "name": "catalog-qualified",
      "command": "pnpm test:storybook catalog/plugins/repository/Forges.stories.ts; LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts -t \"Settings And Disable\"",
      "result": "pass",
      "failures": 0,
      "note": "Five account stories pass desktop/narrow in light/dark:20interaction/accessibility executions, each lane from a cold process. Empty accounts, transient PAT save, device activation, failure-toast recovery and representative skeleton all pass. Existing SettingsAndDisable also passes. Visual review/provider acceptance remain separate."
    },
    {
      "name": "bookkeeping-initial",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "41tasks/134evidence records and sixvalidators/156chapters/95requirements passed. Spec-first required an owning governance confirmation for the exact account permission audit; updated the existing scope note without weakening contracts."
    },
    {
      "name": "bookkeeping-qualified",
      "command": "pnpm spec:first; pnpm check:progress; pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Spec-first30protected files/sixcanonical chapters passes. Progress41tasks/134records, sixvalidators/156chapters/95requirements pass. Original cold native app, full-suite/provider and final integration gates remain open."
    }
  ],
  "remaining": [
    "Remote repository/branch configuration and fresh-device restore",
    "Automatic two-way sync and recoverable conflicts",
    "Historical text/path/metadata search, advanced storage/adoption and Forgejo",
    "Cold actual-WebView/provider/full-suite/platform/release qualification deferred by user",
    "Complete required implementation before main-workspace integration"
  ]
}
```
