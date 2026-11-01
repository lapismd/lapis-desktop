# Markdown document Review mode

Saved on **2026-10-24** for future implementation. All delivery tasks are
**Deferred**. This document records the agreed product direction and proposed
sequence; it does not start implementation or qualify a feature.

The [planned contract](markdown-review-contract.md) defines planned behavior.
This canonical backlog owns future work and acceptance. Resume when
implementation is requested.

## Product decision

Add a distinct **Review** mode to Markdown document surfaces. Reuse the chat
transcript's rendered, cursor-addressable Markdown and inline comments. A user
places the cursor anywhere in supported text, or selects a passage, then types
or invokes Add comment. The document remains immutable while the comment
composer accepts input. Ordinary Preview and existing source/live editing modes
keep their current behavior.

Review exposes inline discussions and a document Comments overview, with source
navigation, replies, own-comment editing and resolve/reopen. Mode changes retain
drafts, selection and reading position. Comment storage works independently of
AI; Send to agent is a later explicit action.

## Inspected foundations and gaps

Paths below are repository-relative source pointers observed on 2026-10-24.
Recheck their public contracts and qualification before implementation.

| Owner           | Existing foundation                                                                                                                                                                                                                                                           | Required work                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design-core`   | `src/shared/chat/index.ts` exports `TranscriptContent`, `TranscriptController` and `CommentComposer`. `src/shared/chat/transcript/text-editor.ts` retains cursor movement while rejecting source edits and routing typing, paste, shortcuts and IME completion into comments. | Expose a document review composition using that same implementation; preserve chat consumers.                                                                  |
| `mira-mde`      | The transcript uses Mira's editor/preview, including captured code and table readers.                                                                                                                                                                                         | Own missing generic rendering, source mapping or reader hooks; qualify Markdown extensions.                                                                    |
| `lapis-plugins` | `packages/markdown/src/lib/components/embed/markdown-file-surface.svelte` and `packages/markdown/src/lib/mira/extensions.ts` own document surfaces and extension composition.                                                                                                 | Add Review selection, document commands and capability-aware mounting through public contracts.                                                                |
| `lapis-notes`   | API/workspace own App, leaf and save/leave lifetimes; lapis-server owns portable native application policy in `lapis-app-core`.                                                                                                                                               | Define the optional document-review service, draft ownership and native coordination; keep Tauri policy outside the core.                                      |
| `jj-store`      | `crates/jj-review/src/anchors.rs` has revision/file/text anchors; `crates/jj-review/src/resolver.rs` has exact, unchanged, modified, deleted and ambiguous placement. `crates/jj-collab/src/workspace_comments.rs` has frozen file observations.                              | Verify the selected local backend's file-anchor support and add missing bounded public comment operations upstream. Types alone do not prove provider support. |
| `lapis-desktop` | Native vault/repository admission, automatic backup and history integration already exist.                                                                                                                                                                                    | Supply admitted review transport, package intake, lifecycle composition and native acceptance.                                                                 |

`tauri-plugin-jj-store` currently exposes history reads only. Do not infer write
authority from an open history handle. Existing repository-qualified review
references are useful for later agent handoff, but do not prove Desktop agent
publication or reply integration is complete.

## Shared component and service design

Use **`MarkdownReview`** as a proposed public Design Core composition name;
final exported names are chosen in its owning package. Build it from the
transcript reader, annotations and comment presentation, with one shared
implementation consumed by chat and documents. A document has document
semantics, its own scroll position and no synthetic conversation message,
participant header or chat autoscroll requirement.

The component receives a frozen Markdown snapshot, an opaque revision identity,
host-supplied discussions, Markdown options/file resolvers and explicit command
callbacks. The host owns persistence, admission and lifecycle. Reuse the
existing controller where appropriate; extract generic state upstream if its
conversation-specific submission or navigation prevents clean reuse.

Initially represent the document as one immutable source block. Rendering may
split it for tables, code, comments or virtualization, but every child retains
offsets into the original snapshot. Do not create durable paragraph identities
from array indexes or rendered DOM nodes. Translate UI UTF-16 ranges to
validated native UTF-8 byte ranges against those same source bytes.

The optional App-owned service needs bounded operations for source observation,
discussion listing/read, publish/reply/edit/resolve/reopen, command status and
placement resolution. Separate source-read and publication capabilities. Use
typed requests and captured versions; leave final wire naming to the owner. Do
not add a second canonical comment database or embed comments in Markdown.

## Source and storage policy

The first target is a saved Markdown document in an admitted, explicitly enabled
JJ-backed vault profile. Identify metadata owner and source repository
separately, including managed external backup versus an original repository.
Verify capabilities for that exact profile before enabling publication. An
absent or unsupported backend shows an unavailable action; viewing a document
never initializes or converts it.

Entering Review freezes the saved source and discloses newer unsaved editor
content. Existing save guards remain authoritative; mode switching cannot force
a save, lose a dirty buffer or silently review a different version. Unsaved
buffers/new files are outside the initial publication scope.

Before first publish, obtain a retained JJ revision for exactly the observed
bytes. Reuse an existing checkpoint when it matches. If a new checkpoint is
needed, perform it through explicit publication and existing capture policy,
verifying the source fingerprint. A changed observation retains the draft for
explicit reselection. A retained historical snapshot remains a valid explicit
review target even when the live file has changed.

Qualify the native/portable anchor profile and retained evidence upstream.
Preserve original anchors; derive placement against each explicit newer snapshot
separately. Confident unchanged mappings can show inline. Modified, deleted,
ambiguous or unavailable passages remain inspectable in the Comments overview
with their original version; they cannot silently become a new anchor.

Native writes use stable request IDs, observed versions and durable receipts.
After a lost response, inspect the same request rather than resubmitting with a
new identity. Retain source evidence before selecting a dependent comment;
preserve checkpoint and comment outcomes independently when their owners cannot
publish atomically. Browser drafts never confirm storage.

## Delivery slices

### M17.1 — shared review reader

- Update Design Core/Mira owning specs and public contracts before code changes.
- Create production `MarkdownReview` stories with frozen source and an in-memory
  host. Reuse the transcript reader and comment components.
- Exercise click/arrow-key caret placement, selection, typing, paste, IME,
  comment shortcut, dismissal, focus return and pending drafts.
- Cover prose, headings, lists, code and tables, including keyboard and
  screen-reader labels. Keep source bytes unchanged for every interaction.
- Run existing chat comment stories as regression consumers of shared changes.

Exit: shared functional/accessibility gates pass. This is a UI foundation;
fixtures cannot qualify document persistence.

### M17.2 — saved document and JJ persistence

- Qualify the selected local JJ file-review provider; add missing generic
  service/transport contracts in `jj-store` before application integration.
- Add Notes-owned App/native coordination and the Markdown plugin's Review entry
  point, then Desktop admission and public-package consumption.
- Implement source capture, inline discussions, Comments overview,
  publish/reply/edit/resolve/reopen and original-request recovery.
- Preserve private drafts through mode changes and restart using an explicit
  owned draft store, separate from canonical published reviews.
- Prove: open saved note → Preview → Review → cursor/selection → comment →
  publish → quit → reopen → inspect → reply/resolve.

Exit: cold native persistence, source-byte preservation, failed writes and
unknown-outcome recovery pass. No agent is required or started.

### M17.3 — changed source and anchor placement

- Resolve against explicit newer snapshots using JJ lineage and retained
  evidence; preserve original anchors and source navigation.
- Cover edits before/inside the passage, repeated text, deletion, renames,
  copies, external saves, divergent revisions and missing evidence.
- Keep unresolved discussions reachable; explicit reattachment records a
  relationship and preserves the original source.
- Handle changes during drafting, capture, publication and receipt recovery
  without changing an in-flight request's meaning.

Exit: no fixture attaches to an unproved passage; historical sources and drafts
remain inspectable after restart.

### M17.4 — complete Markdown and host qualification

- Complete the compatibility matrix below through production Review surfaces.
- Qualify large documents, multiple leaves/windows, plugin disable/re-enable,
  vault switching, guarded close, storage failure and cold restoration.
- Refresh verified public archives into Desktop and run directly affected
  consumer lanes, retaining chat regression acceptance.
- Register desktop production stories and current source ownership mappings.

Exit: supported Markdown Review passes functional, keyboard, accessibility,
lifecycle and native gates. Screenshot comparison and baseline updates are
excluded; visual deferral does not waive functional failures.

### M17.5 — optional agent handoff

- Add explicit Send to agent with exact repository-qualified review comment
  references, captured quotes and bounded context. Preserve authored prompt
  text.
- Keep publication, recipient delivery and linked-answer states independent.
  Link replies only through the existing proven answer protocol.
- Qualify the supported Desktop conversation backend without implicitly resuming
  deferred native conversation storage.

Exit: an explicit supported agent turn receives the intended saved comments,
links its proven answer and survives uncertain delivery without duplicate sends.
Ordinary review remains usable when AI is unavailable.

## Acceptance matrix

| Surface or boundary                                | Required evidence                                                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Prose, headings, lists and nested formatting       | Cursor/selection mapping; paragraph fallback; unchanged Markdown.                                                                        |
| Code fences and tables                             | Original ranges through embedded readers, row placement and comment expansion.                                                           |
| Frontmatter, callouts, links, wikilinks and embeds | Existing extensions/resolvers; exact source or explicit block targets; cross-file embeds retain independent authorized identities.       |
| Math, images, Mermaid and rendered objects         | Block comments where text selection is unavailable; no fictitious character mapping.                                                     |
| Task checkboxes and controls                       | No source mutation through checkboxes/embedded controls; navigation/disclosure/copy remains available.                                   |
| Unicode and line endings                           | Emoji, combining characters, surrogate boundaries, CRLF and multi-block selections retain exact quote/byte identity.                     |
| Draft and source lifetime                          | Mode changes, resize, IME, multiple windows, external edits, rename/delete, close/reopen and vault switching.                            |
| Native persistence                                 | Exact-profile admission, stale generations, observed-version conflicts, restart, lost replies, denied access and repeated status lookup. |
| Existing consumers                                 | Chat/comment flows and ordinary Preview/Edit remain functional and accessible.                                                           |

## Verification and resumption

Start each slice at its exact failing or missing contract, record the before
count, and rerun the same target after changes. Follow each owner's tracked
guide and workspace escalation ladder. Shared reader changes require affected
chat/document interaction and accessibility suites, owning checks/builds and
consumer acceptance. Use a cold process for lifecycle/browser changes.

Record source revisions and archive checksums separately from native consumer
evidence. Use verified local archives during migration; keep publishable ranges
portable. Publication, installed-app replacement and other-platform
qualification remain separate requests/gates.

Before implementation, settle the local anchor/provider capability and draft
storage seam in the owning specifications; update spec-first mappings when
production paths are selected. These prerequisites do not justify replacing JJ
storage or duplicating the transcript renderer.

Excluded initially: editing text inside Review, simultaneous collaborative
editing, remote comment synchronization guarantees, binary-document annotations
and automatic agent dispatch. Existing M10/M13/M14 gaps retain their owners.

## Retained acceptance boundaries

### M17.1 — deferred acceptance

A shared public Markdown review reader supports cursor/selection comments
without source edits; keyboard, IME, accessibility and affected chat regressions
pass in production-component stories.

Dependencies: M8.5; requirements:
LD-REVIEW-001,LD-REVIEW-002,LD-REVIEW-003,LD-REVIEW-005.

### M17.2 — deferred acceptance

An admitted saved Markdown document publishes, restores after cold native
restart, replies, edits and resolves JJ-backed comments with unchanged document
bytes and exact failed/unknown-request recovery.

Dependencies: M17.1,M13.1,M14.2; requirements:
LD-REVIEW-004,LD-REVIEW-006,LD-REVIEW-007,LD-REVIEW-009,LD-REVIEW-010.

### M17.3 — deferred acceptance

Edits, repeated text, renames, copies, deletions and concurrent source changes
retain original anchors and expose unproved placements without silent
retargeting, including after restart.

Dependencies: M17.2; requirements: LD-REVIEW-004,LD-REVIEW-005,LD-REVIEW-008.

### M17.4 — deferred acceptance

The supported Markdown matrix, multiple windows, draft/leave recovery and
affected chat/Preview/Edit consumers pass functional, accessibility and cold
native acceptance through verified public packages.

Dependencies: M17.3; requirements:
LD-REVIEW-001,LD-REVIEW-002,LD-REVIEW-003,LD-REVIEW-005,LD-REVIEW-009,LD-REVIEW-010.

### M17.5 — deferred acceptance

Explicit agent handoff delivers exact authorized review-comment revisions and
links proven answers without duplicate sends after uncertain outcomes; ordinary
review remains independent of AI.

Dependencies: M17.4,M10.2; requirements: LD-REVIEW-011.
