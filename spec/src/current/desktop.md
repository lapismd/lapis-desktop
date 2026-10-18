# Desktop shell

E-AI-042: native-profile Codex; named IPC, isolated E2E config, no renderer
launch authority (LD-DESK-003/HOST-001). Earlier UI: E-REPO-023/025,
E-AI-039–041; Gravatar: `https://www.gravatar.com`.

The Notes composition root starts App-owned watching after metadata/view setup.
Leave drains it before persistence/teardown and resumes only a still-live App on
failure (LD-FILE-002/003). M6 registers public Search and Graph with native
settings recovery and metadata qualification governed by `navigation.md`.

M0.1–M3 establish the shell, admitted launcher and native Notes workspace.

Plugin assets and Terminal follow [plugins](plugins.md).

[Background](background.md); [history](repository.md).

## Requirements

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-DESK-001    | The desktop MUST display Lapis branding and the public Design Core Lapis theme in a bundled Svelte renderer. The first renderer screen MUST use shared branded progress before importing the full shell, followed by ready content or an accessible failure.                                                                                                                                                                                    |
| LD-DESK-002    | macOS MUST retain native close, minimize and fullscreen controls, vertically centered in the 40px top tab strip, in an overlay window with no visible title. Workspace tabs and sidebar tabs MUST meet the top edge with no application title or toolbar above them. Public window-control tokens MUST reserve native-control clearance, and declared background regions MUST use Tauri HTML dragging while interactive controls remain usable. |
| LD-DESK-003    | Native IPC MUST grant only named shell, admitted vault and scoped AI operations plus drag/zoom to the local main window. External navigation, generic filesystem, arbitrary process launch and remote capability grants MUST remain denied.                                                                                                                                                                                                     |
| LD-DESK-004    | The shell MUST persist window geometry in its separate application profile, provide normal native application/edit/window menus, and support cold close and relaunch without leaving an owned process behind.                                                                                                                                                                                                                                   |
| LD-DESK-005    | Native acceptance MUST exercise the actual macOS WebView, resizing, window movement, close, and relaunch using isolated test state. Automation plugins, permissions and frontend hooks MUST be absent from normal bundles.                                                                                                                                                                                                                      |
| LD-HOST-001    | The desktop MUST consume the shared API through public package exports, identify its runtime as `tauri-desktop`, and use the shared `.lapis` state default. Migration acceptance MUST use verified source-owned pnpm archives until publication at the final release gate.                                                                                                                                                                      |
| LD-VAULT-001   | Open and Create MUST use a native picker; Create MUST select the new folder destination. Cancellation MUST leave the current selection and recent profiles unchanged. Create MUST validate a single folder name and reject existing destinations without overwriting them.                                                                                                                                                                      |
| LD-VAULT-002   | Recent vault profiles MUST live in the separate native application profile and reopen only by a host-owned profile ID. Missing or changed physical roots MUST report failure without silently selecting another folder.                                                                                                                                                                                                                         |
| LD-VAULT-003   | Filesystem commands MUST require a live host-issued admission and relative vault paths. Absolute paths, parent traversal, symlink escape, and operations after close MUST reject. Directory handles MUST enforce containment during operations, including concurrent symlink substitution.                                                                                                                                                      |
| LD-VAULT-004   | Text and binary writes MUST stage in the destination directory, flush the staged file, and atomically replace the destination. Failed or interrupted staging MUST preserve the previous complete destination. Permission and encoding failures MUST remain observable.                                                                                                                                                                          |
| LD-VAULT-005   | Attachment URLs MUST use revocable, unguessable admission tokens and the contained native resource handler. Responses MUST have explicit media types, no-store and nosniff headers; executable document types, arbitrary file URLs, traversal, and closed admissions MUST remain unavailable.                                                                                                                                                   |
| LD-VAULT-006   | The launcher MUST reuse the shared Deno desktop chooser, including its branding, Create New Vault, Open Vault, recent-project search and appearance controls. Successful selection MUST open Notes directly. Returning to vaults MUST close the Notes owner and admission before another selection. Native acceptance MUST preserve bounded-listing, cancellation, collision and byte-integrity evidence through isolated real folders.         |
| LD-VAULT-007   | The shared chooser MUST expose its existing close button after leaving a ready vault. Activating it MUST reopen that vault through host-owned profile admission and restore its saved layout. Picker cancellation MUST preserve the return route.                                                                                                                                                                                               |
| LD-DB-001      | Tauri database connections MUST use pinned in-process Rust Turso and host-owned profile paths. Opening MUST require a live vault admission; renderer payloads MUST NOT select database paths. Unknown, closed, mismatched, or conflicting connection authority MUST reject.                                                                                                                                                                     |
| LD-DB-002      | Native connection operations MUST serialize. A batch MUST execute atomically with explicit transaction behavior, roll back on failure, and expose none of a failed batch's writes. Close and restart MUST preserve committed data; failed rollback MUST block further operations until recovery.                                                                                                                                                |
| LD-DB-003      | The desktop MUST implement the public TursoConnection methods through typed bounded frames, preserving null, text, real, signed 64-bit integer, binary, positional and named parameter values. The actual packed TursoAppDatabase schema and operations MUST pass native consumer qualification before App startup is enabled.                                                                                                                  |
| LD-DB-004      | Native SQL MUST NOT attach other databases, vacuum into arbitrary files, load extensions, perform file-access functions, or change filesystem-related pragmas. Transaction control MUST remain native-owned; validation MUST precede batch execution.                                                                                                                                                                                           |
| LD-SESSION-001 | Each Notes session MUST construct one explicitly owned App with an injected direct native Turso provider. It MUST use the shared .lapis state default and public plugin/workspace packages. The compatibility lease MUST span plugin loading through complete owned teardown.                                                                                                                                                                   |
| LD-SESSION-002 | M3 MUST prove a real seeded vault in the actual WebView: open a note, edit and save it to disk, display a local attachment, close the database and reopen successfully. Browser mocks or an in-memory database MUST NOT qualify that gate.                                                                                                                                                                                                      |
| LD-LIFE-001    | Close, Quit, reload and returning to vaults MUST protect registered writers and await pending note and layout persistence before destructive teardown. Persistence failure MUST leave the owned session available and show a recoverable error.                                                                                                                                                                                                 |
| LD-LIFE-002    | Native close and Quit MUST wait for a correlated renderer acknowledgement. Duplicate requests MUST share one operation. Failure MUST cancel that request and allow retry; a timeout MUST NOT approve exit. Reload MUST use the same save and teardown boundary.                                                                                                                                                                                 |
| LD-LIFE-003    | The native profile MUST remember the initialized Notes vault separately from folder admissions. Cold startup and reload MUST restore that physical vault and saved layout. Returning to vaults MUST clear the active Notes preference. Failed restoration MUST show the error and preserve the recovery route.                                                                                                                                  |
| LD-LIFE-004    | External file edits MUST NOT silently overwrite dirty editor content or be overwritten by a later dirty save. Conflicts MUST remain observable and preserve both the current buffer and external file until an explicit resolution.                                                                                                                                                                                                             |
| LD-LIFE-005    | Repeated vault switching MUST release the old workspace, plugins, metadata, editing sessions, compatibility lease, database and subscriptions before admitting another Notes owner.                                                                                                                                                                                                                                                             |
| LD-LIFE-006    | Native conditional text writes MUST compare exact expected bytes or expected absence before replacement and recheck after staging. An observed regular-file mismatch MUST preserve the current destination and return ECONFLICT. Conditional operations MUST retain admitted-root containment, size limits, metadata handling and staged atomic replacement.                                                                                    |
| LD-LIFE-007    | Every enabled Notes file writer MUST participate in the owning App's flush, protection and conflict lifecycle, including pending, failed and retired writes. Qualification MUST cover both API text editors and editable Markdown previews in the initial profile.                                                                                                                                                                              |
| LD-SESSION-003 | Native Notes startup MUST reuse the Deno branded DesktopWorkspaceStartup from the public Workspace package with accessible progress, real phase statuses and current plugin detail. Restoration and storage opening MUST expose progress before the session mounts. Failure MUST retain its failed phase and a route back to vaults. Successful startup MUST remove the progress surface without adding content above workspace tabs.           |
| LD-SESSION-004 | Notes startup MUST load existing hotkey overrides through the public owned CommandManager before presenting workspace commands. Cold restoration MUST preserve those bindings.                                                                                                                                                                                                                                                                  |
| LD-REC-001     | Startup failure MUST retain the failed phase, complete message and stack, copyable diagnostic, Retry, vault management, optional-plugin disablement, layout skip and explicit saved-layout reset actions. Retry MUST finish owned teardown before creating a fresh App for the admitted vault.                                                                                                                                                  |
| LD-REC-002     | Safe Mode MUST use session-scoped AppSafeModeState across renderer reloads without changing saved configuration merely by entering recovery. Its shared banner MUST describe restrictions, offer metadata and Search rebuilds and a normal restart that clears recovery. Unavailable community and notebook controls MUST remain absent.                                                                                                        |

The product name is Lapis Notes Preview and the application identifier is
`com.lapismd.lapis-desktop.preview`. Development Vite binds literal loopback on
port 1431. Production loads bundled assets through Tauri's local application
protocol and permits no network connection except native IPC.

## Source organization

`src/main.ts` mounts shared progress through `src/lib/desktop/launch.ts` before
lazily importing `bootstrap.ts`. The e2e entry shares this sequence. Components
and logic group by feature under `src/components` and `src/lib`; adapters stay
independent of Notes orchestration and local UI. Global host CSS lives in
`src/styles`; component styles stay scoped. Use direct relative imports and
avoid catch-all helpers.

Only `main.rs` and `lib.rs` remain at `src-tauri/src` root. Features own
reusable services; `host` owns Tauri adapters. `acceptance` compiles only with
the existing debug e2e gate. The library forbids unsafe code; the binary denies
it except its audited macOS chrome module. `AGENTS.md` defines the layout;
architecture checks reject root implementations. Moves preserve permissions,
state, registration and milestone gates.

## Native shell presentation

Use public Tauri overlay configuration and native menus. Native-pointer access
is limited to the macOS control-layout helper described below. Glass, other
platform-pointer interop and user documents remain later work; see
[windows](windows.md). Closing the only window exits this shell;
unsaved-document coordination is introduced before document editing is
considered qualified in M4.

The Notes workspace fills the native content area. Its existing 40px tab strips
start at the top edge; no application title or session toolbar precedes them.
The native title stays hidden. The configured native inset is 16,26 logical
pixels, and the control centers stay at y=20 in the 40px tabs. A macOS-only
helper retains native button geometry and hover tracking after AppKit relayout.
It borrows the live NSWindow only inside Tauri's main-thread callback or the
window's own update notification. Each window's observer retires on destruction,
with a reentrancy guard and no polling or stored raw pointers. Native interop
stays in that one audited module; the rest of the binary denies unsafe code and
the service library forbids it. No HTML traffic lights or tab transforms are
added. Host CSS maps the Deno shell's 65px main-pane and 80px sidebar clearances
through public Design Core window-control tokens, subtracting the ribbon width
where appropriate. Expanded and collapsed sidebar states keep their controls
clear without shifting tabs vertically.

The host translates public `data-desktop-drag-region` backgrounds to Tauri's
`data-tauri-drag-region="deep"`; explicit `false` descendants remain excluded.
It observes newly mounted and reconfigured regions and releases the observer on
page teardown. Tauri owns native dragging and double-click zoom. The launcher
uses the same native HTML handles on empty background, excluding its interactive
content. Back to vaults lives in the workspace navigation menu; Mod+R retains
the existing guarded reload boundary. Recovery stays below the workspace so tabs
remain at the top edge even when conflicts are visible.

The private `shell_info` command reports runtime, platform, process identity and
application version. `shell_ready` acknowledges renderer readiness. Native
state, rather than a DOM marker alone, confirms that handshake. These commands
confer no vault or process authority.

Native acceptance launches its separately identified macOS application bundle
and brings the real WebView forward before interactions. Hidden WebKit pages
suspend animation frames and cannot qualify menu completion. Focus permission
belongs only to the e2e capability; ordinary bundles retain their existing
grants.

Startup reads the public API `path` and `runtime` entrypoints. Runtime identity
does not need to load optional database or model services.

The native e2e feature uses separate configuration and a test profile. Its
artifact is never the ordinary application bundle. Browser and Rust tests are
supporting evidence; neither can replace the actual WebView gate. Builds reject
catalog imports; shell grouping preserves one main landmark.

Application signing and notarization are deferred to M11 at the user's request.
The local bundle gate checks identity, architecture and runtime contents without
requiring a signature. WebDriver's embedded pointer actions dispatch DOM
MouseEvents and cannot establish AppKit titlebar dragging. Physical native input
and persisted window positions must qualify that boundary separately; synthetic
pointer results cannot waive it.

Headed e2e readiness unhides the application and shows/focuses its window before
the handshake; setting focus alone cannot unhide a background macOS process.
This activation code is excluded from ordinary bundles. An e2e-only native probe
distinguishes visibility, minimization, active-Space membership, occlusion and
key-window state when foreground qualification fails. The original
visible-document guard and its deadline remain mandatory. While its original
15-second visibility deadline remains open, the acceptance driver may repeat
Tauri's focus request for a hidden document. macOS can decline the first request
while a preceding cold process is leaving its Space. The driver must observe
actual visibility and a real animation frame before interacting. No Space,
window-level or stacking override is applied.

[Governance](governance.md#native-acceptance-modes) defines the separate hidden
IPC acceptance mode and cold readiness policy.

## Native vault access (M2)

The native profile owns at most 20 recent `desktop-folder` records. A picker
selection admits one canonical root through a directory capability; the renderer
receives its identity and an opaque session ID. Reopening requires a saved
profile ID, never a renderer-provided absolute path. Closing revokes the session
and its resource token. Every process starts without a live admission.

Create opens the new child through the selected parent's directory capability.
It MUST NOT grant admission by reopening an ambient child pathname, which could
have become a symlink outside that parent after creation.

M2 supplies bounded stat, existence, list, text/binary read, range read, mkdir,
append, and whole-file atomic write operations. Requests are serialized by the
native vault owner. Files are limited to 64 MiB per whole-file operation, range
reads to 256 KiB, and listings to 2,000 entries. The public Notes adapter is
translated through an explicit command allowlist; unrelated service capabilities
remain unavailable. M5 file-management operations and watching are governed
separately in [File management](files.md). Streamed writes remain later intake
and MUST fail explicitly until implemented.

Vault paths use forward slashes; the virtual root is the empty string. Reject
dot/parent components, NUL, backslashes, drive prefixes, and paths over 4,096
bytes. Symlinks are unsupported, including links whose targets remain inside a
vault. Capability-based filesystem resolution provides an additional containment
boundary if a path changes after validation. Reads accept only regular files;
listings omit symbolic links and special files.

Atomic replacement preserves existing permissions and honors a supplied valid
modification time. Creation times are filesystem-owned. A power loss after the
rename is outside M2's process-interruption guarantee. Pre-release application
state may be reset; ordinary note-write integrity still applies.

The `lapis-vault` protocol serves only supported image, audio, video, and PDF
attachments, with a restrictive response CSP. Neither raw HTML nor scripts are
served. The only added renderer network origins are this local resource scheme
and its platform-local equivalent. M2 does not construct App or claim note
editing; M3 mounts the existing workspace and proves the native database.

The renderer transport translates native serialized errors into JavaScript
Errors while preserving their portable code and message. Shared adapters must
receive usable filesystem failures, including EEXIST during state
initialization.

Directory listings return immediate child names at every depth, relative to the
requested directory, as required by the public Notes vault adapter contract.

## Native database and Notes intake (M3)

Native Turso is the early feasibility gate. The host opens one database per
admitted profile, addressed only through opaque connection IDs. Databases live
under the native OS profile, separate from vault-local `.lapis` state. Root
admission, connection lifetime and all filesystem/database requests share the
native owner's serialization boundary. Closing a vault with a live database MUST
fail until that database closes. Repeated opens for the same live admission
return its existing connection ID; another admission cannot claim that database.

The public connection adapter implements exec, run, get, all, batch and close.
Integer frames use canonical decimal strings to avoid JSON precision loss; the
renderer returns safe integers as numbers and larger integers as bigint. Binary
frames preserve every byte. Named bindings include their SQL prefix. Each
statement is limited to 128 KiB; batches to 1,024 statements and 4 MiB of
encoded input; results to 100,000 rows and 16 MiB. Unsupported values fail
explicitly. The renderer cannot silently substitute WASM, memory or a JS
runtime.

SQL validation recognizes strings, quoted identifiers and comments before
checking statements. It permits the SQL needed by the shared AppDatabase while
denying attachment, vacuum, extension/file functions and external transaction
control. Only table/index/foreign-key schema introspection pragmas and their
table-valued equivalents are public. Virtual tables and filesystem modules
remain denied. Turso attachment and vacuum features remain disabled. Host-owned
batches select deferred, immediate or exclusive behavior and prevalidate every
statement.

The shared desktop launcher selects or creates a native folder and opens the
owned Notes session immediately, matching the Deno flow. Returning to vaults
MUST finish session teardown before the launcher becomes available. A failed
startup or teardown MUST remain visible and retain ownership for recovery
instead of silently opening another session.

The desktop-owned initial plugin profile contains Source Editor, Markdown and
File Explorer through public exports. Search and other plugin intake retain
their later milestones. The retained WorkspaceShell owns presentation; desktop
owns boot, profile resolution, native transport and teardown. M3's editing proof
does not waive M4's close/save/conflict/session-restoration gate.

## Notes startup presentation

Startup reports actual awaited vault, configuration, plugin, layout and metadata
operations through the existing shared startup component. No simulated time or
minimum delays are added. Design Core owns progress bars, tasks and semantics.
Recovery uses the shared themed banner. Editable merges retain the writer guard
(`files.md`).

## Safe lifecycle and restoration (M4)

The native owner intercepts window close and application Quit. It emits one
host-issued request to the main renderer and accepts only its matching result.
Failure cancels the pending request; unresponsive renderers remain open. The
renderer installs its listener before acknowledging shell readiness. Explicit
reload and its keyboard shortcut use this same boundary.

The Notes owner uses the public editing-session guard and API-owned awaitable
layout writer. It never writes a second copy of workspace layout. Failed saves
must complete before any controller/plugin/database teardown begins. A completed
guard is followed by editing-registry disposal before releasing the session.

Before entering that guard, the host finishes the focused existing form control
and awaits its blur callbacks. This admits Properties and Settings changes that
commit on blur while their component is still mounted. Teardown must not remove
an active input before its normal commit can join the owned writer queue.

Last-Notes intent lives in the native OS profile and references a known recent
profile, never a renderer-selected absolute path. Restoration revalidates the
physical root using normal recent-vault admission. Missing folders, changed
roots, corrupt state and failed startup retain visible recovery through the
launcher. Fresh selection and an intentional return to the launcher remain
available. No legacy `.obsidian` state import is required.

M4 remains incomplete until external-edit protection and the entire original
aggregate gate are qualified. Native watching remains M5; delaying watching does
not waive conditional-save protection in M4.

Conditional text storage is an independently qualified component. It receives
the caller's snapshot explicitly, never a host-wide last-read cache. The host
serializes its own requests and checks immediately before atomic replacement,
including changes observed during staging. Uncoordinated filesystem writers can
race OS operations; this is not a cross-process filesystem transaction. Editor
document baselines, visible conflicts and explicit recovery remain required
before the original M4 gate can complete.

The Notes host consumes the App-owned conflict registry, including retired
writers. Problems opens the shared editable three-way review; its settings use
compact, theme-aware Toggles. Saving uses the captured guarded writer;
whole-version decisions remain conditional and revalidate disk bytes before
discarding drafts. Check disk again refreshes snapshots without resolving.
Failed/stale decisions retain conflicts and block shutdown. Desktop adds no
parallel save path.

Editable Markdown previews bind their captured Mira session to the original
App's editing registry and the public API FileTextPersistence contract. Each
source keeps its own acknowledged baseline and operation-owned recovery lease;
equivalent internal-link resolution must not replace the visible writer. Failed
and retired previews remain visible to shutdown and recovery. Accepting disk
text must update the visible editor and permit later saves, including after an
empty save. Unbound writes on conditional-capable hosts reject.

API editors and editable previews are separate qualified components. Properties
and metadata text mutations must join the App-owned writer lifecycle, protect
existing documents before transformation and retain failed drafts for recovery.
Properties must compare the displayed record with authoritative frontmatter;
unrelated body edits remain compatible. Metadata types must join shutdown before
any debounce can omit an edit, including initial creation and external deletion.
The complete enabled-writer audit and cold native acceptance remain M4 gates.

Configuration changes use the existing shared Settings controls. Logical updates
serialize against acknowledged values, and pending/failed drafts join the App
writer lifecycle. An invalid external record cannot clear a conflict during a
rejected reset.

Core-plugin choices, App Shell enablement and compatibility data files use
App-owned retained state writers on conditional hosts. Runtime recovery holds
the owning lease while applying the selected state outside the persistence
queue, then rechecks disk bytes before acknowledging the decision. A failed or
stale projection retains the original draft and shutdown barrier.

Before the global writer guard, teardown awaits admitted App Shell transitions
and multi-step App file operations. Creation stays admitted through native IO,
file-tree projection and the existing Explorer open action. Initial Properties
read failures retain their admitted mutation for retry. The remaining writer
audit and final M4 aggregate qualification stay explicit in the task ledger.

Startup recovery uses the existing shared startup component and extracted Deno
Safe Mode banner. Host callbacks retry through guarded session teardown and
fresh App construction. Recovery is scoped to the selected vault in session
storage, never vault configuration. Skipping layout leaves its original bytes
untouched; only explicit reset uses Workspace reset/flush before restarting. The
banner remains below the tabs. Message-plus-stack diagnostics retain their
message when WebKit supplies a stack without it.

M5 watch ownership lives in `files.md`; M7 native integration lives in
`integration.md`. Watch resources remain separate from projection.

Explorer imports and mutations share FileManager writer protection. Cold native
checks retain dirty conflict bytes before rename, move or deletion and retry
existing actions after explicit recovery. Clean rename/move retargets the active
editor and saved layout through restart; view rebinding follows guard release.

New-file intent uses native exclusive creation when available. State overwrite
APIs keep their separate semantics. Creation cannot project success after a
collision or failed write.

Existing Explorer menus use admitted macOS open/reveal/system-trash ports.
Capability checks retain unsupported behavior and local-trash fallback. Shared
Vault projection handles successful system trash once, without a second deletion
or replacement action surface.

[Native qualification](native-acceptance.md), including E-AI-029/030 batch
consumption, retains AI and repository gates.
