# Qualified Notes target-mode input alignment

```json
{
  "id": "E-CORE-026",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M10.2"],
  "requirements": ["LD-GOV-006", "LD-GOV-010", "LD-AI-002"],
  "contractReview": "Advance only the committed native Notes source pin to the source owning the qualified default-mode DTO and its matching API/application-profile archives. The E-CORE-025 trusted prepared-runner policy and explicit TurnInput overrides remain unchanged.",
  "milestoneReview": "Bounded source/pin alignment only. M10.2 and Notes R2.3 retain actual application/provider, retained-screen, detach and cold-recovery gates. Broad UI dependency admission and cross-platform product acceptance remain separate.",
  "versions": {
    "desktopParent": "65b859367a9e76c13802f80bb19c6125dbc9aafd",
    "nativeSnapshot": "4c91f6cb50304b9f78f9dae79ee776052a5183d8",
    "notesPrevious": "69f82c9b14e9f2b3de278a38c6db03a8b03ab461",
    "notesSource": "f0cf7b1abb370ea50595c3355763d9bf5abea9fe",
    "notesNativeArchiveSha256": "35792eebbdc6288c31d888666c8a826ca5c02fb11a9bcbaf2c0ce2002f7265a6",
    "notesPackSnapshot": "d6ba8473086d9ab18bb5ce6baafd98843fd0ad96",
    "apiArchiveSha256": "119e55457bde59f38c6db14690ccf0fdf5ccc118d1cb9fe7fedc3ff48e05a0a3",
    "appProfileArchiveSha256": "6639a69c5af9f036d7a85d5935aa9d3d29061bae418bfdc2b130bed45cf0e543",
    "archiveInventorySha256": "72ae5b97dbf6c19e3cc99666d2f24e34416ca70eb9ccf038c65abb514d143364",
    "image": "sha256:da3863d93645476fd6ceb2240fa371d73880175b352c31e188ce027df1bcaee6",
    "nativeCacheKey": "bf69f6f450bf83085171",
    "node": "v24.15.0",
    "pnpm": "10.34.5",
    "jj": "jj 0.45.1-7c41cdeb16b6b321c64e789a966b6adf723816a5",
    "git": "git version 2.39.5",
    "mdbook": "mdbook v0.5.4",
    "rustc": "rustc 1.99.0 (b940084d7 2026-09-28)",
    "cargo": "cargo 1.99.0 (5f94df478 2026-08-27)"
  },
  "runs": [
    {
      "name": "native-source-equality",
      "command": "jj diff --from 69f82c9b14e9f2b3de278a38c6db03a8b03ab461 --to f0cf7b1abb370ea50595c3355763d9bf5abea9fe --stat -- crates",
      "result": "pass",
      "failures": 0,
      "note": "Zero native crate files changed. The new pin matches the qualified TypeScript DTO/public package source. E-CORE-025 source/native results retain their original revision identities. No cache is migrated across native pin keys."
    },
    {
      "name": "native-mode-input-after",
      "command": "pnpm test:rust -- --bin lapis-desktop host::ai::policy::native_turns::tests -- --nocapture",
      "result": "pass",
      "note": "a9663141-efaa-4af2-a4cf-8e2e379ba357: fresh exact committed-source worker/native cache passes all three native policy cases, 47 name-filtered and none ignored. Locked Cargo graph unchanged. Compilation took 2m29s. No Mac application build or UI qualification is claimed.",
      "tests": 3,
      "failures": 0,
      "filtered": 47
    },
    {
      "name": "validation-contracts",
      "command": "pnpm validation:check",
      "result": "pass",
      "tests": 77,
      "failures": 0,
      "note": "08d92bf2-40fa-49f0-95bf-a0fc0d652358: complete runner/guard contracts pass, zero skips."
    },
    {
      "name": "specification-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "7ddd8f44-5e15-43cb-a8e6-cc09a7f3c0fb: new governance cross-reference made the chapter401lines; this fresh pending evidence used gaps instead of required remaining. Shorten only the new prose and fix this fresh record key; validators unchanged."
    },
    {
      "name": "specification-stale-prose-attempt",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "dede31c0-b024-4c86-83f7-18c0246229e0: the new prose replacement did not match its formatted paragraph, so this frozen snapshot still contained401lines. The working source is now399lines; no validator or contract limit changed."
    },
    {
      "name": "specification-after",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "ca94ab74-68a8-4f91-932c-cd0ad16c3dc2: all four lanes pass: canonical validation, Rust formatting, mdBook and mapped spec-first."
    },
    {
      "name": "progress-after",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "68e358a3-10b5-4add-b963-eb366312f164:51tasks/298evidence records; bookkeeping only."
    },
    {
      "name": "formatting-existing-exception",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 1,
      "note": "e340747c-c244-48c6-bfa1-882bba25e5c8: only unchanged committed E-AI-109 fails Prettier; SHA25616e50704e76ed720fdf280a28167714c23079fd13facd803580ca0aced74e93a equals the parent. Prior explicit user acceptance remains applicable. Changed-file formatting passes separately; Rust formatting passes in spec:check."
    }
  ],
  "files": [
    "scripts/validation/native-sources.json",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/verification.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-CORE-026.md",
    "MIGRATION.md"
  ],
  "remaining": [
    "Broad final UI dependency cohort intake remains separate; provisional Agent UI/Repository UI dependencies in this native-only install are not admitted by this receipt.",
    "The install reports API's exact Svelte 5.56.10 peer against Desktop's 5.57.2. Do not interpret this native policy run as resolving that UI admission mismatch.",
    "Actual-provider retained native Desktop screen and remaining application/platform acceptance are not replaced by service tests.",
    "Renderer AI/Node serving remain defaults; distribution and visual approval remain deferred."
  ]
}
```
