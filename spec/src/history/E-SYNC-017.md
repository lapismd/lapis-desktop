# Bounded native account observations

```json
{
  "id": "E-SYNC-017",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SYNC-001", "LD-GOV-003", "LD-GOV-007"],
  "contractReview": "Add passive bounded native observation transport over the retained account owner. Keep explicit scope/provider admission, secret-free payloads and native execution ownership. Detach and replacement must fence late delivery without closing accepted work.",
  "acceptanceReview": "Exact passive observation2/2, actual Sync7/7 and complete native API26pass/0fail/3existing AI quarantines pass with strict normal/e2e Clippy and both builds. Complete portable check/test/build/spec pass after correcting3byte overview overflow. Earlier baseline startup timeout is preserved; repeated exact/full cold processes pass within unchanged deadlines. Native waits are single-flight, coalescing and bounded30seconds/64KiB with exact scope grants. Connected-account, renderer/App, hosted and release gates remain open.",
  "files": [
    "tests/desktop/sync-account.test.mjs",
    "spec/src/current/lapis-sync.md",
    "spec/src/history/E-SYNC-017.md",
    "spec/src/navigation/history-02.md",
    "src-tauri/src/sync/account.rs",
    "src-tauri/src/sync/account/observations.rs",
    "src-tauri/src/sync/account/presentation.rs",
    "src-tauri/src/host/sync/observations.rs",
    "src-tauri/src/host/sync/mod.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "scripts/source-audit.mjs",
    "tests/governance/source-audit.test.mjs",
    "src-tauri/tests/sync_account_observations.rs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/verification/lapis-sync.md",
    "spec/src/backlog/lapis-sync.md"
  ],
  "versions": {
    "integration": "b7ccd9a6711b02d1146c5d6b5ec095c4acbec877",
    "nativeFullApiSource": "02ea004fe84f66f1571e02fd290524ef3ebf8b56",
    "nativeCustodyProbeSha256": "4e2c88886de3b367a927200ff54e22af5fbb1f5ca3f79f025eb1dcf0d18dbc4d"
  },
  "runs": [
    {
      "name": "First actual observation baseline blocked before IPC",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-observation-before.log:6pass/1fail/0skipped. First scope case fails during nativeSession before any Sync command: listener ready2846ms, renderer acknowledgement deadline exhausted at15s. Retained sync-account-yE6jw2 diagnostics show startup Step1 Load the desktop shell, empty app and interactive document. No command-not-found evidence yet. Remaining6Sync/custody cases pass, including another cold process. Preserve this failure, no timer/assertion changes; one deliberate complete lane re-execution follows to locate the actual boundary, and startup remains unresolved if repeated."
    },
    {
      "name": "Actual missing observation command boundary",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-observation-before-2.log:6pass/1fail/0skipped,17.24s. All native processes start within original bounds; first scope case now reaches exact desktop_sync_observe command-not-found assertion. Earlier startup timeout remains recorded, no test deadline or readiness code changed."
    },
    {
      "name": "Exact passive observation service regression",
      "command": "pnpm validation -- run test:rust -- --test sync_account_observations",
      "result": "pass",
      "failures": 0,
      "detail": "Report2b91008d-a7c9-4976-9715-e3e0484d0f9b:2pass/0fail/0ignored. Unconfigured observation performs no custody work, one waiter per scope, permit release, prompt detach/replacement wake, configured coalesced updates and retained account identity pass."
    },
    {
      "name": "Actual native observation transport after implementation",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-observation-after.log:7pass/0fail/0skipped,17.82s after actual normal/e2e strict Clippy and both builds. New observation command returns identical secret-free snapshot; future revision refusesEINVAL, duplicate waits yield exactlyEBUSY and detach promptly wakes original withEACCES. Prior scope/account/Keychain cases pass. All actual processes start within unchanged deadlines; first baseline startup timeout remains preserved and full native inventory follows."
    },
    {
      "name": "Full source check retains the specification byte budget",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Reportdcd567ab-f8d1-4745-a9b5-4f340fc2c455:SPEC-FILE-BYTES rejects current/desktop.md32771bytes against32768. Shorten only Sync overview wording by3bytes; preserve normative admission/leave semantics and original limit. Pipeline stops before test/build/spec. No product change."
    },
    {
      "name": "Complete actual native API observation inventory",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-observation-full-native-api.log:26pass/0fail/3existing AI quarantines of29,104.42s after actual strict normal/e2e all-target Clippy and both builds. All7Sync cases execute, including native observation single-flight/cursor/detach plus account leave and real isolated custody. Fresh processes stay within unchanged readiness deadline; earlier first baseline startup failure retained. Existing AI E-RELEASE-008/010/014 remain unqualified. Local actual evidence does not qualify hosted or release gates."
    },
    {
      "name": "Complete portable observation source qualification",
      "command": "pnpm check; pnpm test; pnpm build; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Reports9571ec78-93cc-4739-a3ee-69c8838a7e2f(check),be7ce729-ae8d-415d-b258-92e8e09f684b(test),5e8cbb00-d383-47c5-9b10-e5fdf73e2e6d(build),e16151ee-ebce-4c24-86e2-eca009806888(spec):all pass.790Node,746AIpolicy,290Rust;two existing invoked-helper ignores. Types, architecture/App ownership, normal/e2e strict Clippy, formatting and all4spec lanes pass. Renderer/catalog/package/source-pin inputs remain identical to account-qualified source, whose E0102168cold catalog outcomes retain their original snapshot; no new catalog run or visual approval claimed."
    }
  ],
  "remaining": [
    "Final documentation validation, local commit and hosted delivery of this observation slice.",
    "Browser handoff, App injection and connected-account/native-platform/full encrypted Sync/release gates remain open. Earlier startup failure remains recorded with unchanged-deadline passing rechecks."
  ]
}
```
