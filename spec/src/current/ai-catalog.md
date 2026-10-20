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
confirmed preparation path until separately adapted.

M10.2/M13.3 retain canonical conversation editing, complete metadata and binding
projection, renderer/backend adoption, context/skills/memory and full mounted
restart recovery. This catalog alone cannot complete those gates.
