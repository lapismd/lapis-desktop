# Committed native conversation catalog

LD-REPO-003 and LD-AI-002 retain AgentStore/ThreadStore authority. Native
conversation discovery reads committed ThreadStore membership, rather than
treating private preparation/recovery files as a second conversation database.
Listing does not admit execution or complete managed renderer adoption.

## Current source and admission

The existing main-window backend command may list conversations only through an
explicit current JJ backend handle and native physical-vault admission. Roots,
actor, repository, generation and arbitrary metadata selections are not renderer
inputs. Private creation records and their actor file are not required for this
read. The provider is read-only, has no actor and denies writes.

An empty source returns an empty catalog without initializing companion
metadata, private conversation directories or a device actor. Reads do not
repair receipts, snapshot working-copy files, start providers or reconcile
heads. Foreign/stale handles and unavailable or malformed source data fail
explicitly; failure must not masquerade as a valid empty catalog.

## Bounded canonical pages

Only native conversation-purpose threads are catalog entries. Preserve their
complete target kind and identity (app conversation or recorded session), thread
identity, native lifecycle status, source creation/update timestamps and
selected custom title. Annotations are excluded; tombstoned threads remain
retained in source history but are not listed. Conflicting duplicate
conversation targets fail explicitly rather than choose an arbitrary thread.
Native source timestamps need not be monotonic.

Each page has at most 32 entries, from a current committed ThreadStore snapshot
with at most 4096 current threads. Source creation-time traversal shares a bound
of 8192 historical headers per page. JSON output retains full-width integers in
the existing bounded native text envelope. Oversized inventory/history/output
fails explicitly instead of claiming complete coverage.

The bounded continuation names an actual previous conversation thread and the
original ThreadStore selection. A continuation is valid only while that exact
selection remains current; a changed selection requires restarting discovery. It
cannot grant another source or choose arbitrary retained/staged metadata.
Unknown versions, surplus cursor authority and absent thread boundaries reject.

Native IO, parsing and inventory work runs through the existing awaited worker
and counted backend call. Revocation and closure retain their current fencing
and drain policy. No renderer state blob or fallback writer is introduced.

## Canonical opening and retained reads

The current native thread ID may select a conversation-purpose member of the
committed source. Annotation threads cannot be reinterpreted as conversations.
Version-2 views retain the complete canonical target, thread and repository
identity without inventing a device request or remapping opaque source IDs. They
reuse the bounded native metadata, human-message and linked-session projection.
Thread and Agent snapshots must share one committed selection.

An opaque retained read owns its original Agent snapshot and issued stream
boundaries. Continuations retain that selection through later capture and loss
of private creation/actor records. Current physical admission, backend/read
handle ownership and repository identity are revalidated; neither a staged
object nor renderer-supplied source selection can become a pin. The existing
shared eight-read capacity and close/reload fencing apply. Version-2 ranges
carry canonical identity; version-1 original-request reads keep their existing
receipt checks and wire shape.

Canonical discovery and reads do not authorize a write, repair a private intent
or admit a worker. Managed launch and existing writes retain their original
confirmed preparation path; E-AI-078's separately explicit
[canonical capture draft](ai-managed-capture.md) adds existing-thread
participation without making a read into a launch grant.

M10.2/M13.3 retain canonical conversation editing, complete metadata and binding
projection, renderer/backend adoption, context/skills/memory and full mounted
restart recovery. This catalog alone cannot complete those gates.

## Renderer adapter under implementation

E-AI-073 restores and extends the deferred renderer transport behind an owned
`ConversationBackendPort`. Native services expose it lazily through the same
admission/drain owner as ACP; store commands allocate no ACP transport or
worker. The adapter retains exact conversation/recorded targets,
thread/repository IDs, selection bytes, opaque page cursors and retained
snapshot text. Its bounded integer-only catalog decoder preserves i64 timestamps
as bigint. No UUID file location is synthesized for an opaque native
conversation.

Typed rename/lifecycle and authored-message calls retain their exact request
identities and native proof text. Missing receipts remain unknown; status reads
never resend a command. Existing frame/input limits and physical/native
admission govern every call. This adds no new native command or provider grant.

The adapter does not select a backend or replace the active renderer store. Full
native metadata/binding/event projection, managed authoring/capture, canonical
participation after private-cache loss and the mounted chat lifecycle remain
required integration work. Verification is parked by the user; transport and
malformed-frame regression cases are present but have not been executed.

The owned renderer catalog consumes an already opened JJ backend; it has no
backend-selection, source initialization or provider-start port. Refresh
publishes only the latest request. Continuations must retain repository and
selection and cannot duplicate a thread/target, repeat a cursor or exceed 4096
rows. Failure retains the last successful page with an explicit error state.

Canonical read replies bind their version-two thread/repository/target and
selection to the returned opaque pin. Invalid identity replies close any
validated newly allocated read handle. A lease may open only a listed thread;
its exact native identity is checked again. Current catalog refresh does not
replace that retained pin. Each lease fences and drains its ranges before close.
Catalog closure drains late opens and releases its pins, retaining failed
cleanup for exact retry; it never revokes the parent backend or another worker.
Native admission remains the final owner of an open with an unobservable reply.
No regular chat route is switched by this reader. Complete event/tool/evidence
projection and mounted writer integration remain required.

## Retained typed source records under implementation

E-AI-074 adds an opaque records cursor for each linked session of a retained
read. It selects the original session's event/tool/evidence references and their
content/evidence closure in the retained Agent snapshot. The caller supplies
only backend/read handles, that issued cursor and an issued u32 boundary; it
cannot choose an object, root, repository, session or source selection.

Pages retain native object references and typed event/tool/evidence/content
fields. Sanitized UTF-8 payload bytes travel as exact text plus their original
media type. Normalized transcript chunks do not stand in for raw ACP records.
Pagination is bounded to sixteen objects and 1.5 MiB of record data per page,
with at most 65,536 cached references across one read. Oversized individual
records fail explicitly. Closure discovery cannot silently truncate or admit a
different object kind. Only successfully encoded/currently admitted page
boundaries become continuations; repeated reads never initialize or publish.

Every page revalidates physical/window/backend admission and its original
prepared or canonical read origin on the awaited worker. Catalog refresh and
later capture do not replace the retained snapshot. Read closure, source
replacement and revocation keep the existing rejection/drain rules. Source
coverage remains separate from reaching the end of a records page. This draft
does not complete renderer projection or managed chat; verification is parked.

The renderer adapter decodes retained linked-session indices and typed record
pages while keeping the complete source snapshot and page text. Object, session,
event, message, turn, tool and attempt identities remain native. Full-width
source counters/timestamps use bigint; sanitized JSON payloads stay exact text
rather than becoming ACP events. Unknown fields/schemas, substituted cursors,
origins, sessions and selections fail explicitly. Record requests share the read
lease's close fence and drain with transcript ranges.

The linked-session read cache admits only references reached from that original
session and the typed dependency closure. It retains prior successful pages on
failure, retries only the same failed read boundary and never retries a write.
Across one read, renderer caching is bounded to 65,536 records and 32 MiB of
original page text. Limit/closure failures stay explicit. A completed page
inventory does not upgrade source coverage or imply a successful provider turn.
Multiple original links to the same session retain their separate snapshots.
Ordinary chat still uses the explicit file backend; rendering complete native
metadata, bindings, messages, tools and managed launch remains open.

## Native reader presentation under implementation

E-AI-075 projects committed native headers, metadata, human revisions and typed
session records through the existing embedded session shell and shared
Transcript. Complete source objects and exact snapshot text remain available;
the native view also exposes the already-selected thread, metadata and human
revision references for exact presentation revisions and retained reply anchors.
derived labels never replace native identity, time, state or coverage. Unknown
cross-source ordering, participant attribution and message correspondence MUST
remain explicit. Matching text cannot merge native messages or identify an
author. Thread messages and linked-session streams retain separate selectable
origins until a committed correspondence exists.

Historical tool/permission records are inert: unfinished tools display unknown,
captured permission requests offer no approval action and native capture gaps
remain visible. Source coverage is distinct from record pagination. View
switching and tool inspection retain the original pinned read. Loading uses the
existing transcript/list skeletons. Read failures use one App notification and
retain the previous successful view; a failure cannot appear as an empty catalog
or silently open the file backend. This review slice does not authorize provider
launch, authoring or an implicit storage selection.

## App ownership and backend-specific references

E-AI-084 drafts an App-owned native workspace around the existing catalog and
reader. Allocation makes no native request. First use reads the saved backend
choice, requires an explicitly selected JJ revision and opens one backend with
one retained native request. It never selects JJ, creates repository state,
retries an unknown open or constructs a file-store fallback. Reader panes share
the catalog/backend while owning separate pins, record cursors and cleanup.
Closing a pane cannot revoke another reader or worker. Application shutdown
drains turns and views, then reader/catalog pins and the exact known backend
before releasing native services. Failed cleanup retains the same resources for
explicit retry. An unknown open handle remains owned by the enclosing native
admission service, whose later revocation/drain must settle native work;
renderer closure never invents a replacement handle.

The version-one conversation route has an explicit `vault-files` or `jj`
discriminator. File references retain their confined scope and UUIDv4. Native
references retain the exact target kind/opaque value, thread and repository;
they contain no backend/read handle, source selection, actor, root or transcript
snapshot. Native opaque targets are never UUID aliases or file locations. Legacy
scope/ID tab state is recognized only as a file reference. Ambiguous, partial
and malformed route objects fail without trying the other backend.

A restored native reference can request a native pin without scanning catalog
pagination. It is only a reference: current native membership/admission and the
full identity returned by the pin must still match. A foreign reply closes that
pin and retains the prior successful view. Catalog-selected reads keep their
existing membership check. Typed record/selection fences remain unchanged.

Existing admitted storage cleanup may finish after plugin disable: only backend
close, read close and dispatch fence/Stop use that cleanup path. New reads,
writes and Begin still require active enablement; native caller/source checks
remain authoritative for every operation. No wildcard permission, source path,
launch authority or unadmitted cleanup is added.

These sources are unqualified. E-AI-086 below drafts backend Settings and native
creation; full embedded composer/controller adoption remains pending. Workspace
ownership alone does not switch the existing ordinary file profile.

## Additive native conversation tabs

Normal ACP chat and its existing sessions remain supported. Native JJ history
and persistence augment them: selecting or restoring a native conversation must
not replace ACP execution, automatically migrate existing chats, hide file
conversations or reinterpret a native reference as an unbound file pane. Native
execution-path retirement means removing bypasses of native capture authority,
not retiring the supported normal ACP path.

E-AI-085 drafts ordinary AI tab-state adoption. Tabs write the version-one
backend reference and read paired legacy file state as a file reference. The AI
view validates before accepting state; a malformed/mixed route cannot start the
other reader. A native route mounts the existing native browser in the embedded
Design Core AppShell, owns an independent App reader lease and opens the exact
reference without requiring its current catalog page. The normal route retains
AiViewPanel and its ACP composer/controller. A new navigation helper matches the
complete backend-specific identity before reusing a tab; only a genuinely
unbound pane may be assigned another conversation. Native routes do not reveal a
fabricated file scope. Late callbacks from a replaced pane cannot rewrite the
new route. Closing the native pane drains its read work without closing another
pane or replacing the shared backend.

The native route is still read-only in this draft. It does not grant a Send,
provider launch or backend selection, and does not make ordinary native chat
complete. Native setup is drafted below; complete multi-origin projection, the
native composer and mounted recovery still need implementation/acceptance.

## Optional native history settings and creation

E-AI-086 drafts controls inside the existing AI plugin settings, using the
retained jj-store settings card/footer and public Design Core inputs. Initial
render reads the current choice; it selects no writer, creates no repository and
starts no provider. Applying a choice uses a fresh explicit native request and
observed revision. The exact receipt must match request, expected revision,
backend and next revision. An unknown outcome retains that request and blocks
new native opening/mutations; Check reads its original status without replay.
Reading the same current choice is not proof of a missing original receipt.

Changing storage fences new native use and drains already-started workspace
calls. An active native pane or retained turn prevents the change without
calling Select. An idle catalog/backend closes before the choice is sent; a
failed close retains the same owner for retry and denies new opening. A native
open with no observable handle cannot be replaced to escape its uncertainty;
native admission must drain it on disable. After a confirmed idle release, a
later native open gets a fresh request. Turn ownership survives pane closure
until supervised native Stop and cleanup complete. Normal ACP remains usable.

Create uses one exact single-line title and native preparation request, with no
file-shaped alias. It opens the existing explicit JJ backend before retaining
the creation intent. Navigation requires a confirmed native provider receipt and
complete repository/thread/target identity. Missing replies/receipts retain the
original title/request; Check only reads preparation status. A returned
unconfirmed identity cannot change conversation/thread or a known repository
during recovery. No creation starts an agent. The separate native-history
command uses the same production embedded browser; ordinary Open Chat and
file-backed History retain their existing behavior.

These controls, idle transitions and turn ownership are unqualified source.
Pending renderer intents currently survive Settings/pane changes within one App
lifetime; durable mounted restart discovery/recovery is still pending. Native
composer/context and full lifecycle/provider acceptance remain open.

E-AI-079's [native attribution draft](ai-native-attribution.md) projects
explicit host facts and validates authored references against the original
companion graph retained with the Agent pin. It adds profile-backed avatar
presentation and exact turn grouping without merging equal text or upgrading
delivery state. Ordinary native chat/store adoption and qualification remain
open.
