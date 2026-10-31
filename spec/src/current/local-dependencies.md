# Local dependency intake

E-REPO-056 takes committed JJ Store `f58b9363` through the existing Tauri
adapter and updates the private native lockfile. Neutral history and Tauri
transport share one service implementation. Existing native product, provider,
distribution and visual gates remain unchanged.

Archive admission MUST check actual runtime/peer ranges and local workspace
development ranges. A published dependency's development-only pins do not belong
to the consuming Desktop graph and MUST remain unchanged.

LD-GOV-006 and LD-GOV-008 govern this development workflow. Existing migration,
native product, provider, distribution and visual gates remain unchanged.

Local review refreshes MUST rebuild the complete direct/transitive first-party
cohort from the latest committed source in each owning default checkout,
including work ahead of or separate from its `main` bookmark. Explicit isolated
review workspaces may be selected with `LAPIS_DESKTOP_SOURCE_WORKSPACES`, a JSON
map of repository names to absolute workspace roots. The same committed-input
and payload verification applies; default checkouts remain untouched. Refresh
MUST reject uncommitted package/build inputs; unrelated documentation edits may
remain.

`pnpm local:refresh` rebuilds public exports, uses source-owned package
preparation and records source revisions/checksums together. Design Core owns
its prepared CSS/declaration archive. Node Spec Validator preparation uses the
exact build runtime declared by that source; it does not change the machine's
default Deno. Linked Terminal, AI and JJ clients retain their public-export
boundaries and gain build fingerprints. Native source inputs must also be
committed before their consuming app and helper bundles are rebuilt.

`pnpm local:status` MUST reject missing/old installed source receipts, modified
linked exports, bad archive checksums and installed payload mismatches. Inspect
direct and transitive pnpm contexts so a current root package cannot hide an old
nested copy. A revision recorded beside an old archive cannot prove freshness.

Preparation MUST publish its candidate only after every source group builds and
validates. It does not install dependencies or stop applications. Quit normally
and stop owned Vite/Storybook consumers before installing the complete cohort.
Preserve tracked registry dependency files, then rebuild and cold-launch the
ordinary review bundle with its existing profile. Re-run freshness verification
after installation. Source changes and ordinary registry installs require a new
check.

The scoped legacy `local:pack` helper records its explicitly selected source
snapshot and runs normal public prepack lanes. Generated tracked-source changes
require review and repacking. `--already-built` requires prior public build
acceptance; all source stability, archive identity, version and integrity checks
remain required. This helper does not qualify complete review freshness.

Local archive overlays route transitive imports of explicitly declared linked
native packages to the same built public exports. Normal semver ranges must
match the local version; only the root's exact declared link may bypass range
parsing. Tracked dependency manifests and lockfiles remain portable.

The private Notes application profile uses its packed public `native-chat` entry
and a normal package range. Its Agent UI and API imports must resolve the same
verified consumer identities. Source aliases, copied screens and a second chat
writer remain prohibited.

Portable validation MUST declare every unpublished or linked package as a
checksum-pinned archive prerequisite, resolve an isolated projected lock before
frozen installation and restore tracked dependency files before checking the
source. The current inventory below and distribution backlog govern remaining
transitions; private prerequisites do not qualify registry-only distribution.

A dynamically installed plugin retains its signed build source and exact archive
hash. A documentation-only successor is equivalent only after verifying
unchanged public inputs; static UI qualification cannot prove installed plugin
assets. Preserve verified archives in default-owned ignored storage before
retiring source workspaces. Source preparation must preserve installed
applications and user profiles.

Earlier selective cohorts and their acceptance limits remain in immutable
[E-AI-100](../history/E-AI-100.md), [E-AI-102](../history/E-AI-102.md),
[E-CORE-023](../history/E-CORE-023.md), [E-CORE-028](../history/E-CORE-028.md),
[E-DEPENDENCY-003](../history/E-DEPENDENCY-003.md),
[E-ICONS-001](../history/E-ICONS-001.md),
[E-ICONS-002](../history/E-ICONS-002.md), [E-CORE-045](../history/E-CORE-045.md)
and [E-CORE-046](../history/E-CORE-046.md). The selected inputs below supersede
those historical version inventories; provider, native and distribution gates
retain their owning contracts.

## Current registry and private inputs

E-CI-017 starts the released-cohort intake with declared registry minima API
0.2.3, UI 0.1.5, Workspace 0.3.1, Mira 0.1.3 and Terminal 0.1.2. The Mira
companions remain 0.0.3. Remove the completed Workspace and Terminal npm archive
projections and their redundant source builds. Keep the real Plugins and Tasks
source preparation required by native installed-plugin acceptance. Final
frozen-graph, audit, portable and hosted native qualification remains pending; a
declared minimum or prepared artifact is not consumer acceptance.

The intermediate API 0.2.3/Core 0.7.3 input passes full quality, 596 Node and
746 policy cases, 259 Linux Rust tests, all 2,128 cold catalog cases, renderer
and static builds. Two Rust tests retain their existing ignores; four macOS-only
cases are not collected on Linux. E-CI-017 records these bounded passes. Final
released-cohort, audit and hosted native qualification remain pending.

Notes' private App Profile is built from the actual API 0.2.3 release source
`0d9d4d9253579541b1e796d7f2c68ef3b19a8df6` and must depend on that exact API
version. Its verified 35,343-byte archive has SHA-256
`975ea33dcba8d8db55288820221e8aae39f7d6fea4fc87312b64fa5b0715a1d5`. The source
build uses frozen Core 0.7.2; final Desktop Core acceptance remains separate.
Hosted CI builds this same committed public boundary, without source aliases,
bundled node_modules or a second chat writer.

The current seven npm archive prerequisites are Agent UI, Bases, History, App
Profile, Tasks, AI and JJ Conversations. The public release transitions and
final dependency selection are governed by
[the distribution backlog](../backlog/distribution.md). AI and App Profile
remain intentionally private. JJ Conversations' qualified distribution is still
unresolved. Preserve tracked registry ranges and verify every active private
archive import route; the resulting graph does not qualify registry-only
application distribution.

Design Core 0.7.3 is published and verified from source `1ff36f37`, including
registry bytes, provenance, package tag and GitHub release in run 41194948225.
The public lock advances only that package from the preliminary 0.7.2 input;
every Bits copy retains the exact root patch below. Final consumer qualification
requires the complete selected cohort. Agent UI's temporary source selection
retains host-advertised send capability independently of the transcript draft,
with native queue authority in the host and Stop available for an unsupported
draft. Its published replacement must pass the original consumer boundary before
removing the projection.

All jj-store crates use git revision `7a98bd89d2bc77fb6ec41f91186992abb19ba161`.
Native application crates use lapis-server
`4150cac6f2fef28b128421e4e3a851b848acdcf3`, restoring projection engines through
exact owning Plugins, Tasks and Docs Git commits. Terminal Rust uses
`2463f944149d753eaf638cf876393a6f60f50190`, retaining attachment/ordered capture
repairs and PR #12's fenced detach/remount sink. Its source race, real PTY
stress, 109 Rust tests, strict Clippy and hosted gate pass; E-CI-013 keeps the
separate Desktop consumer gate pending. Prompt assertions and shell admission
remain unchanged. No native dependency requires an ambient sibling crate path or
invented release tag.

Hosted audit runs against the actual private install projection before restoring
tracked files. Full and production audits remain blocking. Test tooling consumes
released security repairs in Vite 7.3.7, Storybook 10.6.5, Vitest 4.1.12 and
WebdriverIO 9.32, with upstream browser-download and Mocha serializer overrides.
The language-service chain uses released KaTeX 0.18.10; private App Profile uses
Markdown 0.2.0 without the former Mira/KaTeX cohort.

The sole approved development exception is GHSA-gcqx-w48m-w2h4 for deepmerge
4.3.1 under the Svelte Vite plugin through 2026-11-30. Enforce its exact path,
version and expiry; retain full diagnostics. Production findings and any new or
changed advisory remain blocking. Remove stale exceptions.

## Authorized Bits UI patch

The user's October 31 instruction authorizes a tracked pnpm patch for registry
`bits-ui` 2.20.2 while its owning fixes await an upstream release. Keep the
existing Link Preview selection-timer and Slider destroyed-callback repairs, and
the same-container FocusScope guard from upstream
[Bits UI #2264](https://github.com/huntabyte/bits-ui/pull/2264), owner source
`692fbdf5095941464561189fd81ffc2cb4b81c6c`. This is a scoped exception to the
dependency-patch prohibition; public package names and npm ranges remain intact.

The root workspace MUST register the exact versioned patch and retain its
frozen-lock hash. A published dependency's pnpm patch configuration does not
propagate to this application. Every resolved Bits copy MUST use the reviewed
payload; dependency projections, cold catalogs and native bundles retain that
same input. The patch SHA256 is
`debd3bc7d43917f0967f0cc1e212fc5c7721c751d3b92bf8f31030d1c96289ad`. E-CI-015
records actual consumer qualification.

Remove each hunk only after a released upstream version contains the equivalent
repair, a fresh unpatched install passes the original regression and all
affected lifecycle/focus lanes, and every consumer updates its root mapping. The
patch does not waive native acceptance, audit, distribution or visual gates.
