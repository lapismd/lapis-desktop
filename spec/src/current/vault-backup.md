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
