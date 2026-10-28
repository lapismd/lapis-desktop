# Lapis Desktop agent guide

Read this guide, `spec/src/current/index.md`, the owning contract and the
milestone task before inspecting or changing implementation. Apply the parent
workspace guidance too. `PLAN.md` is the roadmap; canonical requirements govern
behavior and milestone tasks alone own completion status.

Prefer `pnpm spec:search "<topic or ID>"` before any manual scan of spec/src;
use --semantic for conceptual queries; rg is the fallback only when QMD is
unavailable.

## Workflow

1. Run `jj --no-pager st` and preserve unrelated work. Stop on overlapping
   edits.
2. Name the exact regression or acceptance target and record its before state.
3. Update the owning canonical contract before or with protected changes.
4. Run the exact target, then checks for the complete affected surface. Follow
   the workspace escalation ladder; document-only work runs document checks.
5. Add fresh Markdown evidence under `spec/src/history`, including commands,
   counts, failures, versions, gaps and an explicit milestone review.
6. Update the task's selected evidence and run `pnpm progress:generate`,
   `pnpm check:progress` and the applicable specification checks.
7. Refresh the task ledger UTC date/time and regenerate `MIGRATION.md` with
   every slice commit; refresh the Notes master tracker after consumer commits.
   Refresh current activity when validation or remaining work changes too; do
   not leave the generated summary unchanged until the next commit. Commit each
   verified slice with Jujutsu and a descriptive message.

Keep failed attempts in evidence. Done requires the original completion gate;
compilation, browser mocks, bookkeeping and screenshots cannot replace native
acceptance. A lifecycle change requires a cold process. Visual review remains
non-blocking and baselines require explicit approval.

## Ownership and structure

- `src` owns desktop presentation and the renderer transport adapter;
  `src-tauri` owns native windows, admission, services and resource lifetime.
- Shared native application policy belongs to Notes-owned `lapis-app-core`.
  Consume its public Rust modules directly; keep Tauri/window/OS policy here.
  Extract implementations instead of copying them or retaining old-path exports.
  Existing public Agent/Repository screens observe those services. Do not add
  authoritative renderer background schedulers while moving work into the core.
- Keep published dependency ranges portable. The private migration app may link
  an unpublished sibling through its built public exports; record its revision
  and remove that temporary prerequisite at the distribution gate. During this
  migration, consume verified local pnpm archives through an ignored development
  overlay and defer package publication to the final release gate. Record source
  revisions and checksums; build and test changes in their owning repository.
  Fix package defects upstream and validate public built exports. Never add
  source aliases, dependency patches, copied components or consumer overrides to
  hide defects.
- Keep native transport, application orchestration and presentation separate.
  Production cannot import test fixtures or acceptance instrumentation.
- Use explicit owned App instances and only the public disposable compatibility
  lease at legacy host boundaries. First-party code cannot use ambient App
  state.
- Use native CSS, public Design Core tokens and stable component hosts. Do not
  add Tailwind utility styling or dependency-internal selectors.
- New production Rust, TS, Svelte, CSS and script files stay within 300 counted
  lines; stories within 400 and standalone tests within 500. Inline tests count
  toward their containing file. Split by responsibility instead of raising
  limits.
- Keep authored specification/evidence Markdown within 400 physical lines and
  32,768 UTF-8 bytes. Pin Rust and pnpm; use the published Node spec-validator.

Run `pnpm check:architecture` and `pnpm check:app-ownership` for source-boundary
changes. Both are included in normal and specification validation. Native
automation is explicitly feature-gated and unavailable in ordinary bundles.

## Renderer source layout

Group new code by responsibility and feature, following this layout:

```text
src/
  main.ts                  Renderer bootstrap and global style imports
  components/
    views/                 Shell and Notes workspace composition roots
    vaults/                Vault launcher presentation
    files/                 File conflict presentation
    terminal/              Bundled plugin composition and retained presentation
  lib/
    desktop/               Startup, window behavior and leave coordination
    launcher/              Launcher appearance preferences
    native/                Native bridge, vault client and transport errors
      database/            High-level database calls, observation and provider
    notes/                 Notes session construction and plugin profile
    terminal/              Session coordination, preferences and owned bindings
  styles/                  Global shell, workspace and window chrome CSS
```

Keep `src` itself limited to bootstrap files. Add components and supporting
logic to their owning feature directory; create another named feature when its
responsibility is distinct. Composition roots may combine features. Keep `lib`
independent of local UI components and native adapters independent of Notes
orchestration. Use a shared directory only for code with actual reuse; avoid
catch-all utility folders and flat component or library directories.

Keep component-specific styles scoped with their component; `styles` is for
application-wide host styling using public tokens. Import modules directly with
relative paths. Do not leave compatibility re-exports at old locations after
moves or introduce barrels, aliases or routing frameworks just to organize
files. Update renderer tests and the native acceptance entry when their imports
move, and retain historical evidence at its original paths.

## Native source layout

Keep `src-tauri/src` limited to the crate entrypoints `main.rs` and `lib.rs`.
Group implementation by feature and distinguish reusable services from Tauri
adapters:

```text
src-tauri/src/
  main.rs                  Binary entrypoint and debug acceptance feature gate
  lib.rs                   Reusable native service module declarations
  ai/                      Native AI admission and user-command policy
  database/                Database view admission and scoped commit observation
  integration/             URL and desktop-service policy
  lifecycle/               Leave request state machine
  plugins/                 Admitted installed-plugin assets
  terminal/                Vault-scoped terminal policy
  vault/                   Admission, profiles, file IO, resources, system actions
  watch/                   Scoped filesystem snapshots and watch ownership
  host/                    Tauri bootstrap and adapters
    mod.rs                 Application construction and command registration
    ai/                    ACP policy and named admission/data adapters
    shell.rs               Shell information and readiness commands
    state.rs               Owned native resources and blocking access
    lifecycle.rs           Tauri lifecycle events and guarded leave commands
    database.rs            Database IPC adapter
    terminal.rs            Terminal admission and teardown adapter
    integration/           URL commands, menus, clipboard and notifications
    vault/                 Vault admission, file and watch IPC adapters
    windows/               Window creation, navigation policy and macOS chrome
  acceptance/              Debug e2e-only instrumentation grouped by feature
```

Place new native code in its owning feature; create a named directory when a
distinct responsibility needs several modules. Avoid catch-all helpers and flat
command lists. Service modules must not depend on the binary's `host` or
`acceptance` modules. Keep transport adapters separate from service policy. Rust
module declarations belong in each directory's `mod.rs`; update callers directly
when moving modules, without old-path re-exports or `#[path]` routing.

Preserve the library's unsafe-code prohibition, the binary's unsafe-code denial
and the sole macOS chrome allowance in `host/windows/macos_chrome.rs`. Compile
`acceptance` only behind the existing debug e2e gate. Moves must update native
tests, live script references and canonical spec mappings while leaving
historical evidence immutable. Run architecture/App ownership audits, Rust tests
and strict Clippy for normal and e2e targets, and verify both native build
configurations. The architecture audit rejects implementation files at the
native source root.

## Desktop catalog

Keep Storybook configuration in `.storybook`, application stories under
`catalog/plugins/<feature>` and disposable fixtures under
`catalog/support/<feature>`. Top-level shell composition stories may stay
directly in `catalog/plugins`. Stories mount production components, inject
clients and own in-memory Apps; production code cannot import catalog code.
Await App/service cleanup between examples. Add copied-story source/destination
coverage to `catalog/COVERAGE.md` and retain license attribution.

Every desktop-specific visible state and desktop-only plugin needs a mapped
review story using production components and the smallest real shell required.
Include applicable loading, empty, disabled, failure and recovery states; keep
the inventory current when adding behavior. Do not create replacement screens.

Keep `catalog/story-parity.json` current and run `pnpm check:storybook-parity`.
Application examples retain the actual production shell; component examples name
the genuine public or Desktop-owned production surface. Synthetic controls never
replace product presentation; use `catalog/FixtureControls.svelte` for visibly
labelled, dotted-border setup actions outside the production shell. Follow
[local validation](docs/validation.md).

Use `pnpm storybook` (port 7480), `pnpm build-storybook` and
`pnpm test:storybook`. The test command runs desktop and narrow viewports
sequentially, with light/dark stories and accessibility failures enabled. Visual
review remains pending; never update baselines without explicit approval.

## Native development commands

`pnpm dev` starts Tauri with the loopback Vite renderer. `pnpm build` emits the
renderer and `pnpm desktop:bundle` creates the current-platform application.
`pnpm test:desktop` defaults to quiet headless renderer/catalog and
native-service checks. `pnpm test:desktop:headless` makes that choice explicit;
`pnpm test:desktop:headed` builds and exercises the actual native WebView/window
and OS suite. Both modes are also available as `--headless`/`--headed` on the
default script. Headless success cannot qualify a native product gate. Use
`pnpm test:desktop:api` for opt-in macOS ARM64 IPC checks in a hidden native
WebView. This e2e-only mode prohibits activation and tests no animation or OS
UI; it is separate from the quiet default and refuses a running acceptance app.
Live agent/provider specs are opt-in only: `pnpm test:provider:live -- <spec>`
(or `--all`) is their sole entry point, it refuses without an explicit
`LAPIS_AI_TEST_RUNTIME_CONFIG`, and
`tests/governance/live-provider-exclusion.test.mjs` fails the default
`pnpm test` lane if any lane, script or manifest collects one. When they do run,
preserve receipts, record a failed attempt before any deliberate retry, never
auto-replay an uncertain accepted turn and never print configuration or
credential contents. Portable `check`, `test`, `build`, specification and
catalog lanes default to isolated Docker snapshots, which is the CI-parity
runtime for that lane set. Use `pnpm validation:doctor` and
`pnpm validation:images`; `LAPIS_DESKTOP_VALIDATION_RUNTIME=native` deliberately
selects the host. macOS native/headed acceptance is on-demand only (user
decision 2026-10-27):
`LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- headed|api|onnx|provider-live`
is the inventoried entry point, it refuses without that opt-in or off macOS
ARM64, and `tests/governance/native-lane-defaults.test.mjs` fails the default
lane if Docker stops being the code-level runtime, if a default lane or manifest
script collects a native lane, or if a native runtime selector appears outside
the runner mechanism, that dispatcher and hosted CI. `pnpm build:local:macos`
builds an unsigned, ad-hoc signed macOS app for local testing and installs the
dynamically distributable first-party plugins (development provenance) into a
vault's `.lapis/` directory; it is macOS ARM64 only, refuses a real signing
identity, is excluded from every default lane
(`tests/governance/local-macos-build-exclusion.test.mjs`), and never replaces an
installed app or a user profile. Hosted CI runs the same portable lane set plus
headed acceptance on a macOS runner with its provisioned native runtime, because
that platform provides no Docker daemon; a native or on-demand run is never
Docker CI parity and must be labelled in evidence. Docker errors never trigger
host fallback. Shared-package archives remain explicit private prerequisites;
never transfer dirty sibling sources or user profiles. Use `pnpm check`,
`pnpm test`, and `pnpm spec:check` for foundation qualification. Do not publish,
replace installed applications, or reuse a user's profile for tests.
