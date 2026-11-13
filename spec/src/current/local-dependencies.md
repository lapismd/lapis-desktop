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
source. The projection replaces each declared root range in its existing
dependency section and MUST NOT add a duplicate development or peer context. The
current inventory below and distribution backlog govern remaining transitions;
private prerequisites do not qualify registry-only distribution.

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

E-MOBILE-006 selects the published mobile cohort from Notes source
`cdad0cde972f64bc0f20896d493c97268cc97b51`: API ^0.3.1, UI ^0.1.9, File Explorer
^0.2.5, Workspace ^0.4.0, Language Service ^0.1.3, Design Core ^0.13.0, Mira
~0.1.5, Search ^0.1.6 and Agent UI ^0.2.3. AI Host ^0.3.0, Markdown ^0.2.1,
Repository UI ^0.1.1, Bases ^0.2.0, History ^0.2.0, Tasks ^0.1.1, Terminal
^0.1.2 and Mira companions ~0.0.3 retain their ranges. Published intake and the
intentionally private App Profile/AI projection remain separate from
registry-only distribution and native application acceptance.

E-CI-017's intermediate API 0.2.3/Core 0.7.3 input passed full quality, 596 Node
and 746 policy cases, 259 Linux Rust tests, all 2,128 cold catalog cases,
renderer and static builds. Two Rust tests retain their existing ignores; four
macOS-only cases are not collected on Linux. Those passes do not transfer to
this selected cohort.

Notes' private App Profile is built from the same Notes
`cdad0cde972f64bc0f20896d493c97268cc97b51` release source as the published
framework cohort. Hosted CI builds this committed public boundary without source
aliases, bundled node_modules or a second chat writer. Portable validation MUST
export that same reachable commit rather than an abandoned or source-local
identity (E-VALIDATION-010). Its overlapping AI, JJ Store and Plugins sources
MUST also match the exact reachable commits used by hosted preparation; no
fallback or equal-tree substitution is allowed.

Completed npm archive projections for Agent UI, Bases, History and Tasks are
removed, including Agent UI's redundant source build and the Bases and History
package builds. Native plugin fixture sources, including Plugins and Tasks, and
the qualified Rust git pins stay. Hosted preparation installs the packed Tasks
pin's own dependencies, bundles that pin, and leaves the published registry
range and lockfile unchanged (E-CI-034). The remaining npm archive prerequisites
are App Profile and AI. Both remain intentionally private. JJ Conversations
0.1.0 stays the published registry range. Public transitions are governed by
[the distribution backlog](../backlog/distribution.md). Preserve tracked
registry ranges and verify every active private archive import route; the
resulting graph does not qualify registry-only application distribution.

Design Core ^0.13.0 and the existing root override resolve every Core copy to
0.13.0, retaining one API peer context. Every Bits copy retains the exact root
patch below. The compatible API 0.3.1/Mira ~0.1.5 cohort replaces the old API
0.2.6/Mira ~0.1.4 peer mismatch; peer warnings remain visible. `@dnd-kit/dom`
and `@dnd-kit/svelte` retain 0.4.x for API's ^0.4.0 peers. The approved compiler
exception admits one `state_referenced_locally` diagnostic for
`@dnd-kit/svelte@0.4.0` `dist/core/context/DragDropProvider.svelte`, SHA-256
`9750aa31f409e0f6be0e70b3fef6c8d8e8e447ff25b150fbc2dd4bec4781eaab`, through
2026-11-30. Any other compiler warning remains fatal.

Published Markdown, Tasks, Bases, Graph, History, Search and Source Editor still
advertise API 0.2.x peer ranges. Registry installation keeps those seven
warnings visible and resolves the host's API 0.3.1 identity; no peer override or
warning suppression is introduced. Notes owns the peer-declaration refresh.
Consumer type, interaction and accessibility checks remain mandatory.

All jj-store crates use git revision `076e418cecbe204925aea874bef8aa8a680269a9`.
Native application crates use lapis-server
`530a6c425e9183f93ee74c0b16bb4111fdc838f0`, retaining safe opt-in backup
initialization and shutdown diagnostics and adopting explicit completed-command
lease release. The Rust graph aligns `rustix` 1.1.6, Tauri 2.12.5 and
tauri-build 2.7.4 with those exact owning sources. Projection engines remain
restored through exact owning Plugins, Tasks and Docs Git commits. Terminal Rust
uses `2463f944149d753eaf638cf876393a6f60f50190`, retaining attachment/ordered
capture repairs and PR #12's fenced detach/remount sink. Its source race, real
PTY stress, 109 Rust tests, strict Clippy and hosted gate pass; E-CI-013 keeps
the separate Desktop consumer gate pending. Prompt assertions and shell
admission remain unchanged. No native dependency requires an ambient sibling
crate path or invented release tag.

Hosted audit runs against the actual private install projection before restoring
tracked files. Full and production audits remain blocking. Test tooling consumes
released security repairs in Vite 7.3.7, Storybook 10.6.5, Vitest 4.1.12 and
WebdriverIO 9.32, with upstream browser-download and Mocha serializer overrides.
The language-service chain uses released KaTeX 0.18.10; private App Profile uses
Markdown 0.2.0 without the former Mira/KaTeX cohort.

Approved development audit exceptions run through 2026-11-30.
GHSA-gcqx-w48m-w2h4 is deepmerge 4.3.1 under the Svelte Vite plugin.
GHSA-3g3m-2fjr-6pw4 is glob 10.5.0. GHSA-g3hv-75wg-m249 retains only the
WebdriverIO minimatch 9.0.9 and 10.2.6 edges after its upstream range narrowed
(E-DEPENDENCIES-004). Enforce each exact path, version and expiry; retain full
diagnostics. Production findings and any new or changed advisory remain
blocking. Remove stale exceptions.

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

## Mobile shell integration

[E-MOBILE-006](../history/E-MOBILE-006.md) records released Core 0.13.0 and
Notes UI 0.1.9/API 0.3.1/Language Service 0.1.3/File Explorer 0.2.5/Workspace
0.4.0 intake. The private App Profile is rebuilt from that Notes source and
retains its ^0.0.0 range. The JavaScript source pin advances independently of
`validation/native-sources.json`: Notes Rust remains at `40b9ba8e` and native
application crates retain lapis-server `530a6c42`. A renderer-only dependency
update MUST NOT silently refresh those native inputs. Actual native-window and
distribution qualification remain separate.
