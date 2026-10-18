# AI transcript delivery review

LD-AI-002/004 retain the existing AI controller, context, settings, requests,
history and runtime boundaries while adopting public Design Core presentation.
The 2026-10-18 delivery sequence prioritizes visible, functional slices:

1. NOTES-08A: review the actual AI components in Storybook, using shared
   Transcript, MarkdownComposer and TranscriptFooter. Document is the default;
   Classic uses the same items, composer and controller. The ordinary plugin
   keeps its existing presentation until the user confirms the review.
2. NOTES-08B: promote the approved composition into the review app and retain
   the per-vault presentation choice, existing conversations and scope controls.
3. NOTES-07K: connect explicit JJ backend selection, confirmed conversation
   listing/creation/reads and retained transcript continuation to the renderer.
4. NOTES-07L: admit bundled lapis-agent through explicitly selected Lapis AI
   configuration and native secret references; run chat with file context and
   native-owned sanitized AgentStore/ThreadStore persistence.
5. NOTES-09: demonstrate a real conversation, cancellation and cold restart
   recovery without automatically replaying an uncertain prompt.

The opt-in `AiChatPanel.presentation` selects the shared transcript for review.
`initialTranscriptView` only chooses its initial document/classic presentation;
it grants no runtime, storage or native authority. The normal plugin does not
set either prop in NOTES-08A. Catalog owns all synthetic data and runtime
clients.

The document footer keeps a single compact row. Formatting expands rightward
using the jj-store strip (selected trigger, close, separator and actions), with
local horizontal overflow rather than a second footer row. The folder picker
uses inline layout without the legacy standalone top margin. Shared footer and
formatting fixes belong in Design Core and apply to the reference story too.

Both transcript modes MUST retain controller identity, authored draft,
attachments, pending approvals/questions and disclosure state through switching.
IME switching MUST defer until composition ends. Display item/block identities
remain stable as content updates, and display revisions are never storage proof.
Anchored comments are included in NOTES-08A by the user's review correction.
Comments on messages/tool results can accompany a prompt or be submitted alone.
Code and GFM table cells retain immutable cursor readers for exact text
selection; their comment ranges still refer to the original captured block.
Table comments split the rendered table after the referenced row. Queued context
retains the complete original row with the exact selected text highlighted,
independently of later source changes. Mira owns the immutable table surface;
Design Core owns annotation/controller composition. Fenced code uses the
existing captured-code reader with syntax highlighting, inline comments and Show
more/Show less controls. A separate reference story renders Design Core's
recorded demo and synthetic discussions through installed public exports outside
the Notes adapter, for visual comparison. Its copied fixture provenance remains
catalog-owned; it is not native conversation proof. Exact block identity,
revision, UTF-16 range, quote and authored comment travel as separate context;
the authored message is never rewritten. The shared TranscriptController owns
drafts across document/classic switching. Only an explicit successful host
outcome marks a snapshot sent; refused/unknown outcomes retain drafts and
original submission identity without replay. The first catalog profile uses its
memory session host; durable native comment publication and restart remain part
of NOTES-07L/09, not a completed discussion-store gate.

Application context stays distinct from authored text. Existing tool result
registrations and authorized note links remain host-owned. Loading uses shared
skeletons; empty content uses shared Empty. Preview controls MUST NOT imply that
reactions, queues or native tools are enabled without host support.

The first live profile includes chat, supported model configuration, file
context, cancellation, saved history and restart. Native application-tool reads
and guarded edits retain M10.3. Current lapis-agent model requests are
non-streaming: activity follows actual events and text appears as received.
Incremental fake-client examples qualify rendering only.

JJ capture has one native raw-event owner. Renderer projection cannot become a
second writer. Authored messages and application metadata use explicit native
operations; saved state requires confirmed publication. Legacy file
conversations retain their selected backend without silent migration/fallback.
Native process/storage work runs off the UI thread, with App-owned status
progress and notifications. Host-selected provider/model configuration resolves
native credentials at launch; new credential-management UI is deferred.

Each slice records focused source, interaction/accessibility and necessary
native evidence. UI approval is required before NOTES-08B. Broad catalog,
provider/platform, release and visual-baseline checks stay deferred; original
M13/M33 completion gates are unchanged. One child task is Active at a time.
