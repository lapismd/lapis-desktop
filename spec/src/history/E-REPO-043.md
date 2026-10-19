# Upstream footer actions, counts and repository location

The footer popover now offers separate Fetch/Pull/Push with shadcn tooltips and
last-fetched incoming/outgoing ancestry counts. Plugin Settings displays the
native-selected external history directory and its guarded OS reveal action.

```json
{
  "id": "E-REPO-043",
  "date": "2026-10-19",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14", "M14.3", "M14.5", "M14.7"],
  "requirements": ["LD-REPO-005", "LD-REPO-002", "LD-CAT-003"],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "jj": "0.45.1",
    "platform": "macOS ARM64",
    "desktopParent": "8b6552cc",
    "sourceEvidence": "E-VAULT-BACKUP-016",
    "sourceCommit": "c143d304"
  },
  "contractReview": "LD-REPO-005 now governs separately gated manual Fetch/Pull/Push, last-fetched immutable incoming/outgoing counts and native-selected external storage display/reveal. LD-REPO-002 admission and pins remain unchanged. Native work stays on bounded workers with existing App progress; renderer frames cannot carry paths/credentials. Extracted apply/publication/notification responsibilities retain guarded recovery and original request identity. Canonical vault-backup, repository/navigation, desktop and catalog chapters updated.",
  "milestoneReview": "M14/M14.3/M14.5/M14.7 remain Partial at their original cold native-app/provider/wider qualification gates. This focused usable-UI addition is complete; it does not qualify live forge credentials, real remote publication or OS file-manager launch. Visual baselines remain pending.",
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/HistoryStorage.stories.ts",
    "catalog/plugins/repository/UpstreamStatus.stories.ts",
    "catalog/support/repository/StorageDemo.svelte",
    "catalog/support/repository/UpstreamDemo.svelte",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/E-REPO-043.md",
    "spec/src/history/index.md",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/repository/remote.rs",
    "src-tauri/src/host/repository/remote_counts.rs",
    "src-tauri/src/host/repository/storage.rs",
    "src-tauri/src/repository/storage.rs",
    "src-tauri/tests/repository_storage.rs",
    "src/components/repository/RepositoryBackupStatus.svelte",
    "src/components/repository/RepositoryUpstreamActions.svelte",
    "src/components/repository/RepositoryWorkingCopyStatus.svelte",
    "src/components/repository/backup/StorageSettings.svelte",
    "src/components/repository/repository-status.ts",
    "src/lib/native/repository/remote.ts",
    "src/lib/native/repository/storage.ts",
    "src/lib/repository/remote.ts",
    "src/lib/repository/storage-controller.ts",
    "src/lib/repository/storage.ts",
    "src/lib/repository/sync-application.ts",
    "src/lib/repository/sync-controller.ts",
    "src/lib/repository/sync-publication.ts",
    "src/lib/repository/sync.ts",
    "tests/renderer/repository-remote.test.mjs",
    "tests/renderer/repository-storage.test.mjs",
    "tests/renderer/repository-sync.test.mjs"
  ],
  "runs": [
    {
      "name": "new-controller-before",
      "command": "node --import tsx --test tests/renderer/repository-sync.test.mjs",
      "result": "fail",
      "failures": 3,
      "note": "New separate Fetch/Pull/Push cases initially failed. .local/verification/footer/upstream-controller-before.log."
    },
    {
      "name": "storage-reveal-before",
      "command": "node --import tsx --test tests/renderer/repository-storage.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Missing reveal controller reproduced before implementation. storage-reveal-before.log."
    },
    {
      "name": "renderer-final",
      "command": "node --import tsx --test tests/renderer/repository-sync.test.mjs tests/renderer/repository-storage.test.mjs tests/renderer/repository-remote.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "31 cases pass: separate intent, paused manual actions, guarded apply/recovery, pull conflict no-publish, read-only/pending push refusal, confirmed push survives failed optional count refresh, path-free reveal and DTO totals. upstream-renderer-qualified.log. Earlier combined 23/24 cases also passed."
    },
    {
      "name": "ui-before-and-intermediate",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/repository/UpstreamStatus.stories.ts catalog/plugins/repository/HistoryStorage.stories.ts",
      "result": "fail",
      "failures": 5,
      "note": "Initial 5 failed/1 passed with tooltip/a11y plus a dependency optimizer import reload; next combined run 5 failed/9 passed. After stable trigger composition and text-based accessible names: 1 failed/13 passed because tooltip content lacked the role asserted by the interaction. Added explicit tooltip semantics, then all directly affected stories passed. Logs upstream-stories-first/after/repaired/final.log retain attempts."
    },
    {
      "name": "browser-qualified",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/repository/UpstreamStatus.stories.ts catalog/plugins/repository/HistoryStorage.stories.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts catalog/plugins/repository/AutomaticBackup.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "26 Chromium interaction+axe cases pass across four directly affected families in a fresh process at 1320x900/light. Final run additionally covers hover tooltips on disabled controls. upstream-browser-qualified.log and upstream-browser-final.log. Mock provider only; no remote or OS action."
    },
    {
      "name": "native-storage",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test repository_storage storage_display_and_reveal_only_use_the_native_selected_current_directory -- --exact\ncargo test --manifest-path src-tauri/Cargo.toml --locked --test repository_storage\ncargo test --manifest-path src-tauri/Cargo.toml --locked --bin lapis-desktop storage_frames_reject_paths_and_scope_injection",
      "result": "pass",
      "failures": 0,
      "note": "Exact new case, full four-case storage family and one host frame case pass. Missing state is never created, stale revision/symlink redirect rejected, and injected path rejected. storage-native.log, storage-native-family.log, upstream-host-frames.log. Existing macOS linker compact-unwind size warning is retained."
    },
    {
      "name": "native-lint",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --locked --lib --bin lapis-desktop --test repository_storage -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Affected normal native service/host/test targets pass strict Clippy. upstream-native-clippy.log. Source immutable reader/count proof and strict Clippy are separately recorded in E-VAULT-BACKUP-016."
    },
    {
      "name": "types-drafts",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 1,
      "note": "Initial noninteractive tabindex warning fixed; later optional props.onclick typed as unknown was narrowed with typeof before invocation. Earlier/final logs retained. No type shim or diagnostic was disabled."
    },
    {
      "name": "types-final",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors/warnings with final enabled/disabled trigger composition. upstream-types-verified.log."
    },
    {
      "name": "architecture-draft",
      "command": "pnpm check:architecture",
      "result": "fail",
      "failures": 1,
      "note": "Sync controller exceeded 300 counted lines. Extracted coherent guarded application/publication and notification episode/idle phase responsibilities; no source limit changed. upstream-architecture-final/repaired.log."
    },
    {
      "name": "source-boundaries",
      "command": "pnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Production/source sizes and explicit App ownership pass. upstream-architecture-final2.log and upstream-ownership.log."
    },
    {
      "name": "spec-first-draft",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "Before mapped repository, desktop and plugins chapter updates, gate correctly rejected their absence. upstream-spec-first-draft.log."
    },
    {
      "name": "review-fixture",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/repository/UpstreamStatus.stories.ts --testNamePattern \"Header Review\"\npnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/repository/UpstreamStatus.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "The additional HeaderReview passes (1 selected/6 skipped), then all 7 upstream scenarios pass after seeding the actual core plugin data location .lapis/repository-history.json. Manual browser review caught automatic mock sync after one second with the former community-plugin path. Correct fixture now retains 2 incoming/1 outgoing and no action calls. Final unique affected browser coverage is 27 cases; upstream-header-review.log and upstream-fixture-final.log."
    },
    {
      "name": "canonical-drafts",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:validate\npnpm spec:first",
      "result": "fail",
      "failures": 3,
      "note": "Initial source checks caught Desktop page byte limit, repository page 405-line limit and generated MIGRATION formatting not yet recorded. Intermediate page was still 22 bytes over. Condensed only historical mapping prose, preserving requirements, gates and source limits. Final pages fit (Desktop 32754 bytes; repository 400 lines). Logs upstream-spec-validate/final/qualified.log."
    },
    {
      "name": "format-draft",
      "command": "pnpm exec prettier --check [changed renderer/catalog/spec files]\ncargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "fail",
      "failures": 3,
      "note": "Two changed Markdown files and one Rust module declaration order needed formatting; repaired without behavior changes. upstream-format-checked.log and upstream-rustfmt.log retain exact diagnostics."
    },
    {
      "name": "canonical-qualified",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:validate\npnpm spec:first\npnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Progress matches all 41 tasks/175 evidence records; canonical source validation (6 validators/201 chapters/95 requirements) and spec-first (30 protected/6 canonical) pass. Source boundaries and explicit App ownership pass. Original M14 completion gates remain Partial. Logs upstream-progress-check, upstream-spec-validate-qualified, upstream-spec-first-final, upstream-boundaries-qualified and upstream-ownership."
    },
    {
      "name": "review-app",
      "command": "Verified old pnpm dev --no-watch supervisor PID/cwd/process group; stop that group and start CARGO_BUILD_JOBS=2 pnpm dev --no-watch from main Desktop workspace.",
      "result": "pass",
      "failures": 0,
      "note": "New supervisor 87921 builds the normal binary and reports lapis-desktop: renderer ready. review-app-upstream.json/log. Existing application profile/vault retained; no reset, package publication, credential use or real remote action. Existing compact-unwind and asset-URL warnings remain. Main Storybook 7491 serves current HMR source; HeaderReview visually inspected with counts 2/1 and no automatic mock sync."
    },
    {
      "name": "changed-file-format-qualified",
      "command": "pnpm exec prettier --check catalog/COVERAGE.md catalog/DESKTOP_STATES.md catalog/plugins/repository/HistoryStorage.stories.ts catalog/plugins/repository/UpstreamStatus.stories.ts catalog/support/repository/StorageDemo.svelte catalog/support/repository/UpstreamDemo.svelte spec/src/SUMMARY.md spec/src/current/desktop.md spec/src/current/migration.md spec/src/current/plugins.md spec/src/current/progress/vault-backup.md spec/src/current/repository-navigation.md spec/src/current/repository.md spec/src/current/vault-backup.md spec/src/history/E-REPO-043.md spec/src/history/index.md src/components/repository/RepositoryBackupStatus.svelte src/components/repository/RepositoryUpstreamActions.svelte src/components/repository/RepositoryWorkingCopyStatus.svelte src/components/repository/backup/StorageSettings.svelte src/components/repository/repository-status.ts src/lib/native/repository/remote.ts src/lib/native/repository/storage.ts src/lib/repository/remote.ts src/lib/repository/storage-controller.ts src/lib/repository/storage.ts src/lib/repository/sync-application.ts src/lib/repository/sync-controller.ts src/lib/repository/sync-publication.ts src/lib/repository/sync.ts tests/renderer/repository-remote.test.mjs tests/renderer/repository-storage.test.mjs tests/renderer/repository-sync.test.mjs\ncargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "All changed source/catalog/canonical/evidence Markdown and full native formatting pass after the three draft formatting fixes. upstream-format-qualified.log and upstream-rustfmt-qualified.log. No baseline or diagnostic changes."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Real GitHub/Forgejo authentication, network push/pull and actual OS reveal remain separate native/provider acceptance. No user credentials or real repository mutation used in fixtures.",
    "Only directly affected source/native/renderer/catalog lanes run. Full product suites, both-theme/both-viewport release qualification and approved visual baselines remain out of scope under the user minimal-testing request."
  ]
}
```
