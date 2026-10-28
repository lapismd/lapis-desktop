# Dead-owner checkout lease adoption

```json
{
  "id": "E-VALIDATION-005",
  "date": "2026-10-28",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8"],
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-004", "LD-GOV-010"],
  "contractReview": "Repairs the operational hazard recorded as an immutable E-VALIDATION-004 gap: withWorkspaceLease created the checkout lease unconditionally but released it only after a successful create, so any interrupted Docker run stranded a lease container and every later lane for this checkout exited 1 within seconds on a name conflict. Lease acquisition now records the creating process as owner-pid and owner-host labels on the lease container, following the same confirmed-absent-owner pattern the preview-maintenance lease already uses. On a name conflict, acquisition inspects the holder through the existing ownership-checked container identity and adopts it only when the recorded owner is the same host, its PID probe returns ESRCH, and releaseLease confirms every owned worker is settled; the release still deletes by immutable container ID. A live owner, a foreign host, a missing or malformed owner record, an unowned squatter or any unsettled worker keeps blocking exactly as before, and releaseLease/cleanOwned are untouched, so explicit clean --apply authority is unchanged. No assertion, threshold or ownership check was weakened; the governance chapter's lease paragraph records the dead-owner adoption rule budget-neutrally at 400/400 lines and docs/validation.md documents the operator behavior.",
  "milestoneReview": "M8 retains its original Done gate and evidence; this record resolves the fourth E-VALIDATION-004 gap beside it without rewriting that immutable record, and is added to M8's selected evidence as a tooling repair in the same governance surface. No product, native, provider, catalog, distribution, signing or visual gate is promoted or requalified; the change is confined to Docker validation tooling, its governance tests and their mapped chapters.",
  "versions": {
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "dockerContext": "omarchy",
    "dockerHost": "x86_64, 16 CPUs, 62 GiB",
    "governanceSuiteTestsBefore": 176,
    "governanceSuiteTestsAfter": 183,
    "validationLeasesTests": 18
  },
  "files": [
    "MIGRATION.md",
    "docs/validation.md",
    "scripts/validation/leases.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-VALIDATION-005.md",
    "tests/governance/validation-leases.test.mjs"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Defect reproduction at the narrowest boundary",
      "command": "node --import tsx --test tests/governance/validation-leases.test.mjs (seven new behavioural regressions against the unfixed scripts/validation/leases.mjs; host-native Node, no Docker needed for this suite)",
      "result": "fail",
      "failures": 4,
      "detail": "Before: the existing suite passed 11/11 while the hazard stayed uncovered. With the new acquisition regressions added and the original implementation restored, 14/18 pass and 4 fail: the interrupted-run lease raises the raw 'Conflict. The container name ... is already in use' out of withWorkspaceLease with no dead-owner path, exactly the recorded 2026-10-27 incidents. The three regressions pinning unchanged behavior (unowned squatter, original create error, clean --apply authority) already passed before the fix."
    },
    {
      "name": "Exact repaired target and the complete governance surface",
      "command": "node --import tsx --test tests/governance/validation-leases.test.mjs; node --test tests/governance/validation.test.mjs tests/governance/validation-native.test.mjs tests/governance/validation-leases.test.mjs tests/governance/validation-dispatch.test.mjs tests/governance/storybook-parity.test.mjs tests/governance/catalog-reports.test.mjs tests/governance/storybook-runtime-warnings.test.mjs; node --import tsx --test tests/governance/*.test.mjs; node scripts/source-audit.mjs; node scripts/source-audit.mjs --app-only (host-native Node runs, labelled: these governance suites are pure Node and need no Docker daemon)",
      "result": "pass",
      "failures": 0,
      "tests": 183,
      "detail": "After: the exact target passes 18/18 (11 retained + 7 new). The validation-tooling lane command passes 91/91. The complete governance glob moves 176/176 before (original files restored temporarily) to 183/183 after, 0 skipped, so the seven additions are the whole delta and nothing regressed. Both source audits pass; leases.mjs stays within the 300-counted-line script budget and the test file within 500."
    },
    {
      "name": "Real-daemon adoption and blocking receipt over the SSH transport",
      "command": "node .local/validation/lease-adoption-demo.mjs (imports the repository's own model/docker/leases modules and the ignored .local config; seeds a stranded lease with a confirmed-dead owner PID on the omarchy daemon, acquires through withWorkspaceLease, then seeds a live-owner lease and re-acquires; workspace da167e34226af956, host Steves-MacBook-Pro.local)",
      "result": "pass",
      "failures": 0,
      "detail": "Against the actual remote daemon, not a fake: the seeded stale lease fcf4e49f (owner PID 731, proven ESRCH) was adopted with the warning 'Released stale lease ...; its recorded owner is absent.', the operation returned 'adopted', and the immutable stale ID was removed. A second lease 3a33df36 seeded with the live demo PID blocked acquisition with 'held by a live or unverifiable owner; if no run is active, an owner releases it with: pnpm validation -- clean --apply' and was retained. The explicit ownership-checked releaseLease then removed the demo lease, leaving zero lease containers. This exercises the same create-conflict, inspect, adopt and blocking paths end to end through the SSH-cli transport."
    },
    {
      "name": "Docker default-runtime lane set on the final tree",
      "command": "pnpm validation:check; pnpm spec:check; pnpm check:progress (Docker default, no runtime override; omarchy Linux x86_64 worker reached through the persistent ControlMaster socket in the ignored local config; the earlier focused governance runs above are labelled host-native Node)",
      "result": "pass",
      "failures": 0,
      "tests": 91,
      "detail": "validation:check exits 0 with 91/91 in the ui container. spec:check exits 0 with four lanes: validate (6 validators, 376 chapters, 116 requirements), rust-format, mdbook (the book builds with this record's new SUMMARY navigation entry, keeping the 400-line budgets), and spec-first (5 protected files, 2 canonical chapters: governance.md and migration.md). check:progress exits 0 with 58 tasks and 331 evidence records, which also proves E-VALIDATION-004 stayed byte-immutable and every protected path in this slice has fresh-evidence coverage. All three lanes were repeated on the complete final tree after the ledger timestamp refresh; the only delta between that snapshot and the committed tree is this receipt's own text."
    }
  ],
  "gaps": [
    "Leases created before this repair carry no owner labels, so a pre-existing stranded lease still blocks acquisition until one explicit ownership-checked clean --apply releases it; that migration is one-time and already documented.",
    "Same-host PID reuse can make a dead owner look alive. That direction only over-blocks (the recorded workaround stays clean --apply); it can never adopt a lease whose owner may be live.",
    "A foreign-host owner is never auto-adopted because absence cannot be proven across hosts; shared daemons with concurrent hosts keep relying on explicit cleanup.",
    "The adoption path is proven by behavioural regressions against a fake Docker boundary plus one seeded real-daemon receipt below; a deliberately killed live lane on the remote host was not staged as a recurring test."
  ]
}
```
