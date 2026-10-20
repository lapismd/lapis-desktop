# Automatic vault backup

E-AI-093 includes the three portable local-ACP transcript files at each valid
scope in LD-REPO-005 capture, search, guarded restore and configured sync. Other
private application data remains excluded; explicit backup exclusions win. See
[local conversation storage](ai-local-history.md).

E-REPO-047 qualifies the original M14.1 identity/storage gate through cold
native processes, production recent eviction, explicit folder relinking and
independent external history. E-REPO-051 tests native restore under unchanged
LD-REPO-005 safety checkpoints, writer guards, exact receipts and live pins. An
e2e-only one-shot fault may discard the response after the real native receipt;
ordinary builds contain no hook or fault control. Remaining M14 gates stay open.

Repository History exposes forge accounts, remote backup, synchronization,
storage and adoption directly inside its registered plugin settings section.
Commands open that same section; no independent backup-settings workspace view
is registered. Forge brands use the maintained jj-store icon assets. Compact
tinted card headers, divided rows and trailing action footers adapt jj-store's
Settings composition using public Design Core primitives. Closing settings
cancels transient authorization and fences late account/remote replies, while
plugin-owned capture, sync, storage/adoption recovery and progress keep their
existing lifetimes. Credential custody and exact mutation identities are
unchanged.

Forge account menus size to their labels with a fourteen-rem minimum and a
viewport width bound, matching jj-store. Account options stay on one line.

Backup and synchronisation has its own labelled section below general plugin
settings. Its table-style cards use tinted headers and body-surface rows and
footers, white in the light theme. The public settings page extension composes
the existing controlled general fields and backup panel; search/reveal targets,
authorization and panel cleanup remain unchanged.

LD-REPO-005 adds default-enabled automatic local history for open vaults. The
native host binds durable vault IDs to separate repository and working-copy
paths. Default storage lives in application data and creates no `.jj` or `.git`
entry in the vault. A durable registry survives recent-list eviction. Existing
repositories remain independent unless explicitly adopted; the advanced storage
option puts `.jj` at the root through a recoverable migration.

Saved editor and external changes schedule a checkpoint after two seconds of
quiet, bounded by thirty seconds during continuous changes. Open/resume and a
sixty-second reconciliation cover missed events. Capture includes notes and
attachments independently of `.gitignore`, excluding Git/JJ metadata,
application-private runtime state and explicit backup exclusions. Each changed
tree has a retained Git-compatible commit and a fresh working-copy child;
unchanged scans create no operation. Unsaved buffers remain editor-owned.

The native coordinator and filesystem watcher own bounded workers. The named
`desktop_backup_start/capture/stop` main-window commands are distinct from
immutable history admission and accept only an opaque admitted vault session.
Native code chooses roots and paths. Source replacements revoke the binding. The
writer shares the guarded file-IO gate and drains after normal editor saves.
Vault/plugin close stops watching and completes final local capture before
native release. A failed final capture retains the original native owner and
visible failure; retry captures repaired saved files before release. Final
capture MUST complete before destructive workspace teardown. Failed leave MUST
retain the same editor, views and plugin owners, resume both ordinary and backup
watching, and permit a later retry. Reattachment MUST resolve any previous close
outcome before starting another worker. Network failure cannot block closure.

Automatic history enablement is independent of status visibility. The status
control reports saving, saved, paused or attention; background work uses the
shared progress API and failures use App toasts. Read-only JJ Log, Op Log,
file-history and blame queries retain operation pins and never initiate capture.

File restore previews hold the editor writer guard, then pin current disk hashes
and retained checkpoint bytes. Applying uses the same guard and stable request
ID. Native safety checkpoints and durable receipts retain unknown outcomes;
stale previews cannot overwrite later edits. Default history follows completed
captures until a commit or operation is explicitly selected; restored live tabs
stay live. The first native scan does not hold up plugin or shell startup.

Whole-vault previews pin the complete included tree and show added, changed and
deleted counts. Apply preserves one original safety checkpoint, guards each file
and journals progress for restart. Complete-tree verification precedes success.
Symlinks and file/directory type transitions currently fail before mutation.
Restore requests are saved before native mutation; reopening history offers the
original request for receipt reconciliation. Keeping current files first drains
a native capture barrier, then clears the UI recovery record.

The delivery adds a simple file-version timeline, safety-checkpoint restore,
historical text/metadata search and automatic selected-branch Git sync. GitHub
device sign-in reuses jj-store's public client configuration and native secret
custody. Forgejo follows with instance credentials. Pull preserves local and
remote histories, guards dirty editors and retains conflicts for review. A fresh
Git clone restores files and checkpoints; native JJ operations stay local.

M14 tracks this delivery independently of M13 conversation and M8.5 visual
gates. The user explicitly deferred heavy suites while implementing a working
version. The progress checklist records actual focused evidence and all deferred
lanes; implementation, visual review and release qualification remain distinct.

Forge account commands are main-window-only installation capabilities, separate
from vault/history admission. Work runs on bounded native workers. Installation
metadata and OS credentials have desktop-owned namespaces; only jj-store's
configured public GitHub client ID is reused. Authorization cancellation
bypasses busy network slots so a pending poll cannot save credentials after
cancellation.

Remote setup resolves the explicitly selected account, repository and branch on
native workers. The host derives and validates the Git endpoint against that
account's forge origin and stores only versioned configuration outside Git.
Transfer holds no capture lease or vault-service mutex. Fetch imports a pinned
head without changing files. Fresh-device restoration reuses the all-writer
guard, original safety checkpoint and durable request recovery, retaining both
local and imported ancestry. Remote setup changes cannot reinterpret a pending
publication intent.

The exact `desktop_backup_remote` request contains an admitted session and a
tagged status/configure/disconnect/fetch/preview/restore action. Renderer frames
cannot supply paths, credentials, Git URLs, generations or caller authority.
Versioned private configuration uses a revision guard; pending push intents
prevent endpoint replacement. Cached imported checkpoints remain restorable
without an available account. The original remote-restore request is persisted
separately from local restore before mutation and is cleared only by its own
confirmed result or a completed keep-current capture barrier. Plugin data merges
serialize per App and plugin identity, including recreated plugin instances.
Closing settings fences late responses but progress lasts until native work
actually drains. E-REPO-031 records focused proof; cold app/provider gates
remain.

The open-vault plugin owns automatic synchronization independently of settings
and status controls. Captures coalesce a remote check; bounded periodic checks
and exponential failure backoff cover missed events and offline recovery. Local
capture and close never await remote networking. Main-window-only
`desktop_backup_sync` actions carry admitted sessions, connection revisions and
exact native candidates. Clean merges prepare a preview under the App all-writer
guard, persist the original request after release, then reacquire protection for
its exact apply. Native expected-tree and connection-revision checks reject
changes between those guards; retries retain that request without a new preview.
Recovery writes and clearing never reenter protected App state writers. Unknown
apply outcomes reconcile that request or explicitly keep current files after a
native capture barrier. Config changes cannot reinterpret an in-flight
publication. Conflicted candidates preserve current files and open the copied
conflict surface for explicit text/native-term/deletion choices. Per-path
resolution creates retained native commits; only a current clean candidate
materializes. Native transfer runs on bounded workers outside vault/capture
locks. E-REPO-032 records this stage while cold app/live provider and later
stages stay open.

Automatic failure feedback uses a stable episode: an unchanged failed retry does
not replay a dismissed notice. A completed synchronization clears it. New
retained conflicts publish one actionable notice and preserve local files.

Backup settings show an original pending push without exposing native paths or
credentials. Observe checks that exact request and never republishes it, even
with read-only access. Explicit stop requires confirmation, retains the stopped
receipt and cannot cancel or undo remote acceptance. It works without an
available account. Revision and request identities fence obsolete completions; a
stopped request cannot clear a newer active pointer or publish on retry.

Historical search is a main-window-only native read for an admitted vault with
retained backup history. Pausing capture preserves search access. Fixed
retained-checkpoint cursors page metadata and changed-file UTF-8 text; binary,
conflicted, symlink and over-one-MiB contents remain path-only and are reported
explicitly. Native code owns index paths and exclusions. Disposable caches
rebuild after loss/corruption. Search runs on one bounded worker outside
NativeHost, capture and editor locks and reports App progress. New queries fence
old results; closing drains in-flight reads. Search hits never authorize
restoration: exact native preview and editor guards remain required.

Search versions open the retained file in the main-panel blame reader or its
exact checkpoint in JJ Log, including commits beyond graph paging. Late exact
commit replies cannot replace a newer row selection. Restoring a hit uses the
existing native preview, original safety checkpoint and receipt path, never
cache bytes. E-REPO-052 tests the native Search → pinned blame → JJ Log →
guarded restore path under unchanged LD-REPO-005. The copied command result
layout retains public Design Core composition and a noninteractive time label
inside each selectable row.

Forgejo account setup explicitly accepts a PAT and HTTPS `/api/v1` instance root
through installation-owned native workers and the injected account manager.
GitHub device OAuth and Enterprise validation stay unchanged. Forgejo uses its
API token header and selected login for Git basic authentication. Remote project
and origin guards, exact publication receipts and native secret custody remain
shared. Initial Forgejo OAuth, HTTP and hosted-subpath profiles are deferred.

Native storage selection resolves every capture, immutable history admission,
search and remote action through the same vault-owned layout record. Startup
recovers an interrupted move before initialization. Read-only discovery never
creates a repository or resumes a move. Layout changes fence capture and drain
history readers before migration, preserve the original repository archive and
receipt identities, and bind fresh readers afterward. Renderer storage frames
carry only the admitted session, selected layout, revision and request identity;
native code owns all paths. Status visibility does not select a storage layout.
The backup watcher excludes repository and private runtime names from both event
hints and recursive inventory. Root metadata writes cannot schedule captures of
the backup itself. Other native watchers retain their existing default scope.

An existing JJ repository remains an independent read source. JJ Log, Op Log and
linked blame views retain their selected source with their operation pins;
opening the other source creates or reveals that source's tab. Native opaque
read tokens bind the original repository to the physical vault/window and never
authorize capture, restoration or transfer. Both sources may be open together;
one preparation queue covers their native worker. Source changes require fresh
admission after reload and never substitute a different repository for a pin.
Explicit adoption imports the recorded Git ancestry into managed backup while
preserving current files and original repository bytes. It uses the guarded
capture worker and original request recovery; source-native operation/evolution
metadata stays available through the original read source.

`desktop_repository_sources` only discovers/open-read scopes; it never creates
backup state. Managed history admission explicitly requires managed storage and
cannot fall back to the original repository. `desktop_backup_adoption` runs
explicit imports/stops through the capture worker and guarded editor lifetime.
Paused capture is not enabled implicitly. UI recovery saves the original request
before native work and retains it across a lost reply or restart. Source
unavailability keeps pending recovery controls available; feedback uses App
toasts. Stopping fences even a request not yet delivered and cannot undo
accepted ancestry, change capture preferences or enable remote synchronization.
Adoption first prepares editor writers, saves its recovery identity outside the
all-file guard, then reacquires that guard for native import. Clearing recovery
also follows guard release: App configuration writers remain protected during
native work and must never be reentered from its callback. Failed or cancelled
preparation creates no intent; later failures retain the original request.

The status popover header MUST offer Fetch, Pull and Push upstream actions in
that order, right-aligned with shadcn tooltips. Fetch only imports history; Pull
uses existing guarded merge/apply recovery without publishing; Push captures
saved files and uses the existing exact publication intent without applying
incoming files. Explicit actions remain available when automatic sync is paused,
serialize with it and report real background progress. No configured upstream,
read-only publication, retained conflicts and recovery states gate the relevant
actions. Incoming/outgoing counts MUST use retained checkpoint ancestry at a
single immutable operation, exclude the unsaved working-copy child and label
their last-fetch basis. Unknown or bounded-out counts MUST remain unknown. A
proven push refreshes the fetched tip for counts; a failed refresh hides counts
without failing or replaying the accepted publication.

External history settings MUST display the native-selected repository directory
and a Show in file manager action. The display path is read-only; reveal
requests carry only the admitted vault session and storage revision. Native
workers revalidate that revision, reject pending moves/symlink redirects and
resolve the selected directory themselves. Revealing cannot initialize/move
history, stop capture or revoke active readers. Colocated history retains its
root selector.

Unified Search uses the App-owned result-provider registry. Current files remain
the default; History and Everything scopes reveal saved file versions grouped by
path with checkpoint references and metadata-only checkpoint results. Historical
author/date filters apply to version-changing checkpoints. The separate
history-search page and ribbon entry are retired; its command and saved leaves
redirect to Search with History selected. Search being disabled does not enable
it implicitly or stop backup.

A disposable native Tantivy index records checkpoint ancestry and changed-path
references while indexing each immutable body once. The plugin schedules bounded
native batches after captures and reconciles missed work after reopening.
Indexing/query progress uses the shared status API; errors use App feedback.
Capture never awaits indexing. Committed pages remain usable during catch-up,
with incomplete coverage and unsupported filters explicit. Cancellation,
provider unload and generation changes fence obsolete replies. Result activation
and expanded context resolve the exact native revision/path; restoration keeps
its existing preview, safety checkpoint and durable request authority.

`desktop_backup_history_search` is an exact main-window permission. Native code
selects vault/index identity and bounded workers; frames supply no paths or
caller authority. Storage relocation drains that search permit. Saved targets
retain the operation, commit and file (LD-REPO-002/005).
