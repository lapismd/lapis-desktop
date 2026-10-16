# Governance

Archive rewriting is idempotent only for an exact dependency path already
redirected to a verified tarball. Repeated pnpm hook calls preserve that
redirect; unverified local paths and file-based peer ranges remain rejected.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-GOV-001 | Canonical requirements MUST have unique LD IDs and exactly one verification row, remain navigable in mdBook, and stay within 400 physical lines and 32,768 UTF-8 bytes per authored specification page.                                            |
| LD-GOV-002 | Protected behavior and tooling changes MUST update their mapped canonical chapters in the same Jujutsu change. Unmapped protected paths MUST fail closed.                                                                                          |
| LD-GOV-003 | Every protected implementation slice MUST add fresh evidence with actual commands, results, failure counts, versions, affected paths, gaps and an explicit milestone review. Committed evidence MUST remain immutable.                             |
| LD-GOV-004 | Task pages MUST be the sole completion authority. Done MUST require completed dependencies and passing evidence selected for the original task gate; bookkeeping and substituted tests MUST NOT qualify product behavior.                          |
| LD-GOV-005 | Production and script files MUST stay within 300 counted lines, stories within 400 and standalone tests within 500. Production MUST NOT import test fixtures or use ambient App state, Tailwind utilities, or dependency-internal style selectors. |
| LD-GOV-006 | The desktop MUST use registry packages or verified local pnpm archives during migration, pinned toolchains and portable tracked manifests/lockfiles. Normal builds, checks and native launch MUST work without Deno or a bundled Node runtime.     |
| LD-GOV-007 | Verification MUST start at the exact affected boundary and expand according to the workspace policy. Native lifecycle changes MUST retain cold process acceptance, and visual baselines MUST require explicit human approval.                      |

The user authorized local pnpm archive consumption and deferred package
publication to the final release gate. An ignored local install overlay verifies
archive checksums and source revisions, redirects matching package ranges, and
preserves the tracked registry manifests and lockfile. Source fixes remain in
the owning repositories; the overlay does not patch or alias source.

Counted lines exclude blank lines and comments. Inline tests count toward their
containing production file. Generated lockfiles, icons and build output are not
authored source. No initial file-size exceptions exist.

Evidence uses a JSON metadata block inside readable Markdown. Record independent
runs and all failed attempts. An appended record may resolve an older failure;
it cannot rewrite that result. Use `enclosing-change` for evidence in the change
being verified rather than inventing a future commit hash.

## Change map

| Protected area                                                                                                                 | Required chapter |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| `src/`, `src-tauri/`, `tests/desktop/`, `index.html`, Vite and Svelte configuration                                            | `desktop.md`     |
| `scripts/`, `tests/governance/`, toolchain, formatting, CI, manifests and lockfiles, `AGENTS.md`, spec-validator configuration | `governance.md`  |
| `PLAN.md`, `MIGRATION.md`, migration inventory and milestone task pages                                                        | `migration.md`   |

The executable configuration is `spec-validator.config.mjs`. Its source and
progress plugins are also normal check entry points. `spec:first` compares the
actual Jujutsu change; CI checks the complete pull-request revision range.

The local archive installer validates each checksum, packed package identity,
version, and source revision before pnpm runs. Its ignored pnpm hook redirects
matching direct/transitive dependency ranges while retaining peer ranges, and
restores tracked manifests/lockfiles even after an installation failure.

Local core packing records the actual Jujutsu source snapshot and runs each
owning package's normal prepack lane. Packing that changes tracked generated
source fails until those changes are reviewed and the snapshot is repacked. Each
verified implementation slice is committed after source and consumer acceptance.
When the source workspace is clean, packing records its committed parent;
otherwise it records the exact working-copy snapshot being qualified.

After the owning public build/prepack lanes pass, `--already-built` packs those
verified outputs without rerunning scripts. Source snapshot stability and all
archive integrity/identity/version checks remain required.

Archives must be explicitly declared in the consumer so framework peers resolve
to one owned package graph. Successful local installation invalidates the owned
Vite/Storybook dependency caches before the next cold launch.

M2 extends the exact main-window allowlist with picker/profile/admitted-file
commands. Generic dialog, filesystem, asset-protocol and process permissions
remain denied. Rust directory capabilities enforce vault containment; native
dialog access is called only from the owned picker command. E2E fixture
selection is compiled only behind the existing debug-only acceptance feature.

M3 adds only named admitted database open/execute/close commands. Typed frames
are bounded and SQL file/extension authority remains denied. Pin Rust Turso to
0.7.2 with built-in FTS and without the alternate global allocator. Public API
consumption continues through the M1 committed-source archives.

M3 Notes intake consumes the public Source Editor and Markdown registry packages
alongside those verified core archives. The desktop owns its initial plugin
profile, App construction and teardown; it does not import the private Notes
application profile or expose acceptance instrumentation in production.

Native acceptance launchers inspect the actual executable for both the embedded
driver and isolated-profile feature markers before spawning it. A normal Cargo
build can replace the shared target path; that artifact must fail closed before
any process starts. Rebuild the e2e artifact after ordinary Cargo builds/tests.

The tracked local pack command accepts optional Mira and plugin source
workspaces to produce the full ten-archive Notes cohort. It validates each
owning package identity and source snapshot, records per-package revisions and
checksums, and writes the manifest only after every selected source packs
successfully.

M4 adds only named lifecycle request/result and native last-Notes profile
commands. Exit approval requires a current host-issued request; no generic
window destruction, process exit or arbitrary profile-path permission is added.

Conditional writes add a bounded variant to the existing admitted vault command.
The public API advertises the capability explicitly; normal bundles must also
exclude the conditional-write acceptance driver. No generic permission is added.

File-conflict recovery consumes the public App-owned registry and its protected
actions. Its real cold acceptance joins the existing lifecycle lane; no generic
filesystem authority or second desktop save implementation is introduced.
