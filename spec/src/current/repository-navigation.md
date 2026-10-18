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
