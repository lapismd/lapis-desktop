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
Terminal release to Notes Sync's cached initialization error. Its API source
regression moves one failure to two passes; 2,050 full unit and 268 cold catalog
cases pass. Notes PR #51 still needs hosted CI, publication and Desktop
adoption.

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

The current private application requests @lapis-notes/app-profile at ^0.0.0,
which is absent from npm. CI has a pinned private public-build prerequisite.
History 0.1.4 on npm also lacks the repository-controller exports used by
Desktop; CI builds those public exports at the recorded plugins commit. Release
those exports and the private clients before registry-only qualification. Before
a normal registry-only candidate, reconcile that profile's owning package and
supported public consumption or an explicit private archive prerequisite.
Preserve portable tracked ranges and validate the resulting consumer; do not
conceal the missing package through a source alias or copied implementation.

Workspace0.3.1 and Terminal0.1.2 are published and verified; replace their
temporary archives with registry versions and repeat frozen consumer acceptance.
Complete Agent/Repository UI, Bases, History, Tasks and JJ conversations
releases and their current peer cohort. AI and App Profile intentionally remain
private with explicit verified built prerequisites. This does not qualify
registry-only distribution. Design Core0.7.1 is consumed from npm; the newer
source patch still needs publication and consumer qualification.

### Remaining npm archive prerequisites

CI prepares these nine packages from the full commits in
`scripts/ci-sources.json`; `scripts/ci-install.mjs` selects their package
boundaries. Remove each temporary projection after its released replacement or
explicit private distribution contract is qualified in Desktop.

| Package                           | Remaining transition                                                            |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `@lapismd/agent-ui`               | Release the merged host-owned draft/send repair.                                |
| `@lapis-notes/workspace`          | Adopt verified0.3.1 from npm; its governed tag remains next.                    |
| `@lapis-notes/bases`              | Reconcile the qualified bundle and current peer cohort for registry intake.     |
| `@lapis-notes/history`            | Release the repository-controller exports used by Desktop.                      |
| `@lapis-notes/app-profile`        | Retain the intentionally private verified built prerequisite.                   |
| `@lapis-notes/lapis-plugin-tasks` | Release the qualified npm plugin boundary or document its private distribution. |
| `@lapismd/ai`                     | Retain the intentionally private verified built client.                         |
| `@lapismd/terminal`               | Adopt verified0.1.2 from npm; Rust continues through qualified Git commits.     |
| `@lapismd/jj-conversations`       | Resolve the unpublished built client distribution.                              |

The original E-CI-005 audit predates these newer verified releases. Each
selected source repair still needs its own release and consumer proof. These
prerequisites permit private CI validation; registry-only distribution remains
outstanding.
