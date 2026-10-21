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

New composer mentions serialize as named Markdown links to `lapis://agent:HEX`,
using the canonical codec's UTF-8 setup-ID bytes without its closing delimiter.
Explicit selection and automatic follow-ups use the same Markdown link. Saved
recipient metadata retains the canonical SDK token. Document, Classic and
Markdown previews adapt JJ Store's mention-link renderer into an inline
avatar/name badge with the shared hover profile. Missing profiles retain the
authored link label. Existing bare `agent:HEX;` and `jj-store-agent:HEX;` tokens
also render as profile chips; captured message bytes, revisions, hashes and
comment offsets are never migrated. Code examples remain literal.

Automatic agent mentions default to false, including normalized legacy settings.
The picker returns the authored agent link while selecting the recipient without
dispatch; the namespace regression and settings-payload regression MUST retain
these existing expectations alongside the dedicated link-codec coverage.

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

The existing Agents settings category lists saved profiles in a jj-store-derived
agent gallery. Add/Edit shares the composer’s editor and public AvatarPicker;
removal requires confirmation and updates only profile settings, preserving
saved conversations, attribution, active dispatch captures and queued values.
Removed recipient IDs cannot silently fall back to a different target. The
picker links to this settings section when registered; profile management works
without an active chat or starting a provider. Settings teardown disposes its
subscription and refuses later saves/model discovery.

Named agents can be added from the searchable Agents picker in the composer
footer or from Conversation actions. The picker copies/adapts jj-store's agent
and repository selectors, retaining public Design Core Popover, Command View,
Avatar and buttons. Add/Edit uses its inset DialogFrame editor, client icons and
searchable model/custom-ID control, adapted to Desktop-owned settings and
bounded model and execution-mode discovery. Unsupported provider and secrets
controls are omitted. Closing the editor starts no provider. Late model replies
cannot replace another client’s choices. Both it and @ selection use the same
removable recipient state through Document/Classic changes. Selecting or saving
does not prompt.

The bounded vault setting retains ID, label, client kind, optional model/effort
defaults, an optional avatar image and its background colour. The editor MUST
use the public Design Core AvatarPicker for image upload/URL, emoji, background
and removal. Raster uploads are bounded at 1 MiB; settings accept bounded image
data URLs or credential-free HTTP(S) URLs and hex colours. Picker/@ rows,
recipient chips and bound assistant authors use these display values; missing or
failed images retain the shared Avatar name fallback. Images grant no file,
execution or provider authority and are not duplicated into saved recipient
identities. Old entries inherit chat defaults. Client selection grants no
executable, credential, tool or native admission authority; unsupported targets
and configuration retain their ordinary native refusals. Each explicit Send
freezes the selected agent's model/effort, independently for multiple
recipients. Queue captures retain each target’s model and effort; older queue
entries use the original shared effort. Later profile edits cannot rewrite a
queued request. Failed saves retain all draft fields and existing settings,
reporting one application notification. The initial default client is retained
when adding the first named profile for a different client.

E-AI-072 is an unqualified UI review slice. Verification is parked at the user's
request; native storage/admission and full restart gates remain open.

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

## Saved agent context and permissions

E-AI-094 adds an optional short description (280 Unicode code points), agent
instructions (32 KiB UTF-8) and provider-defined execution-mode default.
Existing profiles remain readable. Instructions are user-authored session
context, kept separate from the authored message and supplied on the first
explicit prompt; opening, editing or discovering a profile never prompts. A live
session retains its original instructions when its profile changes. A new
session captures the latest profile. Description remains visible in profile
presentation.

The footer Conversation actions menu in both layouts owns a Mode submenu and
Pin/Unpin Chat. Mode shows the effective selection and offers only negotiated
choices, plus Use agent default. Pin no longer occupies a separate footer
button. The menu remains available before a conversation has been saved; pinning
requires a saved conversation. Mode selects a conversation-local mode for the
selected participant, inheriting its saved agent default and then the existing
reviewed provider default. Overrides persist with local conversation metadata
and remain scoped to the participant; clearing restores inheritance.
Multiple-recipient sends resolve each participant independently. Mode choices
come from negotiated ACP mode configuration, never guessed universal modes.
Unavailable saved choices stay visible but cannot silently fall back. Native
configuration acknowledgement and mode readiness precede any prompt. Provider
modes do not alter AppToolHost approvals, workspace trust or native admission.

Queued messages capture instructions and mode along with model/effort; later
profile changes cannot rewrite them. Context and modes are bounded on load as
well as save. Cold reopen restores choices without execution or prompt replay.
Imported snapshots carry no permission overrides. Failures retain drafts and use
the App notification service. M10.2 remains In progress; native provider
qualification is separate from deterministic renderer and Storybook evidence.

## Composer presentation

E-AI-094 removes the redundant gallery heading under Agents. The footer people
picker uses one unframed search row, composing the public Command View token.
Inline agent, person and resource chips retain vertical separation across
wrapped lines. File chips use Design Core Hover Card and the public app-bound
Markdown FileEmbed for read-only previews; resolution/navigation remain
Desktop-owned, internal app paths remain unavailable and missing files retain
their label. Suggestions accept the selected item on Enter or Tab through the
shared Markdown composer; acceptance only edits the draft and never dispatches a
message.
