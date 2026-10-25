# Local validation

Portable checks, unit tests, renderer builds, specification checks and catalog
interaction/accessibility commands default to Docker. Native macOS app packaging
and actual WebView/window/OS acceptance remain explicit separate commands.
Docker failures stay failures; there is no automatic host fallback. Renderer and
static catalog builds receive a Node heap capped at 6 GiB and half the
configured worker memory. Nested builds apply the same bound at their actual
build dispatch using Docker memory limits; other lane environments and explicit
native execution retain their existing settings.

## Commands

```sh
pnpm validation:doctor
pnpm validation:images
pnpm validation:images -- --target full
pnpm validation:smoke
pnpm validation:check
pnpm check:storybook-parity
pnpm check
pnpm test
pnpm test:storybook -- catalog/plugins/ai/NativeTurns.stories.ts
```

The UI image owns TypeScript, renderer/AI tests, Storybook and renderer builds.
The full image additionally contains pinned Rust and Linux Tauri development
libraries for native service tests, strict Clippy and Rust formatting. Its seven
committed sibling inputs are pinned in `scripts/validation/native-sources.json`;
dirty sibling work is never included. Linux service qualification cannot qualify
a macOS application or native window. Use the existing `pnpm desktop:bundle`,
`pnpm test:desktop:headed` and `pnpm test:desktop:api` for their actual platform
gates.

Intentional host execution requires an explicit runtime selection:

```sh
LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:types
```

Hosted CI selects its provisioned native runtime explicitly. Development
servers, local archive preparation, preview maintenance, native bundles and
visual baseline approval are outside the portable runner. Screenshots do not
approve baselines.

## Exact sources and private prerequisites

Each run exports the exact tracked Jujutsu working-copy snapshot and ancestry,
including from a separate workspace. Ignored profiles, secrets, host
dependencies and source bind mounts are excluded. The worker receives no Docker
socket. CLI targets and arguments remain literal. Images are keyed by pinned
recipes, tool installers, package-manager/Rust pins and daemon architecture;
dependency/tool identities key pnpm caches. Native caches use the full tool
image, exact `Cargo.lock` from the tested snapshot and all committed native
source identities; a UI archive refresh cannot invalidate identical native
inputs. An ignored migration receipt may retain an owned older volume only after
those exact inputs and its ownership are verified. Native pins never share a
migrated key.

This private migration currently requires unpublished public-build archives. The
checked-in semver manifest and existing lockfile are preserved, but a fresh
registry-only install is not qualified until the publication gate. Supply a
checksummed ignored JSON list of `{name, version, path, sha256}` entries,
including private linked packages. The runner checks package identity and
digest, creates an isolated archive install projection and lock, installs that
projection with `--frozen-lockfile`, then restores tracked source manifests and
lock before validation. This is distinct from a frozen registry-only install.

`LAPIS_DESKTOP_VALIDATION_ARCHIVES` or the ignored configuration's `archives`
field selects this explicit prerequisite inventory. Archive source revisions and
consumer qualification remain recorded by the local dependency intake process.

## Remote Docker

To move load off the Mac, save ignored `.local/validation/config.json`:

```json
{
  "context": "my-linux-host",
  "transport": "ssh-cli",
  "cpus": 4,
  "memoryGiB": 12,
  "shmGiB": 2,
  "archives": ".local/validation/prerequisite-archives.json"
}
```

The Docker context supplies the SSH endpoint. No local path needs to exist on
the remote machine: inputs and reports are streamed. Omit `transport` for
ordinary Docker context transport. `LAPIS_DESKTOP_VALIDATION_CONTEXT` overrides
the saved context. CPU, memory and shared memory are bounded. Workers drop all
Linux capabilities; the smoke proves that a denied-directory write fails,
including when cache ownership keeps the worker UID at root. One lease per
checkout keeps its aggregate runs sequential; independent repositories can run
separately.

## Reports and cleanup

Reports and source/tool identities return to `.local/validation/runs/<run>/`.
Default complete catalog runs use four sequential cold shards; each preserves
the four existing viewport/theme modes. Explicit targets and caller shards stay
unchanged. Failed containers remain inspectable.

```sh
pnpm validation -- collect <run>
pnpm validation -- stop <run>
pnpm validation -- clean
pnpm validation -- clean --apply
```

Cleanup previews by default. Applying it collects reports before removing
completed owned containers (`exited` or `dead`); created, paused, running and
unknown workers retain their checkout lease. A lost SSH query never proves
completion. Cleanup uses immutable container IDs and matching retained reports,
then rechecks active ownership before releasing a lease. Only an explicit
`--caches` additionally removes unused owned volumes. The runner never uses
global Docker prune.

## Story composition

`catalog/story-parity.json` classifies every executable story family under
LD-CAT-005. Application stories reach the actual public `WorkspaceShell` or
Desktop's production `NotesWorkspace` along their selected render path,
including imported factories and literal props. Focused component stories name
an actual public package export or tracked Desktop production component. Fixture
components cannot be declared as production subjects. Mixed families use named
overrides.

The AST guard rejects stale/missing declarations, unused-shell camouflage,
replacement branches, duplicate roots, fixture overrides of production internals
and unisolated synthetic controls in application examples. Fatal Svelte runtime
diagnostics are retained through rendering, interactions and teardown, including
errors caught by a component cleanup boundary. Explicit integration
fixtures/prototypes must name a governing requirement and a concrete purpose;
they do not claim application parity. Existing owned Storybook preview lifecycle
and cache guards remain separate. Visual approval remains pending.

## Tooling provenance

The isolated Docker runner and AST composition guard are adapted from the
Notes/Plugins implementations landed in their main workspaces on 2026-10-25.
Desktop owns its lane selection, native-source pins, Tauri image, production
component subjects, archive prerequisites and macOS acceptance boundary.

`pnpm check:rust` and `pnpm check:rust:e2e` run strict Linux Clippy for normal
and acceptance configurations. They qualify compilation and service code only;
actual native WebView, OS and bundle checks retain their separate gates.

## Cache boundaries

Tool images fingerprint their actual Dockerfile and tool-installer inputs,
package-manager/Rust pins, architecture and target. JavaScript lock/archive
identities key the package cache; native Cargo-lock/source identities key the
native cache independently. Workspace isolation remains intact. Legacy native
cache adoption requires the exact old key, owned volume labels and a retained
migration receipt; normal Cargo source fingerprints remain authoritative.

`E-VALIDATION-001` already qualifies the cache/image-key regressions, mounted
cache bootstrap exclusion and complete runner/lease/guard suite. JavaScript
metadata edits no longer rebuild tool images or invalidate identical native
inputs. Its permission-denial and Chromium/WebKit smoke remain separate from
actual macOS product acceptance.

Further cache optimization is Deferred. No additional cache implementation is
part of the current dependency/catalog intake.
