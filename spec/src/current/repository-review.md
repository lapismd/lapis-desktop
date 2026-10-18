# Repository Storybook parity review

This continuation of [repository history](repository.md) records the reviewed
LD-REPO-004 presentation and its staged production adoption.

On 2026-10-18 the user authorized live adoption, focused tests and resumed
implementation, prioritizing a usable plugin. The earlier production freeze and
test deferral are lifted for these slices. Broad release/provider/platform and
whole-catalog checks remain deferred. Manual previews never qualify parity.

Preview strips use outlined Inspect/Revisions, a trailing no-wrap menu, less
padding, no bottom borders and hide without parents. Taller comparison labels
centre avatar/message/IDs/time. Sidebars start closed via public APIs. All
operation/revision popovers share a compact bordered search/close header without
title/group headings. Compact diff controls and centred Source Code Pro IDs
remain. Options use avatar/title/OP-or-Git-JJ-copy/time, no full-ID footer, and
retain exact ID copying/search. Op parents sit at the author row’s far right
with icon, short ID and Tooltip, omitting Parent text.

Both logs use Design Core Avatar/AuthorCard: supplied image or email Gravatar,
then initials; operation hosts imply no account/email. Profiles remain separate
from selection. JJ MarkdownContent bodies use measured nine-rem faded View
more/less previews on a distinct background; new descriptions reset expansion.
Selectors retain subjects. Column actions have theme-aware hover/focus. Op
Details omit Info and show recorded nonblank `attributes["args"]` after
Comparison parent. E-REPO-023 presents recognized JJ argument escaping with
readable quoting; unrecognized formats remain verbatim. The collapsible title
has no hover fill. Focused production adoption and interaction evidence are
recorded in E-REPO-015; visual baseline approval remains separate.

Selected JJ revisions expose a History-icon Evo Log action. Its closeable,
resizable graph retains the main revision/diff/pin and explicit predecessor
edges. Each version expands the same Markdown message, tag/profile metadata and
file list as JJ Log; selecting a file opens its own full-height diff column.
Version selection is independent of the main JJ selection. Changing the main
revision/operation closes evolution and its diff; closing evolution does not
clear the main comparison.

Rewrite comparisons use Previous version. Equal-parent single-predecessor
fixtures show the predecessor-to-version patch; initial versions compare with
their recorded commit parent. Native commit parents are never replaced with
predecessors. Rebased and combined-predecessor rewrites require native JJ
inter-diff alignment and stay unavailable until supported. Unknown predecessors
never become guessed ancestry. The fixture-only preview supplies no native
lookup, pagination or recovery qualification; production adoption remains gated.

Both production headers use a separate workspace Command View backed by explicit
links read through the retained native handle. JJ workspace context reloads the
native graph; Op Log retains repository-wide operation ancestry and clears
selection without claiming workspace-filtered operations. Operation titles in
graph rows and details reuse an adapted source message component: bounded full
hex IDs become abbreviated copy controls, with full identity retained for
copying. Buttons are siblings, never nested.

Op Log Revisions uses the Git branch icon. Revert opens an operation-inverse
preview in a new operation, following `jj op revert`, never snapshot restore.
Native apply stays unavailable. Root operations omit the no-comparison row.
Uncomparable Evo versions omit their comparison/file area without fabricating a
comparison; messages and metadata remain visible. Short JJ descriptions with no
body retain the action-row bottom divider before Comparison parent. File diff
headers show a compact file icon before the filename in all three views.

Conflicted JJ selections expose Resolve conflicts. Copy jj-store components
first and adapt data/actions; recreate only if copying is impractical. The
catalog now copies its conflict surface/body, sidebar icon, file tree, header
actions and MergeEditor settings composition, recording provenance. It uses the
same Files/mode toolbar, Left/Resolved/Right panes, Delete path, Stage merged
file and Preview actions, without the superseded extra context/footer. Public
shell parts and owned measured hosts provide sizing without dependency-internal
selectors. A root-level surface slot keeps the overlay outside the disabled main
area. Nested menu Escape, focus restoration and local staging are manually
reviewed. Drafts remain local while that commit stays selected; Preview cannot
apply a native command or clear the commit's conflict state. Live inspection
uses native conflict descriptors, identity checks and stale response fences.
Native write preparation, fingerprint/term validation, uploads and atomic apply
remain pending; Apply stays disabled.

All catalog revision/operation dropdowns and selected comparison labels reserve
space for avatar, IDs and time while message text shrinks to an ellipsis. The
owned Command View option resets inherited named grid areas to one row with a
bounded content track. JJ parent and Evo predecessor choices reuse the same
compact revision option as changed revisions. Full messages remain available to
title/accessibility metadata; copying still uses full IDs. E-REPO-014 records
manual geometry only; automated resizing and interaction gates remain pending.

## Production adoption

Reviewed presentation is adopted into production in focused slices, with
Storybook exercising the same components. Avatar/profile, compact searchable
selectors, semantic tags, long Markdown messages, operation titles and file
headers preserve exact native identity and the existing independent readers.
Fixtures and synthetic evolution/conflict data MUST remain catalog-owned.
Workspace context MUST use explicit native links and be distinct from operation
pins. Any unavailable capability remains explicit, never simulated as a save.
Evo predecessor edges remain distinct from commit parents; unsupported aligned
comparisons cannot be replaced with ordinary raw diffs. Repository writes retain
their separate native command/admission gate. The user prioritizes a usable
plugin with focused tests; broader qualification stays deferred in the
[repository parity review](repository-review.md).

E-REPO-023 renders JJ's recognized single-quoted transaction argument format
with readable, shell-safe quoting, preserving literal argument contents. Other
recorded formats remain verbatim; formatting never executes or mutates commands.
The expandable Op Log details title retains collapse activation without a hover
fill; ID copy and other action buttons keep their hover/focus treatments.
