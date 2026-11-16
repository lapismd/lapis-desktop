# Native Sync account calls and admitted vault leave

```json
{
  "id": "E-SYNC-010",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-SYNC-001",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-009",
    "LD-FILE-002"
  ],
  "contractReview": "Register account calls only with native leave preparation/drain/commit integration. Original scope and native owner survive refusal; work and custody remain native. Current public Notes NativeSyncReply provider/requestId/value contract remains unchanged.",
  "acceptanceReview": "Actual macOS account/vault/reload-Quit acceptance passes7/7; complete native API26pass/3existing AI quarantines, no failures. Complete portable check/test/build/spec/static and full cold2168case catalog pass. This qualifies the implemented local account-call/leave slice; connected-account/browser/observation/App injection, locked-Keychain, hosted and full encryptedSync remain open.",
  "versions": {
    "parent": "aa82a6a538a4743625dc6f1cd506ca2d49f5a6a5",
    "nativeFullApiSource": "a218f882174a4abea836420a65165c1d573bebb2"
  },
  "files": [
    "spec/src/current/lapis-sync.md",
    "spec/src/current/desktop.md",
    "spec/src/verification/lapis-sync.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-SYNC-010.md",
    "tests/desktop/sync-account.test.mjs",
    "src-tauri/src/host/sync/commands.rs",
    "src-tauri/src/host/sync/leave.rs",
    "src-tauri/src/host/sync/mod.rs",
    "src-tauri/src/sync/account/leave.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "scripts/source-audit.mjs",
    "tests/governance/source-audit.test.mjs",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "src-tauri/src/host/sync/reply.rs",
    "src-tauri/src/sync/account/detached.rs",
    "src-tauri/src/sync/account.rs",
    "src-tauri/tests/sync_account_detached.rs",
    "src-tauri/tests/sync_account_leave_scope.rs",
    "spec/src/backlog/lapis-sync.md"
  ],
  "runs": [
    {
      "name": "Actual Tauri account call unavailable boundary",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-native-account-before.log:6pass/1fail/0skipped; actual desktop_sync_call refused as command not found. All prior scope/Keychain cases pass after actual normal/e2e strict compiler and build preflight. New case configures a disconnected account, checks database refusal preserves scope/account, then accepted close/reopen preserves client identity. No network/account credential write requested."
    },
    {
      "name": "Actual macOS compiler rejects implicit native-type serialization",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 2,
      "detail": "Log.local/sync-native-account-after.log:strict normal Clippy E0277 for HandoffInspection and DiscoveredVault, neither implements Serialize. No native API case executes. Replace accidental implicit serialization with Desktop-owned explicit allowlisted public IPC projections, exhaustive status matches and64KiB output bound; add complete status/output/refusal regression cases. Native ownership types remain unchanged."
    },
    {
      "name": "Portable compiler confirms the same native-type serialization boundary",
      "command": "pnpm check",
      "result": "fail",
      "failures": 2,
      "detail": "Report7e78185d-3f7b-4a0d-b8fb-90e12eea37da:two original E0277 native reply projection errors after types/architecture/spec pass. Repaired by explicit host public-field projection, not upstream owner serialization or consumer aliases."
    },
    {
      "name": "Exact actual account command and cancellable vault close after projection repair",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-native-account-after-2.log:7pass/0fail/0skipped in17.38s after strict actual macOS normal/e2e all-target Clippy and both builds. Actual configure/snapshot, database refusal retaining same handle/client, accepted close/reopen retaining identity, prior scope and OS adapter cases pass. No account credential was written or network request made. Add reload-then-Quit detached-owner assertion to cover the separate retained-owner path before claiming full native leave integration."
    },
    {
      "name": "Actual reload-to-Quit retained account gap",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-native-account-detached-before.log:6pass/1fail/0skipped. Earlier account/vault-close assertions still pass; after reload and vault_prepare_leave, reopened scope is ready rather than unconfigured, proving detached account owner was never positively closed/collected. Add native detached-account preparation/drain/validated commit under the same transition guard; preserve original client metadata and active sessions."
    },
    {
      "name": "Exact portable compiler after explicit reply projection",
      "command": "pnpm check:rust",
      "result": "pass",
      "failures": 0,
      "detail": "Report8c634ef3-0308-4218-a2bc-335f809f1f6b:all original E0277 errors resolve without serializing native ownership types. This predates additive detached-Quit integration; full source checks follow."
    },
    {
      "name": "Detached-owner regression fixture preserves single-use preparation",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-native-account-detached-after.log:strict normal compiler E0382 in new test fixture, which conditionally consumed the same non-Clone preparation twice. Use an Option and take exactly once per scenario; keep the production single-use guard and all assertions. No native IPC case executes in this attempt."
    },
    {
      "name": "Complete source check preserves test file size budget",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Report5d3858f4-9d93-4bbc-8931-0ac7cb2f3565:LD-SOURCE-SIZE rejects expanded sync_account_leave.rs above300counted lines. Move only the added original-registry/session proof case into sync_account_leave_scope.rs, restore original leave test file, retain all assertions and existing budgets. No product change."
    },
    {
      "name": "Actual native account vault and detached Quit leave after implementation",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-native-account-detached-after-2.log:7pass/0fail/0skipped in17.54s after actual macOS normal/e2e strict compiler and both builds. Original configured account/DB refusal/accepted close passes; reload retains native owner, Quit preparation positively closes/collects it, reopen gets unconfigured scope and subsequent same-origin configuration restores identical client metadata. All six prior scope/OS adapter cases remain passing. Following test-file split changes no production/native behavior; complete native API and portable lanes follow."
    },
    {
      "name": "Split scope regression retains strict shared-helper coverage",
      "command": "pnpm check; LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api",
      "result": "fail",
      "failures": 1,
      "detail": "Portable report7b9c5710-3292-4c6c-b899-c1b1e0fea635 and log.local/sync-account-full-native-api.log:strict normal Clippy detects unused snapshot helper in new split test. Exercise configured account identity before/after refused preparation, strengthening that original-owner assertion without adding an allow attribute. Prior exact source-budget lane cb460077-2248-4952-acb9-df6d75a99e17 passes. No complete native API case executes."
    },
    {
      "name": "Exact public App observation revision regression before repair",
      "command": "pnpm validation -- run test:rust -- --test sync_account_leave_scope",
      "result": "fail",
      "failures": 1,
      "detail": "Report6eea1743-7090-483f-976d-b0f9e925bd55:1pass/1fail/0ignored. Reconfiguring the same window after a ready snapshot rotates its handle but resets revision2to1, which the public Notes service rejects as stale. Preserve the prior observed account and counter across successful replacement; state changes still increment on presentation. Add fault-injected first custody-read refusal coverage to prove the original unconfigured scope survives without credential writes; this is portable refusal evidence, not actual locked-Keychain qualification."
    },
    {
      "name": "Exact public observation and refused-custody scope after repair",
      "command": "pnpm validation -- run test:rust -- --test sync_account_leave_scope",
      "result": "pass",
      "failures": 0,
      "detail": "Reportb58494f1-d71c-4b72-9597-24cd36ff9039:3pass/0fail/0ignored. Original registry/session proof and monotonic handle replacement pass; added fault-injected first custody read proves original unconfigured scope remains valid, then explicit retry succeeds without credential writes. No custody admission rewrite was necessary. Actual locked-Keychain remains unqualified."
    },
    {
      "name": "Complete actual native API inventory with account and detached Quit integration",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-account-full-native-api-2.log:26pass/0fail/3existing skipped of29 in103.57s after actual macOS normal/e2e strict all-target Clippy and both builds. All7Sync cases execute, including configured account refused/accepted close and reload-to-Quit collection. Existing AI quarantines E-RELEASE-008/010/014 remain unqualified. This is local actual boundary evidence, not hosted/release or real connected-account acceptance."
    },
    {
      "name": "Final complete portable account-call and native leave source qualification",
      "command": "pnpm check; pnpm test; pnpm build; pnpm spec:check; pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Reports9879bc36-2e92-41c5-90cf-650b73e17a97(check),aa2d0a81-786a-4a8a-bae5-731a47bd7429(test),f5c93db3-158d-4c36-a064-0cee5c4a85bb(build),f5c75f56-09f3-4cc8-a5a4-d0d73703d5e2(spec),32dacf46-3c54-481b-b73f-b00091719909(static):all pass.787Node,746AIpolicy,288Rust; two existing invoked helper ignores remain. Actual native evidence remains separate."
    },
    {
      "name": "Complete cold account slice catalog interaction and accessibility surface",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Reportf49457fc-4101-4417-b259-d1988aa8d725:2168pass/0fail across all16cold batches, four shards and desktop/narrow/light/dark variants. Counts per shard variant127,134,130,151. No skipped/filtered cases or visual baseline updates. This source predates incoming CI-only artifact fixes; preserve its qualified hash and integrate those later without rewriting it."
    }
  ],
  "remaining": [
    "Final documentation checks and local commit, then integrate qualified CI/current-main delivery source without rewriting this qualified slice; hosted source PR/delivery remains pending.",
    "Observation transport, browser handoff, App injection and real connected-account acceptance; locked custody, full Sync and hosted/release qualification remain open."
  ]
}
```
