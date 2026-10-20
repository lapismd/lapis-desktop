# Local ACP conversation storage

The 2026-10-20 user-approved simplification makes local ACP and vault-file
conversation storage the sole active desktop profile. The optional native
AgentStore/ThreadStore experiment is Deferred and preserved at bookmark
`codex/desktop-jj-chat-checkpoint-20261020`; E-AI-092 records its baseline,
dependencies, gaps and reopening instructions. Native objects, journals,
receipts and backend-selection data are retained without export or migration.

LD-AI-002/004 retain existing chat, tools, approvals, cancellation, context,
queues, memory, skills and local restart recovery. Saved profiles/avatars,
Markdown and legacy agent mentions, follow-up tagging and shared
Document/Classic presentation remain active. Runtime admission, privacy and
credentials remain native-owned. Removing native conversation storage does not
remove repository history or source imports/capture readers.

LD-REPO-003's original native-store gate is deferred, not completed. Existing
local conversations keep their metadata.yaml, agents.jsonl and transcript.jsonl
files under each scope's .lapis/agents/sessions/UUIDv4 directory. LD-REPO-005
includes these portable files in normal checkpoints; other private .lapis data
stays excluded. Explicit backup exclusions win. Search, restore and configured
sync use the same bounded path policy. Repository file pickers remain governed
by independent discovery exclusions. Existing chats enter the next capture.

Restore and sync replacements protect conversation file writers, refuse active
or unsettled turns, drain pending saves and reload idle conversation state.
Writer registrations apply only during restore/sync replacements; ordinary ACP
cancellation and App teardown retain their existing lifetime protocol. Recovered
pending intent stays interrupted/unknown; restoring files never runs or replays
a prompt. Old native-only tabs redirect to local History with one informational
notice, without treating native IDs as local file identities. No native metadata
is opened for ordinary chat startup.

## Conversation drafts

LD-AI-002 draft state MUST be keyed by vault, normalized scope and conversation
ID, shared by Document and Classic. A new chat starts empty. Unassigned drafts
use the persisted workspace leaf identity and scope until their first published
conversation receives an ID; adopting that ID retains the current draft until
acknowledgement. Switching conversations saves the previous draft and loads only
the selected conversation. A late read or Send acknowledgement cannot replace
another conversation's draft or newer edits.

Draft text, inline references, file attachments and unsent comment context MUST
survive a normal app restart. Store them in private `.lapis/agents/drafts`
files, independently of model defaults, portable transcripts and runtime state.
Draft writes are debounced, serialized and drained before vault release. They
remain excluded from Repository History, search and synchronization by the
existing private-data policy. Loading a draft never starts a run or replays a
prompt. Sent, queued or uncertain submissions are not restored as draft
comments. Storage errors retain in-memory edits and use one application
notification; unreadable saved data MUST NOT be overwritten by a fallback empty
draft.
