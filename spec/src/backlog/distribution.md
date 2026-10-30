# Desktop distribution and frozen-host retirement

Outstanding implementation and qualification are recorded here. Existing feature
contracts and requirement verification retain the implemented scope. Legacy task
identities below are provenance, not a separate completion ledger. Preserve each
original acceptance boundary; parent and child entries are not independent jobs.

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
