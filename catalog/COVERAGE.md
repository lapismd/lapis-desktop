# Desktop catalog coverage

`AI compute library` covers the separate Installed clients-style header and
avatar table, with downloaded and imported GGUF rows, selection and running
state, known-byte download progress, unknown totals, missing weights, confirmed
removal, actionable failure notifications and interrupted operations. It reuses
`AI setup`'s owned Settings fixture and public Design Core controls. Existing
`AI setup` stories retain resources, searchable model fit, import file
selection, tabs and disabled/loading/error states. JJ Store/Buzz reference
adaptations remain destination-owned; source and native acceptance are E-AI-123.
Visual baselines remain pending.

`Desktop/AI/Note links/Conversation` reviews current file mentions, Markdown
note links, wiki aliases and literal code/unavailable references through the
production reader in both modes. `JSONL/Transcript` retains the captured
`@[[Notes/Welcome.md]]` text and verifies keyboard navigation to a visible note.
`Errors and mentions/File Mentions` verifies composer selection and mouse
opening.

`Desktop/AI/Chat layout review/Sending Error` injects one catalog runtime
failure before dispatch, showing the production interrupted-turn/retry controls,
retained draft and standalone error beside the fixed keyboard hint. Explicit
retry uses the normal fake runtime. This is passive UI review, with checks
paused.

`Desktop/AI/Chat layout review/Conversation` now exposes app tool details
through an owned adaptation of JJ Store's `ChatToolPanel`, backed by public
AppShell SurfaceLayer and Transcript readers. The read title opens the
body-covering inspector; its separate chevron expands captured
syntax-highlighted source and existing Show more/less. Markdown has one
Preview/Source/Capture view control, with checked/unchecked/nested/ordered
tasks, a table and fenced TypeScript in the review fixture. The shared fixed
hint row omits its top border. Conversation rows retain a small gap in both the
inbox review and History subtree. These are manual UI review targets; automated
checks and live integration remain paused.

`Desktop/Repository working copy status` mounts the production plugin in the
real Notes shell through the public status-item mount API. `DetailsAndRefresh`
covers totals, refresh, recorded revision navigation and the borderless compact
split control. `Loading`, `Clean`, `Binary`, `FailureAndRecovery` and
`SettingsAndDisable` cover skeletons, unavailable line totals, toast recovery,
the persisted visibility setting and contribution removal. Fixtures supply only
read data; upstream native observation and source preservation have separate
evidence. E-REPO-024 retains visual/native review gaps.

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
MoveHistoryToMainBody uses the shared tab menu through the packed API and checks
that the main pane retains the original history view container after transfer.

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

`Desktop/AI/Transcript review` adds opt-in production Transcript composition:
document/classic, retained draft, empty/loading/interrupted, permission/question
and comments-as-context scenarios. Public Design Core Transcript, composer,
footer, author profile and tool-result components are reused; the original
ordinary plugin stays selected pending visual approval. Comments-only dispatch
retains exact anchors separately from authored text. Fixtures own all fake
runtime/session data and await teardown. E-AI-039 records focused evidence. The
code/table scenario selects exact text in both readers and submits both quotes
as comments-only context without editing the capture.

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

NativeConversationStorage and Settings review the grouped AI page: Conversation,
Runtime and model, Memory, Handoff summaries, Application tools and a direct
native-history table without an enclosing card (E-AI-091).

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

AI reference comparison: `DesignCoreReference.stories.ts` renders Design Core's
recorded full-conversation demo through public Transcript, MarkdownComposer,
MessageQueue and Footer exports. Source/destination fixture provenance is in
`support/ai/transcript/REFERENCE.md` (Apache-2.0). Document/Classic are separate
review states, independent of the Notes controller adapter. TranscriptReview
also covers two table-row comments/context and long fenced-code folding.
GroupedToolDisclosures opens captured tools and the real inline comment editor
in both Document and Classic, including Escape dismissal without submitting.

AI transcript adoption (NOTES-08B/E-AI-041) uses the ordinary `AiViewPanel` in
`Shell/Transcript adoption`, with no opt-in catalog replacement. Existing Shell
Desktop, LocalConversations, Initialization and Compositions now assert the
shared transcript, fixed footer, exact restored context, copy/retry/model
actions and skeleton loading. Persistence failure has an explicit toast
assertion.

`Transcript review/UnknownLocalTurn` mounts the production local-file recovery
path in the App shell. It retains the authored prompt, disables Retry in both
Document and Classic views, starts no provider on restore, and continues only
from a new authored message. Native interruption/reopen is a separate acceptance
lane; visual approval remains pending.

`Desktop/AI/Comment history/RestoredCodeAndTableFeedback` uses production file
conversation projection, two exact acknowledged code/table captures and the
public TranscriptController. It scrolls the immutable reader to the table,
checks inline Sent feedback and no pending queue, switches Document/Classic, and
sends an explicit continuation with saved comments in handoff. Native
comments-only Codex and cold History evidence remain in E-AI-045; visual review
is pending.

`Desktop/AI/Addressed messages` mounts the ordinary shared transcript in the App
shell with both docks collapsed. SavedRecipients shows an unavailable historical
recipient without creating a provider session. SelectRemoveAndSwitch covers the
@ agent choice, shared draft audience, removal and Document/Classic.
ExplicitSend checks the exact separately saved setup token and unchanged message
text through the production repository/controller. Tags remain visual-pending;
multi-recipient and queue delivery are separate slices.

Recipient pills adapt jj-store
`web/src/lib/ui/community-chat-composer/CommunityComposerAgentAudience.svelte`
at `d80f03418e64c13f15483a41896cec5490e8e2ea` into
`src/components/ai/chat/ChatRecipients.svelte`. The production adapter uses
Design Core Button/Avatar/Badge and the headless codec's built public exports;
no source-checkout import or catalog state enters production.

IndependentParticipants exercises Reviewer → Writer → Reviewer through the same
admitted runtime, distinct session bindings, exact switch-back resume and
visible Document/Classic attribution. It qualifies sequential single-recipient
turns; multiple-recipient dispatch and queues remain pending.

`Desktop/AI/Multiple recipients` covers one authored message delivered to two
independent participants, per-recipient results in both views, normal
participant creation without execution, and failed save with retained name plus
one toast. In-flight badges/cancellation and repeated native permission IDs
across two independently approved participants retain separate outcomes. The
normal menu uses production components and ordinary vault-owned AI settings.

`Desktop/AI/Queued messages` uses the production local queue with Design Core
MessageQueue and TranscriptFooter. It covers editable active Document/Classic
composers, FIFO after completion, whole-message cancellation, explicit live and
cold resume, visible waiting follow-ups and retained failed-save draft/one
toast. Interrupted-before-checkpoint recovery keeps one notice and renders the
new approval after explicit Resume without repeating the interrupted prompt.
`Single composer action` observes the live footer through initial submission,
then types and removes a follow-up in both layouts. It asserts that Stop and
Queue never coexist and that empty drafts omit Queue entirely (E-AI-102).

`Desktop/AI/Comment history/Linked code table and tool replies` uses the
production local parent/receipt projection and unchanged Design Core controls.
Code/table/tool captures retain their original anchors; acknowledged feedback
opens its captured answer, which links back to the same discussion. Both
presentations restore without a provider prompt. Legacy captures remain Sent.

- `Desktop/AI/Comment history/Continue restored thread` reuses the production
  Reply composer, pending comments and Document/Classic state. Only the newly
  authored feedback is submitted; existing saved reply links are retained.

IMPORT-01A (`ai/ImportReview.stories.ts`) mounts production AiImportPanel and
the shared AiRecordedTranscript in the real WorkspaceShell with both docks
collapsed. Eight states cover explicit source preview, Document/Classic, save
and exact duplicates, unknown-write retry, preview failure/toast recovery,
representative loading skeletons, no sources, unavailable hosts and saved
read-only chat projection without a composer. Source clients are fixtures;
native discovery/import remains IMPORT-01B. Inbox provenance is in
docs/provenance.json; visual baseline approval is pending.

AI-SESSION-UI promotes the reviewed components into the ordinary plugin under
its 2026-10-19 implementation approval. E-AI-058 owns resumed source and
consumer qualification; visual baseline approval remains separate.
`Desktop/AI/Session layout review` and `Import layout review` use the production
nested inbox shell with collapsed outer docks. The saved-local cases mount
ImportedConversation over the real local repository: metadata-only grouping,
lazy version reads, immutable version switching, failure toast and explicit
retry. Incomplete versions expose no partial transcript or composer. Import
preview, save and exact duplicate handling retain their existing source and
repository authority. ImportReview now covers the same production inbox.
Loading, search, filters, compact navigation and empty content remain mapped.
Copied paths, source revision and license are in docs/provenance.json.

`Desktop/AI/Chat layout review/Conversation` and
`Shell/Compositions/ChatWithToolActivity` mount the ordinary AiView factory.
AiChatSession composes the existing transcript, controller, comments, composer,
local repository and actions. LiveInboxControls exercises wrapped slash
suggestions, read-tool Preview/Source overlay, focus restoration and draft
retention across Document/Classic. Inline interruption feedback checks one
rounded inline warning with an icon-only, tooltipped retry at the far right and
no duplicate fixed error. FailedSendRetainsDraft invokes the real submit path
with a rejected fixture runtime. Shell cases retain local journals, agent
switching, folder following, archived actions, admission and narrow-panel reopen
coverage. Catalog provider clients remain synthetic; this is not fresh native
provider, JJ storage or automatic capture coordination proof.

LongMessagesWithSidebars adds a captured deep file-read path and long basename
to this real shell. Prose must fit and tool paths truncate after outer sidebar
toggles and Document/Classic switching, with the nested conversation list
visible when space permits. Design Core owns title truncation and full-path
tooltips; captured text, identities and host-owned inspector actions are
unchanged.

AI-JSONL-UI replaces the file-only preview with AiJsonlPanel in the shared
nested AiSessionFrame/AiSessionThread. Desktop/AI/JSONL mounts the actual
registered TextFileView in WorkspaceShell: Transcript (Document/Classic,
read-only), Agent events (structured captures and Markdown handoff), generic
refresh/rename, interrupted append, malformed record, empty, loading and disable
during read. Large transcript exercises captured Markdown/source inspection,
Escape/focus restoration, highlighted code/diff and long scrolling content
without writes or runtime sessions. Retained direct-panel stories now use the
sole shared renderer; legacy timeline/composer/source-table components and
exclusive CSS are retired. Design Core's Classic prompt-surface story owns the
role-based primary tint.

InlineLocalCommands exercises real local `/help` and `/search` dispatch in the
nested chat shell, coloured monospaced reports, acknowledgement and inline-only
search disclosure. SavedLocalCommands reopens retained JSONL results read-only,
with exact report whitespace and inline tool placement. Agent read inspection
remains covered separately by LiveInboxControls. No new persistence fields.

AI Attachments mounts the production nested shell: Classic preserves the rounded
composer edge and compact drawer; Document keeps removable file chips in an
expandable section with relative-path tooltips. FilePicker covers
icon/title/path rows, tooltip and keyboard selection; ThreeLineComposer covers
both default heights and retained multiline drafts across modes. Pending
approval/question callbacks remain covered by Requests, ToolActivity and
Cancellation.

InlineLocalCommands additionally asserts that local reports have no outer frame
or inset. EmptyLocalSearch exercises a real unmatched query and the Search-owned
Empty state. SavedLocalCommands retains exact captured output and inline-only
inspection in the JSONL reader.

`repository/HistoryStorage.stories.ts` mounts production storage settings in the
real Notes shell. It covers external/root layouts, move/reload, original-request
resume/rollback, representative loading and App-toast failure recovery. Native
storage identity and crash recovery are separate service proofs; visual approval
and cold native app acceptance remain pending.

Automatic vault backup: `repository/AutomaticBackup.stories.ts` mounts the real
plugin, independent native-service adapter boundary and production status
control for saved, saving and failure/recovery states. Native capture is
qualified separately; visual approval remains pending.

Automatic vault backup / ResponsiveInitialCapture uses the production Notes
plugin with an explicitly withheld initial-capture response. Repository restore
stories use the production diff toolbar, App editor guard, restore dialog and
notification service; SafetyCheckpoint and LostResponseAndRetry cover success
and recovery.

Repository restore / WholeVaultSafetyCheckpoint and InterruptedRestore exercise
production all-writer guards, confirmation, retained request replay and
feedback.

Repository backup accounts / EmptyAccounts, TokenAccount, DeviceAuthorization,
FailureAndRecovery and Loading use the production Settings action, backup
settings view, account controller, real App progress/toasts and injected native
service port. Copied jj-store account/auth/field/controller sources and
destinations are recorded in docs/provenance.json. No OS secrets or live forge
requests occur in catalog execution. Visual review remains pending.

Repository remote backup / RepositorySetup, FetchAndRestore,
LostResponseAndRetry, CachedRestoreWithoutAccount, FailureAndRecovery and
Loading exercise production remote settings, the shared guarded restore dialog,
App progress and toasts. Copied jj-store remote settings/select provenance is in
docs/provenance.json. The catalog uses injected services; live forge/native
acceptance and visual approval remain separate.

Repository automatic sync / CleanMergeAndPush, ConflictResolution,
OfflineAndRecovery, BackgroundTransfer and UnknownApplyRecovery exercise the
production plugin-owned scheduler, account/settings view, shared conflict
editor, all-writer guarded apply, original request and real App progress/toasts.
Resolution accepts a local merge-editor side and verifies the saved text. Fresh
catalog processes cover light/dark and desktop/narrow layouts. Native
transfer/merge proofs are separate; no live provider or personal credentials.
Visual approval and actual native WebView qualification remain open.

Repository publication recovery / CheckWithoutReplay, StopWithoutAccount,
KeepTracking and ActiveRequestAndRecovery exercise the production original-push
summary, read-only observation, signed-out explicit stop, retained confirmation
and failure/toast recovery. The original request is asserted throughout; catalog
services cannot publish. Native receipt/replay proofs remain separate. Visual
review and cold native/provider gates remain pending.

Repository history search / ExactFileVersion, MetadataAndFilters, OlderHistory,
NoMatches, Loading and FailureAndRecovery use the existing Search plugin in its
real workspace shell. They cover history scope, incremental continuation,
version-changing author/date filters, representative skeletons, failure/toast
retry and exact immutable activation. File versions open blame; metadata-only
checkpoints open JJ Log. Source Search stories independently cover content
deduplication and retained disclosure/context during page arrival. The cold
native indexed-search test covers persisted projection/IPC and preserved later
disk edits. Restore UI and wider native/provider acceptance remain separate;
visual review remains pending.

Repository backup accounts / ForgejoToken extends the maintained public
account/settings composition with explicit HTTPS instance/PAT setup. Existing
GitHub OAuth/PAT/loading/failure stories, remote setup, synchronization and
original-publication recovery remain direct consumers. Native worker/custody and
endpoint/project proof is separate; no personal token or live forge is used in
catalog. Existing copied provenance remains in docs/provenance.json.

Repository original history stories mount production source selectors and
adoption settings in the actual Notes plugin. They cover independent JJ/Op Log
tabs, loading/absent/unreadable sources, saved original requests, resume/stop
and App-toast recovery. Existing public Design Core Command View/Popover/Card
components are composed directly; no replacement screens or new copied source
are introduced. Native source witnesses and ancestry transfer are separately
qualified. Visual approval and cold native acceptance remain open.

Repository backup accounts and all remote/storage/adoption/sync/publication
scenarios now open the registered Repository History settings section directly.
They assert that no independent backup-settings workspace leaf is created.
CloseAndReopenSettings cancels the transient GitHub device flow and proves a
fresh embedded panel after reopening. Settings closure during a storage move
retains plugin-owned completion; interrupted remote restore reopens its original
request from the same settings section. Fullscreen conflict review remains a
nested accessible overlay. Compact cards/headings/footers and GitHub/Forgejo
icons copy and adapt jj-store; exact paths, revisions and licenses are recorded
in docs/provenance.json. Visual approval and real native/provider gates remain
separate.

Forge account menus copy jj-store menu-layout.ts: content-sized width, a 14rem
minimum and a viewport bound keep account choices on one line. Existing Forges
stories exercise these menus at desktop/narrow widths in both themes.

Backup and synchronisation is a separate labelled region inside the actual
Repository History plugin Settings page. General controls still use public
controlled AppSettings components; the maintained backup cards use tinted
headers and body-surface rows/footers. Forges, RemoteBackup, Sync, Publication,
HistoryStorage and HistoryAdoption remain the complete affected story families.
No replacement fixtures or dependency-internal CSS selectors are added.

The working-copy WorkspaceFooter scenario extends the production shell
acceptance for the dedicated footer, repository placement and activity bridge.

`Desktop/AI/Vault file exclusions/Shared Core Policy` proves core defaults and
configuration updates in the production folder picker without Repository
History. `Chat layout review/Compact Composer` covers both two-line modes and
retained drafts.

`Desktop/AI/Vault file exclusions/Workspace Settings List` exposes the core
Workspace / File discovery / Excluded paths list through public API Settings,
proving defaults, add/remove, persistence, empty-list discovery and updates
without Repository History or changed note bytes.

`repository/UpstreamStatus.stories.ts` uses production footer/header controls in
the real Notes App for a HeaderReview and incoming/outgoing counts, no fetched
tip, disconnected, read-only, pending and offline/toast states. Fetch/Pull/Push
are separately asserted, with keyboard shadcn tooltips and count refresh.
`HistoryStorage` shows the native-selected external directory and records OS
reveal intent without a real file-manager launch or migration. E-REPO-043;
visual-pending.

E-AI-100: `Desktop/AI/Local ACP conversations/Supported modes and pin` uses the
production footer in the embedded AppShell to check advertised Plan/Build,
checked selection, layout retention and Pin/Unpin in Conversation actions.
`Permissions in footer` retains inheritance/overrides; Shell FollowScope keeps
its pinned-conversation navigation proof. These remain visual-pending.

`ai/ChatScrollRecovery.stories.ts` mounts the production Notes chat/inbox with
long captured content. DocumentRecovery and ClassicRecovery verify actual
viewport end navigation, real controller busy/cancel transitions, three-dot
activity and sticky-composer clearance through public Design Core components.
Fixtures hold a fake-agent approval; they never dispatch to a real provider.
PendingPermissionAcrossViews retains that live request and composer through
Document/Classic preference saves, then answers the same runtime request.
E-AI-064; visual-pending.

`repository/BlameWrapping.stories.ts` uses the production blame pane with long
paragraphs and an unbroken path. It verifies default wrapping, logical-line text
preservation, virtual-group alignment on resize/toggle and saved on/off choices
after closing/reopening the pane. E-REPO-044; visual-pending.

## Installed AI clients

`Desktop/AI/Agent setup review/AgentsAndMentions` mounts the production chat and
searchable footer agent picker. Reviewer and Writer profiles come from the
fixture's reactive settings, so Add agent updates both that picker and @
choices. The story embeds the current AiChatSession Design Core AppShell with
its conversation sidebar. The jj-store-derived inset editor retains name, shared
AvatarPicker image/emoji/background, client, searchable model and effort
defaults. Document/Classic share selected recipients and drafts. This is a
manual review story; tests and native execution/storage qualification are
explicitly deferred in E-AI-072.

`Desktop/AI installed clients` mounts the production Installed clients table in
the AI-owned Agents settings category, matching Repository History forge rows.
Installed, update confirmation/cancellation, update/refresh, loading and
discovery-failure states adapt jj-store runtime rows.
`Desktop/Repository history search/CurrentFiles` verifies current rows and the
actual bounded workspace viewport. All remain visual-pending.

`Desktop/File conflicts/RetainedMergeAfterReviewClose` uses the real tab close
control and Problems navigation to retain an edited merge across review closure,
then save its exact bytes and clear the diagnostic. It exercises the public
layout-only close policy; original editor and application guards remain active.

`Desktop/AI/Agent profiles/SavedAgents`, `NoSavedAgents` and
`FailureAndRecovery` mount the production Agents settings category with the
jj-store-derived gallery and shared profile editor/AvatarPicker. These are
manual design-review targets; automated checks, save/removal recovery and native
acceptance remain parked in E-AI-072.

`Desktop/AI/Native conversations/CapturedMessagesAndTools` and
`AuthoredThreadMessages` mount the production native reader in the embedded
Design Core session shell. Catalog-only native text envelopes pass through the
real adapter, pinned catalog/read leases, typed record cache and shared
Transcript. The sample retains separate authored/captured origins, linked
sessions, Markdown/code, captured tool input/output, inert permission history,
an unfinished tool and a capture gap with partial source coverage. Document and
Classic share the same retained records and tool inspector. `Loading`, `Empty`,
`FailureAndRecovery` and `ReadFailureRetainsPreviousView` cover representative
skeletons, neutral empty states, one App failure notice/retry and retention of
the previous successful view. E-AI-075 records warm observation only; automated,
cold/native/provider, large-history and full managed-chat acceptance remain
parked.

`Desktop/AI/Native conversations/ManagedAgentProfile` adds typed native host
attribution, a locally owned saved-profile avatar and explicit authored-revision
turn grouping in the same embedded shell. Preferences remain separate from
observed configuration and source identities remain separate. This uses a
simulated native projection; E-AI-079's native and renderer regression sources
and all qualification remain unexecuted while verification is parked.

`Desktop/AI/Native conversation routes/RestoredNativeTab` mounts the production
AiView with a versioned opaque native reference and the App-owned native
workspace. `ForeignReference` exercises identity refusal without a file-store
fallback. `NormalAcpAndNativeHistory` mounts the existing ACP chat/composer and
native history side by side in the real WorkspaceShell; both retain the embedded
Design Core session shell. Catalog ports and ACP runtime are simulated. These
E-AI-085 source scenarios are unexecuted and visual-pending; they do not qualify
native live chat, provider execution, recovery or coexistence.

`Desktop/AI/Native conversation storage/NormalSessionsRemainDefault` and
`NativeHistoryEnabled` mount the production AI settings registration, native
setup owner and copied settings card/footer. `Loading`, `FailureAndRecovery`,
`UncertainChoice`, `UncertainCreation` and `Unavailable` cover a representative
skeleton, neutral unavailable states and explicit receipt-status recovery.
Catalog frames go through the production native adapter; no real repository or
provider is used. `Desktop/AI/Native conversation routes/NativeHistoryCatalog`
adds the real native-history view without an initial selection, in the existing
embedded Design Core AppShell. These E-AI-086 sources are unexecuted and
visual-pending; none qualifies live/native/restart or provider gates.

`Desktop/AI/Agent setup review/InlineTagsAndFollowUps` previews removable inline
agent, file-reference and resource-link chips in the embedded production chat
shell, with the optional automatic-agent-tag preference enabled in memory. The
existing native route story also reviews the compact source Command View and
centered timestamped system facts. UI review only; qualification deferred.

E-AI-089 runs focused light/desktop coverage for Agent setup review, Native
conversation routes and Native conversation storage. `NativeLiveComposer` mounts
the main native chat component and reviewed composer in the embedded shell with
an explicitly unconfigured synthetic launcher. It cannot launch a provider;
send/Stop/capture boundaries have separate orchestration and native tests. This
supplements the existing read-only stories without replacing them.

`Desktop/AI/Agent mention links/MarkdownBadges` reviews new Markdown links,
legacy SDK tokens, table previews, hover profiles and literal code examples in
the embedded production shell across Document/Classic. `ComposerSuggestions`
checks actual option hit targets and removable inline insertion after the shared
tooltip portal refresh. No provider is connected. E-AI-090 records focused
Chromium/WebKit and native observations; visual review remains pending.

E-AI-093 retires desktop native-store fixtures to the preserved checkpoint
`codex/desktop-jj-chat-checkpoint-20261020`. Their older inventory/evidence
above is historical. Current review stories are Local conversation storage
(grouped AI settings without native controls and guarded transcript
replacement), Local ACP conversations (embedded AppShell, agent tags, approvals
and Document/Classic), and Repository/Transcript history (portable paths and
diffs). Shared editable avatars, mention links, hover cards and follow-up
tagging retain their existing Agent setup review/Agent mention links stories.
Visual approval remains pending.

## Agent context and permissions (E-AI-094)

`Desktop/AI/Agent profiles/ContextAndPermissions` mounts the shared saved-agent
editor with Design Core MarkdownComposer fields, description/instructions and
advertised per-agent permission defaults. SavedAgents/NoSavedAgents retain the
fixed-width gallery and tinted Add agent icon.
`Desktop/AI/Local ACP conversations/PermissionsInFooter` reviews the icon-only
shield with Tooltip, approval rows, inheritance and conversation override in the
ordinary embedded shell. AgentSetupReview and TranscriptReview retain shared
Document/Classic composition. Deterministic modes are fixtures, not live
provider qualification. Copied/adapted paths are recorded in
docs/provenance.json; all changed stories remain visual-pending with no baseline
update.

`Desktop/AI/Agent setup review/TabAcceptsAgentSuggestion` accepts the selected
agent on Tab without dispatch. `InlineTagsAndFollowUps` checks chip margins,
Markdown file hover content and unframed picker search; `SavedAgents` checks
that the parent Agents title is not repeated by a Your agents heading. E-AI-094
owns focused evidence; shared Tab behavior is qualified in Design Core
separately.

## Model discovery lifetime (E-AI-095)

`Desktop/AI/Native Notes binding/LayoutKeepsModelDiscovery` uses the actual
Notes shell, AiPlugin/AiView and native service with a non-prompting fixture
transport. It counts service calls and probes while opening/closing the bottom
panel and retains the draft and view identity.
`Desktop/AI/Workspace lifecycle/LayoutDoesNotReloadModels` retains the same
invariant with AI in the right sidebar. Both remain visual-pending. Model-cache,
progress sharing, expiry, trust, invalidation and cleanup are checked at their
native-service boundary, separately from provider and release qualification.

E-REPO-055 adds `Repository blame wrapping/RightSidebar`: production blame in
the actual Notes right sidebar at 320/400/480px keeps its inset surface and
header action inside the host. Long source lines wrap internally or scroll
horizontally with wrapping off. Existing history, operation and backup settings
consumers retain their shell. Visual baselines remain pending.

E-AI-096 adds `AI/Conversation drafts`: separate text, attachments and pending
source comments in the production embedded session shell, Document/Classic
switching, plugin reopen over the retained Vault, empty new chats, first-send
identity adoption, acknowledged clearing, late-read fencing and save-failure
notifications. No prompt executes merely from reopening. All remain
visual-pending.

`Desktop/AI setup` uses the production Compute settings page with in-memory
native ports. Compute settings covers explicit model/resource/peer configuration
and Max VRAM; Loading uses skeletons; Setup failure asserts App notifications;
Running compute covers Stop. E-AI-108 moves providers to AI/Agent providers,
covering independent configurations, legacy settings and retained failed saves.
Source presentation is copied/adapted from JJ Store’s StoreComputeSettings,
StoreComputeModels, StoreComputePeers, StoreWorkField and environment key field.
Native/real-provider qualification is separate; all stories remain
visual-pending. E-AI-098 checks separate full-width provider/compute cards,
single titles and aligned table styling copied from the existing Agents page.

E-AI-099 expands `Desktop/AI setup` with Model picker, Model memory limits and
Unknown model fit. It copies JJ Store's production picker/catalog, tests
keyboard search/selection, exact custom IDs, draft memory caps, honest unknown
estimates, serving locks and no dispatch on selection. All stories remain
visual-pending.

E-AI-103 adapts ai-controller's offered-option approval policy into
Desktop-owned policy (no controller dependency). `AI/Action approvals` reviews a
separate footer picker in the embedded AppShell: Mode independence,
Document/Classic, automatic one-time permission response and failed-save
notification/draft retention. `AI/Agent profiles/Context and permissions` covers
the distinct Mode and Action approvals fields and saved override. Visual
approval remains pending.

E-AI-106: Local ACP conversations/Supported modes and pin covers the initially
closed list and its toggle across both transcript views. E-AI-112 keeps
pin/archive solely in the kebab menu, including their inverse actions.
Conversation actions moves to the far-right vertical header menu. Chat layout
review/Long messages with sidebars explicitly opens the inner list for its
wide-layout wrapping checks. The approval picker uses a filled 16px marker.

E-AI-107: AI/Models/Lapis agent picker uses synthetic native ports. E-AI-108
moves the required-model assertion into AI/Agent providers/Independent
providers, using the real agent editor and scoped synthetic settings. Native
credentials never enter the catalog. AI/Agent setup review covers shared header
avatars.

E-AI-109: AI/Settings/Grouped settings uses production responsive pill tabs for
Conversation, Models, Memory/handoff and Tools, including field reveal and
narrow overflow navigation. AI setup uses the same public component and icon
buttons; compute drafts survive tab changes. Existing settings, clients category
and local-conversation stories exercise their reachable panels. Visual pending.

E-AI-110: Desktop/AI setup/Memory quantity and file browse uses production
Compute and the public Design Core inputs, checking optional GB, invalid drafts
across tabs, chooser selection without commands and explicit import. Native
dialog and live inference qualification remain separate.

E-AI-112: Agent providers/Existing configuration omits the legacy editor while
named profiles stay editable. Provider save failure now exercises a named Lapis
profile and retains its draft, exact recovery control and App notification.

E-AI-113: `AI/Sent context` uses the production ACP runtime through a disposable
public-contract transport in the ordinary embedded chat AppShell. NewChat
reviews startup context, rendered/raw inspection and Classic retention;
AgentSwitch reviews the new binding's instructions and conversation handoff;
UnknownOutcome keeps uncertain delivery distinct from Sent. No provider is
contacted and no live settings or history are changed. The shared SentContext
component already carries its JJ Store source attribution.

Sent-context captures remain live-controller-owned and are not reconstructed
from current files/settings on a cold reopen. E-AI-113 retains that boundary.

AI change history: `catalog/plugins/ai/ChangeHistory.stories.ts` mounts the
production embedded `AiChatSession`/`AiTranscriptPanel` with Desktop-owned
services. CapturedChanges covers document/classic summaries, right body file
sidebar, main-body diff/preview, retained draft, plain surface and Git/JJ
controls (E-AI-116), and the icon-only header action/tooltip in both layouts
(E-AI-117). ViewNavigation opens/reuses the production AI conversations, Catalog
and Import views while preserving the draft; UnavailableViews disables missing
commands. The footer history shortcut is absent. LocalConversations follows the
same header navigation. UndoTurn covers guarded preview/confirmation;
CheckpointFailure covers retained prompt, notification and explicit bypass;
IncompleteTurn refuses unsafe undo. Adapted from jj-store
`web/src/lib/ui/store-agent-chat/StoreAgentChangesPanel.svelte` and
`web/src/lib/ui/store-agent-workspace/{StoreWorkspaceFiles,StoreWorkspaceInspector}.svelte`,
source parent `3998e2b0`, Apache-2.0. Visual approval remains pending.

## Markdown-first memory review

- `Desktop/AI/Settings/MarkdownMemory` uses production AI settings, folder input
  with a full-width row, automatic capture/recall defaults and note-opening
  actions.
- `Desktop/AI/Settings/ProcessorModels` selects independent memory/handoff
  models and switches the handoff agent without changing chat models.
- `Desktop/AI/Agent profiles/SavedAgents` switches the production Agents/Clients
  tabs; installed-client stories explicitly select Clients in both viewports.
- `Desktop/AI/Sent context/VaultMemory` uses the embedded workspace AppShell and
  production note store, recall service and Sent context in both chat layouts.
- Visual review is pending; no baselines changed.

## Progressive import browser design review

`Desktop/AI/Progressive imports` retains the E-AI-120 design scenarios; its
StreamingPreview now mounts the live importer. `Desktop/AI/Indexed imports`
exercises production progressive pause/resume and explicit Cursor/OpenCode save.
`Import review` and `Import layout review` exercise lazy folder selection,
read-only modes, deduplication, retry and failure toasts. Production and
fixtures use the ordinary embedded AppShell and public FileListing. Harness
folder children are indented. File timestamps use the public relative-time
formatter inside a noninteractive time element because the complete file row is
a button. Native qualification is recorded separately in E-AI-121; browser
fixtures do not qualify source compatibility or performance. Visual baselines
remain unapproved.

## Searchable model settings and processor restrictions

`Desktop/AI/Model settings search/SearchAllModelSettings` mounts production AI
Settings and the existing agent Command View control. It searches model IDs,
checks cancellation without saving, selects default/memory/handoff models and
checks independent saved values. Both processor agent rows explain the built-in
Lapis AI restriction for unattended work. Existing Settings scenarios retain
unavailable catalogs, saved preferences, failures and disposal; Agent profiles,
Agent providers and Setup cover the reused editor and compute pickers. Visual
baselines and native/provider qualification remain separate.
