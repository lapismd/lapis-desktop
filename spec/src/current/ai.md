# Desktop AI and optional compute

[Shared-screen integration](shared-screen-integration.md) governs admission,
Markdown leaves, queue authority and exact request/send failure recovery. AI
shell stories MUST join owned fixture readiness before querying controls.

[Local AI setup](ai-setup.md) governs independent ACP clients, binding-frozen
bootstrap/skills, native credentials/tools and explicit optional compute.
Existing local conversations and private drafts remain supported. E-AI-098
aligns provider/compute settings with the Agents page's full-width cards.
E-AI-099 adds compute fit; E-AI-121 adds [indexed imports](ai-imports.md).
E-AI-122: model search; E-AI-123–125: compute library, status and inline choice.

E-AI-100 repairs stable ACP model discovery and user-local Cursor detection.
Both chat layouts expose modes, Pin/Unpin and Archive/Restore in the header
kebab menu. E-AI-112 removes duplicate header buttons and the legacy Settings
editor; conversation-local state, provider configuration and admission remain.
An explicit Provider default reasoning option omits effort configuration;
switching harnesses selects it rather than carrying another client's effort.
E-AI-101 adds decorative mode/default icons and the compact Add Agent action;
advertised choices, overrides, approval policy and dispatch remain unchanged.
E-AI-102 consumes the shared single-action footer repair: pending submission and
empty drafts show Stop; only a ready nonempty follow-up shows Queue. E-AI-103
adds an independent, saved host approval policy in the footer and agent editor;
[approval policy](ai-addressing.md#approval-policy) retains native scope/modes.

[Local ACP/file storage](ai-local-history.md): E-AI-093/096 scoped drafts.
Native-store clauses below preserve the Deferred checkpoint experiment.

[Presentation](ai-presentation.md), [tools](ai-tools.md) and
[authored writes](ai-authored.md): native admission. E-AI-064: recovery dots;
E-CATALOG-015: core exclusions. E-AI-054–056 [imports](ai-imports.md) use native
read-only workers. E-AI-058/060/061: inbox/links/attachments; watching pending.
E-AI-062/063: local AI; original JJ gates deferred. E-AI-041/045/052/053 and
[participants](ai-addressing.md) retain gates; E-ARCHIVES-002 reconciles tests.
[Edits](ai-conversation-edits.md)/[attribution](ai-native-attribution.md): M13.3
gates remain; E-AI-079–084 attribution/storage/dispatch drafts are unqualified.

E-REPO-002 retains separate AI/history admission; history cannot admit targets.
E-CATALOG-009–012 retain shell clearance, inert XML and constrained chat
wrapping. `PLUGIN_MIGRATION.md` and the original M10 task gates remain
authoritative. Shared plugin identity and catalog requirements live in
[plugins.md](plugins.md).

Native AI admission uses a two-phase, window-owned transition over an existing
live vault token. Pending transitions cannot authorize ACP. A new root retires
the affected window's workers before activation; reload preserves a generation
only for the same profile and physical root. Explicit disable rotates it.
Completion revalidates the physical root and rejects stale tickets. Vault close
fences new transitions before cleanup, while suspended reload scopes remain
retained. Invalid active roots identify exactly their retired generation for
scoped cleanup. Native caller/origin checks and target policy remain host-owned;
the renderer cannot choose a root, executable, environment or generation.

Ordinary builds admit configured Codex clients; managed targets additionally
require explicit conversation-bound launch preparation.
[Agents and bundled helpers](ai-clients.md) own settings, delivery and repair.
The exact main ACP-session grant permits the scoped protocol without executable
selection. The two admit/release commands accept only a vault token or reload
flag, reject surplus authority fields and derive window/origin from Tauri.
Pending scopes stay unavailable until prior worker cleanup succeeds. Failed
cleanup remains retryable; root failure retires only its old generation. Vault
closure retains exact generation-scoped cleanup targets across retries, so
delayed old-vault cleanup cannot revoke a newer window admission. Destroyed
windows invalidate pending admissions before they can publish late. The isolated
e2e transport policy remains separate. Production target selection and actual
mounted native recovery keep their M10.2 gate; registering the host alone cannot
enable ordinary AI execution.

Notes binds the native AI factory before optional plugin loading. Client
allocation and ACP admission remain lazy, scoped to the owning physical vault
and guarded by current workspace trust. Disabled/Safe Mode startup allocates
neither. Closing fences new work, drains admitted IO and view persistence,
detaches owned streams, and then releases native authority. Failed cleanup stays
retryable. Full close resolves uncertain detach through awaited whole-scope
revocation; reload requires successful detach before suspension. Reload retains
only the native generation; it does not invent resume or replay a prompt. Native
model discovery shares non-prompting probes and a five-minute metadata cache;
[client discovery](ai-clients.md) governs status, trust, invalidation and
cleanup.

[Local recovery](ai-recovery.md) governs durable dispatch, streaming and unknown
outcomes.

E-AI-108: [per-agent providers and shared header avatars](ai-setup.md); Compute
is a separate sidebar page. E-AI-109 adds responsive settings tabs and action
icons; E-AI-111 aligns selected command icons. Original native gates remain.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-AI-001   | Desktop AI MUST use a reusable lapis-ai Tauri adapter for direct ACP with host-owned executable/root/credential policy, correlated ordered events, exact permission option IDs, model/configuration selection, cancellation and teardown. Each single-turn worker MUST remain isolated; uncertain submissions MUST NOT replay automatically.                                                                                |
| LD-AI-002   | Desktop MUST retain current AI UI, conversations, app tools, context and memory while adapting the pre-controller ACP seam. Injected context MUST remain distinct from authored messages. Old controller IDs MUST NOT become ACP session IDs; unsupported resume MUST create an explicit new binding and context handoff. Unresolved turns/tools MUST remain interrupted or unknown and MUST NOT be projected as completed. |
| LD-AI-003   | Application tools MUST use a bundled Rust bridge with private authenticated IPC, existing registry/vault authorization, guarded edits and approval UI. Credentials MUST remain native-side. Unknown permission options MUST NOT approve. The user-selected local-file Codex profile MAY precede packaged lapis-agent/tool qualification; other external adapters retain explicit prerequisites.                             |
| LD-AI-004   | Migrated AI stories MUST retain applicable source scenarios and unique regression coverage, use fake clients by default and replace live-controller scenarios with native acceptance. Native chat, cancellation, approval, reads/edits, recovery, isolation and process cleanup MUST pass without ai-controller.                                                                                                            |
| LD-COMP-001 | Optional compute MUST default to no sharing, no model download and no automatic cloud fallback. Explicit download/import/start/stop and existing mutually admitted pairing MUST qualify independently of ACP. Non-streaming inference MUST remain explicit; embeddings and cross-app singleton management remain outside scope.                                                                                             |

## Reusable ACP transport qualification

M10.1 consumes `lapis-ai`'s built private `@lapismd/ai` root/Tauri exports and
Rust adapter through an explicit temporary local development prerequisite.
Record its exact source revision and public-build checks separately from the
consumer. The acceptance-only host policy admits isolated native roots and
compiled Rust providers; it cannot enter ordinary bundles or grant production
launch authority. Real packaged WebView tests cover command capabilities,
ordered channel delivery, exact permission IDs, cancellation, reconnect,
uncertain outcomes, isolated workers, revocation and process cleanup.

This transport gate does not qualify desktop AI UI, conversation/context/memory
migration, application tools, native credentials, a real model or compute. Those
retain M10.2–M10.4 gates. The application adds no replacement screens.

## Desktop AI handover foundation

M10.2 restores app-owned runtime/event, conversation and memory contracts before
mounting retained panels. Data shapes retain the current plugin's fields and
schema versions; historical controller identifiers remain stored data and do not
become native provider bindings. Transcript hashes preserve their existing
canonical JSON and UTF-8 rules. Native turns carry authored text and injected
context separately, and context admission is checked around asynchronous
preparation. No controller client/runtime dependency enters production.

Conversation persistence retains scoped `.lapis/agents/sessions/<id>` YAML
metadata and append-only agent/transcript JSONL through the existing Vault API.
Legacy schema versions remain readable offline; invalid committed records fail
with isolated diagnostics, and only an unterminated final JSON fragment may be
ignored. Derived titles, pin/archive state, provenance deduplication, redaction
and vault-trash deletion retain their established behavior.

The owning App may lazily inject one conversation persistence backend before AI
plugin loading. Existing installations select the legacy vault-file backend;
injected allocation or publication failures never fall back to another writer.
An AI application retains its selected backend for its whole lifetime. Close
drains view and maintenance work, then persistence, before releasing runtime
authority. A failed drain retains the backend and makes close retryable. This
seam does not itself qualify a JJ backend or native capture ownership.

App-owned handoff retains hash-verified full/delta/summary-tail evidence and
explicit target bindings. E-AI-113/115 cover exact live context and root
indentation. Private reasoning is excluded and tool output is labeled untrusted.
Handoff never resumes a provider or changes the stored authored messages.

Handoff budgets must be finite whole token counts and cannot exceed the default
maximum. Tiny excerpts stay bounded. Stored summaries must match the selected
conversation and fit actual-content as well as recorded-estimate limits before
their transcript hash is checked. Invalid summaries fall back to full evidence.

The desktop ACP seam consumes raw control-v3 through public typed clients. It
retains provider observations and event provenance, maps known activity once,
and preserves unknown extensions. Permission options retain exact IDs and
unknown semantic kinds; no default options are invented. Explicit host policy
may answer known one-time permissions under the approval-policy contract.
Interrupted or uncertain terminal outcomes remain explicit failures.

The adapted ACP runtime attaches before configuration and never prompts during
startup. It confirms model/effort and an advertised execution mode before Send.
E-AI-094 adds saved-agent defaults and conversation overrides; defaults remain
Codex `read-only`, OpenCode `plan`, and `ask` elsewhere. Explicit saved modes
remain exact; an unavailable mode never falls back. The footer cannot bypass
AppToolHost. Preparation belongs to the active turn; cancel/close fence late
dispatch. Unknown submissions block the session without replay. Detach retains
the worker; close releases it. Failed startup finds its original request for
cleanup and retains cleanup errors. Bounded initial skill/context delivery and
the explicit tool-free restricted Lapis profile follow
[local setup](ai-setup.md); resume and arbitrary MCP remain refused.

Retained skill parsing, discovery precedence, immutable snapshots and bundled
seeding remain application-owned and Vault-scoped. The migrated policy test lane
uses original applicable regression suites with public in-memory App/Vault APIs.
It is independent of Storybook and requires no native process or credential.

Command parsing, discovery, precedence, reserved local actions and bootstrap
formatting remain app-owned. Unknown commands stay local errors; literal slash
escapes and explicit skill/tool routing retain their source behavior. Bootstrap
reads admitted vault-relative folder instructions with bounds and omits host
paths. User-global command persistence is an injected host port; the legacy Node
implementation and runtime-only loader are not migrated.

File context stays separate and bounded (8 files/64 KiB each/128 KiB total).
Preparation checks cancellation. Projection excludes raw reasoning and redacts
durable tool detail, retaining conversation IDs without provider resume. Design
Core presentation helpers come directly from public exports.

Live and restored approval presentation follows the selected advertised option
kind, never an ID prefix. Unadvertised live choices reject; historical unknown
choices remain visible with neutral answered status. This display projection
cannot dispatch a permission or infer approval from an unknown option.

[Markdown-first memory](ai-memory.md) is Desktop-owned. Scoped ingestion,
deterministic promotion, evidence verification, bounded owner-only recall,
durable forget exclusions and leased maintenance use public AppDatabase/Vault
contracts. Portable capture sanitizes derived IO and fails closed on omission or
changed execution locations. Native credential-detector admission remains M10.3;
portable capture alone cannot qualify it.

Authoritative schema-1 Markdown/YAML records, exact revision preimages,
conversation hashes and opaque evidence refs retain their formats. Only
disposable synthetic index segments escape literal tildes before percent
escapes; catch-up rebuild removes obsolete paths without rewriting source
records. Cancelled maintenance cannot start after cancellation during runtime
selection or send after cancellation during startup. Restricted model
maintenance uses the explicitly configured, native-admitted tool-free Lapis
profile described in [local setup](ai-setup.md).

Record IDs must be strings, and serialization must fit the reader's 512 KiB
limit before any history/preimage mutation. Rejected records leave the current
revision and revision history unchanged.

Retained application-tool policy snapshots the App-owned registry, verifies its
registration identity before dispatch, confines execution to its conversation
scope and keeps local write/external approvals. Unregister cancels affected
active invocations and pending approvals; the original unavailable-tool outcome
is preserved. Pre-cancelled requests cannot invoke callbacks. Cancellation after
mutating dispatch records an unknown effect rather than claiming failure.

Input/output schemas are admitted against the standard draft-7 meta-schema, with
supported dialects and self-contained resolvable references. A portable
interpreter validates them without string code generation. Owned schema clones
preserve frozen registrations and reject forged interpreter annotations. The
retained policy suites and V8 no-code-generation probe do not qualify native
WebKit CSP, authenticated Rust tool IPC or durable effect reconciliation; those
remain M10.3 gates.

## Retained chat presentation and controller

The chat panel keeps two-line composition, core listings, permission/question
cards, conversation folder picker, timeline, tool-result views, mentions,
skills, model selection and error/retry presentation. Responsibility-specific
components and reactive state modules retain the original behavior within source
limits. New composer menus offer ACP choices only; historical native-mode labels
remain readable without enabling those deferred execution paths.

Permission replies validate advertised IDs before dispatch, await provider
acknowledgement and derive persistent grants from the advertised kind. Automatic
replies forward the exact matching advertised ID and remain fenced against
inactive/cancelled sessions. Rejected replies leave requests pending and create
no durable grant. Question answers become answered only after acknowledgement
and active session/turn/location/request checks; answer values remain absent
from durable state. Fresh questions clear transient old answers.

Recoverable presentation actions report through the existing composer error
surface and owning App notifications, without unhandled promise rejections or
claiming a successful reply. Selected question options expose pressed state and
retain contrast. Migrated catalog scenarios use disposable in-memory Apps and
test-only clients. Catalog qualification does not mount the production AI plugin
or qualify native admission, context/skills execution or durable recovery.

Shared error-label contrast and Search result naming are repaired in their
source packages, then consumed through verified local public archives. Desktop
stories use the complete visible filename/path as the Search hit's accessible
name; no consumer styling override or alternate result component is introduced.

Tool disclosure names include their complete visible metadata and collapsed
latest-call summaries; status is an accessible description. The source component
owns the label references, with per-instance IDs preserving repeated call
identities. Desktop queries follow those complete names without suppressing axe.

The isolated Chromium catalog collects discarded test graphs after each file;
missing test-only collector support fails the run. This resource policy retains
fixture teardown, test isolation, all four theme/viewport lanes, accessibility
rules and unhandled-error reporting. It does not expose collection in the
application or change native lifecycle gates.

## Retained AI settings

AI reuses declarative Settings fields and a controlled plugin-data source.
Durable writes serialize, retain historical payloads and independent provider
models, and publish only after persistence. Agents settings use Agents (bot) and
Clients (terminal) tabs with search reveal. No flat config is created. Runtime
choices are ACP-only; deferred historical preferences remain readable without
becoming execution authority or changing during unrelated edits.

Provider model sources retain saved choices on unavailable catalogs, reject
cross-provider entries and fence stale or disposed asynchronous results.
Fallbacks read the latest durable model, and failed inventory/default writes
preserve that choice and report through the existing notification service.
Registered tool controls retain first-party defaults, explicit community opt-in
and legacy owner migration. Tool/settings subscriptions and option sources
belong to the registering plugin and are disposed with it. Settings catalog
qualification alone does not mount the bundled AI plugin or admit execution.

## Retained History and Catalog panels

History retains local-first conversation search, folder scope, active selection,
archive/restore/delete and unavailable-record diagnostics. Catalog retains owner
grouping, reserved commands, skill precedence, filtering, explicit tool opt-ins
and source-file navigation. Both reuse the existing tree, toolbar and workspace
presentation, with plugin-owned subscriptions and stale-result fences. Action
failures retain current content and report through the owning App; unmount
releases listeners and prevents late refresh publication.

Indexed History hits require a current local record and retain local metadata;
index-only text matches remain visible. Index failure falls back to local
folder, title and transcript matches without resurrecting deleted records.
Tree/action labels include visible timestamps, archive status, tool effects and
skill-shadowing status. Conversation menu actions use the public selection
event.

Panel intake does not restore controller execution or admit native processes.
Native integration and full bundled-plugin registration keep their original
M10.2 gates.

## Owned AI workspace integration

The desktop plugin retains the `ai` identity, view IDs, command access and
compatible plugin data. A fresh owned application scope is created per enable;
disabled/Safe Mode startup cannot allocate native clients. Runtime/model ports
are bound to the owning App. Missing admission reports the existing unavailable
state; production never falls back to a fake provider or a deferred native mode.

Chat bootstrapping fences disposed results and synchronizes availability and
composer defaults before accepting input. The first durable location assignment
does not remount the panel. Explicit conversation changes serialize panel
replacement. Disable awaits panel, settings, indexing, memory and service
cleanup before the owner may close its database. Scheduled work cannot restart
after disposal. An explicit first location replaces an unbound panel; the
controller's first durable assignment uses the base state setter and retains its
own live panel. Controller cleanup also runs when a chat is removed during
bootstrap. History and Catalog drain started reads and actions after detaching
their subscriptions; their owning view forwards that drain to plugin shutdown.
Closing scopes reject new conversation creation, navigation and settings writes;
registered command callbacks become inert while asynchronous disable drains.
Chat drains started actions and transcript checkpoints. Late saved-session reads
cannot start resume after closure; late resume acknowledgements release their
returned session without attaching it. Closing prevents new bridge events and
summary work while retaining checkpoints already in progress.
Operation-ownership callbacks do not become reactive effect dependencies.
Disable/re-enable scenarios use the public plugin manager so saved views restore
through its normal missing-view recovery path.

Chat, History and Catalog placements use the same production plugin/view
registration in real disposable WorkspaceShell Apps. Their six original
placement, paint, geometry, interaction and public example assertions remain;
catalog clients do not qualify native execution or authenticated tool IPC.
Shells mount after plugin and layout boot, matching the original App fixture.
The catalog pre-optimizes portable redaction, schema and JSONL icon imports
before loading plugin stories so cold startup cannot reload an active test
mid-import.

## Retained JSONL file preview

Enabled AI retains the file-only `ai-jsonl` view and default `.jsonl`
association. Validated transcripts reuse the durable chat projection; validated
agent events retain their timeline and structured records. Both compose the
reviewed nested shell described in [presentation](ai-presentation.md). Other
JSONL retains line-numbered records. Interrupted final appends preserve prior
records with a warning; terminated malformed records remain readable errors.

The preview has no composer or editing actions and never saves file content.
Vault changes refresh it through the existing file-view lifecycle. Filename
changes update schema selection after guarded writes/renames settle. Mounting
uses the retained file-view content host so reopening preserves the surface.
Pending view loads and component teardown belong to the AI scope; closing or
disabling cancels publication and drains owned work. Stored previews never start
or resume ACP; native admission and recovery stay separately gated.

`catalog/AI_MIGRATION.md` maps source differences and pending native cases.

Retained shell checks cover model preparation with a disabled, stable composer,
conversation menus and offline recovery, provider attribution and scope follow.
Catalog controls retain explicit expand/collapse and source navigation for both
commands and skills. The Notes copy's additional assertions remain required even
where its story names match maintained plugin cases. Test clients and timing
gates remain catalog-owned. Definite fixture heights retain full-window checks
on unnamed test canvases. Native dependency intake and ordinary execution
preserve separate admission gates.

User-wide command files use the native `~/.lapis/agents/commands` directory. An
admitted local main window may list, check, create missing files or replace one
named Markdown command. Names retain the public slash-command grammar; writes
stage/sync atomically, seeds never overwrite existing commands, and IPC cannot
choose directories or follow escaping symlinks. AI execution stays gated.
Subscribed stores poll bounded admitted inventories every second without
overlapping reads or repeated errors. Last unsubscribe stops polling; closure
drains reads and fences late results. File commands have no duplicate app rows.

Native physical-vault admission is shared service code under `vault/admission`.
AI and repository consumers retain separate registry instances: enabling or
revoking one never grants or releases another. The AI adapter retains its
original two-phase ticket, generation, reload, close and worker-retirement
rules; no command, event, permission or prompt behavior changes with this
refactor.

E-AI-026/027 qualify six cold default ACP compatibility cases against Lapis AI
`6ce65ebb`/`87958267`, including the native factory, with physical foreground
assistance and unchanged focus assertions. LD-AI-001/M10.1 retain their original
gate; actual managed capture and AgentStore/ThreadStore adoption remain M13.3.

[Native adapter records](ai-adapter.md) retain frame provenance, capture privacy
and deferred managed-store receipt requirements.

E-AI-105 refines the approval selection marker; LD-AI-002/004 remain unchanged.

E-AI-106/112: collapsed chat navigation and header menu; execution is unchanged.

E-AI-110 adds shared unit-aware Max VRAM input and host-owned GGUF browsing;
selection remains separate from explicit import and preserves the existing
compute lifecycle.
