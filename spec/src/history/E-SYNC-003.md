# Retained native Sync account admission

```json
{
  "id": "E-SYNC-003",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SYNC-001"],
  "contractReview": "Desktop explicitly admits a native account service with stable profile/vault/root scope and one HTTPS origin. Window handles are revocable; detached views do not own accepted work. Core retains command, protected-state and close/drain policy. No renderer scheduler, fallback, default activation or secret-bearing IPC is introduced.",
  "acceptanceReview": "Exact admission1/1 and all6 new native admission/lifetime cases pass, including actual cold Linux child and retained-owner bound/recovery. Full portable check,763Node/746AI/279Rust tests, renderer build, normal/e2e native configurations and architecture/App/evidence/spec lanes pass. Actual Tauri IPC, App observations, OS custody and full Sync remain open.",
  "versions": {
    "coreSource": "8e4bd701113a85ca0de0022188c511947ee2f5b8",
    "jjStoreSource": "87be3ad68530653c6c6fd1e5a2463a217cf3f044",
    "rust": "1.99.0",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "privateArchives": "Unchanged verified public-build prerequisite cohort in immutable E-SYNC-001; npm manifests and registry lock unchanged."
  },
  "files": [
    "src-tauri/src/sync/account.rs",
    "src-tauri/src/sync/mod.rs",
    "src-tauri/tests/sync_account_admission.rs",
    "src-tauri/tests/sync_account_lifetime.rs",
    "src-tauri/tests/support/sync_account/mod.rs",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "scripts/ci-sources.json",
    "spec/src/current/lapis-sync.md",
    "spec/src/current/desktop.md",
    "spec/src/backlog/lapis-sync.md",
    "spec/src/verification/lapis-sync.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-SYNC-003.md",
    "spec/src/current/governance.md"
  ],
  "runs": [
    {
      "name": "Missing native account admission module",
      "command": "pnpm test:rust -- --test sync_account_admission account_windows_share_retained_owner_and_reject_cross_window_handles -- --exact",
      "result": "fail",
      "failures": 1,
      "detail": "Availability probe fails unresolved sync::account; no functional acceptance. Report lapis-desktop-validation-e91d6bec-d716-406b-a65a-b8c8fe173a61. Snapshot ca672174f302692b13b6bbf078a702c79f31f895 independently confirms the module is absent."
    },
    {
      "name": "Exact account admission after implementation",
      "command": "pnpm test:rust -- --test sync_account_admission account_windows_share_retained_owner_and_reject_cross_window_handles -- --exact",
      "result": "pass",
      "failures": 0,
      "detail": "1passed/0failed/0ignored. Report lapis-desktop-validation-113c96fc-b362-4f12-990f-8eb5164c7958."
    },
    {
      "name": "Complete new admission and lifetime families",
      "command": "pnpm test:rust -- --test sync_account_admission --test sync_account_lifetime",
      "result": "pass",
      "failures": 0,
      "detail": "6passed/0failed/0ignored, including actual fresh native Linux process and16-owner bound/recovery. Report lapis-desktop-validation-e0cb3759-7c75-4fee-b16d-d9524be9d3c7."
    },
    {
      "name": "Initial broader check receipt refusal",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Story parity115families/0findings passed; specification validator refused missing remaining metadata in new E-SYNC-003. Corrected metadata key without changing checker policy. Report lapis-desktop-validation-c8ffd59b-e399-40b5-8c5a-9e5421074388."
    },
    {
      "name": "Broader check governance size refusal",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Receipt key repaired; specification validator refused401 physical lines in the edited governance page against400 limit. Kept the scoped Sync/default-gate clarification within the existing400-line page; no limit or validator changed. Report lapis-desktop-validation-ee848769-8eca-4bf7-be41-4b35a20b3b5c."
    },
    {
      "name": "Final exact account admission",
      "command": "pnpm test:rust -- --test sync_account_admission account_windows_share_retained_owner_and_reject_cross_window_handles -- --exact",
      "result": "pass",
      "failures": 0,
      "detail": "1/1 after final admission implementation. Report lapis-desktop-validation-09ea2b3f-ee7a-42d8-b999-c34da18d3500."
    },
    {
      "name": "Complete portable check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Types0errors/0warnings; normal/e2e all-target strictClippy; parity115families/0findings; canonical validation7validators/535chapters/133requirements and formatting pass. Report lapis-desktop-validation-1f675632-b6e2-4806-bd76-366bb7ec7a59."
    },
    {
      "name": "Complete portable test lane",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "763Node/0skips,746AI/152files,279Rust/0failures/2existing subprocess-helper ignores across60native result summaries. New Sync6/6, no skips. Report lapis-desktop-validation-4326cd91-e0d5-4c54-bf5e-d146ad9e9787."
    },
    {
      "name": "Renderer production build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Vite production build passes; existing chunk-size advisory retained without limit changes. Report lapis-desktop-validation-a7c8c0fb-471f-44e6-9644-d3e6aa159c91."
    },
    {
      "name": "Linux e2e native executable linkage",
      "command": "pnpm test:rust -- --features e2e --no-run",
      "result": "pass",
      "failures": 0,
      "detail": "e2e application/fixture/test executables link; this is not OS custody or actual Tauri IPC execution. Report lapis-desktop-validation-afff212b-82fe-48fc-a221-35c5feec2c5d."
    },
    {
      "name": "Architecture boundary audit",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "detail": "Source boundaries pass, zero findings. Report lapis-desktop-validation-875b0d38-582b-4878-aa71-5d3264d979e2."
    },
    {
      "name": "App ownership audit",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "detail": "Source boundaries pass, zero findings. Report lapis-desktop-validation-e393d897-8b51-4c6d-a4c3-b293b7aa1a66."
    },
    {
      "name": "Fresh evidence coverage",
      "command": "pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "477records pass. Report lapis-desktop-validation-4216fd34-451f-4bed-9301-c479e31751b4."
    },
    {
      "name": "Complete canonical specification check",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All4lanes pass: validate, Rustformat, mdBook and spec-first. Existing large-search-index advisory retained. Report lapis-desktop-validation-00f7ec26-91eb-457d-b3d7-3445ad609a99."
    }
  ],
  "remaining": [
    "Tauri command/event and Notes App NativeSync integration are not wired by this source registry slice.",
    "Actual OS Keychain, supported platform and application lifetime gates remain open; explicit RAM test custody is not native custody qualification.",
    "Core/JJ exact sources are reachable private feature inputs; merged source and dependent PR qualification remain distinct.",
    "Full encrypted enrollment, transfer/apply, automatic operation, recovery and independent-device acceptance remain open."
  ],
  "notes": [
    "This slice changes an explicitly constructed native module and native fixtures; it registers no Tauri command or App capability and changes no renderer, catalog story or visible state. No new keyboard, accessibility or actual-window qualification is claimed. Those consumer gates remain required with subsequent UI integration.",
    "The private archive cohort remains explicit and verified, as recorded in E-SYNC-001; no npm manifest/registry-lock change, source alias, fallback or installed-app replacement is introduced.",
    "With local Cargo stopped, eight completed task-owned Server test executables were retired using the Cargo metadata inventory to reclaim2068862384bytes. All sources, fixtures, reports and unrelated outputs remain. Inventory is lapis-server/.local/sync-account-admission-retired-tests.json in the isolated task directory."
  ]
}
```

## Scope and lifetime

The native service is explicitly constructed; default startup and plugin
inventories remain unchanged. Native admission verifies the independent profile
witness and VaultManager/VaultAdmissions scope, shares Core ownership across
windows and replaces opaque handles on every admission. HTTPS normalization
precedes origin comparison. Account discovery is separate from content
enrollment.

View detach fences presentation but retains the original native owner. Only
native lifecycle code can request close; it must retain the transition guard and
returned work through completion. Positive Closed observation alone permits
collection. Failed custody retains the same owner for explicit retry, and
passive watches cannot retain custody. Native session and process integration
still follow this source prerequisite.
