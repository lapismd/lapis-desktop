# Desktop catalog coverage

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

| Source surface                     | Destination                    | Assertions                                                                                        |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Production `VaultLauncher.svelte`  | `plugins/Launcher.stories.ts`  | Open, recoverable failure, return to existing vault, light/dark, narrow/desktop                   |
| Production `NotesWorkspace.svelte` | `plugins/Workspace.stories.ts` | Real App boot, in-memory database/vault, note editing, owned teardown, light/dark, narrow/desktop |

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
