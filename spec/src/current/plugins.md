# Desktop plugins and catalog

E-AI-094 adds agent context/permissions review stories using production editors,
MarkdownComposer and the embedded chat shell. Shared mode icons are preoptimized
for cold catalog runs. Plugin registration, isolation and lifecycle are
unchanged.

The active chat/settings profile is [local ACP](ai-local-history.md). Native
conversation storage controls and catalog fixtures are retired; grouped AI
settings and production-backed agent/mention stories remain.

E-CATALOG-016 completes the M8.5 native conflict gate with current production
components and the shared API close policy. Catalog states and native IO remain
separate evidence; provider, managed AI and release gates are unchanged.

E-REPO-054 retains the sync/upstream production stories and failure toasts. The
success story awaits final synchronization state after publication; fake
provider interaction/axe proof cannot qualify native or live-provider IO.

E-CATALOG-015 maps editable core Workspace file exclusions, persistence and live
discovery to the existing App-backed Settings story without History.

E-REPO-044 covers remembered blame wrapping, long source lines, viewport resize
and measured virtual attribution through production plugin components.
E-REPO-055 checks the inset repository shell in a 320–480px right sidebar,
retaining its right border and internal source scrolling in both wrap modes.

E-AI-064 covers viewport recovery and a real held fake-agent turn in both chat
views, with the existing App-backed shell and public Design Core archive.

E-REPO-043 maps upstream action/count states and external repository reveal to
production plugin settings/status stories. Fixtures inject providers and record
intent without real network publication or file-manager launch.

Catalog browser files run serially through the browser-pool option; the outer
Vitest file option alone does not bound that pool. Existing assertions and
deadlines remain unchanged.

The shell reserves a full-width status footer beneath ribbon, sidebars and
content. Repository/backup controls and Problems occupy the left; activity uses
the fixed centre; editor information and the permanent bell occupy the right.
Panels/plugins MUST NOT reserve overlay clearance. Ribbon Settings complements
the sidebar action (E-CATALOG-009/010).

E-REPO-039–041 embed backup/forge controls in registered plugin Settings,
retaining plugin-owned work, transient reply fencing and local provenance.
E-AI-042–061 adds local Codex, explicit imports and the reviewed shared
transcript/inbox. JSONL readers reuse the same read-only renderer; local tools
stay inline, with App-owned links, attachment state and exact capture offsets.
[AI presentation](ai-presentation.md), [imports](ai-imports.md) and
[vault backup](vault-backup.md) retain independent admission and lifecycle.
Native, provider, JJ, distribution and visual gates remain separate. E-AI-041
promotes the shared transcript into the ordinary AI plugin under standing
implementation approval. Vault-owned presentation defaults to Document; Classic
uses the same controller/readers. Recorded model transitions, usage, copy/retry
actions and pending requests remain. Source scroll containment keeps the footer
anchored; native/provider/restart gates remain separate.

E-REPO-025 qualifies working-copy status after visual confirmation. The final
Storybook Vite hook MUST retain owned watcher exclusions for `.jj`, native build
outputs and generated artifacts; the builder replaces the file's server block.
Repository bookkeeping/builds cannot flood the dependency graph. Source changes
retain live reload. A filesystem watcher regression exercises the final hook.

E-REPO-024 adds the production working-copy status control and six disposable
review states. The plugin owns its split buttons, popover and setting through
public status-item mount/dispose contracts. The compact control has no border, a
subtle status-bar-relative fill and a slightly stronger refresh fill. Native
status acceptance and visual approval remain separate from catalog results.

E-REPO-023 adopts E-REPO-019–022 after user confirmation. Blame stories now
render production presentation with injected fixture statistics; duplicate
review components and row CSS overrides are removed. Editor actions, commit
navigation, shared scrolling and row surfaces retain separate native evidence.

E-REPO-021/022 preview JJ Log and Op Log resting rows on the AppShell
`--background` surface (white in light mode), including regular plugin views
opened inside any story. Catalog CSS targets only application-owned graph hosts;
headers, hover and selected states retain their styling. E-REPO-023 records
production adoption.

E-REPO-020 refines only the blame review: attribution sticks below the file
header until the next group pushes it away; one Design Core shadcn ScrollArea
viewport scrolls both columns. Sample commits use `dev@lapis.md` (E-REPO-022) to
exercise the existing Gravatar/profile presentation. Shipping/native behavior is
unchanged.

The review omits the attribution/source divider and uses a compact line-number
gutter. Horizontal separators belong to source-group boundaries; sticky labels
do not add another border beneath the file header.

Blame review stories start with both sidebars collapsed. The editor-action story
retains its Files sidebar so the action can be exercised.

E-REPO-019 is a Storybook-only blame layout proposal. Commit hover cards show
only the first message line, clamped to two wrapped lines with ellipsis. Its
catalog-owned copies remove the inner title/operation line, align source
separators and end the divider at the last row's bottom border. Preview-only
FileView actions use `git-merge-conflict`; commit title hover/focus shows a
two-line-clamped subject with sample diff counts. No native blame fields or
shipping registrations changed in that preview. E-REPO-023 records subsequent
user-authorized adoption. The large preview uses local controller source with
twelve synthetic commits, six authors and varied group sizes; virtual scrolling
retains the final border.

E-REPO-018 adds recorded file blame, sidebar Empty/icon states, aligned header
and representative repository loading skeletons. Production stories retain
separate native/provider/visual gates; E-REPO-017 owns original file history.

E-REPO-016 qualifies delayed startup work and worker-failure toasts through real
production hosts. LD-CAT-001/002/003 fixtures remain disposable; actual workers
and ordinary native startup have separate evidence. See
[background](background.md).

E-REPO-015 promotes reviewed repository presentation to production.
LD-CAT-001/002/003 retain public dependency ownership and disposable injected
fixtures. Rich picker rows use accessible grids; source AppShell hosts keep
conflict overlays outside inert Main. Focused repository tests qualify UI only;
native gates stay separate.

E-CATALOG-008 qualifies scoped preview commands, live identity/index checks,
cache safeguards and actual cold/HMR proof; all 804 catalog checks pass.

E-REPO-010 maps stacked operation/file cards and unloaded-parent recovery to
production repository stories. No native plugin capability changes.

E-REPO-009 maps compact history/Op Log headers to production Column Canvas
composition. Header review covers narrow panes and both themes; the complete
repository family retains pin, refresh, loading and recovery coverage.

`PLUGIN_MIGRATION.md` authorizes M8–M10 under the original ledger gates.
Ordinary popup admission remains M7.3. Local links retain public package
boundaries and owning-repository validation.

## Requirements

The development catalog retains component/style HMR and reconstructs its owned
App/controller instances after runtime-script or fixture changes. Those changes
must trigger a full preview reload; retained old class/state shapes cannot be
treated as current implementation. Reload scope stays within this checkout's
`src` runtime scripts and `catalog/support` fixtures. Generated outputs and
sibling repositories do not trigger this lifecycle policy.

Managed preview commands retain the foreground launcher and use literal loopback
with an exact selected port. Start/restart preflight installed CLI and
configuration before stopping an existing managed process. Stop verifies the
recorded PID, owner, start time, command and checkout directory against live OS
state; stale records and unowned listeners grant no signal authority. Commands
serialize through a checkout-owned lease. Startup/stop failures retain unknown
ownership until confirmed cleanup; unrelated/native processes remain untouched.
Cache maintenance defaults to a dry run. Applying it requires no detected live
checkout Storybook/Vite/Vitest Node consumers and admits only the two named
dependency caches, with no symlink traversal. Native data, fixtures and static
deliverables remain outside cleanup. Logs and bounded ownership records stay
ignored.

Status distinguishes a verified listening process whose story index responds
from an owned but unready process. Unready observations preserve ownership and
cannot authorize another start; they remain explicitly stoppable.

| ID             | Requirement                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LD-CAT-001     | Desktop MUST own a standalone Svelte/Vite Storybook with documentation, light/dark controls, desktop typography, narrow layouts, static build and browser interaction/accessibility commands. Stories MUST render production components through public dependencies.                                                                                                                                                     |
| LD-CAT-002     | Default catalog execution MUST require no native process, sibling service or credential. App-backed fixtures MUST own disposable in-memory Apps and injectable clients, clean up resources and remain excluded from application bundles.                                                                                                                                                                                 |
| LD-CAT-003     | Every implemented desktop-only user-visible state and plugin MUST have a discoverable Storybook scenario using its production surface and the smallest real shell needed. Coverage MUST include loading, empty, failure, recovery, disabled and normal states where applicable, remain mapped in the catalog inventory, and expand with new desktop behavior. Fixtures MUST remain disposable and native gates separate. |
| LD-PLUG-001    | AI and Terminal MUST be bundled desktop-owned plugins retaining `ai` and `terminal` identities, commands, settings, views, conversations and explicit disabled preferences. Safe Mode MUST prevent optional activation. Bundled implementations MUST take precedence over installed copies without duplicate registration.                                                                                               |
| LD-TERM-001    | Terminal MUST use lapis-terminal's public viewport, rendered-frame client and Tauri adapter. Rust MUST resolve opaque targets into admitted executable, environment and working-directory policy; the renderer MUST NOT submit arbitrary launch specifications. Native services MUST start lazily.                                                                                                                       |
| LD-TERM-002    | Moving, hiding or detaching a Terminal view MUST retain its shell. Reload MUST reconnect retained sessions. Explicit tab closure, plugin disable, vault closure, admission revocation and actual exit MUST release affected shells; cancelled close MUST retain them. Scoped teardown MUST NOT stop another window's sessions.                                                                                           |
| LD-TERM-003    | Terminal MUST preserve shell/cwd preferences and bottom-panel commands. Full restart MUST restore an explicit Start action rather than launch shells automatically. Desktop stories and cold native acceptance MUST cover input, resize, scrolling, errors and retained-session lifecycle.                                                                                                                               |
| LD-PLUG-002    | Web MUST expose no AI/Terminal connection settings, activation paths, environment attachment or service connection attempts. Existing installations of those IDs MUST be skipped as desktop-only. Saved conversations, settings and layout MUST remain; obsolete dedicated connection secrets MUST be removed without deleting unrelated data.                                                                           |
| LD-PLUG-003    | Portable plugins MUST reuse App-owned database, metadata, guarded writes and watch reconciliation. Bookmarks, Wordcount and Slides qualify before Bases and History; Search and Graph MUST retain completed M6 behavior. Optional additions MUST remain user-disableable and vault-isolated.                                                                                                                             |
| LD-PLUG-004    | Markdown Lint and Spellcheck MUST use existing browser workers/WASM from packaged production URLs with correct MIME and CSP. Disable MUST terminate owned workers/subscriptions. Semantic models MUST remain separately enabled with explicit preparation and no compute dependency.                                                                                                                                     |
| LD-INSTALL-001 | Dynamic plugin loading MUST select Tauri desktop explicitly, verify signed hashes/compatibility and share API/Svelte identities. It MUST reject unsupported Node, Electron and native-service entries before activation while distinguishing unsupported capabilities from disabled supported services.                                                                                                                  |
| LD-INSTALL-002 | Compatible dynamic plugins MUST install, enable, disable, update and uninstall without rebuilding the app. Unsafe live replacement MUST require reload. Failure and restart MUST preserve recoverability and release resources. Bundled AI/Terminal identities MUST resist replacement and duplicate activation.                                                                                                         |

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

## AI and compute

Notes composes the bundled AI plugin through an App-owned native service factory
before loading optional plugins. Disabled and Safe Mode Apps allocate no native
clients. Catalog scenes mount NotesWorkspace with the production factory and
disposable named IO ports, including an unavailable agent and strict close/
reload resource ordering. These scenes qualify UI ownership, not native chat.

The [AI contract](ai.md) owns direct ACP, retained AI, tools, credentials and
optional compute under the original M10 gates. Shared plugin identity and
catalog requirements remain here.

## Shell presentation review

The current local Design Core intake combines main's 0.5.1 fixes with the
existing unpublished desktop guarded-close and plugin-transition contracts.
Consume prepared public archives through the ignored development overlay;
portable dependency ranges and the registry lock resolution remain tracked. This
review intake has no publication or native qualification claim.

Catalog previews show only product presentation. Terminal and AI fixtures keep
observations and fault/lifetime controls outside the product DOM. Terminal
starts with both sidebars collapsed and restores full viewport height after its
temporary resize observation. Recovery banners use opaque theme tokens and
meaningful action icons. File conflicts open Problems and use the shared
editable three-way comparison in a workspace view. The user has deferred suites
and native builds for this presentation slice; retain visual-pending and the
pending verification ledger.

Notes workspace ReadingNote and ReadingNoteDark review the actual Markdown
reading surface through its public source-owned archive. Short notes fill the
available pane; long-document scrolling remains owned by the existing shared
Scroll Area. Source stories cover short/long notes in both themes separately.

Repository-history integration qualifies this current review baseline through
public package artifacts. The catalog pre-bundles statically used conflict-view
icons so lazy plugin loading cannot replace a live test frame. Role queries use
the supported full-name matcher; interaction and accessibility rules remain
enabled. This qualification does not change conflict or persistence semantics.

History layout regression stories constrain the real shell while leaving the
browser wide. They assert actual pane-relative stacking, control bounds and
usable file-button width; viewport-only checks cannot prove narrow-pane use.
Shared interaction helpers retain the production ribbon and reader workflow.

E-REPO-007 adds production Column Canvas commit/operation-log stories, borrowed
jj-store graph/row geometry and independent Op Log registration. The coverage
inventory maps source provenance, loading, empty, snapshots, parent choice,
notification failures/recovery and exact History navigation. Native operation
qualification and visual approval remain separate from catalog evidence.

The primary pinned-history preview closes its disposable Files/Outline sidebars
through their real controls so desktop review shows the log and diff together.
NarrowPaneInWideShell retains the crowded-pane acceptance; preview choices do
not change application sidebar preferences. E-REPO-008 records this correction.

Automatic backup stories mount the production status control with owned service
lifetime, saving skeleton and failure/recovery toast. E-REPO-026 records the
focused catalog proof; LD-CAT-001/002/003 baseline/release gates are unchanged.

E-REPO-027 adds production file-restore and responsive initial-capture stories.
LD-CAT-001/002/003 teardown, loading, failure-toast and visual gates remain.

E-REPO-028 adds whole-vault restore and interrupted-command review to the
production-component restore stories; original catalog gates remain unchanged.

E-REPO-029 adds production GitHub account settings with token/device flows,
skeletons, cancellation and App feedback; native custody and catalog gates stay
distinct. No live account is required by catalog execution.

E-AI-045/047–053 retains local comments, addressed recipients, queues and
delivery; catalog proof cannot complete M10.2 native gates.

The native workspace host MUST set Design Core footer safe-area variables so
rounded window corners cannot clip edge controls (LD-HOST-001). Inline insets
are 0.5rem and the block-end inset is 0.25rem; the footer owns that clearance.
Its background remains full width, its status region stays centred and content
ends above its complete track. Hosted views/plugins MUST NOT add spacers.

E-CATALOG-012 verifies path tooltips, footer fades and popover clearance.
E-CATALOG-013 adds core listing exclusions and compact ring-free composition
through public packages. Native/plugin ownership and release gates stay
unchanged.

Restored Terminal tabs state that no shell is running and direct the user to
Start.

The AI plugin owns the Agents Settings category and its forge-style client
table. Disabling AI removes both AI preferences and Agents registrations.

E-AI-089 adopts reviewed chat presentation in the existing AI plugin. Plugin
identity, App ownership, disposal and public host boundaries are unchanged.
Native conversations augment normal ACP; no replacement plugin is introduced.

E-AI-095 extends the existing Native Notes binding and workspace-lifecycle
review stories with provider-discovery counters and bottom-panel/draft
assertions. LD-CAT-001/003 ownership and native gates remain unchanged; no
catalog fixture enters production. Cached metadata and status work retain
App/vault ownership.
