# Native backend profiles

**Deferred desktop experiment.** This guide describes the implementation
preserved at `codex/desktop-jj-chat-checkpoint-20261020`, not the active desktop
build. E-AI-092 records its source/dependency identities and original open
gates. Existing native data is retained without export or migration. Active
desktop chat uses [local ACP and vault files](local-ai.md).

`ai::backend::BackendProfiles` is Notes' native persistence-selection service.
Construct it with an installation-owned profile `Dir` and a callback that reads
the current native `VaultLease`. The callback owns window/origin admission; the
service rechecks the captured generation, profile and physical root around IO.
Opaque hashes bind private state to the physical vault without recording paths.

`read()` returns the explicit `vault-files` or `jj` selection and bounded
revision. A fresh vault retains legacy compatibility without writing a marker.
`select(request, expected_revision, backend)` verifies the current selection
before publishing an atomic synced private record. JJ selection checks existing
source witnesses but does not initialize metadata or snapshot working files.
Request IDs bind the original choice and precondition. `status(request)` retains
the original receipt after later selections. Missing status remains unknown.

A synced preparation record precedes selection publication; selection and all
original receipts share one atomic state. Missing, mismatched, malformed,
oversized or substituted state refuses opening another writer. An interrupted
selection cannot be reclaimed or silently retried. Query its original receipt;
do not replace an unknown request identity. Private state uses owner-only modes,
bounded no-follow IO and an exclusive OS lease. Up to 256 original choices are
retained without eviction; exhausting the bound requires explicit maintenance.

`open_scope()` pins the selected backend and JJ source. The owner retains its
exclusive lease. Use `begin()` before admitted work and retain its `BackendCall`
through completion; `check()` reauthorizes before exposing results. The native
metadata path is available only through that admitted call. Changed JJ witnesses
refuse use without switching to another backend. Explicit native disable fences
old generations; fresh admission may reopen the saved choice.

Calling `drain()` immediately fences new calls, including when its returned wait
is never polled or is abandoned. It waits for admitted calls to drop. The owner
and its remaining calls retain the lease, so selection stays blocked until all
owners drop. Closing cannot turn an uncertain mutation into permission to replay
it. Hosts must coordinate this owner with runtime revocation, the private
capture journal and pending native commands; admission callbacks should avoid
ownership cycles with a host that retains the owner.

The final logical lease explicitly unlocks its file. An incidental kernel
descriptor duplicate during concurrent process launch cannot extend native
ownership after the service's owners and calls have dropped.

The ordinary native host now consumes this service through the command below.
Renderer conversation wiring remains pending; this does not expose a selectable
JJ writer in app settings, admit an agent or replace legacy conversations.
Cold-process tests qualify private selection/lease recovery. Actual managed
callbacks, packaged-app chat/restart and additional platform qualification keep
their separate M13.3 gates.

## Native command

The local main window first admits its vault through `desktop_ai_admit`. The
`desktop_ai_backends` command accepts one bounded JSON text argument, `request`:

```ts
const reply = JSON.parse(
  await invoke<string>("desktop_ai_backends", {
    request: JSON.stringify({
      version: 1,
      sessionId: vault.sessionId,
      operation: { type: "read" },
    }),
  }),
);
```

Replies retain `version: 1` and a tagged `data` value. Operations are `read`,
`select`, `status`, `open` and `close`. Select takes `requestId`,
`expectedRevision` and `backend`; status takes the original `requestId`. Open
also takes a stable request ID. IDs use the owned 32-hex-character RequestId
format. Close takes the native `handle` returned by open. Receipt data retains
the shared DTO's `request_id`, `expected_revision` and `selection` fields.

An absent status means unknown. A lost open reply is recovered by repeating its
original request; another opener cannot silently take over an active owner.
Wrong versions, unknown fields, stale vault sessions and renderer path, cache,
window, origin or generation overrides fail before filesystem work. Responses
contain no device paths or native source fingerprints.

## Host lifetime

One native transition serializes selection, ownership, AI admission and release.
Blocking profile work retains that transition after its IPC caller disappears;
original request status remains the recovery authority. Replacement and disable
fence the backend, revoke native workers, then drain calls and release the
owner. Failed or cancelled cleanup keeps the fenced owner and remains retryable.

Reload suspends renderer AI authority while retaining the selected scope and
worker ownership. Verified same-generation admission allows one new opener to
reattach with a fresh handle. Delayed closes with the previous handle cannot
close the reattached owner. A physical admission failure or destroyed window
fences immediately and schedules cleanup for its exact native generation.
Destruction is terminal for the native main-window owner; delayed admission
frames cannot restore its authority. Delayed older-generation cleanup cannot
revoke a replacement. Database blockers are checked before vault-close fencing,
under the existing history/database transition guard.

Cold hidden-WebView checks exercise the actual command with isolated profiles
and Git-backed JJ sources. This proves transport and owner lifetime, separately
from live processor construction, renderer TranscriptStore adoption, one managed
conversation and its packaged-app restart acceptance. Ordinary execution targets
remain empty and the missing capture backend still refuses processor creation.

## Native capture permits

The host's `register_processing` requires active main-window admission, an
explicit backend choice and its current opened owner. The resulting permit
retains a counted backend call for the exact native worker, open request,
target, caller and generation. Keep it inside the processor until supervised
worker teardown. The Lapis AI processing hook checks this binding and the
backend's physical/JJ witnesses before and after callbacks. Missing permits,
changed fields and closing owners fail closed. The registry holds only weak
references, so dropping a permit cannot leave an orphaned lease.

The retained native admission owns a physical directory witness. Capture may
continue while its renderer is suspended, after that renderer's old vault token
closes, and through a verified same-root pending re-admission. Renderer commands
and new factories remain denied until active admission; a new factory also needs
the renderer's reattached backend owner. Non-preserving replacement, disable,
physical failure and native-window destruction revoke old authority.

The ordinary factory now requires an explicitly prepared, confirmed conversation
and composes its actual selected-store processor. Missing preparation or privacy
still refuses construction. Targets remain empty; preparation grants no prompt
or executable. Managed dispatch and packaged conversation restart remain
separate.

## Preparing a JJ conversation

An explicitly selected/opened JJ owner accepts two additional operations on
`desktop_ai_backends`:

```ts
{
  type: "prepareConversation", handle, requestId, title;
}
{
  type: "conversationStatus", handle, requestId;
}
```

Retain the original request ID and title. Preparation creates native
conversation and thread identities, plus a private actor when needed. The actor
and exact preparation stay under the private backend profile; no
`lapis/actor-v1` is written into the vault. The native service selects only the
shared Git Agent/Thread participants, and publishes the conversation through
ThreadStore without snapshotting code. No executable, session, prompt or capture
processor is started.

Replies use `{ type: "conversation", data }`. Missing data means no retained
preparation is known. Present data contains `requestId`, `conversationId`,
`threadId`, optional `repository` and optional `receipt`. A null receipt is an
unknown outcome, never permission to send or create another conversation. The
receipt is canonical JSON **text** so full-width native integers survive the
outer renderer transport. Its actor, intent, repository and result are checked
against the retained original command before confirmation.

The private schema-1 record is bounded to 16 KiB. It binds the exact source,
backend revision and actor; publication follows its atomic synced preparation.
Retrying an existing request only reads its original provider receipt. A lost
local confirmation can be repaired from that receipt; missing receipts retain
the unknown preparation without another execution. Changed titles, receipts,
actors, source witnesses, backend choices and stale owner handles cannot claim
the original result. Reading an absent status creates neither an actor nor
companion metadata.

The library entrypoints are `ai::conversations::prepare` and `status`, each
consuming a counted `BackendCall`. Calls serialize per owner, and the native
adapter retains its transition through blocking work if the IPC wait disappears.
Close drains these calls before releasing the backend. This prepares a durable
conversation; renderer transcript adoption and managed capture/restart remain
separate M13.3 work.

## Preparing native capture

After confirmed conversation preparation, the same current JJ owner accepts:

```ts
const operation = {
  type: "prepareCapture",
  handle,
  requestId,
  conversationRequestId,
};
```

The reply is
`{ type: "capture", data: { requestId, conversationRequestId, targetId } }`.
`targetId` is an opaque native UUID for capture preparation, not an executable
or persisted agent identity. Exact retries within that owner return the same
target; another intent cannot claim its request. An owner keeps at most 64 plans
without retaining idle counted calls. A new owner after cold restart creates a
fresh target from the original confirmed conversation.

The ordinary Rust factory rechecks original private preparation, source, actor,
current admission and exact native worker binding. It constructs the selected
Agent/Thread participants, real transcript policy and exclusive private journal.
Sanitized candidates and original provider receipts precede emitted frames.
Native home/temporary roots and an owner-private scanner cache stay outside
renderer control; cached policies remain scoped to each workspace and native
credential set. An existing processor may survive verified renderer suspension;
new construction still requires reattachment. Closure fences callbacks and
drains their ownership before releasing the backend.

`ai::conversations::PreparedConversation` is the native library entrypoint.
Loading a proof retains no counted call while idle. Processor construction
requires a fresh admitted call, the exact binding, native privacy and an
admission callback. Native executable/credential policy, ordinary runtime
dispatch, renderer transcript adoption and managed chat/restart are later gates.

## Reading a confirmed conversation

Use the original conversation preparation request and current native handle:

```ts
const operation = { type: "readConversation", handle, requestId };
```

The reply is `{ type: "conversationView", data }`. Null data means no retained
preparation exists. Present data is schema-version-1 JSON **text** containing
the original confirmed conversation, native thread, optional metadata, current
human-message revisions and active linked sessions with completed normalized
transcript chunks. Unfinished streamed output remains capture evidence; live
delivery and recovery projection need their own integration. Keep the text
intact or decode it with a lossless integer codec; ordinary `JSON.parse` rounds
sufficiently large native integers. Chunk `text` contains the exact UTF-8
sanitized payload, including its original JSON when the media type is JSON.

Reads verify the original provider receipt and require matching Agent/Thread
publication selections. They neither publish nor repair private confirmation
records. Unknown receipts, substituted preparations, stale handles and changed
source/admission fail. Missing preparation creates no actor or companion.

This bounded snapshot admits at most 64 human messages (256 KiB of bodies), 16
linked sessions and 64 streams. It returns at most 32 chunks per stream within a
shared 256 KiB payload budget and 2 MiB encoded view. A non-null
`next_after_sequence` explicitly identifies an incomplete transcript range;
stream metadata retains its native totals. Overflow or an unreadable stream
fails instead of yielding an empty or supposedly complete conversation. A
retained continuation read can fetch the remaining pages. Renderer transcript
projection remains integration work.

The native library entrypoint is `ai::conversations::read`, consuming a counted
`BackendCall` through result encoding. It retains no idle read owner and grants
no executable, prompt, authoring or capture authority.

## Continuing an immutable conversation read

Use `openConversationRead` with the current backend `handle` and original
preparation `requestId`. Its `conversationRead` reply is either null (no
retained preparation) or `{ handle, snapshot }`. The new handle owns this read
only; `snapshot` is the same bounded native JSON text, with an opaque `cursor`
on each incomplete transcript. Retain the original backend handle separately.

For each incomplete stream, send `readConversationTranscript` with the backend
`handle`, new `readHandle`, that stream's `cursor` and `afterSequence`. Encode
the exact returned next sequence as canonical decimal **text**, never a rounded
JavaScript number. The `transcriptRange` reply contains version-1 JSON text with
the original publication `selection`, conversation request, session, requested
sequence and the bounded transcript range. Continue only from its returned next
sequence; null means this original stream has ended. Unknown/unissued cursors,
foreign read handles, substituted sources and malformed sequence text fail.
Repeated page reads return the same immutable data after later capture advances.

At most eight reads can remain open per backend owner; each page retains the
32-chunk/256 KiB payload and 2 MiB encoded bounds. Close with
`closeConversationRead`, supplying the backend `handle` and `readHandle`.
Repeated close is harmless. Backend closure, replacement and verified renderer
reattachment discard read handles; reopen after restart and obtain fresh
cursors. No read is silently evicted. Idle reads retain audited immutable Agent
objects, without holding a counted backend call or writer lease. Every page
obtains a fresh admitted call and rechecks the exact original private
intent/provider receipt before reading. These handles grant no prompt or
publication authority.

Rust hosts can use `ai::conversations::open_read` and `ReadPin::transcript`
under the same ownership rules. The Tauri adapter supplies the bounded handle
registry. A cursor is a read capability within its current admitted owner, not a
durable conversation or agent identity. Native range proof and cold
handle-lifetime proof remain distinct from renderer adoption and managed
conversation restart.
