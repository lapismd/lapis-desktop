# AI story migration coverage

This source-family inventory does not own milestone completion. M10.2 remains
open in the canonical task ledger until native acceptance and every applicable
retained scenario pass. Do not retire source registrations yet.

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

These are 42 of the 56 named source cases. New desktop admission, error,
Settings, maintenance and lifetime regressions are additional evidence; their
passing counts do not replace any source scenario below.

## Remaining unique shell and native scenarios

| Source case                         | Required retained behavior / next destination                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell.Desktop                       | Full shell, Explorer/ribbon, retained collapsed Search, one main Chat, composer stacking/message clearance, typography and controlled Settings persistence |
| Shell.CommunityToolOptIn            | Real Settings defaults, named first-party/community tools, explicit opt-in and durable tool list without obsolete owner settings                           |
| Shell.Mobile                        | Applicable narrow-shell navigation and open-tabs interaction; retain the stronger plugin-source play when comparing the older Notes copy                   |
| Shell.ImmediateInitializingComposer | Preparing status, disabled input/model action, and the same composer becoming ready after delayed preparation; unmount-only coverage is insufficient       |
| Shell.LocalConversations            | Menu reachability/typography, History reveal, archive/restore/delete, selected creation scope, main-leaf reuse and retained sidebar Chat                   |
| Shell.AgentSwitching                | Offline Codex/Cursor/Codex attribution, full/delta handoffs, configuration audit records, context usage and no injected context in authored messages       |
| Shell.Recovery                      | Durable content before resume, interrupted append, visible host failure, enabled retry and explicit unavailable-resume diagnostics                         |
| Shell.FollowScope                   | Near/remote folder discovery, vault scope selection, Explorer synchronization and pin/unpin follow behavior                                                |
| LiveHost.ManualAttach               | Replace controller attachment with native admitted ACP chat/cancel/approval/read/edit acceptance, not a browser service connector                          |
| LiveHost.ReloadResume               | Native detach/reconnect, durable recovery, no uncertain replay, isolation and process cleanup                                                              |
| Registry.ChatWithToolActivity       | Full main Chat trace, tool result and assistant response with collapsed left sidebar                                                                       |
| Registry.Overview                   | Simultaneous Chat, History and Catalog through the actual plugin and shell                                                                                 |
| Registry.History                    | Source-specific History shell composition and retained visible seeded content                                                                              |
| Registry.Catalog                    | Source-specific Catalog shell composition and retained visible inventory                                                                                   |

Registry composition checks do not authorize marketing-media generation,
publication or baseline updates. All migrated surfaces remain visual-pending.

## Notes/source differences

The maintained plugin adds three Chat model/harness cases missing from Notes;
all three are retained in desktop. Search naming follows the source-owned
accessible filename/path contract. Notes's Catalog play adds real source-command
navigation and explicit expand/collapse checks. Desktop currently retains
skill-file navigation and the visible expand control; those extra command and
expand/collapse assertions remain pending beyond the 14 named cases above. The
newer Notes shell stores settings under `.lapis`, while the older plugin fixture
still reads `.obsidian`; desktop keeps the application-wide `.lapis` contract
and compatible AI plugin data.

The Notes Mobile play omits tab-sheet interaction that remains in the plugin
source. Its LocalConversations play also differs in selected creation scope and
visible labels. Keep these differences explicit during the remaining shell
migration instead of treating either complete file as the only source.
