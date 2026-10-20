# Local Codex conversations

The preview can run an installed Codex ACP adapter through a verified Lapis AI
runtime. Conversations use the existing vault-owned `.lapis/agents/sessions`
files as their sole conversation persistence. Repository History includes
metadata.yaml, agents.jsonl and transcript.jsonl at each root/nested UUIDv4
session scope by default. Existing chats enter the next normal checkpoint;
earlier versions cannot be reconstructed. Other private .lapis contents stay
excluded, and explicit backup exclusions win. No forge account is needed for
local capture; configured remote backup/sync includes the same portable files.

Restoring or pulling transcript replacements fences new sends, drains saved work
and refuses active/unsettled turns. Idle chats and indexes reload after
application. Restored pending messages remain unknown/interrupted and never
execute automatically. Ordinary file/folder-picker exclusions are separate.

The native AgentStore/ThreadStore experiment is Deferred at
`codex/desktop-jj-chat-checkpoint-20261020`; its objects, journals, receipts and
selection records are retained in place without migration or automatic export.
Agent profiles/avatars, Markdown and legacy mentions, profile hover cards,
automatic follow-up tags and Document/Classic views remain available.

Comments on a recorded answer, code, table or tool result can accompany a
message or be sent on their own. New completed Codex answers retain their exact
authored-message parent. Once that comment turn is acknowledged locally, use the
comment's reply control to open the answer, including after reopening History.
The answer also links back to its feedback. Multiple addressed agents keep
separate reply destinations. Use Reply on an existing inline comment to add
further feedback in the same thread. Sending includes only the new comments;
prior feedback keeps its original reply controls and source context. Older
captures without an exact parent keep their existing Sent state; reopening does
not rewrite them or send anything.

The application ships verified Lapis ACP, agent, tool and compute helpers.
Development uses `pnpm ai:prepare` to build and stage them; `pnpm dev` verifies
the staged bundle before opening the app. To stage an already verified bundle,
use `pnpm ai:prepare -- --bundle /absolute/path/to/bundle`. Installed apps read
helpers from their own resources and do not require a source checkout.

Open Settings → AI → Installed clients to list detected adapters/CLI versions,
refresh availability, and explicitly install or update Codex in the private
device tooling directory. The flow and version pins are adapted from jj-store.
Node.js 22+ and npm must be available on the device; authentication remains
Codex's normal native login and is separate from installation. Other clients
keep explicit setup/admission boundaries. No global tools are replaced.

Existing device `ai-runtime.json` configurations remain supported in
`~/Library/Application Support/com.lapismd.lapis-desktop.preview` on macOS.
`version` remains 1; `bundle` and `path` are optional explicit overrides. A
selected managed client takes precedence over legacy executable paths. Missing
directories and verification failures identify the path and repair action.
Remove transient checkout references when moving development workspaces. Keep
credentials out of this file. Preparation and hashing run on blocking workers;
discovery and installation report through the App status API.

Open a trusted vault, enable AI, select Codex and choose a model advertised by
the agent. Codex must confirm its advertised user-approval (`read-only`) mode
before a prompt; full-access mode is never selected. Document and Classic show
the same saved conversation. File context is attached through existing
application controls; it stays separate from the authored message. Attach up to
eight files, at most 64 KiB each and 128 KiB total; missing or oversized context
refuses dispatch. File snapshots are transient context; the existing transcript
format retains messages and responses. Stop cancels the current turn. Reopen
saved conversations from AI History. The authored prompt and a local turn intent
are saved before dispatch. After an interruption, History shows that exact
prompt with an unknown-outcome explanation and no Retry action. Reopening is
read-only; send a new message to continue without replaying the original. Select
text in a response, code block or table cell to add a comment. Send it with a
message or on its own. The exact comment, quote and table row are saved before
dispatch; confirmed turns retain an acknowledgement for History to restore
inline feedback. Unconfirmed captures remain prepared context and are never
automatically resent. File snapshots remain transient. Provider-session resume
remains a separate capability.

Codex can use the enabled Notes application tools through the authenticated
native MCP bridge. Reads use the existing registry and vault scope. Edits show
the existing App approval with their exact file changes before execution; Codex
may also ask for its own permission first. Messages, completed tool calls and
approval decisions stay in local transcripts. Stop preserves an unapproved file;
if provider or callback completion cannot be confirmed, History retains an
unknown outcome without replay. The registry, explicit write approvals and
guarded Vault APIs remain the policy boundary. JJ persistence stays deferred.

The host chooses the current admitted vault root, executable and environment.
The renderer cannot override them. Codex retains its native HOME authentication;
the runtime receives only explicit launch variables. Disabling AI or leaving the
vault drains transcript writes and releases its native workers.

Type `@` in the message composer to choose an agent or attach a file. An agent
selection appears as a removable recipient pill; selecting it sends nothing.
Send saves its exact setup tag separately from your message. Document and
Classic retain that selection, and History shows the original captured label
even when the agent is no longer configured. The first native profile offers
Codex. Named participants that share a runtime keep distinct bindings; switching
back resumes only their own eligible context. The original captured name remains
visible in saved History. Use Conversation actions → Add agent participant to
create another name using the selected installed agent. Creating a name starts
no session and sends nothing. Up to sixteen names can be configured.

Select two to four recipient pills to deliver one authored message to each
participant. Delivery runs one participant at a time, with separate approvals
and saved Pending, Working and Completed outcomes. Stop leaves a started
recipient unknown and cancels recipients that have not started. A refusal or
uncertain outcome stops the remaining deliveries. History retains each outcome
without retrying any delivery. While an agent is working, keep typing in
Document or Classic and choose Queue message. Up to sixteen follow-ups are saved
locally, then sent in order after the current turn finishes. Queued messages
retain their recipients, model and thinking preferences; file attachments are
read when the message is dispatched. Cancel a queued message without
interrupting the active turn. Stop pauses the queue as well as cancelling active
work. Reopening History sends nothing: use Resume queue to send only follow-ups
that never started. Uncertain deliveries remain recorded and are never retried.
Queue capacity or save failures retain your draft. Saving a queue never stores
credentials or executable commands.

The private migration app consumes the shared conversation token codec through
`@lapismd/jj-conversations`' verified built exports, alongside the history SDK.
Its source checkout is an explicit development prerequisite until portable
package intake is qualified; no source aliases or package publication are used.

The [AI contract](../spec/src/current/ai.md) owns requirements and remaining
native acceptance gates;
[conversation persistence](ai-conversation-persistence.md) describes the storage
injection seam and [turn recovery](../spec/src/current/ai-recovery.md) describes
the local checkpoint boundary.

The opt-in native recovery check uses isolated test data with the installed
Codex and its existing authentication. Build the e2e app, then pass the path to
the device runtime configuration:

```sh
pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json
LAPIS_AI_TEST_RUNTIME_CONFIG=/absolute/path/to/ai-runtime.json node --test tests/desktop/ai-local-recovery.test.mjs
```

Use `tests/desktop/ai-local-tools.test.mjs` with the same configuration for the
real Codex read → approved edit → cancel → cold History acceptance. It uses an
isolated plain vault and checks that it never creates `.jj` metadata.
`tests/desktop/ai-local-multi.test.mjs` checks two named Codex participants, one
authored prompt, two registered reads and read-only cold History. Wider
provider, effect-fault, platform and distribution qualification remains open.

## Local session import preview

Use **Open Import AI sessions** from the command palette to browse recent
supported Codex CLI and Desktop sessions in the device’s `.codex/sessions`
folder. Supported Codex CLI 0.156.1 includes sessions launched by Lapis ACP;
newer Desktop alpha formats remain excluded. Select a session to preview it in
Document or Classic view, then choose **Import snapshot** to save it under the
current vault’s local AI history. Import requires no configured agent or model.
It does not resume a session or restore permissions. Saved snapshots are
read-only; use a new chat to continue.

Repeating an exact snapshot reopens its existing local copy. Changed snapshots
save separately. An actively changing, incomplete, oversized or unsupported
source cannot be imported; select a completed session or refresh and retry.
Native workers apply the shared privacy policy before any content enters the
renderer. Tool output without a proven terminal outcome displays as unknown. The
initial catalog is bounded to 256 recent qualified sessions from a bounded
metadata scan; archived roots and automatic capture are separate later slices.

Review `Desktop/AI/Import review` in Storybook for the production presentation,
saving, duplicate imports and interrupted-save recovery. Catalog sources are
fixtures. Native acquisition and cold local-file acceptance are recorded in
E-AI-055. JJ persistence remains deferred.
