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
`3f79b7c6dc883929ad7810a61e5680a07d33ae0e`. In a debug diagnostic environment,
`LAPIS_APP_BACKUP_DIAGNOSTICS=1` reports fixed initialization stages and safe
error categories without native paths, credentials or error strings. The
original ARM64 case and its scoped integration-test group must still run after
intake; Linux non-reproduction does not resolve that failure or remove its
quarantine.

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
