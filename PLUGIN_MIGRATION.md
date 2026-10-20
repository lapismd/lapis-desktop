# Desktop plugins, native services and Storybook

This combines the agreed desktop-owned plugin migration and Storybook work into
one delivery sequence. It replaces the earlier separate plugin plans.

## Authorized delivery and tracking

As of 2026-10-20, M8/M9 and M10.1 are Done; M10.2 remains In progress. M0–M7 and
M7.1/M7.2 retain their completed gates. M7.3 ordinary native windows are
qualified, and E-CATALOG-016 completes M8.5 native presentation. The earlier
2026-10-17 review pause was followed by resumed delivery.

[PLAN.md](PLAN.md) and the
[task ledger](spec/src/current/progress/milestones.md) schedule Stages 0–3 as
M8, Stage 4 as M9 and Stages 5–6 as M10. AI UI/shared transcript and native
store/privacy/read prerequisites are implemented; managed execution,
context/skills and durable conversation/restart qualification remain open under
M10.2/M13.3. M10.3 tools/credentials follow, then M10.4 optional compute. M7.3
ordinary pop-outs are complete before M11 distribution and M12 cutover. See
[the current checkpoint](PLAN.md#current-delivery-checkpoint). Record and commit
verified slices; a requested pause still stops work. This tracking refresh
starts no product work and completes no product gate.

The subsequent M14 automatic-backup workstream has all seven stages integrated
into main, including GitHub/Forgejo accounts and backup controls in plugin
Settings. Its [delivery ledger](spec/src/current/progress/vault-backup.md)
separates implementation/focused checks from deferred native/provider
acceptance. It does not revive either legacy Sync plugin excluded below.

The [plugin contract](spec/src/current/plugins.md) owns behavior; the task
ledger alone owns status and generates `MIGRATION.md`. Maintain story coverage
and plugin mappings with evidence; preserve the historical inventory and
records.

| Stage | Task  | Gate status | Required result                                                                   |
| ----- | ----- | ----------- | --------------------------------------------------------------------------------- |
| 0     | M8.0  | Done        | Desktop catalog, real composition, both themes, static build and interactions/axe |
| 1     | M8.1  | Done        | Bundled Terminal, scoped native lifecycle, retained settings and migrated stories |
| 2     | M8.2  | Done        | Web rejects AI/Terminal activation and makes no service connections               |
| 3     | M8.3  | Done        | Portable plugin persistence, freshness and packaged worker/WASM lifecycle         |
| 4     | M9.1  | Done        | Verified dynamic install/update/remove, shared identity and reserved bundled IDs  |
| 5A    | M10.1 | Done        | Reusable native ACP adapter with correlation, ownership and teardown              |
| 5B    | M10.2 | In progress | Desktop-owned AI, preserved conversations/context/memory and migrated stories     |
| 5C    | M10.3 | Planned     | Authenticated Rust app tools, exact approvals and native credentials              |
| 6     | M10.4 | Planned     | Explicit optional compute lifecycle and mutually admitted peers                   |

## 1. Scope and ownership

Make AI and Terminal **bundled, desktop-only plugins owned by `lapis-desktop`**.
Their presentation, commands, settings and Notes integration live in this
repository.

Both remain user-disableable, participate in Safe Mode and start native services
only when used.

| Component                                                            | Owner                    |
| -------------------------------------------------------------------- | ------------------------ |
| Terminal plugin, commands, settings and workspace integration        | `lapis-desktop`          |
| AI plugin, conversations, context, memory and Notes tool integration | `lapis-desktop`          |
| Desktop plugin stories, fixtures and integration tests               | `lapis-desktop`          |
| Terminal engine, PTY runtime, viewport and reusable Tauri adapter    | `lapis-terminal`         |
| ACP runtime, agent, compute and reusable Tauri adapter               | `lapis-ai`               |
| General plugin lifecycle, vault/database APIs and portable plugins   | Existing shared packages |

Remove AI and Terminal support from the web host. There is no replacement web
gateway or later web migration.

**Excluded from this workstream:** Roles/CV, Docs, Tasks, both Sync variants and
the parked Community plugin. Sync-only signing/key-custody work is excluded;
native credential handling required by AI remains in scope.

The desktop remains **Rust + WebView**, without a Node/Deno compatibility
runtime. Node/pnpm remain development tools.

## 2. Architecture and migration rules

### Desktop-owned service integration

Keep Terminal and AI client binding inside `lapis-desktop`. Their bundled
plugins receive desktop-owned clients before activation. Do not introduce shared
Notes API host-provider interfaces solely for these two plugins.

Continue using existing public APIs for plugin lifecycle, application tools,
vault access, database queries and notifications.

- Rust owns executable selection, environment, credentials, admitted roots and
  process lifetime.
- Native handles are scoped to the invoking window and vault.
- Disable, vault closure and trust revocation release the affected services.
- Renderer reload is a detach/reconnect operation, distinct from disabling a
  plugin.
- Register compiled services with the app, but start shells, ACP workers and
  models lazily.
- Native implementation updates ship through app updates.

Other compatible JavaScript/WASM plugins retain dynamic installation. They can
use supported host capabilities, but cannot introduce arbitrary Node services or
native executables.

Tauri permissions apply to windows/WebViews. Plugins sharing one JavaScript
realm retain the existing trusted-plugin model; this work does not introduce
per-plugin sandbox isolation.

### Existing installations and data

Preserve plugin IDs **`ai`** and **`terminal`**, compatible commands, settings
and saved view identities.

- Bundled implementations take precedence over older installed copies.
- Never activate both copies or register duplicate commands.
- Preserve conversations, plugin data and explicit disabled preferences.
- Migrate retained plugin code, tests and stories with source attribution and
  existing licence notices.
- Remove superseded standalone integrations from Notes's active distribution
  inputs after successful handover.
- Preserve published versions and repository history; do not unpublish packages.

These scoped AI/Terminal handover requirements supersede the root plan's general
permission to reset pre-release plugin state for the affected data only. They do
not add general `.obsidian` import or legacy-state migration requirements.

## 3. Ordered implementation

### Stage 0 — Establish desktop Storybook

Create a standalone Svelte/Vite Storybook in `lapis-desktop`.

Use `.storybook` for configuration, `catalog/plugins` for stories and
`catalog/support` for fixtures and harnesses.

Provide:

- `pnpm storybook`, `pnpm build-storybook` and `pnpm test:storybook`.
- Documentation, accessibility and Vitest browser interaction support.
- Shared light/dark controls, desktop typography and narrow-window scenarios.
- Explicit in-memory App instances and injectable fake service clients.

Stories render actual desktop production components. Production must not import
fixtures, stories or acceptance instrumentation, and application bundles must
exclude Storybook.

Consume reusable packages through public exports. Do not introduce
sibling-source aliases or copy library implementation to conceal package
defects.

Prove one desktop composition story first. Add Terminal stories during Stage 1
and AI stories during Stage 5.

**Storybook is a browser-based development tool; it does not restore web-product
AI or Terminal support.**

### Stage 1 — Terminal and its stories

Implement the desktop-owned Terminal plugin using `lapis-terminal`'s viewport,
client and Tauri adapter.

Preserve Terminal's commands, bottom-panel placement and compatible shell/cwd
preferences. Replace Ghostty and the old raw-output bridge together: the new
runtime sends rendered terminal frames.

Rust resolves preferences into admitted targets. The renderer requests an opaque
target rather than providing an arbitrary executable, environment or launch
specification.

Lifecycle:

- Moving, hiding or detaching a view preserves its shell.
- Renderer reload reconnects to a retained native session.
- Explicit tab closure stops that shell.
- Plugin disable or vault closure stops sessions for the affected window/vault.
- Full application restart restores layout with an explicit **Start** action.
- Cancelled application close preserves sessions; actual exit terminates them.
- Scoped cleanup must not invoke global disable in a way that stops another
  window's sessions.

Copy and adapt the existing `lapis-terminal` stories and fixtures for:

- Dock and workspace-pane placement, themes and narrow sizing.
- Unicode, IME, paste, copy and keyboard input.
- Resize, scrolling, exited sessions and high output.
- Recoverable errors and notification dismissal.
- Session retention through workspace interactions.

Application stories must use the real desktop plugin and workspace integration.
Keep reusable viewport/library stories maintained in `lapis-terminal`.

Add desktop-specific scenarios for restored sessions awaiting Start,
disabled/unavailable services and old installed-plugin precedence.

**Gate:** Storybook interaction/accessibility checks plus a cold packaged macOS
ARM64 terminal run.

### Stage 2 — Remove web AI and Terminal

Remove their web-host functionality:

- Connection bridges and URL/token settings.
- Environment-based attachment and advertised capabilities.
- Commands, UI activation paths and associated connection clients.
- Obsolete web-host setup documentation and tests.

Prevent web activation of `ai` and `terminal`, including previously installed
manifests that declared web compatibility. Discovery should identify them as
desktop features.

Preserve saved conversations, settings and layout data. Remove dedicated
obsolete connection secrets without deleting unrelated vault data.

Keep shared application-tool contracts required by desktop. Leave the frozen
Deno desktop unchanged.

**Gate:** web starts without these services, exposes no connection settings,
attempts no agent/terminal connections and safely skips existing installations.

### Stage 3 — Remaining portable plugins and shared services

Start with **Bookmarks, Wordcount and Slides**.

Confirm that the M5–M7 native file watching, reconciliation and database
freshness gates passed before qualifying **Search, Bases, Graph and History**.
Reuse completed foundation work rather than repeating it.

- Reuse existing Notes database, metadata and projection APIs over native Turso.
- Do not create a separate Rust database service for each plugin.
- Route external file changes through established vault/metadata events.
- Preserve guarded writes and existing history behaviour.
- Retain Search in the desktop default profile once qualified; if M6 has not
  already added it, add it here. Keep the other additions optional.

Qualify **Markdown Lint and Spellcheck** using existing worker/WASM
implementations.

- Package worker and WASM assets for Tauri's production origin.
- Verify asset URLs, MIME types and CSP.
- Tie workers and subscriptions to plugin lifetime.
- Terminate workers and release resources when disabled.

Optional semantic-search embeddings remain separately enabled through the
existing browser-worker interface and explicit model preparation. Search remains
useful without models and does not depend on `lapis-compute`.

**Gate:** internal/external edits refresh affected views, vaults remain isolated
and packaged workers run without Node/Deno.

### Stage 4 — Dynamic installation for other plugins

Port existing signed plugin distribution and asset loading to Tauri.

- Select the explicit desktop platform rather than inferring Electron from
  resource access.
- Load compatible workspace ESM and browser-worker/WASM entries.
- Reject Node-only, Electron-sidecar and unsupported native-service entries
  before activation.
- Preserve signature/hash verification, compatibility checks and shared
  API/Svelte module identity.
- Support install, enable/disable, update and uninstall without rebuilding the
  app.
- Honour reload-required updates where live module replacement is unsafe.
- Reserve the bundled `ai` and `terminal` identities against replacement or
  duplicate activation.

Required-service checks must distinguish unsupported capabilities from supported
services that are currently disabled.

No general subprocess executor or dynamic native binary installer is introduced.

**Gate:** signed-plugin lifecycle tests, invalid/incompatible package handling,
resource cleanup and bundled-ID collision coverage.

### Stage 5 — AI through direct ACP, with migrated stories

**Start with the pre-controller implementation.** Read
[AI_ACP_REFERENCE.md](AI_ACP_REFERENCE.md) before designing the adapter. It pins
the earlier `@lapis-notes/ai` plugin at `lapis-plugins` revision `27c1427a3aa3`
and its Notes host at `28bc7ab228bd`, with the later controller cutover
revisions for comparison. The earlier plugin supported direct ACP alongside
Codex Native; this migration selects only its ACP path.

Reuse the `AcpAgentRuntime` / `AcpRuntimeBackend` seam and applicable regression
tests, retaining current UI, conversation storage and fixes. Replace the old
desktop backend with the Rust `lapis-ai` Tauri client; recover app-owned types,
context handoff and memory logic from before controller extraction. A wholesale
rollback would reintroduce obsolete hosts and lose later fixes. The reference
maps the files, transport differences and permission fallback that must change.

Deliver AI in three independently reviewable slices.

**A. Reusable native adapter**

Implement the Tauri adapter in `lapis-ai`, wrapping its Rust clients. Desktop
supplies executable, workspace and credential policy. Support session lifecycle,
ordered events, request correlation, model/configuration selection, prompts,
exact permission responses, cancellation and teardown. Respect each ACP worker's
single-active-turn restriction and launch-fixed configuration. Concurrent
conversations use separately owned workers.

**B. Desktop-owned AI integration**

Move retained AI UI, settings, conversations, context preparation and memory
orchestration into `lapis-desktop`. Preserve existing presentation and storage
while replacing controller execution with direct ACP. Remove controller-owned
types and memory imports from the shipped desktop dependency path.

- Keep user-authored messages separate from injected context.
- Preserve old conversations without treating controller thread IDs as ACP
  session IDs.
- Create a new provider binding with explicit context handoff when genuine
  resume is unavailable.
- Record interrupted or unknown submissions.
- Never automatically replay an uncertain prompt or tool effect.

**C. Application tools and credentials**

Replace legacy JavaScript/Deno app-tool hosting with a bundled Rust bridge using
private authenticated IPC. Historical hosts used different transports; preserve
their authorization contract, not their runtime launch code. Retain the
application-tool registry, vault authorization, guarded edits and approval UI.
Forward exact provider permission option IDs; unknown options must not become
automatic approval. Credentials remain native-side. Qualify the packaged Rust
`lapis-agent` first. External ACP adapters have explicit prerequisites and
cannot assume the app supplies Node. Codex Native and OpenCode Native modes
remain deferred.

**AI Storybook migration**

Use the maintained `lapis-plugins` stories as the starting point, compare their
Notes counterparts and retain unique regression coverage. Copy the necessary
fixtures, examples and interaction helpers for:

- Chat submission/completion, cancellation and failure.
- Permissions, questions, tool activity and guarded edits.
- Model loading/selection, skills, mentions and search results.
- Memory recall, history, catalog and recovery.
- Workspace placement, tabs, narrow layouts and composer readiness.

Split oversized stories and harnesses to meet desktop limits. Adapt obsolete
runtime scenarios to ACP-only behaviour without losing applicable assertions.
Replace old live-controller stories with native acceptance scenarios. Do not
copy controller bridges, URL/token configuration or browser-host attachment into
desktop Storybook.

**Gate:** migrated stories pass, followed by native chat, cancellation,
approval, tool read/edit, recovery, isolation and process-cleanup acceptance
without `ai-controller`.

### Stage 6 — Optional compute last

Integrate `lapis-compute` as an independently enabled desktop AI capability.
Provide explicit model download/import/start/stop and optional peer pairing.
Sharing defaults off; startup downloads nothing and does not silently fall back
to cloud inference. Preserve the existing pairing protocol. Retain the current
non-streaming limitation. Cross-application singleton management and embeddings
support remain outside this slice.

**Gate:** explicit model lifecycle, disabled startup, peer admission, failures
and shutdown are qualified independently from ACP and Storybook fixtures.

## 4. Story migration and verification

Maintain a source-to-destination coverage checklist for copied stories. Desktop
owns the migrated application-level stories; reusable package catalogs remain
with their libraries. Retire superseded app-level story registrations only after
their replacements pass. Default Storybook execution must:

- Require no running sibling service, native process or credential.
- Use fake Terminal/AI clients and disposable fixture state.
- Pass static build and interaction/accessibility checks in both themes.
- Clean up App instances, subscriptions, workers and object URLs.
- Exercise operational failures through the existing notification service.

Changes to shared Storybook configuration run the complete affected catalog.
Feature-only changes begin with their exact stories and direct consumers. Visual
baselines remain pending explicit approval. Passing interactions or
accessibility checks does not constitute visual approval. Native acceptance
remains separate and covers:

- Reload, cancelled close, actual exit and crash recovery.
- Vault/window isolation, stale handles and revoked access.
- No orphan PTYs, ACP workers or subscriptions.
- Existing settings/data migrating to bundled ownership.
- Safe Mode and disable/re-enable behaviour.
- Web removal preserving saved data and unrelated features.

## 5. Delivery defaults

- Bundled AI and Terminal are enabled by default for new installations, with
  lazy native startup.
- Existing users' explicit disabled preferences are preserved.
- macOS ARM64 is the first native qualification target.
- Reusable defects are fixed in `lapis-ai` or `lapis-terminal`; desktop
  integration defects stay in `lapis-desktop`.
- Prefer local source checkouts through their public package exports and built
  output; use ignored JavaScript install overlays and Rust path dependencies.
  Keep publishable manifests portable. Verified archives remain suitable for
  reproducible acceptance. Do not publish releases for this migration.
- Each stage ends with focused checks, recorded evidence and a commit, then
  continues to the next authorized stage. A user-requested pause still stops it.
- If commit signing fails, commit without a signature as authorized by the user.
- Implementations must update their owning canonical specifications and task
  evidence. This saved plan alone establishes no runtime qualification.
