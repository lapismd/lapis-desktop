# Relocate frozen private archive hooks

```json
{
  "id": "E-SYNC-014",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CI-002", "LD-GOV-003", "LD-GOV-006", "LD-GOV-008"],
  "contractReview": "Generate checkout-independent CI archive hooks while preserving frozen locks, exact admitted tarballs, public range/peer identity and source/hash/provenance checks. Resolve paths from the hook location at runtime; do not relax checksum/frozen-install admission or use source links in portable artifact mode.",
  "acceptanceReview": "PR39 roles repair allows static/audit reuse; container Quality/Unit then stop before product suites at pnpmfileChecksum mismatch between host and container checkout roots. Reproduce the actual frozen offline install after relocation and producer deletion; verify one direct/transitive runtime API identity and unchanged lock bytes.",
  "versions": {
    "foundation": "bb02e8ea6749514b00f95f2cf423455f2b2fe0b4",
    "scopeLocalMerge": "4d0ce22c",
    "hostedRun": "43818368072"
  },
  "files": [
    "scripts/archive-hook.mjs",
    "scripts/ci-install.mjs",
    "tests/governance/archive-hook-relocation.test.mjs",
    "spec/src/current/ci.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/governance.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-SYNC-014.md",
    "spec/src/verification.md"
  ],
  "runs": [
    {
      "name": "Hosted frozen private projection relocation refuses mismatched hook checksum",
      "command": "PR39 run43818368072 Quality133136903420 and Unit133136903415",
      "result": "fail",
      "failures": 2,
      "detail": "Both jobs stop at ERR_PNPM_LOCKFILE_CONFIG_MISMATCH before product tests. Producer checkout/home/runner differs from container/__w; generated hook embeds absolute archive and semver-tool paths, changing pnpmfileChecksum. Static/audit on matching host roots pass. Keep frozen verification and fix owning generator/consumer."
    },
    {
      "name": "Exact offline frozen relocation before repair",
      "command": "pnpm validation -- run validation:check -- tests/governance/archive-hook-relocation.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Report40df456d-b9e3-4943-b0f5-59e16e7fc3b9:real producer install succeeds; copied consumer omits root node_modules, regenerates its hook, deletes producer and fails frozen install with the same checksum error. Source fixture includes direct/transitive/peer API consumers and a task-owned offline store. No registry request, user profile or lockfile waiver."
    },
    {
      "name": "Stable hook checksum exposes absolute root importer specifiers",
      "command": "pnpm validation -- run validation:check -- tests/governance/archive-hook-relocation.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Report73687c51-dd25-445e-8f5f-0a6fbd8ce5b6:96pass/1fail of97. Hook checksum now matches, but frozen install correctly rejects root importer specifiers containing producer absolute paths instead of consumer paths. Preserve admitted relative declarations only for known local root projects; transitive and peer consumers still receive the same verified runtime absolute target. Keep actual frozen install, producer deletion, unchanged-lock and one-API assertions."
    },
    {
      "name": "Exact relocated frozen install and shared API identity after repair",
      "command": "pnpm validation -- run validation:check -- tests/governance/archive-hook-relocation.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Report8208ebf6-c164-4662-a837-8f193b139d8a:97pass/0fail/0skipped. Producer creates its lock, consumer regenerates hook at a deeper checkout, producer is deleted, and actual offline frozen install succeeds with identical lock bytes. Direct and transitive/peer consumers resolve the same API object and physical module. Add exact hook-byte equality and malformed-root/local-link refusal assertions before complete shared-helper qualification."
    },
    {
      "name": "Complete affected archive helper and private artifact family",
      "command": "pnpm validation -- run validation:check -- tests/governance/archive-hook-relocation.test.mjs tests/governance/validation-archive-cohort.test.mjs tests/governance/archive-development-dependencies.test.mjs tests/governance/local-archives.test.mjs tests/governance/ci-artifacts.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Reportf7d061d4-b48b-469a-ade7-8e5c39622f85:113pass/0fail/0skipped. Exact generated hook bytes and frozen lock remain identical after real relocation/deleted producer; direct/transitive API identity remains one. Implicit roots, relative/unadmitted inputs and local source links refuse in portable mode. Existing dependency/optional/peer/dev ranges, mixed/duplicate contexts, local development workflow and artifact role/provenance/hash checks retain their assertions."
    },
    {
      "name": "Complete portable CI hook source qualification",
      "command": "pnpm check; pnpm test; pnpm build; pnpm spec:check; pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Reports366c340c-1b72-4da4-9321-8087796e847c(check),d8738471-e4ee-4b7e-b3d1-78831ccf5957(test),2dd3060e-80a8-4064-8519-de390b7f99cb(build),830d65e2-0fdc-40ba-870a-88d250822d13(spec),13180e6d-6f30-496c-b870-bfc946503c28(static):all pass.789Node,746AIpolicy,281Rust;two existing invoked helper ignores. Runtime/renderer/Cargo/npm inputs remain unchanged; E009 retains2168source-equivalent catalog cases. Fresh hosted matrix must prove the actual host-to-container artifact path. Final documentation links qualification to E011 without changing committed receipts."
    }
  ],
  "remaining": [
    "Final documentation validation, update parent/dependent source PRs, verify actual hosted host-to-container frozen reuse and merge green source layers.",
    "Full encryptedSync and native account/OS/platform/release gates remain separately open."
  ]
}
```

Related artifact-role qualification: [E-SYNC-011](E-SYNC-011.md).
