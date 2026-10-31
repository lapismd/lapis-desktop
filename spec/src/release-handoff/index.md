# Migration and release handoff

Last reviewed: **2026-10-31 13:03 UTC**. Overall status: **in progress**.
Desktop PR #1 is open; final released-cohort and hosted native acceptance remain
required before merge. No npm challenge is active. The Dnd compiler diagnostic
below has received the user's specific approval through November 30. The Mira
source PR #26 has merged after every required hosted job passed. Versioning and
actual publication are next; no new Mira version is published yet.

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
creation of the Tasks/Docs source repositories. Continue this work; an open
version PR or prepared archive does not complete publication.

## Completed and verified

| Area                           | Completed result                                                                                                                                                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notes consolidation            | [PR #44](https://github.com/lapismd/lapis-notes/pull/44) merged at `f47e275c`; canonical contracts/backlogs replace the old migration registers.                                                                                                                                               |
| Server consolidation           | [PR #8](https://github.com/lapismd/lapis-server/pull/8) merged at `5ba4c5aa`.                                                                                                                                                                                                                  |
| Notes API                      | API **0.2.3** published from `0d9d4d9253579541b1e796d7f2c68ef3b19a8df6`; run `41190163735` passed all 14 publication/consumer jobs. Governed tag is `next`; do not promote `latest`.                                                                                                           |
| Other earlier releases         | Notes UI **0.1.5**, Workspace **0.3.1**, Terminal **0.1.2**, Mira **0.1.3** and its existing **0.0.3** companion packages were verified.                                                                                                                                                       |
| Bits UI                        | Canonical registry **2.20.2** patch retains Link Preview cleanup, six Slider destruction guards and the upstream FocusScope identity fix. Every consumer root must register it explicitly.                                                                                                     |
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

## Pending chain, in order

1. **Finish Mira's math packaging repair.** Privately bundle the unchanged math
   adapters/parser helpers and retain a patched direct KaTeX dependency, public
   APIs, runtime conditions and MIT notices. Base production audit,
   declarations, CSS and the development public host pass. An owning table
   teardown regression is repaired at its exact target; full source checks and
   all 178 Storybook interaction/axe cases pass. Cold static/browser
   qualification also passes its 60-case suite with its unchanged known-failure
   policy. All six packed tarballs and both cold public hosts now pass with the
   exact approved Dnd scope.
   [Source PR #26](https://github.com/lapismd/mira-mde/pull/26) merged as
   `11ecdb86` after all three required jobs passed on `f9dba17f` in run
   `41203120667`. Finish formal version PR review/approval, green merge and
   actual publication. Expected Mira 0.1.4 remains subject to the generated
   plan.
2. **Release Core's fixed dependency boundary.** Require that actual fixed Mira
   version, remove Core's obsolete base-math audit exception, run required
   source/version/release gates and verify the actual Core patch publication
   (expected 0.7.4; not published yet).
3. **Complete downstream source and version releases.** Adopt the verified fixed
   Core in Agent/Repository UI, Tasks and Plugins. Repeat the required exact,
   cold and full acceptance, then source PR merge, bot Changesets diff review,
   formal approval, green merge and actual publication verification. Expected
   candidates: Agent UI 0.2.0, Repository UI 0.1.1, Tasks 0.1.1 and
   Bases/History 0.2.0; verify each actual generated plan.
4. **Rebuild the private Notes App Profile.** Its current Agent UI `^0.1.0` and
   History `^0.1.4` ranges exclude those planned 0.2.0 releases. After the
   releases exist, change the owning private package to their actual compatible
   minima and fixed Core minimum, preserve API exactly 0.2.3, qualify the public
   build and record a new private source pin/archive hash.
5. **Finish Desktop intake.** Raise all actual published minima/locks, replace
   the private profile with that qualified artifact, remove completed npm
   archive projections and verify every active first-party/runtime/peer route.
   Retain source builds needed for real native plugin fixtures. The intermediate
   install also warns that API 0.2.3 expects Dnd DOM/Svelte `^0.4.0` but
   receives 0.5.1/0.5.0. Qualify the correct host peer inputs during final
   intake; do not suppress those warnings. The other two peer warnings belong to
   old Tasks 0.1.0's API/Core ranges and need its actual replacement release.
6. **Finish Desktop CI and merge.** Repeat final portable/catalog/audit/bundle
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

PR #26's first hosted package job (`124541176610`) failed because its new cold
browser host cannot find `chromium_headless_shell-1234`. The independent job
never installed Chromium; passing Storybook in a separate runner cannot supply
it. Both package CI and release artifact jobs now explicitly install Chromium.
The job-scoped regression changed from one failure to one pass; all 48 release
guards, boundary checks, lint and all four spec lanes pass. Fresh hosted run
`41203120667` on `f9dba17f` passes all three required jobs, including packed
public consumers, 178 interaction/axe cases and full browser acceptance. PR #26
merged at `11ecdb86089a0bde855776f7111715b9c6f304df` on 13:02 UTC. Original
failure logs and early evidence artifact `13042588940` remain retained; no
assertion, deadline or diagnostic was waived.

Separately, a full Mira check exposed one uncaught post-teardown `MouseEvent`
from table cells. The exact owning pipe/grid target reproduced four failures
with the existing keyboard case passing; timer cancellation and lifecycle guards
now pass all five without changed assertions/deadlines. Full `check:all` passes
525 units, 16 runner guards, strict Svelte checks, lint, format, build and
publint. Run `mira-validation-525478e5-fc25-4c98-851a-ea4a0949ae2c`; driver
`/tmp/lapis-mira-math-validation-20261031/check-all-r3-driver.log`. All 178
distinct cold Storybook/axe cases then pass, with all four JUnit reports
independently checked: run
`mira-validation-41ddea53-1a3e-486f-8c06-1ca79a2ac3bc`.

The subsequent cold `pnpm storybook:check` passes all 60 cases under the
unchanged known-failure policy. Run
`mira-validation-3f951b52-dcf1-41b7-b189-8eec1c5b4f7e` records exit 0 and
`status: passed`. The red indentation case at
`tests/storybook/indentation.spec.ts:1224` has an existing unconditional
`test.fail` marker; its console symbol alone does not mean the suite failed. Do
not remove that marker or change its assertion without exact evidence. Driver:
`/tmp/lapis-mira-math-validation-20261031/catalog-static-e2e-driver.log`.

Mira's old math adapters pull vulnerable KaTeX. The new base-package repair has
a clean independent production closure. An unchanged Mermaid 11/layout-ELK
branch still produces low **GHSA-238p-pmpm-9mq7** at KaTeX 0.16.47.

Mira's existing `spec/records/2026-10-11-known-katex-acceptance.md` explicitly
records the user's acceptance of that exact low advisory/range across its six
packages and subsequent releases. Tighten that existing policy to the unchanged
Mermaid branch; require the repaired base package to be clean and retain full
raw diagnostics. This acceptance does **not** transfer to UI, Tasks or Desktop.
No Mermaid 12/public-type/Node-support migration is authorized or needed here.

A new local packed-browser fixture initially used an unintended read-only
descriptor. Independent peer review identified the fixture setup difference;
retain the failed attempts and strengthen the correct normal-rendering check,
with the read-only fail-closed case separate. Assertions/deadlines remain
strict. The former Mira agent was interrupted twice by an automated content flag
during local fixture maintenance. Its 25 changed files and reports are
preserved; ownership has been reassigned through the normal workflow below.

Desktop's sole approved audit exception remains the exact development-only
`deepmerge` GHSA-gcqx-w48m-w2h4 path through **2026-11-30**. All other
applicable audits remain blocking. Changed visuals stay `visual-pending`.

The corrected development host passes four Node and 18 browser checks with zero
diagnostics; read-only failure handling remains separate.

## Workspaces, source state and ownership

Workspace paths are local recovery pointers, not portable dependency inputs.
Inspect `jj st`, exact revisions and current remote state before continuing.

| Owner / area                                       | Workspace and saved state                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root: Desktop                                      | `/private/tmp/lapis-desktop-ci/workspace/lapis-desktop-registry`; clean over committed `1849cdf4`, empty child `e7794364`. Bookmark `desktop-api023-core073-qualified-20261031` preserves the intermediate intake. E-CI-017 is committed and remains pending final cohort/native proof. PR #1 remote remains `96a4139b`; new product work is not pushed.             |
| Root: this handoff                                 | `/private/tmp/lapis-desktop-release-handoff-20261031`; remote branch `release-handoff-20261031` preserves the independent documentation lineage from `7df6725b`. Integrate it into the final product head while retaining all new history navigation entries, including E-CI-017.                                                                                    |
| Root: Plugins                                      | `/private/tmp/lapis-plugins-bits-patch-20261031`; clean at committed `5df6d7cf` (empty child `c35ec125`). Stack contains eligibility `e22d45d4`/`13800e08`, API intake `26bd3df9`, API artifacts `c9c76f7f`, Core intake `34d3a1a1`, artifacts `3ffd1a94`, Reading Math `d3893215` and integration `5df6d7cf`. No new push beyond merged patch PR #43 at `14395ff0`. |
| `terminal_publication`: Mira/Core, then UI/profile | Mira: `/private/tmp/lapis-mira-math-release-20261031`; source [PR #26](https://github.com/lapismd/mira-mde/pull/26) merged as `11ecdb86` after all three hosted jobs passed on `f9dba17f`. Original package CI failure and its Chromium regression are retained. Owner is watching version PR/actual publication; no new version published yet.                      |
| Same owner: UI                                     | `/tmp/lapis-agent-ui-patched-release-20261031`; clean at `9976a303` over release-workflow `6f9924a4`; no push. Original nine-file readiness workspace remains untouched.                                                                                                                                                                                             |
| `tasks_publication`: Tasks                         | `/private/tmp/lapis-tasks-publication-20261030`; clean at `0cec0519` over `200c9887`. PR #1 remains draft at remote `adc24f35`, with current evidence in its body; final source changes are not pushed. Resume after actual fixed Core handoff.                                                                                                                      |
| Preserved math-story workspace                     | `/private/tmp/lapis-plugins-reading-math-20261031`, original `rytmpuxv`/`4da7d9c4` on `c9c76f7f`; integrated recoverably into Root Plugins as `d3893215`.                                                                                                                                                                                                            |

Original unrelated Plugins work in `qzorkqrm` and the conflicted local `main`
bookmark remain untouched. Never manually move `main` or discard source edits.

## Active run and precise resume commands

Desktop's intermediate pipeline and receipt checks are complete; exec sessions
50800 and 32128 have been collected. No Desktop product worker is active. Logs:
`/tmp/lapis-desktop-api023-core073-{test,build,catalog,static,spec-final}.log`;
final evidence/spec logs end in `evidence-final.log` and `receipt-spec.log`.
Never rerun old session IDs blindly or start two Docker lanes in one workspace.

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

Next Root actions: wait for the actually published fixed Mira/Core boundary,
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
