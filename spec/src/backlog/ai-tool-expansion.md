# AI tool expansion

Status: **Deferred — saved for later implementation on 2026-10-21.**

This is the agreed implementation backlog, not an active requirement or a claim
of delivered functionality. Resume only when implementation is requested. This
canonical backlog owns the remaining delivery;
[AI qualification](ai-qualification.md) retains existing native acceptance gaps.

## Summary and confirmed decisions

Extend Desktop's application tools by reusing the services already powering
notes, memory, search and repository history. Deliver all six stages as
independently usable slices.

- `notes_list` already exists in the Markdown plugin and Desktop's installed
  public package. Extend discovery rather than registering a duplicate.
- Structured tag/property search and basic file moves already exist. Reuse
  `notes_search`; add structured property editing and moves that preserve links.
- Heading-aware editing, saved-conversation search and unresolved-link discovery
  are additional useful capabilities included in this plan.
- An explicit "remember this" writes immediately to both the dated note and
  curated memory, retaining source evidence and the current approval policy.

The existing tool and memory boundaries are documented in
[Native application tools](../current/ai-tools.md) and
[Markdown-first memory](../current/ai-memory.md).

## Delivery checklist

- [ ] Stage 1: Discovery and understanding notes.
- [ ] Stage 2: Structured note editing.
- [ ] Stage 3: Explicit memory controls.
- [ ] Stage 4: Workspace context and navigation.
- [ ] Stage 5: Historical and conversational recall.
- [ ] Stage 6: Link-aware note organisation.

### 1. Discovery and understanding notes

- Extend `notes_list` with glob filtering, pagination and optional file
  statistics/attachment metadata. Keep Markdown discovery as the default.
- Add `notes_inspect` for frontmatter, tags, heading outline, section references
  and content revision.
- Add `notes_links` for incoming, outgoing and unresolved links, including
  source positions.
- Retain `notes_search` for content, tag and property queries. Improve its tool
  description with examples of the existing query syntax.
- Apply conversation scope and Workspace exclusions before limiting results.
  Return explicit truncation, continuation and indexing status where relevant.

Ownership: Markdown and Search plugins in `lapis-plugins`, using public Vault
and metadata APIs from `lapis-notes`.

### 2. Structured note editing

- Add `notes_properties_update` to set/remove selected frontmatter fields
  through FileManager. Preserve unrelated properties and note content.
- Add `notes_edit_section` to append, prepend or replace a section body
  identified by a reference from `notes_inspect`. A section includes subordinate
  headings and ends at the next heading of equal or higher level.
- Require a matching content revision before editing. Repeated headings remain
  distinguishable; changed or ambiguous targets return a conflict.
- Reuse file guards, conditional writes and approval diffs. General text editing
  stays in `edit` and `apply_patch`.

Ownership: Markdown tool registration and public API mutation services.
Acceptance: editing one property or section preserves the rest of the note and
dirty editor work.

### 3. Explicit memory controls

- Add `memory_remember` and `memory_forget` through Desktop's memory service.
- Remembering writes immediately to both the dated note and curated memory,
  linked to verified conversation evidence.
- Default to the conversation's current memory scope; allow existing personal,
  workspace and project scopes through the service's scope policy.
- Explicit remembering works independently of automatic capture. Repeated calls
  cannot create duplicate entries.
- Forgetting supports an exact memory reference or a selected conversation's
  derived memories. Persist suppression/exclusion records so capture,
  consolidation and index rebuilding cannot recreate them.
- Preserve handwritten prose and original transcripts. Report entries requiring
  review instead of claiming complete removal.
- Use the current action approval setting and provenance rules; tool output
  cannot impersonate user-authored evidence.

Ownership: Desktop AI memory. Extend its service with explicit remember and
entry-level forgetting operations; reuse existing conversation forgetting.

### 4. Workspace context and navigation

- Add `workspace_context` for the owning window's active note, bounded
  selection, dirty state and open note references within the conversation scope.
- Capture context at invocation time and label unsaved editor text clearly.
- Add `notes_open` to reveal a note at a heading or source position through
  existing workspace navigation.
- Treat navigation as a state-changing action under the existing tool approval
  policy.
- Add clickable source links to new tool results so users can inspect notes,
  memory entries and historical evidence without losing the chat.

Ownership: shared App/workspace helpers composed by Desktop AI. Reuse Design
Core result presentation and the embedded chat shell.

### 5. Historical and conversational recall

- Add `history_search`, `history_read` and `history_diff` through the repository
  plugin's search and pinned readers.
- Return exact revision identifiers and source locations. Distinguish deleted
  files, unavailable content and incomplete indexing. History tools are
  read-only.
- Add `conversations_search` and `conversations_read` over saved local
  conversations and already-imported transcripts.
- Extend the conversation index with scope filtering before ranking and
  pagination; its general search entry point is insufficient for scoped agent
  access.
- Return bounded message excerpts with timestamps, authors and conversation
  links. Read persisted, sanitised records; do not scan external clients'
  directories or initiate imports.

Ownership: Desktop Repository History and AI plugins respectively. Acceptance:
agents can answer "what did we decide?" and "what changed?" with inspectable
sources.

### 6. Link-aware note organisation

- Add `notes_move` for one Markdown note at a time, updating affected links.
- First extend public FileManager with a prepared move containing the
  destination, affected references and content preconditions.
- Check every affected file against conversation scope. Refuse a move requiring
  out-of-scope updates rather than silently leaving broken links.
- Show the complete change in the existing approval flow. Preserve aliases,
  heading/block links, open editors and collision handling.
- Record progress for interrupted multi-file operations. Report partial outcomes
  accurately and provide explicit recovery; never automatically replay an
  uncertain move.

Ownership: generic move preparation/application in Lapis API, with tool
registration in Markdown. This is distinct from basic `apply_patch` moves.

## Integration and interfaces

Register each tool with its owning plugin. Reuse AppToolHost's schemas,
settings, binding snapshots, approvals, cancellation and effect capture. Use the
existing Tools settings/catalog for enablement; new first-party tools follow
current defaults and permission choices.

Implement generic service extensions in their owning repositories, then consume
verified public package builds in Desktop. Keep returned data bounded, scoped
and source-linked. Plugin disablement or vault changes invalidate access.

Update canonical specifications, verification and acceptance evidence per
completed slice. The saved backlog does not activate new runtime requirements,
close outstanding M10 qualification gates, or resume deferred JJ conversation
persistence.

## Verification when implementation resumes

Start each stage with focused service/tool tests, then run the owning
repositories' required affected checks and consumer acceptance. Cover:

- Scope/exclusion enforcement, pagination and stale indexes.
- Approval denial, automatic approval, cancellation and plugin teardown.
- Changed revisions, dirty buffers and destination collisions.
- Remember/forget across restart and index rebuilding.
- Scoped history/conversation retrieval and interrupted move recovery.
- Production chat result interactions and accessibility.

Finish with a cold native Desktop smoke test using an isolated vault and an
already-supported ACP client. Keep mocked, native and live-provider evidence
separate. Visual baselines retain their separate approval gate.

## Further backlog

PDF/OCR extraction, Tasks tools, daily-note/template helpers, bulk organisation,
web connectors and remote repository mutations remain outside these six stages.
They require additional domain or integration work.

Saving this plan changes documentation only. Implementation, product tests,
application restarts and package publication remain deferred.
