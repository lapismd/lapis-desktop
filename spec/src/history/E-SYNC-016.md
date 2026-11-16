# Integrate account calls with final native scope delivery

```json
{
  "id": "E-SYNC-016",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-SYNC-001",
    "LD-SYNC-002",
    "LD-CI-002",
    "LD-GOV-003",
    "LD-GOV-004"
  ],
  "contractReview": "Explicitly merge the qualified native account-call/leave slice with final scope delivery and frozen archive tooling. Preserve both source histories, native-owned accepted work, exact scoped grants, guarded leave and default-disabled selection. No activation or publication.",
  "acceptanceReview": "Native, renderer, Cargo/npm, catalog and source-pin comparison against the account-qualified parent is empty. E-SYNC-010 retains actual local macOS and cold catalog evidence at its recorded snapshot. This receipt qualifies integration and tooling only; it does not turn that evidence into a new exact-head OS or connected-account pass.",
  "versions": {
    "accountCalls": "a89d4a9a8702d91208762358e06ce559f2250e13",
    "scopes": "d3de6942b855c0179f40945f12316a335ff91f24"
  },
  "files": [
    "spec/src/current/governance.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-SYNC-016.md",
    "spec/src/backlog/lapis-sync.md",
    "spec/src/verification/lapis-sync.md"
  ],
  "runs": [
    {
      "name": "Explicit integration conflict baseline",
      "command": "jj new internal/sync-account-calls-qualified feature/sync-native-scopes@task-input",
      "result": "fail",
      "failures": 2,
      "detail": "Governance overview and history navigation conflict. Retained native leave guards, artifact-role/frozen-hook rules and both receipt lists. No implementation inputs changed."
    },
    {
      "name": "Complete merged account-call and scope source qualification",
      "command": "pnpm test; pnpm check; pnpm build; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Reports919cfe9e-f150-48ba-b056-87337ba959e3(test),6f2e1f09-b3f0-4dfe-bfbd-33ddebc71c92(check),dff2e15a-56e3-490f-b551-4bb6faac9360(build),267eba4f-9235-4f42-8b2e-bbccbca2933d(spec): all pass.790Node,746AIpolicy,288Rust;two existing invoked-helper ignores. Normal/e2e strict Clippy, types, architecture, App ownership, formatting and all4spec lanes pass. Native/renderer/Cargo/npm/catalog/source-pin comparison againsta89 is empty; E010 actual local native and2168coldcatalog evidence retains its original tested snapshot."
    }
  ],
  "remaining": [
    "Final documentation validation and commit, then source delivery and hosted CI.",
    "Native observations, browser handoff, App integration, real connected-account and full encrypted Sync qualification remain open."
  ]
}
```
