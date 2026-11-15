# Native Sync scope and command admission

```json
{
  "id": "E-SYNC-004",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SYNC-001"],
  "contractReview": "Native window scopes can exist before selecting a destination without opening an account or reading custody. Configuration replaces handles only on success; account commands remain unavailable until configuration. Native request decoding bounds provider, request identity and arguments, rejects raw secrets/roots/custody/time and supplies the host device label/time. Core retains credential and execution policy.",
  "acceptanceReview": "Exact scope and command targets pass1/1 after unavailable boundaries. Final-Core affected families9/9 include locked configuration retry and identical identity after unlock/restoration. Full portable check,763Node/746AI/282Rust tests, renderer build, normal/e2e configurations and architecture/App/evidence/spec gates pass. Actual Tauri/App, OS custody and full Sync remain open.",
  "versions": {
    "coreSource": "6cc6ba8861f3df217d548888f0e96d0fc42da1d0",
    "jjStoreSource": "87be3ad68530653c6c6fd1e5a2463a217cf3f044",
    "rust": "1.99.0",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "privateArchives": "Unchanged verified public-build prerequisite cohort and checksums recorded in E-SYNC-001; npm manifest/registry-lock unchanged."
  },
  "files": [
    "src-tauri/src/sync/account.rs",
    "src-tauri/src/sync/account/lifecycle.rs",
    "src-tauri/src/sync/commands.rs",
    "src-tauri/src/sync/mod.rs",
    "src-tauri/tests/sync_account_scope.rs",
    "src-tauri/tests/sync_command_admission.rs",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "scripts/ci-sources.json",
    "spec/src/current/lapis-sync.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/backlog/lapis-sync.md",
    "spec/src/verification/lapis-sync.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-SYNC-004.md"
  ],
  "runs": [
    {
      "name": "Unconfigured scope missing API",
      "command": "pnpm test:rust -- --test sync_account_scope unconfigured_native_scope_is_admitted_without_custody_or_an_account -- --exact",
      "result": "fail",
      "failures": 1,
      "detail": "Availability probe:3 compiler errors for missing open_scope/observation; no functional qualification. Report lapis-desktop-validation-6d3137d0-fdc7-4c93-9b87-df4545dab4d0."
    },
    {
      "name": "Unconfigured scope after implementation",
      "command": "pnpm test:rust -- --test sync_account_scope unconfigured_native_scope_is_admitted_without_custody_or_an_account -- --exact",
      "result": "pass",
      "failures": 0,
      "detail": "1/1, no skips; explicit fixture custody panics if accessed. Report lapis-desktop-validation-3fc862dc-0e2a-4303-a52d-b8f3bbb89efa. Before final Core source refresh."
    },
    {
      "name": "Missing native command admission module",
      "command": "pnpm test:rust -- --test sync_command_admission",
      "result": "fail",
      "failures": 1,
      "detail": "Availability probe: unresolved sync::commands. Report lapis-desktop-validation-a38c4fa7-cb4c-4369-9181-6bb14269b72a."
    },
    {
      "name": "Native command admission after implementation",
      "command": "pnpm test:rust -- --test sync_command_admission",
      "result": "pass",
      "failures": 0,
      "detail": "1/1 with allowed operations and rejected provider, correlation IDs, fields, raw secrets/roots/time and unknown/close actions. Report lapis-desktop-validation-b1d16614-ee8c-4d52-aa5f-08b1ac488f70. Before final Core source refresh."
    },
    {
      "name": "Final Core scope and account families",
      "command": "pnpm test:rust -- --test sync_account_scope --test sync_command_admission --test sync_account_admission --test sync_account_lifetime",
      "result": "pass",
      "failures": 0,
      "detail": "9passed/0failed/0ignored on Core6cc6ba88; includes locked first configuration/unlock and identical client restoration, unconfigured no-custody scope, bounded command arguments and all prior account/lifetime cases. Report lapis-desktop-validation-354800a4-56c1-41b7-b88c-beef6621bd2f."
    },
    {
      "name": "Complete portable check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Types0errors/0warnings; normal/e2e strictClippy; story parity115families/0findings; canonical validation and all formatting pass. Report lapis-desktop-validation-b11b8261-23e1-478f-8e2b-49b657b42872."
    },
    {
      "name": "Complete portable test lane",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "763Node,746AI/152files,282Rust/0fail/2existing helper ignores across62native summaries; all9Sync scope/account/command cases pass without skips. Report lapis-desktop-validation-a80f7435-a769-4b0d-92d7-05a5ba4813aa."
    },
    {
      "name": "Renderer production build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Build passes with existing chunk-size advisory, no threshold change. Report lapis-desktop-validation-f12c181a-d690-42ae-9cc6-49f6ee804546."
    },
    {
      "name": "Linux e2e executable linkage",
      "command": "pnpm test:rust -- --features e2e --no-run",
      "result": "pass",
      "failures": 0,
      "detail": "Application,fixture and test executables link, without claiming actual Tauri/OS execution. Report lapis-desktop-validation-f289ff8d-5acd-4102-a31e-30a3398812a5."
    },
    {
      "name": "Architecture audit",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "detail": "Source boundaries pass,0findings. Report lapis-desktop-validation-2fb3da60-437a-49a0-801c-afe31625cc6f."
    },
    {
      "name": "App ownership audit",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "detail": "Source boundaries pass,0findings. Report lapis-desktop-validation-33f7cbfb-f1f2-4736-8314-1c903225c581."
    },
    {
      "name": "Evidence coverage",
      "command": "pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "478records pass. Report lapis-desktop-validation-b211dbfb-1c1e-48e4-bc1b-6cd345b85155."
    },
    {
      "name": "Full canonical specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All4lanes pass:validate,Rustformat,mdBook,spec-first; existing large search-index advisory retained. Report lapis-desktop-validation-9e892199-35ad-472b-8ed6-136ce05b9bd3."
    }
  ],
  "remaining": [
    "Tauri command/event registration and Notes App native port selection, with weak/passive observation ownership.",
    "Native lifecycle drain must preserve the shared owner when leave is cancelled or refused; ordinary view detach cannot close account ownership.",
    "Destination changes, protected restore/sign-out UI and upstream Plugins App-native adapter; existing frozen bridge protocol/renderer polling is not current Tauri integration.",
    "Actual OS custody, native application boundaries and complete encrypted Sync roadmap/qualification remain open."
  ],
  "notes": [
    "No renderer, story, visible state or Tauri command registration changes; existing UI/cold-window qualification is not substituted by native fixture passes.",
    "Core6cc6ba88 is an exact reachable private feature revision; dependent PR/source/platform qualification and final merged intake remain distinct."
  ]
}
```

## Upstream custody repair

Following native first-open custody traced a Core liveness defect: a locked
first lookup left an ownership witness without a client marker, preventing the
unlocked retry. The owning Core exact regression failed0/1 and passes1/1 after
public identity reservation before lookup, including a real cold native child.
Source 6cc6ba88 passed32Core account cases,6real-server cases,888workspace tests
with 7existing non-Sync ignores, strictClippy and canonical/protocol checks.
This consumer pins all three shared crates and hosted sources to that exact
reachable revision rather than concealing the defect in an adapter.

Scope methods validate profile/vault/root and replace opaque handles only after
success. Lifecycle methods moved into their own native module to preserve source
limits; their behavior remains covered by the complete existing account family.
No Tauri command, renderer/App integration, scheduler, default activation or
credential entry is introduced here.
