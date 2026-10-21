# Desktop state review inventory

`Desktop/AI/Transcript review` previews Document by default and shared Classic,
long Markdown with a real table, tools/context, retained drafts, skeletal
loading, empty/interrupted content and pending permission/question controls.
Anchored comments contribute separate context, including comments-only turns.
Code and table cells expose immutable cursor readers for exact quote selection.
These are opt-in production components awaiting visual confirmation before live
adoption.

`Desktop/Repository working copy status` maps ready details/refresh/navigation,
loading, clean, binary-without-line-counts, unavailable/toast recovery and
settings/disable to the production plugin in Notes. The compact split status
buttons use subtle fills without a border. E-REPO-024 records focused catalog
checks; ordinary native status review and visual approval remain pending.

E-REPO-023 adopts reviewed blame layout, editor action, commit navigation and
log row surfaces into production. Earlier preview-only descriptions below record
their review origin; synthetic data/diff counts remain catalog-owned.

`Repository comparison/JJLogAndOpLogTabs` previews resting JJ Log and Op Log
rows matching the AppShell body, with distinct hover and selection styling. The
same preview applies to regular plugin tabs opened from the blame story.

`Repository blame layout review/StickyAttribution` reviews active attribution
under the header, incoming group replacement and horizontal pinning. The body
uses public shadcn ScrollArea with shared source/attribution scroll position, a
compact line-number gutter and no vertical attribution/source divider. Sticky
labels have no top border; horizontal dividers stay at source-group boundaries.
Several fixture commits load the real `dev@lapis.md` Gravatar image; remaining
sample authors exercise initials fallback.

Blame review stories start with left/right sidebars collapsed; the editor-action
example keeps file navigation available.

`Desktop/Repository blame layout review` previews a filename-only inner header,
source group separators and a bottom border under the final row. The vertical
divider ends with the content. `TitleBarAction` reviews the proposed
`git-merge-conflict` editor action/tab icon. `CommitDetails` shows a small title
hover/focus card with the first-line subject, author/avatar, time and sample
diff counts. E-REPO-023 adopts these presentations; stories now mount production
components. `LargeFile` uses real controller source with sample multi-author
history to review virtual scrolling and varied attribution groups.

`Desktop/Repository file history` reviews default right-sidebar registration, an
absent editor, active-file revisions, empty path history, busy/disabled refresh,
toast recovery, rename/deletion, opening the matching JJ Log revision and moving
the retained sidebar view into the main body through the shared tab menu.
`Desktop/Repository row selection` covers non-button row areas and independent
controls. Both use production components and remain visual-pending.

`Desktop/Repository file blame` covers the sidebar action opening recorded
source/attribution in the main pane, progressive ranges, origin navigation,
failure/toast recovery, loading skeleton/status and sidebar/editor header
alignment. File history also has dedicated Empty/icon scenes for no editor and
no matching revisions. Log, file list, diff, operation and conflict loading
states use representative production skeletons. Visual approval remains pending.

`Desktop/Background work` holds optional AI discovery and repository reads while
the real workspace remains interactive. It covers status progress, command
palette input during pending work, completion cleanup and parser failure toasts.

Use the Storybook sidebar names below to review production UI without starting
the native app. Every scene uses disposable state. Native effects and acceptance
remain separate; these browser examples do not qualify native IO or processes.

Add a row and the applicable normal, empty, loading, disabled, failure and
recovery scenarios whenever desktop-specific presentation changes. Use an
existing production surface and the smallest real shell it needs. A new backend
error that uses an existing visible state should identify that state instead of
creating a duplicate screen. Shared portable-plugin catalogs remain
source-owned.

| Owned surface            | Visible states                                                                                                                                                                                                       | Storybook destination                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vault launcher           | Existing/recent vault, first launch with empty recents, create, cancelled picker, pending selection, failed open/missing recent, return to vault                                                                     | Desktop/Vault launcher: OpenVault, EmptyRecents, CreateVault, CancelledPicker, OpeningVault, FailedOpen, RecentVault, MissingRecentVault, ReturnToVault       |
| Launcher overlays        | Recent search, no matching recents, appearance choices                                                                                                                                                               | Desktop/Vault launcher: RecentSearch, NoMatchingRecents, AppearanceSettings                                                                                   |
| Shell lifecycle          | Restoring the saved profile, unavailable physical vault, failed Close with retained session                                                                                                                          | Desktop/Shell lifecycle: RestoringProfile, MissingSavedVault, BlockedClose                                                                                    |
| Notes startup            | Opening storage, plugin loading with task progress, failed layout and every existing recovery action                                                                                                                 | Desktop/Startup and recovery: RestoringVault, LoadingNotes, FailedLayout                                                                                      |
| Safe Mode                | Optional plugins disabled, saved layout skipped, rebuild completion, failed restart                                                                                                                                  | Desktop/Startup and recovery: OptionalPluginsDisabled, SavedLayoutSkipped, FailedRecoveryAction                                                               |
| File conflict recovery   | Retained local draft and changed disk text, deleted file, unreadable disk, failed write, pending resolution, fresh snapshot, stale decision, leaving with controls disabled                                          | Desktop/File conflicts: ModifiedOnDisk, DeletedOnDisk, UnreadableDisk, FailedRecovery, RecoveryInProgress, FreshDiskSnapshot, StaleDecision, LeavingWorkspace |
| File conflict completion | Explicit Keep my version and Use disk version, complete acknowledged bytes, removed conflict                                                                                                                         | Desktop/File conflicts: KeepMyVersion, UseDiskVersion                                                                                                         |
| Ready Notes host         | Public workspace, source editing, full-pane Reading, owned teardown                                                                                                                                                  | Desktop/Notes workspace: EditNote, ReadingNote, ReadingNoteDark; theme/viewport qualification remains separate                                                |
| Global AI commands       | External command creation, revision and deletion; unreadable inventory with retained rows and recovery                                                                                                               | Desktop/AI/User commands: ExternalChanges, UnreadableRecovery; actual AI plugin/Catalog and a disposable named-IO port                                        |
| Bundled Terminal         | Normal/colored/high output, input/IME/paste/copy, resize/scroll, hidden/moved pane retention, independent tabs, exit, failure/retry, unavailable, restored Start, disabled/Safe Mode, installed precedence, settings | Desktop/Plugins/Terminal: all cases in `plugins/terminal/Terminal.stories.ts`; source/destination details in COVERAGE.md                                      |
| Bundled AI               | Chat/composer, context/skills/results, approvals/questions/tools, cancellation, errors/retry, models, settings, History/Catalog, JSONL, disabled/unavailable/initializing, lifetime and six placements               | Retained `plugins/ai` families; complete mapping in AI_MIGRATION.md and COVERAGE.md                                                                           |

The conflict examples use the real public text-conflict registry, persistence
and editing-owner lifecycle with an injected in-memory file service. They do not
claim native atomic publication. Unreadable and pending operations remain
visible for review; fixture cleanup releases work before closing its owned App.

Initial shell loading/failure is reviewed in `Desktop/Initial shell loading`.
The loading scenes retain the existing shared startup surface. Failed startup
and Safe Mode scenes run the actual NotesWorkspace. The shell failure scenes run
the actual Shell with injected failing native ports. No replacement screen or
production fixture is introduced.

Native traffic lights, dragging/focus, OS picker input, clipboard, default-app
opening, system trash and process cleanup retain their actual headed checks.
Their shared HTML hosts/clearance are present in shell examples; browser output
cannot reproduce native controls or supply their acceptance evidence.

`Desktop/AI/Native Notes binding` adds the actual Notes host and native factory
with disposable IO: an unavailable agent, disabled plugin, Safe Mode and revoked
workspace trust. Its command seeding and lazy admission are visible through the
retained Chat and Catalog; no replacement screen is introduced.
`Desktop/AI/Resource order` retains the same shell while verifying close/reload
drain before native release.

Ordinary Notes AI admission/recovery still retains M10.2's gate, and the two
former live-controller replacements remain native work. A catalog entry is not
an assertion that an unavailable native capability is enabled.

All new scenes remain visual-pending. No Visual Delta baseline is changed.

## Shell presentation follow-up

File conflicts now open the real Problems panel. `ProblemsList` keeps that
initial state visible; `ModifiedOnDisk` opens the shared three-way review.
Existing deletion, unreadable, failure, busy, stale-snapshot, leaving and
whole-version decision stories use the same production review. Terminal stories
start with both sidebars collapsed and contain no visible fixture telemetry.
Suites/native acceptance for these changes are deferred; visual-pending remains.

The conflict review centre is editable, with icon-only comparison settings and
an explicit Save merged version action. `EditedMergeResult` and
`MergeEditorSettings` cover the requested result/editing controls. Terminal's
resize fixture restores its original height. All AI fixture actions and JSON
observations remain outside product DOM through the owned review port. Automated
source/catalog and native acceptance remain deferred.

`Desktop/Repository history` adds the production repository plugin and Design
Core unified/split diff presentation. Its eighteen scenarios cover pinned and
historical selections, restored historical view state, multiple operation heads,
merge-parent choice, root and unchanged revisions, empty operation/revision
lists, preparation, unavailable binary content, read failures with notification
recovery and Safe Mode. The fixture reader grants no native authority; cold
actual WebView acceptance stays in M13.2. Source and destination details are in
`COVERAGE.md`.

NarrowPaneInWideShell additionally verifies that the history comparison adapts
to its own pane width within a wider browser, with reachable controls and
readable changed-file actions.

The AI transcript review additionally exposes `TableRowComments` and
`LongCodeBlock`. `Desktop/AI/Design Core reference` renders the shared recorded
Document/Classic demo inside the desktop AppShell, with a standalone comparison.
E-AI-041 adopts the UI under standing implementation approval. These remain
visual-pending; native-provider/restart acceptance stays separate.

`Desktop/AI/Shell/Transcript adoption` mounts the actual bundled AI plugin,
checks Document default, retained draft/editor while switching, saved Classic
after reopening and functional submission. A failed preference save shows an
App-owned toast and preserves the last saved value. Initialization shows the
representative transcript skeleton until the real controller can be used.

`Desktop/Repository working copy status/Workspace Footer` verifies full-width
footer geometry, left repository placement, fixed centre activity and shared
notification-panel opening through the real packed API/workspace shell.

Rounded native-window footer clearance is reviewed in Repository working copy
status: RoundedWindowSafeArea. Import layout review: XmlContextPreview and
XmlContextSaved exercise the public inert XML renderer before and after saving,
including Document/Classic presentation.

Chat layout review: LongMessagesWithSidebars combines long prose and a deep
captured read path with a long basename and a full-path tooltip. It checks both
views and sidebar toggling; wide layouts also retain the nested conversation
list.

AI folder discovery excludes `.git`/`.jj` via core `files.exclude`; the
shared-core story also updates the setting without changing stored bytes.
Workspace Settings List adds the visible core string-list control, saved custom
patterns, remove-all behavior and live refresh without the history plugin.
Compact Composer reviews both two-line presentations without a focus ring
(E-CATALOG-013).

Repository upstream status: IncomingAndOutgoing, AwaitingFirstFetch, NoUpstream,
ReadOnly, PendingFetch and Offline cover footer controls/counts and
notifications. HistoryStorage/External covers directory display/reveal;
Colocated hides that external row. Native graph counts and reveal admission have
separate focused service tests. Visual approval and real-provider OS flows
remain pending.

AI scroll recovery: DocumentRecovery and ClassicRecovery cover displaced,
at-bottom, held running and cancelled/idle states in long Notes transcripts.
Recorded transcripts opt into the same control without a running glyph.
PendingPermissionAcrossViews keeps the held request reachable through view
switches and completes it without another runtime session or prompt.

Blame wrapping: LongLines and RememberedPreference cover default-on wrapping,
unwrapped horizontal scrolling, narrow viewport remeasurement and remembered
on/off choices when reopening another blame pane (E-REPO-044).

`Desktop/File conflicts/RetainedMergeAfterReviewClose` uses the real tab close
control and Problems navigation to retain an edited merge across review closure,
then save its exact bytes and clear the diagnostic. It exercises the public
layout-only close policy; original editor and application guards remain active.

`Desktop/Repository blame wrapping/RightSidebar` retains the right surface
border and header actions at three sidebar widths, with long source lines in
both wrap modes (E-REPO-055).

`AI/Conversation drafts` covers conversation isolation, private durable restart
recovery, both transcript views, first publication, obsolete reads and a failed
save with retained input (E-AI-096).

`Desktop/AI setup` uses the production Compute page with in-memory native ports.
Providers and compute covers explicit model/resource/peer configuration; Loading
uses representative skeletons; Setup failure and Provider save failure assert
App notifications and retained drafts; Running compute covers Stop. Source
presentation is copied/adapted from JJ Store’s StoreComputeSettings,
StoreComputeModels, StoreComputePeers, StoreWorkField and environment key field.
Native/real-provider qualification is separate; all stories remain
visual-pending. E-AI-098 checks separate full-width provider/compute cards,
single titles and aligned table styling copied from the existing Agents page.

E-AI-099 expands `Desktop/AI setup` with Model picker, Model memory limits and
Unknown model fit. It copies JJ Store's production picker/catalog, tests
keyboard search/selection, exact custom IDs, draft memory caps, honest unknown
estimates, serving locks and no dispatch on selection. All stories remain
visual-pending.

E-AI-100 maps the footer Mode submenu and Pin/Unpin to
`Desktop/AI/Local ACP conversations/Supported modes and pin`, using the ordinary
embedded AppShell. It covers provider-advertised choices, current selection and
layout persistence; native client login/provider acceptance remains separate.

E-AI-102 maps `Desktop/AI/Queued messages/Single composer action` to the
embedded AppShell. Submission never exposes Stop beside a disabled Queue; typing
a ready follow-up selects Queue and clearing it restores Stop in Document and
Classic.

E-AI-103 maps `Desktop/AI/Action approvals` to the production embedded chat:
Separate from mode, Automatic approval, Save failure. The shared agent editor's
Mode and Action approvals controls are reviewed in Agent profiles/Context and
permissions. Default Ask, explicit overrides and global persistence retain
native scope; fixture turns never contact a provider.

E-AI-106: Local ACP conversations/Supported modes and pin reviews the collapsed
initial conversation list, header pin/archive controls and vertical action menu
in Document and Classic. Action approvals/Picker shows the larger filled marker.

E-AI-108: AI/Agent providers/Independent providers rejects an empty cloud model
and keeps compute selection independent. AI/Models/Lapis agent picker selects
the bundled harness and discovers its model alongside the three external
clients.

E-AI-108: AI/Agent providers covers per-agent provider settings, legacy editing
and failed-save retention. Compute has its own sidebar page with Max VRAM.
AI/Agent header/Participant avatars uses the production embedded session shell.

E-AI-109: AI/Settings/Grouped settings uses production responsive pill tabs for
Conversation, Models, Memory/handoff and Tools, including field reveal and
narrow overflow navigation. AI setup uses the same public component and icon
buttons; compute drafts survive tab changes. Existing settings, clients category
and local-conversation stories exercise their reachable panels. Visual pending.

AI/Compute tabs remain pinned above scrolling panels with opaque theme backgrounds;
panel descriptions replace duplicate headings. Compute panels own the final row edge.
