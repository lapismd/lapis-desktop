# Explicit local transcript imports

IMPORT-01 advances LD-AI-002/004 using local files. IMPORT-01A provides the
production import journal and injected preview UI; IMPORT-01B connects native
Codex discovery, reading and privacy. Catalog clients are fixtures, never proof
that ordinary native discovery is available. JJ persistence remains deferred.

Import is an explicit, bounded snapshot operation. Native acquisition keeps raw
paths, headers, private reasoning and credentials outside the renderer. The
renderer receives only sanitized messages, terminal tool evidence, neutral
notices and opaque source/session/snapshot digests. Source labels are display
data. Import cannot launch/resume a provider or grant tools or permissions.

The first profile stores read-only snapshots. Imported user messages remain
untrusted historical evidence. They cannot become authored instructions,
application receipts, agent bindings, pending turns, queues or approvals. Shared
context projections retain captured, untrusted evidence labels. Document is the
default preview; Classic renders the same captured entries. Explicit source
selection precedes preview; preview never writes the store.

The destination is stable for the normalized vault scope, pinned source profile,
opaque source session and snapshot digest. Its UUID-shaped storage key is
derived using a domain-separated SHA256 digest; version/variant bits satisfy the
existing local directory format and do not imply random allocation. Changed
snapshots get distinct destinations. Repeating a snapshot verifies and reopens
the same destination. A separately recorded content digest detects mismatched
content claiming the same identity. Source event IDs remain distinct in order.

The repository's shared write queue serializes imports with conversation writes.
An import marker is written before transcript entries; missing empty journals
may be initialized only for that exact preparing marker. An entirely empty
deterministic directory may be claimed without replacing any data. Existing
ordinary, unreadable, conflicting, unexpected or malformed files refuse. A
partially written import resumes only from its exact recorded prefix. Lost write
acknowledgements retain the same identity; retries never infer absence from a
failed read or silently discard different duplicate content. Complete requires a
confirmed read of the full exact transcript and completion marker. Cold complete
imports perform no writes. Incomplete imports remain incomplete; they cannot
authorize chat. Ordinary conversation formats remain readable.

Source IO/parsing/privacy belongs on native workers. App-owned status progress
covers discovery, preview and saving. Visible loading uses representative
Skeletons; no-source content uses Empty with an icon. Operational failures use
one stable application notification, retaining the selected source and preview.
View cleanup fences late results and drains owned operations. Import source
ports are injected per App; fixtures cannot enter production dependencies.

Focused tests cover identity/content collision, concurrent duplicate imports,
partial/unknown saves, corrupt destinations, read-only authority, preview,
recovery and failure toasts. Native admission, reader privacy, cold actual-file
import and ordinary-app adoption stay IMPORT-01B gates. Automatic watching is a
separate explicit opt-in CAPTURE-01 slice.
