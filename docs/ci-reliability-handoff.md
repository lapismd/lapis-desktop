# CI reliability implementation handoff

This document preserves the implementation plan, delivered revisions and
remaining work for the CI reliability changes on Desktop PR #9. It is the
continuation point for a new cloud environment; local chat history and uploaded
attachments are not required.

## Plan retained

The primary Desktop plan is organized into seven slices. The implementation
keeps its reliability rules: preserve original assertions and process
boundaries, do not weaken failures, keep ordinary bundles free of acceptance
instrumentation, use owner-repository fixes for shared defects, and require the
original affected platform before claiming a quarantine is repaired.

| Slice | Planned outcome                                                                            | Current state                                                                         |
| ----- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| A     | Correct Rust cache identities and remove the duplicate renderer build                      | Implemented; hosted cold/warm comparison remains required                             |
| B     | Bound readiness and diagnose secondary-window and backup failures                          | Readiness and safe diagnostics implemented; both ARM64 causes remain unresolved       |
| C     | Make quarantine execution explicit, isolated and auditable                                 | Implemented for the original callbacks; no quarantine was re-enabled                  |
| D     | Produce verified reusable prerequisite and native acceptance artifacts                     | Implemented with run/attempt/source/toolchain identity and immutable native inputs    |
| E     | Split native acceptance into independently reportable families                             | Implemented as `smoke`, `workspace` and `services`; hosted balancing remains required |
| F     | Add guarded ordinary/full profiles, complete catalog ownership and portable Rust execution | Implemented; narrower ordinary profiles remain disabled                               |
| G     | Run integrated hosted proof, compare timings and complete the handoff                      | Local proof is recorded; hosted full/nightly and ARM64 proof remain pending           |

The secondary jj-store plan contributed scheduling policy only: daily fresh full
validation, independent freshness monitoring, separate nightly concurrency and a
conservative rollout before enabling narrower selections. Its unrelated Nextest,
Git-version and repository-specific architecture was deliberately not imported.

## Pushed revisions

Desktop PR branch `fix/main-rc-qualification-20261101` contains:

- `f7c6603b56d7973dfcd142248fd6560d9abb053b` — bound native startup and trace
  hidden secondary-window lifetime;
- `054a2cdf5632dee0e3d09bdcebc0947e67537954` — reuse verified CI artifacts and
  add full nightly validation;
- `c3d2b173d0b39fb3a3ce300b17f5b8c7a31c5fe8` — prepare source tooling before
  native bundle verification.

Shared Core branch `fix/backup-initialization-diagnostics-20261102` contains
`3f79b7c6dc883929ad7810a61e5680a07d33ae0e`, which adds safe, opt-in backup
initialization stage diagnostics. Desktop pins that reachable revision. Main
branches were not moved.

The intended PR title is **Reuse CI artifacts, isolate native families and add
nightly validation**. The PR description should explain the artifact fanout,
native family isolation, guarded profiles, daily 02:17 UTC full run, local
validation, unresolved ARM64 causes and the shared Core diagnostics revision.

## Verified local state

- 711 governance and renderer Node tests passed without failures or skips.
- All four specification lanes passed: validation, Rust formatting, mdBook and
  spec-first checks.
- The production renderer build, strict normal/e2e Clippy, all-target e2e Cargo
  check and genuine four-helper AI runtime preparation passed.
- Representative real Chromium Shell coverage passed all 12 selected display
  cases. This is a host diagnostic, not complete catalog or Docker parity.
- Linux reproduced neither ARM64 failure. Exact and grouped Original/Managed
  reader tests passed in a separate trusted diagnostic container.
- The default portable image is still blocked by the unpublished Playwright
  network additions. No host result is recorded as portable-runner parity.

Historical failed attempts and the limits of each result remain in E-CI-045,
E-CI-046 and E-CI-047. Do not rewrite those receipts.

## Pending environment publication

Cloud environment draft revision 7 is saved with both repositories, the setup
script, startup instructions and these custom allowed domains:

- `api.github.com`
- `cdn.playwright.dev`
- `playwright.download.prss.microsoft.com`

The current chat client has no environment publish action. A configuration UI
that supports managed cloud environments must review and publish the saved
draft. Saving the draft alone does not apply it. After publication, start a new
environment instance or otherwise confirm that its observed configuration
version includes the three custom domains before treating access as available.

## Pending hosted work

Complete these steps in order after the environment update:

1. Confirm GitHub API access and inspect the detailed logs for corrected run
   `41438438608` at Desktop revision `c3d2b17`. Preserve its original result and
   every failed attempt.
2. Update PR #9's title and description to the intended text above. Do not claim
   hosted success based only on local checks or public summary annotations.
3. If that run failed, reproduce each real failure at the narrowest original
   boundary, fix the demonstrated owner and rerun the complete workflow. A
   failed-only rerun cannot qualify reused same-attempt artifacts.
4. Run the original metadata/ACP secondary-window scenarios on macOS ARM64 in
   isolation and normal family order. Retain lifecycle/handle diagnostics. A
   vanished window remains a failure and must not be recreated automatically.
5. Run the original ARM64 backup case and its scoped integration group with
   `LAPIS_APP_BACKUP_DIAGNOSTICS=1`. Linux non-reproduction is not ARM64 proof.
6. Obtain one complete explicit full run on the exact candidate SHA, then at
   least one complete scheduled run from canonical `main`. Scheduled evidence
   never authorizes release by itself.
7. Compare cold and warm hosted preparation, effective Rust cache identities,
   compiled-crate work, artifact transfer and family/catalog durations. Report
   measured values; do not infer a speedup from cache-hit labels.
8. Keep `LAPIS_CI_NARROW_PROFILES` unset until complete hosted full/nightly
   evidence qualifies the selection. Only then may the repository variable be
   set to `qualified` in a separately reviewed rollout.
9. Open or link the shared Core diagnostics branch for review if a sibling PR is
   required. A diagnostics-only revision is not a root-cause repair.

Quarantines remain unchanged until original enabled scenarios pass on the
affected platform with normal-family evidence. Release qualification still
requires the exact current main source, all required aggregates and a fresh
explicit full run after any newer nightly result.
