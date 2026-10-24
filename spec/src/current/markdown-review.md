# Markdown document Review mode

**Planned contract; implementation deferred.** This chapter specifies future
Desktop behavior and public integration boundaries. No Review mode or native
comment-write capability is claimed as delivered. The
[implementation plan](../backlog/markdown-review-mode.md) describes source
owners and slices;
[M17.1–M17.5](progress/milestones.md#markdown-document-review) alone own
completion. E-PLAN-005 records planning checks only.

## Requirements

<!-- prettier-ignore -->
| ID | Requirement |
| --- | --- |
| LD-REVIEW-001 | Markdown document surfaces MUST offer a distinct Review mode through the owning plugin's public integration, preserving existing Preview and editing behavior and retaining view position and pending comments across mode changes. |
| LD-REVIEW-002 | Review MUST allow keyboard and pointer cursor placement and text selection; typing, paste, IME completion or Add comment MUST enter the anchored comment composer while every document-editing route remains disabled. |
| LD-REVIEW-003 | Review MUST share the transcript reader and annotation implementation through public Design Core/Mira contracts, preserving the document's supported Markdown extensions and file resolution without requiring synthetic conversation messages. |
| LD-REVIEW-004 | Each review MUST name an immutable source snapshot. Publication MUST retain and verify that exact source under the admitted JJ profile; mode entry MUST NOT initialize storage, force a save or hide unsaved document content. |
| LD-REVIEW-005 | Comment selections MUST map to original Markdown source ranges and validated native byte offsets. Rendered fragments MUST preserve source offsets; unsupported character-level targets MUST use an explicit block target or remain unavailable. |
| LD-REVIEW-006 | Canonical document discussions MUST use the owning JJ ReviewStore through explicitly admitted native services. History-read authority MUST NOT authorize writes; unsupported profiles MUST remain unavailable without an alternate canonical store or document-byte changes. |
| LD-REVIEW-007 | Comment mutations MUST retain stable request identities, observed versions and confirmed receipts. Unknown outcomes MUST preserve drafts and original requests for status inspection, without implicit replay or invented success. |
| LD-REVIEW-008 | Placement in a newer document MUST remain separate from the immutable original anchor and use validated source evidence. Modified, deleted, ambiguous or unavailable placements MUST remain inspectable without silently replacing the original target. |
| LD-REVIEW-009 | Review state MUST belong to the owning App/document session. Draft restoration, multi-view projection and teardown MUST preserve document identity, isolate vaults, and fence and drain native work before releasing its authority. |
| LD-REVIEW-010 | Document review MUST provide inline discussions and a Comments overview with source navigation, reply, authorized own-comment editing and resolve/reopen. These actions MUST preserve exact discussion/revision identities and remain usable independently of AI. |
| LD-REVIEW-011 | Agent handoff MUST require an explicit action carrying exact authorized repository-qualified comment references and bounded captured context. Publication, delivery and proven answer links MUST remain separate, and uncertain delivery MUST NOT trigger implicit resend. |

## Review interaction

Review is an additional presentation. Source/live editing and ordinary Preview
retain their controls. A text selection anchors its exact source range; a
collapsed cursor targets the surrounding paragraph, code line or table cell
according to the shared reader's documented behavior. Non-text objects offer a
labelled block-level target where supported.

Typing starts a comment at the captured position. Paste and IME composition
preserve authored text once, without leaking edits into the document. The
command/menu and shortcut provide the same action. Escape returns focus to the
source without discarding a nonempty draft. Controls and source highlighting are
keyboard accessible in both themes and narrow panes, with document semantics
rather than a conversation log announcement.

Links, disclosures and copy may retain their actions. Task checkboxes and
embedded controls cannot write document content in Review. Comment interaction
cannot mark the Markdown buffer dirty or reset undo history. A status/source
label distinguishes the reviewed snapshot from newer unsaved editor content.

## Shared presentation boundary

Design Core owns shared review composition, comment presentation and generic
annotation state. Mira owns generic editor/rendering and source mapping.
Markdown plugin owns view integration and document extension composition. Notes
owns App service/draft lifetime and portable native application policy; Desktop
owns window/vault admission and Tauri transport. JJ owns canonical anchors,
discussion storage, publication and placement semantics.

`MarkdownReview` is a proposed public component name. Prefer a public
composition over existing transcript content; necessary extraction updates chat
and document consumers together. Document callers cannot import private
transcript modules, copy their renderer or add CSS to hide conversation chrome.
Renderer identity is presentation data and cannot prove a native revision.

## Snapshot and anchor contract

The first implementation accepts saved Markdown sources. Dirty editor content is
preserved and explicitly distinguished; publishing against unsaved buffers/new
files is outside this first profile. Review holds its source until explicit
refresh or mode transition selects another snapshot. Freshness events may
announce newer content without replacing an active comment's source.

At publication, bind repository/metadata owner, operation, revision, path,
retained content identity and text selection through the supported JJ anchor
profile. A change ID or path alone is insufficient. Reuse a matching retained
checkpoint; explicit publish may request missing capture through the admitted
capture service. Verify the frozen fingerprint before capture and resulting
bytes afterward. Changed uncaptured source requires explicit reselection; an
already retained historical source remains valid as such.

UI ranges use UTF-16 positions; native ranges use verified UTF-8 byte
boundaries. Mapping uses the same captured source, including original line
endings and hidden Markdown syntax. Tables, code and split readers carry
original offsets. Quotes support display and verification, never authority or
unproved global matching. Embedded documents have separate sources requiring
their own capabilities and anchors; the parent path cannot stand in for them.

Original quotes and versions remain inspectable after edits, renames or
deletion. Derived unchanged placements may appear inline in a newer snapshot.
Modified candidates require explicit treatment; ambiguous/deleted/unresolved
threads remain in Comments. Explicit reattachment records its relationship
without rewriting the original anchor or transferring answers to a different
comment revision.

## Native authority and recovery

Review publication is separate from existing read-only Tauri history and AI
admission. The native owner chooses the physical vault, metadata home and
backend profile; the renderer supplies opaque admitted identities rather than
filesystem authority. Reads/writes revalidate scope; close/reload revokes stale
generations.

Model availability is not provider qualification. Before enabling a profile,
prove local file-anchor publication, retained source closure, listing,
mutation/status recovery and restart. Ordinary reads never initialize, convert
or select another store. Canonical metadata uses existing JJ publication
authority; Notes private draft storage remains noncanonical.

Publish only after required source evidence is retained. If snapshot capture and
comment publication span separate owners, preserve their distinct receipts and
disclose partial/unknown outcomes rather than claiming atomicity. Status lookup
uses the original request; edit/resolve conflicts retain draft and observed
version for explicit recovery. Reply and resolve actions do not change Markdown
or dispatch an agent.

## Draft and discussion lifetime

Mode changes retain the comment controller, source capture, selection and
pending submission. Normal close/reopen restores private authored drafts with
original source identity; submitted/unknown states restore as states, never
automatic work. Multi-window views observe an App/native owner and cannot create
competing authoritative writers.

Vault switching, plugin disposal and close fence new work and drain or durably
retain pending outcomes under existing leave guards. Failed final persistence
keeps the owning session available for recovery. Another vault or an unavailable
source cannot restore a draft by matching a filename or quote.

Discussion edits use the observed comment version. Resolve/reopen changes
discussion lifecycle while preserving source and earlier replies. Failure
retains context and draft; operational errors use the existing application
notification owner without duplicate inline exception messages.

## Explicit agent handoff

M17.5 is separately deferred. Send to agent publishes required comments first,
then hands off exact authorized references and bounded source context. Authored
prompt text remains separate. Answer links name delivered comment revisions and
proven captured answers; UI parsing alone cannot mark them replied. AI
disablement or unavailable backend support does not disable ordinary review.
This contract does not resume M13/M13.3 native conversation storage.

## Acceptance and planned verification

The plan's acceptance matrix governs source mapping, Markdown compatibility and
native intake. Each requirement has one Planned verification row. Production
stories exercise shared readers/controllers with isolated adapters; native tests
use disposable vaults and the actual selected JJ profile.

Required cases include Unicode/CRLF, repeated passages, code/table fragments,
rendered objects, dirty buffers, external edits, rename/delete/copy, stale
versions, denied scopes, uncertain writes, restart, multi-window lifetime and
agent independence. A cold native reopen restores published comments and source
evidence while Markdown bytes stay unchanged. Shared changes also run affected
chat interactions and accessibility checks. Screenshot comparison and baseline
changes are excluded; native and functional gates remain required.
