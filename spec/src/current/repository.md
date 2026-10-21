# Repository history and conversations

[Local ACP](ai-local-history.md) joins LD-REPO-005 backup. E-AI-114 adds native
[turn observations and guarded undo](vault-backup.md) without AgentStore. The
LD-REPO-003 experiment stays Deferred; existing history/sync remain active.

E-REPO-043 governs upstream actions/counts and OS directory reveal in
[automatic backup](vault-backup.md), retaining admission and operation pins.
E-REPO-024/025 and E-CATALOG-009/010/012 govern footer status/clearance
([navigation](repository-navigation.md)); read authority is unchanged.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-REPO-001 | Repository reads MUST require current native physical-vault and caller-window admission independent of AI enablement. Roots, metadata/Git witnesses, repository identity, cache location and registration generation MUST remain native-owned. Discovery grants no authority and MUST NOT initialize, snapshot or reconcile a source repository.                                                                |
| LD-REPO-002 | History and diff reads MUST retain exact operation pins and full-width identities through bounded versioned text frames. Replacement, revocation or stale generations MUST reject retained reads. Native close MUST fence new work and drain owned reads/preparations before vault release; database blockers MUST preserve authority.                                                                          |
| LD-REPO-003 | JJ-backed conversations MUST explicitly select AgentStore and ThreadStore persistence with confirmed receipts and unknown-outcome recovery. One native raw event owner MUST sanitize and durably retain before display or acknowledgement. Legacy file conversations retain their explicit backend; unknown prompts MUST NOT replay.                                                                            |
| LD-REPO-004 | History and the separate operation-log view MUST reuse Design Core Column Canvas with jj-store graph/row presentation. Columns MUST adapt to pane width independently of viewport width; selection, refresh, file changes and details MUST remain readable and reachable in narrow panes.                                                                                                                       |
| LD-REPO-005 | Enabled vault history MUST automatically retain saved internal/external file changes as Git-compatible checkpoints with durable vault identity, external metadata by default, independent exclusions, guarded restoration, historical search and recoverable GitHub/Forgejo synchronization. Capture permissions and lifetime MUST remain separate from immutable history reads and optional status visibility. |

## Native admission

A separate service registry reuses the shared two-phase `VaultAdmissions`
transition. Its pending tickets cannot authorize reads; its grants cannot enable
AI, and AI grants cannot enable history. Native discovery observes the existing
JJ metadata/Git paths. Admission pins the physical vault, JJ directory,
working-copy directory, repository link, metadata/store and Git directory plus
bounded store-type and Git-target file witnesses. Replaced directories, altered
links and changed store bindings invalidate the grant. Ordinary external JJ
operations may advance heads without changing this physical binding.

Native registration identities are installation-owned and do not initialize a
companion identity in the source. A monotonic native registration generation
fences retired grants. A same-root reload can retain its generation only after
revalidating all source witnesses. Failed or stale completion cannot activate a
replacement. Source proof failure and explicit retirement deny existing access.

Native capture and JJ adapters require product proof beyond service tests.

## Qualification

Real stock-JJ fixtures must cover internal and colocated Git, shared repository
links, source/dirty-file preservation, no companion initialization, physical
replacement, stale tickets, independent AI grants, closure fencing and explicit
reload. Native command integration additionally requires a cold hidden WebView
with actual caller frames and exact permission grants. Presentation uses
released Design Core Chat/Diff exports with production component stories. A
recoverable one-agent conversation completes the first usable milestone only
after actual native persistence and restart acceptance.

Visible history acceptance uses the actual native window and ribbon/diff
controls, preserves dirty source bytes and JJ/Git metadata, observes an external
operation without moving the pin and restores that pin after cold close/reopen.
A visible but unfocused window does not qualify the headed interaction gate.

## Notes history view

[File history and blame](repository-navigation.md) govern the sidebar, row
actions, loading, wrapping and inset pane sizing (LD-REPO-002/004;
E-REPO-018/044/055).

The optional bundled Repository History plugin uses the public history client
and an injected, App-owned reader. Its native factory retains the admitted vault
token; renderer state cannot supply paths, cache policy or generations. History
is independent of AI. Opening a view admits read access lazily and never
initializes a repository or captures dirty working files.

Unified Search follows [vault backup](vault-backup.md). The view names its exact
operation pin and revision comparison. Refresh observes heads without moving an
existing selection; multiple initial heads require an explicit choice. Bounded
commit and changed-path pages remain within that pin. Merge revisions require an
explicit parent comparison. Binary, conflict, structural and bounded-content
refusals stay unavailable, never empty diffs. Design Core owns diff rendering.
Requests retain their selection identities and stale responses cannot replace a
newer selection. Preparation polling is bounded and stops on selection changes
or closure; failed reads require explicit retry.

Restored JJ and operation-log views share one bounded preparation queue over the
native worker. A second view waits for the prior preparation's terminal status
or drained close before opening its own handle. Queueing never retries an
unknown open outcome or changes a selected operation. Closure fences queued
work. Each view publishes its complete loading lifetime through App status
progress, including time waiting for that worker (LD-REPO-002/004).

View/plugin teardown fences new work, drains pending requests and closes owned
handles before native release. Failed cleanup remains retryable. Reload obtains
fresh handles through the existing native admission transition. Operational
failures use App notifications and recovery retains the selected pin.

Restored repository-view state retains its explicit operation before starting
history preparation. Initial controller state must not replace a restored pin
with the current head. Reopening a view obtains fresh admitted handles for that
same historical operation.

## Native history transport

The named main-window admit/release commands accept only a live vault session or
explicit reload mode. Tauri supplies caller window and URL; the host checks the
bundled origin or exact development origin. The history plugin receives only
`jj-store:local-history`; default, wildcard, remote and mutation grants remain
absent. History is available independently of AI admission or targets.

Every retained reader checks its exact native repository grant at entry and
completion. The host supplies bounded defaults and a private profile cache; e2e
acceptance uses its isolated temporary cache. The public versioned JSON text
transport preserves full-width values and strict request frames.

A shared native transition guard serializes replacement, release and vault
closure through actual read/preparation drain. A failed drain leaves admission
unavailable and retryable. Database blockers are checked before any vault-close
fence. Database opening shares this guard, so it cannot invalidate a successful
close preflight during reader drain. A delayed old-vault close skips a newer
admitted generation because the replacement already drained its predecessor.
Destroyed windows invalidate pending tickets immediately; plugin
destruction/exit drains the reader owner. Reload suspends native authority and
drains handles; verified re-admission may retain its registration generation but
must obtain new handles.

E-REPO-006 qualifies cold visible history on macOS ARM64 with real JJ source
preservation and exact restored pins. Each cold launch received a physical
foreground click; document focus and the native visible/current-Space/unoccluded
keyboard-window state remain mandatory. The test drives the mounted operation
select through standard input/change events because the embedded driver cannot
select an option through its JavaScript click. Unattended foreground activation
remains a separate test-infrastructure gap; durable conversations remain M13.3.

The native managed-capture adapter preserves ordered frame batches and stops on
unknown or mismatched receipts. Synthetic cold acceptance supplies fixture
records. E-AI-067 separately qualifies actual Codex through ordinary policy,
native Agent/Thread capture, unchanged cold reads and refused launch replay.
Renderer authored writes, backend adoption and full managed chat/context
recovery remain the M13.3 gate.

Native grouped-frame provenance distinguishes each frame at a shared cursor in
both legacy transcript backends. Omitted indexes preserve historical identity
and hashes; explicit backend selection and confirmed native durability remain
required before a JJ-backed conversation is enabled. E-AI-029 qualifies this
production renderer prerequisite, not AgentStore/ThreadStore publication or cold
restart recovery.

The Notes native capture adapter can select the shared real privacy policy
without selecting a writer. Missing backend selection and stale native admission
must reject processor construction; neither may retain raw event delivery. The
real-scanner fixture remains separate from AgentStore/ThreadStore sink
publication and restart recovery.

## Private capture journal

Notes owns the production private journal used by the selected-store capture
adapter. A host-admitted profile capability, exact capture context, selected
provider scope and current-admission callback are required before construction.
Its exclusive OS lease belongs to one source/backend; context and provider
fingerprints survive reopen without persisting device paths or credentials. Only
bounded regular owner-private records are admitted. Candidate creation is
exclusive and atomic; exact preparation and confirmations advance monotonically
through synced staged replacement and parent-directory sync. Each operation
rechecks admission before and after IO. Cancelled callers cannot detach a write.
An incomplete or unknown record is retained and never reclaimed as a new intent.
This journal grants no execution or publication authority; original provider
receipt replay remains mandatory. Host/backend selection and native callback
drain retain their separate integration gates.

## Admitted backend profiles

A device profile selects `vault-files` or `jj` for an exact physical vault.
Native JJ augments ACP; existing file sessions remain independent and
unmigrated. Absent selections retain file storage without repository/profile
creation. Malformed selections fail without selecting another writer. JJ
selection checks existing witnesses without initialization; opening/use rechecks
private source fingerprints. Changed JJ bindings require explicit selection.
Selection requests retain exact identities and original receipts across later
choices. Atomic synced state includes those receipts; uncertain writes are
resolved by reading status, not inventing another request. A native owner holds
an exclusive profile lease so its selected writer cannot change during its
lifetime. Closing fences new calls, drains admitted calls and retains the lease
until the final owner/call drops. Abandoned close remains fenced and retryable.
Native admission, execution and renderer integration remain separate grants.

## Native backend ownership and transport

The last logical backend lease explicitly unlocks its file. Incidental kernel
descriptor duplication must not extend ownership after all native owners and
calls drop. The capture journal applies the same rule to its exclusive lease.
Acquired locks must enter owned lifetime guards before fallible initialization.
Exclusive ownership during their lifetime remains mandatory.

The native backend may retain counted capture permits over renderer reload and
old-token closure. Each permit binds its original native worker, open request,
target, window/origin and generation to the exclusive selected backend owner.
The callback rechecks retained physical/JJ witnesses and its closing fence.
Permits cannot construct a new owner or authorize renderer commands. New
processor construction still requires active admission and a reattached current
owner. Native capture permits must drop after supervised worker drain, before
the backend lease can be released. Actual durable processor and conversation
adoption retain their separate qualification gates.

The application command manifest registers `desktop_ai_backends`; its named
permission belongs to the local main-window capability.

The local main window may read, select or recover a backend choice only for its
currently admitted vault session. Bounded versioned text frames reject unknown
fields, renderer paths, generations and scope overrides. Opening an owner is
idempotent for its original request. Another opener cannot claim the same writer
unless a native reload suspended it and verified same-generation admission has
completed; reattachment issues a fresh handle and rejects delayed old closes.
The retained scope and physical source witnesses survive verified reload.

AI admission changes, backend operations and release share one native transition
owner. Replacement and explicit disable fence the backend before revoking
workers, then drain owned calls before releasing the lease. Failed or abandoned
cleanup remains fenced, retains its owner and is retryable. Exact generations
prevent delayed old cleanup from revoking a replacement. Physical admission
failure and destroyed windows fence immediately and schedule supervised cleanup.
Window destruction is terminal within that native host; delayed frames cannot
reactivate its admission. Vault close checks database blockers before fencing
and retains its existing repository/database transition guard through release.
Ordinary unavailable capture targets remain unavailable until separately
admitted; selection/opening is not a raw-event processor, prompt grant or
renderer persistence adapter.

## Native conversation preparation and [authored writes](ai-authored.md)

An explicitly opened JJ backend may prepare a conversation through the same
bounded native command. Native code generates and retains the conversation,
thread and private actor identities. The exact original command, selected
backend revision, physical source fingerprint and optional existing repository
identity MUST be synced privately before the single ThreadStore publication.
Only the selected Agent/Thread participants share this publication authority;
preparation neither snapshots dirty files nor starts an agent.

Repeating a preparation or reading its status MUST recover the original provider
receipt without executing again. A request ID or current snapshot alone cannot
prove its intent: the canonical Git receipt must match the retained actor,
command digest, repository and thread result. Missing or uncertain receipts
retain the original preparation as unknown. Substituted actors, sources,
selections, commands or receipts fail closed. Native owner transitions retain
preparation work after caller cancellation; closure fences new work and drains
its counted call before releasing the lease. Renderer selection, actual capture
construction and managed restart remain separate.

## Prepared native capture

An explicit capture preparation binds an opaque native target to an original
confirmed conversation under the current JJ owner. Repeated requests retain the
same target and exact conversation intent; another intent cannot claim that
request. Preparations are bounded and belong to their backend owner. They retain
no counted backend call while idle, so closure can drain and release the owner.
Capture-only preparation grants neither an executable nor a prompt. Explicit
managed launch preparation uses the [admitted-client contract](ai-clients.md),
retains its client identity and permits one launch attempt with native capture.

The ordinary native processor factory MUST require the matching prepared target,
active reattached owner and exact native worker/open/window/generation binding.
It MUST recheck the original private preparation, actor and source, construct
the selected Agent/Thread participants, and retain a private journal and the
real transcript policy. Native home/temporary roots and a native-created private
scanner cache remain outside renderer authority. The cache and exact processing
permit survive through supervised worker teardown. A missing preparation,
unknown receipt, replaced source or privacy failure MUST reject construction.

Each callback checks retained authority before and after receipt-fenced capture.
Sanitized candidates and original provider confirmations precede safe output;
unknown writes cannot fall back or re-execute. Renderer suspension may retain an
existing exact processor; a new factory still needs active admission and the
reattached owner. Close fences callbacks and drains the retained call before
releasing its lease. Managed launches reuse admitted client/environment policy;
renderer adoption, credentials and full chat/restart retain separate gates.

## Native conversation reads

Native conversation reads use the current JJ owner and original retained
preparation. They verify the original provider receipt without executing or
repairing private records, and pin matching Agent/Thread source selections.
Mixed selections, substituted identities or changed source/admission fail
closed. Bounded native thread, metadata, membership and transcript data cross
the renderer transport as versioned JSON text, preserving full-width integers.
Missing preparation is explicit absence, not permission to initialize state.
Reads publish no objects and retain no idle counted call. Renderer projection,
authoring and managed execution remain separate integration work.

Schema-1 views admit 64 human messages/256 KiB of bodies, 16 linked sessions, 64
streams and 2 MiB encoded text. Transcript payloads share a 256 KiB budget with
at most 32 chunks per stream; native totals and a non-null continuation sequence
identify incomplete ranges. Refusal MUST NOT masquerade as empty or complete
data. Retained conversation reads use native opaque read and stream handles,
with at most eight open reads per backend owner. Continuation pages retain that
exact Agent snapshot and its matching Thread selection across later capture.
Every page revalidates current admission and the original conversation receipt;
renderer input cannot substitute a session, manifest, source or selection.
Canonical decimal sequence text preserves full-width cursor values. Pages keep
32-chunk/256 KiB limits and explicit next sequences. Explicit close is
idempotent; owner close/replacement and renderer reattachment retire retained
reads. Idle reads retain immutable read data, never a counted backend call or
writer lease. Renderer projection, authoring and managed execution retain
separate gates.

## Commit and operation-log columns

The bundled Repository History plugin registers independent history and Op Log
workspace views, commands and ribbon actions. Both use public Design Core Column
Canvas and adapt jj-store-owned graph geometry, row presentation and column
widths, with source/license attribution in `docs/provenance.json`. Production
cannot import either repository's application or catalog state.

History retains its exact operation and revision/file comparison semantics. File
selection opens the diff column. Op Log selection opens one comparison column
with a collapsible operation card above the file diff, matching jj-store's
header, author rail, parent pills and card spacing. The author fallback retains
the original initials/palette and short operation diffs fit their content.
Recorded command arguments appear after the operation comparison, when present.
The redundant Info disclosure is omitted. Expanding rows keeps file choices in
view. Wide panes provide resizable columns and narrow panes use Column Canvas
compact navigation, including return to the log. The root measures its own pane;
no viewport media query chooses this behavior.

Op Log has an independent pinned reader and layout state. Its bounded operation
graph preserves full operation/parent identities, descriptions, actor/host,
timestamps and snapshot markers. Detail reads compare an explicitly selected
parent; roots and multi-parent operations remain explicit. Added/removed
revisions and named view changes are shown only from the returned native delta.
Opening the selected operation in History passes that exact pin. Refresh does
not move either view's historical selection. Late detail/graph responses cannot
replace a newer pin or selection. Closing either view drains its own handles;
plugin/vault release drains both. Loading, unavailable and notification recovery
states remain distinct from valid empty graphs. Stories exercise production
views in both themes and widths; native acceptance remains separate.

The embedded public AppShell Root/Main/Body provides the bounded canvas body for
both independently mounted workspace views, retaining its public inset, border,
radius and shadow tokens. The outer Notes workspace retains its existing
ownership. Commit rows expose separate full Git SHA and native JJ reverse-hex
change-ID copy controls, never nested buttons. Clipboard failures use App
notifications and explicit successful retry clears their exact notice. Expanded
rows use public FileListing folder/list/package modes. File selection opens a
matching diff column with change counts, unified/split layout, wrapping,
close/reopen and compact return through the column controls. Expanded rows
retain measured graph bounds. Collapse/reselection fences previous replies.

History and Op Log start directly with their Column Canvas headers, matching
jj-store's omission of redundant body title bars. Native operation selection,
refresh and collapse controls belong in that compact header; full operation
identities remain the select values and accessible descriptions. No repeated
full-width pin block may displace the graph. Header controls remain available
for loading, empty, multiple-head and unavailable states in narrow panes.

Operation rows expose bounded native change groups after an exact parent delta.
The user selects the changed revision, then the native exact pair or both sides
of an explicitly ambiguous pair. Unavailable comparisons never invent endpoints.
Changed paths and text use that view's existing pinned handle and the same file
and diff presentation; metadata and diff share a column. Parent navigation
resolves exact native IDs through qualified pinned operation graph pages,
including parents beyond the displayed page, without moving the retained pin.
Lookup admits at most four 50-node pages and rejects repeated continuations;
exceeding this bound stays explicitly unavailable. Source refusal uses the
application notification/retry path without fallback or an empty diff.

An operation outside the loaded graph retains reachable comparison/file controls
without fabricating a graph row.

A fixture review story opens JJ Log and Op Log in separate production workspace
tabs. Each retains its independent pin, expanded files and selected diff while
the user switches between them. Whole-view parity and visual approval remain
separate from this comparison preview.

Parent comparisons use the source Command View/Popover commit picker with
author/avatar, relative time, exact Git/JJ identifiers and native TagList chips.
Flat local/remote/workspace/conflict tags retain overflow; filled neutral chips
stay visible on selected rows. Only exact recorded parents are selectable.
Missing parent cards use the pinned commit reader, bounded to 64 records; stale
or substituted replies cannot replace the current comparison. Metadata failures
retain selection and use App notifications with explicit retry. Selected-file
statistics remain labelled separately from complete comparison totals.

Operation parent comparisons use the same public Command View/Popover pattern.
Cards retain operation description, user/host, relative time, workspace/snapshot
metadata and full native operation IDs. They never label an operation as a Git
commit or JJ change. Only recorded parents are selectable; merge choices remain
explicit. Missing metadata uses at most four 50-node pinned operation graph
pages for at most 64 missing cards. Known cards are reused; stale selection,
comparison, pin and close responses are fenced. Metadata failure preserves the
comparison and uses an App toast plus explicit retry.

The compact JJ Log and Op Log header selectors choose exact pinned operations,
not workspaces. Both use public Command View/Popover with ID search, explicit
selection, filled `circle-check` indication, keyboard focus and full operation
IDs. Known operation metadata may enrich a card; missing metadata must not
invent author or workspace information. All repository command pickers share the
filled selection icon. Opening/searching the picker performs no repository reads
or writes. Refresh preserves a historical pin among newly observed heads; only
an explicit choice replaces the selected snapshot.

Split file diffs MUST fill the bounded remaining vertical space in the History
column and the Op Log file card, including both revision panes. Changing wrap,
collapsing operation metadata and compact pane navigation MUST retain the fill
layout. Unified operation previews retain their content-sized presentation. The
application sizes its owned hosts through public component contracts.

Production presentation, command formatting and staged adoption are governed by
[repository parity review](repository-review.md) (E-REPO-015, E-REPO-023).
