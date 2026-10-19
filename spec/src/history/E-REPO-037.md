# Original repository history sources and recoverable adoption

```json
{
  "id": "E-REPO-037",
  "tasks": ["M14", "M14.7"],
  "requirements": [
    "LD-REPO-005",
    "LD-DESK-003",
    "LD-HOST-001",
    "LD-CAT-003",
    "LD-GOV-004",
    "LD-MIG-002"
  ],
  "date": "2026-10-19",
  "result": "pending",
  "revision": "enclosing-change",
  "versions": {
    "sourceAdoption": "d45b03eb",
    "desktopParent": "cc811c94",
    "jj": "0.45.1",
    "git": "2.55.0",
    "rust": "1.99.0",
    "node": "v26.9.0",
    "pnpm": "10.34.5"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/HistoryAdoption.stories.ts",
    "catalog/support/repository/AdoptionDemo.svelte",
    "docs/automatic-vault-backup-progress.md",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-037.md",
    "src/components/repository/RepositoryLogHeader.svelte",
    "src/components/repository/RepositoryOperations.svelte",
    "src/components/repository/RepositoryPanel.svelte",
    "src/components/repository/RepositorySourcePicker.svelte",
    "src/components/repository/backup/AdoptionSettings.svelte",
    "src/components/repository/backup/BackupSettings.svelte",
    "src/components/repository/backup/adoption-settings.ts",
    "src/components/repository/backup/forge-view.ts",
    "src/components/repository/blame/blame-view.ts",
    "src/components/repository/operation-view.ts",
    "src/components/repository/repository-feedback.ts",
    "src/components/repository/repository-navigation.ts",
    "src/components/repository/repository-plugin.ts",
    "src/components/repository/repository-view.ts",
    "src/lib/native/repository/adoption.ts",
    "src/lib/native/repository/preparation-queue.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/adoption-controller.ts",
    "src/lib/repository/adoption.ts",
    "src/lib/repository/history-reader.ts",
    "src/lib/repository/history-source.ts",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/adoption.rs",
    "src-tauri/src/host/repository/backup_provider.rs",
    "src-tauri/src/host/repository/commands.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/sources.rs",
    "src-tauri/src/host/repository/storage.rs",
    "src-tauri/src/repository/mod.rs",
    "src-tauri/src/repository/original.rs",
    "src-tauri/tests/repository_original.rs",
    "tests/renderer/repository-adoption.test.mjs",
    "tests/renderer/repository-native.test.mjs",
    "tests/renderer/repository-source-navigation.test.mjs",
    "tests/renderer/repository-sources.test.mjs"
  ],
  "contractReview": "LD-REPO-005 adds explicit recorded Git-ancestry import into independent backup and source-specific pinned JJ/Op Log/blame readers. LD-DESK-003/HOST-001 retain native paths, main-only frames, opaque physical-vault/window read tokens, all-writer guards and worker lifetime. Native source replacement fails before changing the shared vault lease. LD-CAT-003 maps production source/adoption loading, empty, failure and recovery states. Extracting existing toast/copy feedback keeps its contract and identities unchanged. LD-GOV-004/MIG-002 gates remain unchanged.",
  "milestoneReview": "Only M14.7 is Active. Earlier stages stay Partial. Adoption/source selection have focused implementation; native lifecycle/provider acceptance and main integration remain open. User-deferred full Rust/UI/catalog, platform and release suites remain distinct from focused proof.",
  "scope": "Independent original read tokens coexist with managed backup. Source-specific tabs persist their source and pin; linked navigation keeps it, while capture/search/status/file history remain backup-scoped. A shared preparation queue covers both clients. Explicit adoption runs through the native capture worker, protects editor writers, preserves files/source metadata and saves the original UI recovery request before native admission. Resume/stop and source-unavailable recovery preserve identity; pausing capture is respected. No user repository or main workspace was migrated.",
  "runs": [
    {
      "name": "source-adoption",
      "command": "Source E-VAULT-BACKUP-013",
      "result": "pass",
      "failures": 0,
      "note": "Source d45b03eb qualifies14native capture/storage/adoption and10worker/lifetime/restore/search cases plus strict affected Clippy. Original repository bytes, recorded Git ancestry, current files, prepared/published recovery and stop-before-delivery fencing pass. Native operations/evolution stay in the original repository."
    },
    {
      "name": "safe-build-cache-maintenance",
      "command": "pnpm dev:disk; guarded build-storage active/cleanTarget helpers; pnpm dev:clean -- --dry-run; pnpm dev:clean -- --apply",
      "result": "pass",
      "failures": 0,
      "note": "Guarded checks proved the isolated desktop target idle before cleaning4632268800bytes. After native rebuild, guarded source workspace cleanup recovered29.7to30.3GiB. No running target, older macro worker, vault data, review app or source was removed. The pending older-target cleanup permission was not used."
    },
    {
      "name": "native-source-services",
      "command": "CARGO_INCREMENTAL=0 cargo test --manifest-path src-tauri/Cargo.toml --test repository_original --test repository_admission --test repository_backup --test repository_storage",
      "result": "pass",
      "failures": 0,
      "note": "All15actual native service tests pass. Original/default source IDs and metadata stay separate; read tokens cannot authorize writers or another window; replacement/reload/close revoke old scopes. Native storage and saved-file watching regressions pass. history-adoption-native.log."
    },
    {
      "name": "native-permission-frames",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=4 cargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop host::repository",
      "result": "pass",
      "failures": 0,
      "note": "All12exact native frame/admission tests pass, including the two new commands. Injected paths, token/source authority, window and generation are rejected. history-adoption-frames.log."
    },
    {
      "name": "renderer-before",
      "command": "node --test tests/renderer/repository-sources.test.mjs tests/renderer/repository-native.test.mjs; node --experimental-transform-types --test <affected files>; pnpm exec tsx --test <affected files>",
      "result": "fail",
      "failures": 5,
      "note": "Initial fixture had one malformed failed-status frame, then lacked the Tauri Channel window stub. Node26 raw strip-only parsing rejects parameter properties; its old transform-types flag is unsupported. First tsx run then exposes synchronous adoption validation escaping a promised API; make the adapter async and retain its reject-before-invoke assertion. These are corrected before focused qualification."
    },
    {
      "name": "renderer-qualified",
      "command": "pnpm exec tsx --test tests/renderer/repository-*.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Final146tests pass. Independent lazy native source admission survives failed backup startup, shares preparation and drains late opens. Navigation never applies an original pin to a backup tab. Adoption persists the original request before work, handles canceled editor guards, unknown outcomes/restart, source-unavailable recovery and closure. history-adoption-renderer-final.log."
    },
    {
      "name": "type-architecture-before",
      "command": "pnpm check:types; node scripts/source-audit.mjs",
      "result": "fail",
      "failures": 5,
      "note": "New navigation initially uses the wrong legacy/core WorkspaceLeaf surface, then leaves one wrong argument and story inspection on legacy leaves. The plugin also exceeds the300counted-line cap. Use the existing host workspace navigation/viewState boundary and extract unchanged operational feedback. Final strict types and ownership audits pass without casts or weakened limits."
    },
    {
      "name": "catalog-navigation-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/HistoryAdoption.stories.ts",
      "result": "fail",
      "failures": 6,
      "note": "Two initial cold runs each have3failing source-navigation stories while6adoption stories pass. Correct host workspace navigation and source-state inspection. history-adoption-catalog.log and history-adoption-catalog-fixed.log."
    },
    {
      "name": "catalog-a11y-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/HistoryAdoption.stories.ts",
      "result": "fail",
      "failures": 3,
      "note": "Interactions pass but three final states fail axe label-content-name-mismatch. Include visible Backup/Original text in the source trigger name and let command options expose their complete visible text. No accessibility rule is weakened. history-adoption-catalog-current.log."
    },
    {
      "name": "catalog-new-stories",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/HistoryAdoption.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Nine new production stories pass all interactions and axe. history-adoption-catalog-final.log. Added unreadable-original recovery is qualified in the final matrix."
    },
    {
      "name": "catalog-matrix-before",
      "command": "pnpm test:storybook catalog/plugins/repository/HistoryAdoption.stories.ts catalog/plugins/repository/LivePlugin.stories.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/repository/FileHistory.stories.ts catalog/plugins/repository/Search.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "The new unavailable-original fixture omits its pending request, so its stop assertion fails;31other cases pass. Fix only that fixture to represent the declared pending state. history-adoption-matrix.log."
    },
    {
      "name": "native-final-service-regression",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=4 cargo test --manifest-path src-tauri/Cargo.toml --locked --test repository_original --test repository_admission --test repository_backup --test repository_storage",
      "result": "pass",
      "failures": 0,
      "note": "All15native service tests pass again after adding explicit proof that a replaced original repository cannot suspend an independent managed-backup read scope. history-adoption-native-final.log."
    },
    {
      "name": "native-strict-clippy",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=4 cargo clippy --manifest-path src-tauri/Cargo.toml --locked --lib --bin lapis-desktop --test repository_original --test repository_admission --test repository_backup --test repository_storage -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Focused native library/binary/service strict Clippy passes. history-adoption-clippy.log. Full/e2e/platform checks remain separate."
    },
    {
      "name": "catalog-matrix-qualified",
      "command": "pnpm test:storybook catalog/plugins/repository/HistoryAdoption.stories.ts catalog/plugins/repository/LivePlugin.stories.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/repository/FileHistory.stories.ts catalog/plugins/repository/Search.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "32stories x4fresh desktop/narrow and light/dark processes =128interaction/accessibility executions pass. This includes10new source/adoption stories, actual plugin navigation, source-specific tabs, linked history/blame/search consumers, Markdown/tags and recovery feedback. history-adoption-matrix-final.log. Visual baselines remain pending."
    },
    {
      "name": "final-ownership-types-governance",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm exec prettier --check <changed supported files>; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "Strict Svelte0errors/0warnings, exact source/App audits,41tasks/142records, sixvalidators/164chapters/95requirements and spec-first44protected files/six owning chapters pass. Changed-file and Rust formatting pass. Full suites, native actual-app/provider, release/platform and main integration remain open."
    }
  ],
  "remaining": [
    "Cold actual-app backup/restore/sync/source lifecycle acceptance and live-provider qualification remain open.",
    "Integrate verified implementation into main workspaces while preserving unrelated work.",
    "Full repository Rust/UI/catalog and platform/release checks remain deferred; no visual baseline approval or publication."
  ]
}
```
