# Migration inventory and progress

The user resumed delivery through M7 after the settings/hotkeys review and
source reorganization. M4 remains unfinished and every original milestone gate
retains its scope. Continue implementation through M7 without another review
pause.

The requested renderer source reorganization is a separate maintenance slice. It
adopts feature-grouped components, application logic and global styles, with the
placement convention documented in the desktop agent guide. The remaining
functional migration now resumes under the user's current delivery request.

For this delivery session only, each slice runs targeted regression, affected
type/build and native acceptance checks. Full repository, consumer and canonical
native suites are deferred until M7 implementation is complete. Record deferred
lanes with slice evidence and run them before marking the aggregate gates Done.
Do not persist this temporary test-scope exception as the default agent policy.

Local archive qualification checks active workspace peer imports against the
verified tarball payload, including peer-only consumers. Editable preview
integration and tab-first native-window alignment are the current slice; the
original M4 application gate and complete-writer coverage remain unchanged.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-MIG-001 | The migration inventory MUST retain source repository revisions and map legacy desktop requirements, commands/events, services, plugins, packaging and acceptance surfaces to a destination task and a reuse, port, replace, defer or retire disposition.                                                  |
| LD-MIG-002 | Every roadmap task MUST retain an explicit gate and next action. Deferred capabilities MUST remain visible, and product implementation MUST first introduce its owning contract. The generated MIGRATION summary MUST agree with the task ledger.                                                          |
| LD-MIG-003 | The Deno desktop MUST remain superseded and frozen. Further desktop features, fixes and host qualification MUST target Tauri. Shared changes MUST remain in their owning packages. The frozen host MAY remain a reference until M12 removes it; Deno services used by other hosts are outside this freeze. |

The immutable baseline inventory is `spec/migration-inventory.json`. It is
self-contained and validates without sibling checkouts. Capture fresh source
evidence when extending the inventory; do not silently treat a later checkout as
the original migration baseline.

[Milestone tasks](progress/milestones.md) alone own statuses and selected gate
evidence. Root MIGRATION.md projects that table and links the complete PLAN.md.
The first useful target ends at M4. M0.1 is a native shell qualification, not a
claim that the application can edit notes.

The shell qualification retains the original M0.1 gate. M1 is qualified against
committed source-owned archives; M2 native vault access is also qualified.
Application signing and notarization stay deferred to M11 per the user's
2026-10-15 instruction.

On 2026-10-16 the user froze the superseded Deno desktop. Existing source and
historical evidence remain available as reference. Do not port new functionality
back, change the Deno host, or require further packaged Deno qualification for
Tauri slices. This removes the outstanding Deno packaged reruns from the active
slice. It does not complete M12 or change its capability-coverage gate, freeze
shared-library ownership, or retire Deno services used by other hosts.

## Shared state policy

The current request resumes delivery through M7, then stops. The
[enabled-writer audit](writer-audit.md) tracks M4's remaining settings, hotkey
and plugin-state ownership before file management, navigation and desktop
integration are qualified. No component pass or new tracker entry replaces any
original M4–M7 completion gate.

The user approved `.lapis` as the shared vault-local application-state default
on 2026-10-15. This applies to the entire application, including desktop, web,
and server hosts. M1 changes the default in the shared API and resolves
configuration, workspace/layout, hotkeys, and plugin persistence through it in
every affected package and host. There is no Tauri-specific default or nested
state directory. Host profiles and databases continue using OS application-data
directories.

The application is unreleased. Existing pre-release application state may be
reset or overwritten; `.obsidian` discovery, import, merging, compatibility
fallbacks, backups, and legacy-state rollback are outside the delivery gates.
M1, M2, and M12 have user-approved revised gates in the task ledger. Normal
note-saving, dirty-buffer, filesystem, and database transaction guarantees
remain in scope. M1 implements and qualifies the shared default across the
affected hosts.

## Local archive qualification

During migration, shared changes are built, tested, and packed in their owning
repositories, then installed in Tauri through verified local pnpm archives. This
is the user-approved M1 qualification path. Package publication moves to the
final release gate. Tracked registry manifests/lockfiles remain portable;
ignored install overlays record source revisions and archive checksums.

M1 native consumer qualification imports the path default and desktop runtime
classification from the actual packed public API. Source regression evidence and
native app evidence are recorded separately. Library archives carry the actual
Jujutsu source snapshot and verified package identities; passing local
installation alone does not complete the native consumer gate.

M1 and M2 are complete. Native folder admission, recent profiles, contained
reads/writes and scoped attachments have passed the original temporary-folder
failure gate and actual WebView acceptance. M3 qualifies the public Notes
workspace on native storage. M4's safe everyday-use gate remains required before
describing this preview as an everyday notes app.

M3 starts with native database conformance and then explicit App/workspace
intake. Keep its original combined gate: a passing database component cannot
promote the complete Notes-session milestone.

The native database component is qualified in E-DB-001. E-SESSION-001 preserves
the Notes intake regressions; E-SESSION-002 qualifies the committed archive
cohort, native disk editing, attachment display and database reopen. M3's
original combined gate passes. Safe close, restore and external-edit handling
remain M4.

M4 now specifies native save coordination and last-Notes restoration separately
from external-edit protection. Its original aggregate gate remains unchanged;
partial lifecycle evidence cannot mark the everyday-use milestone complete.

E-LIFE-001 qualifies native save/close/Quit/reload, last-Notes restoration and
repeated edited vault switching through the API-owned layout writer. M4 remains
In progress until external-edit conflict protection meets the original gate.

E-WRITE-001 qualifies the conditional native storage component through exact
preconditions and the public adapter in the actual WebView. Document-owned
baselines and explicit conflict recovery are next; LD-LIFE-004 and the original
everyday-use gate remain open.

E-CONFLICT-001 qualifies document-owned API text-editor baselines and retained
App-owned recovery through the real native UI. Closed tabs retain their drafts
and shutdown barriers; stale choices require another review. The original M4
gate remains unchanged and In progress. E-PREVIEW-001 records source-owned
Mira/API/Markdown binding and native preview recovery. Properties/frontmatter
and metadata writers still require protection and a complete writer audit, so
LD-LIFE-004 and LD-LIFE-007 remain Planned. Native watching stays in M5.

E-CHROME-001 records the user-requested tab-first window alignment: no title or
toolbar above the workspace, native-control clearance and Tauri HTML handles.
The original M0.1 gate remains unchanged. App signing remains deferred to M11.

E-STARTUP-001 records restoration of the Deno host's public branded startup
presentation, actual loading phases and plugin details. It disappears when the
workspace is ready and does not add content above tabs.

M4 recovery retains inventory LN-DENO-052/053/054 through the shared startup
surface and extracted Safe Mode banner. Session recovery must not rewrite
canonical choices or the skipped saved layout; explicit reset remains separate.

M5 now specifies native mutations, watching/reconciliation, guarded application
projection, attachment/Finder/trash behavior and the inherited HTTP
representation contract in `files.md`. Every original M5 gate remains required.
