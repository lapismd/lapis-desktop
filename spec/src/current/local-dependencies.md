# Local dependency intake

Archive admission MUST check actual runtime/peer ranges and local workspace
development ranges. A published dependency's development-only pins do not belong
to the consuming Desktop graph and MUST remain unchanged.

LD-GOV-006 and LD-GOV-008 govern this development workflow. Existing migration,
native product, provider, distribution and visual gates remain unchanged.

Local review refreshes MUST rebuild the complete direct/transitive first-party
cohort from the latest committed source in each owning default checkout,
including work ahead of or separate from its `main` bookmark. Refresh MUST
reject uncommitted package/build inputs; unrelated documentation edits may
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
