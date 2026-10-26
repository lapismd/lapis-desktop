# Background activity and responsiveness

LD-DESK-001 startup phases and App-owned background tasks MUST use the public
notification progress API with `location: status`. Progress lasts through the
actual operation, including queued work, and is removed on completion, failure
or drained disposal. Existing App notifications own operational failures.
Optional AI command initialization MUST NOT gate workspace input. Native file,
database and repository computation stays on blocking workers; command-file YAML
parsing uses the native host's dedicated renderer worker. Its timeout, failure
and disposal reject pending work without a synchronous renderer fallback.

LD-AI-002 command initialization and discovery, conversation indexing, memory
catch-up and scheduled maintenance publish App-owned status progress. Optional
command seeding/discovery runs after registering the usable plugin surfaces and
remains owned until drained closure. Native command parsing uses a lazy module
worker; invalid Markdown retains per-file diagnostics, infrastructure failures
use App error notifications, and older discoveries cannot replace a newer scope.
Provider execution and durable conversation qualification remain separate.

E-AI-077's admitted managed processor runs prompt preparation and capture-batch
scanning, normalization, journaling and publication on an awaited blocking
worker. The processor and its counted native authority remain owned through an
abandoned caller or unknown outcome; neither a raw fallback nor a replacement
processor may bypass the receipt fence. The synchronous launch/factory hooks
remain a separate adaptation gap. This implementation draft is unqualified while
verification is parked.

Progress publication and imperative task setup stay outside reactive dependency
tracking. Publishing status MUST NOT retrigger a chat or view effect that
started the work. The unchanged native-factory Chat/catalog story qualifies this
edge.

R1.3.8 database adapters await the shared worker outside the host resource
mutex. Commit forwarding is passive transport observation; it never starts
another indexer or owns the database lifetime. The retained metadata/index
scheduler moves separately under R3 rather than being recreated in the renderer.

Desktop History indexing uses the shared vault-owned scheduler. Renderer
progress is passive cached-status observation: no capture subscription, native
batch stepping or browser retry loop owns derived work. Closing an observer
drains its current request without stopping the native service. Backup pause,
renderer reload and zero clients preserve the owner until explicit vault close.

## Staged native metadata adoption

Under LD-DB-001/002/003/004, LD-SESSION-001 and LD-NAV-004/006,
`LAPIS_DESKTOP_METADATA_OWNER=core` MAY explicitly attach the public native
indexing port to the admitted Notes session before App construction. Missing or
`renderer` selection MUST retain the existing renderer default; any other value
MUST reject startup. The native selection is fixed at process startup and MUST
independently reject renderer-mode controls, foreign windows and changed roots.

The port MUST share the existing opaque database session/connection admission
and passive change channel. Its typed command admits no filesystem path, SQL,
callback or independent database authority. Native operations MUST await the
existing core service outside the host resource mutex. Status observation MAY
run while an accepted refresh is pending. View close fences and drains accepted
transport calls and releases only observation; it MUST NOT stop the native owner
or release its writer authority. Vault close and Quit own service drain.

The API-owned MetadataCache observer selects compiled Markdown and compatible
declared projections, publishes existing status progress and suppresses renderer
metadata/projection writes. Unsupported custom contributions MUST remain visibly
unavailable. Failures MUST remain observable without a renderer fallback. Search
selection remains separate: this intake retains renderer Search and MUST NOT
claim native Search, Tasks ordered writes/recovery or either host default
cutover. Its metadata-only IPC MUST reject `select_search` and `disable_search`
as unsupported until the separately qualified Search adapter explicitly admits
them. Other compiled projection controls remain available through MetadataCache.

Qualification MUST cover exact default/admission failures, one shared transport,
passive refresh/disposal, external create/edit/rename/delete after client
detach, cold reopen/rebuild/idempotence and the retained Metadata/Search/Graph
views in the actual native workspace. Browser mocks cannot qualify native view
behavior.
