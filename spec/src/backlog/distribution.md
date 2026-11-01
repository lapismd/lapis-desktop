# Desktop distribution and frozen-host retirement

Outstanding implementation and qualification are recorded here. Existing feature
contracts and requirement verification retain the implemented scope. Legacy task
identities below are provenance, not a separate completion ledger. Preserve each
original acceptance boundary; parent and child entries are not independent jobs.

## Required native CI qualification

Desktop remains blocked on final native acceptance. Run41150100447 at96a4139b
passes588 Node,746 policy and263 Rust tests (two existing ignored cases),
quality, bundle and both Linux builds. Native startup passes3; the complete
suite is99 pass/10fail. E-CI-012's Graph/recovery refinements pass all six local
native family cases but have not reached hosted CI.

E-CI-013's coordinator regression passes11 cases and the cold Terminal native
family passes5. A retained close failure is now traced beyond successful native
Terminal release to Notes Sync's cached initialization error. Notes source PR
#51 and version PR #55 are merged; API 0.2.3 is verified on npm's governed
`next` tag from `0d9d4d92`, with all 14 publication/consumer gates passing in
run 41190163735. Desktop must adopt that release and its rebuilt private App
Profile, then prove the original native close boundary. API 0.2.2 lacks the fix.

ACP secondary-window readiness/guarded exit, native queue resume and Bookmarks
rename freshness still need final-head hosted proof. Preserve assertions,
deadlines, admission and retry rules. E-CI-013 retains failed attempts and
separates source from consumer qualification. Every required aggregate must pass
before merge.

## Manual full qualification history

[E-RELEASE-011](../history/E-RELEASE-011.md) records the manual CI blocker on
main `2e63d223e029ac229b9e5656c611bf450c24acaf`. Selected PR #7 checks passed,
including 92 feature passes/17 skips, 2 startup passes/1 skip and 2 resource
passes. Explicit full run 41339715598 failed Governance job 124947318923: manual
dispatch selected `root()` and treated historical receipts as fresh, reporting
their old paths as missing. The remaining incomplete work was cancelled; this
run does not qualify a release. Fix only manual revision selection to require
the checked-out source's fetched first parent. Keep initial-push, PR and push
semantics and all historical receipt contents intact. Local regression and
complete hosted qualification must pass before candidate preparation; this is a
tooling repair, not another native case quarantine.

## Distribution and platform qualification

Former reference: M11. Dependencies: Native AI product qualification; explicit
resumption of distribution work.

Disposition at consolidation: **Deferred**. Requirements: LD-MIG-002.

Acceptance: Install, upgrade, rollback, clean-machine launch, and platform
filesystem/WebView tests pass. Local `.app` success alone does not complete
distribution.

Remaining outcome: Preview automation is resumed under
[current distribution](../current/distribution.md). Qualify the first ordinary
release archive and Homebrew installation before approval. Stable cutover,
rollback and additional platform qualification remain deferred.

Evidence: [E-PLAN-006](../history/E-PLAN-006.md).

## Frozen Deno desktop retirement

Former reference: M12. Dependencies: Distribution qualification and
supported-capability parity or explicit retirement.

Disposition at consolidation: **Planned**. Requirements: LD-MIG-002,LD-MIG-003.

Acceptance: Every currently supported desktop capability is migrated or
explicitly retired, and the replacement has no Deno runtime dependency.

Remaining outcome: Qualify Tauri coverage and remove frozen Deno desktop.

Evidence: [E-PLAN-002](../history/E-PLAN-002.md),
[E-REVIEW-001](../history/E-REVIEW-001.md).

## Retained release decisions

The first preview targets Apple Silicon macOS 15+ (ad-hoc signed, unnotarized)
and Ubuntu 24.04 Linux ARM64/x64 through Homebrew. Preserve Lapis Notes.app and
the canonical bundle identity; keep preview configuration separate. Continue
desktop CalVer above the actual installed Deno release, checking that version
when release work resumes. At approved Tauri cutover, retain all qualified
platforms and retire Deno desktop build/test/release CI while preserving old
archives and user data. Preview installation/window/quit checks do not establish
full Linux native feature parity.

Reconcile currently published upstream packages and consumer contracts before a
registry-only build. The retired release-wave register predates newer published
versions and does not define today's pending releases. Upstream source fixes and
public export acceptance remain prerequisites. Publication is separately
approved for each candidate/wave; this backlog does not authorize tags,
package/image dispatches, signing, deployment or installed-app replacement.

## Registry-install prerequisite

The approved manual Bits UI 2.20.2 patch permits the pending Core/UI release
work to proceed through normal qualification without an upstream release wait.
Retain Link Preview and Slider repairs plus the verified FocusScope guard; every
consumer installs the explicit root patch and frozen hash. E-CI-015 and
[dependency intake](../current/local-dependencies.md) own qualification and the
upstream-equivalence removal gate. A local patch or prepared source alone does
not establish a published Core replacement or final Desktop acceptance.

The current private application requests @lapis-notes/app-profile at ^0.0.0,
which is absent from npm. CI has a pinned private public-build prerequisite.
History ^0.2.0, Agent UI ^0.2.0, Repository UI ^0.1.1, Bases ^0.2.0 and Tasks
^0.1.1 are published registry ranges. AI and JJ Conversations remain unpublished
clients. Before a normal registry-only candidate, reconcile that profile's
owning package and supported public consumption or keep its explicit private
archive prerequisite. Preserve portable tracked ranges and validate the
resulting consumer; do not conceal the missing package through a source alias or
copied implementation.

Workspace 0.3.1, Terminal 0.1.2, Mira ~0.1.4 and Core ^0.7.4 are published.
E-CI-017 removes the Workspace and Terminal npm projections. E-CI-030 removes
the Agent UI, Bases, History and Tasks npm projections while retaining native
plugin fixture sources and qualified Rust git pins. AI, App Profile and JJ
Conversations remain private archive prerequisites. This does not qualify
registry-only distribution. Final released-cohort consumer qualification remains
pending.

UI and Tasks' earlier required-peer audits retained low KaTeX advisory
GHSA-238p-pmpm-9mq7 through Mira's old math adapters. Mira 0.1.4 and Core 0.7.4
publish the repaired boundary. Preserve the original audit receipts and every
blocking audit; Core's former scoped acceptance does not transfer here. The
selected cohort still needs its own Desktop audit.

### Remaining npm archive prerequisites

CI prepares these three packages from the full commits in
`scripts/ci-sources.json`; `scripts/ci-install.mjs` selects their package
boundaries. That source list also keeps native plugin fixture checkouts and
qualified Rust git pins after their npm projections are removed. Remove each
remaining temporary projection after its released replacement or explicit
private distribution contract is qualified in Desktop.

| Package                    | Remaining transition                                          |
| -------------------------- | ------------------------------------------------------------- |
| `@lapis-notes/app-profile` | Retain the intentionally private verified built prerequisite. |
| `@lapismd/ai`              | Retain the intentionally private verified built client.       |

The original E-CI-005 audit predates these newer verified releases. Each
selected source repair still needs its own release and consumer proof. These
prerequisites permit private CI validation; registry-only distribution remains
outstanding.

## Hosted ARM64 case quarantine

[E-CI-036](../history/E-CI-036.md) quarantines four headed cases after run
[41243534780](https://github.com/lapismd/lapis-desktop/actions/runs/41243534780)
on revision `0f99a2d122cae00d6a52a001d913126efa91ad1c`. Command:
`pnpm ci:headed`. Evidence: job `124662463336`, 105 passed and 4 failed. Reason:
the Agent queue reload wait timed out after 30000ms, the conflicted-tab shutdown
wait timed out after 5000ms, and two shell cases had a live session whose output
did not include `$`. Requirement: LD-DESK-005, LD-AI-002, LD-FILE-008, and
LD-TERM-002. Limitation: this release candidate does not qualify those four
cases; the other headed cases on that run still count. Owner: Desktop. Re-enable
a case only after a later hosted Native ARM64 run passes that case without a
timeout or a missing `$` prompt.

[E-CI-042](../history/E-CI-042.md) quarantines eight more headed cases that
failed after that green run. Command: `pnpm ci:headed`. Evidence: run
[41251640087](https://github.com/lapismd/lapis-desktop/actions/runs/41251640087)
job `124686411810` on `20999505d25f21828217b42ac9c002d18eae408f` had 101 passed,
4 skipped, and 4 failed; run
[41253897388](https://github.com/lapismd/lapis-desktop/actions/runs/41253897388)
job `124693184977` on `5eaf084605f7fbc9fc5b3457289c67663d9c29eb` had 98 passed,
8 skipped, and 3 failed; run
[41257308621](https://github.com/lapismd/lapis-desktop/actions/runs/41257308621)
job `124703112760` on `9d8531b36711ed7b36ada0bd199d8d311fb7d8a0` had 97 passed,
11 skipped, and 1 failed. Reason: ACP close ended with `SIGKILL`, a blocked note
save kept both bodies, the portable Bookmarks wait timed out after 10000ms,
three shells had no `$` prompt, Explorer rename kept both note bodies, popup
controls were not centered after resize, and the second ACP WebView handle was
gone. Requirement: LD-DESK-005, LD-AI-001, LD-AI-002, LD-FILE-008, LD-POP-001,
LD-PLUG-003, and LD-TERM-002. Limitation: this release candidate does not
qualify those eight cases. Owner: Desktop. Re-enable a case only after a later
hosted Native ARM64 run passes it without a forced kill, a mixed note body, a
timeout, off-center native controls, a missing window, or a missing `$` prompt.

[E-CI-044](../history/E-CI-044.md) quarantines the hosted Safe Mode startup case
after run
[41262453457](https://github.com/lapismd/lapis-desktop/actions/runs/41262453457)
on revision `80c10a82d2d612e9f54d695ead5d129e1700e1f8`. Command:
`pnpm ci:headed`. Evidence: job `124718457969`, 101 passed, 4 skipped, and 4
failed. Three of those failures are already skipped by E-CI-042. Reason: the
Safe Mode reload wait timed out after 5000ms. Requirement: LD-DESK-004 and
LD-DESK-005. Limitation: this release candidate does not qualify that case.
Owner: Desktop. Re-enable it only after a later hosted Native ARM64 run passes
it without a 5000ms timeout.

[E-RELEASE-004](../history/E-RELEASE-004.md) quarantines the ACP retained-worker
renderer-reload case with maintainer approval on 2026-11-01. It passed on main
`260a21d00948b056b575fa7910e6ca2edad1948e` in run
[41267757854](https://github.com/lapismd/lapis-desktop/actions/runs/41267757854),
job `124734022019`, in 4379.870625ms. It failed in run
[41303987128](https://github.com/lapismd/lapis-desktop/actions/runs/41303987128),
job `124840793734`, on `885268aded6fd2f329d04b5bd2d4479768aa8275` at
`acp-transport.test.mjs:202`: WebDriver `execute/sync` request timed out after
renderer refresh (14825.897334ms case duration). That run finished 95 passed, 1
failed and 13 skipped. The retained provider received exactly one prompt;
reconnection, permission continuity and final provider reaping were not reached.
Requirement: LD-AI-001 and LD-DESK-005. Limitation: this preview does not
qualify retained ACP reconnection across renderer reload. Owner: Desktop native
automation. Re-enable after a cold hosted run passes the original case and its
complete ACP family with the existing deadlines and assertions, without a
WebDriver timeout or uncertain provider replay. Enabled native acceptance and
ordinary packaged Homebrew installation/window/quit checks remain required.

[E-RELEASE-006](../history/E-RELEASE-006.md) quarantines one initial cold-shell
progress/clearance case under the maintainer's RC guidance. The exact case
passed on main `b5a255bbb381d6fc2d936b38925f5b2ae7a6c755` in run 41312175583,
job 124864653873 (6168.600791ms). On PR head
`0e8028df17244196678ba9f8e77e9a889bb8dbf7`, run 41318358534, job 124883118088,
it failed `initial.logoTop > 52` at `startup-progress.test.mjs:33`
(8081.951584ms). The other two startup cases passed. The branch changes
distribution tooling, not application implementation. The later
feature/lifecycle suite was not reached and is not counted as passing. Artifact
13089557346 retains the failed attempt. Requirement: LD-DESK-001/002/005.
Limitation: initial branding/progress/control clearance remains unqualified for
this preview. That checkpoint had 15 quarantines: this cold-start case plus the
14 existing feature cases. Owner: Desktop native automation. Re-enable after the
capture/layout boundary is understood and the original case plus complete cold
startup family pass reliably on fresh hosted runs with unchanged assertions and
deadlines. All enabled exact-source native gates remain required.

[E-RELEASE-008](../history/E-RELEASE-008.md) quarantines the complete background
AI admission/cold-reset case under the maintainer's RC guidance. It passed in
run 41324538550, job 124901661158, on PR head
`c6a37f74ee209823e6a250e31695e6b5cd3d12a6` in 7063.707666ms. The merged main
`5385f7e46a07387552d0485184ef384e3c1a7ba6` has an identical tree, but run
41327592484, job 124910729657, failed the second hidden process's renderer
readiness assertion at `native-session.mjs:124` from `ai-admission.test.mjs:171`
(21568.4285ms). The original 15000ms deadline is unchanged. Artifact 13093916788
retains the failure; its ZIP SHA-256 is
`805f9e89be854524cb39c4d8fc8d0a56ac82e0922d68d8d4fa6f73c9a6be6b7c`. The feature
family finished 94 passed, 1 failed and 14 skipped. Startup had 2 passes and 1
skip; the later resource/development-WebView family was not run. Requirements:
LD-DESK-003/005 and LD-AI-001. Limitation: caller/frame, reload-scope,
vault-closure and cold-reset coverage from this complete case is unqualified.
That checkpoint had 16 quarantines (1 startup, 15 feature). Owner: Desktop
native automation. Re-enable after the readiness boundary is understood and the
original case plus complete native family pass reliably in fresh hosted runs
with unchanged assertions and deadlines. Enabled native gates and ordinary
packaged installation qualification remain mandatory.

[E-RELEASE-010](../history/E-RELEASE-010.md) adds two exact intermittent cases
under the maintainer's RC direction. Queue admission/browser-authority passed in
PR5 run 41329397152, job 124916613683 (3684.871208ms), then failed on the same
application cohort in main8dc63055 run 41332697278, job 124925996739
(16372.17ms), before driver evaluation at `native-session.mjs:124`. It passed
again in PR #7 run 41333250465, job 124927638150 (9343.755041ms). Keep its full
body, 90000ms case timeout and shared 15000ms readiness deadline unchanged.

Deleted-preview recovery passed on PR #5 (5211.512416ms) and main `8dc63055`
(8409.686792ms), then failed in PR #7 head `93c75a08` (23661.083583ms) at
`preview-conflicts.test.mjs:252`: merged-file recreation waited 15000ms. The
retained draft remained visible; Target.md stayed absent. The later shutdown
assertion was not reached. Keep its full body, 60000ms case timeout and file
wait unchanged. Other preview/conflict cases remain enabled. No application,
public package, helper or shared acceptance implementation changed in PR7.

Main `8dc63055` finished 93 feature passes, 2 failures and 14 feature skips. PR
#7 finished 93 feature passes, 1 failure and 15 feature skips. Both startup
families had 2 passes/1 skip; neither reached the later
resource/development-WebView family. Failed artifacts 13094867223 and
13095249631 retain those attempts; E-RELEASE-010 records their verified ZIP
hashes. At E-RELEASE-010: 18 quarantines (1 startup, 17 feature). Queue
admission/refusal and deleted-preview recreation/shutdown coverage from these
cases remain unqualified. Requirements: LD-AI-005, LD-FILE-008 and LD-DESK-005.
Owner: Desktop native automation, with file recovery owned by Desktop/Notes
editing. Re-enable each after its boundary is understood and the original case
plus complete native family pass reliably in fresh hosted runs with original
assertions/deadlines. Enabled exact-source native and ordinary package/Homebrew
qualification remain mandatory.

### Explorer filename replacement quarantine

[E-RELEASE-012](../history/E-RELEASE-012.md) quarantines only
`Explorer rename and move preserve collisions, the active editor and restart layout`
after PR #8 run 41340718997/job 124950772330 on `627d2148`. It passed unchanged
in PR #7 run 41337362311/job 124939943968 in 11110.81825ms; only manual CI
revision selection, its tests and documentation changed afterward. Application,
dependency and native helper inputs are identical. The failed case took
11187.844875ms and timed out at `file-ui-mutations.test.mjs:130` after the
original 5000ms wait for `Renamed.md`.

Verified artifact 13098307647 has ZIP SHA-256
`838b90d8b6a9ffaf2765d4768319d5a1343f7c00a004f5726a2ae732ca4d2198`. Its disk and
DOM contain `Note.mdRenamed.md` with the exact intended draft; `Keep.md` and
`Archive/Renamed.md` retain their collision bytes. This points to the
automation's filename replacement, not a slow tree projection. The exact
clear/input mechanism remains to be diagnosed. No move or cold-layout success is
inferred from the failed run. Startup: 2 pass/1 skip. Feature family: 91 pass/1
fail/17 skips. The later resource family was not run.

Preserve the original callback, assertions, helper and deadlines. E-RELEASE-012
added one explicit skip, then totaling 19 cases (1 startup, 18 feature). The
combined rename/move/cold-layout boundary remains unqualified. Owner: Desktop
native automation; Notes Explorer owns any upstream input defect. Re-enable
after diagnosing filename replacement, verifying the exact requested value
before submission and passing the original complete case plus its native family
reliably on fresh hosted runners with the original outcome assertions and
deadlines. Other mutation/recovery cases, exact-source full CI and actual
Homebrew package qualification remain required. Carry this limitation into the
candidate receipts and release notes; skipped coverage is not passing coverage.

### Vault-return replacement input quarantine

[E-RELEASE-013](../history/E-RELEASE-013.md) quarantines only
`the chooser returns to the previous vault after cancellation without retaining its old database`.
It failed PR #8 run 41345056450/job 124963038273 on `d3f33f62` in 5977.988958ms
at `vault-return.test.mjs:35`. The complete unchanged case passed the preceding
run 41340718997/job 124950772330 in 7000.684083ms. Only the unrelated Explorer
case skip and its documentation changed; product, dependency, vault-return and
shared helper inputs match.

Verified artifact 13099099342 has ZIP SHA-256
`576fd4ec49e48b623ff3732df0be943cf57ee147044866b7dca7568e5f5e5e8e`. Its actual
`Welcome.md` contains `# Preserved when returning` followed by the original
`# Return to this note`. The launcher is visible. The input sequence intended to
select all and replace the original text before returning; exact
focus/selection/driver delivery remains undiagnosed. This shares an input
replacement symptom with E-RELEASE-012, without proving a common root cause. The
assertion precedes database reopen/release, cancelled picker and return checks,
so none of those later boundaries is qualified by this failed case. Startup: 2
pass/1 skip. Feature family: 90 pass/1 fail/18 skips. Later resource checks were
not run. All 13 other direct gates passed; two aggregates failed downstream.

Keep the complete body, assertions, original deadlines and shared helpers. Total
current quarantine: 20 cases (1 startup, 19 feature). Owner: Desktop native
automation, with Notes editing ownership for any upstream selection defect.
Investigate native focus, select-all acknowledgement and element input delivery
across both input cases. Re-enable after exact replacement text is established
before leaving, and the original full case plus native family pass reliably on
fresh hosted runners with outcome assertions and deadlines intact. This case's
vault return, cancellation and database lifetime coverage remains unqualified.
Enabled native CI, exact-main full qualification and ordinary Homebrew package
acceptance remain required. Carry the gap into candidate notes and receipts.

## Development audit exceptions

[E-CI-037](../history/E-CI-037.md) records two development-only advisories that
blocked Dependency audits on run
[41246684301](https://github.com/lapismd/lapis-desktop/actions/runs/41246684301),
revision `d83bec25d0467725f38b7ca9fd5ecbe739286769`, job `124682633629`.
Command: `node scripts/ci-install.mjs --audit`. Evidence: the production audit
reported no advisories; the full audit blocked `GHSA-3g3m-2fjr-6pw4` (glob
10.5.0) and `GHSA-g3hv-75wg-m249` (minimatch 3.1.5, 5.1.9, 9.0.9 and 10.2.6),
both under WebdriverIO tooling. Requirement: LD-GOV-006. Limitation: these
exceptions do not qualify production dependencies and expire 2026-11-30. Owner:
Desktop. Remove an exception when its listed edges are patched or gone.

The hosted Dependency audits job starts with the other lanes
([E-CI-041](../history/E-CI-041.md)). It does not wait for Governance, Quality,
tests, Storybook, the native bundle, headed acceptance, or the Linux builds.
Validate still requires its result. The catalog merge unit check requires that
same split ([E-CI-043](../history/E-CI-043.md)): Validate waits for every shard,
and Dependency audits has no lane dependency.

## Stable Tauri cutover follow-up

Preview automation does not switch stable users. A separate approved cutover
must use a CalVer above the actual installed Deno release, preserve
`Lapis Notes.app` and `notes.lapis.desktop`, prove Deno-to-Tauri upgrade,
rollback and note/profile compatibility on macOS and the retained Linux
architectures, and retire Deno desktop build/test/release CI while preserving
archives and data.
