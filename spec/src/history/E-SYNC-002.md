# Native Sync profile identity admission

```json
{
  "id": "E-SYNC-002",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SYNC-001"],
  "contractReview": "Native profile admission persists one immutable public UUID outside captured vault content; a profile-level creation witness outside the Sync repository cross-checks the metadata and physical file identities. Missing, foreign or corrupt established state requires recovery rather than reset, including entire Sync-directory loss. Shared Core still owns account and durable Sync policy; no alternate repository or scheduler is installed.",
  "acceptanceReview": "All six native profile scenarios pass after the two exact identity-reset regressions were reproduced0/1 and repaired1/1. Complete final Rust tests and both normal/e2e Clippy/build configurations pass. Earlier763Node/746AI/type/renderer checks are supporting evidence from unchanged TS inputs, before Rust-only hardening. Actual OS custody, Tauri/window lifetime and full Sync remain open.",
  "versions": {
    "coreSource": "907e647283a0e3981a2c5aa31e43cde9a92732f1",
    "rust": "1.99.0",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "privateArchives": "Unchanged verified prerequisite cohort and checksums recorded in immutable E-SYNC-001; manifests/registry lock unchanged."
  },
  "files": [
    "src-tauri/src/sync/mod.rs",
    "src-tauri/src/sync/profile.rs",
    "src-tauri/tests/sync_profile.rs",
    "spec/src/current/lapis-sync.md",
    "spec/src/history/E-SYNC-002.md",
    "spec/src/verification/lapis-sync.md",
    "spec/src/navigation/history-02.md",
    "spec/src/current/desktop.md"
  ],
  "runs": [
    {
      "name": "Missing native profile module",
      "command": "node scripts/validation.mjs run test:rust --test sync_profile",
      "result": "fail",
      "failures": 1,
      "detail": "Availability probe failed compilation with unresolved sync::profile; no functional cases qualified. Report lapis-desktop-validation-beafc4af-9bcf-45ea-a242-789cab54ebe2."
    },
    {
      "name": "Native profile identity and cold process",
      "command": "node scripts/validation.mjs run test:rust --test sync_profile",
      "result": "pass",
      "failures": 0,
      "detail": "4 passed, zero failures/skips, actual fresh native Linux child. Report lapis-desktop-validation-7f3a6440-2217-4945-b2af-5414f560fe2a."
    },
    {
      "name": "Initial broader check navigation refusal",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Parity115families/0findings; canonical checker refused missing SUMMARY navigation for new receipt. Added one entry without generating unrelated navigation. Report lapis-desktop-validation-00866400-74f9-41c2-baeb-04acad0acd36."
    },
    {
      "name": "Broader portable check after navigation repair",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Initial iteration before the UUID/witness hardening below; Types0errors/0warnings, normal/e2e strictClippy, parity115families/0findings, specvalidate andformat. Report lapis-desktop-validation-6f848a4c-a1f4-4a79-8e84-3c569009a7b4."
    },
    {
      "name": "Complete portable test lane",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "Initial iteration before the UUID/witness hardening below; 763Node,746AIpolicy/152files,271Rust/58summaries; zero failures,2existing subprocess helper ignores. Report lapis-desktop-validation-09f2ab5c-85ea-4ca2-83fa-07a32250dbd1."
    },
    {
      "name": "Renderer build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Initial iteration before the UUID/witness hardening below; Vitebuildpasses; existingchunk-size advisory retained, no limit changed. Report lapis-desktop-validation-bd16a00c-c883-469a-9ee3-4fadd7c915c6."
    },
    {
      "name": "Initial full specification check",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Validate/Rustformat/mdBook passed; spec-first required mapped desktop.md update in addition to Sync topic. Added profile-identity/recovery statement without changing mapping. Report lapis-desktop-validation-6737983a-7c8b-41ea-8a39-262892781966."
    },
    {
      "name": "Valid UUID corruption before repair",
      "command": "node scripts/validation.mjs run test:rust --test sync_profile valid_uuid_mutation_cannot_reset_identity_on_cold_admission -- --exact",
      "result": "fail",
      "failures": 1,
      "detail": "0passed/1failed: a cold reopen accepted a replacement UUID in otherwise valid metadata; retained instance refused. Report lapis-desktop-validation-776a4120-2a7b-42e1-8cba-226738045ff5."
    },
    {
      "name": "Valid UUID corruption after independent witness",
      "command": "node scripts/validation.mjs run test:rust --test sync_profile valid_uuid_mutation_cannot_reset_identity_on_cold_admission -- --exact",
      "result": "pass",
      "failures": 0,
      "detail": "1/1 after cross-checking immutable identity witness and physical file identity; no reset. Report lapis-desktop-validation-d7ff9881-0af1-47dd-8fc0-5c371856ea25."
    },
    {
      "name": "Sync-directory loss before witness relocation",
      "command": "node scripts/validation.mjs run test:rust --test sync_profile sync_directory_loss_cannot_allocate_another_profile_identity -- --exact",
      "result": "fail",
      "failures": 1,
      "detail": "0/1: keeping both markers within Sync allowed a new UUID after whole-directory loss. Report lapis-desktop-validation-564d513c-7d8b-44cd-8847-f29b1bcc7cd5."
    },
    {
      "name": "Sync-directory loss after profile-level witness",
      "command": "node scripts/validation.mjs run test:rust --test sync_profile sync_directory_loss_cannot_allocate_another_profile_identity -- --exact",
      "result": "pass",
      "failures": 0,
      "detail": "1/1: surviving profile-level witness refuses directory recreation or another UUID. Report lapis-desktop-validation-5ab0529b-50de-4202-9765-54caa9777dc3."
    },
    {
      "name": "Final profile family",
      "command": "node scripts/validation.mjs run test:rust --test sync_profile",
      "result": "pass",
      "failures": 0,
      "detail": "6/6, zero skips, including cold process, UUID corruption and whole Sync-directory loss. Report lapis-desktop-validation-e0fc541e-43ad-4931-a9bd-66476b3d3c89."
    },
    {
      "name": "Final complete native crate",
      "command": "pnpm test:rust",
      "result": "pass",
      "failures": 0,
      "detail": "273passed/0failed/2existing subprocess helper ignores across58summaries. Report lapis-desktop-validation-7eb0aab5-6857-4c84-9754-cbd65f20701d."
    },
    {
      "name": "Final normal strict Clippy",
      "command": "pnpm check:rust",
      "result": "pass",
      "failures": 0,
      "detail": "All targets pass with warnings denied. Report lapis-desktop-validation-c5967802-f6b7-489f-86f1-f9e8488c3e19."
    },
    {
      "name": "Final e2e strict Clippy",
      "command": "pnpm check:rust:e2e",
      "result": "pass",
      "failures": 0,
      "detail": "All e2e targets pass with warnings denied. Report lapis-desktop-validation-6925bde7-a194-44b7-908b-13b4e0ef5599."
    },
    {
      "name": "Final e2e executable linkage",
      "command": "pnpm test:rust --features e2e --no-run",
      "result": "pass",
      "failures": 0,
      "detail": "Linux application/fixture/test executables link; build only, not actual WebView or OS execution. Report lapis-desktop-validation-d4f235ba-bdcc-4fd2-8767-a8e63d40f61f."
    },
    {
      "name": "Native architecture audit",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "detail": "Zero source-boundary findings. Report lapis-desktop-validation-1d2d3dc4-5a36-4a22-b0d8-77b211f84f43."
    },
    {
      "name": "App ownership audit",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "detail": "Zero App ownership findings. Report lapis-desktop-validation-9ab69f1f-9271-4b06-ba74-bd21cf587e18."
    },
    {
      "name": "Evidence integrity",
      "command": "pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "476records pass. Report lapis-desktop-validation-3a73e7ec-42a0-4cca-9613-fd5d6d65498a."
    },
    {
      "name": "Final full specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All4lanes pass: validation, Rustformat, mdBook, spec-first. Report lapis-desktop-validation-67515cbc-5722-4147-94ee-20b4a7e794d0."
    }
  ],
  "remaining": [
    "Native account admission registry, Tauri commands and App observations.",
    "Actual OS custody and native application lifecycle qualification.",
    "Complete enrollment, encrypted transfer/apply, automatic/offline operation, recovery and independent-device Sync qualification."
  ],
  "notes": [
    "No credentials, user profiles, installed applications or visual baselines are touched. No default profile setup or optional Sync activation is introduced.",
    "Review added nonblocking/no-follow opens for raced metadata type changes and a real FIFO refusal case; precise raced replacement injection is not claimed. Initial UUID corruption was reproduced before repair. Wider native lanes are rerun after hardening; initial source iterations remain evidence, not final application qualification.",
    "The immutable UUID witness is .lapis-sync-profile.identity at the profile root (16public bytes), outside the Sync repository; version1 metadata binds physical profile, Sync and witness-file identities. Either surviving marker prevents silent creation after loss. Partial first creation requires recovery. Existing real filesystem tests include cold child, foreign/corrupt metadata, replaced roots, symlinks and FIFO refusal."
  ]
}
```
