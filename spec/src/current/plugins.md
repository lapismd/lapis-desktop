# Desktop plugins and catalog

The delivery sequence is root `PLUGIN_MIGRATION.md`. M8–M10 are authorized;
their original aggregate gates remain in the task ledger. Ordinary popup
admission remains the separate M7.3 task. Local dependency links retain public
package boundaries and owning-repository validation.

## Requirements

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-CAT-001     | Desktop MUST own a standalone Svelte/Vite Storybook with documentation, light/dark controls, desktop typography, narrow layouts, static build and browser interaction/accessibility commands. Stories MUST render production components through public dependencies.                                                                           |
| LD-CAT-002     | Default catalog execution MUST require no native process, sibling service or credential. App-backed fixtures MUST own disposable in-memory Apps and injectable clients, clean up resources and remain excluded from application bundles.                                                                                                       |
| LD-PLUG-001    | AI and Terminal MUST be bundled desktop-owned plugins retaining `ai` and `terminal` identities, commands, settings, views, conversations and explicit disabled preferences. Safe Mode MUST prevent optional activation. Bundled implementations MUST take precedence over installed copies without duplicate registration.                     |
| LD-TERM-001    | Terminal MUST use lapis-terminal's public viewport, rendered-frame client and Tauri adapter. Rust MUST resolve opaque targets into admitted executable, environment and working-directory policy; the renderer MUST NOT submit arbitrary launch specifications. Native services MUST start lazily.                                             |
| LD-TERM-002    | Moving, hiding or detaching a Terminal view MUST retain its shell. Reload MUST reconnect retained sessions. Explicit tab closure, plugin disable, vault closure, admission revocation and actual exit MUST release affected shells; cancelled close MUST retain them. Scoped teardown MUST NOT stop another window's sessions.                 |
| LD-TERM-003    | Terminal MUST preserve shell/cwd preferences and bottom-panel commands. Full restart MUST restore an explicit Start action rather than launch shells automatically. Desktop stories and cold native acceptance MUST cover input, resize, scrolling, errors and retained-session lifecycle.                                                     |
| LD-PLUG-002    | Web MUST expose no AI/Terminal connection settings, activation paths, environment attachment or service connection attempts. Existing installations of those IDs MUST be skipped as desktop-only. Saved conversations, settings and layout MUST remain; obsolete dedicated connection secrets MUST be removed without deleting unrelated data. |
| LD-PLUG-003    | Portable plugins MUST reuse App-owned database, metadata, guarded writes and watch reconciliation. Bookmarks, Wordcount and Slides qualify before Bases and History; Search and Graph MUST retain completed M6 behavior. Optional additions MUST remain user-disableable and vault-isolated.                                                   |
| LD-PLUG-004    | Markdown Lint and Spellcheck MUST use existing browser workers/WASM from packaged production URLs with correct MIME and CSP. Disable MUST terminate owned workers/subscriptions. Semantic models MUST remain separately enabled with explicit preparation and no compute dependency.                                                           |
| LD-INSTALL-001 | Dynamic plugin loading MUST select Tauri desktop explicitly, verify signed hashes/compatibility and share API/Svelte identities. It MUST reject unsupported Node, Electron and native-service entries before activation while distinguishing unsupported capabilities from disabled supported services.                                        |
| LD-INSTALL-002 | Compatible dynamic plugins MUST install, enable, disable, update and uninstall without rebuilding the app. Unsafe live replacement MUST require reload. Failure and restart MUST preserve recoverability and release resources. Bundled AI/Terminal identities MUST resist replacement and duplicate activation.                               |
| LD-AI-001      | Desktop AI MUST use a reusable lapis-ai Tauri adapter for direct ACP with host-owned executable/root/credential policy, correlated ordered events, exact permission option IDs, model/configuration selection, cancellation and teardown. Each single-turn worker MUST remain isolated; uncertain submissions MUST NOT replay automatically.   |
| LD-AI-002      | Desktop MUST retain current AI UI, conversations, app tools, context and memory while adapting the pre-controller ACP seam. Injected context MUST remain distinct from authored messages. Old controller IDs MUST NOT become ACP session IDs; unsupported resume MUST create an explicit new binding and context handoff.                      |
| LD-AI-003      | Application tools MUST use a bundled Rust bridge with private authenticated IPC, existing registry/vault authorization, guarded edits and approval UI. Credentials MUST remain native-side. Unknown permission options MUST NOT approve. Packaged lapis-agent qualification MUST precede external adapters with explicit prerequisites.        |
| LD-AI-004      | Migrated AI stories MUST retain applicable source scenarios and unique regression coverage, use fake clients by default and replace live-controller scenarios with native acceptance. Native chat, cancellation, approval, reads/edits, recovery, isolation and process cleanup MUST pass without ai-controller.                               |
| LD-COMP-001    | Optional compute MUST default to no sharing, no model download and no automatic cloud fallback. Explicit download/import/start/stop and existing mutually admitted pairing MUST qualify independently of ACP. Non-streaming inference MUST remain explicit; embeddings and cross-app singleton management remain outside scope.                |

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
