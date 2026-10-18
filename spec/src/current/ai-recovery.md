# Local AI turn recovery

LD-AI-001/002/004 require a durable authored-message checkpoint before the
provider can observe a prompt, and honest recovery when its outcome is unknown.
E-AI-043 advances NOTES-09-FILES-B under the existing implementation approval.
JJ-backed persistence remains deferred.

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
