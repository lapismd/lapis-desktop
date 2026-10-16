# Lapis Desktop: a sliced Tauri migration

## Summary and first action

**Before scaffolding or implementing anything, create
`/Users/stevejuma/code/lapismd/lapis-desktop` and save this complete plan as
`/Users/stevejuma/code/lapismd/lapis-desktop/PLAN.md`.** Preserve every section,
slice, completion gate, and deferred item. Track the file in the new repository
and link it from the migration tracker.

Create a standalone Jujutsu-managed repository with a private npm package, a
Tauri 2 Rust host, and a Svelte/Vite renderer.

The agreed first target is **macOS ARM64: open an existing vault, browse and
edit Markdown, save safely, and restore the session**. Keep the existing Notes
workspace and editor; use jj-store and JJButler as references for native chrome
and lifecycle.

Reuse the existing desktop presentation through public shared components: the
vault chooser, recent-project search, appearance controls and Lapis-branded
startup progress. Tauri owns native integration and lifecycle; choosing or
creating a vault opens Notes directly. The chooser's existing close action
returns to the previously opened vault and restores its saved layout.

**The Deno desktop is superseded and frozen as of 2026-10-16.** Keep it as a
reference for existing behavior; do not add features, fixes, host changes or new
qualification work to it. All further desktop work targets Tauri. Shared-library
fixes still belong in their owning packages. The frozen desktop's eventual
removal remains M12; Deno services used by other hosts are outside this freeze.

Ship Rust plus the system WebView. Node/pnpm remain development tools. Use
`.lapis` as the shared vault-local application-state default across every host.
The application is unreleased, so pre-release state can be reset or overwritten
without a legacy-data migration requirement.

The current source provides useful foundations: a native desktop bridge, an
injectable database connection, and published workspace/editor packages. Two
upstream changes are needed: recognizing `tauri-desktop` and changing the shared
application-state default to `.lapis` throughout the app.

## Architecture and ownership

- **New repository:** own native windows, menus, folder selection, filesystem
  access, resource URLs, database connections, application boot and teardown,
  packaging, and desktop acceptance tests.
- **Existing packages:** consume released `@lapis-notes/api`, workspace, File
  Explorer, Source Editor, Markdown, and Design Core packages through npm
  ranges. Keep fixes and generic extension points in their owning repositories.
  During migration, build and pack source changes locally with pnpm and consume
  verified archives through an ignored development overlay. Publish packages
  only at the final release gate.
- **Application profile:** define a small desktop-owned profile from public
  plugin exports. Initially enable Source Editor, Markdown, and File Explorer.
  Add Search in its own slice. The existing private `app-profile` package does
  not become a checkout dependency.
- **Native shell:** use an overlay titlebar with native traffic lights, explicit
  Tauri HTML drag regions, normal macOS menus, saved window geometry, and the
  Lapis theme. Hide the native title and let sidebar and workspace tab strips
  meet the top edge, as in the Deno host and jj-store. No application title or
  session toolbar sits above the tabs. Defer glass effects and extra windows.
  Center native traffic lights vertically in the 40px tab strip, retaining their
  geometry after restore and macOS relayout through a window-scoped native
  helper as in jj-store. Keep native pointer borrows inside Tauri main-thread
  callbacks; do not port Deno's timers or renderer adjustments.
- **Transport:** implement an adapter from the public `NativeDesktopBridge` to
  named Tauri commands and events. Grant access only to the application window
  and admitted vaults. Production uses bundled renderer assets.
- **Database:** retain the API-owned `TursoAppDatabase` logic and implement its
  public `TursoConnection` interface over an in-process Rust Turso connection.
  Serialize operations and execute transactional batches atomically. Keep
  connection IDs and database paths host-owned, disable arbitrary file
  attachment and extension loading, and qualify these boundaries before enabling
  real-vault editing.
- **Shared application state:** change the shared API's default vault-local
  state directory to `.lapis`. Configuration, workspace/layout, hotkeys, and
  plugin persistence use that default across desktop, web, and server hosts. Fix
  hard-coded state paths in their owning packages and validate every affected
  registry consumer. This is the application default, with no Tauri-specific
  subdirectory or default override. Host profiles and databases continue to use
  their OS application-data directories. Notes and attachments retain their
  existing formats and locations.
- **Pre-release state policy:** start with fresh `.lapis` state. Do not require
  `.obsidian` discovery, import, merging, compatibility fallbacks, backups, or
  legacy-state rollback. Existing pre-release settings, layouts, generated data,
  and plugin state may be reset or overwritten. Normal note-save integrity,
  dirty-buffer handling, and database transaction guarantees remain acceptance
  requirements.
- **Application ownership:** construct one explicit `App` per session. Install
  the public compatibility lease before plugin loading and release it after
  complete teardown.

The database bridge is an early feasibility gate. If its conformance tests fail,
record the blocker; do not silently substitute a memory database or bundled
JavaScript runtime.

## Delivery slices

Each row is a milestone or milestone task with independently verified work.
Commit each verified task in its owning repository.

| Slice                                        | Functionality delivered                                                                                                                                                                                               | Completion gate                                                                                                                                                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0.0 — Store the full plan**               | Create the new directory and save this entire plan as root `PLAN.md`, before scaffolding.                                                                                                                             | The saved document contains the complete architecture, delivery sequence, tracking rules, acceptance gates, and deferred work. Include it in the initial repository commit.                                                         |
| **M0.1 — Governed native shell**             | Initialize the repository, toolchains, specification, tracker, CI, branded Tauri window, native controls, and development commands.                                                                                   | Cold launch, resize, drag, close, and relaunch work; a local `.app` launches without Deno; governance checks pass.                                                                                                                  |
| **M1 — Shared runtime and state defaults**   | Add `tauri-desktop` to public runtime contracts and desktop classification. Make `.lapis` the shared application-state default for configuration, workspace/layout, hotkeys, and plugin persistence across all hosts. | Upstream regressions prove the shared `.lapis` default across every affected package and host. Build and pack verified shared-package changes locally, then validate their public archives in the Tauri app and affected consumers. |
| **M2 — Native vault access**                 | Native Open/Create folder actions, recent-vault profiles, admitted-root filesystem operations, atomic writes, and scoped resource URLs.                                                                               | Real temporary-folder tests cover cancellation, Unicode paths, binary data, permission failures, traversal/symlink escape, and interrupted writes.                                                                                  |
| **M3 — Working Notes session**               | Rust database bridge, explicit `App` startup, existing workspace shell, File Explorer, Source Editor, and Markdown editing/reading.                                                                                   | In the actual WebView, open a seeded vault, edit a note, verify disk content, display a local attachment, close the database, and reopen successfully. Database rollback and restart tests pass.                                    |
| **M4 — Safe everyday use**                   | Restore the last vault and layout; flush pending saves on close, quit, reload, and vault switching; preserve dirty content after failures; detect external changes.                                                   | Cold edit → save → quit → relaunch restores content and session. Failed saves prevent silent close; external edits never silently overwrite dirty buffers; repeated switching leaves no stale sessions or subscriptions.            |
| **M5 — File management**                     | Native watching, create/rename/move/delete, attachment import, reveal in Finder, and available system-trash behavior.                                                                                                 | UI and disk stay consistent after internal and external changes. Dirty-note rename/delete, collisions, watcher overflow/reconciliation, and teardown are covered.                                                                   |
| **M6 — Find and navigate**                   | Search, links, backlinks, outline, tags, properties, and normal workspace navigation through existing packages.                                                                                                       | Searches and metadata reflect edits, renames, deletions, and restart; navigation opens the intended note and preserves layout.                                                                                                      |
| **M7 — Desktop integration**                 | Full native menus and shortcuts, clipboard, notifications, About, single-instance delivery, and application URLs.                                                                                                     | Cold launch and already-running delivery pass; external links open safely; menu actions use the same application commands as the UI.                                                                                                |
| **M8 — Portable plugin intake**              | Add remaining supported first-party plugins individually, beginning with those needing no new native service.                                                                                                         | Each plugin has its own capability mapping, persistence/restart checks, and interaction/accessibility acceptance. Unsupported capabilities remain explicit.                                                                         |
| **M9 — Advanced services, deferred**         | Separate tasks for language services, terminal/PTY, AI controller integration, model services, secure storage, signing, and sync.                                                                                     | Each task receives an owning specification and native lifecycle/security acceptance before implementation. Preserve existing public service protocols; a similar reference implementation does not establish compatibility.         |
| **M10 — Installed-plugin support, deferred** | Verified registry installation, asset delivery, enable/disable persistence, compatibility, and recovery.                                                                                                              | Signed-package verification, shared API identity, restart, failed-load recovery, and capability restrictions pass in a packaged app.                                                                                                |
| **M11 — Distribution and other platforms**   | Signed/notarized macOS distribution and update/rollback handling; then separate Linux and Windows qualification tasks.                                                                                                | Install, upgrade, rollback, clean-machine launch, and platform filesystem/WebView tests pass. Local `.app` success alone does not complete distribution.                                                                            |
| **M12 — Desktop cutover**                    | Make Tauri the default desktop application and retire the old desktop host. No legacy application-state import is required.                                                                                           | Every currently supported desktop capability is migrated or explicitly retired, and the replacement has no Deno runtime dependency.                                                                                                 |

**M4 completes the first useful milestone.** M0–M3 provide runnable, testable
increments toward it. Later services do not block that milestone.

The active delivery request continues through M7 and stops after its original
desktop-integration gate is verified. Finish M4's complete enabled-writer audit
before treating everyday use as qualified, then retain all M5–M7 functionality
and acceptance gates. M8 and later remain outside this request.

The shared `.lapis` default applies to web/server hosts in M1 as well. Replacing
their runtime hosts is separate work. Retiring `desktop-deno` must preserve Deno
services still used by those hosts. Features already unsupported by the old
desktop host do not become migration requirements automatically.

On 2026-10-15 the user approved the application-wide `.lapis` default and
removal of pre-release state preservation and legacy-data migration gates. The
M1, M2, and M12 scopes and gates reflect that decision; completed M0 gates are
unchanged.

## Governance and progress tracking

Use jj-store’s governance model, with a small implementation appropriate to this
repository.

- Keep `PLAN.md` as the complete implementation roadmap. Record approved scope
  or sequencing changes there alongside the relevant specification and tracker
  changes.
- Maintain canonical requirements under `spec/src/current`, using
  `LD-<AREA>-NNN` IDs and exactly one verification row per requirement.
- Keep milestone task pages as the **sole status authority**. Each task records
  its dependency, owning package, requirement IDs, acceptance gate, next action,
  and selected completion evidence.
- Use `Planned`, `In progress`, `Partial`, `Blocked`, `Done`, and `Deferred`.
  “Done” requires completed dependencies and evidence for the original gate.
- Maintain a migration inventory mapping every legacy desktop requirement,
  native command/event, service, plugin, packaging path, and acceptance scenario
  to **reuse, port, replace, defer, or retire**. Record the source revision and
  destination task.
- Make root `MIGRATION.md` the entry point: current usable milestone, next
  tasks, blockers, and links to `PLAN.md`, the authoritative inventory, and the
  ledger. Generate its status summary to avoid competing checklists.
- Append evidence beneath `spec/src/history`. Record exact commands, named
  tests, pass/failure counts, platform and dependency versions, affected files,
  remaining gaps, and an explicit milestone review. Preserve failed attempts and
  correct committed evidence through new records.
- Update specifications, verification, progress, and evidence in the same
  Jujutsu change as protected implementation work.

Use the released **Node-compatible `@lapismd/spec-validator` CLI** for
requirement coverage, references, document limits, mdBook, and mapped spec-first
checks. Add small repository-specific validators for migration coverage and
progress integrity; do not copy jj-store’s accumulated historical machinery.

Enforce these limits from the first implementation slice:

- Production Rust, TypeScript, Svelte, CSS, and scripts: **300 counted lines per
  file**.
- Stories: **400 counted lines**; standalone tests: **500**.
- Authored specification and evidence pages: **400 physical lines and 32,768
  UTF-8 bytes**.
- Native CSS and public Design Core tokens; no new Tailwind utility styling or
  dependency-internal selectors.
- Separate native transport, session orchestration, and presentation. Production
  cannot import test/catalog fixtures.
- App-ownership, architecture, and progress audits run through normal checks and
  specification checks.

All implementation tasks begin **Planned**. Saving the plan completes only M0.0;
it does not establish product functionality.

## Verification and rollout

Shared-library changes are developed and verified in their owning repositories,
then consumed as local pnpm archives during migration. Keep registry semver
manifests and lockfiles portable; record archive checksums and source revisions.
Package publication is deferred until the final release gate, after functional
qualification. This replaces M1's earlier publication requirement at the user's
request.

Application signing and notarization are deferred to M11. M0.1 validates local
launch, bundle contents and native behavior without a signing gate (confirmed
2026-10-15).

- Start each task at its narrowest acceptance boundary and record its before
  state. Rerun that exact target before widening.
- Run Rust tests for native services, TypeScript tests for adapters/session
  logic, and interaction, keyboard, and accessibility tests for affected UI.
- Use actual macOS WebView automation through WebdriverIO’s Tauri service, with
  automation enabled only in test builds. Keep mock-renderer results separate
  from native acceptance.
  [Tauri testing guidance](https://v2.tauri.app/develop/tests/webdriver/)
- Require a cold native run for startup, lifecycle, imports, persistence, and
  packaging changes. Exercise disposable vaults and separate application-data
  directories.
- Include focused failure tests for partial writes, failed transactions,
  unavailable folders, stale events, dirty-buffer conflicts, close during save,
  and failed session restoration.
- Follow each owning repository’s required test scope for upstream changes.
  Validate released package consumption in the new app and affected existing
  consumers.
- Keep visual review separate and non-blocking; retain `visual-pending` and do
  not update baselines without approval.
- Prove installation, checks, builds, and packaged launch in an environment
  without Deno. Keep the frozen desktop available as a reference throughout
  preview qualification; new Tauri slices do not require Deno packaged reruns.
- Verify fresh `.lapis` configuration, workspace/layout, hotkeys, and plugin
  persistence in every affected host through the shared packages. Pre-release
  state resets and overwrites are acceptable; legacy-state import and
  preservation are not release gates.
