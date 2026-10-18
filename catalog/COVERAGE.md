# Desktop catalog coverage

E-REPO-023 promotes reviewed blame components into production. All blame
layout/large-file/sticky stories render production Panel/View/Rows/Group and
CommitTitle with catalog-only statistics and source data. `EditorBlameAction`
tests the plugin contribution, navigation and cleanup on disable. Commit-card
subject navigation opens real JJ Log. `RowSelection` checks the production
AppShell surface; `OperationLayout` checks quiet collapsible titles. Catalog CSS
no longer supplies row colours. Original attribution stays in provenance.

E-REPO-021/022 review AppShell-coloured JJ Log and Op Log resting rows in
`Repository comparison/JJLogAndOpLogTabs` and regular plugin tabs opened from
`Repository blame layout review/LargeFile`. Only catalog CSS changes regular
graph hosts; header, hover and selected surfaces remain intact. Adoption awaits
approval. Three blame fixture commits now use the verified `dev@lapis.md`
Gravatar image; other sample emails retain initials fallback.

E-REPO-020 adapts `src/components/repository/blame/RepositoryBlameRows.svelte`
at `b2ee7957` into the review-only `ReviewBlameRows.svelte`. Absolute top
positions preserve sticky coordinates; production rows remain unchanged.
`StickyAttribution` covers pinning, push-off, replacement and horizontal
alignment inside one public Design Core shadcn ScrollArea viewport. `LargeFile`
checks both-axis ScrollArea, compact line numbers and no attribution/source
divider. E-REPO-022 replaces the unavailable `info@lapis.md` sample image with
`dev@lapis.md`. Original jj-store/Apache-2.0 attribution remains in
`docs/provenance.json`.

Blame layout proposal: owned production BlamePanel/View/Group at `68b130fb` are
adapted under `support/repository/blame-review`, using the same controller,
virtual rows and App shell. `Repository blame layout review/BlameLayout` checks
the compact header, content-height divider, aligned source group separators and
final-row bottom border. `TitleBarAction` proposes the public FileView
`git-merge-conflict` action; `CommitDetails` reviews title hover/focus,
first-line subject, author/avatar, relative time, fixture diff counts and commit
navigation. The counts are catalog data, not native blame fields. E-REPO-023
adopts this reviewed presentation into production. Original jj-store
source/license attribution remains in `docs/provenance.json`. `LargeFile` and
the default `CommitDetails` use real local controller source text with twelve
synthetic commits, six authors, varied group lengths, long messages, timestamps
and diff counts. The virtual viewport scrolls to the final row and back; this
remains fixture attribution, not live repository history.

`plugins/repository/RowSelection.stories.ts` checks graph/padding/tag selection,
independent author/copy controls and keyboard selection on both logs.
`FileHistory.stories.ts` mounts the default right-sidebar production view,
follows editor switches/rename/deletion, opens the selected revision at the same
pin, and covers empty/loading and toast recovery. Native stock-JJ equivalence is
qualified in jj-store E-FILE-HISTORY-001. Visual baselines remain pending.

`plugins/background/Work.stories.ts` mounts the production Notes workspace,
Repository History and native AI factory. Its owned delayed ports qualify
interactive startup during command discovery, repository loading progress and
worker failure feedback. `tests/workers/command-parser.test.ts` separately
exercises the actual bundled module worker; fixtures do not qualify native IO.

The complete AI source-family inventory and remaining unique scenarios are
tracked in [AI migration coverage](AI_MIGRATION.md). Desktop-specific visible
states are mapped in the [desktop review inventory](DESKTOP_STATES.md),
including loading, failure, Safe Mode, file conflicts and both desktop-only
plugins.

`plugins/ai/NativeNotes.stories.ts` mounts production NotesWorkspace and its
native service factory through disposable named IO ports. UnavailableAgent,
Disabled, SafeMode and Untrusted cover real optional registration, global
command seeding, one lazy admission and zero-allocation inactive/revoked
startup. `ResourceOrder` proves native close/reload runs only after owned view
drainage. Native IO and chat qualification remain separate.

`plugins/desktop/ShellStartup.stories.ts` reviews the production early entry
composition, reusing DesktopWorkspaceStartup for loading and import failure.
Native acceptance captures it before the application graph imports.

The canonical task ledger owns completion status. This maps application surfaces
to their real component stories; migrated plugin stages extend it with source
revision, source story, destination story and retained assertions before
retiring an old registration.

| Source surface                     | Destination                    | Assertions                                                                                                           |
| ---------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Production `VaultLauncher.svelte`  | `plugins/Launcher.stories.ts`  | Open, recoverable failure, return to existing vault, light/dark, narrow/desktop                                      |
| Production `NotesWorkspace.svelte` | `plugins/Workspace.stories.ts` | Real App boot, in-memory database/vault, note editing, full-pane Reading, owned teardown, light/dark, narrow/desktop |

Terminal application stories arrive in M8.1, portable plugin qualification in
M8.3 and retained AI scenarios in M10.2. Library-specific viewport/runtime
catalogs remain with `lapis-terminal` and `lapis-ai`.

## Terminal handover

Reusable source: `lapis-terminal` at `d7e0a7cd`,
`catalog/Terminal.stories.svelte` and `catalog/shells/Shells.stories.svelte`.
Production commands/settings/view identity also retain `lapis-plugin-terminal`
at `61f4ef24a6f2`, with its licence. The destination uses the actual desktop
plugin and NotesWorkspace, rather than the library example shell. Library
catalogs stay maintained by their owner.

| Source scenario                   | Desktop destination in `plugins/terminal/Terminal.stories.ts` | Retained assertion                                                                                  |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Bottom dock; Workspace; App Shell | DockRetention                                                 | One shell through hide/show and pane move; explicit close releases it                               |
| Workspace panes; Narrow container | DockRetention, MultipleTerminals + both viewport runs         | Real workspace placement, responsive viewport and independent shells; closing one retains the other |
| Input and Unicode                 | InputResizeAndScroll                                          | Native-frame viewport receives keyboard input, dimensions and scroll                                |
| IME paste and copy                | ImePasteCopy                                                  | Composition sends once, paste reaches client, selected text copies                                  |
| Colored output                    | ColoredOutput                                                 | Painted green/yellow/red/cyan glyph pixels and diagnostic labels in both themes                     |
| Exited session                    | Exited                                                        | Exited shell disables input and keeps visible status                                                |
| High output                       | HighOutput                                                    | Packaged viewport displays bounded rendered-frame output                                            |
| Recoverable error                 | RecoverableError + Unavailable                                | Existing notification service, retained viewport, retryable Start                                   |
| New desktop scenarios             | RestoredStart, Disabled, SafeMode                             | No automatic shell on cold restore, optional activation respects preferences                        |
| Existing installations            | InstalledCopyPrecedence, InstalledDisabled                    | Bundled identity wins, commands do not duplicate, data and explicit disabling survive               |

The SettingsSource case also verifies controlled shell preferences persist only
through plugin data, without a second flat application-configuration writer.

Cold native acceptance remains separate from fake-client catalog evidence.
Visual baselines remain pending approval.

## Retained AI chat

Source: `lapis-plugins` tree `56b5d6c1`, `stories/plugins/ai/AiChat.stories.ts`.
Original plays retain their assertions, with explicit adaptations below. The
following leaf stories qualify retained chat presentation. Owned workspace
placements, plugin lifecycle and Settings have separate coverage below; native
ACP/tool acceptance remains required.

| Source cases                                                     | Desktop destination under `plugins/ai` |
| ---------------------------------------------------------------- | -------------------------------------- |
| SendAndComplete, AutomaticMemoryRecall, OpenCodeHarnessChoices   | Conversation.stories.ts                |
| SkillsAndSlash, SearchToolHits, ValidationAndEmptyState          | CommandsAndResults.stories.ts          |
| PermissionRequested, PermissionAccepted, QuestionAsked           | TurnRequests.stories.ts                |
| QuestionAnswered, ToolRunning, SuccessfulToolCall                | ToolActivity.stories.ts                |
| AppToolReadTranscript, AppToolPatchApproval, AppToolSessionGrant | AppToolActivity.stories.ts             |
| AppToolHostUpgradeRequired, FailedToolCall, FileMentions         | ErrorsAndMentions.stories.ts           |
| AgentTrace, FailedMessageAndRetry, ScrollRecovery                | TraceAndScrolling.stories.ts           |
| HarnessModelRefresh, SettingsHarnessModelRefresh                 | Models.stories.ts                      |

OpenCode selection and model refresh exercise ACP choices rather than deferred
Native modes. AgentTrace waits for its real disposable App to finish startup;
its content, layout, clipboard, typography and tool assertions remain. Search
hit naming follows the upstream accessible filename/path repair. The fixture
uses real App/Vault/database instances and awaits owned cleanup; no fake App
object or production fake provider is added.

New `Requests.stories.ts` verifies opaque permission IDs, disabled replies,
Other input and fresh secret questions. `ReplyErrors.stories.ts` retains pending
requests after rejected replies and checks selected question accessibility.
`Cancellation.stories.ts` verifies pending approval cancellation and settled
working state. All AI stories stay visual-pending; no baselines change.

Disclosure queries follow the source-owned complete visible names: tool name,
target and rendered metadata; collapsed groups name their visible latest call
and count. Status is an accessible description. Every original geometry,
keyboard, navigation, detail and approval assertion is retained.

## Retained AI Settings

Source: `lapis-plugins` revision `ee20d366`,
`packages/ai/src/lib/settings/{register-ai-settings,ai-settings-tab,app-tool-setting-rows}.ts`.
`plugins/ai/Settings.stories.ts` renders the existing public Workspace Settings
surface with the production desktop registration and a disposable real App.

ControlledPreferences retains provider/model/thinking controls and independent
saved models. HistoricalRuntimePreferences keeps deferred choices readable and
inert until explicitly replaced with ACP. ToolRegistryAndCleanup retains tool
defaults, community opt-in, live registry changes and plugin-owned disposal.
SaveFailureAndRetry covers durable failure recovery through the existing field
error UI. UnavailableModelCatalog retains the visible saved choice and its data,
and asserts error delivery through the existing App notification service. Only
catalog clients and persistence faults are injected; no production fake runtime
or custom Settings screen is added. All five stories remain visual-pending.
History/Catalog, placements and native AI keep separate gates.

## Retained History and Catalog panels

Source: `lapis-plugins` `ee20d366`,
`stories/plugins/ai/panels/{History,Catalog}.stories.ts`. Desktop
`plugins/ai/{History,Catalog}.stories.ts` mount the production panels with
disposable real Apps, Vault-backed conversations and public registries. The
original behavior plays are retained in `support/ai/*-assertions.ts`: History
scope, local search/highlights, archive switch, tooltips, expansion, creation
scope, toolbar centering below 8px and count alignment below 2px; Catalog
owner/kind hierarchy, disclosure, tool selection, filtering and actual
source-file navigation. Queries follow complete visible accessible names.

Panel-only tool selection inspects the injected settings callback, rather than
claiming a bundled AiPlugin instance. Additional stories cover creation/toggle/
inventory failures, App notifications, archive/restore/delete, stale refreshes
and unmount during pending work. All remain visual-pending.

## Owned AI workspace views

Source: `lapis-plugins` `ee20d366`, `packages/ai/src/lib/ai-plugin.ts`, its
view/bootstrap/memory integration and `stories/plugins/ai/panels`. Desktop owns
the plugin composition; public Notes and Design Core packages keep shared UI.

| Original family | Destination under `plugins/ai/placements` | Retained checks                                                                                                                   |
| --------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Chat            | `Chat.stories.ts`                         | Six placements, empty composer, exact host, full viewport, surface paint and public examples; no unrelated document               |
| History         | `History.stories.ts`                      | Six placements, real Markdown context, original behavior, 8px toolbar centering, 2px count alignment, geometry/paint and examples |
| Catalog         | `Catalog.stories.ts`                      | Six placements, real Markdown context, original behavior, tool persistence, source navigation, geometry/paint and examples        |

`Admission.stories.ts` covers disabled/Safe Mode zero client allocation,
installed-copy precedence, explicit disabling/data retention and unavailable
execution. `Plugin.stories.ts` covers production registration and rejected new
work after scope closure. `WorkspaceLifecycle.stories.ts` covers lazy start,
first durable location without remount, explicit replacement, main-conversation
reuse and manager-driven disable/re-enable. `Lifetime.stories.ts` and
`PanelLifetime.stories.ts` cover chat bootstrap cleanup and draining pending
Chat/History/Catalog reads before database closure.

All remain visual-pending. Unique retained source scenarios and production
native admission/recovery retain M10.2 gates. Original standalone source
registrations remain until full handover qualifies.

## JSONL file preview

Source `lapis-plugins` `ee20d366`, `lib/jsonl` and Shell.JsonlPreview, maps to
`plugins/ai/Jsonl.stories.ts`. Transcript retains the original default editor
association, one file-only view, exact path, user/assistant/tool/reasoning
timeline, absent composer and hidden dock assertions. It also checks unchanged
bytes on save and zero runtime sessions. AgentEvents retains durable binding
validation; StructuredRefreshAndRename covers generic records, repeated open,
guarded writes, schema selection on rename and manager-driven disable/re-enable.
InterruptedAppend, MalformedRecord and EmptyFile retain readable diagnostics.
DisableDuringFileRead verifies late initial IO cannot mount after disabling and
that owned closure waits for that load. All run with the actual desktop plugin
and WorkspaceShell; no baseline or source registration is retired here.

## Retained AI shell

Source: `lapis-plugins` `ee20d366`, `shell/Shell.stories.ts` and
`RegistryScreenshots.stories.ts`, compared with Notes `77ae5c13`.
`plugins/ai/shell` retains Desktop, CommunityToolOptIn, Mobile,
ImmediateInitializingComposer, LocalConversations, AgentSwitching, Recovery and
FollowScope, with their complete behavior plays and public Docs examples.
Compositions retains ChatWithToolActivity and Overview; the existing right
sidebar placements cover every original Registry History/Catalog assertion.
`AI_MIGRATION.md` records all 54 browser mappings, the sidebar-fixture
adaptation and the two pending native Live Host replacements. E-AI-018 records
results.

The Notes Catalog's extra command-file navigation and explicit expand/collapse
checks now run in the leaf panel and every placement. Fixed viewport hosts and
unconditional viewport assertions cover unnamed browser-test canvases too. All
stories remain visual-pending; native admission and authenticated tools are
separate from fake-client browser evidence.

`Desktop/AI/User commands` adds two minimal-shell scenarios for external global
command refresh and unreadable-inventory recovery. They mount the actual bundled
AI plugin and Catalog using the production native command adapter with an
explicit disposable IO port. They also reject duplicate app copies of file
commands. The normal one-second refresh interval is retained; new observation
bounds allow three seconds for polling and rendering. No native IO is claimed.

## Shell review follow-up

`Desktop/File conflicts` retains the original persistence scenarios while
routing them through real Problems and Design Core MergeEditor. `ProblemsList`
adds the initial diagnostic state. `Desktop/Startup and recovery` uses the
shared opaque banner and icon actions. Terminal stories retain observations
through a private fixture port while showing product UI only, with both sidebars
collapsed. Current Design Core 0.5.1 intake and deferred acceptance are
documented in E-CATALOG-003; all changed stories remain visual-pending.

The follow-up review makes the conflict centre editable and preserves captured
conditional writes for merged results. Icon-only header settings use the shared
MergeEditor slot and public frame tokens. AI Settings, Catalog/History,
workspace, lifetime, model, command and user-command stories now use an
out-of-DOM fixture port for observations/actions. Existing assertions remain
authored; reruns are deferred by request. Terminal restores its pre-resize
viewport height.

## Native repository history presentation

`plugins/repository/Header.stories.ts` checks that History and Op Log start
directly with their production Column Canvas header, with compact native pin,
refresh and collapse controls that fit both widths and themes. Source layout and
header composition follow jj-store; native identities and admission remain owned
by Notes. Visual baselines remain pending.

`plugins/repository/History.stories.ts` mounts the production bundled Repository
History plugin, Notes workspace and public Design Core Diff through an injected
history reader. Source graph/row/column geometry is adapted from jj-store;
`docs/provenance.json` retains paths, revisions and the original Community
Apache-2.0 lineage. No runtime/source dependency or native IO claim is added.

PinnedHistoryAndDiff and UnifiedDiff cover both layouts.
RetainsHistoricalSelection and MultipleHeads retain exact operation choices.
RestoresHistoricalOperation verifies an explicit historical pin reaches the
first owned reader rather than the current head. RootRevision,
UnchangedRevision, NoRevisions and Empty distinguish valid empty states.
Preparing and UnavailableBinary keep incomplete or unsupported content explicit.
FailureAndRecovery, ReadFailureRetainsPin, RevisionFailureAndRecovery and
ComparisonFailureAndRecovery assert notifications, retained selections and
recovery. SafeMode verifies optional registration stays absent. Each scenario
runs in light/dark and desktop/narrow configurations; visual review and actual
cold native history acceptance remain separate gates.

PinnedHistoryAndDiff closes only its disposable Files/Outline sidebars using the
mounted controls. Desktop acceptance requires adjacent log/diff columns and the
public AppShell border/radius; narrow-pane coverage stays separate below.

`plugins/repository/HistoryLayout.stories.ts` adds NarrowPaneInWideShell through
the same real Notes shell. Its bounded fixture leaves the browser wide and
asserts pane-relative Column Canvas compact columns, contained refresh controls
and readable changed-file buttons. The shared helpers retain the original
ribbon/revision/file interactions for both story files.

`plugins/repository/Operations.stories.ts` mounts the production independent Op
Log view through the same Notes shell. OperationGraphAndChanges, RootOperation,
MergeParentChoice, Snapshot and Empty cover native DTO presentation. The
RefreshRetainsPinAndSeparateHistory case opens the exact selected operation in
History without moving the Op Log pin. DetailFailureAndRecovery and
GraphFailureAndRecovery assert application toasts, retained selection and
explicit retry. MultipleHeads requires a pin choice. These are borrowed-view
adaptations, not native provider or managed-chat/restart acceptance. All stories
retain visual-pending and run light/dark at desktop/narrow widths.

`plugins/repository/ColumnInteractions.stories.ts` covers full SHA/reverse-hex
clipboard values, hover/focus, copied/failure feedback, toast recovery, row
expansion/collapse, all file-list modes, wrap and diff close/reopen. Clipboard
fixtures restore browser state without changing the user's clipboard. Shell
height and pane-width assertions exercise the embedded public AppShell body.
ResizingAndCompactReturn checks keyboard resize and expanded-row graph bounds;
ExpandedRowKeepsFilesInView prevents row expansion from moving to a blank diff.

`plugins/repository/OperationFiles.stories.ts` covers operation changed-revision
selection, exact file/diff comparison, explicit ambiguous pairs, unavailable
content, revision-load toast recovery and path failures that never appear empty.
All use production views and remain visual-pending; real native operation-read
acceptance is separate.

`plugins/repository/OperationLayout.stories.ts` covers the jj-store stacked
operation/file cards, 12px spacing, author/avatar, exact ID copy, disclosure,
file selection, split diff, close/reopen and loaded/unloaded parent navigation.
UnloadedParentFailureAndRecovery and ParentLookupBound assert application toasts
and retained selection; the former also qualifies explicit retry. Native delta
details remain accessible from the operation header; no independent metadata
column remains. Both themes and widths remain visual-pending. Source attribution
is in docs/provenance.json.

`plugins/repository/Comparison.stories.ts` opens both production repository
views as separate workspace tabs over the same fixture. JJ Log retains its
expanded file and split diff when switching to Op Log and back; Op Log retains
its stacked operation/file cards and exact independent pin. Both themes and
widths remain visual-pending. This is fixture review, not native capture proof.

`plugins/repository/ParentPicker.stories.ts` uses the production Command View
parent picker. It covers keyboard selection, rich author/time/Git/JJ cards,
search by exact full ID and author email, native tag preview, no matches,
unloaded parents, metadata failure/toast and explicit retry, and separate
comparison-file/selected-file statistics. Both themes and widths remain
visual-pending. MergeParentSelection moved here from History with its exact
comparison/diff acceptance retained. Source attribution is in
docs/provenance.json.

`plugins/repository/Operations.stories.ts` also covers the production operation
parent Command View, loaded/unloaded metadata, user/host/workspace/time cards,
keyboard search/selection, exact operation identities, merge choice retention
and App toast/explicit metadata recovery. Operation parents remain distinct from
commit/change IDs. Visual approval remains pending.

`plugins/repository/Header.stories.ts` covers JJ Log and Op Log
operation-snapshot Command View selection, full-ID search, current-pin
indication, keyboard/focus return, empty disabled state and no native IO while
searching. This header control selects operations; it is not a workspace
selector.

`plugins/repository/DiffLayout.stories.ts` uses production History/Op Log views
to verify short split diffs fill their available column/card and both revision
panes across both widths/themes, wrapping, operation metadata collapse and
return to compact unified mode. The shared package is unchanged.

`plugins/repository/ParityReview.stories.ts` is a **review-only prototype** per
explicit user direction. It uses an owned disposable App and catalog copies of
the operation/history compositions for a full-width selected-row action bar,
labelled Inspect/Revisions buttons, non-wrapping copy menu, compact single-row
JJ parent trigger with copy IDs, source-coloured identifier chips and rich
Command View options. Both review sidebars start closed on reload.
`Comparison/JJLogAndOpLogTabs` uses the same review composition; the prior
production interaction remains in `ProductionIntegrationComparison`. It is not
qualified production coverage. The user deferred tests and production adoption
until visual parity confirmation.

The review now shares a muted Comparison parent strip between JJ/Op Log, with
copy IDs inside selector labels and time at the far right. Revisions uses a
compact search/close header, a full-width divider and no repeated group heading.
The action-menu trigger borrows jj-store hover tokens. Tests remain deferred.

Latest review: Git/JJ chips and IDs use the source Source Code Pro family with
centred text cells. Both diff views use the compact22px control frames/12px
icons adapted from jj-store CommunityDiffControls. Comparison strips are absent
when no parent is available, superseding the briefly proposed disabled row.

Operation-parent and Revisions popovers share the same catalog search/close
header, zero outer padding, full-width divider and untitled options group.

Operation-parent options now use one row for avatar/title, one OP identity-copy
control and relative time. The ordinary full-ID footer is removed; missing-card
retry remains explicit. Copy/failure interaction checks stay deferred.

Revision options now match the one-row layout with title, Git/JJ copy controls
and time. Both review logs use public Design Core Avatar and AuthorCard across
graphs, parent labels/options and the operation rail. Commit email drives an
optional Gravatar image; missing images use name initials, and supplied author
images take priority. Profile details display only available name/email or
operation user/host. Avatar activation is independent of row selection. Manual
preview only; image-success, hover timing, keyboard, clipboard and accessibility
qualification remain deferred with the other automated checks.

`ParityReview/MultilineCommitMessage` opens JJ Log with an expanded multiline
commit. The shared review fixture preserves the same description in graph,
commit detail and changed-revision metadata. Public Design Core MarkdownContent
renders the expanded body, while graph subjects and picker labels stay compact.
The example includes bold, italics, inline code, two list items, a blockquote
and a fenced shell command. JJ/Op comparison strips have no bottom border.
Manual render review only; automated tests and production adoption remain
deferred.

Op Log parent links now sit at the author row’s far right, with a corner-up
icon, shortened ID and public shadcn Tooltip. The visible Parent prefix is
removed; accessible labels and navigation retain the exact native target.

The multiline-commit fixture now exceeds the preview height. Long bodies show a
nine-rem faded preview and View more/less; their background differs from the
selected row in light and dark appearances. Rendered height, rather than source
length, decides whether the action is present. Expanded content retains
Markdown. Column collapse/close/header and compact diff controls share stronger
hover and focus feedback through catalog-owned hosts and public tokens. Manual
preview only; automated interaction/accessibility/type/build checks remain
deferred.

Op Log's separate native Info disclosure and generic operation-change details
are removed in the review composition. The labelled Inspect action still opens
the main operation column. Recorded `attributes["args"]` appear as plain command
text after Comparison parent, without parsing, execution or an inferred prefix.
The selected-operation fixture includes CLI args; its root parent omits them. No
missing-data placeholder is rendered. Production adoption/tests stay deferred.

`ParityReview/TagsAndConflictedCommits` opens JJ Log with its second, conflicted
revision selected beside a split diff. Both it and MultilineCommitMessage use
public Design Core TagList for local/remote bookmarks and workspace/status
chips. Flat tags keep their semantic tones and accessible overflow, without
redundant descriptions. Neutral bookmarks use the filled secondary variant so
their shapes remain visible on selected rows. The TagList overflow is separate
from row selection; picker previews share the same mapping. Manual light/dark
review only; automated checks and production adoption remain deferred.

Both review headers now use `ReviewLogHeader`/`ReviewOperationPinPicker`,
adapted from the owned `src/components/repository/RepositoryLogHeader.svelte`
and `RepositoryOperationPinPicker.svelte`. Select operation shares Revisions'
bordered search/close header, zero outer padding and untitled options group.
Single-row options reuse the operation-parent avatar/title/OP-copy/time layout;
there is no full-ID footer. Exact IDs remain searchable/copyable and current-pin
checks remain. Available fixture operation metadata is shared with graph reads;
unknown records retain a neutral label without invented time/author. Opening or
filtering performs no native lookup. Shipping components remain frozen.

`ParityReview/EvolutionLog` opens JJ Log beside a closeable/resizable Evo Log
column. The selected-row action uses the source History icon and short label;
other JJ stories start with evolution closed. The preview adapts jj-store's
`StoreEvolutionColumn.svelte`, `StoreRepositoryActionsPanel.svelte` and
`repository-log-canvas.ts` into catalog `ReviewEvolutionColumn`,
`ReviewRevisionActions` and `review-history-canvas`. Shared graph rows retain
Design Core avatars/tags and exact Git/JJ copy controls. Explicit typed
synthetic predecessor records connect rewrite versions; native commit parents
stay separate. Evolution selection/close leaves the main revision, diff and
operation pin intact; main selection changes close evolution. Fixture-only
manual review: native query/pagination, error/empty/incomplete lifecycle and
automated qualification remain deferred. No shipping integration is claimed.

Evolution now reuses the JJ Log expanded-row composition for Markdown messages,
avatars/tags, comparison selectors, changed-file list/folder/package modes and a
separate full-height split/unified diff. Selecting a version expands that row
without truncating the original predecessor graph or moving the main JJ
selection. The fixture marks rewrite comparisons Previous version and initial
versions Comparison parent. Its explicit same-parent predecessor patches match
that supported JJ inter-diff case; rebased, combined or unknown predecessors
stay unavailable until native alignment exists. Commit parents are never
rewritten to make a controller accept a predecessor. The catalog state and
comparison content are synthetic; no native acceptance is claimed. Product
tests, native inter-diff/paging/recovery and production adoption remain
deferred.

Both catalog headers have separate workspace pickers adapted from jj-store's
`StoreWorkspacePicker`: explicit fixture workspaces, overview, current marker
and shared search/close composition. Context changes clear selection while
retaining the operation pin; no native workspace filtering is claimed.
`ParityReview/OperationMessageIds` demonstrates the copied/adapted operation
message parsing and inline full-ID copy controls in the graph and details.

`ParityReview/ConflictResolution` and `ShortCommitWithParent` select the
conflicted short-message row. Resolve conflicts opens copied/adapted jj-store
`StoreConflictSurface`, `StoreConflictBody`, `StoreConflictText`,
`StoreConflictHeaderActions`, repository file tree and sidebar toggle, using
public Design Core parts. Source Files/mode controls, 15rem browser, action
labels, merge panes and settings are retained. The root-level catalog shell
surface stays outside inert Main. Draft/selection/preview are memory-only;
native apply is unavailable. The short-message action strip has one visible
separator above its comparison parent. All file-diff headers share a file icon.
`ParityReview/RevertOperation` adds Git-icon Revisions and a Revert confirmation
preview; the operation inverse is not snapshot restore.
`EvolutionWithoutComparison` opens a root version with no comparison/file row.
Root Op Log selections also omit their no-file-comparison row. No automated
plays/type/build qualification or production adoption is claimed; user visual
approval remains pending.

E-REPO-014 records shared picker title shrinking across changed revisions,
operation snapshot/parents, JJ parents and Evo predecessors. Existing Command
View option hosts now use an explicit one-row minmax grid; shared summaries
shrink before avatar/IDs/time. JJ and Evo parent choices reuse compact
ReviewRevisionOption. Full descriptions and IDs remain retained. Manual actual
popover/label geometry has no horizontal overflow, with visible ellipsis for the
long operation title. Product resize/keyboard/axe/type/build qualification and
adoption stay deferred.

Production adoption (E-REPO-015): repository review compositions now import the
shared production author, message, selector, graph, file/diff and copied
conflict presentation. `Desktop/Repository live plugin` exercises workspace
context, exact native conflict inspection with local staging/preview and
disabled apply, and hydrated operation revision cards/recorded args with
disabled Revert. Production contains no catalog imports or synthetic predecessor
records. Evo/revert synthetic demonstrations remain explicitly catalog-owned.
Focused repository interaction/accessibility results are recorded in E-REPO-015;
broad release/platform/provider/whole-catalog checks and visual approval are
deferred.

`Live plugin/MarkdownAndTags` drives the production Markdown preview, View
more/less, semantic local/remote TagList visibility/overflow and file selection.
Both production log tabs remain available in
`Repository comparison/ProductionIntegrationComparison`.

`Repository file blame/BlameFromFileHistory`, `FailureAndRecovery`, `Preparing`
and `SidebarHeaderAlignment` mount the production plugin. Copied jj-store
StoreBlameView/Group, blame-model and CommunityProjectsVirtualRows at
172703544540a10897274f584582466b911a803d retain virtualized source, progressive
attribution and author/origin navigation; provenance is in docs/provenance.json.
`Repository file history/NoActiveFile` and `NoRevisions` assert the public
shadcn Empty icon. `Repository loading` holds real
log/details/files/diff/conflict reads and asserts representative production
skeletons; application progress remains independent and closure releases pending
fixture work. Visual review stays pending; native annotation and ordinary
desktop acceptance have separate evidence.
