# Markdown-first AI memory

This chapter refines LD-AI-002 under M10.2. Memory is owned by Desktop and uses
ordinary Markdown in the admitted vault. It does not require a controller,
repository storage, or a particular interactive ACP provider.

## Storage and scopes

The configurable vault-relative folder defaults to `Memory`. Workspace notes
live directly inside it; personal notes in `User`; project notes in
`Projects/<vault-relative-project-path>`. Each scope has `YYYY-MM-DD.md` daily
notes and `MEMORY.md` curated conclusions. Files are created on demand. The
saved IANA timezone initially follows the machine and governs future dates.

Daily entries contain readable timestamped observations and source links, not
complete transcript copies. Curated entries link to their supporting daily
entries. Stable anchors identify generated entries. Ordinary handwritten prose
must survive generated updates and is eligible as vault reference context.
Generated provenance cannot be asserted by editing note text.

Actual memory content belongs in the visible folder. Durable provenance,
activation/checkpoint receipts, deletion receipts and conversation exclusions
belong in `.lapis/memory`. Search indexes are rebuildable and cannot replace
these receipts. The old hashed-file format has no reader, fallback or migration;
existing legacy files remain untouched and unused. Fresh activation must not
automatically capture old transcript entries.

## Capture and retrieval

Automatic capture and recall default enabled and have independent settings.
Capture runs only after durable terminal turn boundaries, using existing owner
candidate/evidence policy. Deterministic capture and promotion require no model.
Model-assisted consolidation remains opt-in and independently configured.
Idle/daily maintenance must retain source trust, scope and quota boundaries.
External-client compaction hooks are outside this slice.

Capture checkpoints and stable entry identities make retries idempotent across
restart and concurrent conversations. Index rebuilding only projects existing
notes and transcript evidence; it cannot capture, promote or resurrect deleted
memory. Forgetting retains durable exclusions and removes generated content from
daily/curated notes and recall without deleting the conversation transcript.

Recall respects vault, user, workspace and project ancestry boundaries. At most
three excerpts and approximately 900 tokens are admitted within 150 ms. Sent
context retains the actual note path and anchor. Manual/external note changes
refresh normal search and subsequent memory recall through vault events.

## File and settings lifecycle

Settings / AI / Memory exposes folder, timezone, capture, recall, optional
processor configuration, and actions to open the folder, today's note and the
current curated note. Normal Explorer, editors, metadata, search and history
provide review; no separate memory browser is required. Workspace exclusions
remain authoritative and an excluded selected folder is explained in settings.
The folder control occupies a full-width row below its label. Memory and handoff
model command pickers search model names, IDs and descriptions and discover
models from their independently selected processor agent and runtime, never from
the interactive chat selection. These processors currently admit only the
bundled Lapis AI restricted profile. Settings explain that external harnesses
and named Lapis provider profiles cannot enforce the same unattended, tool-free
and filesystem-discovery-free execution contract. Existing external preferences
remain visible and inactive until explicitly replaced; listing agents or models
cannot grant background execution. Discovery reuses the native five-minute
agent/profile cache and in-flight deduplication. Open AI settings refresh
periodically; closed settings must not initiate polling. Saved models remain
visible if absent or discovery fails. Merely listing models cannot change
processor selections or enable unsupported background execution. Late results
from a previous agent/runtime or a disposed plugin are ignored.

Generated writes use file editing guards and conditional text writes, preserve
dirty editor drafts and coordinate document mutations across windows. Changed
preimages cannot be overwritten. Appends may retry only after re-reading and
deduplicating stable identities. Failed writes remain retryable.

Changing the folder pauses memory writers and moves it through the normal file
manager. The setting publishes only after movement succeeds. Destination
collisions never merge or overwrite. A durable relocation receipt supports
interrupted move/save recovery. Scope and provenance remain unchanged by a move.

## Verification and delivery

Focused memory tests cover default/custom paths, dates, scopes, source trust,
manual edits, capture, recall, forgetting, rebuild, concurrent writes, restart
and relocation conflicts. Production-component settings and sent-context stories
cover the visible states. A cold native vault scenario qualifies persisted
bytes, watching, conditional writes and movement separately from in-memory
tests. M10.2 remains in progress until its original aggregate gates pass. No
baseline, package publication or installed-app replacement is implied.
