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
   ordinary UI adoption is qualified separately in E-AI-058. Original JJ
   milestone gates remain pending; file-profile success does not complete them.

The shared Transcript is the sole panel renderer. `initialTranscriptView` only
chooses its initial document/classic presentation; it grants no runtime, storage
or native authority. The ordinary AiViewPanel selects the shared transcript in
NOTES-08B. Its vault-owned `transcriptView` defaults to Document; explicit
Classic selection persists through the existing acknowledged plugin-settings
writer. All panel embeddings use the shared Transcript; the superseded chat
timeline and composer are retired. Catalog owns all synthetic data and runtime
clients.

The document footer keeps a single compact row. Formatting expands rightward
using the jj-store strip (selected trigger, close, separator and actions), with
local horizontal overflow rather than a second footer row. The folder picker
uses inline layout without the legacy standalone top margin. Shared footer and
formatting fixes belong in Design Core and apply to the reference story too. The
application reserves its floating status-bar clearance outside the compact
footer; send and formatting controls remain above the overlay in all placements.
Conversation discovery uses the nested shell list; its compact presentation
keeps the selected conversation and new-chat composer reachable in a short
panel.

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

The current profile retains vault-file transcripts.
[Explicit imports](ai-imports.md) add read-only local snapshots with injected
catalog clients before native source adoption. Deferred JJ capture retains one
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

## Session inbox layout

The user approved live adoption and resumed tests on 2026-10-19. AI-SESSION-UI
copies and adapts JJ Store's application-specific session inbox for explicit
import and captured local history. An application-owned nested AppShell keeps
the outer Notes workspace intact. A compact searchable, grouped session list,
bounded pointer/keyboard divider and selected-session header surround the
existing read-only transcript; Document/Classic retain their current behavior.
Selected rows remain full-width buttons, with readable title, source profile and
relative time. Loading uses matching row/transcript Skeletons and empty content
uses Empty. Narrow layouts switch between list and selected session. Source
profiles (Codex CLI/Desktop) live in the copied filter popover, not individual
tabs. The aligned footer bars use a compact status-bar layout with inline
icon/text segments and subtle dividers. The captured-version picker is an
interactive footer status control; the body header retains only the
transcript-mode action. The ordinary plugin uses this same production
composition. Captured file reads pass their retained filename to the shared
syntax reader; unknown paths stay plain. Diff fences use the shared patch
reader. These are display projections only and never read files or rewrite
captured content.

The general-chat layout review reuses the same inbox AppShell, conversation
rows, header icon toggle and aligned compact footer. The ordinary AiView
supplies the production transcript frame; catalog fixtures mount the same
components. The frame composes the existing transcript, composer and footer
controls, with local conversation selection through the existing
controller/repository. Each chat row shows its truncated vault-relative
launch-note path (or scope folder) beneath the title, retaining the complete
path on hover. The shell background covers the view's bottom padding. Context
usage moves from the composer body into the footer as a ring with a shared
shadcn tooltip showing the percentage and exact used/limit token counts,
available on keyboard focus. It never adds a second transcript writer or native
dispatch path. The initial single-agent label is represented by the frame
header; later multi-agent transitions retain their transcript labels. Source and
consumer tests qualify the resumed live adoption.

The keyboard-send hint occupies a fixed body row immediately above the footer.
Interrupted turns render once inline as a shared tinted warning, with a red
circular warning icon and an icon-only Retry action at the far right. Retry has
a shadcn tooltip and retains the existing explicit prompt eligibility. The fixed
hint section omits an interruption already shown inline; unrelated composer-only
availability feedback remains beside the composer. The 32px footer contains
actions only, keeping the hint, status and send controls visible without overlap
in either view. The sending-error story injects one pre-dispatch runtime failure
and uses the existing error/retry/draft paths; retry stays explicit.
Slash-command suggestions put the command on the first row and a wrapping
description beneath it, through the shared Design Core composer. The Classic
composer is pinned above that row for short and long histories; Document keeps
its inline writing area. The same editor stays mounted across view changes,
retaining draft, selection, pending comments and queued context.

The same inbox frame opens app tool details in the public AppShell surface
layer, covering the main body while retaining the underlying conversation and
composer. Escape/Close restore the opener. The copied JJ Store tool panel uses
public Transcript readers and one output-view control; it never nests a second
ToolCallDetail toolbar. Captured Markdown file reads open as Preview, with
Source showing the exact Markdown and Capture showing the original tool
request/response. These are distinct views of retained data; no current vault
read or tool execution occurs. Registered result views retain ownership. The
row's raw action and inspector share the controller's captured-payload state.
For reads, a separate chevron reveals the captured source inline using the
shared syntax reader and its Show more/less controls; the title independently
opens the inspector. Both readers retain the same exact block identity and
comment ranges. The overlay spans the full main-body bounds, with a full-width
16px vertical/32px horizontal inset and the tool icon before its title. The
keyboard-hint row omits its top separator. Conversation History subtrees retain
a visible gap between adjacent rows. The ordinary plugin retains this
presentation.

Import selection still previews without writing. Only explicit Import saves, and
incomplete captures remain distinguished from complete versions. Version
selection cannot launch or resume an agent. Notes retains source ports, local
custody, notification/status services and teardown. No placeholder watcher
controls or provider actions are added. Provenance records the copied source
paths/revision; shared Design Core foundations and the transcript are reused.
The approved shells are production-owned. Saved imports are grouped by their
existing vault scope, source profile and opaque source-session identity; only
the selected immutable version is read. Listing, selection and refresh use the
existing repository, with stale-response fences, App status/notifications and
owned teardown. Incomplete versions never expose a writable chat or partial
transcript. Selection remains read-only and updates the owning view location.
Automatic capture coordination and JJ persistence remain deferred; the saved
version browser does not silently enable either. E-AI-058 qualifies
AI-SESSION-UI for the reviewed local-file profile through source and consumer
acceptance and a cold ordinary-app review. Original M10.2/M13 gates and visual
baseline approval remain separate.

## Unified file previews and renderer retirement

The file-only JSONL registration uses the same nested header/body/footer frame
as the session inbox, without a session list or composer. Each tab reads only
its selected file. `transcript.jsonl` uses the shared read-only Transcript with
Document default, header icon toggle and retained tool inspector. `agents.jsonl`
keeps its chronological binding/activity records, Markdown handoff summaries and
expandable structured captures. Generic JSONL retains line-numbered records. The
compact footer identifies read-only state and record counts. Initial file loads
use representative skeletons. Empty, invalid and interrupted-append states
retain their existing parsing semantics. Rename/refresh and owned teardown stay
within the file-view lifecycle; no preview writes, sibling reads or runtime
launches are introduced. Imports and files share one recorded transcript reader.

The old Chat.Layout timeline/composer branch is removed from the ordinary panel
and catalog embeddings. Existing approvals, questions, attachments, recipient,
configuration, scope and history controls remain shared with the new renderer.
Classic user prompts use Design Core's rounded primary-tinted surface, including
on hover/focus; Document and assistant surfaces retain their existing behaviour.

Shared-renderer adoption also retains slash-command usability: completed local
commands and confirmed skill/prompt dispatch return explicit acceptance, while
errors and cancellation retain the draft. Saved command publication acknowledges
its local completion separately from provider checkpoints. Commands preserve
unconsumed attachments and recipient choices. Pending anchored comments require
a regular message and remain queued locally if a slash command is attempted;
commands cannot silently acknowledge context they do not submit.

Local slash-command tools retain inline disclosures and results, including
registered search views; their titles never open the body inspector. The
retained dispatch identity distinguishes local commands from agent tools.
Reports such as `/help` preserve captured whitespace in a monospaced surface,
with semantic colours for headings and commands. Saved captures remain plain
text; presentation never resolves today's registry or executes the command.
