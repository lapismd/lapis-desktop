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

Remaining outcome: Await explicit resumption; retain distribution and platform
gates.

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

| Package                     | Remaining transition                                          |
| --------------------------- | ------------------------------------------------------------- |
| `@lapis-notes/app-profile` | Retain the intentionally private verified built prerequisite. |
| `@lapismd/ai`              | Retain the intentionally private verified built client.       |

The original E-CI-005 audit predates these newer verified releases. Each
selected source repair still needs its own release and consumer proof. These
prerequisites permit private CI validation; registry-only distribution remains
outstanding.
