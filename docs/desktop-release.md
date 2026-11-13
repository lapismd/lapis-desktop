# Desktop preview releases

The Desktop preview targets Apple Silicon macOS 15+ and Ubuntu 24.04 Linux
ARM64/x64. macOS is ad-hoc signed and unnotarized. It installs as Lapis Notes
Preview, with a separate application profile. It does not register stable Notes
URL handlers. Stable users remain on the existing Deno tap release until a
separately approved cutover.

## Prepare and review

Merge a version change on main before preparing a candidate. Package, Cargo and
Tauri versions must agree on a higher CalVer with `-rc.N`. Update the release
configuration's numeric `bundleVersion` to the base version too. The first
candidate is 2026.31.6-rc.1, provided stable Deno remains at 2026.31.5;
preparation checks the actual published baseline again. Do not reuse a published
version.

Regular CI selects affected gates. Before packaging, require full CI on the
exact main commit, including all Linux test lanes and all platform builds. macOS
is build-only: no macOS native, WebView, install or Homebrew runtime test is
executed or inferred from Linux. Qualification selects the latest exact-source
push or manual full-CI attempt. A newer failed push/manual attempt still blocks
an older pass. Scheduled nightlies remain independent health evidence: they
cannot authorize a release and do not mask valid push/manual qualification. A
selective docs-only green run cannot qualify a release. If needed, dispatch:

```sh
gh workflow run ci.yml --repo lapismd/lapis-desktop --ref main -F full=true
```

After that full run passes, prepare:

```sh
gh workflow run release-desktop.yml --repo lapismd/lapis-desktop --ref main \
  -f operation=prepare -F publish=false
```

Review the qualified artifact and its Linux native receipts. Preparation builds
release-mode native helpers and the ordinary app, signs nested helpers before
their inventory and the outer app last, audits each bundle, and tests both Linux
archives through native Homebrew installation, reinstall and uninstall. The
macOS archive has build/audit evidence only. Linux uses an XDG application
directory containing spaces. The Linux tar.gz retains the ordinary executable,
its exact Tauri resource tree, release-built AI helpers, icon and preview
desktop entry. Profile/vault bytes are checked across those operations. The
first release honestly reports that upgrade coverage has no previous preview.
Later releases use the prior published preview for upgrades.

The Linux window probe stays inside one 60-second observation budget. A `wmctrl`
status-1 response before Openbox publishes its EWMH client list means
not-yet-observable and is polled again; missing tools, other statuses, an early
app exit, an absent or undersized window and deadline expiry remain failures.

`build-metadata.json` records per-target metadata and the actual CI run,
toolchain, pinned prerequisite sources, private archive content hashes and lock
hashes. App Profile and the AI client remain explicit private public-build
prerequisites; this is not a registry-only claim. LIMITATIONS.md retains the
native RC quarantines from the owning backlog. Skipped cases are not passing
feature coverage.

## Publish after qualification

Each approved version creates its own entry in the repository's
[GitHub Releases](https://github.com/lapismd/lapis-desktop/releases), containing
all three platform packages, checksums, manifest and receipts. RC versions are
marked prerelease. The list stays empty until the first qualified candidate is
approved and published.

Promote the reviewed preparation run without rebuilding:

```sh
gh workflow run release-desktop.yml --repo lapismd/lapis-desktop --ref main \
  -f operation=publish-candidate -f candidate_run_id=<PREPARATION_RUN_ID> -F publish=true
```

Initial publication requires the candidate source to match main and the
qualified artifact to be unexpired. Alternatively, prepare with `publish=true`
to request approval in the same run. The `desktop-preview-release` environment
requires stevejuma's approval, permits main only and disallows administrator
bypass. Approve the exact run's qualified artifact. The protected job promotes
those same bytes without rebuilding, creates `desktop-v<version>`, publishes a
GitHub prerelease, and checks its public downloads. Existing differing
tags/assets cause failure; do not delete or replace a release to conceal a bad
candidate. Advance the candidate version instead.

Configure `HOMEBREW_TAP_APP_ID` and `HOMEBREW_TAP_APP_PRIVATE_KEY` in this
repository. The GitHub App must be restricted to the tap with Contents and Pull
requests write permissions. The workflow opens a two-file preview cask/manifest
PR and enables squash auto-merge. Tap checks and both Linux native installation
jobs remain required. macOS installation remains unqualified.

Once the generated PR merges:

```sh
brew tap lapismd/tap
brew trust --cask lapismd/tap/lapis-notes@preview
brew install --cask lapismd/tap/lapis-notes@preview
brew upgrade --cask lapismd/tap/lapis-notes@preview
```

Linux requires a graphical desktop, D-Bus and these system libraries:

```sh
sudo apt-get install libwebkit2gtk-4.1-0 libgtk-3-0t64 libayatana-appindicator3-1
lapis-notes-preview
```

Linux archives are built natively on Ubuntu 24.04 (glibc 2.39) and require no
FUSE. Homebrew retains the complete package in Caskroom, links only the preview
launcher and installs a separate preview desktop entry. Linux receipts verify
the actual installed executable/resources, architecture, profile identity,
visible X11 window and graceful quit with no Node/Deno on the app's PATH. This
smoke does not qualify full Linux feature parity. The existing macOS native
feature suite stays bound to the same source commit, with all quarantines
disclosed. Final candidate verification requires all three archives and receipts
bound to target and SHA-256.

## Recovery

Preserve a failed protected publication attempt and dispatch a wholly new
`publish-candidate` workflow for the same preparation run; never rerun only the
failed job. The publisher discovers drafts through the releases collection,
verifies existing asset bytes and resumes the unique compatible draft by its
release ID. It leaves empty duplicate drafts untouched and refuses changed or
ambiguous drafts. Publication failure never permits rebuilding a replacement
under the same version.

If the publisher itself needs repair, merge that repair only after explicit full
PR qualification and require full exact-main CI for the repair revision. A new
protected run may then select the original preparation only when the original
exact-source tag and draft already exist. The candidate's source, sealed bytes
and preparation run remain unchanged; the later revision supplies qualified
recovery code, not a replacement candidate.

For a user-authorized protected run, inspect its exact pending deployment and
approve only the returned environment ID:

```sh
gh api repos/lapismd/lapis-desktop/actions/runs/<RUN_ID>/pending_deployments
gh api --method POST \
  repos/lapismd/lapis-desktop/actions/runs/<RUN_ID>/pending_deployments \
  -F 'environment_ids[]=<ENVIRONMENT_ID>' -f state=approved \
  -f comment='Approved exact qualified preview publication'
```

Do not approve unrelated environments or bypass the protected boundary.

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
and data compatibility on macOS and both retained Linux architectures, and
retire Deno desktop CI while retaining old archives and user data. Intel macOS,
Windows, Developer ID/notarization and an in-app updater remain separate work.
