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
preparation. The sidebar reuses JJ Log graph/author/Git/JJ presentation and
opens the selected revision in the main JJ Log at the same operation. A replaced
view MUST NOT run a delayed selection or report a false missing-revision error.

File history MUST query JJ's native `all() & files(root-file:"path")` predicate
with literal path encoding and explicit recorded workspace context. It retains
JJ's graph ordering, merged-parent semantics, conflicts and deletion behavior;
no renderer scan or guessed revision pairs may substitute for native results.
Page matching revisions, show pending older pages, and retain the existing
200-result display cap. Backend work/byte/time limits fail explicitly, without
partial history or a false empty state. Source state and mutation grants remain
unchanged (LD-REPO-002/004).
