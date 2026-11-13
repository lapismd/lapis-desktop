# CI reliability rollout

## Current hosted execution policy

As of 2026-11-12, all executable hosted tests run on Linux. macOS runners are
build-only for private-package projections and ordinary application artifacts.
The native-family and diagnostic descriptions below document retained local
machinery and earlier attempts; they are not current hosted or release gates.
Linux/browser success cannot qualify macOS native behavior. See E-CI-091.
Linux Quality and Unit run inside the immutable Desktop CI image, which already
contains their pinned Rust and GTK/WebKit build prerequisites.

The durable implementation status and continuation checklist are in
[CI reliability handoff](ci-reliability-handoff.md). That handoff preserves the
original slice plan, the nightly-only augmentation and the exact pending steps.

The implementation follows the Desktop plan and borrows daily full validation
and independent freshness monitoring from the secondary scheduling plan. It does
not move risk-related checks exclusively to nightly or change product deadlines.

## Coverage and scheduling

- Ordinary CI retains affected gates. Narrow native/catalog profiles are
  disabled until a complete hosted full/nightly baseline passes. Then the
  repository variable `LAPIS_CI_NARROW_PROFILES=qualified` enables inventoried
  selections.
- Full CI executes all native families, four catalog variants, ordinary bundle
  audit and both Linux builds. Linux x86_64 also runs portable Rust tests and
  verifies the Original/Managed reader case actually passed.
- Canonical main runs full validation daily at **02:17 UTC**. The active nightly
  finishes in its own concurrency group. No scheduled job publishes or signs.
- Independent health runs every six hours at minute 43. It requires an attempt
  within 30 hours and complete success within 48 hours, checking current-attempt
  jobs and retained evidence. Health is separate from test and release verdicts.
- Scheduled runs do not authorize releases. Candidate preparation requires a new
  explicit full qualification for the identical main SHA after a newer nightly;
  older success cannot hide a newer failed/cancelled attempt.

## Native execution

Public headed commands still run the whole original inventory. On provisioned
macOS ARM64, preparation and independent execution use the supported dispatcher:

```sh
LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- headed --operation prepare
node scripts/ci-acceptance-artifact.mjs export .local/ci-acceptance-artifact
```

A fresh consumer with the same source/toolchain and verified package inputs can
execute an individual family:

```sh
LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- headed \
  --operation execute --family services \
  --reuse-artifact .local/ci-acceptance-artifact/manifest.json
```

The families are `smoke`, `workspace` and `services`. Each owns fresh profiles,
vaults and ports. UI tests stay serial; HTTP/resource assertions still execute
after feature failure. Cancellation stops new work and leaves incomplete
reports.

Use [quarantine diagnostics](native-quarantine.md) for original skipped bodies.
No cases are automatically retried or re-enabled. The metadata window case stays
enabled; its disappearance remains a real failure. New bounded diagnostics show
native lifecycle, driver handles, switching and IPC without showing/focusing or
recreating the foreign window. Readiness now stops polling after the listener
responds and retains one 15-second deadline plus the shell-ready assertion. If
that listener-confirmed renderer acknowledgement fails, the already-failed run
makes one bounded driver attachment only to retain renderer phase and DOM state
before cleanup. This diagnostic cannot retry startup, extend the deadline or
turn the failed case into a pass.

Backup diagnostics and the adopted command-lease repair live in shared Core
commit `530a6c425e9183f93ee74c0b16bb4111fdc838f0`. In a debug diagnostic
environment, `LAPIS_APP_BACKUP_DIAGNOSTICS=1` reports fixed initialization and
shutdown stages with safe error categories, without native paths, credentials or
error strings. The original ARM64 case and its scoped integration-test group
must still run after intake; Linux non-reproduction does not resolve that
failure or remove its quarantine.

Linux PR #17 job `130024094859` supplied a reproducible failure: a completed
jj-store session/relink command could leave the next same-binding command
spuriously busy. jj-store `076e418cecbe204925aea874bef8aa8a680269a9` retains the
explicit command-lease release. Genuine overlapping commands retain the original
non-blocking busy result, and ARM64 qualification remains required.

## Artifact and retry boundaries

Package producers transfer checksummed public archives and the identical frozen
projected graph, never node_modules. The pinned Tasks native fixture remains
separate from the application's registry Tasks dependency. Native artifacts bind
actual SHA/tree/checkout bytes, toolchains, platform, build configuration,
permissions, symlinks and immutable resources, including the HTTP renderer.
Private signing keys and mutable profiles are excluded.

Artifacts and reports bind repository/workflow/run/attempt and have
attempt-suffixed names. **Rerun the complete workflow**, not only failed jobs,
when seeking full qualification: previous successful family/producer jobs do not
become current execution. Earlier attempt artifacts remain retained.
Full/nightly Turbo runs force test execution; dependency caches still reuse
compatible compiled outputs. Containerized tool producers explicitly trust only
their exact mounted `GITHUB_WORKSPACE` before reading the checked-out Git
commit; they never use wildcard safe-directory configuration.

## Evidence still required

The local receipt records tests, actual host browser results and all
limitations. No hosted speedup, ten-minute target or resolved native race is
claimed yet. Remaining gates include real ARM64 metadata/ACP and backup
diagnosis, independent native family execution, cold/warm hosted cache and
artifact comparisons, complete catalog execution and at least one complete
nightly. The initial family split has complete ownership but is not yet
duration-balanced from hosted data.

The native inventory accounts for all 93 top-level native test/spec files: 54
original headed files, 11 API/ONNX-only, 12 live-provider-only and 16
pre-existing standalone manual CI gaps. Optional/manual files are explicitly
classified in
[supplemental ownership](../scripts/native-optional-inventory.json); they do not
enter ordinary defaults or become qualified by a nightly success. New unknown
files fail required planning until their execution ownership is reviewed.

Native consumers also prepare the pinned AI checkout's declared Node tooling
before importing its runtime-bundle verifier. The packed application AI client
does not install the source packer's TOML dependency. A frozen tooling install
handles a clean consumer without rebuilding JavaScript exports; warm reuse
retains the existing source-owned tooling.

Corrected hosted run `41438438608` and handoff run `41449872787` both retained
real failures. The latter passed package production, acceptance preparation,
catalog, bundle and Linux work, then exposed four orchestration defects: hosted
context leaked into two unit fixtures, WDIO reported exact spec files as file
URLs, portable fixture fanout omitted detached signed envelopes, and the HTTP
development-origin case compiled after artifact restore until its original
300-second test deadline expired. The current repair keeps the assertions and
deadlines, adds the missing immutable bytes, canonicalizes only path spelling
and moves that exact e2e compilation into producer preparation. A complete new
hosted attempt remains required; the earlier attempts stay failed evidence.

Complete run `41551526412` at `1df3ad9` retained a separate verified-reuse
failure before Storybook shard 2 executed. Its dependency producer resolved Node
24.22.1 while that consumer restored Node 24.22.0 from the hosted tool cache
because every workflow requested the floating major `24`. Verification correctly
rejected the executable-toolchain mismatch. All hosted setup actions now pin the
repository's exact `.node-version` value; executable identity verification
remains unchanged. This attempt is failed evidence, and only a new complete
workflow can qualify the correction.

Complete PR run `41553468043` and explicit full dispatch `41562361935` at exact
head `c05f6bc` each passed all 25 jobs in one attempt, including four catalog
shards, three native families, both Linux targets, Validate and Full source
qualification. These runs establish current hosted orchestration and exact-head
full qualification; they do not establish a post-merge nightly, diagnose either
ARM64 root cause or authorize a release. The paired diagnostic profile now
reuses one acceptance artifact for normal-family and isolated original-case
evidence and separately runs the scoped Rust backup investigation without
issuing a qualification marker.

PR #9 merged that qualified head into canonical `main` as `a7bc2735` on
2026-11-03. The paired diagnostic profile is a separate post-merge slice; its
own exact-head complete run, affected-platform evidence and later scheduled-main
evidence remain required.

Initial paired run `41601703657` at `d11e4d52` retained a pre-inventory Rust
diagnostic failure: the Tauri build script correctly refused the absent genuine
`resources/lapis-ai` bundle, so neither the isolated case nor scoped group ran.
The Rust diagnostic now depends on the current-attempt native producer and
restores resources only through the verified acceptance artifact before Cargo
inventory. This is a harness repair, not ARM64 backup evidence; the complete
attempt remains failed and must not be rerun by failed job only.

Paired run `41609246251` at `6a7a1b95` proved that verified resource restoration
worked, then the exact ignored case failed in its Original repository fixture
before `start_backup()`: spawning the external stock `jj` executable returned
`ENOENT` at `repository_original/fixture.rs:27`. No Core initialization stage
ran, so this is not evidence of the reported backup mechanism. The diagnostic
job now installs the same checksum-verified pinned Jujutsu tool used elsewhere
in CI before Cargo inventory. The failed run remains retained and requires a new
complete attempt.

That same run exposed a second paired-harness defect: the native quarantine
delegate received `--reuse-artifact` and its manifest as separate arguments,
while its fail-closed parser accepts only `--reuse-artifact=<manifest>`. The
selected ACP original body therefore did not execute and produced no result
report. The workflow now supplies the required single token. The run also
retains two independent enabled-family failures: the services terminal reopen
kept two live shells but rendered no prompt, and workspace preview recovery left
the reviewed disk contents instead of its later saved contents. Both passed in
the ordinary exact-head PR run, remain failures here, and require owner-side
reproduction rather than retries, assertion changes or new quarantines.

Ordinary PR run `41618609548` at `a389fb33` later failed the enabled services
family in `ai-transcript-backup.test.mjs`. Its retained native artifact proves
the selected `a8989560` revision was valid but changed only the two startup
skill files; `transcript.jsonl` was therefore correctly absent from that
revision's Changed files list. The acceptance test had treated the latest
post-startup status head as the revision that introduced the seeded transcript.
It now inspects actual revision deltas from oldest to newest and selects the
first transcript-bearing checkpoint, failing with the inspected commit/path
inventory if none exists. The 30-second waits, 180-second case deadline, guarded
restore, exact bytes, cold reopen and no-prompt-replay assertions remain
unchanged. A new complete workflow attempt is required.

Fresh PR run `41640134092` at `bbc7dfbf` advanced that same enabled case past
revision publication and retained a different acceptance-helper defect. Its
native artifact and DOM show the selected `8d8868b5` row was the clean JJ
working copy, its parent comparison completed, and the UI correctly rendered
`No changed files in this comparison.` The helper waited only for a non-empty
Changed files region, so it never continued to the older saved revisions. It now
treats that explicit empty state as an empty path inventory, continues the same
oldest-to-newest inspection, and fails closed if comparison is unavailable or
visible states conflict. The original 30-second comparison boundary, 180-second
case deadline and restore/no-replay assertions remain unchanged. This failed
attempt remains retained and a complete new workflow attempt is required.

Complete PR run `41650072646` at `a21f3e93` passed the prerequisite and portable
lanes but retained one enabled services-family failure. The transcript-backup
case timed out at the unchanged 30-second History comparison boundary. Its
artifact proves the oldest saved commit already contains `transcript.jsonl`,
while the final DOM shows the clean working-copy comparison expanded after the
timeout; it does not retain the intermediate comparison inventories needed to
identify why inspection advanced. The helper now emits a bounded revision/path
inventory for each completed comparison and, on timeout, records the expected
and expanded revision plus busy/files/empty/unavailable state. Diagnostics do
not retry, extend the deadline, select a substitute revision or change restore
and no-replay assertions. The failed run remains retained and a new complete
attempt is required.

Exact-head PR run `41661185466` at `9e3247a1` retained the same enabled case
after the bounded diagnostics made the actual selection path visible. Two saved
revision comparisons completed, but WebDriver returned each Changed files tree
as one flattened string containing the heading, count, directories and file
labels. The helper therefore missed the exact `transcript.jsonl` identity and
continued to the working-copy revision, whose explicit comparison-parent choice
correctly leaves automatic comparison pending. Acceptance now reads the public
`data-ui-part="file-row"` rows and their exact `data-file-path` identities;
duplicate or malformed identities fail closed. No product controller, retry,
deadline, restore assertion or no-replay boundary changed. The attempt remains
failed and a complete new workflow is required.

Exact-head PR run `41670185180` at `52d8d94b` proved that the public file-row
selector was correct but its WebdriverIO element-array `map` returned an
asynchronous collection. Passing that map promise directly to `Promise.all`
failed before any History assertion. The reader now awaits the collection and
then its attributes before preserving the same exact-path validation.

The same run's smoke family exposed an independent Desktop lifecycle race. The
failed-layout toast was visible before `lifecycle_result(saved: false)` had
finished cancelling the native request, so the test's deliberate second Cmd-R
was coalesced into the still-pending request and never emitted. One reload press
during a failed pending reload is now dispatched after its matching cancellation
acknowledgement. Successful reload discards queued duplicate presses, native
errors remain fail-closed, and the original five-second assertion is unchanged.
This is user-request retention, not an automatic test retry.

Run `41640134092` retained two workspace-family failures in its complete
attempt. The Graph recovery case created conflicts for both
`.lapis/lapis-graph.json` and `.lapis/app.json`; its shared helper clicked the
first generic `Review your draft` problem and opened the Graph-settings review
instead of the requested App-settings review. Conflict navigation now selects
the exact encoded diagnostic resource group before preserving the same review
and disk assertions. The preview recovery case closed its conflict view before
its protected editor became writable, so WebDriver input during the recovery
lease produced no later edit. The existing owning Mira recovery contract already
requires `contenteditable=true` before post-recovery input; Desktop now observes
that state within the unchanged case deadline. No assertion, product behavior,
retry or quarantine changed.

Run `41650072646` retained two different enabled workspace failures among 82
cases: 72 passed, two failed and eight existing quarantines skipped. Explorer
move typed without first establishing that the complete seeded note was visible,
producing the exact retained assertion `# Retained local draft# Original note`;
disk bytes remained the external version and no filesystem mutation began. The
fixture now requires the complete expected editor source within the existing
case deadline before replacement input. The metadata case proved the hidden
secondary WebView was created, enumerated, switched and IPC-ready before
`no such window` was reported around explicit close/return. Bounded handle
observations now bracket close and main restoration and retain the original
error. They do not recreate, show, focus or retry the vanished window, and are
not a root-cause repair.

Run `41682741473` isolated that error to WebdriverIO's post-`closeWindow`
context handling. The real secondary renderer reached IPC, the native close
completed, and handle enumeration already showed only `main`; the driver hook
then selected the destroyed `acp-other` handle returned by the close response.
Acceptance now requests one native close from the secondary renderer, waits
within the unchanged bound for `main` present and `acp-other` absent, and
explicitly restores `main`. Failure before the close request remains fatal, and
the fixture does not recreate, show, focus or retry the window. A complete macOS
ARM64 rerun is still required.

Run `41690467381` exposed a separate services-family acceptance-helper race. The
enabled Terminal disable/vault-return case retained one directly admitted shell,
closed the visible Terminal and requested a new visible session. The shared
helper treated the retained shell as readiness because it waited only for a
nonzero session list; diagnostics later showed two live shells while the new
visible output remained blank. The helper now snapshots prior IDs and waits for
exactly one new session before applying the unchanged prompt assertion and
deadline. Multiple new admissions fail closed, and no open or prompt request is
retried.

Complete paired run `41618655199` at the same `a389fb33` head passed all three
normal native families and the ARM64 backup diagnostic. The original ignored
case passed 1/1 in isolation and the scoped `repository_original` binary passed
4/4 with Core diagnostics enabled; all fixed initialization stages reported
success. This is affected-platform non-reproduction, not a root-cause repair,
quarantine removal or qualification. The paired ACP job still stopped before the
original callback: its attempt receipt invoked `jj log @` even though Actions
provides a Git-only checkout. Hosted receipts now use the already validated
40-hex `GITHUB_SHA`; local diagnostics retain their Jujutsu snapshot. A complete
new attempt remains required.

Ordinary run `41618609548` also retained two enabled workspace failures. The
metadata panel activated while a same-leaf open was still completing and kept
the prior file; the owning `@lapis-notes/api` regression failed before its
source repair and now passes in lapis-notes PR #79. Desktop must consume a
released registry package before that repair can qualify the native case. The
preview conflict case began its later edit before the resolved review finished
unmounting, so a stale review cleanup overwrote that edit. Acceptance now waits
for the existing conflict review to disappear after the unchanged disk-version
action, before performing and asserting the later edit. It does not extend a
deadline, weaken an assertion or change product behavior.

Fresh run `41630554968` at `c0e62124` narrowed the remaining Linux Rust failure.
Both concurrent backup attempts completed every initialization stage through
`HistoryIndexing`; the unchanged Original/Managed case then failed at its
explicit `stop_backup` call. Its local exact case passed 1/1 and scoped group
passed 4/4 with diagnostics, which are non-reproductions. Shared Core now adds
fixed safe shutdown stages through final capture at `8a063516`; a new complete
consumer run is required and the ARM64 quarantine remains unchanged.
