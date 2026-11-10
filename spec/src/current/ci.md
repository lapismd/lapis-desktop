# Affected CI and release qualification

Regular pull-request and main CI use an ordinary affected profile. Full
qualification remains a separate explicit profile. Preview publication retains
the separately required full exact-source qualification.

Manual full qualification uses the source commit's first parent as its
specification/evidence base, retaining historical receipt ancestry. Missing or
invalid parent history rejects qualification. The existing initial-push root
comparison remains separate; a manual run must not reclassify every old receipt
as newly authored.

## Requirements

| ID        | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-CI-001 | CI MUST use actual PR/push ranges, include rename sources and destinations, and select complete dependent gates. Docs-only changes MUST validate specification/evidence without building private packages or native helpers, subject to the trusted dependency-author spec exemption. Unknown paths, shared configuration, missing history and explicit full requests MUST select all gates.                                                                                                                                                |
| LD-CI-002 | Rust build caching MUST bind to platform/architecture, pinned toolchain, Cargo manifests/locks, build environment and private source pins. All artifact producers and consumers MUST use the exact tracked Node patch; floating selectors cannot qualify verified reuse. Caches MAY reuse dependency outputs, but MUST NOT replace selected tests or cold native process acceptance. Ordinary bundles MUST still be rebuilt/audited and reject acceptance drivers; helper inventory/signing and final artifact hashes remain authoritative. |
| LD-CI-003 | Full CI MUST remain explicitly dispatchable. Release preparation and publication MUST require successful full native/feature qualification for the identical main commit, including all platform builds and enabled native cases. A selective docs-only green run MUST NOT qualify a release. GitHub Releases MUST continue to publish each approved version's same qualified bytes, with RC versions marked prerelease.                                                                                                                    |
| LD-CI-004 | Validate MUST require successful planning and every selected gate, and reject failed/cancelled results even for unselected jobs. It MUST distinguish unselected acknowledgements from test passes and preserve all required check names, including both Linux targets.                                                                                                                                                                                                                                                                      |

The planner selects whole test families rather than removing assertions. Desktop
currently owns one Rust application crate, `lapis-desktop`; its changes select
native unit/Clippy, bundle, Linux builds and real app acceptance. Cargo
workspace dependency closure includes transitive consumers when more crates are
present. Catalog-only changes do not rebuild native apps. Production renderer
changes include catalog and native consumers. An inventoried native test-only
change selects cold smoke plus its complete family; unmapped harness, shared
infrastructure and unknown ownership select full coverage. Release-tool tests
run without unrelated feature/browser suites; actual candidate preparation still
qualifies all three installed packages.

A small published, locked docs toolchain supplies spec-validator, TypeScript,
Svelte parsing and formatting. It installs no private app package and starts no
application. Documentation validation retains full ancestry and immutable
receipt checks. Default developer `check`/`test` commands keep their full
behavior.

Trusted dependency PR authors, including on human reruns, skip the docs runner's
specification validation, build and spec-first phases through the shared author
policy. Formatting and selected functional gates remain required. Human and
untrusted bot PRs, main pushes and ordinary local commands retain spec checks.

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

## Reliability and feedback profiles

Schema 2 records the actual checked-out Git revision separately from the PR
source range, profile, selected native families, catalog profile and private
prerequisite platforms. Rename sources and destinations both contribute. An
ordinary success cannot create the full-source marker. Missing, cancelled,
failed or incomplete selected reports fail their stable aggregate. Full
qualification requires every native family, all four catalog display modes,
ordinary bundle audits and both Linux platform builds on the exact main SHA.
Release checks inspect current job attempts across all result pages.

Private package producers build public exports once per selected platform and
transfer verified relocatable archives and their projected dependency graph.
Consumers verify source/configuration/tool identities and hashes before install;
no cross-platform node_modules or private signing keys are transferred. Native
and non-native workflows provision the exact `.node-version` patch so concurrent
jobs cannot resolve different Node releases while sharing verified artifacts.
The recorded executable version remains part of artifact identity. Desktop's
tooling image is manually published for Linux ARM64/x64 from immutable bases,
contains no repository source, credentials or package graph, and carries
checksum-verified Linux and macOS ARM64 Jujutsu/mdBook payloads plus each
supported runner's original Vectorscan archive. Consumers MUST pin its registry
digest and authenticate the pull with the ephemeral workflow token; an
unpublished tag cannot enter qualification and no credential enters the image or
exported payload. The current `2026.11.2` image is pinned at
`sha256:8461639d06b7c4d82c31ead342d782195f789b88e8cde9e69424663a827f0cce`. The
publisher builds a local image first and runs Jujutsu-dependent source checks
inside it; a clean host never downloads those tools or falls back. Each workflow
exports the image-owned bytes once, binds them to the current repository,
source, run and attempt, and transfers one mode/hash-verified cross-platform
artifact. Consumers reject a missing producer, foreign attempt, changed digest,
extra file, unsupported platform or non-executable payload. After verification
they force Vectorscan's crate-owned offline mode and select only that platform's
archive directory. Turbo MUST pass both values into every selected child task;
ordinary jobs MUST NOT download this native dependency. Native preparation
builds one debug e2e acceptance artifact. Independent smoke, workspace and
services runners verify that artifact, retain serial UI execution and own fresh
mutable profiles/vaults/ports. Preparation is not test execution. The artifact
includes each portable fixture's detached signed release envelope and a
separately compiled development-origin e2e binary for the exact HTTP renderer
case. Consumers verify and execute those bytes without compiling inside the test
deadline. WDIO report identities canonicalize file URLs before exact inventory
comparison; successful cases cannot fail solely because the runner spelled the
same spec as a URL. The stable Native ARM64 acceptance aggregate requires
preparation and every selected family's complete nonzero stage reports.
HTTP/resource checks retain their separate development fixture and execute even
after feature-stage failure.

Native restore acceptance selects the revision whose changed-path response
contains the seeded file. A current status head is not evidence that the head's
own delta contains that file because independent startup writers may create
later checkpoints. The graph may also expose a clean working-copy comparison;
its explicit no-changed-files state contributes an empty path inventory and
inspection continues to older saved revisions. An unavailable comparison,
contradictory visible states or missing file-bearing history fails closed.
Original restore, cold-reopen and no-replay assertions and deadlines remain
unchanged.

When that comparison boundary fails, headed acceptance retains bounded
per-revision fixture paths and records the expected and actually expanded
revision plus busy/files/empty/unavailable state (E-CI-059). Diagnostics do not
retry a selection, extend the 30-second wait or substitute another revision.
Changed-file discovery reads each public file row's exact `data-file-path`
identity rather than splitting the rendered region text (E-CI-061). Directory
labels, counts and layout-dependent WebDriver whitespace cannot be treated as a
path, and duplicate or malformed row identities fail closed. The oldest-to-
newest inspection, original comparison deadline and restore/no-replay assertions
remain unchanged.

WebdriverIO's element-array `map` is asynchronous. Acceptance MUST await that
collection before applying exact row validation; treating the map promise as a
`Promise.all` iterable is a harness failure, not product evidence (E-CI-062).
The same hosted attempt exposed a separate lifecycle race: a deliberate reload
pressed after its persistence failure became visible but before native failure
acknowledgement was silently coalesced. Desktop retains that one user request
until cancellation completes, while successful reload discards queued duplicate
presses. The original five-second reload assertion and all save barriers remain.

Workspace acceptance waits for the complete expected seeded editor source before
replacement input and retains the exact post-input assertion (E-CI-060).
Secondary-window diagnostics observe handles before close, after close and on
main restoration failure without recreating, showing, focusing or retrying a
vanished window. Original case deadlines and errors remain unchanged.

Native conflict acceptance selects the exact diagnostic resource when identical
messages exist for multiple paths. After disk recovery closes its review, later
preview input waits within the unchanged case deadline until the recovered
editor is saved, shows the disk text and is writable. The actual CodeMirror
content element must then own document focus before the existing replacement
input is delivered, and the replacement must become visible and dirty or already
stored. Hidden, protected or unfocused input is not a save. When canonical
plugin data also owns a compatibility mirror, acceptance waits for the initial
mirror and then requires it to equal recovered canonical plugin data before
another write or Close. An already synchronized mirror satisfies that boundary;
otherwise acceptance recovers its exact conflict. Conflict contents, close
barriers, deadlines and final disk assertions remain unchanged, and unavailable
targets fail closed. A Terminal list refused because no vault is admitted is an
empty baseline for the request that has not opened. Every other list error still
fails. The prompt assertion, deadline and single attempt stay unchanged.

Clean external-deletion acceptance requires both the expected saved disk bytes
and the exact editor's clean acknowledgement before deleting that file. Explorer
projection or disk bytes alone cannot prove that its writer has settled. The
e2e-only observation stays inside the existing wait and does not extend its
deadline; dirty or unavailable editors fail closed.

Cold lifecycle replacement input likewise waits for the complete expected editor
source, then requires the exact requested replacement to be visible before Close
or Quit. The existing case deadline and one input attempt remain; an incomplete
selection that later prepends the original source is a harness failure, not
successful writer qualification.

Rust cache keys use one effective variant/target/source-pin identity, retain
toolchain/manifest/lock/build-environment hashing and explicitly discriminate
jobs. The configured macOS minimum is selected before restore/build and
conflicting overrides fail. Ordinary bundles rely on Tauri's single renderer
build hook and retain the bundle audit. Timing receipts report restore, build
and execution durations and cache reuse; hosted cold/warm comparisons remain
required before claiming performance or reliability improvements.

Linux x86_64 executes portable Rust service tests and explicitly verifies the
Original/Managed reader case ran successfully. Linux native jobs free unused
preinstalled runner SDK trees before WebKit installation and Rust cache restore.
Linux release builds remain separate evidence and cannot qualify the ARM64
backup quarantine or macOS UI. Quarantine diagnostics are separate, explicit,
uncached attempts; their results cannot satisfy ordinary or full qualification.

The Original/Managed reader failure in Linux job `130024094859` was reproduced
locally as a completed jj-store session/relink command leaving the next command
spuriously `Busy`. Desktop and Core pin the owning explicit-unlock repair
recorded by E-CI-085. True overlapping same-binding commands remain `Busy`; no
retry, deadline, assertion, process boundary or quarantine changes. Linux
reproduction and repair do not qualify the retained macOS ARM64 quarantine. The
approximately ten-minute ordinary feedback objective is a measurement target,
not an acceptance bypass.

An explicit paired diagnostic dispatch runs the complete normal families and
selected original quarantined callbacks against one verified acceptance
artifact. Its optional Rust lane first proves `repository_original` has exactly
one ignored case, then runs that original alone and the same integration binary
with `--include-ignored`; crate-wide ignored tests remain prohibited. Diagnostic
Rust MUST depend on the same current-attempt acceptance producer and restore its
genuine AI resources through the artifact's source, run, attempt, platform,
toolchain, file, permission and symlink verifier before Cargo inventory. Missing
or mismatched resources fail before the original case. Before inventory, the
lane MUST install and verify the repository-pinned Jujutsu executable because
the unchanged Original repository fixture invokes that external stock CLI.
Missing fixture tooling is a harness failure and is not ARM64 backup evidence.
The paired native delegate MUST receive verified reuse as the single parser
token `--reuse-artifact=<manifest>`; split option/value arguments fail before
the selected original body and provide no quarantine evidence. Its hosted
attempt receipt uses the validated checkout `GITHUB_SHA`; local execution keeps
the Jujutsu working-copy snapshot. Diagnostic inputs use separate concurrency
and suppress the full-source marker even when all ordinary gates pass. Each
diagnostic remains a fresh, non-retrying, non-qualifying result. Backup records
MUST retain both initialization and explicit shutdown stages so a successful
startup cannot be misclassified when final capture fails.

## Scheduled validation and rollout

Canonical main runs full validation daily at 02:17 UTC in a separate concurrency
group; an active nightly is allowed to finish. Nightly/full test execution
bypasses Turbo result reuse while dependency build caches remain available.
Scheduled runs validate only: they cannot publish, sign or authorize a release.
A separate read-only health workflow every six hours requires a nightly attempt
within 30 hours and a complete success within 48 hours, with failed, missing,
access-denied and incomplete evidence reported distinctly. Prior-nightly success
on another revision cannot qualify a release candidate.

Narrower ordinary native/catalog profiles stay disabled until a complete hosted
full/nightly baseline passes. `LAPIS_CI_NARROW_PROFILES=qualified` explicitly
enables the inventoried narrower selections; absent that setting, affected
native and catalog gates retain all families/display modes. Required
risk-related PR checks are never deferred exclusively to nightly. The optional
diagnostic workflow stays explicitly dispatched while original failure causes
are unresolved.

Artifacts retain attempt-specific names and producer provenance. Qualification
requires current-attempt reports from every selected family: rerun the complete
workflow after failure, because rerunning only failed jobs cannot reuse earlier
family results as current execution. Earlier attempts and failures stay
retained. Image-backed producer jobs explicitly trust only their mounted
workspace before resolving the checked-out commit; checkout trust written under
a temporary home is not inherited by later container steps.

Native runtime packaging MUST prepare the pinned AI source checkout's declared
Node tooling with its frozen lock before importing its bundle verifier. Packed
application client archives do not supply that source-side TOML tooling. This
preparation must preserve manifests/locks and avoid rebuilding public exports;
installer failure remains a real preparation failure.
