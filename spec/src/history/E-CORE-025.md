# Trusted native target default modes

```json
{
  "id": "E-CORE-025",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M10.2"],
  "requirements": ["LD-GOV-006", "LD-AI-001", "LD-AI-002"],
  "contractReview": "Resolve native target modes only from Ready.launch and sealed JJ_ACP_RUNNER metadata: Codex read-only, OpenCode plan, other admitted runners ask. Missing or blank metadata refuses. No saved configuration mode, target-name inference or explicit TurnInput override changes.",
  "milestoneReview": "Native source intake only. M10.2 and Notes R2.3 retain actual application/provider, detach and cold recovery gates; Linux service checks cannot qualify macOS applications or hosted provider acceptance.",
  "versions": {
    "desktopParent": "881e99b683154974b030dd50b8b515044ca5cfee",
    "afterSource": "0e570ba6d47bdd54ca79636264ace225f1099881",
    "notesCore": "69f82c9b14e9f2b3de278a38c6db03a8b03ab461",
    "tasks": "569d7e30ed86bd4514365e50befb908b2a8400e2",
    "image": "sha256:da3863d93645476fd6ceb2240fa371d73880175b352c31e188ce027df1bcaee6",
    "node": "v24.15.0",
    "pnpm": "10.34.5",
    "jj": "jj 0.45.1-7c41cdeb16b6b321c64e789a966b6adf723816a5",
    "git": "git version 2.39.5",
    "mdbook": "mdbook v0.5.4",
    "rustc": "rustc 1.99.0 (b940084d7 2026-09-28)",
    "cargo": "cargo 1.99.0 (5f94df478 2026-08-27)",
    "archiveManifestSha256": "934f8e8527f61cddd830eea4e282616a49b988b77e5321d2fcfd3e9ff7e896d0",
    "formattedParent": "85ecfe1c2e3ae15c8cfe04411f8ef9d6a98e1ce6",
    "nativeTurnPolicySha256": "d5a4619b25087c063d46967e05becb5b7261d7567f793827b7c874516297f962"
  },
  "runs": [
    {
      "name": "argument-preflight",
      "command": "pnpm test:rust -- --bin lapis-desktop host::ai::policy::native_turns::tests --nocapture",
      "result": "fail",
      "failures": 1,
      "note": "26ac5544: Cargo requires its own argument separator before nocapture. No compilation or tests executed; corrected the invocation without changing product code."
    },
    {
      "name": "locked-graph-before",
      "command": "pnpm test:rust -- --bin lapis-desktop host::ai::policy::native_turns::tests -- --nocapture",
      "result": "fail",
      "failures": 1,
      "note": "57e9c2c8: --locked refused the newly pinned Core Tasks path dependency; no tests executed. Added only lapis-app-core -> lapis-task-services and its regex/serde/serde_yaml path-package entry; no registry dependency version or checksum changed."
    },
    {
      "name": "native-mode-before",
      "command": "pnpm test:rust -- --bin lapis-desktop host::ai::policy::native_turns::tests -- --nocapture",
      "result": "fail",
      "failures": 1,
      "note": "721fe640: exactly one E0063 missing default_mode in the native TurnTarget initializer, before the implementation change; no tests executed."
    },
    {
      "name": "native-mode-after",
      "command": "pnpm test:rust -- --bin lapis-desktop host::ai::policy::native_turns::tests -- --nocapture",
      "result": "pass",
      "tests": 3,
      "failures": 0,
      "note": "7e862304: exact native policy target passes all three tests with zero ignored cases. Installed client defaults, launch scope/environment, unknown target refusal, all trusted runner variants and missing/blank metadata are covered."
    },
    {
      "name": "native-full",
      "command": "pnpm test:rust",
      "result": "pass",
      "tests": 240,
      "failures": 0,
      "note": "6ed90684: all 240 native Rust cases pass across 50 target summaries. The two retained ignored entries are subprocess helpers exercised by their parent tests; no new case is skipped."
    },
    {
      "name": "check-document-limit-before",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "001bc1c5: 108 story composition families pass, then Desktop chapter is 32,815 bytes, 47 above its existing bound. Shorten only the new native-target cross-reference; keep the validator and requirement unchanged."
    },
    {
      "name": "source-checks-and-format-before",
      "command": "pnpm check",
      "result": "fail",
      "failures": 4,
      "note": "931eae5b: all 108 composition families, six specification validators (339 chapters, 108 requirements), Svelte/types (zero errors/warnings), strict normal and e2e all-target Clippy pass. Formatting reports inherited MIGRATION.md, immutable E-AI-109.md, inherited fresh E-CORE-024.md and this fresh E-CORE-025.md. This record was formatted after the immutable run snapshot; root owns formatting its two mutable parent outputs. E-AI-109 retains prior explicit acceptance."
    },
    {
      "name": "specification-check",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "bb57dea4: all four lanes pass: validate, Rust formatting, mdBook and mapped spec-first."
    },
    {
      "name": "validation-contracts",
      "command": "pnpm validation:check",
      "result": "pass",
      "tests": 77,
      "failures": 0,
      "note": "b94a2c42: all 77 complete validation/guard contracts pass with zero skips, including committed native-source export, exact transfer checks, source-key invalidation, workspace/lease isolation, source composition and runtime diagnostic guards."
    },
    {
      "name": "format-after",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 1,
      "note": "711859e8: only the previously accepted immutable E-AI-109.md remains; all fresh/owned outputs pass. Its SHA-256 is 16e50704e76ed720fdf280a28167714c23079fd13facd803580ca0aced74e93a, byte-identical to both the parent and qualified 5f165fc9 baseline. Inherited MIGRATION.md/E-CORE-024 were formatted by their default-workspace owner; child refreshed onto that parent. No historical evidence or formatter is changed."
    },
    {
      "name": "generated-progress",
      "command": "pnpm progress:generate && pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "e255f3d4: generated/formatted MIGRATION.md agrees with all 51 task rows and 297 evidence records. UTC ledger time refreshed and E-CORE-025 selected without changing the M10.2 gate/status. Parent current activity is preserved."
    },
    {
      "name": "final-generated-specification-check",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "b06845eb: after the parent formatting refresh, final ledger/evidence selection and MIGRATION generation, all four lanes pass again: validate, Rust formatting, mdBook and mapped spec-first. Source integration and original native/provider gates remain open."
    }
  ],
  "files": [
    "src-tauri/src/host/ai/policy/native_turns.rs",
    "src-tauri/Cargo.lock",
    "scripts/validation/native-sources.json",
    "spec/src/current/ai-adapter.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-CORE-025.md",
    "docs/validation.md",
    "spec/src/current/progress/milestones.md",
    "MIGRATION.md"
  ],
  "remaining": [
    "Integrate only after the Notes default-mode DTO and matching qualified API/application-profile archives reach the default workspace; current Notes main still has the older DTO.",
    "Retained application and actual macOS/provider acceptance against the combined qualified public dependency cohort remain separate.",
    "Hosted actual-provider detach and cold recovery remain Notes R2.3; renderer AI and Node serving remain defaults."
  ]
}
```

The private helper receives only a prepared native Launch, so renderer IDs and
labels cannot select policy. Ready.launch admits each target and supplies the
sealed runner; opaque local profiles retain the local runner and ask default.
Explicit turn options still pass the existing native negotiation unchanged.

The isolated workspace recovered only the three root-owned preparation files
from saved divergent head `dabcb60e`; both original heads and an ignored receipt
remain preserved. The source and archive inventories are exact committed inputs;
no dirty sibling source or user profile enters Docker.

Source qualification passes. The task retains its original application/provider
acceptance gaps; selecting this record does not complete M10.2 or Notes R2.3.
