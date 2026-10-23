# Repository row selection and file history

JJ Log and Op Log row padding, graph, metadata and non-interactive tag areas
MUST activate the row's existing selection action. Nested author, copy, menu and
other controls retain their own actions; keyboard selection remains available.
Repository History uses `git-branch`; Op Log uses `git-pull-request-arrow` in
ribbons and workspace tabs (LD-REPO-004).

The plugin MUST register File history on the right sidebar by default. It
follows the active root editor file, retains that file while sidebar controls
have focus, and clears for non-file root views or a deleted file. Each file
scope owns an independent admitted operation pin. Selection changes and closure
fence and drain obsolete reads; status progress includes private changed-path
preparation. The sidebar reuses JJ Log graph/Git/JJ presentation and opens the
selected revision in the main JJ Log at the same operation. A replaced view MUST
NOT run a delayed selection or report a false missing-revision error.

File history MUST query JJ's native `all() & files(root-file:"path")` predicate
with literal path encoding and explicit recorded workspace context. It retains
JJ's graph ordering, merged-parent semantics, conflicts and deletion behavior;
no renderer scan or guessed revision pairs may substitute for native results.
Page matching revisions, show pending older pages, and retain the existing
200-result display cap. Backend work/byte/time limits fail explicitly, without
partial history or a false empty state. Source state and mutation grants remain
unchanged (LD-REPO-002/004).

The sidebar omits operation and author metadata once pinned. Its toolbar uses
the workspace tab height so adjacent bottom borders align. Empty editor and
no-revision states use Design Core's shadcn Empty with a file-history icon.
Loading log, file history, changed files, diff, operation details, conflict and
blame views use representative Design Core skeletons with accessible status;
application status progress remains visible (LD-REPO-004, LD-CAT-002).

Blame opens in a main workspace pane at the sidebar's recorded workspace commit,
file and operation. Copy/adapt jj-store's virtual source/attribution components;
origin links open the main JJ Log at that same pin. The native reader owns
annotation, progressive continuation and authorization, then returns recorded
text through file membership proof. Generation fences and drained independent
handles prevent stale display. Retain source size/line limits, unknown progress,
notifications and retry; do not infer attribution from operation titles or dirty
editor bytes (LD-REPO-002/004).

Changing or clearing the editor file MUST clear its recorded blame anchor before
admission starts; an unavailable or empty scope cannot reuse the previous file's
anchor or enable its Blame action.

E-REPO-023 adopts the reviewed blame presentation into the plugin: filename-only
inner header, content-boundary separators, compact line numbers, shared Design
Core ScrollArea and sticky attribution directly below the header. Commit title
hover/focus shows its first subject line clamped to two visual lines, recorded
committer/profile and time; diff counts appear only when explicitly provided.
Its subject link uses the surrounding text colour at rest and the link colour on
hover/focus. It opens the recorded commit in JJ Log at the same operation pin.
Enabled plugins contribute a `git-merge-conflict` editor title action, removed
on disable. The action reads the current file through an owned status-tracked
controller, then opens recorded blame. JJ Log and Op Log resting rows use the
AppShell background; selected/hover states remain distinct. Native identity,
annotation, pinning and authorization contracts are unchanged.

Blame's header MUST offer a keyboard-accessible Wrap text toggle, enabled by
default and remembered in application-local browser storage across file panes
and restarts. Wrapping preserves exact source text and logical line numbers;
virtual groups MUST remeasure after wrapping or width changes so attribution and
source remain aligned. Storage unavailability keeps the view usable with the
default and a session-only choice; no repository operation is performed.

Embedded repository shells MUST fit the owning pane, including a narrow right
sidebar, without an application-level minimum main width extending their inset
surface beyond the pane. The right border and header actions remain visible.
Wrapped blame stays within its source viewport; disabling wrapping scrolls the
source internally without widening the shell (LD-REPO-004, E-REPO-055).

The plugin contributes an enabled-by-default working-copy status split control:
file/line totals open a details popover and a separate refresh action re-reads
current data. A Repository History setting MUST hide/remove that contribution,
stop scheduled/file-triggered refresh and drain an in-flight read. Re-enabling
starts a fresh observation; plugin/vault close drains it before native release.
The plugin owns its controls, popover, styles and settings through the public
status host; custom controls do not require repository UI in the shell. The
compact split control has no border, minimal vertical padding and a subtle
background relative to the status bar; refresh uses a slightly stronger fill.
Its compact buttons remain inset from the footer borders, including populated
diff statistics; loading and backup states retain the same compact minimum. The
working-copy popover MUST keep at least 8px from viewport edges and 6px above
its footer trigger so rounded window edges do not clip the surface.

Native status resolves the current physical root from existing admission and
observes it on bounded workers. It MUST NOT initialize, snapshot, write a source
index, reconcile heads or run a shell command. Compare the complete final tree
with its sole recorded WC parent, including qualified unsnapshotted/ignored and
sparse semantics. Never sum recorded/dirty deltas or claim partial totals are
complete. Binary/structural/complexity cases omit line totals; unsupported
conflicts/merges and stale/revoked/oversized reads remain unavailable. The
popover links the recorded WC revision to JJ Log at its exact operation and
explains that pending editor buffers appear after save. Background progress
covers the read; errors use App toasts and obsolete counts disappear. Renderer
paths, workspace names, generations and operation choices grant no authority.
Structured native failures MUST retain their message/code as normalized Errors
before notification; a serialized object cannot become `[object Object]` text.

The working-copy and automatic-history popovers share the upstream header
actions and capability gating specified in
[Automatic vault backup](vault-backup.md).

The shared-screen migration consumes complete `RepositoryPanel` and
`RepositoryOperations`, plus public file-history, blame, conflict and restore
components from Repository UI. Desktop retains view registration, admitted
services, source selection, saved state, notifications and guarded writes.
Portable controllers come from `/history`; internal package imports are
forbidden. The baseline and migrated catalogs retain matching story identities
in isolated workspaces and ports, with immutable baseline dependency receipts.
