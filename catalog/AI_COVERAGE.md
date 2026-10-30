# AI story source coverage

This inventory records source-family provenance and destination stories. It does
not own implementation status;
[AI qualification](../spec/src/backlog/ai-qualification.md) retains
native/provider gaps. Matching names alone cannot prove equal coverage.

Compared sources:

- `lapis-plugins` `ee20d366`, `stories/plugins/ai`: 56 scenario exports.
- `lapis-notes-desktop-migration` `77ae5c13`, `stories/plugins/ai`: 49 exports.
  Its 20 Chat, 18 placement, nine Shell and two Live Host exports are all named
  in the maintained plugin families. The comparison also checks their plays;
  equal names alone do not establish equal coverage.

## Retained application scenarios

| Source family/cases                                                    | Desktop destination                                       | Evidence or remaining work                                                                         |
| ---------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Chat: SendAndComplete, AutomaticMemoryRecall, OpenCodeHarnessChoices   | `plugins/ai/Conversation.stories.ts`                      | E-AI-013; ACP replaces deferred Native choices                                                     |
| Chat: SkillsAndSlash, SearchToolHits, ValidationAndEmptyState          | `plugins/ai/CommandsAndResults.stories.ts`                | E-AI-013                                                                                           |
| Chat: PermissionRequested, PermissionAccepted, QuestionAsked           | `plugins/ai/TurnRequests.stories.ts`                      | E-AI-013                                                                                           |
| Chat: QuestionAnswered, ToolRunning, SuccessfulToolCall                | `plugins/ai/ToolActivity.stories.ts`                      | E-AI-013                                                                                           |
| Chat: AppToolReadTranscript, AppToolPatchApproval, AppToolSessionGrant | `plugins/ai/AppToolActivity.stories.ts`                   | E-AI-013; native IPC remains M10.3                                                                 |
| Chat: AppToolHostUpgradeRequired, FailedToolCall, FileMentions         | `plugins/ai/ErrorsAndMentions.stories.ts`                 | E-AI-013                                                                                           |
| Chat: AgentTrace, FailedMessageAndRetry, ScrollRecovery                | `plugins/ai/TraceAndScrolling.stories.ts`                 | E-AI-013                                                                                           |
| Chat: HarnessModelRefresh, SettingsHarnessModelRefresh                 | `plugins/ai/Models.stories.ts`                            | E-AI-013                                                                                           |
| Chat, History, Catalog: six placements each                            | `plugins/ai/placements/{Chat,History,Catalog}.stories.ts` | E-AI-016; all 18 retain geometry, paint, behavior and public examples                              |
| Shell: JsonlPreview                                                    | `plugins/ai/Jsonl.stories.ts`                             | E-AI-017; original association/timeline/read-only assertions plus refresh and lifetime regressions |

The browser mapping now covers 54 of the 56 named source cases. New desktop
admission, error, Settings, maintenance and lifetime regressions are additional
evidence; their passing counts do not replace retained source scenarios.

## Retained shell compositions and native replacements

| Source case                         | Desktop destination / qualification                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell.Desktop                       | `shell/Desktop.stories.ts`: full shell, Explorer/ribbon, collapsed Search, one main Chat, stacking/clearance, typography and durable Settings                     |
| Shell.CommunityToolOptIn            | `shell/CommunityToolOptIn.stories.ts`: real Settings defaults, tool names, explicit opt-in and durable tool list                                                  |
| Shell.Mobile                        | `shell/Mobile.stories.ts`: narrow-shell navigation and stronger plugin-source open-tabs interaction                                                               |
| Shell.ImmediateInitializingComposer | `shell/ImmediateInitializingComposer.stories.ts`: preparation, disabled actions and same composer after readiness; minimal isolated case also retained            |
| Shell.LocalConversations            | `shell/LocalConversations.stories.ts`: menu geometry/typography, History, archive/restore/delete, Notes creation scope, main-leaf reuse and retained sidebar Chat |
| Shell.AgentSwitching                | `shell/AgentSwitching.stories.ts`: offline attribution, full/delta handoffs, audits, usage and authored/context separation                                        |
| Shell.Recovery                      | `shell/Recovery.stories.ts`: durable content, interrupted append, host failure, enabled retry and explicit unavailable-resume diagnostics                         |
| Shell.FollowScope                   | `shell/FollowScope.stories.ts`: near/remote discovery, vault scope, Explorer synchronization and pin/unpin follow                                                 |
| Registry.ChatWithToolActivity       | `shell/Compositions.stories.ts`: actual main Chat, collapsed left sidebar, tool trace/result and assistant response                                               |
| Registry.Overview                   | `shell/Compositions.stories.ts`: simultaneous production Chat, History and Catalog                                                                                |
| Registry.History                    | `placements/History.stories.ts`, RightSidebar: strict superset of original ready-shell/panel-existence checks, plus content, geometry, paint and interaction      |
| Registry.Catalog                    | `placements/Catalog.stories.ts`, RightSidebar: strict superset of original ready-shell/panel-existence checks, plus inventory, geometry, paint and interaction    |
| LiveHost.ManualAttach               | Pending native admitted ACP chat/cancel/approval/read/edit acceptance; no browser controller connector                                                            |
| LiveHost.ReloadResume               | Pending native detach/reconnect, durable recovery, no uncertain replay, isolation and cleanup                                                                     |

E-AI-018 records shell/Notes qualification separately from native acceptance.
Public Docs render the actual WorkspaceShell and derive source examples from the
same seeds/layouts. Only catalog clients inject fake ACP; compositions start no
workers. Original >500px panel and viewport checks remain enforced.

LocalConversations explicitly starts Chat in the sidebar, matching its retained
sidebar-preservation assertions. The former source fixture placed it in main;
correct propagation of followed conversation identity now binds that leaf, so
creating another conversation must preserve it. The sidebar fixture retains the
original one-then-two main-leaf counts and matching-conversation reuse. The
separate WorkspaceLifecycle case also proves unbound-main reuse directly.

Registry composition checks do not authorize marketing-media generation,
publication or baseline updates. All migrated surfaces remain visual-pending.

## Notes/source differences

The maintained plugin adds three Chat model/harness cases missing from Notes;
all three are retained in desktop. Search naming follows the source-owned
accessible filename/path contract. Notes's Catalog play adds real source-command
navigation and explicit expand/collapse checks. Desktop retains both skill-file
and command-file navigation plus explicit expand/collapse assertions in panel
and all six placement cases. The newer Notes shell stores settings under
`.lapis`, while the older plugin fixture still reads `.obsidian`; desktop keeps
the application-wide `.lapis` contract and compatible AI plugin data.

The Notes Mobile play omits tab-sheet interaction that remains in the plugin
source. Its LocalConversations play also differs in selected creation scope and
visible labels. Desktop retains the stronger mobile play and Notes-scoped
creation; both source comparisons remain explicit.

The legacy Chat.Layout panel branch and JSONL renderer are retired in
AI-JSONL-UI. All direct-panel cases use the shared Transcript; explicit Classic
fixtures keep Classic coverage while ordinary plugin/file defaults remain
Document. JSONL files use the nested session frame without navigation or a
composer. Agent event records retain their own schema projection. The old
ImportSources table has no callers and is removed. Shared approval/question,
attachment/configuration, scope and history controls remain active.
