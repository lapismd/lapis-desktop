# Local Codex conversations

The preview can run an installed Codex ACP adapter through a verified Lapis AI
runtime. Conversations use the existing vault-owned `.lapis/agents/sessions`
files. This profile does not publish transcripts through JJ, create
AgentStore/ThreadStore records or migrate existing conversations.

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
saved conversations from AI History. An interrupted or uncertain turn is
retained without automatic prompt replay. Provider-session resume and the native
application-tool bridge remain separate capabilities.

The host chooses the current admitted vault root, executable and environment.
The renderer cannot override them. Codex retains its native HOME authentication;
the runtime receives only explicit launch variables. Disabling AI or leaving the
vault drains transcript writes and releases its native workers.

The [AI contract](../spec/src/current/ai.md) owns requirements and remaining
native acceptance gates;
[conversation persistence](ai-conversation-persistence.md) describes the storage
injection seam.
