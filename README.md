# Lapis Desktop

A Tauri desktop host for Lapis Notes. M0.1 provides the native shell; vault and
editor integration follow in the [migration plan](PLAN.md).

Start with [MIGRATION.md](MIGRATION.md) for current status, original gates and
next work. Canonical behavior lives in the
[specification](spec/src/current/index.md). See [AGENTS.md](AGENTS.md) before
changing implementation.

## Development

Use Node 24.10 or a supported newer major, pnpm 10.34.5, the pinned Rust
toolchain and Xcode command-line tools on macOS.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Vite binds 127.0.0.1:1431. Normal launches use the separate
`com.lapismd.lapis-desktop.preview` profile.

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
PATH contains no Deno. Normal application builds include no desktop automation
plugin, permissions or frontend hook.

The local debug application is emitted under
`src-tauri/target/debug/bundle/macos/Lapis Notes Preview.app`. Signed public
distribution and platform expansion are separate M11 gates.

## Specification and progress

Use `pnpm spec:validate`, `pnpm spec:first` and `pnpm spec:check` for the
published Node spec-validator. `pnpm progress:generate` refreshes the root
status summary from the task ledger; `pnpm check:progress` checks evidence and
gates. See the [asset and reference provenance](docs/provenance.json).
