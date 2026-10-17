# Lapis Desktop

A Tauri desktop preview for Lapis Notes with a native vault launcher and the
existing Notes workspace, editor, Markdown reader, Search, metadata and Graph
views. Native menus and services use the same owned application lifecycle. The
[migration plan](PLAN.md) defines qualification and deferred distribution.

Start with [MIGRATION.md](MIGRATION.md) for current status, original gates and
next work. Canonical behavior lives in the
[specification](spec/src/current/index.md). See [AGENTS.md](AGENTS.md) before
changing implementation.

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
publication is deferred. Pack the Notes source snapshot for local acceptance:

```sh
pnpm local:pack ../lapis-notes-desktop-migration
pnpm local:install
```

The complete Notes editor cohort also includes source-owned Mira and Markdown
archives. After qualifying and building each owning source repository:

```sh
pnpm local:pack ../lapis-notes-desktop-migration \
  --mira ../mira-mde-desktop-migration \
  --plugins ../lapis-plugins-desktop-migration --already-built
pnpm local:install
```

The pack command builds each public package through its normal prepack lane and
records source snapshot revisions and archive checksums under ignored
`.local/archives`. After the source's public package build/prepack lanes have
already passed, `pnpm local:pack <source-workspace> --already-built` packs those
outputs without rerunning the scripts. The installer verifies the actual packed
identities, preserves peer ranges, and restores the tracked registry
manifests/lockfile after installation, including failure. Repeat
packing/installing after source changes; restart Vite/Tauri for a cold check. A
normal registry install removes the local development overlay from installed
dependencies. The source defaults remain unpublished until the final release
gate. Commit each verified slice in its owning repository.

## Verification

```sh
pnpm check
pnpm test
pnpm spec:check
pnpm test:desktop
pnpm desktop:bundle --debug
pnpm check:bundle
```

Desktop acceptance builds a separate feature/configuration, starts the actual
macOS ARM64 WebView in a UI session and two cold lifecycle launches with
isolated state, and retains logs under ignored `.local/native-test`. Its launch
PATH contains no Deno. M2 additionally verifies real temporary-folder file
operations, interrupted writes, permission failures, symlink containment and
revocable attachment URLs. The debug-only picker queue replaces the OS selection
UI during repeatable automation; native keyboard/picker input is recorded
separately. Normal application builds include no desktop automation plugin,
permissions or frontend hook.

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
Desktop consumes the private `@lapismd/ai` built exports and optional Rust
plugin; no package publication is required. `pnpm test:desktop` stages the
actual ACP binary and an isolated compiled Rust provider only into the
acceptance bundle. The ordinary application excludes that policy, provider and
test driver.
