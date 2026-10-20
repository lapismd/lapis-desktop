# Lapis Desktop: a sliced Tauri migration

## Current delivery checkpoint

As of **2026-10-20**, the standalone Jujutsu repository, private npm package,
Tauri 2 Rust host and Svelte/Vite renderer exist. Saving this plan before
scaffolding was the completed M0.0 task. This roadmap retains the original
completion gates; the [task ledger](spec/src/current/progress/milestones.md) and
[backup ledger](spec/src/current/progress/vault-backup.md) own status.

| Workstream                        | Implemented and verified                                                                                                                                       | Remaining completion gates                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation and plugins, M0–M9     | Native vault/editor, save/reopen, watching, search/navigation, desktop integration, Terminal, catalog and installed plugins qualified                          | M7.3 ordinary native pop-outs are qualified; M8.5 presentation acceptance remains In progress                                                      |
| AI and conversations, M10/M13     | Reusable ACP adapter, retained AI UI/shared transcript, native privacy/store ownership and bounded conversation reads implemented; M10.1/M13.1/M13.2 qualified | M10.2/M13.3 managed renderer conversation/execution, context/skills and restart recovery; M10.3 tools/credentials and M10.4 compute remain Planned |
| Automatic backup, M14             | All seven implementation stages integrated into main; focused native, renderer, catalog/accessibility, type and renderer-build checks recorded                 | M14.1 identity/storage, M14.2 capture/recovery and M14.3 restore/live history are Done; search/storage and real-provider gates remain              |
| Distribution and cutover, M11/M12 | Roadmap retained; frozen Deno desktop remains a reference                                                                                                      | Publication, signing/notarization, upgrade/platform qualification and final cutover remain Planned                                                 |

Repository History now includes automatic internal/external file capture,
vault-ID-owned external JJ storage, history/blame/diffs and guarded restoration,
historical search, synchronization, optional root storage and original-history
adoption. Accounts and backup controls are in **Settings → Repository History**,
with GitHub/Forgejo icons and table-style sections (E-REPO-039–041). Production
components are reviewable in Storybook. Native identity/storage (M14.1) and
capture/recovery (M14.2) are qualified. E-REPO-046/048–050 prove automatic
internal/external capture, cold crash reconciliation, final-save failure,
retained live editors, resumed watching, Quit retry and exact retained diffs
after cold reopening. E-REPO-051 qualifies actual file/vault restore, safety
history, cold receipt recovery and live history with footer status hidden.
Historical search, storage/adoption and real-provider gates remain open; see the
[delivery checklist](docs/automatic-vault-backup-progress.md).

M7.3 is qualified by E-POPOUT-004: all fourteen actual Notes/native-window
checks and both related-host allow/deny cases pass against the verified API and
Design Core archives. M8.5 retains its original presentation gate. Release,
signing and publication remain deferred.

## Original target and architecture

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

The initial foundations were a native desktop bridge, an injectable database
connection and published workspace/editor packages. M1 completed the upstream
`tauri-desktop` classification and shared `.lapis` application-state default.

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
  not become a checkout dependency. After M7, follow
  [PLUGIN_MIGRATION.md](PLUGIN_MIGRATION.md): desktop-owned bundled AI and
  Terminal integrations, desktop Storybook, portable plugins and installed
  plugin support. Keep `lapis-ai` and `lapis-terminal` reusable, and remove AI
  and Terminal support from the web host.
- **Native shell:** use an overlay titlebar with native traffic lights, explicit
  Tauri HTML drag regions, normal macOS menus, saved window geometry, and the
  Lapis theme. Hide the native title and let sidebar and workspace tab strips
  meet the top edge, as in the Deno host and jj-store. No application title or
  session toolbar sits above the tabs. Defer glass effects. Extra windows follow
  the separate post-M7 [native tab-window plan](POPOUT_PLAN.md). Center native
  traffic lights vertically in the 40px tab strip, retaining their geometry
  after restore and macOS relayout through a window-scoped native helper as in
  jj-store. Keep native pointer borrows inside Tauri main-thread callbacks; do
  not port Deno's timers or renderer adjustments.
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

| Slice                                          | Functionality delivered                                                                                                                                                                                               | Completion gate                                                                                                                                                                                                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0.0 — Store the full plan**                 | Create the new directory and save this entire plan as root `PLAN.md`, before scaffolding.                                                                                                                             | The saved document contains the complete architecture, delivery sequence, tracking rules, acceptance gates, and deferred work. Include it in the initial repository commit.                                                         |
| **M0.1 — Governed native shell**               | Initialize the repository, toolchains, specification, tracker, CI, branded Tauri window, native controls, and development commands.                                                                                   | Cold launch, resize, drag, close, and relaunch work; a local `.app` launches without Deno; governance checks pass.                                                                                                                  |
| **M1 — Shared runtime and state defaults**     | Add `tauri-desktop` to public runtime contracts and desktop classification. Make `.lapis` the shared application-state default for configuration, workspace/layout, hotkeys, and plugin persistence across all hosts. | Upstream regressions prove the shared `.lapis` default across every affected package and host. Build and pack verified shared-package changes locally, then validate their public archives in the Tauri app and affected consumers. |
| **M2 — Native vault access**                   | Native Open/Create folder actions, recent-vault profiles, admitted-root filesystem operations, atomic writes, and scoped resource URLs.                                                                               | Real temporary-folder tests cover cancellation, Unicode paths, binary data, permission failures, traversal/symlink escape, and interrupted writes.                                                                                  |
| **M3 — Working Notes session**                 | Rust database bridge, explicit `App` startup, existing workspace shell, File Explorer, Source Editor, and Markdown editing/reading.                                                                                   | In the actual WebView, open a seeded vault, edit a note, verify disk content, display a local attachment, close the database, and reopen successfully. Database rollback and restart tests pass.                                    |
| **M4 — Safe everyday use**                     | Restore the last vault and layout; flush pending saves on close, quit, reload, and vault switching; preserve dirty content after failures; detect external changes.                                                   | Cold edit → save → quit → relaunch restores content and session. Failed saves prevent silent close; external edits never silently overwrite dirty buffers; repeated switching leaves no stale sessions or subscriptions.            |
| **M5 — File management**                       | Native watching, create/rename/move/delete, attachment import, reveal in Finder, and available system-trash behavior.                                                                                                 | UI and disk stay consistent after internal and external changes. Dirty-note rename/delete, collisions, watcher overflow/reconciliation, and teardown are covered.                                                                   |
| **M6 — Find and navigate**                     | Search, links, backlinks, outline, tags, properties, and normal workspace navigation through existing packages.                                                                                                       | Searches and metadata reflect edits, renames, deletions, and restart; navigation opens the intended note and preserves layout.                                                                                                      |
| **M7 — Desktop integration**                   | Full native menus and shortcuts, clipboard, notifications, About, single-instance delivery, and application URLs.                                                                                                     | Cold launch and already-running delivery pass; external links open safely; menu actions use the same application commands as the UI.                                                                                                |
| **M8 — Desktop plugin foundation**             | After M7 qualification, implement plugin-plan Stages 0–3: desktop Storybook, bundled Terminal, web AI/Terminal retirement and remaining portable plugins/workers.                                                     | Storybook build, interaction and accessibility checks pass; native Terminal lifecycle and portable-plugin persistence are qualified; web has no AI/Terminal activation or connection paths.                                         |
| **M9 — Installed-plugin support**              | Implement plugin-plan Stage 4: verified registry installation, asset delivery, enable/disable persistence, compatibility and recovery, with bundled plugin IDs reserved.                                              | Signed-package verification, shared API identity, restart, failed-load recovery, capability restrictions and bundled-ID collision checks pass in a packaged app.                                                                    |
| **M10 — Direct ACP AI and optional compute**   | Implement plugin-plan Stages 5–6: desktop-owned AI and copied stories, the reusable lapis-ai Tauri adapter, direct ACP and Rust application tools; optional compute last.                                             | Native chat, approvals, cancellation, tool edits, recovery, isolation and cleanup pass without ai-controller; compute receives separate model-lifecycle and peer-admission qualification.                                           |
| **M11 — Distribution and other platforms**     | Signed/notarized macOS distribution and update/rollback handling; then separate Linux and Windows qualification tasks.                                                                                                | Install, upgrade, rollback, clean-machine launch, and platform filesystem/WebView tests pass. Local `.app` success alone does not complete distribution.                                                                            |
| **M12 — Desktop cutover**                      | Make Tauri the default desktop application and retire the old desktop host. No legacy application-state import is required.                                                                                           | Every currently supported desktop capability is migrated or explicitly retired, and the replacement has no Deno runtime dependency.                                                                                                 |
| **M13 — Repository history and conversations** | Reusable admitted JJ history/diffs and privacy-aware AgentStore/ThreadStore conversation persistence.                                                                                                                 | Cold Notes history/diffs and one recoverable AgentStore/ThreadStore AI conversation in an existing Git-backed JJ vault.                                                                                                             |
| **M14 — Automatic vault backup**               | Vault-owned external history, automatic capture, restore, historical search, GitHub/Forgejo synchronization, root storage and adoption.                                                                               | Functional automatic backup, restore, GitHub/Forgejo synchronization and historical search integrated into main workspaces                                                                                                          |

**M4 completes the first useful milestone.** M0–M3 provide runnable, testable
increments toward it. Later services do not block that milestone.

M0–M9 meet their original gates, including M7.1–M7.2 and the M8 plugin
foundation. M7.3 ordinary pop-outs are qualified and M8.5 retains its separate
presentation gate. M10.1's reusable ACP adapter and M13.1/M13.2
admission/history are complete; M10.2/M13.3 managed conversations remain In
progress. Native store construction, privacy/journal ownership, receipts and
bounded transcript reads are prerequisites already implemented, not a completed
managed chat flow.

The remaining AI/distribution sequence is:

1. **M10.2:** finish native chat execution, bootstrap/context/skills, durable
   conversation recovery, active trust revocation and cleanup; qualify remaining
   native AI scenarios. Retained UI, conversations, memory and stories are
   already migrated; unavailable AI is intentional until targets are admitted.
2. **M10.3:** authenticated Rust application tools, native credentials, exact
   approvals and guarded reads/edits with the packaged Rust agent.
3. **M10.4:** optional compute model lifecycle and peer admission, separately
   enabled and qualified.
4. **M11:** publication/distribution prerequisites, signing/notarization,
   updates/rollback and separate Linux/Windows qualification. Signing remains
   deferred until this stage and requires the governing release authorization.
5. **M12:** final capability audit, Tauri default and frozen Deno host removal.

Before admitting an AI execution target, cover full service shutdown after an
uncertain model-probe close and revocation of running work when workspace trust
changes. Native reload recovery still needs a durable consumed-event cursor;
retain interrupted/unknown outcomes and never replay uncertain prompts.

M7.3 is complete independently of M8–M10. Retain its qualified window and
resource boundaries; do not restore the frozen Deno host.

### Post-M7 plugin and Storybook sequence

The complete combined plan is [PLUGIN_MIGRATION.md](PLUGIN_MIGRATION.md). M7's
original gate and deferred M4–M7 checks qualified its entry. The sequence
remains Storybook → Terminal → web AI/Terminal removal → portable plugins and
workers → installed plugins → direct ACP AI → optional compute. M8/M9 and M10.1
are complete; reuse qualified foundation and Search services.

The M8–M10 rows and detailed tasks now cover the authorized implementation. The
canonical plugin contract, verification rows and source/evidence mappings must
accompany each stage. Preserve historical inventory and completed gates. M9 and
M10 remain in scope. M8/M9 and M10.1 are Done; M10.2 is In progress and
M10.3/M10.4 remain Planned. M13 adds reusable history/conversations; M14 adds
automatic backup and forge synchronization. Their original gates are recorded
separately; integration does not qualify deferred native/provider acceptance.

AI and Terminal are bundled, desktop-owned and user-disableable; their services
start lazily. Preserve their settings, conversations and explicit disabled
preferences, and prevent duplicate activation of old installed copies. This is a
scoped exception to the general pre-release state reset policy, not a general
legacy-state import requirement.

Roles/CV, Docs, Tasks, both Sync variants and the parked Community plugin are
outside this workstream. Sync-only signing/key-custody work remains excluded. No
Node/Deno compatibility runtime, AI controller integration, web AI/Terminal
gateway or arbitrary native plugin installer is planned. M11 distribution and
M12 desktop cutover remain subsequent milestones.

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

- Keep `PLAN.md` as the implementation roadmap and `PLUGIN_MIGRATION.md` as its
  complete post-M7 plugin/Storybook detail. Record approved scope or sequencing
  changes alongside specification and tracker changes. M8–M10 follow the user's
  2026-10-17 continuation request and the detailed canonical task breakdown.
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
then consumed through local public package links or verified archives during
migration. Prefer local checkouts without creating releases. Keep registry
semver manifests/locks portable through ignored JavaScript install overlays; use
explicit Rust path dependencies and record source revisions. Package publication
is deferred until the final release gate, after functional qualification. This
replaces M1's earlier publication requirement at the user's request.

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
  preservation are not general release gates. The later AI/Terminal handover
  preserves the specific plugin data and disabled preferences identified in
  `PLUGIN_MIGRATION.md`.

The approved full-width workspace footer is tracked by E-CATALOG-009 under M8.5.
Source, API and desktop acceptance resume for this slice; the task ledger
retains the original native presentation gate and unrelated migration work.

- [x] Approve footer, notification, Problems and ribbon Settings design.
- [x] Implement shared footer and desktop/plugin integration; commit API bridge.
- [x] Pass source units/catalog, Notes catalog, renderer and AI policy suites.
- [x] Pass both desktop light-theme viewport matrices (658 cases).
- [x] Finish source pointer qualification (16 workspace, 11 shell, 151
      controls).
- [x] Install the final verified package archives (14 public import routes).
- [x] Complete desktop dark-theme matrices (658 cases).
- [x] Finish desktop renderer/static builds and document checks.
- [x] Refresh review previews from the main checkout.
- [x] Fix sidebar seam, AI spacing, status clearance and Main body tab moves.
- [x] Repair stale review profile and show startup errors once in the body.
- [x] Commit the verified desktop slice in its isolated workspace.
- [x] Apply after the main checkout's AI-history integration is clean.
- [ ] Complete the separate original M8.5 native presentation gate.

E-CATALOG-010 records default-workspace landing and retirement of the three
temporary footer/readiness checkouts. Main review previews and focused
acceptance pass; new broad matrices are deferred at the user's request. Older
independent migration workspaces remain separate.
