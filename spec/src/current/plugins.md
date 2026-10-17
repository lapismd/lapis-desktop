# Desktop plugins and catalog

The delivery sequence is root `PLUGIN_MIGRATION.md`. M8–M10 are authorized;
their original aggregate gates remain in the task ledger. Ordinary popup
admission remains the separate M7.3 task. Local dependency links retain public
package boundaries and owning-repository validation.

## Requirements

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-CAT-001     | Desktop MUST own a standalone Svelte/Vite Storybook with documentation, light/dark controls, desktop typography, narrow layouts, static build and browser interaction/accessibility commands. Stories MUST render production components through public dependencies.                                                                                                                                                        |
| LD-CAT-002     | Default catalog execution MUST require no native process, sibling service or credential. App-backed fixtures MUST own disposable in-memory Apps and injectable clients, clean up resources and remain excluded from application bundles.                                                                                                                                                                                    |
| LD-PLUG-001    | AI and Terminal MUST be bundled desktop-owned plugins retaining `ai` and `terminal` identities, commands, settings, views, conversations and explicit disabled preferences. Safe Mode MUST prevent optional activation. Bundled implementations MUST take precedence over installed copies without duplicate registration.                                                                                                  |
| LD-TERM-001    | Terminal MUST use lapis-terminal's public viewport, rendered-frame client and Tauri adapter. Rust MUST resolve opaque targets into admitted executable, environment and working-directory policy; the renderer MUST NOT submit arbitrary launch specifications. Native services MUST start lazily.                                                                                                                          |
| LD-TERM-002    | Moving, hiding or detaching a Terminal view MUST retain its shell. Reload MUST reconnect retained sessions. Explicit tab closure, plugin disable, vault closure, admission revocation and actual exit MUST release affected shells; cancelled close MUST retain them. Scoped teardown MUST NOT stop another window's sessions.                                                                                              |
| LD-TERM-003    | Terminal MUST preserve shell/cwd preferences and bottom-panel commands. Full restart MUST restore an explicit Start action rather than launch shells automatically. Desktop stories and cold native acceptance MUST cover input, resize, scrolling, errors and retained-session lifecycle.                                                                                                                                  |
| LD-PLUG-002    | Web MUST expose no AI/Terminal connection settings, activation paths, environment attachment or service connection attempts. Existing installations of those IDs MUST be skipped as desktop-only. Saved conversations, settings and layout MUST remain; obsolete dedicated connection secrets MUST be removed without deleting unrelated data.                                                                              |
| LD-PLUG-003    | Portable plugins MUST reuse App-owned database, metadata, guarded writes and watch reconciliation. Bookmarks, Wordcount and Slides qualify before Bases and History; Search and Graph MUST retain completed M6 behavior. Optional additions MUST remain user-disableable and vault-isolated.                                                                                                                                |
| LD-PLUG-004    | Markdown Lint and Spellcheck MUST use existing browser workers/WASM from packaged production URLs with correct MIME and CSP. Disable MUST terminate owned workers/subscriptions. Semantic models MUST remain separately enabled with explicit preparation and no compute dependency.                                                                                                                                        |
| LD-INSTALL-001 | Dynamic plugin loading MUST select Tauri desktop explicitly, verify signed hashes/compatibility and share API/Svelte identities. It MUST reject unsupported Node, Electron and native-service entries before activation while distinguishing unsupported capabilities from disabled supported services.                                                                                                                     |
| LD-INSTALL-002 | Compatible dynamic plugins MUST install, enable, disable, update and uninstall without rebuilding the app. Unsafe live replacement MUST require reload. Failure and restart MUST preserve recoverability and release resources. Bundled AI/Terminal identities MUST resist replacement and duplicate activation.                                                                                                            |
| LD-AI-001      | Desktop AI MUST use a reusable lapis-ai Tauri adapter for direct ACP with host-owned executable/root/credential policy, correlated ordered events, exact permission option IDs, model/configuration selection, cancellation and teardown. Each single-turn worker MUST remain isolated; uncertain submissions MUST NOT replay automatically.                                                                                |
| LD-AI-002      | Desktop MUST retain current AI UI, conversations, app tools, context and memory while adapting the pre-controller ACP seam. Injected context MUST remain distinct from authored messages. Old controller IDs MUST NOT become ACP session IDs; unsupported resume MUST create an explicit new binding and context handoff. Unresolved turns/tools MUST remain interrupted or unknown and MUST NOT be projected as completed. |
| LD-AI-003      | Application tools MUST use a bundled Rust bridge with private authenticated IPC, existing registry/vault authorization, guarded edits and approval UI. Credentials MUST remain native-side. Unknown permission options MUST NOT approve. Packaged lapis-agent qualification MUST precede external adapters with explicit prerequisites.                                                                                     |
| LD-AI-004      | Migrated AI stories MUST retain applicable source scenarios and unique regression coverage, use fake clients by default and replace live-controller scenarios with native acceptance. Native chat, cancellation, approval, reads/edits, recovery, isolation and process cleanup MUST pass without ai-controller.                                                                                                            |
| LD-COMP-001    | Optional compute MUST default to no sharing, no model download and no automatic cloud fallback. Explicit download/import/start/stop and existing mutually admitted pairing MUST qualify independently of ACP. Non-streaming inference MUST remain explicit; embeddings and cross-app singleton management remain outside scope.                                                                                             |

## Qualification and handover

M8.0 catalogs the production VaultLauncher and NotesWorkspace, with injected
picker clients and a disposable in-memory vault/database session. The real
workspace owns its App, plugin loading, note editing and teardown. Both themes
run at desktop and narrow viewport sizes. Native test entrypoints and production
Vite startup are not loaded by the catalog host.

Each stage records source revisions, public import boundaries, exact tests,
failures, source-to-destination story coverage and native evidence separately.
Local links do not bypass source checks. Deno desktop remains frozen. Retain
license notices and attribution when moving plugin code. Retire old active
distribution/story registrations only after replacements pass.

Roles/CV, Docs, Tasks, both Sync variants and the parked Community plugin remain
excluded. Application signing, publication and other-platform distribution stay
outside M8–M10. Dynamic package signature verification remains required.

## Terminal host integration

The bundled Terminal uses the local `@lapismd/terminal` built public exports and
Rust Tauri plugin. The private migration app records this unpublished local link
as a temporary development prerequisite; distribution must resolve it later.
Native code reads compatible shell/cwd preferences from admitted vault state,
validates executable files and confines cwd to that physical vault. The renderer
submits only opaque target and request identities.

App-owned session coordination separates viewport detach from explicit close.
Confirmed reload suspends its admission after guarded persistence and reconnects
the same native process; cold restart never launches a shell. Plugin disable,
vault return and trust revocation release only their window admission. Native
exit cleanup remains owned by the public terminal plugin.

Terminal settings use the public controlled plugin-settings definition: plugin
data owns shell/cwd values, subscription cleanup follows plugin disable and the
workspace does not create a second application-configuration writer. New-shell
commands drain admitted data operations before reading native launch policy.

## Web retirement

M8.2 applies App-owned compatibility restrictions in the Notes API before
external manifest indexing and evaluation. The Web host chooses the retired
identities, removes dedicated obsolete connection tokens after configuration
load and retains conversations, plugin data, enabled choices and layout. The Web
product graph excludes service bridges, clients, settings and environment
attachment; development-only catalog helpers retain their separate owner.

## Portable plugin asset admission

M8.3 reuses the public Notes asset-server contract and explicit Tauri execution
selection. A Tauri session selects the portable workspace ESM entry; Electron,
Node and CommonJS compatibility entries cannot execute. Supported portable
plugins remain dynamically installed rather than entering the static profile.

Bundled-origin assets use
`/__lapis/plugins/<admission>/<plugin>/<version>/<fingerprint>/<path>`. Rust
resolves the opaque resource admission through the existing physical vault
capability, reads the installed record and validates version, installation
fingerprint, declared size and SHA-256 before returning bytes. Relative chunks
share the same installation identity. Paths remain confined to that plugin;
unknown records, unsupported MIME, traversal, queries, stale metadata, changed
bytes and revoked admissions fail closed. GET and HEAD are the only methods.
Worker and WASM assets use the production origin with their correct MIME types;
no Node/Deno runtime, unrestricted file URL or global filesystem grant is added.
Signature verification remains owned by the existing installation pipeline.

The build-owned initial import map exposes only approved portable API, Markdown
embed, editor and exact Svelte renderer contracts through the same Vite graph.
Configured installations load after static plugins; bundled identities retain
precedence. Notes teardown disables every loaded instance after guarded saves.
The native asset route is a bundled-production-origin capability; Vite
development startup reports it unavailable rather than exposing vault files
through Node.

Until the M10 bundled replacement is registered, external `ai` installations are
unavailable under the App-owned host policy. Preserved conversations and
disabled preferences do not activate the retired controller integration.
Terminal already retains its qualified bundled precedence.

Native Notes reuses the public Workspace plugin Settings pages for installed
plugin control and diagnostics. The Core page retains all App Shell and Lapis
managed sources through their owning lifecycle. The existing signed distribution
client may fetch HTTPS registry metadata and artifacts; no broad native network
or process permission is introduced.

Harper’s existing signed runtime creates a production-origin Blob module worker
and embeds its WASM as a data URL in a signed JavaScript chunk. Native CSP
admits that worker and embedded binary fetch, alongside ordinary fingerprinted
worker and WASM assets. Acceptance distinguishes those existing packaging forms
and requires real Harper diagnostics and owned worker termination.

## Signed installation qualification

The desktop bootstrap passes optional host-owned distribution options through
the existing public App constructor. Ordinary startup uses the SDK's embedded
trust and transport defaults. Only the separately compiled native acceptance
entry supplies ephemeral public test keys and fixture transport; no private
manager fields, installer replacements or test trust enter ordinary builds.
Acceptance installs signed bundles through `App.pluginDistribution` and native
vault IO. Seeded installations alone cannot qualify M9.

Desktop owns the Plugins ribbon, command, protocol navigation and view
registration. They compose the existing public Workspace `PluginsView` and
`openPluginBrowser` boundary before layout restoration. The same App owns
Settings, signed distribution and view teardown; no replacement installer or
desktop-specific Plugins screen is introduced.

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

App-owned handoff restores the pre-controller full/delta/summary-tail projection
with verified transcript hashes, explicit target bindings and bounded evidence.
Private reasoning is excluded and tool output is labeled untrusted. Handoff
never resumes a provider or changes the stored authored messages.

Handoff budgets must be finite whole token counts and cannot exceed the default
maximum. Tiny excerpts stay bounded. Stored summaries must match the selected
conversation and fit actual-content as well as recorded-estimate limits before
their transcript hash is checked. Invalid summaries fall back to full evidence.

The desktop ACP seam consumes raw control-v3 through public typed clients. It
retains provider observations and event provenance, maps known activity once,
and preserves unknown extensions. Permission options retain exact IDs and
unknown semantic kinds; no default options or automatic approval are invented.
Interrupted or uncertain terminal outcomes remain explicit failures.

The adapted ACP runtime attaches before configuration and never submits its
request prompt during startup. It confirms the requested approval mode and
selected configuration before allowing a turn. Preparation belongs to the active
turn, so cancel/close can fence late dispatch. Unknown submission or unusable
outcomes block that session without replay. Detach preserves the native worker;
close releases it. Failed startup locates its original request for cleanup and
retains cleanup errors. Resume, skills, restricted maintenance and arbitrary MCP
declarations remain unavailable until their admitted application integration.

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

Chat state, settings persistence and visible transcript projection remain
app-owned. Projection excludes raw reasoning, redacts durable tool detail and
retains conversation identities without provider resume conversion. Generic
Design Core presentation helpers are consumed directly from public exports.

Live and restored approval presentation follows the selected advertised option
kind, never an ID prefix. Unadvertised live choices reject; historical unknown
choices remain visible with neutral answered status. This display projection
cannot dispatch a permission or infer approval from an unknown option.

Memory policy remains desktop-owned: episodic ingestion, deterministic candidate
promotion, evidence verification, bounded owner-only automatic recall, explicit
forget exclusions and leased maintenance reuse public AppDatabase and Vault
contracts. Portable capture sanitizes derived reads/writes and fails closed on
omission or changed execution locations. Native credential-detector admission
remains part of M10.3; portable capture alone cannot qualify it.

Authoritative schema-1 Markdown/YAML records, exact revision preimages,
conversation hashes and opaque evidence refs retain their formats. Only
disposable synthetic index segments escape literal tildes before percent
escapes; catch-up rebuild removes obsolete paths without rewriting source
records. Cancelled maintenance cannot start after cancellation during runtime
selection or send after cancellation during startup. Restricted model
maintenance remains unavailable in the native adapter until its admitted
integration is implemented.

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

The owned chat panel retains the source composer, permission/question cards,
conversation folder picker, timeline, tool-result views, mentions, skills, model
selection and error/retry presentation. Responsibility-specific components and
reactive state modules retain the original behavior within source limits. New
composer menus offer ACP choices only; historical native-mode labels remain
readable without enabling those deferred execution paths.

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

The isolated Chromium catalog collects discarded test graphs after each file,
using a test-only exposed collector. Missing collector support fails the run.
This resource policy retains fixture teardown, test isolation, all four
theme/viewport lanes, accessibility rules and unhandled-error reporting. It does
not expose collection in the application or change native lifecycle gates.

## Retained AI settings

AI reuses the existing declarative Settings fields and controlled plugin-data
source. Durable writes serialize, retain historical payloads and independent
provider models, and publish only after persistence succeeds. Settings do not
create flat application-configuration values. New runtime choices are ACP-only;
deferred historical preferences remain readable without becoming execution
authority or being silently rewritten by an unrelated edit.

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
agent events retain their timeline and structured records. Other JSONL retains
line-numbered records. Interrupted final appends preserve prior records with a
warning; terminated malformed records remain readable errors.

The preview has no composer or editing actions and never saves file content.
Vault changes refresh it through the existing file-view lifecycle. Filename
changes update schema selection after guarded writes/renames settle. Mounting
uses the retained file-view content host so reopening preserves the surface.
Pending view loads and component teardown belong to the AI scope; closing or
disabling cancels publication and drains owned work. Previewing stored data
never starts or resumes an ACP session. This does not qualify ordinary bundled
native AI admission or its recovery gate.

`catalog/AI_MIGRATION.md` compares all 56 maintained plugin and 49 Notes AI
scenario exports, including differing plays. Remaining shell/native cases stay
explicit; additional desktop regression counts cannot replace them.

Retained shell checks cover model preparation with a disabled, stable composer,
conversation menus and offline recovery, provider attribution and scope follow.
Catalog controls retain explicit expand/collapse and source navigation for both
commands and skills. The Notes copy's additional assertions remain required even
where its story names match maintained plugin cases. Test clients and timing
gates remain catalog-owned. Fixtures own definite viewport heights; full-window
geometry checks also apply to unnamed test canvases. Ordinary native execution
keeps its separate gate.

Native dependency intake records qualified `lapis-ai` source independently of
runtime admission. Locked normal/e2e checks remain required; source changes do
not grant production capabilities.
