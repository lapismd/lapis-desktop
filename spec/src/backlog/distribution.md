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

The first preview target is Apple Silicon macOS 15+, ad-hoc signed and
unnotarized through Homebrew. Preserve Lapis Notes.app and the canonical bundle
identity; keep preview configuration separate. Continue desktop CalVer above the
actual installed Deno release, checking that version when release work resumes.
At approved Tauri cutover, make the active cask macOS-only and retire Deno
desktop build/test/release CI while preserving old archives and user data.

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
rollback and note/profile compatibility, explicitly make the active stable cask
macOS-only, and retire Deno desktop build/test/release CI while preserving
archives and data.
