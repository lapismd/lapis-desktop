# Scoped native Sync account custody intake

```json
{
  "id": "E-SYNC-001",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-SYNC-001",
    "LD-SYNC-002",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-008"
  ],
  "contractReview": "Desktop consumes the exact reachable shared native Core account port and keeps OS credential adaptation separate from account policy, endpoint enrollment and content authority. Captured profile scope and strict item-key admission fence custody; unsupported platforms cannot select plaintext or another provider.",
  "acceptanceReview": "The exact missing target and baseline architecture audit are retained. Portable Linux source checks cannot qualify Keychain or Tauri/window lifetime. Sync installation and activation remain disabled; the full backlog and release gates remain open.",
  "versions": {
    "desktopBaseline": "524c3bd7",
    "coreSource": "907e647283a0e3981a2c5aa31e43cde9a92732f1",
    "jjStoreSource": "87be3ad68530653c6c6fd1e5a2463a217cf3f044",
    "rust": "1.99.0",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "privateArchives": [
      {
        "name": "@lapis-notes/app-profile",
        "sourceCommit": "d157d0eaf7be37a5d220d61fbadb7bcf2b35bb9f",
        "sha256": "ffd203f758d40fe382df059f312c9a94383cf08e19bc6bace8a615e9957a416c"
      },
      {
        "name": "@lapismd/ai",
        "sourceCommit": "9a98293c26524c9320acdd9767e34e8ffdd7170c",
        "sha256": "88265a2a818f8411e6d61c91289f1901405cfa3ee7a08adf04a096ccf91a58a2"
      },
      {
        "name": "@lapis-notes/lapis-plugin-tasks",
        "sourceCommit": "52270c2aa7838811604a20be0861cdbd04027b42",
        "sha256": "c7fb6fb1ff4f8f9c86a1890268b8c6fe146c4c7d725e717f475ba50cf6f1b9ee"
      }
    ]
  },
  "files": [
    "scripts/ci-sources.json",
    "scripts/spec-contracts.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/backlog/lapis-sync.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/lapis-sync.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-SYNC-001.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification/lapis-sync.md",
    "spec/src/verification.md",
    "spec-validator.config.mjs",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/src/lib.rs",
    "src-tauri/src/sync/custody.rs",
    "src-tauri/src/sync/mod.rs",
    "src-tauri/tests/sync_custody.rs"
  ],
  "runs": [
    {
      "name": "Missing Sync custody target",
      "command": "node scripts/validation.mjs run test:rust --test sync_custody",
      "result": "fail",
      "failures": 1,
      "detail": "No test target named sync_custody; zero tests collected. Docker report lapis-desktop-validation-3c903b0f-3591-4582-9131-fc9cb6ce0d20."
    },
    {
      "name": "Baseline architecture audit",
      "command": "node scripts/validation.mjs run check:architecture",
      "result": "pass",
      "failures": 0,
      "detail": "Source boundaries pass with zero findings; report lapis-desktop-validation-75d5809d-c362-400c-a028-78b31e75d3a8."
    },
    {
      "name": "Scoped custody target after implementation",
      "command": "node scripts/validation.mjs run test:rust --test sync_custody",
      "result": "pass",
      "failures": 0,
      "detail": "3 passed/0 failed/0 ignored in Linux Docker; report lapis-desktop-validation-bbd4d8f9-494e-4579-98bb-b9bffa380f5c."
    },
    {
      "name": "Initial widened check",
      "command": "pnpm check",
      "result": "fail",
      "failures": 4,
      "detail": "Governance 403 lines, verification 33138 bytes and two unmapped new rows; structural fixes preserve all limits and use the published multi-file verification option."
    },
    {
      "name": "Complete portable Desktop check",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Svelte check 0 errors/0 warnings; spec validation, catalog parity, ordinary and e2e strict Clippy and formatting pass. Report lapis-desktop-validation-c5305b81-05f7-4962-95a0-aaf8453f8f81."
    },
    {
      "name": "Complete portable Desktop tests",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "Node governance/renderer 763/763; AI policy 746/746 across 152 files; Rust 267 passed/0 failed/2 existing non-Sync ignores across 57 target summaries. Report lapis-desktop-validation-f1f6e38a-ad70-4991-b1dc-e627fa8874f6."
    },
    {
      "name": "Portable renderer build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Vite build passes; existing bundle-size advisory retained. Report lapis-desktop-validation-069aaafb-4d47-4980-a409-e5636a9f2b85."
    },
    {
      "name": "Complete specification check",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Validation, Rust format, mdBook and spec-first pass. Report lapis-desktop-validation-99511060-db76-4a91-bb3c-12db2266e4d1."
    },
    {
      "name": "Evidence audit",
      "command": "pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "475 records pass; report lapis-desktop-validation-c03db2b3-63dd-44b2-9bd5-71a8596abd9d."
    },
    {
      "name": "App ownership audit",
      "command": "pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "detail": "Zero findings; report lapis-desktop-validation-7786c290-99be-4965-97ec-0ebd4b1895ef."
    },
    {
      "name": "Final architecture audit",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "detail": "Zero findings; report lapis-desktop-validation-0368d7d1-966d-4522-b09d-075208e506f0."
    },
    {
      "name": "E2e native link build",
      "command": "pnpm test:rust -- --features e2e --no-run",
      "result": "pass",
      "failures": 0,
      "detail": "Linked e2e application, fixture and test executables without executing OS/application acceptance. Report lapis-desktop-validation-afc91b2e-1347-42a5-970d-e79b7c0e7f65."
    }
  ],
  "remaining": [
    "Real macOS Keychain storage, restart and locked/error cases",
    "Shared native worker and profile/window admission",
    "Tauri/OS application lifecycle and installed consumer qualification",
    "Full Sync roadmap, disabled optional activation and release gates"
  ]
}
```

The starting native Core pin was `3b121d21`, while the dependency prose still
named `530a6c42`; this intake aligns the current contract with the actual new
source. All three Core crates and the direct/CI/native-source JJ Store pins
advance together. Cargo also adopts the new source-required redb 4.5.0 floor.
Registry JavaScript manifests and the portable pnpm lockfile remain unchanged.

The verified shared Core feature bookmark was pushed solely to provide a normal
reachable Git dependency; no package, image or deployment was published. Its
owner receipt qualifies 881 native source tests separately from this consumer.

The OS adapter has no Debug or renderer serialization. It validates the Core
item-key domain, captures profile capability/path/physical identity, and
verifies the retained root before access and after successful OS operations.
Only macOS selects Keychain; absence is returned solely for its item-not-found
status. Other errors remain errors and other platforms remain unsupported.

These portable tests do not touch an OS credential entry. Real OS tests must use
isolated task namespaces with cleanup; no user profile or installed application
may be substituted. No view, participant scheduler or Sync plugin activation is
added in this slice.

The two new requirement rows initially followed root verification prose and were
not parsed as a table. The initial check also found governance at 403 lines and
verification at 33,138 bytes. The new rows now live in their own Sync topic
table using the published validator multi-file option; the root retains its
existing rows and a short link. Governance links the native chapter from its
heading. Existing limits and every prior verification/receipt remain intact.

Final portable source gates pass. The two existing Rust ignores are subprocess
helpers (`database_process_helper` and `staging_process_helper`), invoked by
their real restart/interruption parents; no new Sync case is skipped. The
existing Vite chunk-size and mdBook search-index advisories remain visible.
Actual Keychain and native-window qualification remains pending, and this
receipt therefore retains a pending result for its full native boundary.
