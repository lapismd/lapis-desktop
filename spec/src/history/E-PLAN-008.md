# Lapis Sync plan integration on current main

The user requested PR publication and merge of the two saved documentation
changes. The isolated Desktop candidate applies only the original documentation
delta to current remote main `eca0a36fec2160baf78020443efc5275bdad2137`. The
original source workspace, its six unrelated files and its mobile-layout
descendants are not rebased, published or included in this PR.

Current main replaces the monolithic SUMMARY/history index with split
navigation. The two navigation conflicts are resolved by retaining current
SUMMARY includes, placing the new entries in the owning navigation fragments,
and supplying a small Sync evidence index. E-PLAN-007 is preserved byte-for-byte
with its exact historical baseline findings and command results. The
compatibility index keeps its referenced file present without reinstating the
retired full inventory.

```json
{
  "id": "E-PLAN-008",
  "date": "2026-11-14",
  "revision": "enclosing-change",
  "result": "pass",
  "requirements": ["LD-GOV-001", "LD-GOV-004", "LD-MIG-002", "LD-MIG-003"],
  "files": [
    "spec/src/backlog/lapis-sync.md",
    "spec/src/backlog/vault-synchronization.md",
    "spec/src/backlog.md",
    "spec/src/current/plugins.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-01.md",
    "spec/src/history/index.md",
    "spec/src/history/E-PLAN-007.md",
    "spec/src/history/E-PLAN-008.md"
  ],
  "versions": {
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.0"
  },
  "contractReview": "Only deferred Sync planning, source context, navigation and fresh documentation evidence are integrated. Product contracts and verification statuses are unchanged. Current-main navigation and immutable historical receipts are preserved.",
  "acceptanceReview": "This receipt qualifies the documentation candidate on current main. Source/workspace failures in E-PLAN-007 remain historical observations. Native behavior, Sync activation and release are deferred; hosted PR validation must qualify the pushed candidate independently.",
  "remaining": [],
  "runs": [
    {
      "name": "Node 24 doctor verifies the current-main configuration and QMD native modules/index",
      "command": "pnpm exec spec-validator doctor --json",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Borrowed tooling preflight initially lacks the hidden pnpm store link; corrected before validation",
      "command": "LAPIS_DESKTOP_BASE=eca0a36fec2160baf78020443efc5275bdad2137 pnpm exec spec-validator validate --json",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Current-main specification and evidence: seven validators, 525 chapters, 128 requirements, zero findings",
      "command": "LAPIS_DESKTOP_BASE=eca0a36fec2160baf78020443efc5275bdad2137 pnpm exec spec-validator validate --json",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Current-main mdBook builds with its existing large search-index warning",
      "command": "LAPIS_DESKTOP_BASE=eca0a36fec2160baf78020443efc5275bdad2137 pnpm exec spec-validator build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Spec-first passes with no protected implementation changes",
      "command": "pnpm exec spec-validator first --base eca0a36fec2160baf78020443efc5275bdad2137 --head @ --json",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Nine changed Markdown files pass formatting",
      "command": "pnpm exec prettier --check spec/src/backlog/lapis-sync.md spec/src/backlog/vault-synchronization.md spec/src/backlog.md spec/src/current/plugins.md spec/src/history/E-PLAN-007.md spec/src/history/E-PLAN-008.md spec/src/history/index.md spec/src/navigation/current.md spec/src/navigation/history-01.md",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Read-only delta audit: nine Markdown files, 297 local links, file limits and byte-identical E-PLAN-007",
      "command": "node --input-type=module (scoped Markdown and original-receipt comparison)",
      "result": "pass",
      "failures": 0
    }
  ]
}
```

Local docs checks borrow the original workspace's installed tooling through
ignored dependency links. This is source documentation validation, not a frozen
install or product-consumer qualification. Hosted CI uses the current main
branch's dedicated locked documentation toolchain and exact Node patch.

The initial dependency-link preflight omitted the hidden pnpm store link, so
Prettier and the validator could not load. Adding that ignored tooling link
restored both commands; no tracked manifest, lockfile or checker changed. The
clean current-main candidate has zero specification/evidence findings;
E-PLAN-007's fourteen findings remain attributed to its older source snapshot.
Hosted PR checks are tracked separately and do not alter that historical result.

The Plugins companion is
[PR #117](https://github.com/lapismd/lapis-plugins/pull/117). No package
publication, registry dispatch, installed-app replacement or user vault changes
are included.
