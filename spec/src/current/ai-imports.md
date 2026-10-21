# Explicit local transcript imports

## Progressive browser design review

E-AI-120 records the approved catalog prototype. E-AI-121 adopts its progressive
browser in the live import view. Older simulated scenarios remain isolated
design fixtures; the StreamingPreview and Indexed imports stories mount
production.

## Indexed progressive imports

The user approved E-AI-120's design. IMPORT-02 now implements it in the ordinary
import view with Codex JSONL, Cursor project transcripts and OpenCode's local
SQLite session store. These are read-only source formats, not execution profiles
or automatic capture grants. The existing Codex capture watcher remains
separate.

A private, device-local metadata index lives in the application cache outside
vaults. It stores only source identities, physical file stamps, native folder
metadata and source titles, never transcript bodies, prompts, tool payloads or
credentials. It is rebuildable and grants no read authority. Every selection
revalidates its admitted source. Metadata discovery proceeds in bounded worker
steps; cached folders appear immediately while changed metadata is reconciled.
The index is capped at 8192 sessions globally and 16 MiB on disk; discovery
examines at most 131072 entries and sources are bounded to 64 MiB. Sessions page
in groups of 128. Opening a folder lists only that folder's cached metadata.
Refresh and view reopening discover additions/removals. Corrupt caches rebuild;
missing sources and unknown IO remain distinct.

Harness children are visibly indented. The embedded AppShell retains navigation,
header, transcript mode controls and footer. Selection cancels and drains the
previous read. Sanitized provisional batches may cross IPC for read-only
display; they carry no import identity or save authority. Pause stops pulling
more pages. Only completion after the unchanged JSONL fence or pinned SQLite
read transaction produces the final immutable snapshot. Failure/source change
disables Import and offers reload; stale batches cannot replace another
selection. Existing imports, stable deduplication, read-only authority and
unknown-write recovery remain intact.

Codex uses its qualified headers and shared normalizer. Cursor JSONL and
OpenCode SQLite use explicit structural version-1 import profiles and retain
only known user/assistant text and observed tool evidence. Reasoning and
permission state are omitted. Metadata labels and all provisional/final content
pass native privacy before rendering. The renderer supplies opaque
harness/folder/session/read IDs, never filesystem paths, SQL, executables or
source roots. Lifecycle disable, vault close and window destruction fence and
drain both index and preview work.

IMPORT-01 advances LD-AI-002/004 using local files. IMPORT-01A provides the
production import journal and injected preview UI; IMPORT-01B connects native
Codex discovery, reading and privacy. Catalog clients are fixtures, never proof
that ordinary native discovery is available. JJ persistence remains deferred.

The Codex adapter reads the host home’s `.codex/sessions` root. Cursor reads
`.cursor/projects/*/agent-transcripts` with bounded workspaceStorage metadata
mapping when available; unmapped projects retain their encoded folder labels and
home privacy context. OpenCode reads `.local/share/opencode/opencode.db`. No
archived root, environment override or renderer-supplied path is admitted. The
legacy Codex watcher/catalog retains its separate 256/1024 limits. Opaque
per-client handles and prepared request tickets bind cancellation before worker
start. Disable, vault close and window destruction fence and drain reads
independently of execution admission; imports require no configured provider.
Only sanitized provisional entries and completed immutable snapshots cross IPC.
Tool output remains unknown unless the native normalizer has affirmative
terminal evidence; output alone cannot prove success. Both saved and displayed
states retain that distinction.

Import is an explicit, bounded snapshot operation. Native acquisition keeps raw
paths, headers, private reasoning and credentials outside the renderer. The
renderer receives only sanitized messages, observed tool evidence, neutral
notices and opaque source/session/snapshot digests. Codex CLI 0.156.1 also
accepts the exact Lapis ACP `vscode` / `lapis-acp` producer pair through the
shared native reader. Other adapter labels and the observed Desktop alpha
version remain excluded. Source labels are display data. Import cannot
launch/resume a provider or grant tools or permissions.

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
recovery and failure toasts. E-AI-055 qualifies native admission, reader
privacy, cold actual-file import and ordinary-app adoption for this supported
local profile. Automatic watching is a separate explicit opt-in CAPTURE-01
slice.

## Opt-in local capture

CAPTURE-01 adds a per-vault, default-off watcher for supported Codex sessions.
Its explicit control saves the opt-in before starting. AI disable, Safe Mode,
vault/window closure and Stop fence and drain all owned work. Shutdown preserves
the saved choice for cold restart; Stop saves the disabled choice.

Only sessions whose header and every admitted body directory belong to the
current physical vault may be captured automatically. Missing, ambiguous or
foreign directory context never borrows the header's authority. Other sessions
remain eligible only for explicit import. Native discovery, physical change
checks, source reading and privacy run on workers under independent read-only
admission. Manual import and capture clients have separate handles/catalogs.

A complete sanitized immutable snapshot is retained under its existing import
identity. Local capture receipts group its versions by source/profile/vault;
latest selection is published only after the exact transcript and receipt save
are acknowledged. Older snapshots stay readable. Unknown writes retry the same
snapshot. Native confirmation retires only that pending observation; it never
constructs a durable reader ACK, cursor, provider grant or JJ publication. Cold
restart re-observes sources and verifies existing snapshots before confirming
them, so a lost confirmation creates no duplicate or hidden progress.

The watcher reports background activity through App status and exposes captured
sessions, recent versions, waiting/deferred reads and local limits. Changing or
incomplete files may wait without advancing. Operational failures publish a
stable application toast and retain the pending snapshot. Capture is bounded to
512 receipts, 128 source groups and 256 MiB of recorded transcript data per
vault; reaching a limit pauses new work without deleting history. No automatic
retention/purge, source edits, launch/resume, or JJ persistence is enabled.

## Source foundation review

CAPTURE-01A/E-AI-056 qualifies the source port independently of the opt-in
coordinator and store. Each Start/Stop cycle can allocate a fresh capture
handle; manual imports keep their separate catalog. Same-root admission
preserves the other scope, while changed-root admission and vault/window closure
fence both. The renderer supplies no path, root, executable or generation.
Existing manual import frames and execution admission remain unchanged.

One delivery retains its sanitized immutable snapshot until explicit
confirmation, including when the source appends meanwhile. Recent confirmation
IDs are idempotent (bounded to 256); retrying an old ID cannot consume a newer
pending snapshot. Unconfirmed observations are not durable progress. Cold
restart reobserves the source rather than retaining a cursor. Transient changed
or incomplete reads defer; authority/cancellation failures still reject. This
foundation alone performs no local receipt/transcript writes, opt-in changes,
background watching or JJ publication. Those remain CAPTURE-01B/C.
