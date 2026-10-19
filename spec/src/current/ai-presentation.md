# AI transcript delivery review

LD-AI-002/004 retain the existing AI controller, context, settings, requests,
history and runtime boundaries while adopting public Design Core presentation.
The 2026-10-18 delivery sequence prioritizes visible, functional slices:

1. NOTES-08A: review the actual AI components in Storybook, using shared
   Transcript, MarkdownComposer and TranscriptFooter. Document is the default;
   Classic uses the same items, composer and controller. The ordinary plugin
   uses this shared composition after the final UI corrections under the user's
   standing implementation approval (2026-10-18).
2. NOTES-08B: promote the approved composition into the review app and retain
   the per-vault presentation choice, existing conversations and scope controls.
3. NOTES-07L-FILES (Complete): E-AI-042 qualifies installed Codex, actual file
   context, cancellation and vault-file transcript saving. JJ persistence
   remains deferred by the user (2026-10-19).
4. NOTES-09-FILES-A (Complete): E-AI-042 proves cold saved History reopen with
   unchanged journals and no prompt replay. Fault-injected unknown-provider cold
   recovery remains deferred in NOTES-09-FILES.
5. NOTES-07K/07L/09: native JJ backend selection, listing/creation/pinned reads,
   AgentStore/ThreadStore capture and managed restart are deferred by the user.
   The unqualified renderer client draft is preserved in change lqqoypxx;
   ordinary UI adoption remains on parent 612ab0e0. Original JJ milestone gates
   remain pending; file-profile success does not complete them.

The opt-in `AiChatPanel.presentation` selects the shared transcript for review.
`initialTranscriptView` only chooses its initial document/classic presentation;
it grants no runtime, storage or native authority. The ordinary AiViewPanel
selects the shared transcript in NOTES-08B. Its vault-owned `transcriptView`
defaults to Document; explicit Classic selection persists through the existing
acknowledged plugin-settings writer. Legacy embeddings can still omit the
presentation prop. Catalog owns all synthetic data and runtime clients.

The document footer keeps a single compact row. Formatting expands rightward
using the jj-store strip (selected trigger, close, separator and actions), with
local horizontal overflow rather than a second footer row. The folder picker
uses inline layout without the legacy standalone top margin. Shared footer and
formatting fixes belong in Design Core and apply to the reference story too. The
application reserves its floating status-bar clearance outside the compact
footer; send and formatting controls remain above the overlay in all placements.
Conversation discovery stays in the transcript scroll region; it cannot consume
the fixed header or hide the composer in a short bottom panel.

Both transcript modes MUST retain controller identity, authored draft,
attachments, pending approvals/questions and disclosure state through switching.
IME switching MUST defer until composition ends. Display item/block identities
remain stable as content updates, and display revisions are never storage proof.
Anchored comments are included in NOTES-08A by the user's review correction.
NOTES-09-FILES-D1 gives live and durable event projections the same
application-owned creation identity before display. Binding namespaces are
idempotent. Native session/request/cursor, permission IDs and tool IDs are
unchanged; existing saved IDs/hashes remain readable without rewriting. Private
reasoning still stays outside durable capture. Exact live/restored message and
tool block identities are the prerequisite for local comment context recovery in
NOTES-09-FILES-D2; this does not enable JJ stores. Comments on messages/tool
results can accompany a prompt or be submitted alone. Code and GFM table cells
retain immutable cursor readers for exact text selection; their comment ranges
still refer to the original captured block. Table comments split the rendered
table after the referenced row. Queued context retains the complete original row
with the exact selected text highlighted, independently of later source changes.
Mira owns the immutable table surface; Design Core owns annotation/controller
composition. Fenced code uses the existing captured-code reader with syntax
highlighting, inline comments and Show more/Show less controls. A separate
reference story renders Design Core's recorded demo and synthetic discussions
through installed public exports outside the Notes adapter, for visual
comparison. Its copied fixture provenance remains catalog-owned; it is not
native conversation proof. Exact block identity, revision, UTF-16 range, quote
and authored comment travel as separate context; the authored message is never
rewritten. The shared TranscriptController owns drafts across document/classic
switching. Only an explicit successful host outcome marks a snapshot sent;
refused/unknown outcomes retain drafts and original submission identity without
replay. The first catalog profile uses its memory session host.
NOTES-09-FILES-D2 retains submitted local comment context before dispatch. Only
an explicit successful native turn and confirmed local acknowledgement notice
restore sent inline comments. Prepared or unknown context remains inspectable
without becoming queued work. Native local comments/restart and JJ
discussion-store gates remain distinct.

DISCUSS-01A adopts jj-store's explicit reply-context composition. The shared
reply control navigates to the final captured answer for its exact accepted
participant; multiple accepted recipients retain separate destinations. The
answer links back to its captured comments. Document and Classic reuse the
public controller's reader registrations, not private component selectors.
Missing parents, unrelated bindings and unacknowledged context retain Sent or
prepared state without a fabricated reply. Historical files are never
backfilled. DISCUSS-01B reuses Reply on the restored source thread. A new
comment keeps that thread’s original anchor, while Document/Classic share its
pending capture. Only the new authored comment is dispatched; earlier comments
keep their own reply controls. Native selection and cold-continuation evidence
stay separate from catalog fixtures. An unavailable reply or reader reports
through one stable App notification and preserves the authored draft without an
inline error.

Application context stays distinct from authored text. Existing tool result
registrations and authorized note links remain host-owned. Loading uses shared
skeletons; empty content uses shared Empty. Preview controls MUST NOT imply that
reactions, queues or native tools are enabled without host support.

The first live profile includes chat, supported model configuration, file
context, cancellation, saved history and restart. The live composition retains
agent/model transition labels, copy-response actions, retry controls, context
usage, scope, attachments and exact pending requests. Preference failure retains
the last saved value and reports through the existing App notification path.

Native application-tool reads and guarded edits retain M10.3. Current
lapis-agent model requests are non-streaming: activity follows actual events and
text appears as received. Incremental fake-client examples qualify rendering
only.

The current profile retains vault-file transcripts. Deferred JJ capture has one
native raw-event owner. Renderer projection cannot become a second writer.
Authored messages and application metadata use explicit native operations; saved
state requires confirmed publication. Legacy file conversations retain their
selected backend without silent migration/fallback. Native process/storage work
runs off the UI thread, with App-owned status progress and notifications.
Host-selected provider/model configuration resolves native credentials at
launch; new credential-management UI is deferred.

Each slice records focused source, interaction/accessibility and necessary
native evidence. Standing approval continues, with the 2026-10-19 user
correction prioritizing working Codex chat and local transcript files, qualified
in E-AI-042. JJ persistence stays deferred. Broad catalog, provider/platform,
release and visual-baseline checks stay deferred; original M13/M33 completion
gates are unchanged. One child task is Active at a time.
