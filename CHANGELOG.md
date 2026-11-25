# @lapismd/lapis-desktop

## 2026.31.6-rc.5

### Minor Changes

- a59b697: Support opt-in native plugin background jobs while the window is
  closed, with explicit Quit draining, private checkpoints, runner handoff and
  optional local alerts. Select native metadata by default while retaining
  explicit renderer compatibility mode.

### Patch Changes

- 4d9121c: Use a shared OS credential adapter for Repository, forge accounts,
  AI, Sync, and explicitly approved plugins. Existing native keychain
  identifiers are preserved.

## 2026.31.6-rc.4

### Patch Changes

- c55ba51: Include the bundled Markdown skills resource in Linux preview
  packages so the installed application can start, and reject incomplete startup
  resources during package verification.

## 2026.31.6-rc.3

### Patch Changes

- b2c0a6d: Deliver the shared Desktop MCP listener and approved local CLI
  discovery, automate verified preview releases through Changesets version PRs,
  and prepare standalone CLI Homebrew distribution.
- e9f357f: Adopt the published API localization fix and patched i18next peer,
  preserving the single API context and existing native source pins.
