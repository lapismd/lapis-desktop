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
