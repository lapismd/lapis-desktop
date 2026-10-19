# Automatic vault backup

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
native release. Network failure cannot block saved-file closure.

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
exact native candidates. Clean merges use the App all-writer guard across
preview/apply; an original request is persisted before mutation. Unknown apply
outcomes reconcile that request or explicitly keep current files after a native
capture barrier. Config changes cannot reinterpret an in-flight publication.
Conflicted candidates preserve current files and open the copied conflict
surface for explicit text/native-term/deletion choices. Per-path resolution
creates retained native commits; only a current clean candidate materializes.
Native transfer runs on bounded workers outside vault/capture locks. E-REPO-032
records this stage while cold app/live provider and later stages stay open.

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
cache bytes. The copied command result layout retains public Design Core
composition and a noninteractive time label inside each selectable row.
