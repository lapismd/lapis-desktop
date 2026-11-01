# Desktop preview releases

The Desktop preview is Apple Silicon macOS 15+, ad-hoc signed and unnotarized.
It installs as Lapis Notes Preview, with a separate application profile. It does
not register stable Notes URL handlers. Stable users and Linux packages remain
on the existing tap release until a separately approved cutover.

## Prepare and review

Merge a version change on main before preparing a candidate. Package, Cargo and
Tauri versions must agree on a higher CalVer with `-rc.N`. Update the release
configuration's numeric `bundleVersion` to the base version too. The first
candidate is 2026.31.6-rc.1, provided stable Deno remains at 2026.31.5;
preparation checks the actual published baseline again. Do not reuse a published
version.

Wait for main CI to pass on that exact commit, then run:

```sh
gh workflow run release-desktop.yml --repo lapismd/lapis-desktop --ref main \
  -f operation=prepare -F publish=false
```

Review the qualified artifact and its native receipts. Preparation builds
release-mode native helpers and the ordinary app, signs nested helpers before
their inventory and the outer app last, audits the bundle, and tests the ZIP
through Homebrew installation, reinstall and uninstall in an application
directory containing spaces. Profile/vault bytes are checked across those
operations. The first release honestly reports that upgrade coverage has no
previous preview. Later releases use the prior published preview for upgrades.

`build-metadata.json` records the actual CI run, toolchain, pinned prerequisite
sources, private archive content hashes and lock hashes. App Profile and the AI
client remain explicit private public-build prerequisites; this is not a
registry-only claim. LIMITATIONS.md retains the native RC quarantines from the
owning backlog. Skipped cases are not passing feature coverage.

## Publish after qualification

Promote the reviewed preparation run without rebuilding:

```sh
gh workflow run release-desktop.yml --repo lapismd/lapis-desktop --ref main \
  -f operation=publish-candidate -f candidate_run_id=<PREPARATION_RUN_ID> -F publish=true
```

The source must still match main and the qualified artifact must be unexpired.
Alternatively, prepare with `publish=true` to request approval in the same run.
The `desktop-preview-release` environment requires stevejuma's approval, permits
main only and disallows administrator bypass. Approve the exact run's qualified
artifact. The protected job promotes those same bytes without rebuilding,
creates `desktop-v<version>`, publishes a GitHub prerelease, and checks its
public downloads. Existing differing tags/assets cause failure; do not delete or
replace a release to conceal a bad candidate. Advance the candidate version
instead.

Configure `HOMEBREW_TAP_APP_ID` and `HOMEBREW_TAP_APP_PRIVATE_KEY` in this
repository. The GitHub App must be restricted to the tap with Contents and Pull
requests write permissions. The workflow opens a two-file preview cask/manifest
PR and enables squash auto-merge. Tap checks and all three Native installation
jobs remain required. The macOS job also verifies preview installation.

Once the generated PR merges:

```sh
brew tap lapismd/tap
brew trust --cask lapismd/tap/lapis-notes@preview
brew install --cask lapismd/tap/lapis-notes@preview
brew upgrade --cask lapismd/tap/lapis-notes@preview
```

## Recovery

Retry a failed protected publish job within its original run to resume identical
draft uploads. The job refuses to overwrite different bytes. Publication failure
never permits rebuilding a replacement under the same version.

If publication succeeded but the tap update failed, recover it independently:

```sh
gh workflow run release-desktop.yml --repo lapismd/lapis-desktop --ref main \
  -f operation=recover-tap -f tag=desktop-v2026.31.6-rc.1
```

Recovery verifies the published source tag and downloads, then reuses an
identical branch/PR. Strict CI failures leave the PR unmerged. Inspect the tap's
Actions receipts before retrying. Do not waive required checks or alter hashes.

## Stable cutover

A later approved change must preserve Lapis Notes.app and notes.lapis.desktop,
advance CalVer above installed Deno, qualify real old-to-new upgrade, rollback
and data compatibility, explicitly make stable macOS-only, and retire Deno
desktop CI while retaining old archives and user data. Linux Tauri, Intel macOS,
Windows, Developer ID/notarization and an in-app updater remain separate work.
