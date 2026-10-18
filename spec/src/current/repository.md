# Repository history and conversations

The existing Git-backed JJ vault is the code authority. The desktop consumes
owned JJ interfaces; it does not import upstream `jj-lib`. This work implements
the Notes consumer of jj-store M33 in independently verified slices.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LD-REPO-001 | Repository reads MUST require current native physical-vault and caller-window admission independent of AI enablement. Roots, metadata/Git witnesses, repository identity, cache location and registration generation MUST remain native-owned. Discovery grants no authority and MUST NOT initialize, snapshot or reconcile a source repository. |
| LD-REPO-002 | History and diff reads MUST retain exact operation pins and full-width identities through bounded versioned text frames. Replacement, revocation or stale generations MUST reject retained reads. Native close MUST fence new work and drain owned reads/preparations before vault release; database blockers MUST preserve authority.           |
| LD-REPO-003 | JJ-backed conversations MUST explicitly select AgentStore and ThreadStore persistence with confirmed receipts and unknown-outcome recovery. One native raw event owner MUST sanitize and durably retain before display or acknowledgement. Legacy file conversations retain their explicit backend; unknown prompts MUST NOT replay.             |
| LD-REPO-004 | History and the separate operation-log view MUST reuse Design Core Column Canvas with jj-store graph/row presentation. Columns MUST adapt to pane width independently of viewport width; selection, refresh, file changes and details MUST remain readable and reachable in narrow panes.                                                        |

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

The native transport, application history UI, raw-event owner and durable JJ
conversation adapters require their own later qualification. A service-only test
or successful compilation cannot complete the first usable milestone.

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

The optional bundled Repository History plugin uses the public history client
and an injected, App-owned reader. Its native factory retains the admitted vault
token; renderer state cannot supply paths, cache policy or generations. History
is independent of AI. Opening a view admits read access lazily and never
initializes a repository or captures dirty working files.

The view names its exact operation pin and revision comparison. Refresh observes
heads without moving an existing selection; multiple initial heads require an
explicit choice. Bounded commit and changed-path pages remain within that pin.
Merge revisions require an explicit parent comparison. Binary, conflict,
structural and bounded-content refusals stay unavailable, never empty diffs.
Design Core owns diff rendering. Requests retain their selection identities and
stale responses cannot replace a newer selection. Preparation polling is bounded
and stops on selection changes or closure; failed reads require explicit retry.

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

The native managed-capture adapter accepts the shared capture port with an
injected admitted policy and durability sink. It preserves whole ordered frame
batches and stops on unknown or mismatched receipts. Its synthetic cold native
acceptance supplies private fixture records, rather than a selected Notes
AgentStore/ThreadStore backend. Native privacy, durable backend adoption and
conversation restart recovery remain the M13.3 gate.

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
Reading an absent selection retains the named legacy backend without creating
repository or profile state. Malformed selections fail; they never choose a
different writer. JJ selection verifies existing source witnesses without
initialization. Opaque private source fingerprints are rechecked when opening
and using an owner. A changed JJ binding requires an explicit new selection.
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

## Native conversation preparation

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

## Commit and operation-log columns

The bundled Repository History plugin registers independent history and Op Log
workspace views, commands and ribbon actions. Both use public Design Core Column
Canvas and adapt jj-store-owned graph geometry, row presentation and column
widths, with source/license attribution in `docs/provenance.json`. Production
cannot import either repository's application or catalog state.

History retains its exact operation and revision/file comparison semantics. File
selection opens the diff column; operation metadata opens through an explicit
details control. Expanding rows keeps file choices in view. Wide panes provide
resizable columns and narrow panes use Column Canvas compact navigation,
including return to the log. The root measures its own pane; no viewport media
query chooses this behavior.

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
both independently mounted workspace views. The outer Notes workspace retains
its existing ownership. Commit rows expose separate full Git SHA and native JJ
reverse-hex change-ID copy controls, never nested buttons. Clipboard failures
use App notifications and explicit successful retry clears their exact notice.
Expanded rows use public FileListing folder/list/package modes. File selection
opens a matching diff column with change counts, unified/split layout, wrapping,
close/reopen and compact return through the column controls. Expanded rows
retain measured graph bounds. Collapse/reselection fences previous replies.

Operation rows expose bounded native change groups after an exact parent delta.
The user selects the changed revision, then the native exact pair or both sides
of an explicitly ambiguous pair. Unavailable comparisons never invent endpoints.
Changed paths and text use that view's existing pinned handle and the same file
and diff presentation; metadata details remain a separate column. Source refusal
uses the application notification/retry path without fallback or an empty diff.
