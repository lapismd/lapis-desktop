# Native quarantine diagnostics

The ordinary native suite retains its existing quarantines. Stable case IDs,
original test titles, failure references, owners, mechanisms, next review dates
and re-enable criteria live in
[`native-quarantines.json`](../tests/desktop/native-quarantines.json). Optional
live-provider skips and unrelated Rust subprocess-helper ignores stay separate.
No newly failing enabled case is added to quarantine by this diagnostic path.

On a provisioned macOS ARM64 runner with the repository's pinned prerequisites:

```sh
LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- quarantine \
  --cases=acp-foreign-window
```

Select at most five comma-separated IDs in one investigation batch. Unknown,
duplicate or empty IDs fail before preparation. The native dispatcher preserves
its explicit opt-in and platform restrictions. Each selected original callback
runs with its original assertions and deadlines. Exact escaped test titles keep
other cases out of the diagnostic invocation. Test processes remain serial;
profiles, roots, vaults and ports are fresh. Intentional restart state within
one original scenario remains intact.

The diagnostic operation prepares the acceptance application unless a matching
verified artifact is explicitly supplied with `--reuse-artifact=<manifest>`.
Preparation reuse is build evidence, never test-result reuse. It does not reuse
Turbo test results and never automatically retries a product command or a failed
scenario. Start another deliberate diagnostic only after retaining the first
attempt. Stop a batch after five fresh target executions against one artifact; a
demonstrated fix may receive a separate batch of up to five, including its
normal family. A changed artifact starts a distinct batch.

Run **Native quarantine diagnostics** through Actions workflow dispatch to
execute the same path on hosted ARM64. Its failures remain failures in that
separate workflow; they do not weaken ordinary native jobs or required
aggregates. Dispatch and full qualification have distinct concurrency groups.
Diagnostics never issue a full source qualification marker or publish a release.

Before this new workflow is registered on canonical main, or whenever same-byte
normal-family comparison is required, dispatch the registered CI workflow with
its paired diagnostic inputs:

```sh
gh workflow run ci.yml --ref <candidate-branch> \
  -f full=true \
  -f native_diagnostic_cases=acp-foreign-window \
  -f rust_backup_diagnostic=true
```

That profile runs every normal family and the selected isolated original bodies
against the same prepared acceptance artifact. The Rust option restores its
genuine build resources through that artifact's complete verifier, installs the
checksum-verified pinned `jj` executable used by the unchanged Original fixture,
then independently runs the exact Original/Managed case and its scoped
integration binary. Either diagnostic may fail the workflow, but the presence of
any diagnostic input suppresses `Full source qualification` and uses separate
concurrency.

The paired native delegate receives verified reuse as one literal
`--reuse-artifact=<manifest>` argument. The quarantine parser intentionally
rejects a split option and value before any original body runs; such a failure
is retained harness evidence, not a quarantine outcome.

GitHub Actions checks out a Git repository without Jujutsu workspace metadata.
Hosted attempt receipts therefore use the validated 40-hex `GITHUB_SHA`; local
diagnostics retain the Jujutsu working-copy commit. Neither source changes
artifact verification, original callback selection or qualification policy.

Every fresh isolated root contains `quarantine-attempt.json` and
`quarantine-results.json`. They record actual source identity, selected cases,
run/attempt identity, platform, artifact selection and explicit outcomes. The
report distinguishes passed, failed, skipped, not-selected and not-executed;
zero execution, skipped intended cases, duplicate execution, missing reports and
runner failures all prevent success. The workflow uploads fresh per-attempt
results and native logs even after failure, with bounded retention. An
interrupted attempt's initial report records selected cases as not executed
until the runner finishes writing results.

A diagnostic pass leaves the ordinary quarantine in place. Re-enable an original
case only in an explicit reviewed change after a demonstrated owner fix and
successful original isolated and normal-family execution on the affected
platform. A later deliberate pass cannot erase an earlier first failure or
establish a population-wide stability rate. Linux service checks do not qualify
macOS window, focus, lifecycle or backup acceptance.

For the separate ARM64 Rust backup investigation, enable fixed-stage shared Core
diagnostics and run only its existing integration binary:

```sh
LAPIS_APP_BACKUP_DIAGNOSTICS=1 cargo test --manifest-path src-tauri/Cargo.toml --locked \
  --test repository_original \
  original_and_managed_reads_share_one_client_without_initializing_original_history \
  -- --ignored --exact --nocapture
```

On Linux omit `--ignored`. For the ARM64 group, first verify this binary's
ignored inventory contains only the intended quarantine, then use
`--include-ignored` on that binary alone. Never enable unrelated crate-wide
ignored helpers. The fixture requires the repository-pinned `jj` CLI; an
`ENOENT` while launching it is a harness failure before backup initialization,
not affected-platform evidence for the backup cause. Linux non-reproduction does
not resolve the ARM64 cause.

Paired run `41618655199` at `a389fb33` passed the isolated ARM64 backup case
(1/1) and the scoped `repository_original` group (4/4) with diagnostics enabled;
every reported initialization stage completed successfully. This is an
affected-platform non-reproduction, not a root-cause repair or authority to
remove the quarantine. The same run's ACP diagnostic stopped before its body
because its hosted receipt attempted `jj log @` in the Git-only checkout.

Fresh Linux run `41630554968` at `c0e62124` completed both initialization
attempts through `HistoryIndexing`, then failed the unchanged case at its
explicit `stop_backup` call. Local Linux exact (1/1) and scoped (4/4) executions
passed with diagnostics and do not qualify the hosted failure. Core
`8bc547eb5d60150882c87d3893a9eb48afbfb6c6` retains those opt-in safe records and
adopts jj-store `449de49476e3564ae9620f3f4c75dc0a38b498ac` after the same
original pair reproduced a completed-command lease remaining busy locally. The
owning repair explicitly unlocks completed session and relink leases while true
overlapping commands remain busy. Run the unchanged exact and scoped cases on
macOS ARM64 against that pin; do not remove the quarantine based on Linux repair
evidence alone.
