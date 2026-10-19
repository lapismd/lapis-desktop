# Local AI turn recovery

Native tool uncertainty retains the original pending turn and authored-message
parent anchor through live/durable projection. Tool drain precedes terminal
acknowledgement. Exact replies may reconcile; callbacks are never replayed.

LD-AI-001/002/004 require a durable authored-message checkpoint before the
provider can observe a prompt, and honest recovery when its outcome is unknown.
E-AI-043 advances NOTES-09-FILES-B under the existing implementation approval.
JJ-backed persistence remains deferred.

NOTES-09-FILES-D1/D2 retain stable live/durable block identities and explicitly
submitted comment context under LD-AI-002/004. User messages may carry optional
`contextBlocks` containing only bounded `transcript-comments` captures; file,
recall and handoff snapshots remain transient. A comments-only message keeps
empty authored text, with a valid nonempty comment capture. Existing schema
versions, message IDs and hashes remain readable without rewriting old entries.
Captures retain exact submission/comment/block/revision identities, UTF-16
ranges, quotes and table context, bounded to 64 KiB, 16 groups and 64 comments
per group. Invalid captures refuse persistence and dispatch.

After a confirmed successful turn, the host appends an immutable existing
`system.notice` record with ID `comment-context-sent:<user-entry-id>`, its exact
`parentId`, and fixed acknowledgement text. It is a local receipt, not a grant
or a repository publication. Projection suppresses this bookkeeping notice and
marks only that parent's comment context sent. Cancellation, unknown execution,
write failure or mere checkpointing cannot create it. Cold reads restore sent
inline comments only from these notices; unconfirmed captures remain prepared
evidence and never enable replay. Handoff includes captured authored comments as
distinct evidence; quoted material cannot become instructions.

E-AI-044 advances NOTES-09-FILES-C under LD-AI-001/002: ordinary streamed
responses must retain complete ordered output through the existing bounded ACP
client. Shared client fixes belong in Lapis AI and use built public exports.
Queued, individually consumed snapshots may share a bounded acknowledgement;
count/byte limits, scope/cursor checks, detach and unknown outcomes remain
exact. The renderer cannot claim completion after lost coverage or replay a
prompt. The focused native target saves all 500 synthetic response lines with
the original authored prompt once, without a pending intent or error record.

Notes schedules pending text/thinking presentation every 32ms, flushing earlier
at 32 events or 16,384 UTF-16 code units. Larger fragments render directly
without truncation. Capture still processes every event in order. Visible
control boundaries flush first; cancellation and close flush before fencing
their session. Retired views drop only pending presentation. Terminal
checkpoints keep the complete received trace independently of repaint cadence;
pending timers are released on teardown.

The local file profile adds optional `pendingTurn` metadata, version 1,
containing only a stable application turn ID, original user-entry ID, tentative
binding ID and start time. It grants no provider resume, executable or
native-store capability. Existing metadata versions and transcript records
remain readable; old files without the optional field retain their behavior.

The owning repository queue serializes turn preparation with other metadata
writes. It persists the exact user message and then the intent before dispatch.
A failed or unknown write cannot authorize a prompt. A prior intent cannot be
silently replaced, and another view's active turn cannot be displaced. No raw
attachment, reasoning, credential or provider prompt is added to the intent.

A confirmed terminal outcome clears only its original intent after transcript
checkpoint acknowledgement. Unknown transport/provider outcomes retain it.
Unconfirmed binding/configuration changes do not become accepted merely because
the stream ends. Authored message IDs stay stable across preparation, terminal
checkpointing and teardown; completed messages are not duplicated.

Owner approval/question responses retain their own stable journal identities.
They must not inherit the runtime request's replay identity: deduplication of a
replayed request cannot discard a later owner decision.

Cold conversation restore reads the intent without writing or starting/resuming
a conversational provider session. Non-prompting model discovery stays separate.
The original authored text remains visible with an unknown-outcome explanation
and no Retry action. A new explicitly authored message may acknowledge the exact
recovered intent, retaining an immutable unknown-outcome record before preparing
its own intent. It never replays the original prompt. Stale terminal callbacks
cannot settle a newer turn.

The initial authority is one owned Notes App, with its existing single native
main-window admission. Multi-process and cross-version concurrent writers are
not qualified. The normal preview and ignored development data remain preserved;
native fault acceptance uses isolated test state. Focused service/controller,
reader/format, UI and cold native evidence remain distinct from wider provider,
platform, JJ-store and distribution gates.
