# E-CORE-023: Docker-first dependency intake

```json
{
  "id": "E-CORE-023",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M8"],
  "requirements": ["LD-GOV-006", "LD-GOV-008"],
  "files": [
    "package.json",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/verification.md"
  ],
  "versions": {
    "desktopBaseline": "5f165fc9",
    "mira": "0.1.1",
    "miraCompanions": "0.0.3",
    "designCore": "0.6.0",
    "designCoreSource": "944cd448b40d53be79624c2a453248af78e513e8",
    "pnpm": "10.34.5"
  },
  "contractReview": "Published ranges and public exports remain portable. The explicit checksum archive intake preserves qualified peer inputs and excludes independently dirty source work; complete latest-source freshness is not claimed.",
  "milestoneReview": "This is supporting local dependency intake for M8. Full new-cohort Docker qualification, registry-only installation, native product gates and visual review remain separate.",
  "runs": [
    {
      "name": "installed-archive-payloads",
      "command": "verifyArchiveResolution over selected archives and active pnpm contexts",
      "result": "pass",
      "tests": 80,
      "failures": 0,
      "note": "Twenty checksum-verified archives match eighty direct/transitive import routes."
    },
    {
      "name": "strict-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero Svelte errors and warnings."
    },
    {
      "name": "archive-cohort-governance",
      "command": "node --import tsx --test tests/governance/local-dependency-sources.test.mjs tests/governance/local-archives.test.mjs",
      "result": "pass",
      "tests": 12,
      "failures": 0
    },
    {
      "name": "cold-native-turn-catalog",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/NativeTurns.stories.ts",
      "result": "pass",
      "tests": 4,
      "failures": 0
    },
    {
      "name": "final-source-admission",
      "command": "Independent prepared-package audit 49b7e3c5 and committed public-input equality receipt",
      "result": "pass",
      "tests": 1557,
      "failures": 0,
      "note": "Committed Design Core 944cd448 has byte-identical public inputs to independently audited 3bcbae3f; archive SHA 4f6b3f is unchanged. Complete owning source gate dbf23975 and final spec 6524981e pass."
    },
    {
      "name": "final-installed-public-payloads",
      "command": "verifyArchiveResolution across root and every selected pnpm dependency context",
      "result": "pass",
      "tests": 80,
      "failures": 0,
      "note": "Twenty final source archives match all eighty direct/transitive public routes after installation; tracked manifest and lock are preserved."
    }
  ],
  "remaining": [
    "Complete new-cohort Docker checks and catalog.",
    "Publish private prerequisites and regenerate the complete frozen registry lock.",
    "Native product, actual-provider and visual acceptance remain independent gates."
  ]
}
```

Status: committed Design Core `944cd448` and its independently audited archive
are qualified and admitted locally. Complete consumer qualification remains
active; a complete new-cohort Desktop catalog pass is not claimed until its
runner finishes. Superseded candidate failures are preserved below.

## Scope and source inputs

The Desktop minimum moves from Mira `~0.1.0` to `~0.1.1`. Registry latest is
Mira `0.1.1`, Design Core `0.6.0` and Mira Editor/AI/Mermaid `0.0.3`. The
installed previous cohort used Mira `0.1.0` at `0a72edf8` and Design Core
`0.6.0` at `69f48e54`; package version alone did not identify current fixes.

The current cohort selects the released Mira tarballs and the qualified prepared
Design Core archive from committed `944cd448b40d53be79624c2a453248af78e513e8`.
The final source-admission section records its complete gates and byte equality.
The initial focused receipts below used the superseded `67eb392b` archive. Mira
`0.1.1` was released from `57d6d4409eb61f5b2288ca2d8c4782b88d1b9513`. Those
source receipts are separate from the Desktop checks below; no upstream source
or baseline is changed here.

| Selected archive | Version | SHA-256                                                            |
| ---------------- | ------- | ------------------------------------------------------------------ |
| Design Core      | `0.6.0` | `4f6b3f5c6c619e3154cb2860881b7d89b9c11062db4cfa1eb9ae0488150b7a97` |
| Mira             | `0.1.1` | `70ff5116998b1c733bbaed43b3ce5e4fe44645550a1fe54d1203c7b8a57ac4d4` |

Ignored `.local/dependency-refresh-20261025/manifest.json` records 20 archive
identities, checksums and source revisions. Its `portable-archives.json` adds
the four linked AI, Terminal, JJ History and JJ Conversations public builds,
giving Docker 24 explicit archives without requiring sibling source mounts.
Registry metadata retains the Mira integrity checks; downloads match both
SHA-512 integrity and SHA-1 shasums. Linked export digests match the previous
qualified receipts, and their runtime source has not changed through the
recorded current commits. The remaining 15 archives retain their previous
qualified source identities; this is a selective intake, not full freshness.

## Before state and admission

`node scripts/refresh-local-dependencies.mjs --check` fails before installation
on independent uncommitted Design Core package/build inputs. Those changes are
preserved. The refresh does not package or relabel a dirty source tree.

The narrow candidate preflight runs the public `readArchiveManifest` and
`assertDependencyCompatibility` helpers over the candidate archive manifests.
All 20 checksum/name/version admissions and all 24 runtime/peer range checks
pass with the proposed Mira minimum. This is archive admission, not UI evidence.

## Installation and consumer qualification

The documented source-archive command is:

```sh
node scripts/local-archives.mjs \
  .local/dependency-refresh-20261025/manifest.json
```

The installation admits 20 archives and verifies 20 root import routes. A
separate payload check through `verifyArchiveResolution` includes every selected
package's active pnpm dependency context: all 80 direct/transitive routes match
the verified payloads. Mira resolves to `0.1.1` and Design Core to the selected
prepared `0.6.0` archive.

The following focused new-cohort commands pass:

```sh
pnpm check:types
node --import tsx --test tests/governance/local-dependency-sources.test.mjs \
  tests/governance/local-archives.test.mjs
LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light \
  pnpm exec vitest run --config vitest.catalog.config.ts \
  catalog/plugins/ai/NativeTurns.stories.ts
```

Strict Svelte checking reports zero errors and warnings; all 12 archive/cohort
cases pass. The fresh cold Native Turns family passes all four cases in 18.03s.
The installer reports the existing API peer pin `svelte@5.56.10` against the
Desktop's `5.57.2`; the strict type and cold interaction checks still pass.
Complete Docker checks and the new-cohort catalog remain pending. Earlier
E-CORE-022 native and 2,016 catalog passes used the previous dependency cohort
and are not claimed as new-cohort acceptance.

The new fatal-diagnostic guard interrupts the first Docker catalog attempt after
seven files and 52 cases, before a complete viewport/theme mode, with six
`derived_inert` diagnostics. The focused command
`pnpm test:storybook -- catalog/plugins/ai/Drafts.stories.ts -t 'Reopen Without Sending'`
reproduces one failed case, five filtered cases and one unhandled error.
[E-VALIDATION-001](E-VALIDATION-001.md) retains both exact run receipts:
`1771ec6f-973f-4dff-95fc-23affac3bac3` and
`1f79118c-69ed-4324-bf5f-331d637075f3`. The failure belongs to queued
autocomplete work after editor disposal in Design Core. Its owning source repair
and complete qualification precede the replacement archive and repeated consumer
gates. No completed new-cohort catalog pass is claimed from the interrupted run.

## Owning-source repair sequence

The first source candidate `8940d1af` passed independent package audit
`05ac92e6-d679-4b13-bca7-e9444c9fe95e`; archive SHA-256 was
`4f8adef133571b72280c9bac78cc901a670d9f1fe0b47e8a70f3b6102053bd09`. The exact
Drafts regression then passed in all four viewport/theme modes, but the guarded
broader catalog found six missing autocomplete assertions in Live Inbox, File
Mentions and Multi Recipient. Extension reconfiguration had revoked the
still-live editor view. That archive is superseded.

The replacement source candidate `3bcbae3fcc9e8bfbf75371117b74ceb11173381a`
captures the view at mount and revokes the same view during teardown. Its
deterministic remount regression improves from four passes/one failure to five
passes. Independent prepared package audit
`49b7e3c5-857e-4938-a7a4-04d421ff775f` passes public types, cold
development/production runtime/styles and composer lifecycle. Archive SHA-256 is
`4f6b3f5c6c619e3154cb2860881b7d89b9c11062db4cfa1eb9ae0488150b7a97`.

Ignored `candidate-dc-remount/` inventories preserve all twenty rich archive
entries and twenty-four portable package inputs separately from the original
cohort. Complete source gates, final committed public-byte equality and the
affected Desktop browser gates are required before final admission. The source
package audit retains its previously accepted low KaTeX finding; no new consumer
waiver or baseline update is introduced.

## Remaining gates

The tracked lock predates the current manifest and does not yet qualify a
registry-only frozen install. App Profile, Agent UI and Repository UI each
return registry 404. No fake registry resolution or partial lock is committed.
Docker installs the explicit checksum archive cohort through an isolated
projected lock, freezes that projection, then restores tracked dependency files.
Publication and complete registry-only lock qualification remain distribution
work; provider, native product and visual approval gates stay separate.

## Final source admission

The owning source commits `944cd448b40d53be79624c2a453248af78e513e8`. Complete
gate `dbf23975-fa7c-4fc0-9299-dc461a5d6053` passes 922 unit/browser cases, 17
tooling regressions, 973 interaction/axe cases and 189 browser cases with one
intentional skip, plus public types, format, spec, CSS and static build. Final
spec run `6524981e` also passes. Independent package audit remains
`49b7e3c5-857e-4938-a7a4-04d421ff775f`.

The source owner's final equality receipt compares all 1,557 included tracked
public inputs with candidate `3bcbae3f`; every byte matches, aggregate SHA-256
`849b56cdb469adda80ab163516295b939cb47ed93a39883c7b96e2a80010a081`. The audited
archive remains exactly SHA-256
`4f6b3f5c6c619e3154cb2860881b7d89b9c11062db4cfa1eb9ae0488150b7a97`. Final
twenty-archive and twenty-four-portable inventories now name the committed
source and preserve all prior cohort/candidate receipts independently. Local
installation preserves tracked dependency files and verifies all twenty root
archive routes. The checkout-owned Storybook supervisor is restarted on
`http://127.0.0.1:7480/`, with listener PID `10937`, to invalidate old package
output and optimize the admitted dependencies.

Final installed-payload verification also passes all 80 direct/transitive public
import routes across the twenty selected archives. Its ignored receipt is
`final-payload-resolution.json`. Desktop's installed UI already declares Bits UI
`2.19.5`, so the Tasks-specific stale direct dependency does not require a
Desktop UI archive refresh.
