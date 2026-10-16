# File management (M5)

M5 preserves its original PLAN.md gate. Targeted slices do not complete the
aggregate milestone while end-of-M7 full qualification remains deferred.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LD-FILE-001 | Native rename, move, copy, file removal and directory removal MUST remain within the live admitted root, reject root/parent/symlink escapes, and preserve existing destinations on collisions. A failed operation MUST report a portable error and MUST NOT project success into the vault tree.                               |
| LD-FILE-002 | Native watching MUST publish bounded, subscription-scoped portable changes for the admitted root, including external creation, modification, rename and deletion. Overflow, incomplete events and lost continuity MUST cause reconciliation. Closing a subscription or session MUST retire its callbacks and native resources. |
| LD-FILE-003 | Existing File Explorer and App file commands MUST protect dirty editors before rename, move or delete, await admitted IO through tree/workspace projection and keep disk, tabs, metadata and file identity consistent. Unresolved writer failures MUST block destructive mutations.                                            |
| LD-FILE-004 | The desktop MUST support attachment import through the existing application surface, reveal admitted paths in Finder and use available system trash. Cancellation MUST leave the vault unchanged. Unavailable platform operations MUST report that capability explicitly instead of succeeding silently.                       |
| LD-FILE-005 | Renderer HTTP proxy responses MUST avoid a second decoding of decoded upstream bodies by removing Content-Encoding and Content-Length while preserving status, content type, cache validators and bytes. Vault, plugin and raw filesystem responses MUST retain their representation headers.                                  |

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

## Next implementation boundaries

Native watch ingestion must observe complete host writes. Use the native owner's
shared file-IO gate when taking capability-based snapshots, rather than hiding
arbitrary filenames that resemble temporary files. The watcher worker must not
acquire the native services mutex: stopping/joining it during vault closure must
not deadlock behind the owner performing that closure. Register watching before
the initial snapshot and retain bounded continuity/recovery.

App ingestion belongs in the API, not a desktop-only tree override. The existing
DirectoryWatcher delivers events but is not wired to an App-owned vault-tree
reconciler. Reconciliation must preserve live file identity, notify the existing
metadata/editing owners and protect dirty content. Native delivery alone does
not qualify UI consistency.

Source review also identifies two next reproductions: File Explorer deletion
currently enters low-level Vault trash without the FileManager writer guard, and
new-note/binary creation can race a destination that appears after name
selection. Preserve the existing low-level API contract where intentional;
introduce the necessary source-owned guarded/exclusive boundary for Tauri and
qualify the original application flow. These are review findings awaiting exact
source regressions, not completed gate evidence.
