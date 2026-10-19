# Local Codex conversations

The preview can run an installed Codex ACP adapter through a verified Lapis AI
runtime. Conversations use the existing vault-owned `.lapis/agents/sessions`
files. This profile does not publish transcripts through JJ, create
AgentStore/ThreadStore records or migrate existing conversations.

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

Install the official `@agentclientprotocol/codex-acp` adapter from npm in a
device-owned location, and authenticate Codex using its normal native login.
Keep credentials out of the vault and runtime configuration.

Create `ai-runtime.json` in the preview application's native data directory
(`~/Library/Application Support/com.lapismd.lapis-desktop.preview` on macOS):

```json
{
  "version": 1,
  "bundle": "/absolute/path/to/verified/lapis-ai-bundle",
  "path": ["/absolute/path/to/adapter/node_modules/.bin", "/usr/bin", "/bin"]
}
```

The bundle must have its verified `runtime-manifest.toml` and matching platform
helpers. PATH directories must exist, be absolute, include `codex-acp`, and
include any interpreter required by the adapter. Up to eight entries are
accepted. The configuration is limited to 16 KiB; symlinks and additional fields
are refused. Restart after changing it. Without configuration, AI remains
unavailable. Preparation and bundle hashing run on a blocking worker; model
discovery reports progress through the App status API.

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
