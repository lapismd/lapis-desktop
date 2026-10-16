# Migration inventory and progress

The task ledger alone owns current statuses and selected completion evidence.
Root `MIGRATION.md` is its generated projection; `PLAN.md` retains every
original milestone gate. Component success, bookkeeping and screenshots cannot
replace those gates. The active delivery request ends after M7 qualification and
an ordinary app review launch. Stop before implementing M8.

The separately authorized native tab-window workstream is recorded in
`POPOUT_PLAN.md` and tasks M7.1–M7.3. It does not reopen completed M0–M7 gates
or begin M8. Each verified slice is committed and paused for review. M7.1
qualifies only debug acceptance hosting; ordinary tab integration remains later.

The immutable baseline inventory is `spec/migration-inventory.json`. It retains
source revisions and validates without sibling checkouts. Capture fresh source
evidence when extending it; do not treat later checkouts as the original
baseline. Revised post-M7 destinations are recorded separately at that handoff.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-MIG-001 | The migration inventory MUST retain source repository revisions and map legacy desktop requirements, commands/events, services, plugins, packaging and acceptance surfaces to a destination task and a reuse, port, replace, defer or retire disposition.                                                  |
| LD-MIG-002 | Every roadmap task MUST retain an explicit gate and next action. Deferred capabilities MUST remain visible, and product implementation MUST first introduce its owning contract. The generated MIGRATION summary MUST agree with the task ledger.                                                          |
| LD-MIG-003 | The Deno desktop MUST remain superseded and frozen. Further desktop features, fixes and host qualification MUST target Tauri. Shared changes MUST remain in their owning packages. The frozen host MAY remain a reference until M12 removes it; Deno services used by other hosts are outside this freeze. |

## Runtime and acceptance boundaries

The Tauri shell reuses the public vault chooser, progress, recovery, Settings,
workspace and plugin components. Its native vault/database adapters provide
admitted storage for the explicitly owned App. Database rollback/restart and
actual edit/save/attachment/reopen acceptance remain M3's combined gate.

M4 covers every enabled writer in the [writer audit](writer-audit.md): notes and
editable previews, Properties/frontmatter, metadata types, layout,
configuration, hotkeys and plugin state. Safe Close, Quit, reload, chooser
return and repeated switching retain failures and dirty drafts. Startup retry,
session Safe Mode and explicit reset retain inventory LN-DENO-052/053/054
without silently rewriting canonical choices or the skipped saved layout.

M5 combines exclusive creation, admitted mutations, App-owned watcher
reconciliation, dirty rename/delete protection, imports and existing Explorer
native actions. Unsupported hosts retain explicit capability behavior and local
trash fallback. Actual macOS Finder/default-open/system-trash dispatch and
fixture restoration are separate from mocked adapter tests.

For LN-DENO-076, retain the immutable baseline's M5 port disposition. Tauri
replaces Deno's intermediary Vite Fetch proxy with direct devUrl loading and
bundled production assets. LD-FILE-005 governs direct compressed native loading
and unmodified raw GET/HEAD/IPC resources; each needs its own evidence.

M6 uses public Search, metadata/link panels and global/local Graph.
Qualification covers indexing after edits/rename/delete, existing query
handoffs, intended-note navigation, settings admission/recovery, file following
and cold layout restore. M7's [integration contract](integration.md) adds native
menus, bounded service ports, single-instance delivery and queued application
URLs through the existing App and leave coordinator.

The 40px workspace tabs remain at the top edge with no title or toolbar above
them. Native controls and Tauri HTML drag handles retain the original shell
requirements. Startup progress disappears when the workspace is ready. Native
window geometry, source tests and physical drag evidence remain distinct from
visual baseline approval and public distribution.

For this delivery session only, full repository/consumer/native lanes were
deferred until M7 implementation. Run every deferred lane before qualifying
M4–M7 and preserve all failed attempts. This temporary exception does not change
the repository's default testing policy. Final results are recorded in
[E-QUALIFICATION-001](../history/E-QUALIFICATION-001.md) and
[E-QUALIFICATION-002](../history/E-QUALIFICATION-002.md).

Renderer components, application orchestration and global styles use the
feature-grouped layout in `AGENTS.md`. Moving files or introducing this
structure does not replace functionality acceptance.

## Shared state policy

The user approved `.lapis` as the shared vault-local application-state default
on 2026-10-15. This applies to the entire application, including desktop, web,
and server hosts. M1 changes the default in the shared API and resolves
configuration, workspace/layout, hotkeys, and plugin persistence through it in
every affected package and host. There is no Tauri-specific default or nested
state directory. Host profiles and databases continue using OS application-data
directories.

The application is unreleased. Existing pre-release application state may be
reset or overwritten; `.obsidian` discovery, import, merging, compatibility
fallbacks, backups, and legacy-state rollback are outside the delivery gates.
M1, M2, and M12 have user-approved revised gates in the task ledger. Normal
note-saving, dirty-buffer, filesystem, and database transaction guarantees
remain in scope. M1 implements and qualifies the shared default across the
affected hosts.

## Local archive qualification

During migration, shared changes are built, tested, and packed in their owning
repositories, then installed in Tauri through verified local pnpm archives. This
is the user-approved M1 qualification path. Package publication moves to the
final release gate. Tracked registry manifests/lockfiles remain portable;
ignored install overlays record source revisions and archive checksums.

M1 native consumer qualification imports the path default and desktop runtime
classification from the actual packed public API. Source regression evidence and
native app evidence are recorded separately. Library archives carry the actual
Jujutsu source snapshot and verified package identities; passing local
installation alone does not complete the native consumer gate.

## Frozen desktop and distribution

The Deno desktop is superseded and frozen under LD-MIG-003. Retain its source
and historical evidence as references until M12; do not port new functionality
back, edit that host or require additional packaged Deno desktop runs for Tauri
slices. Shared-library ownership remains unchanged, and Deno services used by
web/server hosts remain outside this freeze. The freeze does not complete M12 or
change its capability-coverage gate.

Application signing and notarization remain deferred to M11 per the user's
2026-10-15 instruction. Publication and clean-machine/platform distribution
qualification remain separate from the local macOS preview.

## Scheduled plugin work after M7

On 2026-10-16 the user requested the combined plugin and Storybook plan in root
`PLUGIN_MIGRATION.md`, scheduled after M7 in `PLAN.md`. M7's original gate and
all deferred M4–M7 checks must pass first. This does not expand the other
agent's active M4–M7 request or qualify any plugin implementation.

M8 now plans Stages 0–3: desktop Storybook, bundled Terminal, retirement of web
AI/Terminal support and remaining portable plugins/workers. M9 plans Stage 4,
verified installed plugins. M10 plans Stages 5–6, bundled direct-ACP AI and
optional compute last. M8 remains Planned; M9 and M10 remain Deferred until the
post-M7 work is admitted. Before implementation, introduce detailed tasks and
owning product contracts/verification. M11 and M12 remain subsequent milestones.

The desktop owns both plugin integrations and copied/adapted application
stories; `lapis-ai` and `lapis-terminal` remain reusable packages. Preserve the
affected plugin IDs, settings, conversations and explicit disabled preferences,
and reject duplicate installed copies. This is a scoped exception to pre-release
state-reset permission, not a general legacy-state import gate.

Roles/CV, Docs, Tasks, both Sync variants, Sync-only signing and the parked
Community plugin are excluded. The plan adds no Node/Deno runtime, shared AI
controller, web AI/Terminal gateway or arbitrary native plugin installer.
Storybook uses fake clients; native acceptance and visual approval stay
separate.

The captured inventory remains immutable historical baseline. Record revised
current destination mappings separately at the post-M7 handoff. E-PLUGINS-001
records this scheduling decision only; active task gates and committed evidence
are preserved.
