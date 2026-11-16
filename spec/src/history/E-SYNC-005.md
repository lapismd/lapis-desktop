# Native Sync cancellable session leave

```json
{
  "id": "E-SYNC-005",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SYNC-001"],
  "contractReview": "Native session leave prepares and drains the final account owner without revoking window authority. Refused or cancelled leave drops its preparation, retaining the same handle and account owner. Only a native original-registry/session/vault/root proof after successful commit permits revocation; reload and another native session retain ownership. The host retains a transition guard throughout.",
  "acceptanceReview": "Original refused-leave availability boundary fails3missing-method compiler errors then passes1/1. Final account/command/leave cases14/14 in complete287Rust passes, including cold child, uncertain custody recovery, foreign registry proof/root replacement refusal, reload and other sessions. Portable check/test/build, e2e linkage and governance pass; actual Tauri/OS/full Sync remain open.",
  "versions": {
    "coreSource": "5d3d463b57221e6e0be46618c0ec00db3c1938e6",
    "jjStoreSource": "87be3ad68530653c6c6fd1e5a2463a217cf3f044",
    "rust": "1.99.0",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "privateArchives": "Unchanged verified prerequisite cohort and checksums in E-SYNC-001; npm manifests and registry lock unchanged."
  },
  "files": [
    "src-tauri/src/sync/account.rs",
    "src-tauri/src/sync/account/leave.rs",
    "src-tauri/tests/sync_account_leave.rs",
    "src-tauri/tests/sync_account_scope.rs",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "scripts/ci-sources.json",
    "spec/src/current/lapis-sync.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/backlog/lapis-sync.md",
    "spec/src/verification/lapis-sync.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-SYNC-005.md"
  ],
  "runs": [
    {
      "name": "Refused native leave unavailable API",
      "command": "pnpm test:rust -- --test sync_account_leave refused_native_leave_retains_the_original_window_handle_and_account_owner -- --exact",
      "result": "fail",
      "failures": 1,
      "detail": "Availability boundary:3compiler errors for missing preparation/completion methods; no case qualifies. Report lapis-desktop-validation-28c5d397-9404-4c41-82e8-7b67d29d0a10."
    },
    {
      "name": "Refused native leave after implementation",
      "command": "pnpm test:rust -- --test sync_account_leave refused_native_leave_retains_the_original_window_handle_and_account_owner -- --exact",
      "result": "pass",
      "failures": 0,
      "detail": "Original exact1/1,0ignored on reachable Core5d3d463b. Before additional registry-proof/cold/reload/recovery cases. Report lapis-desktop-validation-13a6fb9f-6884-4d8f-8a2f-78f22404c35c."
    },
    {
      "name": "Complete affected native account and leave families",
      "command": "pnpm test:rust -- --test sync_account_leave --test sync_account_scope --test sync_command_admission --test sync_account_admission --test sync_account_lifetime",
      "result": "pass",
      "failures": 0,
      "detail": "13passed/0failed/0ignored across5targets, including4new leave cases and actual cold process. Report lapis-desktop-validation-e3103726-af3d-4562-9c2a-430111cccfb5."
    },
    {
      "name": "Architecture audit before scope test separation",
      "command": "pnpm check:architecture",
      "result": "fail",
      "failures": 1,
      "detail": "LD-SOURCE-SIZE: new standalone leave target exceeded the auditor300-counted-line boundary after adding late root replacement coverage. Moved that scope-only case into the existing scope target; no limit or audit changed. Report lapis-desktop-validation-836af631-4190-420e-8c52-060b0348c96f."
    },
    {
      "name": "Complete portable check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Types0errors/0warnings,115story families/0findings, normal/e2e strictClippy, specification and formatting pass. Report lapis-desktop-validation-f0401896-6204-4431-ba73-4b238f60e1b5."
    },
    {
      "name": "Complete portable test lane",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "763Node/0skips,746AI across152files,286Rust/0failed/2existing helper ignores across63native summaries. Before one late root replacement case. Report lapis-desktop-validation-8e786ae6-8292-4645-a376-107103d7cf50."
    },
    {
      "name": "Renderer build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Production build passes; existing chunk-size/PURE annotation advisories retained without threshold changes. Report lapis-desktop-validation-098e3527-5dd8-4e41-8244-ec965382e7c4."
    },
    {
      "name": "Linux e2e executable linkage",
      "command": "pnpm test:rust -- --features e2e --no-run",
      "result": "pass",
      "failures": 0,
      "detail": "Native application/fixtures/tests link, without claiming actual WebView or OS execution. Report lapis-desktop-validation-871cbf35-fc45-4b09-80a3-693c52a08fbe."
    },
    {
      "name": "Final complete Rust lane after root-scope case",
      "command": "pnpm test:rust",
      "result": "pass",
      "failures": 0,
      "detail": "287passed/0failed/2existing helper ignores across63summaries. Final14account/command/leave cases include4leave and3scope cases, actual cold child and late root replacement proof. Report lapis-desktop-validation-171ba0b3-d18b-405e-baef-c3662dd7606d."
    },
    {
      "name": "Architecture audit after scope test separation",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "detail": "0findings; test-only scope case moved to existing scope target, auditor unchanged. Report lapis-desktop-validation-5d13d58b-880f-4766-8586-ff0f84917453."
    },
    {
      "name": "App ownership audit",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "detail": "0findings. Report lapis-desktop-validation-69896b55-65bb-479a-8846-9cb901655f82."
    },
    {
      "name": "Evidence coverage",
      "command": "pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "479records pass. Report lapis-desktop-validation-c74e8f89-e14c-4598-8a17-51d8f8c74033."
    },
    {
      "name": "Canonical specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All4lanes pass:validation,Rustformat,mdBook,spec-first. Existing large search-index advisory retained. Report lapis-desktop-validation-b4239380-f3f4-458c-b483-9e4c581932b5."
    }
  ],
  "remaining": [
    "Tauri command/event/lifecycle integration and actual cancelled/refused native application leave.",
    "App native observation/selection and upstream Plugins adapter; real OS custody and supported-platform acceptance.",
    "Enrollment, encrypted transfer/apply, automation, recovery and complete independent-device Sync qualification."
  ],
  "notes": [
    "Core source5d3d463b has892workspace passes/0fail/7existing ignores and strictClippy/protocol/canonical checks; source fixture custody does not qualify Keychain.",
    "No renderer/story/Tauri registration or default activation changes in this slice. The actual host must retain its transition guard through preparation, other native checks, commit and completion.",
    "Final source portable check passes report37b9d707-4ea4-4ca3-896c-78dbdd0f1d90, including normal/e2e strictClippy and final scope test. Final evidence479 passes report41829360-3aac-4488-8041-3b0c0683e2a6 and canonical validation7validators/537chapters/133requirements passes reportae051d48-05e3-4d94-89f7-c7fdd1d1e710. Receipt-only metadata checks follow before commit."
  ]
}
```
