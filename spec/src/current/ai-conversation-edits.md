# Native canonical conversation editing

LD-REPO-003 and LD-AI-002 keep conversation metadata and lifecycle in the
committed ThreadStore. Existing canonical conversations may be renamed, have
their custom title reset, or receive an explicit native lifecycle action without
their original private creation record. AgentStore retains provider content.

The main-window command requires a current admitted JJ backend, native thread
ID, request ID and the exact committed selection observed by the caller. That
selection is only a concurrency precondition: it grants no historical, staged,
filesystem, actor or repository authority. Native code resolves the current
conversation-purpose member and owns the expected Thread/metadata versions.
Annotations and ordinary user Threads cannot be edited through this command.
Stale selection, unavailable source and invalid lifecycle transitions fail
before a private write intent is created.

Rename sets only the custom title and preserves generated metadata, ACP titles
and their source references. Reset clears only that custom title. Titles are
bounded to 1024 UTF-8 bytes, nonempty and free of control characters; the native
workspace sanitizer runs before durable preparation. Lifecycle actions retain
the existing native state machine, including explicit activation and
restoration. Tombstoning does not delete recorded messages or AgentStore
content.

Each explicit write syncs one exact typed command in the private recovery area
before its sole publication attempt. This journal is not a conversation catalog.
It binds the physical source, selected backend, actor, repository, canonical
target/thread, observed selection, sanitized action and original request.
Repeated commands compare the same sanitized intent and only recover the
original provider receipt. Status never initializes an actor, source metadata or
a new command. Unknown outcomes remain unknown; neither retry nor refresh may
execute an uncertain command again. Missing private creation/actor records do
not invalidate an intact edit intent or turn it into replay authority.

Receipts must match the exact provider command, request, actor, repository and
thread, and the native wrapper must retain canonical provider bytes. Source
replacement, foreign handles, closure and revocation reject or drain through the
existing backend owner. All IO, sanitization and publication occur on its
awaited worker. No working-copy snapshot, provider launch, transcript blob or
fallback writer is introduced.

These mutation primitives do not select renderer storage. Full metadata/binding
projection, managed authoring/admission, durable turn/context recovery and
actual mounted chat restart remain M10.2/M13.3 completion gates.
