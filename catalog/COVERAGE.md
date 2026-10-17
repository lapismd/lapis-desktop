# Desktop catalog coverage

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
following production chat stories do not yet qualify the bundled plugin, six
workspace placements, History/Catalog, Settings or native ACP/tool behavior.

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
