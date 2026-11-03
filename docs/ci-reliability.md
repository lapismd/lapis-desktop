# CI reliability rollout

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
responds and retains one 15-second deadline plus the shell-ready assertion.

Backup diagnostics live in shared Core commit
`fd92fb521f9ac49a20bb97293c32f50c5e31cbaa`. In a debug diagnostic environment,
`LAPIS_APP_BACKUP_DIAGNOSTICS=1` reports fixed initialization and shutdown
stages with safe error categories, without native paths, credentials or error
strings. The original ARM64 case and its scoped integration-test group must
still run after intake; Linux non-reproduction does not resolve that failure or
remove its quarantine.

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
compatible compiled outputs.

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
