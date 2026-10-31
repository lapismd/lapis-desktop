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

E-AI-100 consumes the prepared Design Core `54e142bc` dropdown contrast/priority
repair. All other archived sources retain their verified receipts; the linked AI
client was rebuilt at `157bc082`. Intake checks all 21 packages and 64 import
routes.

E-AI-102 consumes Design Core `98c64887` to keep one composer action through
pending submission. Its prepared archive and complete-cohort intake are pinned
in the fresh evidence; runtime authority and distribution gates are unchanged.

Local archive overlays also route transitive imports of explicitly declared
linked native packages to the same built public exports. Normal semver ranges
must match the local version; only the root's exact declared link may bypass
range parsing. Tracked dependency manifests and lockfiles remain portable.

R2.2.3 consumes the private Notes application-profile through its packed public
`native-chat` entry with a normal package range. The temporary verified archive
is an ignored development prerequisite until distribution. Its Agent UI and API
imports use the same verified consumer package identities. Source aliases,
copied screens and a second chat writer remain prohibited.

The Docker-first intake raises the Mira minimum to released `0.1.1`; its three
companion packages remain at released `0.0.3`. The temporary Design Core archive
uses committed `944cd448`, which includes the qualified autocomplete lifecycle
repair and requires Mira `~0.1.1`. Independent uncommitted source changes MUST
NOT enter that archive. The remaining first-party cohort retains its
individually recorded qualified inputs; this selective intake does not claim
complete latest-source freshness.

Portable validation MUST declare every unpublished or linked package as a
checksum-pinned archive prerequisite. It MUST resolve an isolated projected
lockfile before frozen installation and restore the tracked dependency files
before checking the source. The existing tracked lock does not yet qualify a
registry-only install: App Profile, Agent UI and Repository UI are unpublished.
Publishing those prerequisites and regenerating a complete frozen registry lock
remain distribution work. [E-CORE-023](../history/E-CORE-023.md) records the
dependency cohort and its separate consumer qualification.

E-DEPENDENCY-003 qualifies the repaired separately signed Bases bundle through
the existing native metadata/edit/watch/cold-restart case. Keep its signed build
source identity and exact archive hash; a documentation-only source successor
may be recorded as equivalent only after verifying unchanged public inputs. The
static UI cohort does not qualify dynamically installed plugin assets.

E-CORE-028 selects qualified Notes `211bff3c` with Tasks `fcb2a8b5` for the
shared History lifetime and final closed-watch reconciliation, plus jj-store
`5f4bf729` for bounded committed-reader admission (source E-VAULT-BACKUP-022).
Other native pins and the final 26-package UI cohort remain fixed. Metadata
writers, current-file Search and AI defaults are separate intakes; no
corresponding default switch is inferred.

E-ICONS-001 selects the qualified scoped Design Core resolver, Notes
API/Explorer and Bases artwork through 28 checksummed public archives. Explorer
displays the registered artwork and opens the same file through its contributed
view; extension-to-icon maps and artwork remain owned by the contributing
packages. All 2,060 catalog cases pass on that exact cohort. This selective
renderer intake preserves the other native pins and does not claim a complete
latest-source review refresh.

E-ICONS-002 qualifies the combined-main Notes archive refresh and private SSH
connection controls. The 28 selected archives match installed payloads across
110 active import routes. All 2,060 combined catalog cases pass; original native
pins, source ownership and distribution gates remain unchanged.

The R7 candidate selects landed Notes `cd997c2c` and its freshly packed
API/AppProfile pair through the explicit 31-archive overlay. E-CORE-045 retains
its older `b2034168` provider proof; E-CORE-046 keeps current-cohort
strict/native/provider acceptance pending. Preserve verified archive payloads in
default-owned ignored storage before retiring their source workspaces. No
installed application or user profile changes as part of source preparation.

Published intake now requires `@lapismd/mira` `~0.1.2`. Its three companion
packages stay at released `0.0.3`. `@lapismd/jj-history` is registry `~0.1.0`.
`lapis-ai-capture`, `tauri-plugin-lapis-ai`, and `lapis-ai-app-tools` use git
tag `v0.2.0` at version `0.2.0`. These stay, because they have no npm release
and no crate tag: `@lapismd/ai`, `@lapismd/jj-conversations`,
`@lapismd/terminal`, and App Profile. Hosted CI uses committed
`scripts/ci-sources.json` identities for these private public-build inputs and
the History repository controllers absent from its published 0.1.4 archive.
Agent UI and Repository UI have published npm packages; the send-capability
repair below temporarily selects an owning Agent UI archive. The published Notes
selection is API 0.2.0, UI 0.1.4, Workspace 0.3.0 and File Explorer 0.2.0;
Markdown is 0.2.0 and Design Core is registry 0.7.1. This private validation
projection does not qualify a registry-only distribution.

All jj-store crates use git revision `7a98bd89d2bc77fb6ec41f91186992abb19ba161`.
Native application crates use lapis-server
`4150cac6f2fef28b128421e4e3a851b848acdcf3`, restoring retained projection
engines through exact owning Plugins, Tasks and Docs Git commits. Terminal uses
`2463f944149d753eaf638cf876393a6f60f50190`, retaining the attachment/ordered
capture repairs and adding Terminal PR #12's fenced detach/remount sink. The
source's forced race, real PTY stress, 109 Rust tests, strict Clippy and hosted
native gate pass; E-CI-013 retains the separate Desktop consumer gate. Prompt
assertions and shell admission remain unchanged. No native dependency requires
an ambient sibling crate path or invented release tag.

Hosted audit runs against the actual private install projection before restoring
tracked files. The tracked lock records the published registry graph; private
inputs are added from the pinned public archives. Both complete and production
audits remain blocking. Test tooling consumes the released security repairs in
Vite 7.3.7, Storybook 10.6.5, Vitest 4.1.12 and WebdriverIO 9.32; the pinned
Puppeteer browser-download and Mocha serializer overrides use upstream packages.

The user approved only development advisory GHSA-gcqx-w48m-w2h4 for deepmerge
4.3.1 under the Svelte Vite plugin through 2026-11-30. The exact path, version
and expiry are enforced; full audit reports remain visible, production findings
and any changed/new advisory remain blocking. Stale exceptions require removal.

Notes private App Profile uses Markdown 0.2.0 at source revision
`c5891836d1633e66a75da683eb7ae5676ef7af47`, removing the former transitive
Mira/KaTeX cohort instead of overriding a public plugin requirement in Desktop.

The language-service Markdownlint chain also consumes published KaTeX 0.18.10
through the same bounded security override used by Notes; its upstream 0.16
range otherwise retains GHSA-238p-pmpm-9mq7. CI verifies installed private
archive payloads across every active import route before testing or auditing.

Workspace 0.3.0's shared conflict screen omits explicit disk acceptance. Notes
has now published and verified Workspace 0.3.1, API 0.2.1 and UI 0.1.5, with
signed provenance and scoped GitHub releases at `462d2248`. Desktop still builds
the equivalent Workspace archive from qualified Notes
`6f315baef2bd2f0bb4942927d4e19b9e0eb2a15d` until registry cohort adoption.
Tracked ranges stay portable. The shared presentation lease, guarded deletion
and leave assertions remain unchanged; registry-only distribution remains a
separate complete-cohort gate.

Design Core's released 0.7.1 contains the qualified composer/SurfaceLayer
lifetime, filter contrast and transcript bottom-lock repairs. Hosted and local
CI intake MUST consume its published `^0.7.1` range and registry lock entry,
without the former Design Core source download, local build or archive
projection. Other explicitly pinned private source prerequisites remain.
E-CI-005 records registry intake and its separate consumer qualification.

Agent UI's existing transcript send callback and footer must honour the host's
advertised send capability. Until that patch is released, reviewed CI validation
may use its owning built public archive at committed source
`78a03b6d56cd61c965c70163855bbf503ed349eb` from `scripts/ci-sources.json`,
retaining the portable `^0.1.0` range. Native queue authority remains in the
host and an unsupported draft retains Stop. Capability MUST remain independent
of the transcript's own draft when the host owns its composer content
separately.
