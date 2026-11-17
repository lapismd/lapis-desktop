# Disabled Desktop development Picomatch proposal

**Status: disabled and unapproved.** This document changes no operational audit
policy. Do not copy it into `config/dependency-audit.json` without separate
exact operator approval and fresh complete source/installed-graph qualification.

The actual private installed graph is production-clean after consuming the six
Notes164 archives from committed source
`b3a93b2f5e49d514a6c447a0d6e2664d3179bb3e`. Those archives match the owning
source qualification byte for byte. This does not publish or replace any
same-version npm package. Existing MODERATE WebdriverIO decisions remain
unchanged; no prior coordinator, Visual Delta or Notes record supplies HIGH
approval for Desktop.

## Exact proposed findings

```json
{
  "advisory": "GHSA-fc5q-39xc-vjpf",
  "package": "picomatch",
  "severity": "high",
  "findings": [
    {
      "version": "4.0.7",
      "paths": [".>@storybook/addon-docs>unplugin>picomatch"]
    },
    {
      "version": "2.3.2",
      "paths": [".>@wdio/mocha-framework>mocha>chokidar>anymatch>picomatch"]
    }
  ],
  "status": "disabled",
  "expires": "2026-11-30",
  "reason": "Proposed exact development-only Storybook/WebdriverIO tooling scope after the private installed production graph is clean. Requires separate explicit operator approval; retire on upstream remediation.",
  "approvedBy": "UNAPPROVED — proposal only"
}
```

The proposed expiry uses the existing source gate's inclusive UTC calendar-date
semantics: November30 ends before December1,2026 at00:00UTC. It is a proposal,
not an extension of the separate coordinator decision. Prefer a compatible
released remediation and retire this proposed entry if it becomes unnecessary.

## Reviewed graph facts

- Consumer validation snapshot: `4de846ada8579c9661368d3bf5cefb578af41c91`.
  Later evidence-only commits do not change the dependency inputs listed here.
- Installed lock SHA256:
  `c3557d11aff1162073ec6fcf7f086695644ff378e224e1e2e5aa54cd0b4371d2`.
- Projected root manifest SHA256:
  `5560247406fbf41e9b336fddb494622a4318056f919df72eb483a7c29a7431cf`.
- Tracked portable lock SHA256:
  `45718cc76b2a5f086773affa62b1dc674be73c3954c8a76f9601f54a801a58ef`.
- Tracked root manifest SHA256:
  `67ff70bdb0437f2339cf3d3ef7294dbea4d8c0226461d54d7c58150167c64850`.
- Exact CI source inventory SHA256:
  `cd82614d26a3e685f0930c2f16d94c3c53cf49313abcc5daf22e7c1c8789d86c`.
- Full audit retains three MODERATE vulnerable-version findings under the two
  existing exact approvals and two HIGH development versions under this
  advisory.
- Production audit has zero advisories; the old Profile→Vite production path is
  absent. The current aggregate policy still rejects this HIGH advisory.

These hashes are review evidence. The existing operational gate enforces exact
version/path/severity/finding-count/date and prohibits every production
advisory; it does not currently enforce source/lock hashes. Do not claim runtime
hash binding from this document. A changed graph requires fresh review, not
inherited approval or an edited receipt.

## Scope and remaining gates

The remaining paths are Storybook Docs/unplugin and WebdriverIO Mocha/chokidar
tooling. The advisory concerns expensive repeated-extglob matching. This scope
grants no production, npm/tag, signing, repository write, native distribution or
visual-baseline authority. All unrelated findings, exact source/archive trust,
functional/type/build/catalog/accessibility checks and branch rules remain
blocking. The source audit must be production-clean before any decision can be
considered. Actual hosted candidate/main and complete installed-consumer
acceptance remain required; current local results do not assert those gates.

The owning follow-up is
[Desktop46](https://github.com/lapismd/lapis-desktop/issues/46); adoption57 and
its central archive hold remain open. The operator must approve this exact
proposal or an upstream patched graph must remove the finding before activation.
Nothing in this proposal marks that decision as granted.
