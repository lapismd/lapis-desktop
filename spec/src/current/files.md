# File management (M5)

Native vault closure first fences new AI admissions and retires active/pending
scopes before releasing the vault. An open database still blocks that closure
without changing AI authority. Suspended reload scopes retain their generation
for verified re-admission; failed cleanup cannot activate a replacement scope.

The Notes leave guard passes the requested close/reload mode to bundled AI after
writer protection succeeds. AI views, settings and maintenance drain before
native streams, user-command subscriptions and the admitted scope are released.

Signed plugin installation uses the existing admitted native filesystem port
with relative vault paths. SDK staging, replacement and retained plugin data add
no native grant and do not change the file writer, watch or teardown contracts
below. See LD-INSTALL-002 for plugin lifecycle qualification.

The desktop catalog confirms the existing file/view lifecycle through an
in-memory Notes session. Its accessibility-only wrapper grouping change does not
alter watch admission, reconciliation, guarded saves or teardown below.

The Tauri host explicitly starts App-owned watch ingestion after metadata and
view registrations are ready. Native registration precedes complete initial
reconciliation. Stop retires callbacks and drains work before leave persistence
and teardown; failed saves resume and reconcile the same live App. An App that
has entered destructive disposal does not restart ingestion.

Shared Vault projection preserves canonical resource identities, complete trees,
cache and filename indexes. Existing workspace events refresh clean editors;
existing FileView/layout lifecycles follow clean renames and removals. Dirty or
retired writers keep their original views and recovery owner, with existing
notifications explaining external moves/removals. This integration remains
subject to actual native and original aggregate qualification.

M5 preserves its original PLAN.md gate. Targeted slices do not complete the
aggregate milestone while end-of-M7 full qualification remains deferred.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-FILE-001 | Native rename, move, copy, file removal and directory removal MUST remain within the live admitted root, reject root/parent/symlink escapes, and preserve existing destinations on collisions. A failed operation MUST report a portable error and MUST NOT project success into the vault tree.                                                                  |
| LD-FILE-002 | Native watching MUST publish bounded, subscription-scoped portable changes for the admitted root, including external creation, modification, rename and deletion. Overflow, incomplete events and lost continuity MUST cause reconciliation. Closing a subscription or session MUST retire its callbacks and native resources.                                    |
| LD-FILE-003 | Existing File Explorer and App file commands MUST protect dirty editors before rename, move or delete, await admitted IO through tree/workspace projection and keep disk, tabs, metadata and file identity consistent. Unresolved writer failures MUST block destructive mutations.                                                                               |
| LD-FILE-004 | The desktop MUST support attachment import through the existing application surface, reveal admitted paths in Finder and use available system trash. Cancellation MUST leave the vault unchanged. Unavailable platform operations MUST report that capability explicitly instead of succeeding silently.                                                          |
| LD-FILE-005 | Renderer HTTP proxy responses MUST avoid a second decoding of decoded upstream bodies by removing Content-Encoding and Content-Length while preserving status, content type, cache validators and bytes. Vault, plugin and raw filesystem responses MUST retain their representation headers.                                                                     |
| LD-FILE-006 | New-note and attachment creation MUST publish complete bytes only when the destination is absent. A collision, including a destination appearing during staging, MUST preserve that destination, report EEXIST and leave no temporary files. Hosts MUST advertise exclusive creation only when implemented; legacy low-level overwrite semantics remain explicit. |
| LD-FILE-007 | Native open, reveal and system trash MUST act on the pinned admitted file or folder. Path replacement, symlink escapes, closed admissions and unresolved physical identities MUST reject before OS dispatch. Native system trash MUST reject the vault root and preserve an explicit unsupported fallback; successful trash MUST NOT trigger a second deletion.   |
| LD-FILE-008 | Retained file conflicts MUST reveal Problems. Opening a problem MUST show the draft, baseline and disk version through the shared three-way comparison, with an editable centre whose reviewed text is saved through the guarded writer and refresh. Closing the review MUST preserve unresolved drafts; successful resolution MUST clear its diagnostic.         |

## Conflict review presentation

Conflicts publish an App-owned diagnostic collection and reveal Problems.
Opening a diagnostic reveals or reuses the file's conflict review leaf. The
shared three-way MergeEditor compares the retained draft and disk snapshot with
an editable result seeded from the last saved baseline. Accepting side changes
updates that result; Save merged version submits its exact text through the
captured writer-owned decision. A later disk change rejects without replacement.
Refresh retains the staged merge. Closing/reopening its view retains that merge
in the App-owned presentation state. No separate save pipeline or native grant
is added. Resolving clears the diagnostic and review; closing only the view
retains the conflict. Unreadable disk state and guarded leave disable edits and
saves. Compact 24px icon-only header controls toggle wrap, whitespace/case
comparison and horizontal scroll sync. Each setting uses the shared Toggle's
selected background, with a scoped semantic accent that remains distinct from
the toolbar in both themes. Embedded comparison frames use public border/radius
tokens.

## Authority and boundaries

The native owner serializes file operations with the existing admitted-vault and
database lifetime. Renderer payloads select relative paths and opaque live
admissions, never arbitrary native destinations. Native services retain the M2
path, symlink, bounded IO and staged-write rules. File-management permission is
limited to named operations in the existing vault command.

Rename/move must fail atomically when the destination already exists. Exact
source/destination equality is a no-op only for an existing supported source.
Copy stages a bounded complete file and publishes it without replacing an
existing destination. File removal does not recursively remove directories;
nonrecursive directory removal rejects nonempty folders. Native root containment
continues to apply if a path changes after renderer validation.

App and File Explorer retain their existing writer guard and presentation. The
host does not create another file tree, editing surface or save pipeline. Watch
ingestion must reconcile the original App-owned tree and metadata rather than
repainting only the Explorer. Internal operations and native atomic writes must
not create duplicate identities or expose staging-file churn.

The watch owner captures the physical root and generation at admission. It
rejects paths outside that capability, handles equivalent canonical macOS paths,
bounds events and buffers, and marks reconciliation necessary after uncertainty.
Retired generations cannot deliver into the next vault's App.

The inherited inventory includes LN-DENO-017/020/025/076 and file-watch.
Notification delivery belongs to M7, while M5 retains file open/reveal and
explicit capability behavior from LN-DENO-017. The proxy representation contract
from LN-DENO-076 remains visible in LD-FILE-005; no component pass waives it.
The migration replaces Deno watching with native Rust watching; the superseded
Deno host remains frozen.

Qualification includes real temporary folders, Unicode/binary paths, collisions
and containment, dirty-note mutations, external filesystem changes, watch
overflow/reconciliation, attachment import, Finder/trash behavior and teardown.
Complete the original UI/disk consistency gate before marking M5 Done.

## Implementation boundaries and remaining qualification

Native watch ingestion must observe complete host writes. Use the native owner's
shared file-IO gate when taking capability-based snapshots, rather than hiding
arbitrary filenames that resemble temporary files. The watcher worker must not
acquire the native services mutex: stopping/joining it during vault closure must
not deadlock behind the owner performing that closure. Register watching before
the initial snapshot and retain bounded continuity/recovery.

App ingestion belongs in the API. The App-owned service now registers its
DirectoryWatcher before a complete bounded scan, serializes reconciliation with
internal Vault mutations and preserves live resource identities. Existing
metadata and workspace/editor owners receive the resulting events. Cold native
acceptance covers clean and dirty external changes plus failed-leave restart;
the complete internal-operation, import, native-action and aggregate gate
qualification remains open.

Source regressions now protect Explorer deletion through FileManager and add
explicit new-file creation intent. Native creation stages complete bounded bytes
and atomically publishes without replacing a destination, including one arriving
during staging. Capability advertisement remains platform-specific. FileManager
uses the optional source-owned exclusive port; legacy low-level Vault overwrite
behavior remains explicit. Attachment intake and App reconciliation have
targeted source/native evidence; complete full qualification under the original
M5 gate.

Native watch snapshots are bounded to 100,000 entries and 16 MiB of accounted
path/stamp storage. Hint accumulation retains at most 2,048 paths. A delivery
contains at most 256 changes and 128 KiB of accounted path/wire overhead;
exceeding a delivery bound requests full reconciliation without a partial list.
Incomplete scans retain the last complete snapshot and report recovery needs.
The event worker owns and drops its native notifier, and close joins that
worker.

The native registry bounds active watches to 16 per admission and 32 overall.
Only the issuing live admission may stop its subscriptions. Vault closure joins
all workers before releasing the root; failed cleanup stays owned for retry.
Only the exact named start/stop commands are available to the local main window.

Renderer subscriptions validate each complete bounded frame before delivery.
Malformed or out-of-scope changes, sequence gaps and native reconciliation flags
emit a portable reconciliation error, never a partial list. Close retires queued
callbacks immediately, awaits pending start and native stop, and retains failed
cleanup for retry before releasing admission. Native-watch capability is
advertised only with that transport installed. App ingestion remains a separate
shared API boundary and is not established by transport acceptance.

Managed deletion now enters the shared FileManager protection boundary before
removing files or folders. Explorer uses that owner instead of low-level Vault
trash; failed/retired writers and changed source paths reject before IO, and
protection releases on failure so explicit recovery and retry remain possible.
This component does not complete the remaining M5 file/tree consistency gate.

Internal-mutation acceptance uses the existing Explorer rename and drop actions.
It verifies collision preservation, admitted dirty-writer flush/recovery, active
editor retargeting and restored layout against physical files. Browser drop
delivery exercises the actual component callback; it does not establish a
physical operating-system drag gesture.

Attachment import connects the existing Explorer external-file drop action to
the shared FileManager new-file boundary. Complete binary bytes use exclusive
creation on supporting hosts. App admission spans byte reads through tree
projection; empty drops leave the vault unchanged, and failures use existing
owned notices. Imports process files sequentially with single-filename
validation and the native 64 MiB file bound.

## Renderer representation qualification

The frozen Deno host used an intermediate Fetch proxy only for its Vite dev
renderer. Tauri's devUrl loads that loopback renderer directly; production
bundles assets through Tauri. There is no decoded-upstream forwarding stage to
port. Preserve LD-FILE-005 and the captured LN-DENO-076 inventory entry: any
future Fetch proxy remains subject to its normalization rule. Do not introduce
an unused proxy to recreate the removed transport.

Qualify the equivalent behavior with the actual WebView loading the unchanged
application HTML and module assets over gzip from the configured development
origin. Verify compressed response status/type/cache validators and decoded
bytes independently at the direct HTTP boundary. Separately prove that the
bundled host preserves raw scoped-resource body bytes and Content-Length for
GET/HEAD and admitted binary IPC. Production has no dev-server dependency.

M7 menus and application URL navigation retain the existing App-owned writer
guard. URL dispatch and its native acknowledgement enter admitted operations
before teardown; retiring the owning App stops new URL admission. File access
remains confined to the selected admitted root. See `integration.md`.

Terminal launch uses the same admitted physical vault. Successful vault closure
releases its scoped shells, except a confirmed reload suspension; failed guarded
persistence never reaches this teardown. File/watch contracts remain unchanged.

Native portable plugin teardown joins the existing guarded Notes leave boundary:
all loaded plugin instances release their resources before the database and
vault close. Safe Mode skips configured optional installations without changing
saved enabled choices.

Native file/watch IPC lives under `host/vault`; reusable resources and OS
actions live under `vault/resources.rs` and `vault/system_actions`. Acceptance
receipts live under debug-only `acceptance/actions.rs`. Relocation preserves
admission, locking, command identities and the file contract's spec-first
coverage.

The crate-owned staged-file helper also supports the named AI user-command
store's explicit replacements. Vault creation still uses exclusive publication;
collisions, cleanup, containment and watch behavior remain unchanged.

The shared native vault-admission registry preserves the existing physical-root
proof and two-phase transition. Independent service registries do not grant one
another access. Native vault closure still waits for each owned service's
retirement before releasing the underlying folder admission.

Native history closure shares the vault leave boundary. Database blockers reject
before AI or repository fences; history replacement/release/close serialize
through actual reader drain before the vault is released. Delayed old-vault
cleanup cannot revoke a newer repository generation. Database opening uses the
same transition guard; it cannot race a successful close preflight. See
`repository.md`.
