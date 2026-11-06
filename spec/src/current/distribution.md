# Tauri preview distribution

Desktop owns packaging and release qualification; `lapismd/homebrew-tap` owns
installation and generated casks. Preview targets Apple Silicon macOS 15+ and
Linux ARM64/x64 on Ubuntu 24.04. macOS is ad-hoc signed and unnotarized. Linux
requires system WebKitGTK 4.1, GTK 3 and Ayatana AppIndicator. Stable cutover
remains in the [distribution backlog](../backlog/distribution.md).

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-REL-001 | Candidate preparation MUST run manually from hosted main and require the latest successful main CI run for the identical source commit. Public app, Rust and package versions MUST agree on forward CalVer with an rc suffix; the numeric macOS bundle version MUST equal its base. Preview MUST retain its distinct bundle/profile identity and MUST NOT register stable URL schemes.                                                                                                                                                 |
| LD-REL-002 | Release packaging MUST use ordinary release binaries without e2e instrumentation, release-built bundled AI helpers and verified pinned private public archives. All preparation, assembly, publication and recovery jobs MUST use the exact tracked Node patch. Nested signing MUST finish before helper checksum inventory; the outer bundle MUST be signed last without changing helper bytes. Build metadata MUST record source/toolchain identities, archive hashes and exact-source native CI, including existing RC limitations. |
| LD-REL-003 | Schema-v2 `desktop-manifest.json` MUST bind runtime tauri, channel preview, lapismd/lapis-desktop, source commit and desktop-v tag to canonical versioned macOS ARM64 ZIP and Linux ARM64/x64 tar.gz archives with actual sizes and SHA-256. Final candidates MUST contain all three targets, per-target build metadata and native Homebrew receipts under a complete checksum inventory. Altered, incomplete or mismatched assets MUST fail closed.                                                                                   |
| LD-REL-004 | Publication MUST default off and require desktop-preview-release approval after candidate qualification. It MUST promote the same tested bytes without rebuilding, publish a source-bound public prerelease, and never replace differing tag or asset contents. Interrupted draft uploads MAY resume only with identical existing bytes. Publication MUST verify public downloads before starting tap updates.                                                                                                                         |
| LD-REL-005 | A verified published preview MUST open or recover a restricted App-authored tap update and enable auto-merge behind the existing four required checks. Stable and preview state MUST remain separate. Recovery MUST verify the public release without rebuilding or republishing. Native install, reinstall, uninstall and data retention MUST pass; upgrades MUST be tested when a prior different preview exists; ordinary installed-app window/quit smoke MUST remain distinct from full feature acceptance.                        |
| LD-REL-006 | Linux archives MUST retain the ordinary release executable, its Tauri resource directory, release-built AI helpers, preview desktop entry and icon. Their launcher/profile/desktop identity MUST remain separate from stable. Ubuntu 24.04 ARM64/x64 installation, reinstall, uninstall, profile/vault retention, visible native window and graceful quit MUST qualify the actual installed application without Node/Deno or acceptance drivers. Linux ABI/dependency prerequisites and feature-coverage limits MUST be explicit.      |

## Candidate and publication boundary

`.github/workflows/release-desktop.yml` accepts prepare, publish-candidate or
recover-tap. Prepare requires a passing full exact-source CI run; selective
green runs cannot qualify a release. A separate manual trial workflow builds the
same ordinary archives without tests, Homebrew qualification, or the protected
publication environment. Its prerelease uses a `desktop-trial-` tag and cannot
authorize preview publication. Full CI remains manually dispatchable; `publish`
defaults false. Promotion selects an unexpired artifact from a successful
preparation on the same main commit, so review without publication does not
require a rebuild. Platform builds produce three ordinary archives from the same
source. Every job pins `.node-version` directly, including tap-only jobs whose
checked-out repository does not contain that file. E-CI-050 aligns that exact
Node patch with the separately published Desktop CI image source; release
consumers cannot adopt an unpublished tag or a mutable reference. The workflow
authenticates that digest-pinned pull with package-read-only workflow authority
and restores Jujutsu and mdBook only from its source/run/attempt-bound image
artifact. Its container producer trusts only the exact mounted
`GITHUB_WORKSPACE` before resolving checked-out Git provenance; wildcard trust
is prohibited. Neither the image nor artifact contains the credential.
Preparation then assembles the complete manifest before testing each archive
through the pinned tap's temporary installer and sealing those exact bytes with
their per-target receipts. Native installation and window/quit checks run only
on ephemeral GitHub runners; no developer profile or installed application is
replaced.

The source-owned smoke uses external AppKit/CoreGraphics on macOS and X11
window-manager observation on Linux. It observes an on-screen native window for
the actual installed bundle and requests normal application termination with
Node/Deno absent from the application's PATH. It adds no driver, profile
override or fixture to the ordinary application. This boundary does not prove
all editor/provider behavior; the separate original exact-source CI and its
documented skips remain authoritative.

E-RELEASE-003 records the native watcher shutdown regression found while
qualifying the preview branch. Candidate preparation still requires successful
CI for the final source; an infrastructure retry cannot waive that regression.
E-RELEASE-004 adds one approved ACP renderer-reload quarantine; its exact
failure, owner and re-enable gate join the candidate limitations and remain
unqualified. E-RELEASE-006 additionally defers the intermittent first-frame
progress/clearance case. E-RELEASE-008 defers the background AI
admission/cold-reset case after an intermittent readiness failure. E-RELEASE-010
adds queue admission/readiness and deleted-preview merged-file recreation.
E-RELEASE-012 defers the Explorer rename/move/cold-layout case after
intermittent filename replacement. E-RELEASE-013 defers the vault-return case
after replacement input retained the original note body. E-RELEASE-014 defers
native queue-owner startup and one macOS ARM64 Rust reader/backup case. E-CI-076
defers the Graph failed-write recovery case after macOS ARM64 Close stayed
blocked. There are 22 native UI quarantines plus that one additional Rust
quarantine. Linux retains the Rust case; ordinary package/Homebrew checks remain
required.

Qualified assets include all three archives, manifest, per-target build and
bundle reports, Homebrew receipts, limitations and SHA256SUMS. The protected job
downloads that artifact, verifies its contents and source CI, creates a
source-bound tag, resumes only identical draft assets, and verifies the
published downloads. Preview is never marked as the latest stable GitHub
release.

The tap App is restricted to Contents/Pull requests write on homebrew-tap. Its
private key stays in GitHub Actions secrets. No release or metadata file may
contain credentials, user profiles or checkout-specific download URLs. Private
archive provenance records source revisions and content hashes, not local paths;
registry manifests and lockfiles remain portable.

First preview install/reinstall/uninstall and real profile/vault retention are
required. An upgrade without an existing different preview is reported not-run.
The stable schema-v1 cask and both Linux packages remain unchanged. A later
approved stable migration owns old-to-new upgrade and rollback qualification.

Candidate installation provisions the same pinned Homebrew setup action used by
tap CI before invoking trust, audit and native installation. The macOS runner
image alone does not establish the required Homebrew version.

Linux packaging retains `bin/lapis-notes-preview` beside
`lib/Lapis Notes Preview/lapis-ai`, matching the ordinary Tauri resource lookup.
The complete archive stays in Homebrew's Caskroom; only the preview launcher and
its own desktop entry are linked into the installation. The desktop entry
contains no stable URL registrations. Exact artifact hashes bind each native
receipt to the tested archive. A final candidate cannot substitute a rebuilt
archive underneath an earlier successful installation receipt.

The full existing native feature suite remains tied to the same source on macOS.
Linux qualifies ordinary installation, resources, startup/window and shutdown;
it does not claim full Linux feature parity from those smoke checks.

## Complete source qualification profiles

Candidate preparation requires the latest successful full CI attempt for the
identical main commit, including private/native preparation, every native
family, all catalog display variants, ordinary bundle audit and both Linux
targets. An ordinary profile, quarantine diagnostic, artifact, incomplete matrix
or earlier passing job attempt cannot authorize preparation. Source equality
requires the exact commit rather than an equal tree. The release build uses the
configured minimum macOS version before dependency cache restore and build.
