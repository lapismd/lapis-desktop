# Lapis Desktop agent guide

Read this guide, `spec/src/current/index.md`, the owning contract and the
milestone task before inspecting or changing implementation. Apply the parent
workspace guidance too. `PLAN.md` is the roadmap; canonical requirements govern
behavior and milestone tasks alone own completion status.

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
7. Commit each verified slice with Jujutsu and a descriptive message.

Keep failed attempts in evidence. Done requires the original completion gate;
compilation, browser mocks, bookkeeping and screenshots cannot replace native
acceptance. A lifecycle change requires a cold process. Visual review remains
non-blocking and baselines require explicit approval.

## Ownership and structure

- `src` owns desktop presentation and the renderer transport adapter;
  `src-tauri` owns native windows, admission, services and resource lifetime.
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
      database/            Database frames, connections and provider
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

## Desktop catalog

Keep Storybook configuration in `.storybook`, application stories under
`catalog/plugins/<feature>` and disposable fixtures under
`catalog/support/<feature>`. Top-level shell composition stories may stay
directly in `catalog/plugins`. Stories mount production components, inject
clients and own in-memory Apps; production code cannot import catalog code.
Await App/service cleanup between examples. Add copied-story source/destination
coverage to `catalog/COVERAGE.md` and retain license attribution.

Use `pnpm storybook` (port 7480), `pnpm build-storybook` and
`pnpm test:storybook`. The test command runs desktop and narrow viewports
sequentially, with light/dark stories and accessibility failures enabled. Visual
review remains pending; never update baselines without explicit approval.

## Native development commands

`pnpm dev` starts Tauri with the loopback Vite renderer. `pnpm build` emits the
renderer and `pnpm desktop:bundle` creates the current-platform application.
`pnpm test:desktop` builds and exercises an isolated actual native WebView. Use
`pnpm check`, `pnpm test`, and `pnpm spec:check` for foundation qualification.
Do not publish, replace installed applications, or reuse a user's profile for
tests.
