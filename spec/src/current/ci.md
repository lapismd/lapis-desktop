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

| ID        | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-CI-001 | CI MUST use actual PR/push ranges, include rename sources and destinations, and select complete dependent gates. Docs-only changes MUST validate specification/evidence without building private packages or native helpers, subject to the trusted dependency-author spec exemption. Unknown paths, shared configuration, missing history and explicit full requests MUST select all gates.                                                                                                                                       |
| LD-CI-002 | Rust build caching MUST bind to platform/architecture, pinned toolchain, Cargo manifests/locks, build environment and private source pins. All artifact producers and consumers MUST use the exact tracked Node patch; floating selectors cannot qualify verified reuse. Caches MAY reuse dependency outputs, but MUST NOT replace selected Linux tests. Ordinary bundles MUST still be rebuilt/audited and reject acceptance drivers; helper inventory/signing and final artifact hashes remain authoritative.                    |
| LD-CI-003 | Full CI MUST remain explicitly dispatchable. Every executable test, quality, catalog and Rust lane MUST run on Linux. Ordinary pull-request and main required checks MUST be Linux-only; macOS runners MUST be packaging-only for explicit full, trial and release publication. Release preparation MUST require successful full Linux tests and three-platform packaging of the identical main commit, not a docs-only green run, and GitHub Releases MUST publish those same qualified bytes with RC versions marked prerelease. |
| LD-CI-004 | Validate MUST require successful planning and every selected gate, and reject failed/cancelled results even for unselected jobs. It MUST distinguish unselected acknowledgements from test passes and preserve both required Linux target checks. Ordinary Validate MUST NOT require macOS jobs. macOS packaging success MUST NOT be represented as test or native acceptance success.                                                                                                                                             |

The planner selects whole test families rather than removing assertions. Desktop
currently owns one Rust application crate, `lapis-desktop`; its changes select
native unit/Clippy and Linux builds. Cargo workspace dependency closure includes
transitive consumers when more crates are present. Catalog-only changes do not
rebuild native apps. Production renderer changes include catalog and Linux
native consumers. An inventoried native test-only change selects static
governance and both Linux native targets; it does not dispatch macOS packaging.
Unmapped harness, shared infrastructure and unknown ownership select the full
Linux test/build profile plus packaging. Release-tool tests run without
unrelated feature/browser suites.

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
preparation checks that marker and all Linux test/platform-build results. Four
Storybook shards must all pass whenever selected. Audits start after the
lightweight planner, independently of the other validation gates. The plan,
reasons and actual job results remain visible in CI summaries. Explicit full
qualification runs all gates even if only documentation changed. Cache misses
preserve correctness and are reported as misses, not test passes.

## Reliability and feedback profiles

Schema 2 records the actual checked-out Git revision separately from the PR
source range, profile, an empty hosted native-family inventory, catalog profile
and private prerequisite platforms. Rename sources and destinations both
contribute. An ordinary success cannot create the full-source marker. Missing,
cancelled, failed or incomplete selected reports fail their stable aggregate.
Full qualification requires all four catalog display modes, ordinary macOS
packaging and both Linux platform builds on the exact main SHA. Release checks
inspect current job attempts across all result pages.

Private package producers build public exports once per selected platform and
transfer verified relocatable archives and their projected dependency graph.
Ordinary required consumers select Linux platforms only; macOS private-package
archives are produced only when packaging is selected. Consumers verify
source/configuration/tool identities and hashes before install; no
cross-platform node_modules or private signing keys are transferred. Native and
non-native workflows provision the exact `.node-version` patch so concurrent
jobs cannot resolve different Node releases while sharing verified artifacts.
The recorded executable version remains part of artifact identity. Desktop's
tooling image is manually published for Linux ARM64/x64 from immutable bases,
contains no repository source, credentials or package graph, and carries
checksum-verified Linux and macOS ARM64 Jujutsu/mdBook payloads plus each
supported runner's original Vectorscan archive. Consumers MUST pin its registry
digest and authenticate the pull with the ephemeral workflow token; an
unpublished tag cannot enter qualification and no credential enters the image or
exported payload. The image MUST pin a checksum-verified Git version compatible
with its Jujutsu binary and execute a real local Jujutsu fetch during image
verification; consumer jobs MUST NOT download or substitute either tool. The
current `2026.11.3` image is pinned at
`sha256:ae8bcdde66e170bae0bc334d47ada879c345912ac3581e1ec8d766c3e4b1a858`. The
publisher builds a local image first and runs Jujutsu-dependent source checks
inside it; a clean host never downloads those tools or falls back. Each workflow
exports the image-owned bytes once, binds them to the current repository,
source, run and attempt, and transfers one mode/hash-verified cross-platform
artifact. Linux Quality and Unit execute inside that pinned image so their Rust
checks and tests receive its fixed GTK/WebKit build libraries without a runner
download. Consumers reject a missing producer, foreign attempt, changed digest,
extra file, unsupported platform or non-executable payload. After verification
they force Vectorscan's crate-owned offline mode and select only that platform's
archive directory. Turbo MUST pass both values into every selected child task;
ordinary jobs MUST NOT download this native dependency. Hosted native
preparation, family execution, quarantine diagnostics and the Native ARM64
aggregate are disabled. Their local entry points, inventories, assertions,
deadlines and quarantine records remain intact. Linux tests and browser/catalog
results cannot qualify macOS WebView, focus, window, lifecycle, Keychain or
backup behavior. A macOS bundle build proves only compilation, packaging and the
ordinary-bundle audit.

A listener-confirmed native startup that exhausts its renderer-acknowledgement
budget remains failed. Before cleanup, its harness MAY make one bounded driver
attachment solely to retain startup phase and DOM state. The attachment occurs
only after the original failure and MUST NOT restart the app, retry acceptance,
extend the readiness deadline or substitute diagnostic state for a pass.

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
backup quarantine or macOS UI. Local quarantine diagnostics remain explicit,
uncached and non-qualifying.

The Original/Managed reader failure in Linux job `130024094859` was reproduced
locally as a completed jj-store session/relink command leaving the next command
spuriously `Busy`. Desktop and Core pin the owning explicit-unlock repair
recorded by E-CI-085. True overlapping same-binding commands remain `Busy`; no
retry, deadline, assertion, process boundary or quarantine changes. Linux
reproduction and repair do not qualify the retained macOS ARM64 quarantine. The
original exact dependency refresh is recorded by E-CI-086; E-CI-087/088 record
the two rebased Core identities without changing that boundary. The
approximately ten-minute ordinary feedback objective is a measurement target,
not an acceptance bypass.

The former hosted paired diagnostic dispatch is unavailable under the Linux-only
test policy. Any local macOS investigation remains a fresh, non-retrying,
non-qualifying result and MUST retain original callbacks, deadlines, resource
verification, exact selectors and earlier failures.

## Scheduled validation and rollout

Canonical main runs full validation daily at 02:17 UTC in a separate concurrency
group; an active nightly is allowed to finish. Nightly/full test execution
bypasses Turbo result reuse while dependency build caches remain available.
Scheduled runs validate only: they cannot publish, sign or authorize a release.
A separate read-only health workflow every six hours requires a nightly attempt
within 30 hours and a complete success within 48 hours, with failed, missing,
access-denied and incomplete evidence reported distinctly. Prior-nightly success
on another revision cannot qualify a release candidate.

Narrower ordinary catalog profiles stay disabled until a complete hosted
full/nightly baseline passes. `LAPIS_CI_NARROW_PROFILES=qualified` explicitly
enables the inventoried narrower catalog selections; absent that setting,
affected catalog gates retain all display modes. Required risk-related PR checks
are never deferred exclusively to nightly.

Artifacts retain attempt-specific names and producer provenance. Qualification
requires current-attempt reports from every selected Linux test and build gate:
rerun the complete workflow after failure, because rerunning only failed jobs
cannot reuse earlier results as current execution. Earlier attempts and failures
stay retained. Image-backed producer and consumer jobs explicitly trust only
their exact mounted workspace before resolving the checked-out commit; checkout
trust written under a temporary home is not inherited by later container steps.
An image-backed unit process with effective UID 0 MUST run an exact
permission-sensitive case in an unprivileged child. Child launch or assertion
failure MUST fail the parent; the case is never skipped or weakened.

Native runtime packaging MUST prepare the pinned AI source checkout's declared
Node tooling with its frozen lock before importing its bundle verifier. Packed
application client archives do not supply that source-side TOML tooling. This
preparation must preserve manifests/locks and avoid rebuilding public exports;
installer failure remains a real preparation failure.
