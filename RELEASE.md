# Dependency-first public releases

Updated: 2026-10-21; integrated into Desktop main 2026-10-27. Execution is
authorized; publication needs separate approval for each wave. This operational
tracker does not replace canonical task gates.

## Current position

**Wave 4 complete: Design Core 0.6.0 is public and consumer-verified.** Only its
clean default workspace remains; consolidated tracked source is on main. Release
#31 at `5bae9497` and evidence #32 at `c82fcb71` pass protected checks. Release
workflow `39667451267` passes all five jobs. Public npm bytes,
provenance/signatures and the cold consumer match the approved artifact.
E-RELEASE-017 retains exact identities and audit limitations. Next is Wave 5
Lapis Notes reconciliation; later approvals and original Desktop gates remain.

Desktop has active work owned by another task; Design Core was clean at the
consumer check. Recheck ownership before each wave. This tracker is integrated
into the Desktop default workspace from bookmark `codex/release-coordination`
(`a8572603`, qualified Desktop landing `5c46fe5997f5`). Main consumes
`@lapismd/design-core ^0.6.0`; E-RELEASE-001–016 remain on that unlanded
lineage, and E-RELEASE-018 records this integration. Do not move or commit
another task's working-copy changes.

## Approved delivery choices

- First application: Apple Silicon macOS 15+ preview, ad-hoc signed and
  unnotarized, distributed through Homebrew.
- Public source: `lapismd/lapis-desktop`; its checkout currently has no remote.
- Replace `lapismd/tap/lapis-notes`, keeping `Lapis Notes.app` and canonical
  bundle identity. Keep development-preview configuration separate.
- Continue desktop CalVer above the last installed Deno release. The current tap
  is `2026.31.5`; recheck it before choosing the actual release version.
- At successful Tauri cutover, make the active cask macOS-only and retire all
  Deno-desktop build/test/release CI. Preserve old archives and all user data.
- Public publication is approved wave by wave. Source integration and PR work
  may proceed; never infer tag, package, image or registry-dispatch approval.

## Wave register

Statuses are independent: source pending, merged locally, GitHub merged, CI
qualified, publication approved, published, consumer verified. A push is not a
release. A local archive is not a public package. Unknown means unverified.

| Wave | Repository                   | Source position                                                                                               | Publication position                                                           | Next action                                                         |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1    | storybook-addon-visual-delta | 0.0.9 source `c53f22a5` and source fixes merged; owner evidence #39 qualified/merged                          | 0.0.8/0.0.9 approved, published and registry-consumer verified                 | Complete for 0.0.9; Mira adopts the public package                  |
| 2    | agent-redaction              | PR #1 merged at `02a6b492`; protected source checks pass                                                      | Cargo `0.1.0` / npm `0.1.1` approved, published and registry-consumer verified | Complete for library release; consumer adoption in later waves      |
| 3    | mira-mde                     | Source/version qualified at `e8d0dc89`; evidence #17 qualified/merged `a332ca3b`; default clean               | Core `0.1.0` / five companions `0.0.3` approved, public and consumer-verified  | Adopt released packages in Design Core                              |
| 4    | design-core                  | Release #31/main `5bae9497` and evidence #32 `c82fcb71` are merged/qualified; default clean                   | `0.6.0` approved, published, provenance and cold public consumer verified      | Complete library wave; prepare Lapis Notes Wave 5                   |
| 5    | lapis-notes                  | Required API `cae795d0` is already in clean default `ce1a786e`; GitHub main is `eee66694`; version #37 exists | Framework publication pending; no Wave 5 publication approval yet              | Refresh/reconcile GitHub and #37; preserve current API and versions |
| 6    | lapis-plugins                | Required Markdown `8c345d30b497`, Graph/Source Editor `d76ed20282b7` remain in `desktop-reading-fill`         | Required releases pending                                                      | Integrate source while retaining default Search/AI fixes            |
| 7a   | lapis-ai                     | Default `b120a3c2d4d6`; GitHub merge pending                                                                  | `@lapismd/ai` private/unpublished; required native crates absent               | Add public renderer packaging and complete Cargo cohort             |
| 7b   | lapis-terminal               | `d7e0a7cd710f` already on GitHub                                                                              | Native `0.1.1` exists; `@lapismd/terminal` absent                              | Add npm delivery and clean-consumer proof                           |
| 8    | jj-store                     | Default `08b58c7e507d`; reconcile GitHub merge and preserve unrelated docs                                    | Required Cargo and history/conversation npm names absent                       | Qualify coordinated native and npm releases                         |
| 9    | lapis-desktop / homebrew-tap | Desktop source local; tap public                                                                              | Tauri not released; old Deno cask remains active                               | Registry-only build, macOS preview and Homebrew cutover last        |

Spec Validator is already pushed/published and needs no release without a new
defect. The separate server migration and other applications are not included.
Do not activate a new registry backend or Nostr route during these waves.

The baseline source positions come from the 2026-10-19 dependency audit. Refresh
each wave against live default workspaces and remote main before integration.
Registry absence for the four npm clients and sampled native prerequisites was
verified on 2026-10-19; recheck exact versions before publication.

## Evidence recorded per candidate

For every package, record its source and merge SHA, version, PR URL, exact CI
run, release manifest, tarball/archive SHA-256 and npm integrity or Cargo
checksum, approval, public tag/release URL and direct-consumer result. Leave
missing fields pending. Log failed attempts and partial publication.

### Wave 1 completed package

- Package: `@lapismd/storybook-addon-visual-delta@0.0.8`.
  [GitHub release](https://github.com/lapismd/storybook-addon-visual-delta/releases/tag/v0.0.8)
  is public, stable and non-draft, published 2026-10-19 23:15:22 UTC.
- Immutable package/tag source: `4a4a2f05df6336d7383546a0ebc4f8b925b53b8e` (#33
  merge). Protected head `969e5667577f58ba08ed30d1197db11ea1004ca9` passes all
  five checks in `39336271818` / `39336271825`; exact-main CI `39336949804`
  passes. Exact-source pre-tag run `39336970630` passes all live identity/audit
  gates.
- Original npm workflow:
  [39337032314](https://github.com/lapismd/storybook-addon-visual-delta/actions/runs/39337032314).
  Package/ARM64 and protected trusted publication pass; registry signature and
  Sigstore verification pass after metadata/tarball visibility recovery. npm
  publication runs once; no public bytes or tag are replaced. Transparency log
  index: `3327368964`. Historical failed attempts remain in
  [E-RELEASE-007](spec/src/history/E-RELEASE-007.md).
- GitHub completion fix #34 head `b625c14186be727e0a19f8ee968fcb825cd0dd2d`
  passes all five checks in `39339620217` / `39339620263`; merged main
  `0c6b96a8d08b2e3d82b5deb4ace74fcd4cfb5ce4` has the identical tested tree.
  [Recovery 39340312007](https://github.com/lapismd/storybook-addon-visual-delta/actions/runs/39340312007)
  verifies the original tag/run and four successful release gates, then creates
  only the missing GitHub release. Original package/tag remain at 4a4a2f05.
- Lock SHA-256:
  `7aef952f349b6fcc06b924d521d27cf9a6df1728d3d84c1e317032b99166d189`. Public
  canonical archive: 791408 bytes / 643 files, SHA-256
  `3d3c126cf7309e12ac1bc86adbad7ef97ffd67539cceb48f36a18b9068566bd5`. Complete
  reviewed tar payload: 4187136 bytes, SHA-256
  `6f3aa1c5af1bf61448c823e58be3bec866acbdcde4017fa10cad5cba94d65ff1`.
  Registry/Sigstore integrity:
  `sha512-sERPCsJnnsRrninhGIfldCOMphPEL1zVw0eLJ2TN3NpKScBSY20ESFnHZvBXJX2H63MzPyCtixhvLVOavEfjzw==`.
  Downloaded registry bytes, SLSA npm PURL digest and resolved Git source all
  match. MIT notice, file metadata/order and executable CLI remain verified.
- The original reviewed local gzip `f445b1d...` differs only in compression;
  complete decompressed tar bytes are identical. The first pre-tag guard stops
  before tagging; canonical Linux Node 24.15.0 reproduction and #33 qualify the
  exact public compressed archive plus unchanged payload.
- Explicit publication approval and the bounded dev-tool risk decision cover
  only braces@3.0.3 / GHSA-vfj7-8cjw-p6xm and sprintf-js@1.0.3 /
  GHSA-hp3w-g68c-fv3c for this release. Production audit is clean; full source
  audit remains non-clean. The exception is consumed and
  `VD_008_AUDIT_APPROVED_SOURCE` is deleted/read-back absent. Future versions
  inherit no exception and still require a clean audit.
- Isolated registry install outside checkouts: 74 packages, zero audit findings.
  Installed version, CLI help, public Node/runner exports and qualified image
  profile pass. Released CLI planning canaries pass for 740 Design Core and 149
  Desktop targets. These are read-only planning canaries; consumer package
  range/lock bumps and full UI adoption remain in their later owning waves.
- The separately approved CI image is published and native verified on AMD64 and
  ARM64 in `39325220413`, with repository consumer canaries passing. Source:
  `2fa7976031bd24cbfa646596c22586c1ad6992e7`; audit tag:
  `node24.15.0-pnpm10.32.1-playwright1.62.1-r1`. Index:
  `sha256:d96587d3f3eed2d1cbe63593566813b5f255576a28f27595dec6bb35e9936b71`;
  ARM64:
  `sha256:661cb2485c34efc928a3ab2b64b867ee02908a71145f6a2d8a61d6febfb8abc4`.
  Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5; font manifest:
  `sha256:be624be721eecdf535a480ca7e0382cd6510f8060b849f604eb55144ed1c83d3`.
- Superseded Dependabot #10/#13/#15/#16/#17/#18 are closed after main covers or
  exceeds every requested version. No PR remains open at completion. Earlier
  source/approval history remains in E-RELEASE-005/006 and owning Visual Delta
  records; no baseline is changed.

### Wave 2 completed packages

- Source/main: `02a6b4926de335bee147017b56fcdac7cac314bd`,
  [PR #1](https://github.com/lapismd/agent-redaction/pull/1). The merge tree
  matches protected head `c554449ed92573f6d8e64de869c42417aceeb3b3`.
- Protected PR checks pass in `39482917806` / `39482917384`. Exact-main
  [CI 39483877270](https://github.com/lapismd/agent-redaction/actions/runs/39483877270)
  passes Linux and Apple Silicon macOS native, archive and isolated-consumer
  checks. Main specification deployment `39483877185` also passes.
- Cargo package: `lapis-agent-redaction@0.1.0`, 30347 bytes / 13 allowlisted
  files, SHA-256
  `19781b5d786a79d7db9b36c3d8ca29139ed0d208982ee3b69c7f52050b729bf2`. Both
  platform archives are byte-identical, source-bound and independently
  inspected. Lock SHA-256:
  `fa3393e67dc46ed617c17789c15c9664156ff1bf6ac39c5c6480e95b6ea0a97c`. Manifest
  inventories all 359 dependency licenses and includes Apache license and
  extraction provenance. Both native privacy tests pass from each archive
  outside the checkout with `serde_json/preserve_order` enabled.
- npm package: `@lapismd/agent-redaction@0.1.1`, 16062 bytes / 29 files, SHA-256
  `ef70ff57f2d12956d388c9619f626cb2a100c85375050c031266a098d568aca0`; integrity
  `sha512-GCA0ALq/4IUoOqUifEZYAIDVyXwfLSmG35H1NmCv/E3Ghbc+qJxmyX1xjUfNP6J+CNh8eUZUpnSVd0bR68CigQ==`.
  [Qualification 39483891173](https://github.com/lapismd/agent-redaction/actions/runs/39483891173)
  passes under Node 24.22.0 / pnpm 10.32.1 / Rust 1.99.0; publication/notes
  intentionally skip. Independent archive inspection and isolated install add 41
  packages, pass portable and Node functional sanitization, and audit clean.
- npm `0.1.0` already exists. A patch candidate is needed because README,
  scripts and package-manager metadata changed; all 26 runtime files remain
  byte-identical to 0.1.0. No open Dependabot PRs were found, and frozen npm
  audit has zero findings. Detector pins are unchanged; no Wave 1 exception
  carries over.
- Local evidence: 60 runtime/architecture/boundary tests, eight release-control
  tests, two Deno tests, four spec lanes, format, actionlint, build/publint.
  Native local aggregate suffixes stop at the 30 GiB disk guard and remain
  separately unpassed. Exact-source hosted native qualification is complete.
- Historical attempts remain in E-RELEASE-008 and owning records: push
  protection rejects a complete synthetic detector fixture; unpublished
  extraction is corrected without bypass. Initial hosted rustfmt failures are
  corrected. An eval-based npm probe inherits an incompatible worker launch flag
  and omits; unchanged assertions pass from a normal file-based ESM consumer. No
  new eval launch-flag compatibility is claimed.
- Cargo bootstrap/trusted and npm production environments now require review and
  main-only deployment. Strict main requires Linux, macOS native and spec
  checks. Cargo upload additionally binds exact main/source/version/checksum; it
  rejects existing mismatches and never automatically retries an upload.
- Owning contracts/evidence: AR-NATIVE-001/002, AR-PKG-002;
  `spec/records/native-release-preparation.md`, `native-fixture-publication.md`,
  `native-release-ci.md`, `docs/releases.md` and the owning GitHub CI/artifacts.
- The user explicitly approved both exact candidates with “let's publish these”.
  [Cargo 0.1.0](https://crates.io/crates/lapis-agent-redaction/0.1.0) and
  [npm 0.1.1](https://www.npmjs.com/package/@lapismd/agent-redaction/v/0.1.1)
  are public.
  [Bootstrap 39485878423](https://github.com/lapismd/agent-redaction/actions/runs/39485878423)
  passes native publication and registry-only privacy consumers.
- [npm publication 39485709902](https://github.com/lapismd/agent-redaction/actions/runs/39485709902)
  completes all jobs in attempt 3. Attempt 1 fails before upload with ENEEDAUTH;
  user authentication and trusted-publisher binding repair it. Attempt 2 uploads
  exactly once, then fails immediate registry visibility. Public metadata,
  tarball and SLSA are independently verified before resuming verification only.
  No public bytes, version or tag are replaced. Transparency index:
  `3342716025`.
- The clean npm registry consumer uses empty isolated user/global
  configurations, adds 41 packages, audits 42, verifies 41 signatures and 31
  attestations, and passes portable/Node sanitization with zero audit findings.
  Exact lock integrity and SLSA PURL/SHA-512/source/workflow match the approved
  candidate. Native registry consumers pass both privacy tests with
  `serde_json/preserve_order`; no sibling/path dependency is used.
- [Cargo OIDC verification 39486952295](https://github.com/lapismd/agent-redaction/actions/runs/39486952295)
  passes trusted authentication, token revocation and verification of the
  existing matching crate without uploading again. Trusted publisher `27220`
  binds `release-native.yml` / `crates-io`. Bootstrap secret and both
  exact-source approval variables are removed and read back absent. Original
  local Cargo credential and reviewer/main-only environment protections remain
  intact.
- GitHub releases
  [lapis-agent-redaction@0.1.0](https://github.com/lapismd/agent-redaction/releases/tag/lapis-agent-redaction%400.1.0)
  and
  [agent-redaction@0.1.1](https://github.com/lapismd/agent-redaction/releases/tag/agent-redaction%400.1.1)
  are public, stable and non-draft at the exact approved source. Archive asset
  digests match their registries. Native manifest SHA-256:
  `a7fecdba188561a9e6c4a3882fc7ded0bf7e492128e58f42299c91e9251dd648`; npm
  manifest: `8d36355c60692733f0ade0b76dc8c055fdfa7e47b106470d695b92a7ea4e5ba7`.
- [E-RELEASE-009](spec/src/history/E-RELEASE-009.md) retains failures, recovery,
  approvals and public evidence. Owning `spec/records/publication-2026-10-20.md`
  records unchanged AR-NATIVE-001/002 and AR-PKG-001/002 contracts.
  Evidence-only [PR #2](https://github.com/lapismd/agent-redaction/pull/2), head
  `3c3dc0d768afbe197e796d4bf94c0be5074faa4c`, passes all required checks in
  `39488460253` / `39488460337` and merges at
  `eada2b26c3bf9b41aa6245344479d3941c6f0273`. It does not change immutable
  release source.
- Wave 2 is complete for library publication/registry consumers. Actual
  downstream manifest/lock adoption remains in later owning waves. Linux and
  macOS ARM64 are qualified; other native targets, Desktop distribution and
  original M11/M12 gates remain pending.

### Wave 3 source qualification

- Refreshed main `46bafdf4cfc83e64813596617dc39e382d170eb5` includes PR #14.
  Only safe preview `a95a541b` and annotated TableReader `408809d3` remain
  local. A separate Jujutsu workspace reconciles them without changing default
  source or published history. PR #16 adds their Changeset and reader/token
  catalog.
- The initial workspace audit has eight Vite/Markdown-it findings; patched
  same-major resolutions produce zero findings. Visual Delta 0.0.8 / Playwright
  1.62.1 consume Wave 1's released tooling and qualified image profile.
- Local checks pass 137 preview/table tests, 38 release tests, six catalog
  tests, strict Mira types/Svelte checks, build/publint, formatting, actionlint,
  specification and exact-range release intent. Original failures remain in
  owning evidence, including the parser-test completion repair.
- Source pushes/default qualification cannot publish after this change. An
  explicit manual request and protected approval matching the artifact source
  are required. The npm environment now requires review and only main. No Mira
  approved-source variable is set.
- [CI 39582531161](https://github.com/lapismd/mira-mde/actions/runs/39582531161)
  runs repository/packed consumers, specification/release intent, Storybook
  interactions/accessibility, cold browser acceptance and strict read-only
  visual comparison. Specification/package gates, all 168 Storybook cases and 58
  browser cases pass. The new reader contrast failure is repaired using the
  existing foreground token. Historical screenshot qualification is superseded
  by the user's explicit functional-only policy; no baseline is changed.
  Packed-consumer audit retains the pre-existing low KaTeX advisory acceptance;
  a clean workspace audit does not erase that known vulnerability.
- [PR #15](https://github.com/lapismd/mira-mde/pull/15) initially proposes core
  `0.1.0` and five dependent `0.0.3` packages against public `0.0.5`/`0.0.2`.
  E-RELEASE-015 later records the qualified merge, approval and verified
  release.
- No open Dependabot proposals were found. E-RELEASE-010 and owning
  `spec/records/2026-10-21-wave3-release-preparation.md` retain exact evidence.

### Published runner correction for Wave 3

- Visual Delta source fixes #35/#37/#38 and version PR #36 pass protected checks
  and merge. Exact public source/tag:
  `c53f22a5cfa4de1cf74ce1639887036f1ec0d121`. The user separately approves
  0.0.9. Pre-tag `39591926795` and release
  [39591969237](https://github.com/lapismd/storybook-addon-visual-delta/actions/runs/39591969237)
  retain package, ARM64 visuals, clean full/production audits, protected OIDC
  publication, registry provenance and GitHub completion.
- Pre-tag, package gate, publisher and public npm archives match: MIT, 794483
  bytes / 650 files, CLI 0755, SHA-256
  `1f6c04f4743a74f9f9eccf50512944aa79a778ca1ca6d62aad74c228516b5f7a`; payload
  `526cd5fe9844a9061463b8f859ee12a2758904f68664427e915618093caf258d`; lock
  `da7bf73ca91b63040855e6bbf15456a48a2fc4f789fe20cf96cf6d18c0fff1fe`. The
  consumed 0.0.8 exception remains unused by 0.0.9; both audits are clean.
- The trusted publisher uploads once. Initial npm metadata 404s exhaust the
  120-second verifier deadline; after matching public bytes/metadata, only
  verification job `119198370658` and dependent completion rerun. Attempt 2
  passes. No public byte or tag replacement occurs. Transparency index:
  `3355275666`. Public
  [GitHub release](https://github.com/lapismd/storybook-addon-visual-delta/releases/tag/v0.0.9)
  is stable/non-draft, published 2026-10-21 11:41:32 UTC.
- An independent registry consumer with empty isolated npm configurations adds
  74 packages, audits 75 with zero findings, verifies signatures/Sigstore and
  public exports/CLI. SLSA binds the approved SHA-512 archive, exact Git source,
  scoped package PURL, v0.0.9 and npm-publish workflow.
- Mira's frozen public-registry update replaces one dev-tool package, audits
  clean and retains all package/runtime versions. Local spec/lint/catalog and
  exact-source guards pass. E-RELEASE-013 records the user-directed removal of
  screenshot comparison; fresh CI retains functional gates. No baseline changes
  or Mira publication are authorized.
- E-RELEASE-012 retains approval, failures/recovery, exact identities and
  consumer outcomes. Owner evidence
  [PR #39](https://github.com/lapismd/storybook-addon-visual-delta/pull/39)
  records `spec/records/2026-10-21-publication-009.md`; seven local lanes/158
  scripts and all six required hosted checks pass in `39594150320`,
  `39594150286` and `39594150257`. Merge `b4bfc92e` has the identical tested
  tree. No open Dependabot PRs were found.

### Functional Mira source integration

- The user removes screenshot comparisons from CI/release qualification.
  Protected main requires exactly specification/intent, package/repository and
  Storybook/browser jobs; the workflow validator rejects screenshot CLI and
  baseline-update invocations, including in additional future workflows.
- Source `95f9a82e` passes all three jobs in `39595754754`: full package and six
  packed consumers, 168 Storybook cases and 58 functional browser cases. PR #16
  merges without tree changes at `979ba0a8`. No public tag/package is created by
  this integration. Existing KaTeX acceptance remains explicit.
- Version PR #15 changes six versions/changelogs, the editor constant and
  consumed Changesets only. Manual `39597235670` and approved original PR
  `39596942787` pass; the latter resolves GitHub's merge block without bypass.
  Merge `e8d0dc89` has the identical tested tree; exact-main CI `39601875848`
  passes, including 168 Storybook cases, 58 browser cases and six packed
  consumers. Qualification `39601875729` prepares the six exact archives.
- E-RELEASE-015 records the user's explicit Mira publication approval and
  independent archive/source/SHA-512, exports, portable ranges and
  license/notice inspection. Qualification manifest SHA-256 is
  `7e34f8b880afacdbf712ac743fe660babfa1934dce827177057168b99dfe0c82`. Protected
  publication `39604766563` retains exact-source/main/reviewer gates. Workspace
  audit is clean; the existing low KaTeX finding remains accepted and visible.
  Attempt 4 completes all five jobs after three visibility timeouts. Each
  package uploads once; recovery skips matching versions. All six public
  archives and 870 installed files match, types/34 CSS imports pass, and npm
  signatures plus six exact-source SLSA subjects verify. Six stable GitHub
  releases point to `e8d0dc89`; consumed source approval is cleared. Owner
  evidence #17 passes all three checks and merges at `a332ca3b`, with the
  identical tested tree. Actual Design Core/Desktop adoption remains later.

## Execution rules

1. Refresh remote main, inspect active work and preserve unrelated changes.
2. Review all open Dependabot updates before every repository's source push.
   Record included, already-covered and blocked proposals, consolidate
   compatible bumps in a PR, preserve newer repairs, and qualify coupled
   upgrades together. Keep security/audit findings distinct from version-update
   maintenance. Apply this step to every repository in the wave register,
   including the tap.
3. Integrate using Jujutsu and protected PRs. Never rewrite published history.
4. Confirm automatic triggers cannot tag or publish before wave approval.
5. Use published upstream versions before updating consumer ranges/lockfiles.
6. Run focused local checks. Screenshot comparisons are not CI/release gates.
   Retain exact hosted functional/release/native gates; another task's result
   applies only when its source matches this candidate.
7. Present source, version, artifacts, checks and limitations for approval.
8. Publish reviewed immutable artifacts. Query registry state before recovering
   an uncertain outcome; never replace published bytes or move public tags.
9. Verify the registry install and direct consumer, then close the wave.

Missing npm delivery includes `@lapismd/ai`, `@lapismd/terminal`,
`@lapismd/jj-history` and `@lapismd/jj-conversations`. Update their owning
contracts and clean-consumer tests before adding publication lanes. Preserve
native-only compute exclusions.

## Final application and retirement gate

The application must build from a clean checkout with no sibling resolution.
Qualify packaged edit/save/reopen, plugin loading, history/blame and supported
local Codex/file-backed transcripts. Keep optional and original unresolved
milestone gates visible; this preview does not declare stable parity.

Extend manifest/updater validation for the new repository, explicit previews and
macOS-only targets while retaining old-manifest compatibility for upgrade
qualification. Verify actual Homebrew install, Deno-to-Tauri upgrade, reinstall,
cold launch, uninstall and rollback without deleting vaults or application data.

Only after the public replacement passes installation checks, land Deno-host
retirement across workflows, aggregates, recursive/Turbo tasks, release
scripts/tests, required checks and documentation. Add a regression that active
CI cannot build/test `desktop-deno`; shared Deno services/tooling and framework
or web tests retain their own ownership. Preserve historical downloads.

## Completed work

- Release sequence and cutover choices explicitly approved on 2026-10-19.
- Read-only source, dependency, GitHub and registry baseline audit completed.
- Release-coordination workspace isolates tracking from active Desktop UI work.

- Wave 1 source and completion fixes pass protected checks and are merged.
  Public tag, npm/GitHub releases, provenance and consumer evidence are above.
- Wave 2 source, Cargo/npm publication, immutable public bytes, provenance,
  registry consumers, GitHub releases and bootstrap retirement are complete.
- The approved exception is consumed only by 0.0.8. Production audit is clean;
  full source audit remains non-clean. Canonical archive qualification is
  complete and the exception configuration is retired. Future releases still
  require a clean audit.

Wave 1 CI image and 0.0.8 tag/npm/GitHub release are approved, including the
bounded exception above. Wave 2 Cargo 0.1.0 and npm 0.1.1 are separately
approved, published and verified. Wave 3's current six-package Mira cohort is
also approved. Wave 4 is approved by the explicit release request. Application
and Waves 5–9 retain separate publication approval gates. M11 and M12 remain
Planned.
