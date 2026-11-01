# Affected CI and release qualification

Regular pull-request and main CI select complete affected gates. Preview
publication retains the separately required full exact-source qualification.

## Requirements

| ID        | Requirement                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LD-CI-001 | CI MUST use actual PR/push ranges, include rename sources and destinations, and select complete dependent gates. Docs-only changes MUST validate specification/evidence without building private packages or native helpers. Unknown paths, shared configuration, missing history and explicit full requests MUST select all gates.                                                                                      |
| LD-CI-002 | Rust build caching MUST bind to platform/architecture, pinned toolchain, Cargo manifests/locks, build environment and private source pins. It MAY reuse dependency outputs, but MUST NOT replace selected tests or cold native process acceptance. Ordinary bundles MUST still be rebuilt/audited and reject acceptance drivers; helper inventory/signing and final artifact hashes remain authoritative.                |
| LD-CI-003 | Full CI MUST remain explicitly dispatchable. Release preparation and publication MUST require successful full native/feature qualification for the identical main commit, including all platform builds and enabled native cases. A selective docs-only green run MUST NOT qualify a release. GitHub Releases MUST continue to publish each approved version's same qualified bytes, with RC versions marked prerelease. |
| LD-CI-004 | Validate MUST require successful planning and every selected gate, and reject failed/cancelled results even for unselected jobs. It MUST distinguish unselected acknowledgements from test passes and preserve all required check names, including both Linux targets.                                                                                                                                                   |

The planner selects whole test families rather than removing assertions. Desktop
currently owns one Rust application crate, `lapis-desktop`; its changes select
native unit/Clippy, bundle, Linux builds and real app acceptance. Cargo
workspace dependency closure includes transitive consumers when more crates are
present. Catalog-only changes do not rebuild native apps. Production renderer
changes include catalog and native consumers. Native test-only changes run the
complete native suite. Release-tool tests run without unrelated feature/browser
suites; actual candidate preparation still qualifies all three installed
packages.

A small published, locked docs toolchain supplies spec-validator, TypeScript,
Svelte parsing and formatting. It installs no private app package and starts no
application. Documentation validation retains full ancestry and immutable
receipt checks. Default developer `check`/`test` commands keep their full
behavior.

The normal required job names and Validate remain stable. Unselected required
Linux matrix contexts use lightweight Ubuntu acknowledgements with all build
steps skipped and explicit not-selected summaries. A separate Full source
qualification job succeeds only for a complete plan after Validate; release
preparation checks that marker as well as all native results. Four Storybook
shards must all pass whenever selected. Audits start after the lightweight
planner, independently of the other validation gates. The plan, reasons and
actual job results remain visible in CI summaries. Explicit full qualification
runs all gates even if only documentation changed. Cache misses preserve
correctness and are reported as misses, not test passes.
