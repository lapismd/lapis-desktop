# E-CORE-017 — Shared vault-owned backup intake

```json
{
  "id": "E-CORE-017",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14.2", "M16.2", "M4"],
  "requirements": [
    "LD-REPO-005",
    "LD-VAULT-002",
    "LD-GOV-006",
    "LD-LIFE-001",
    "LD-LIFE-002",
    "LD-LIFE-003",
    "LD-LIFE-005"
  ],
  "versions": {
    "desktopBaseline": "a5b936e0",
    "notesCore": "6f637449",
    "lapisAI": "6548afe0",
    "rust": "1.99.0",
    "pnpm": "10.34.5"
  },
  "contractReview": "Select the shared vault-owned coordinator and watcher with native command/status adapters. Preserve existing capture/restore/sync, opaque caller admission and history locations. Reload detaches; explicit close/disable and Quit drain.",
  "milestoneReview": "R1.3.10 Desktop intake is verified: 235 native service, 416 renderer/governance, 744 AI, 2000 complete catalog, six hidden API and eleven original lifecycle cases pass. Ordinary/e2e builds, zero-automation audit, types, strict and specification checks pass. On 2026-10-25 the user accepted the separate pre-existing database-slice Markdown image failure as non-blocking and authorized the consumer commit. Original provider/platform gates remain separate; this receipt qualifies the shared backup lifetime intake only.",
  "runs": [
    {
      "name": "native-lifetime-exact",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --test core_backup_service --locked",
      "result": "pass",
      "failures": 0,
      "note": "One initial real-engine case passes; the final full 235-case native suite also reruns it after all host changes."
    },
    {
      "name": "renderer-reload-before",
      "command": "node --test tests/renderer/repository-backup.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Ten pass; two new cases fail because prepareLeave is missing."
    },
    {
      "name": "renderer-reload-after",
      "command": "node --test tests/renderer/repository-backup.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All twelve cases pass."
    },
    {
      "name": "permission-audit-before",
      "command": "pnpm test",
      "result": "fail",
      "failures": 4,
      "note": "New exact main-only preflight grant is missing from the source audit allowlist."
    },
    {
      "name": "permission-audit-after",
      "command": "node --test tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All eleven audit cases pass after adding only the specified preflight grant."
    },
    {
      "name": "evidence-metadata",
      "command": "pnpm test",
      "result": "fail",
      "failures": 1,
      "note": "New evidence initially lacks its required JSON metadata. Repair the authored record; do not weaken the parser."
    },
    {
      "name": "renderer-and-governance",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 416 first-stage renderer/governance cases pass. AI/native stages are still running; this entry does not claim the complete command has passed."
    },
    {
      "name": "ai-suite",
      "command": "pnpm test:ai",
      "result": "pass",
      "failures": 0,
      "note": "All 744 AI cases in 151 files pass as the second stage of pnpm test."
    },
    {
      "name": "focused-catalog",
      "command": "pnpm test:storybook catalog/plugins/repository/AutomaticBackup.stories.ts catalog/plugins/repository/HistoryAdoption.stories.ts catalog/plugins/repository/Sync.stories.ts catalog/plugins/repository/UpstreamStatus.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All four fresh viewport/theme processes pass 26 cases each: 104 functional/accessibility cases."
    },
    {
      "name": "final-native-suite",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "All 235 native cases pass after final command-client reattachment refresh. Two existing subprocess helpers are explicitly ignored. Log .local/core-backup-native-final.log."
    },
    {
      "name": "final-normal-strict",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Passes against final command-client reattachment source."
    },
    {
      "name": "renderer-build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "Production renderer build passes; retained large-chunk warnings remain. No native bundle acceptance is claimed."
    },
    {
      "name": "specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four lanes pass after mapping the new native/catalog paths to the owning files/plugin chapters and fresh evidence. Initial authoring gaps are repaired without changing validation rules."
    },
    {
      "name": "e2e-strict",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --features e2e --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Final e2e configuration passes strict checks."
    },
    {
      "name": "full-catalog-before",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "note": "First desktop/light pass: 499 passing, one Blocked Close failure. ShellDemo does not yet recognize native leave preflight. Later viewport/theme groups do not run."
    },
    {
      "name": "shell-exact-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/Shell.stories.ts -t 'Blocked Close'",
      "result": "fail",
      "failures": 1,
      "note": "Same exact failure reproduced before fixture repair; preserve the original user-facing assertion."
    },
    {
      "name": "shell-exact-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/Shell.stories.ts -t 'Blocked Close'",
      "result": "pass",
      "failures": 0,
      "note": "The original assertion passes after adding only the native preflight port for this fixture, with its explicit close fault intact."
    },
    {
      "name": "shell-family-after",
      "command": "pnpm test:storybook catalog/plugins/desktop/Shell.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All twelve functional/accessibility cases pass across four fresh viewport/theme processes."
    },
    {
      "name": "normal-bundle",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm desktop:bundle --debug",
      "result": "pass",
      "failures": 0,
      "note": "Local macOS ARM64 debug app builds and bundles; signing/distribution remain deferred."
    },
    {
      "name": "normal-bundle-audit",
      "command": "pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "All bundled resources verified, 327 renderer JavaScript files, zero normal automation markers; signing deferred."
    },
    {
      "name": "hidden-native-api-existing",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm test:desktop:api",
      "result": "pass",
      "failures": 0,
      "note": "Fresh e2e native app builds; all four existing hidden API cases pass. The two new service-lifetime cases were added after this process started; their exact run and the complete six-case group pass separately against that same built app."
    },
    {
      "name": "hidden-native-backup-exact",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/repository-service-lifetime.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Both real native IPC cases pass: actual WebView reload/detach, no-client capture, Quit/cold bytes, explicit disable/restart, and failed retained-vault preflight preserving another writer. Expected failure is observed without activating or focusing a window."
    },
    {
      "name": "hidden-native-api-complete",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/core-file-service.test.mjs tests/desktop/search-provider.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-service-lifetime.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All six native API cases pass together in 31.3 seconds against the freshly built e2e app. Expected Automatic vault backup is unavailable is the asserted failure path. Log .local/core-backup-native-api-complete.log."
    },
    {
      "name": "packaged-lifecycle-before",
      "command": "node --test --test-concurrency=1 tests/desktop/repository-backup.test.mjs tests/desktop/repository-backup-leave.test.mjs tests/desktop/repository-backup-resume.test.mjs tests/desktop/repository-backup-recovery.test.mjs tests/desktop/notes-lifecycle.test.mjs",
      "result": "fail",
      "failures": 3,
      "note": "Eight pass / three fail in 98.4s. All five backup cases pass. Three Notes cases cannot find the obsolete .shell-failure selector. Log .local/core-backup-native-visible.log; isolated real native app, no rebuild or product changes."
    },
    {
      "name": "notes-lifecycle-exact-after",
      "command": "node --test --test-concurrency=1 --test-name-pattern='failed note saves|failed layout saves|failed physical-root restoration' tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "The exact three previously failing cases pass in 16.6s against the same native app. Only leaf selectors now identify the existing public Alert inside DesktopFailure. Persistence, editor/watch continuity, recovery profile and same-process reload assertions remain intact. Log .local/core-backup-native-lifecycle-exact.log."
    },
    {
      "name": "notes-lifecycle-family-after",
      "command": "node --test --test-concurrency=1 tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All six Notes lifecycle cases pass in 41.5s with fresh isolated roots and native app processes. Together with the unchanged five original backup cases this qualifies the eleven-case affected lifecycle surface. Log .local/core-backup-native-lifecycle-family.log."
    },
    {
      "name": "full-catalog-after",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "All 2000 functional/accessibility cases pass across four fresh processes: desktop/light 500 in 571s; narrow/light 500 in 596s; desktop/dark 500 in 632s; narrow/dark 500 in 613s. The original Blocked Close failure and exact/family repair remain recorded. Log .local/core-backup-catalog-final.log."
    }
  ],
  "files": [
    "catalog/support/desktop/ShellDemo.svelte",
    "catalog/support/repository/AdoptionDemo.svelte",
    "catalog/support/repository/BackupDemo.svelte",
    "catalog/support/repository/SyncDemo.svelte",
    "catalog/support/repository/UpstreamDemo.svelte",
    "scripts/desktop-api-tests.mjs",
    "scripts/source-audit.mjs",
    "spec/src/current/files.md",
    "spec/src/current/plugins.md",
    "spec/src/current/vault-backup.md",
    "spec/src/current/verification.md",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/lifecycle.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/backup.rs",
    "src-tauri/src/host/repository/backup_client.rs",
    "src-tauri/src/host/repository/backup_close.rs",
    "src-tauri/src/host/repository/backup_provider.rs",
    "src-tauri/src/host/repository/backup_watch.rs",
    "src-tauri/src/host/repository/commands.rs",
    "src-tauri/src/host/repository/mod.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/lifecycle/mod.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/tests/core_backup_service.rs",
    "src/components/repository/repository-backup.ts",
    "src/components/views/Shell.svelte",
    "src/components/views/notes-bundled-plugins.ts",
    "src/lib/native/repository/backup.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/native/vault-client.ts",
    "src/lib/repository/backup.ts",
    "tests/desktop/repository-service-lifetime.test.mjs",
    "tests/renderer/repository-backup.test.mjs",
    "tests/desktop/notes-lifecycle.test.mjs"
  ],
  "remaining": []
}
```

## Scope and source

R1.3.10 consumes Notes `6f637449` through its public native backup APIs. Tauri
keeps opaque session/window admission, immutable history bindings, OS file
coordination and presentation. Core owns the existing `jj-vault` coordinator and
native watch. This is part of the saved Rust migration, not another engine.

The duplicate Desktop backup provider and watcher are removed. The native
command/status client forwards existing capture, AI history, restore, adoption
and sync methods through the admitted service. Production and e2e history roots
retain their prior locations, including e2e history beside its profile
directory. New history storage is created privately without chmod through a
mutable path.

Renderer reload captures before destructive teardown, detaches observation and
retires native admission while keeping the vault service alive. Explicit
disable, storage moves and explicit vault close drain it. Quit first reconciles
vaults retained by earlier reloads before App teardown; final native drain
precedes exit approval. Failed reload capture leaves the observer and service
available for retry. Ordinary immutable readers do not create a backup writer.

## Exact regressions and current checks

- `cargo test --manifest-path src-tauri/Cargo.toml --test core_backup_service --locked`
  initially fails compilation because the shared-backup native constructor is
  missing. With the adapter, one real-engine case passes (2.35 seconds): saved
  bytes are captured with no renderer client, reattachment retains the same
  service generation and controlled shutdown closes the original status stream.
  The final complete native suite reruns and passes this case after all host
  changes.
- `node --test tests/renderer/repository-backup.test.mjs` moves from 10 passes /
  two missing-method failures to 12 passes. Reload captures/detaches without
  stop; failed capture retains observation and the same leave can retry.
- `pnpm check:types` passes with zero errors/warnings. Strict normal all-target
  Clippy passes after native reload/close/Quit wiring. Earlier intermediate
  checking reports two unused detach methods; wiring their actual release paths
  resolves those warnings rather than suppressing them.
- All 416 renderer/governance and 744 AI cases pass. All 104 focused catalog
  cases pass across fresh desktop/narrow and light/dark processes. All 235 final
  native cases pass after the reattachment refresh. E2e strict/build, the
  ordinary bundle audit and original packaged lifecycle cases also pass in the
  later runs below. The complete catalog passes all 2,000 cases. No Storybook or
  core check is claimed as the native application gate.

Before this intake, both Desktop file-service cases pass against source
`6f637449` after a 2m42s dependency rebuild. The linker reports its large
compact-unwind warning; no warning is suppressed. This is separate compatibility
proof, not backup selection. The source receipt lives in Notes under
`spec/records/2026-10-25-rust-backup-commands.md`.

## Resource maintenance and remaining gates

Under standing cache approval, 59 inactive older duplicate test executables are
removed across Notes/Desktop (2.11 GiB logical bytes; 31.51 GiB available after
cleanup). Newest variants, app binaries, vaults and profiles remain. Compiler
inactivity, open files and unchanged inode/mtime/size are checked. The inventory
is `.local/backup-control-obsolete-test-executables.json`. The first missing-API
baseline was launched with 29.90 GiB available; subsequent native builds follow
the restored 30 GiB guard.

The Desktop database slice remains uncommitted pending explicit disposition or
qualified source repair of its pre-existing Markdown image failure (27 native UI
passes / one failure). This receipt does not waive that gate. R1.3.10 and
R1.3.11 remain Waiting in the Notes master ledger; R2–R7 and original
provider/platform gates remain open. No lapis-ai or frozen Deno source changes.

Final reattachment also obtains a fresh service receiver for cached native
entries, resolving a previously completed stop whose caller lost its outcome. A
second standing-approved cleanup removes 46 older duplicate test executables
(1.13 GiB logical bytes), retaining newest variants and checking
compiler/open-file inactivity plus unchanged metadata. The inventory is
`.local/backup-adoption-obsolete-test-executables.json`; 30.35 GiB was available
before the final native run.

The first full catalog pass exposes one missing Shell fixture port, not an
unexplained unrelated failure: 499 pass / one Blocked Close failure. Its native
preflight must succeed for this fixture, which has no retained vaults; its
existing explicit close fault and user-facing assertion remain unchanged. Exact
reproduction fails once before repairing that fixture. The exact story and all
twelve Shell family cases pass; the full catalog rerun passes all 2,000 cases.

The fresh e2e app and four existing hidden API cases pass. Two new native
transport cases now exercise actual WebView reload/detach, no-client capture,
final Quit/cold history, explicit disable/restart and retained-vault preflight
with another live writer. Their exact first run passes both cases; the combined
six-case API group passes all six in 31.3 seconds. The same hidden mode asserts
no visibility/activation and no document focus. The separate original editor
leave/recovery cases pass in the packaged lifecycle runs below.

Full catalog rerun passes all four desktop/narrow and light/dark processes
(2,000 cases). The five original backup lifecycle cases pass; after the selector
repair, all six Notes lifecycle cases pass in fresh isolated native acceptance
windows. No new feature scope is added.

The first packaged lifecycle run exposes three stale Notes failure-banner
selectors: those tests still use `.shell-failure[role="alert"]`, while the
production `DesktopFailure` component renders `.desktop-failure [role="alert"]`.
Only those leaf selectors change; persistence, retained editor, profile, reload
identity, resumed watching and repaired retry assertions remain intact. The
exact three-case rerun passes (16.6 seconds), then the complete six-case Notes
lifecycle family passes (41.5 seconds), using fresh native processes and
isolated roots.

## Accepted exception — 2026-10-25

The user answered: “Accept the recorded failure and commit the verified intake.”
This accepts the independently reproduced Markdown attachment defect as
non-blocking for this intake. The actual native UI result stays 27 pass / one
fail; the owning `lapis-plugins` repair remains pending. The unchanged
historical E-AI-109 formatting exception also retains its earlier explicit
acceptance. No native/provider acceptance is inferred for the newer R2 execution
source.
