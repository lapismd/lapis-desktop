# Tauri preview distribution

Desktop owns packaging and release qualification; `lapismd/homebrew-tap` owns
installation and generated casks. The first target is Apple Silicon macOS 15+,
ad-hoc signed and unnotarized. Stable cutover remains in the
[distribution backlog](../backlog/distribution.md).

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-REL-001 | Candidate preparation MUST run manually from hosted main and require the latest successful main CI run for the identical source commit. Public app, Rust and package versions MUST agree on forward CalVer with an rc suffix; the numeric macOS bundle version MUST equal its base. Preview MUST retain its distinct bundle/profile identity and MUST NOT register stable URL schemes.                                                                                                                          |
| LD-REL-002 | Release packaging MUST use ordinary release binaries without e2e instrumentation, release-built bundled AI helpers and verified pinned private public archives. Nested signing MUST finish before helper checksum inventory; the outer bundle MUST be signed last without changing helper bytes. Build metadata MUST record source/toolchain identities, archive hashes and exact-source native CI, including existing RC limitations.                                                                          |
| LD-REL-003 | Schema-v2 `desktop-manifest.json` MUST bind runtime tauri, channel preview, lapismd/lapis-desktop, source commit and desktop-v tag to exactly one canonical versioned macOS ARM64 ZIP with actual size and SHA-256. Candidate assets and native Homebrew receipts MUST have a complete checksum inventory. Altered, incomplete or mismatched assets MUST fail closed.                                                                                                                                           |
| LD-REL-004 | Publication MUST default off and require desktop-preview-release approval after candidate qualification. It MUST promote the same tested bytes without rebuilding, publish a source-bound public prerelease, and never replace differing tag or asset contents. Interrupted draft uploads MAY resume only with identical existing bytes. Publication MUST verify public downloads before starting tap updates.                                                                                                  |
| LD-REL-005 | A verified published preview MUST open or recover a restricted App-authored tap update and enable auto-merge behind the existing four required checks. Stable and preview state MUST remain separate. Recovery MUST verify the public release without rebuilding or republishing. Native install, reinstall, uninstall and data retention MUST pass; upgrades MUST be tested when a prior different preview exists; ordinary installed-app window/quit smoke MUST remain distinct from full feature acceptance. |

## Candidate and publication boundary

`.github/workflows/release-desktop.yml` accepts prepare, publish-candidate or
recover-tap. Prepare requires a passing exact-source CI run; `publish` defaults
false. Promotion selects an unexpired artifact from a successful preparation on
the same main commit, so review without publication does not require a rebuild.
It builds one candidate, checks the ordinary bundle and runtime inventory, and
exercises the actual archive through the pinned tap's temporary candidate
installer. macOS installation and native-window smoke run only on ephemeral
GitHub ARM64 runners; no developer profile or installed application is replaced.

The source-owned smoke uses an external AppKit/CoreGraphics probe. It observes
an on-screen native window for the actual installed bundle and requests normal
application termination with Node/Deno absent from the application's PATH. It
adds no driver, profile override or fixture to the ordinary application. This
boundary does not prove all editor/provider behavior; the separate original
exact-source CI and its documented skips remain authoritative.

Qualified assets include the ZIP, manifest, build metadata, bundle report,
Homebrew receipts, limitations and SHA256SUMS. The protected job downloads that
artifact, verifies its contents and source CI, creates a source-bound tag,
resumes only identical draft assets, and verifies the published downloads.
Preview is never marked as the latest stable GitHub release.

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
