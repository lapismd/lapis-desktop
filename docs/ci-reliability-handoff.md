# CI reliability implementation handoff

This document preserves the implementation plan, delivered revisions and
remaining work after Desktop PR #9. It is the continuation point for a local
workspace; local chat history and uploaded attachments are not required.

## Plan retained

The primary Desktop plan is organized into seven slices. The implementation
keeps its reliability rules: preserve original assertions and process
boundaries, do not weaken failures, keep ordinary bundles free of acceptance
instrumentation, use owner-repository fixes for shared defects, and require the
original affected platform before claiming a quarantine is repaired.

| Slice | Planned outcome                                                                            | Current state                                                                         |
| ----- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| A     | Correct Rust cache identities and remove the duplicate renderer build                      | Implemented; hosted cold/warm comparison remains required                             |
| B     | Bound readiness and diagnose secondary-window and backup failures                          | Driver close cause repaired locally; ARM64 rerun and backup cause remain pending      |
| C     | Make quarantine execution explicit, isolated and auditable                                 | Implemented for the original callbacks; no quarantine was re-enabled                  |
| D     | Produce verified reusable prerequisite and native acceptance artifacts                     | Implemented with run/attempt/source/toolchain identity and immutable native inputs    |
| E     | Split native acceptance into independently reportable families                             | Implemented as `smoke`, `workspace` and `services`; hosted balancing remains required |
| F     | Add guarded ordinary/full profiles, complete catalog ownership and portable Rust execution | Implemented; narrower ordinary profiles remain disabled                               |
| G     | Run integrated hosted proof, compare timings and complete the handoff                      | PR and explicit full proof passed; nightly, timing and ARM64 proof remain pending     |

The secondary jj-store plan contributed scheduling policy only: daily fresh full
validation, independent freshness monitoring, separate nightly concurrency and a
conservative rollout before enabling narrower selections. Its unrelated Nextest,
Git-version and repository-specific architecture was deliberately not imported.

## Merged revisions

Desktop PR #9 merged as `a7bc2735bedc838689644197e1bcfd19f21c1c53`. Its
qualified head `c05f6bcde1180fb2fb4a24ec962f6092a2f8ea03` contains:

- `f7c6603b56d7973dfcd142248fd6560d9abb053b` — bound native startup and trace
  hidden secondary-window lifetime;
- `054a2cdf5632dee0e3d09bdcebc0947e67537954` — reuse verified CI artifacts and
  add full nightly validation;
- `c3d2b173d0b39fb3a3ce300b17f5b8c7a31c5fe8` — prepare source tooling before
  native bundle verification;
- `bd1a6da815e95ffc41f8d3c6ff686869b448206d` — preserve the durable
  implementation handoff;
- `1df3ad9256a0979dd80bfa8ff98397085bf052ae` — repair verified native artifact
  reuse; and
- `c05f6bcde1180fb2fb4a24ec962f6092a2f8ea03` — pin the hosted Node toolchain
  used by artifact producers and consumers.

Shared Core branch `fix/backup-initialization-diagnostics-20261102` contains
`fd92fb521f9ac49a20bb97293c32f50c5e31cbaa`, which adds safe, opt-in backup
initialization and shutdown stage diagnostics. Desktop pins that reachable
revision. Core `main` remains unchanged by this work.

Continuation update: Desktop head `c05f6bc` passed complete PR run `41553468043`
and explicit full run `41562361935`, 25/25 jobs each, before PR #9 merged. The
next post-merge slice adds a non-qualifying paired diagnostic dispatch for the
original ARM64 secondary-window and backup cases. All quarantines remain
unchanged; scheduled-main evidence and root-cause repairs remain pending.

Initial paired run `41601703657` failed before Rust test inventory because the
diagnostic job had not restored the genuine AI resource bundle required by the
Desktop build script. The retained report shows both original stages were not
executed. The follow-up uses the already-produced, fully verified acceptance
artifact to restore those resources; it does not bypass build validation or
change the backup quarantine.

Paired run `41609246251` at `6a7a1b95` passed verified resource restoration but
the exact ignored case then failed before backup initialization: the unchanged
Original fixture could not spawn its external stock `jj` executable and reported
`ENOENT` at `repository_original/fixture.rs:27`. The follow-up installs the
repository-pinned, checksum-verified Jujutsu tool before inventory. Retain this
failed attempt as a second harness result; it is not Core root-cause evidence.
The same run also retained a separate enabled services-family terminal prompt
failure and an enabled workspace preview-recovery persistence failure for owner
investigation. Its paired ACP diagnostic never executed because the workflow
split `--reuse-artifact` from its value; the fail-closed parser correctly
rejected that invocation. The follow-up passes the selector as one
`--reuse-artifact=<manifest>` token.

Complete paired run `41618655199` at `a389fb33` passed every normal native
family and the ARM64 backup diagnostic. The original case passed 1/1 alone and
the scoped Original integration group passed 4/4 with every fixed Core
initialization stage successful. This is affected-platform non-reproduction, not
a root-cause repair or authority to remove the Rust quarantine. The paired ACP
diagnostic still did not execute: its receipt tried `jj log @` in the Git-only
Actions checkout. The follow-up records validated `GITHUB_SHA` for hosted
attempts and retains Jujutsu snapshot capture locally.

Ordinary PR run `41618609548` at `a389fb33` retained a separate enabled
services-family transcript-backup failure. The preserved DOM and native artifact
show that the selected `a8989560` checkpoint contained only startup skill-file
changes, so the History UI correctly omitted `transcript.jsonl`. The test had
confused the latest post-startup status head with the older checkpoint whose own
delta introduced the transcript. The follow-up selects the oldest actual
transcript-bearing delta and retains every restore, cold-reopen, no-replay
assertion and original deadline.

Fresh PR run `41640134092` at `bbc7dfbf` advanced the case through revision
publication and exposed a separate clean-working-copy condition. The retained
DOM shows selected revision `8d8868b5` expanded against its parent and correctly
reported `No changed files in this comparison.` The acceptance helper had waited
only for a non-empty Changed files region. It now records that explicit empty
comparison as an empty path inventory and continues to older saved revisions;
unavailable and contradictory comparison states still fail closed. No deadline,
restore assertion, retry or quarantine changed.

Complete PR run `41650072646` at `a21f3e93` retained the enabled transcript case
at the same History boundary. The retained repository proves its oldest saved
commit contains `transcript.jsonl`; the final DOM shows the clean working copy
expanded only after the 30-second wait expired, but the artifact lacks the
intermediate path inventories. The follow-up records bounded per-revision paths
and expected-versus-expanded comparison state. This is diagnostic
instrumentation only: deadlines, selection assertions, restore bytes, cold
reopen, no-prompt replay and the single-attempt process boundary remain intact.

Exact-head run `41661185466` at `9e3247a1` then proved that both saved
comparisons completed but the helper represented each Changed files tree as one
flattened WebDriver text string. Exact membership therefore missed
`transcript.jsonl` and advanced into the working-copy revision, which correctly
requires an explicit comparison parent and remained pending. The follow-up reads
exact public file-row `data-file-path` identities and rejects malformed or
duplicate rows. It does not alter the controller, retry selection, extend the
30-second comparison wait or weaken restore/cold-reopen/no-replay assertions.

Exact-head run `41670185180` at `52d8d94b` then reached those public rows but
failed because WebdriverIO's element-array `map` is itself asynchronous; the
reader passed that promise to `Promise.all` as though it were iterable. The
follow-up awaits the collection and then every attribute without changing the
exact full-path or fail-closed identity rules. Its smoke family independently
showed a failed-layout notification becoming visible before the native
`saved: false` acknowledgement completed. An immediate deliberate second Cmd-R
was therefore coalesced and lost. Desktop now retains one such reload until the
matching cancellation completes and discards duplicates after successful save.
The five-second reload assertion, persistence barrier and no-automatic-retry
policy remain unchanged.

Run `41640134092` also retained two workspace-family synchronization failures.
Graph recovery had simultaneous conflicts for `.lapis/lapis-graph.json` and
`.lapis/app.json`; the shared helper clicked the first generic problem and
opened the wrong path's review. It now selects the exact encoded diagnostic
resource. Preview recovery closed its review before the protected editor became
writable, so its immediate WebDriver input produced no later edit. The owning
Mira contract already requires writable `contenteditable` state after recovery;
Desktop now observes that state within the unchanged case deadline. All review,
disk-content and close-barrier assertions remain intact.

Run `41650072646` retained two different enabled workspace failures among 82
cases: 72 passed, two failed and eight existing quarantines skipped. The move
case sent replacement input without first establishing that the complete seeded
note was visible; its exact assertion retained both note bodies while physical
external bytes stayed unchanged. The fixture now waits for the complete expected
source within the existing case bound before selecting and typing. The metadata
case created, enumerated and entered IPC in the hidden secondary WebView, then
reported `no such window` around close/return. Read-only handle observations now
bracket close and main restoration while preserving the original error. The
window is never recreated, shown or focused; at that revision, the ARM64
disappearance remained unresolved.

Run `41682741473` at `72cf5a89` proved the window did not disappear during
creation, discovery, switch or IPC. Workspace job `126093490555` ran 82 cases:
73 passed, one failed and eight existing quarantines skipped. The close request
destroyed `acp-other` and the next enumeration contained only `main`, but
WebdriverIO's classic/BiDi close hook selected the handle returned by the close
response and issued a later `POST /window` for the already-destroyed
`acp-other`. The fixture now requests one native close from the admitted
renderer, boundedly observes `main` present and `acp-other` absent, then
explicitly restores `main`. A window missing before that native request still
fails; there is no recreation, activation, retry or deadline extension. Hosted
macOS ARM64 proof remains pending.

Run `41690467381` at `a63b4b2e` advanced the services family to the enabled
Terminal disable/vault-return case. It ran 19 feature cases with seven passed,
one failed and 11 existing quarantines skipped; both resource cases passed. The
case directly admitted one retained shell, closed the visible Terminal, then
requested another visible Terminal. Its shared `open` helper accepted the
already-retained session because it waited only for a nonzero list, so prompt
observation began before the newly requested UI session was admitted. Failure
diagnostics then showed both shells live and the visible output blank. Readiness
now snapshots prior IDs and requires exactly one newly admitted session before
retaining the unchanged `$` prompt assertion and deadline. Ambiguous multiple
admission fails closed; no shell request is retried.

Ordinary run `41618609548` also retained two enabled workspace failures. The
metadata panel race belongs to `@lapis-notes/api`: a same-leaf open completed
after panel activation without updating the workspace fallback file. lapis-notes
PR #79 contains the source regression and repair; Desktop must wait for its
released registry version rather than commit a source alias. The preview
conflict case raced its post-recovery edit with asynchronous review teardown.
Desktop now waits for the existing conflict review to unmount after the
unchanged recovery action before continuing; all content assertions and
deadlines remain unchanged.

Fresh PR run `41630554968` at `c0e62124` proved the Linux Original/Managed
failure occurs after two successful initialization attempts, at the explicit
`stop_backup` call. Local Linux exact and scoped cases passed and do not qualify
that hosted failure. Core PR #16 extends safe opt-in diagnostics through final
capture, watcher release and queue completion at `fd92fb52`; this is diagnostic
instrumentation, not a repair.

Paired run `41630557543` retained the affected-platform boundaries separately.
Its original ARM64 backup case passed 1/1 and scoped group passed 4/4 with all
initialization stages complete; that single non-reproduction neither repairs the
cause nor removes the quarantine. Its original ACP foreign-window body executed
and failed because the second WebView handle was gone. The enabled services
family also read the History graph before the second saved revision published;
the follow-up waits within the existing 30-second boundary for the unchanged
root-plus-saved-revisions assertion before selecting the transcript delta.

## Verified local state

- 734 governance and renderer Node tests and 746 AI tests passed without
  failures or skips.
- All four specification lanes passed: validation, Rust formatting, mdBook and
  spec-first checks.
- The complete local Rust unit, integration and documentation test command
  passed; only the two existing subprocess-helper tests remained ignored.
- The production renderer build, strict normal/e2e Clippy, all-target e2e Cargo
  check and genuine four-helper AI runtime preparation passed.
- Representative real Chromium Shell coverage passed all 12 selected display
  cases. This is a host diagnostic, not complete catalog or Docker parity.
- Linux reproduced neither ARM64 failure. Exact and grouped Original/Managed
  reader tests passed in a separate trusted diagnostic container.
- The default portable image is still blocked by the unpublished Playwright
  network additions. No host result is recorded as portable-runner parity.
- Local headed workspace execution refused before launch because the canonical
  lane requires macOS ARM64. This Linux host result does not qualify either
  original affected-platform failure.

Historical failed attempts and the limits of each result remain in E-CI-045,
E-CI-046 and E-CI-047. Do not rewrite those receipts.

Release qualification update on 2026-11-05: protected run `41961289374`
published the reviewed multi-architecture Desktop CI image, and all adopting
workflows pin OCI index
`sha256:789e6a92ae0ff217b195112ff2766bfaf6aa9a7f8d81021ebf3fce4976597927`. PR
#14 exact-head run `41964547796` retained the first integrated consumer failure.
The authenticated image pull completed, but checkout had written its
safe-directory entry under a temporary home; the producer step then failed
`git rev-parse HEAD` for the mounted checkout and was cancelled at its existing
10-minute job bound before artifact upload. Every producer now explicitly trusts
only its exact `GITHUB_WORKSPACE` before resolving provenance. A disposable
ordinary Git checkout reproduced the original rejection and passed the genuine
image export and tar boundary after this repair. The failed run remains
evidence; a new complete workflow attempt is required and failed-job-only reruns
cannot qualify the release.

Fresh exact-head run `41966843177` proved the repaired producer and consumer:
tool export, upload, download and verification all passed. Governance then
failed its whole-PR evidence comparison because the earlier changed catalog
shard regression was not named by a fresh receipt. The unchanged regression
passes 4/4 locally and E-CI-071 adds the missing evidence coverage without
rewriting prior receipts. The run remains failed evidence; another complete
attempt is required.

## Local execution boundary

Continue from the checked-out sibling repositories in the local workspace. Run
local validation directly on this machine with
`LAPIS_DESKTOP_VALIDATION_RUNTIME=native`; do not defer it to a managed cloud
environment or substitute a host fallback for a failed Docker validation lane.

## Pending hosted work

Complete these steps in order:

1. Release the merged lapis-notes PR #79 source repair through version PR #71
   after its release candidate is validated, then consume that published semver
   package in Desktop. Do not commit a local source alias or projected package
   workaround.
2. Run a new complete paired attempt after the preview synchronization and Core
   shutdown-diagnostic intake. Preserve runs `41601703657`, `41609246251`,
   `41618655199`, `41618609548` and `41630554968`; do not use a failed-job-only
   rerun.
3. Run the repaired metadata/ACP secondary-window scenarios on macOS ARM64 in
   isolation and normal family order. Retain lifecycle/handle diagnostics and
   run `41682741473` as the stale driver-context evidence. A vanished window
   remains a failure and must not be recreated automatically.
4. Retain the first ARM64 backup non-reproduction from run `41618655199`; do not
   remove its quarantine until the separately required reviewed qualification
   boundary is met.
5. Fix only demonstrated failures in their owning repository and rerun the
   complete workflow; a failed-only rerun cannot qualify the candidate. Retain
   ordinary run `41618609548` as the transcript and workspace failure evidence,
   run `41630554968` as the demonstrated backup-stop failure and run
   `41640134092` as the clean-working-copy and workspace synchronization
   failures, run `41650072646` as the unresolved History-comparison failure and
   run `41661185466` as the flattened changed-file identity failure.
6. Obtain one complete explicit full run on the exact candidate SHA, then at
   least one complete scheduled run from canonical `main`. Scheduled evidence
   never authorizes release by itself.
7. Compare cold and warm hosted preparation, effective Rust cache identities,
   compiled-crate work, artifact transfer and family/catalog durations. Report
   measured values; do not infer a speedup from cache-hit labels.
8. Keep `LAPIS_CI_NARROW_PROFILES` unset until complete hosted full/nightly
   evidence qualifies the selection. Only then may the repository variable be
   set to `qualified` in a separately reviewed rollout.
9. Keep the shared Core diagnostics PR separate from any demonstrated root-cause
   repair. A diagnostics-only revision is not a repair.

Quarantines remain unchanged until original enabled scenarios pass on the
affected platform with normal-family evidence. Release qualification still
requires the exact current main source, all required aggregates and a fresh
explicit full run after any newer nightly result.
