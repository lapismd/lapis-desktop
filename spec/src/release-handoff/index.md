# Migration and release handoff

Last reviewed: **2026-10-31 14:53 UTC**. Overall status: **phase 1 in
progress**. Mira docs PR [#28](https://github.com/lapismd/mira-mde/pull/28) is
merged at `001564ae` and did not republish Mira. Core qualification r3 passed on
`16cda140`, and source PR [#47](https://github.com/lapismd/design-core/pull/47)
is open. Publication is not complete until the version pull request merges and
npm shows 0.7.4. Agent UI, Tasks, Plugins, the Notes profile, and Desktop intake
stay stopped. Desktop PR #1 and Tasks draft #1 remain open; auto-merge is
disabled.

This is the single maintained operational handoff for this cross-repository
work. Update it after material check results, commits, PR changes, publications,
blockers and ownership changes. Keep completed milestones below and replace
superseded pending state. Commit verified updates with their evidence. Feature
requirements remain in the owning specs; Desktop's
[dependency contract](../current/local-dependencies.md),
[verification](../verification.md) and
[distribution backlog](../backlog/distribution.md) retain their authority.

## Objective and authority

Consolidate migration/planning records into canonical specs and backlogs, finish
the necessary source repairs and actual package releases, adopt the final
verified dependencies in Desktop, pass every required CI aggregate and merge
[Desktop #1](https://github.com/lapismd/lapis-desktop/pull/1). Desktop #2's
consolidation is included by ancestry. The user authorized source and Changesets
PR review/approval/merge, actual releases, the manual Bits UI patch, and
creation of the Tasks/Docs source repositories. The user resumed phase 1 on
2026-10-31; those authorizations cover the Core source and version review and
its actual publication. They do not start the downstream cohort or Desktop RC.
An open version PR or prepared archive does not complete publication.

## Completed and verified

| Area                           | Completed result                                                                                                                                                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notes consolidation            | [PR #44](https://github.com/lapismd/lapis-notes/pull/44) merged at `f47e275c`; canonical contracts/backlogs replace the old migration registers.                                                                                                                                               |
| Server consolidation           | [PR #8](https://github.com/lapismd/lapis-server/pull/8) merged at `5ba4c5aa`.                                                                                                                                                                                                                  |
| Notes API                      | API **0.2.3** published from `0d9d4d9253579541b1e796d7f2c68ef3b19a8df6`; run `41190163735` passed all 14 publication/consumer jobs. Governed tag is `next`; do not promote `latest`.                                                                                                           |
| Other earlier releases         | Notes UI **0.1.5**, Workspace **0.3.1** and Terminal **0.1.2** are verified. Mira companion packages remain **0.0.3**.                                                                                                                                                                         |
| Bits UI                        | Canonical registry **2.20.2** patch retains Link Preview cleanup, six Slider destruction guards and the upstream FocusScope identity fix. Every consumer root must register it explicitly.                                                                                                     |
| Mira math/lifecycle release    | **0.1.4** is fully published from `6658fe56`; source #26 and formally approved version #27 merged green. Production run `41205035585` passed all five stages. Registry bytes, clean install, signatures, exact-source provenance, tag and GitHub release verify.                               |
| Design Core                    | **0.7.3** is actually published and verified from `1ff36f37c165a3496be4826be48b048fc812e38e`. PR/main each passed 11 checks; release `41194948225` passed all five jobs. Registry bytes, signatures, provenance, tag and GitHub release match. Docs PR #46 merged at `8e9b3f29`.               |
| Plugins intermediate graph     | API 0.2.3/Core 0.7.3: all 18 checks; 1,181 units; 17 builds/publint; 264 catalog passes, 57 unchanged parked Sync skips; static build; 163 release-tool tests; source artifact reproduction all passed.                                                                                        |
| UI intermediate graph          | Core 0.7.3/Mira 0.1.2: 1,956 interaction/axe cases, 151 browser cases, 149 public examples, 235 units, all 418 fingerprints, strict types/build/spec/actionlint passed.                                                                                                                        |
| Tasks intermediate graph       | Compatible normal lock refresh cleared all critical/high/moderate findings. All 2,889 units, 27 Rust and 63 interaction/axe cases, strict types/build/publint/static/spec passed. One low Mira math dependency remains pending the repair below.                                               |
| Math consumer regression       | Real-App Reading Math scenario added in Plugins. Exact case 1/0 and full Reading family 10/0 pass on both the original Core 0.7.2 baseline and integrated Core 0.7.3 graph. Original vault text and mode teardown are asserted; visual baselines unchanged.                                    |
| Desktop current portable slice | API 0.2.3/Core 0.7.3: quality, renderer/static builds, all four spec lanes and 2,128 cold catalog cases pass. Tests: 596 Node + 746 policy + 259 Linux Rust; two unchanged Rust ignores, four Mac-only cases not collected. Committed as `1849cdf4`; final cohort/native gates remain pending. |
| Spec tooling/navigation        | Spec Validator **0.2.0**, semantic search and doctor checked. Desktop uses supported SUMMARY fragments; historical receipts remain unchanged and the 400-line/32,768-byte page caps remain intact.                                                                                             |

Canonical Bits patch SHA-256:
`debd3bc7d43917f0967f0cc1e212fc5c7721c751d3b92bf8f31030d1c96289ad`. Core 0.7.3
tarball: 1,903,722 bytes, SHA-256
`4c07fdaa8fecc6d7f1ede2f03f89b5afb0728dae82b25dc0e55ec6ddda7ab6ca`.

## Pending after an explicit resume

1. **Finish and release Core's saved candidate.** Qualification r3 passed full
   `pnpm checks` and `pnpm packages:pack` on `16cda140` with no quarantine.
   Source PR [#47](https://github.com/lapismd/design-core/pull/47) is open
   against main `8e9b3f29`. No Dependabot pull request was open before the push.
   Wait for its 11 required checks, approve, and merge. Then review the Version
   Packages pull request and verify actual npm 0.7.4.
2. **Complete downstream source and version releases.** Adopt the verified fixed
   Core in Agent/Repository UI, Tasks and Plugins. Repeat the required exact,
   cold and full acceptance, then source PR merge, bot Changesets diff review,
   formal approval, green merge and actual publication verification. Expected
   candidates: Agent UI 0.2.0, Repository UI 0.1.1, Tasks 0.1.1 and
   Bases/History 0.2.0; verify each actual generated plan.
3. **Rebuild the private Notes App Profile.** Its current Agent UI `^0.1.0` and
   History `^0.1.4` ranges exclude those planned 0.2.0 releases. After the
   releases exist, change the owning private package to their actual compatible
   minima and fixed Core minimum, preserve API exactly 0.2.3, qualify the public
   build and record a new private source pin/archive hash.
4. **Finish Desktop intake.** Raise all actual published minima/locks, replace
   the private profile with that qualified artifact, remove completed npm
   archive projections and verify every active first-party/runtime/peer route.
   Retain source builds needed for real native plugin fixtures. The intermediate
   install also warns that API 0.2.3 expects Dnd DOM/Svelte `^0.4.0` but
   receives 0.5.1/0.5.0. Qualify the correct host peer inputs during final
   intake; do not suppress those warnings. The other two peer warnings belong to
   old Tasks 0.1.0's API/Core ranges and need its actual replacement release.
5. **Finish Desktop CI and merge.** Repeat final portable/catalog/audit/bundle
   and hosted native acceptance on that exact input, add fresh immutable
   evidence, update canonical verification/backlog, push PR #1, wait for all
   required checks and merge. Resolve PR #2 as included. Distribution and
   frozen-Deno retirement retain their separate unfulfilled product gates.

## Current release gates and accepted scope

The packed production host previously stopped on one pre-existing
`@dnd-kit/svelte@0.4.0` compiler warning, `state_referenced_locally`, in
`DragDropProvider.svelte`: it captures the initial `managerProp`. Both actual
0.4.0 and latest 0.5.1 reproduce it with the qualified compiler. The user
explicitly approved the prepared exception on October 31, valid through
**2026-11-30**. Admit at most one occurrence per production build matching this
exact version, source SHA-256
`9750aa31f409e0f6be0e70b3fef6c8d8e8e447ff25b150fbc2dd4bec4781eaab`, file, code
and complete message. Keep raw diagnostics visible and retained; every other
warning/runtime/functional/accessibility failure stays fatal. Mira has now
implemented that exact scope, with 13 focused scope/workflow guards passing
after the original retention regression failed once. Original scope:
`/private/tmp/lapis-mira-math-release-20261031/.local/release-preflight/dnd-compile-diagnostic-proposal.md`.

Exact `pnpm packages:pack` now passes in
`mira-validation-a455ea13-9166-4ed6-9d04-9ef9e97d63b9` at `b76eac56`: all six
isolated tarballs, declarations, CSS and package-boundary checks; both cold
public hosts with 18 browser assertions and four Node scenarios each; zero
runtime diagnostics and base audit findings. Development compiler warnings are
zero; production emits exactly one approved warning with its raw receipt
retained. The metadata-only import-condition lookup regression went from one
failure to one pass, with all 11 policy cases passing. Root independently read
`/tmp/lapis-mira-math-validation-20261031/final-packed-report-verification.json`.

Mira source #26 and formally approved version #27 are merged. Source recovery
run `41203120667`, version run `41203791057` and main run `41204586592` all pass
their three required jobs. The original missing-Chromium CI failure and its
one-fail/one-pass job-scoped regression remain retained. Both package CI and
release preparation now install their own browser.

Production run **41205035585** passes all five stages, including real OIDC
publication, independent clean registry install, integrity/provenance checks and
automatic package tag/release creation. Root approved the exact environment
source `6658fe563b6ff725a931d339abca727c10263420` and protected deployment
`7459169399` only after verifying CI and artifact **13043527864**. Its ZIP
digest is `4585ca5df8c4830e5c5473caa9df79e9c5594b6a4040f2770d35b897b4a84112`.
The registry tarball is **356,854 bytes**, SHA-256
`d2c16137900f9512527c699206a5294a3a7ad593f1f59e0f7b7347bd3053ed3e`, identical to
the qualified artifact. Root proof:
`/tmp/lapis-mira-014-root-registry-verification-20261031.json`.

Cryptographic Sigstore verification binds that package to the exact source,
`release.yml@main` and this run. The clean registry install has zero
vulnerabilities; npm verifies 34 signature/provenance entries with zero invalid
or missing entries. Tag `mira@0.1.4` points to the exact source, and the
[GitHub release](https://github.com/lapismd/mira-mde/releases/tag/mira%400.1.4)
is public/non-draft. Detailed proofs:
`/tmp/lapis-mira-014-release-20261031/registry-verification/verification.json`.

Qualification includes 525 units, 16 runner guards, 178 Storybook/axe cases, 48
release guards and the full cold browser suite (59 ordinary passes plus one
unchanged expected failure). The table-lifetime regression changed from four
failures plus the existing keyboard pass to all five passing. Assertions,
deadlines and baselines were preserved; original failures remain in owning Mira
records and immutable Desktop handoff receipts.

Mira 0.1.4's base production closure is clean, with patched direct KaTeX
0.18.10. The unchanged Mermaid 11/layout-ELK cohort branch still produces low
**GHSA-238p-pmpm-9mq7** at KaTeX 0.16.47.

Mira's existing `spec/records/2026-10-11-known-katex-acceptance.md` explicitly
records the user's acceptance of that exact low advisory/range across its six
packages and subsequent releases. The released policy narrows that acceptance to
the unchanged Mermaid branch, requires the base package to be clean and retains
full raw diagnostics. This acceptance does **not** transfer to UI, Tasks or
Desktop. No Mermaid 12/public-type/Node-support migration is authorized or
needed here.

Desktop's sole approved audit exception remains the exact development-only
`deepmerge` GHSA-gcqx-w48m-w2h4 path through **2026-11-30**. All other
applicable audits remain blocking. Changed visuals stay `visual-pending`.

## Workspaces, source state and ownership

Workspace paths are local recovery pointers, not portable dependency inputs.
Inspect `jj st`, exact revisions and current remote state before continuing.

| Owner / area                                  | Workspace and saved state                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root: Desktop                                 | `/private/tmp/lapis-desktop-ci/workspace/lapis-desktop-registry`; clean at `1849cdf4`, pushed to [wip/desktop-release-paused-20261031](https://github.com/lapismd/lapis-desktop/tree/wip/desktop-release-paused-20261031). E-CI-017 remains pending final cohort/native proof. PR #1 stays at `96a4139b`; auto-merge is off.                          |
| Root: this handoff                            | `/private/tmp/lapis-desktop-release-handoff-20261031`; remote `release-handoff-20261031` is the maintained paused tracker. Its independent documentation lineage starts at `7df6725b`. After resume, integrate it into the final product head retaining all history entries, including E-CI-017.                                                      |
| Root: Plugins                                 | `/private/tmp/lapis-plugins-bits-patch-20261031`; clean at `5df6d7cf`, pushed to [wip/plugins-release-paused-20261031](https://github.com/lapismd/lapis-plugins/tree/wip/plugins-release-paused-20261031). Includes eligibility, API/Core intake, reproduced artifacts and Reading Math. Original unrelated work and conflicted `main` are preserved. |
| `terminal_publication`: Core, then UI/profile | `/private/tmp/lapis-core-required-release-20261031`; clean at `16cda140`, pushed to [wip/core-fixed-mira-20261031](https://github.com/lapismd/design-core/tree/wip/core-fixed-mira-20261031). r3 passed. Source PR [#47](https://github.com/lapismd/design-core/pull/47) is open. Mira docs #28 is merged at `001564ae`.                              |
| Same owner: UI                                | `/tmp/lapis-agent-ui-patched-release-20261031`; clean at `9976a303` over `6f9924a4`, pushed to [wip/ui-release-preparation-20261031](https://github.com/lapismd/agent-ui/tree/wip/ui-release-preparation-20261031). No source PR/version/release. Fixed-Core qualification pending. Original nine dirty readiness files remain untouched.             |
| `tasks_publication`: Tasks                    | `/private/tmp/lapis-tasks-publication-20261030`; clean at `0cec0519`, pushed to [wip/tasks-release-paused-20261031](https://github.com/lapismd/lapis-plugin-tasks/tree/wip/tasks-release-paused-20261031). Draft PR #1 stays at `adc24f35`, auto-merge off; its body links the nine-commit-ahead checkpoint. No worker or publication active.         |
| Preserved math-story workspace                | `/private/tmp/lapis-plugins-reading-math-20261031`, original `rytmpuxv`/`4da7d9c4` on `c9c76f7f`; integrated recoverably into Root Plugins as `d3893215`.                                                                                                                                                                                             |

Original unrelated Plugins work in `qzorkqrm` and the conflicted local `main`
bookmark remain untouched. Never manually move `main` or discard source edits.

## Stopped workers and precise resume commands

Mira docs #28 merged at `001564ae` after the three jobs in `41206080306`
succeeded. The push started release run `41210897173`. Its version job succeeded
and opened no Version Packages pull request. Publication stays off unless a
`workflow_dispatch` sets `publish` true, so this run does not republish Mira
0.1.4. Notes private-profile work has no edits. Desktop PR #1 and Tasks draft #1
stay open with auto-merge off. No other product worker is active.

Core R1 retained 919 unit passes and one stale range guard failure. That exact
guard now rejects 0.1.2/0.1.3 and admits 0.1.4/0.1.5; one before-failure became
one pass. R2 passed registry/Bits checks, 17 guards, the exact guard and all
four editor units plus spec-first, then was stopped during four-family Storybook
at **13:35:16 UTC**, exit **143**. Its raw result still says `running` because
SIGTERM prevented finalization; it is neither a live worker nor a pass. R1 is
also stopped, exit 1. R3 finished with exit 0 at **14:51:37 UTC**. Full checks
and public packing passed. It is not a resumed R2 session. Source PR #47 is the
next gate; do not start another qualification unless that head changes.

Core R2 log: `/tmp/lapis-core-fixed-mira-validation-20261031/driver-r2.log`;
results: `/tmp/lapis-core-fixed-mira-validation-20261031-r2/results/`. The
owning Core WIP contains canonical pause evidence. Local recovery detail:
`/tmp/lapis-terminal-publication-paused-20261031.md`.

R3 already used the retained runner and passed. Do not start another copy while
PR #47 is the candidate. The command, retained for recovery only, is:

```sh
PATH=/tmp/lapis-mira-math-validation-20261031/transport/bin:/Users/stevejuma/.nvm/versions/node/v24.10.0/bin:$PATH node /tmp/lapis-core-fixed-mira-validation-20261031/run.mjs 8e9b3f295ab151fb2f44661a55ccaa0527f3e524 0.1.4 /tmp/lapis-core-fixed-mira-validation-20261031-r3
```

Complete `pnpm checks` and `pnpm packages:pack`, then source/version PRs and
actual Core publication. Do not recreate old mutable probe bookmarks or resume
tests from an expired session ID. If temporary helper files are unavailable,
recover the saved WIP and follow its tracked validation guide.

Desktop's intermediate pipeline and receipt checks are complete; exec sessions
50800 and 32128 have been collected. No Desktop product worker is active. Logs:
`/tmp/lapis-desktop-api023-core073-{test,build,catalog,static,spec-final}.log`;
final evidence/spec logs end in `evidence-final.log` and `receipt-spec.log`.
Never rerun old session IDs blindly or start two Docker lanes in one workspace.

Use the installed Node 24 before local tooling:

```sh
export PATH=/Users/stevejuma/.nvm/versions/node/v24.10.0/bin:$PATH
jj --no-pager st
```

Verified work is committed unsigned. Pushes need both
`--config signing.behavior=drop` and `--config git.sign-on-push=false`.
Desktop's `handoff-https` remote works with the existing GitHub CLI credential
helper; do not change global credentials or retry the unresponsive GitHub SSH
route. Portable workers use the existing `omarchy` SSH transport, 4 CPU, 12 GiB
memory and 2 GiB shared memory, with `/tmp/lapis-tasks-validation-%C` as control
path. The temporary workspaces share durable repository stores under
`/Users/stevejuma/code/lapismd/<repo>/.jj/repo`; named bookmarks preserve the
commits if a temporary checkout disappears. Preserve other workspace heads.

Verified Desktop runs:

- Quality: `lapis-desktop-validation-a439d38a-6226-4682-8942-976008f5adce`.
- Full tests: `lapis-desktop-validation-111c8383-2396-4ea1-a231-2b35649b0379`.
- Renderer: `lapis-desktop-validation-99398953-80e9-4992-b095-2809cb17685b`.
- Catalog: `lapis-desktop-validation-b8419644-0c27-4d7a-9efe-28d02e35f8b4`; all
  16 JUnit reports independently verify 2,128 actual cases with zero failures,
  errors or skips; `/tmp/lapis-desktop-api023-core073-catalog-proof.json`.
- Static: `lapis-desktop-validation-58e5142e-164d-44c8-9717-4898efc733e7`.
- Initial full spec:
  `lapis-desktop-validation-9e05af4c-cdf3-4690-b25b-f4043ffdf135`.
- Final receipts: evidence `00837998-bba2-4ffa-93d4-a590df2e38c9` passes 356
  records; spec `1dacd122-f2c1-4eec-a7db-bede8680d4c6` passes all four lanes.
- Actual worker graph: 1,191 reachable packages, only API 0.2.3/Core 0.7.3, five
  Bits edges/two peer contexts with all three exact patched postimages;
  `api023-core073-graph.json` in the quality run's results.

After an explicit resume, wait for the actually published fixed Core boundary,
then finish Plugins' Bases/History floor update, full gates, source/version PRs
and actual releases. Trigger the retained Tasks owner after fixed Core is live.
UI/profile ownership remains with the Mira/Core owner. The read-only Changesets
API plan confirms only Bases and History at 0.2.0 from eight changesets; the
bot's actual version diff still requires review. CLI status cannot resolve the
preserved conflicted `main`; do not move that bookmark to obtain a local plan.
Final Desktop intake needs fresh evidence after the releases/private-profile
build. Do not rewrite committed E-CI-017 or earlier receipts.

The reusable cold Plugins math acceptance is:

```sh
pnpm test:storybook -- stories/plugins/markdown/ReadingSurface.stories.ts -t 'Reading Math'
pnpm test:storybook -- stories/plugins/markdown/ReadingSurface.stories.ts
```

Storybook humanizes TypeScript export names; an empty filtered run is not a
pass. Keep the exact executed-case count and then the complete affected family.

## Private inputs and release prerequisites

The current ignored Desktop archive manifest has seven entries, after removing
completed Workspace/Terminal npm projections. Its previous nine-entry inventory
is backed up. The selected intermediate App Profile is 35,343 bytes, SHA-256
`975ea33dcba8d8db55288820221e8aae39f7d6fea4fc87312b64fa5b0715a1d5`, from the
exact API release source `0d9d4d92`. It needs replacement after the private
dependency update above; changing recorded metadata cannot refresh its payload.

Notes GitHub main was independently verified at
`b1cfc3807baa26fe52e9a41dc2237620cac6c1e1`; its entire API tree is identical to
`0d9d4d92`. Stale `main@origin` `80366a17` is not equivalent. Start the future
private-profile change from reverified current-equivalent main in a new
workspace. Preserve exact API code/version and distinguish its published source
from the new private profile source. Assessment:
`/tmp/lapis-notes-profile-final-intake-assessment-20261031/assessment.md`.

Tasks' `npm-production` environment is configured: main-only admission, required
reviewer `stevejuma`, self-review allowed, no timer. npm login last verified as
that user; no challenge is active. Root owns any first-publication bootstrap or
2FA/trust setup after the exact CI artifact/provenance qualifies. Do not infer
inherited secrets are absent or treat an already-published-version skip as proof
of a new successful OIDC publication.

AI and App Profile intentionally remain private. JJ Conversations distribution
is unresolved and explicit. Do not claim registry-only distribution or expand
into its separate failed backend qualification. Keep the qualified Rust Git pins
and real Plugins/Tasks fixture-source builds when removing npm projections. Do
not replace installed apps, reuse user profiles, update visual baselines or
start local headed/provider tests without the existing explicit opt-in.

## Update log

- **October 30:** Notes/Server tracking consolidation merged; Desktop
  consolidation retained in the CI PR ancestry. Existing release prerequisites
  and private distribution gaps were audited.
- **October 31, completed:** API 0.2.3 and Core 0.7.3 publications verified;
  composed Bits patch qualified; intermediate Plugins/UI/Tasks checks and
  current Desktop quality/tests/build completed. Reusable math Reading
  regression integrated and source artifact reproduction verified.
- **October 31, current:** Mira base math packaging and fixed Core minimum are
  the critical path. Existing Mermaid acceptance scope verified and narrowed
  route authorized. Source work preserved after agent interruption and normal
  release ownership reassigned. This single handoff is now the maintained resume
  point; local scratch checkpoints are not the source of current status.
- **October 31, 12:29 UTC:** Initial handoff `ce1204d7` is committed and pushed
  to `release-handoff-20261031`, with all four canonical spec lanes passing.
  Mira's repaired source, 178-case Storybook lane and subsequent cold 60-case
  browser suite pass under the unchanged known-failure policy.
- **October 31, 12:39 UTC:** User approved the exact scoped Dnd compiler
  exception through November 30. Mira source preparation is committed as
  `c69a7cf6`; its owner resumed the normal packed-package and actual-release
  queue. All other diagnostics and release/native gates remain blocking.
- **October 31, 12:48 UTC:** Exact Mira six-package qualification is green and
  source PR #26 is open. Desktop's complete intermediate portable/catalog/static
  suite and final evidence/spec checks pass; source slice committed as
  `1849cdf4` with a clean workspace. Actual fixed Mira/Core and downstream
  publications, final intake and hosted native acceptance remain pending.
- **October 31, 12:51 UTC:** Mira PR #26's first hosted package job exposes
  missing Chromium setup. The owner is repairing the independent CI and release
  jobs and adding a scoped regression; no assertion or timeout is relaxed.
- **October 31, 13:03 UTC:** Mira source PR #26 merged at `11ecdb86` after all
  required recovery-head hosted jobs passed. The version PR and actual npm
  publication remain pending. Desktop's final intake must also resolve the
  explicitly recorded Dnd host-peer and old Tasks range warnings.
- **October 31, 13:13 UTC:** Mira version PR #27 was formally approved and
  merged as `6658fe56` after all required checks passed. Its actual release plan
  changes only Mira to 0.1.4. Main CI, immutable preparation, protected
  publication and registry verification are next; publication is not complete.
- **October 31, 13:29 UTC:** Mira 0.1.4 release is complete: all five production
  stages, clean install/audit, registry-byte/SRI identity, signatures,
  exact-source/run provenance and tag/GitHub release verify. Root's exact-source
  environment and artifact approval are recorded above. Core's actual ~0.1.4
  floor and strict production-audit qualification are now in progress.
- **October 31, 13:39 UTC — user-requested pause:** Desktop, Plugins, Core, UI
  and Tasks prepared work is saved on the exact remote WIP branches above. Local
  owned workspaces are clean; Core R2 and all other owned workers are stopped.
  Mira 0.1.4 publication is complete; no publication is mid-flight. Existing PRs
  are left open with auto-merge off. Complete only this checkpoint's
  documentation validation/backup, then stop until explicitly resumed.
- **October 31, 14:39 UTC — phase 1 resume:** Mira docs #28 merged at `001564ae`
  without a version pull request or a new publication. Core r3 started from
  clean `16cda140` on main `8e9b3f29`, with no open Dependabot pull request.
  Early r3 phases passed, including the corrected Mira minimum guard, and full
  checks are in progress. Downstream release work remains stopped.
- **October 31, 14:53 UTC:** Core r3 passed every phase, including full checks
  and `pnpm packages:pack`, with no quarantine. Source PR #47 is open on
  `16cda140`. Hosted checks and publication remain pending. Mira npm stays
  0.1.4; release run `41210897173` skipped publication.
