# Lapis Desktop

[![Storybook Pages](https://github.com/lapismd/lapis-desktop/actions/workflows/publish-storybook-pages.yml/badge.svg)](https://github.com/lapismd/lapis-desktop/actions/workflows/publish-storybook-pages.yml)
[![Storybook](https://img.shields.io/badge/storybook-live-ff4785?logo=storybook&logoColor=white)](https://lapismd.github.io/lapis-desktop/)

A Tauri desktop preview for Lapis Notes with a native vault launcher and the
existing Notes workspace, editor, Markdown reader, Search, metadata and Graph
views. Native menus and services use the same owned application lifecycle. The
[migration plan](PLAN.md) defines qualification and deferred distribution.

Start with [MIGRATION.md](MIGRATION.md) for current status, original gates and
next work. Canonical behavior lives in the
[specification](spec/src/current/index.md). See [AGENTS.md](AGENTS.md) before
changing implementation. Live catalog:
<https://lapismd.github.io/lapis-desktop/>.

## Development

Use Node 24.10 or a supported newer major, pnpm 10.34.5, the pinned Rust
toolchain and Xcode command-line tools on macOS. Build the local unpublished
Terminal library through its public package first:

```sh
pnpm --dir ../lapis-terminal build:js
```

The private preview links `../lapis-terminal/packages/terminal`; Rust links its
Tauri plugin from the same sibling. This temporary prerequisite is recorded in
the migration evidence and is resolved at the distribution gate.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Vite binds 127.0.0.1:1431. Normal launches use the separate
`com.lapismd.lapis-desktop.preview` profile.

## Local shared-library archives

During migration, source fixes stay in their owning repositories and npm
publication is deferred. Refresh the complete local dependency cohort from the
latest committed source in each sibling's default checkout:

```sh
pnpm local:status
pnpm local:refresh
# Quit the review app normally and stop this checkout's Vite/Storybook first.
pnpm local:install
pnpm local:status
pnpm ai:prepare
pnpm desktop:bundle --debug
```

`local:refresh` rebuilds public exports for Notes, its bundled plugins, Mira,
Design Core, Agent Redaction, the API's AI Host file-tools dependency and the
Node Spec Validator. It also rebuilds the four linked Terminal, AI and JJ
clients. It selects committed checkout work even when `main` points elsewhere,
rejects uncommitted package/build inputs, and preserves unrelated documentation
work. Design Core uses its own prepared CSS/declaration packer. Source
revisions, archive checksums and linked-export fingerprints live under ignored
`.local/archives`; a moved source head requires another refresh.

`local:status` fails for old/missing source receipts, changed linked exports,
checksum mismatches or installed payloads that differ from the archives. A
matching package version alone does not establish freshness. `local:refresh`
prepares the complete manifest without installing it or stopping applications;
finish with the guarded quit/install/cold-launch sequence above. Native AI
preparation and the Desktop bundle rebuild consume the current native siblings.

The installer verifies packed identities, preserves peer ranges, and restores
tracked registry manifests/lockfiles even after failure. A normal registry
install removes the development overlay, so rerun the status/refresh sequence.
For a deliberately scoped source experiment, the older
`pnpm local:pack <source-workspace> --already-built` helper remains available;
it replaces the candidate manifest and does not establish complete freshness.
Local source changes remain unpublished until the release gate.

## Verification

```sh
pnpm check
pnpm test
pnpm spec:check
pnpm test:desktop
pnpm test:desktop:headed
pnpm test:desktop:api
pnpm desktop:bundle --debug
pnpm check:bundle
```

`pnpm test:desktop` (or `pnpm test:desktop:headless`) runs renderer tests,
native Rust service tests and the complete Storybook catalog in headless
Chromium. It opens no native app and does not use the session clipboard. Use
`pnpm test:desktop -- --headless` or `--headed` to choose a mode explicitly.

`pnpm test:desktop:headed` retains full native acceptance. Hidden macOS WebViews
stop animation frames even with background scheduling enabled, so the quiet
browser/service lane cannot substitute for real native UI qualification. CI
explicitly retains the headed native acceptance step.

`pnpm test:desktop:api` is an optional macOS ARM64 native IPC lane. It builds a
separate e2e bundle, keeps its WebView hidden and prohibits application
activation. It checks AI admission and cold restart without requiring animation
frames. It refuses a running acceptance app and does not qualify visible UI or
OS actions. The default command stays browser/service-only.

Headed acceptance builds a separate feature/configuration, starts the actual
macOS ARM64 WebView in a UI session and two cold lifecycle launches with
isolated state, and retains logs under ignored `.local/native-test`. Its launch
PATH contains no Deno. M2 additionally verifies real temporary-folder file
operations, interrupted writes, permission failures, symlink containment and
revocable attachment URLs. The debug-only picker queue replaces the OS selection
UI during repeatable automation; native keyboard/picker input is recorded
separately. Normal application builds include no desktop automation plugin,
permissions or frontend hook.

For foreground UI review, run `pnpm storybook` at <http://127.0.0.1:7480>. The
[desktop state inventory](catalog/DESKTOP_STATES.md) maps production shell,
startup/recovery, vault and conflict scenes plus desktop-only plugin coverage.
Each uses disposable state and the smallest required shell.

For a retained preview, use the scoped maintenance commands:

```sh
pnpm storybook:start -- --port 7490
pnpm storybook:status -- --port 7490
pnpm storybook:restart -- --port 7490
pnpm storybook:stop -- --port 7490
pnpm storybook:clean
pnpm storybook:clean -- --apply
```

The default port is 7480; `LAPIS_STORYBOOK_PORT` sets another default. Managed
commands control their recorded server only. An existing foreground or unrelated
listener is reported as `foreign` and preserved; stop that launcher before
starting a managed preview on its port. Logs live in
`.local/storybook/PORT.log`. `running` means the owned server answers its story
index; `unready` retains an owned process that does not. UI acceptance is
separate. Components/styles use HMR; runtime/fixture edits reconstruct the App.

Cache cleaning is checkout-wide and previews its targets by default. Applying it
requires all checkout Storybook/Vite/Vitest Node consumers to be stopped. It
removes only `node_modules/.cache/storybook` and `node_modules/.vite`; fixtures,
native data, logs and static exports remain. Symlinked targets are refused.
These commands use macOS/Linux `ps` and `lsof`; this slice is qualified on macOS
ARM64. Verified local package archive replacements still require the documented
install step and a preview restart.

The local debug application is emitted under
`src-tauri/target/debug/bundle/macos/Lapis Notes Preview.app`. Signed public
distribution and platform expansion are separate M11 gates.

## Specification and progress

Use `pnpm spec:validate`, `pnpm spec:first` and `pnpm spec:check` for the
published Node spec-validator. `pnpm progress:generate` refreshes the root
status summary from the task ledger; `pnpm check:progress` checks evidence and
gates. See the [asset and reference provenance](docs/provenance.json).

The M10.1 native ACP acceptance lane also requires a clean, verified `lapis-ai`
checkout. Build its public outputs first with `pnpm -C ../lapis-ai build`.
Desktop consumes the private `@lapismd/ai` public build as a runtime dependency
and its Rust plugin; no package publication is required. Notes binds the bundled
AI views and user command store lazily. No ordinary execution target is enabled
yet; native chat, context and recovery retain M10.2 qualification. Hosts can
inject App-owned conversation persistence before plugin loading; see the
[persistence guide](docs/ai-conversation-persistence.md). Existing vault-file
conversations retain their backend, and a failed injected backend never falls
back to a second writer. The JJ adapter remains a separate implementation gate.
`pnpm test:desktop:headed` stages the actual ACP binary and an isolated compiled
Rust provider only into the acceptance bundle. The ordinary application excludes
that policy, provider and test driver.
