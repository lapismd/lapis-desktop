# Addressed local messages

AGENT-01 adopts jj-store's participant addressing for LD-AI-002/004 while
retaining local transcript files. Its first delivery slice, AGENT-01A, adds
explicit recipient selection and saved tags. Independent participants and
multiple-recipient execution are governed by AGENT-01B; AGENT-01C governs
persisted queues. A single-recipient implementation cannot claim those gates.

The application reuses `@lapismd/jj-conversations`' public built agent-token
codec. A saved recipient keeps its exact installation setup ID, canonical token
and captured display label. Display names, public keys, process generations and
native binding IDs are separate identities. Tags confer no executable,
credential, file, tool or resume authority. Native admission still resolves the
separately selected runtime target.

The @ picker distinguishes agent choices from file attachments. Selecting an
agent creates a removable addressed-agent pill without sending, switching a
provider session or rewriting the authored message. Document and Classic retain
the same recipient selection. The first native profile offers its configured
Codex agent; hosts can inject their admitted catalog for other profiles.

Explicit Send snapshots the selected recipients before asynchronous work. The
exact recipient metadata and authored message are saved before dispatch under
the existing local turn intent. Failed or unknown preparation retains the draft,
recipient and attachments and cannot prompt. An unresolvable recipient refuses;
there is no implicit fallback to the selected agent. AGENT-01A initially refused
multiple recipients; AGENT-01B2 governs their explicit dispatch below.

Saved transcript messages may carry optional `recipients`; old files without the
field remain readable and are never rewritten. The bounded field contains
distinct IDs, matching canonical tokens and one-line labels. Unknown saved
recipients remain visible attribution and never create an executable binding.
Cold History restores those tags without dispatch or implicit provider resume.
Message text, comment anchors and hashes retain their original content.

Source-derived recipient pills reuse Design Core Button and Avatar. Operational
selection/send failures use existing App-owned notifications and retain draft
context. Fixture stories prove selection, removal, view switching and saved
projection separately from actual native delivery and cold local persistence.

## Independent logical participants

AGENT-01B1 binds an explicit single recipient to a logical participant
independently of runtime and provider-session identity. A new binding captures
the exact validated recipient ID/token/label as optional `participant`. Two
participants using the same Codex target receive separate bindings and verified
context cursors. Switching back may resume only that participant's eligible
binding and receives the existing bounded verified delta. A saved label never
selects a runtime, executable, tools, permissions or credentials.

Binding matching uses the participant's stable ID; equal display names do not
merge identities. Unaddressed messages target the ordinary selected
runtime/agent identity and do not implicitly address the last named participant.
Legacy bindings retain their original agent identity; saved user-message tags
are never used to reattribute old output. The original captured participant
label remains visible in Document, Classic and handoff context after restart,
even when the current catalog no longer contains that setup. Display-only
restore retains the existing no-dispatch/no-replay policy.

Working status remains owned by the new turn while the previous participant
session detaches; old session closure cannot clear the new turn's busy state.

This sub-slice alone does not enable multiple-recipient delivery or queues.
AGENT-01B2 below adds per-recipient outcomes without duplicating the authored
message or repeatedly calling submit; AGENT-01C adds persisted queues.

## One message with multiple deliveries

AGENT-01B2 captures two to four distinct recipients on one explicit Send. The
host snapshots and resolves every recipient against its current admitted catalog
before creating the authored message; saved tags cannot supply executable
routes. The local dispatch journal claims one exclusive parent intent, saves the
exact user message once, and records a distinct delivery identity for every
recipient. Each delivery records pending, started and its own terminal outcome.
A started checkpoint precedes the native prompt. Provider/tool execution retains
the existing per-binding admission, approvals, context preparation and effect
drain.

Deliveries run sequentially, preserving the normal approval surface. A completed
recipient does not authorize repeating its message. A rejected or uncertain turn
stops remaining deliveries; cancellation marks only undispatched recipients as
cancelled and retains uncertainty for a started turn. Failed journal publication
cannot silently prompt or advance another recipient. Unknown outcomes never
become successful, and incomplete outcomes remain independently visible beside
the original recipient labels in Document and Classic.

Cold History restores the one authored message, exact recipient identities and
per-recipient outcomes without dispatch, retry or provider resume. Interrupted
started deliveries display unknown; pending deliveries display not sent. A new
explicit authored message can acknowledge the retained parent and continue, but
cannot replay its old deliveries. Another mounted owner cannot steal a live
parent or prepare an ordinary single turn concurrently. Terminal outcome records
remain in the transcript after the active parent metadata is cleared.

This is immediate explicit addressed delivery. AGENT-01C below governs sending
another message while a turn is busy and persisted bounded queues. Automatic
restart replay and JJ-backed transcript persistence remain unavailable.

Named participants can be added from Conversation actions using the currently
selected admitted agent. The bounded vault setting retains only ID, label and
agent kind; executable routes, credentials and tools are rejected. Creating or
selecting a participant does not create a conversation or prompt. Failed saves
retain the name and existing settings and report one application notification.

Native approval and question IDs are scoped to their originating logical
binding. Reused IDs cannot select or update another participant's request; UI
responses retain the exact visible item identity and stale actions refuse.

## Persisted follow-up queues

AGENT-01C keeps Document and Classic composers editable during active work.
Nonempty drafts use Queue message; empty drafts retain Stop. Explicit queuing
saves one exact authored message, captured recipient IDs/labels, model/thinking
preferences and bounded attachment paths in optional version-one local queue
metadata before clearing the draft. Credentials, executable routes, native
bindings and raw file snapshots are never saved in a queue. Comment captures
retain their existing validated bounds. Attached files are read at dispatch.

A conversation admits at most sixteen pending messages and 128 KiB of encoded
queue data. Each message retains at most four recipients and eight file paths.
Live queues dispatch FIFO only after the preceding turn's durable completion.
Each item crosses the existing dispatch and started-before-prompt barriers; its
authored message enters the transcript once. Current host routing and native
admission are checked again for every recipient. Missing or changed participant
routes refuse instead of falling back. Application commands cannot be queued.
Per-recipient outcomes remain independent.

Cancel queued message settles only an unstarted item and retains its capture.
Stop pauses the queue and retains uncertainty for started delivery. Failure,
unknown completion, vault/view replacement or closure cannot advance queued
work. Cold restore reads queued captures and outcomes without writing, starting
or resuming a provider. Repeated recovery projection retains one stable notice
per interrupted turn. Resume queue is an explicit action: it acknowledges
retained uncertainty, resolves current admitted targets and sends only
still-unstarted items; it cannot retry a previously started item. Separate live
owners cannot claim or bypass each other's queue. Lost metadata acknowledgements
cannot overwrite immutable terminal queue receipts. JJ persistence remains
deferred.
