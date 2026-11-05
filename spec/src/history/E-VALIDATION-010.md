# Reachable portable sources and one private projection

```json
{
  "id": "E-VALIDATION-010",
  "date": "2026-11-05",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-003", "LD-GOV-006", "LD-CI-002"],
  "files": [
    "scripts/validation/native-sources.json",
    "scripts/validation/model.mjs",
    "scripts/validation/worker.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-VALIDATION-010.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/governance/validation-native.test.mjs"
  ],
  "contractReview": "Portable validation restores Notes, AI, JJ Store and Plugins from the same exact commits that hosted private-package preparation uses: e99baa742483ace8177b22fbdec3eed11867eedc, 9a98293c26524c9320acdd9767e34e8ffdd7170c, 7a98bd89d2bc77fb6ec41f91186992abb19ba161 and 879581d1549187bdbac2d75b40d02e0df46e721a. Their former validation-only identities are unavailable from GitHub and clean local source stores, so a fresh source packet could not export them. The private archive projection now replaces each existing root declaration rather than adding a second devDependency context. This repairs provenance and graph identity without fallback: commits remain exact, source/archive bytes remain hashed, tracked manifests/locks are restored, and absent, undeclared or mismatched inputs still fail closed.",
  "acceptanceReview": "The default Docker-first specification lane reproduced the missing Notes revision before this edit and then exposed the missing AI identity after the first narrow repair. A complete inventory audit found the JJ Store and Plugins identities absent as well; the other four validation pins remain reachable and unchanged. Every replacement already backs successful current hosted preparation and is reachable from its owning canonical history. The widened Docker check then reproduced 29 type failures from two API 0.2.3 peer contexts, proving the worker projection differed from hosted preparation. The corrected projection passed fresh portable and direct-host specification, check and complete test lanes. A complete hosted workflow on the exact candidate remains required before this record can pass.",
  "runs": [
    {
      "name": "Fresh portable source packet rejected the abandoned Notes identity",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "exportNativeSources stopped before validation because cd997c2cf92ecfa1ce16de1f49ec085d58d026d5 did not exist. After its narrow replacement, the same command stopped on missing AI 6548afe0f47c6fa2ff71d326a5f6e8ce4ebbebd8. The complete inventory also found JJ Store 4e74e423966180576da89229e02da49dcd014dfd and Plugins 5e0dffc3eb29efed5508c4914acca6b6bba0027f absent. GitHub returned 404/422 and clean local stores rejected them. No host fallback ran."
    },
    {
      "name": "Shared source identity regression",
      "command": "node --test tests/governance/validation-native.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "9/9 pass. Every hosted/portable overlap is an exact 40-character identity and both inventories match; committed-byte export, transfer checksum and traversal rejection remain covered. Archive projection replaces the declared root dependency without creating a second dev or peer context and rejects undeclared inputs."
    },
    {
      "name": "Docker-first specification packet with exact private archives",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<exact-archive-manifest> pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "A fresh Node 24.15.0/pnpm 10.34.5 source preparation rebuilt App Profile 0.0.0 (sha256 a72d1592...) and AI 0.2.0 (sha256 071f885c...) from the exact pins. The container exported and verified all eight native source archives, performed a frozen private projection and passed validation, Rust formatting, mdBook and spec-first without host fallback."
    },
    {
      "name": "Widened Docker-first check rejected a duplicate private peer context",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<exact-archive-manifest> pnpm check",
      "result": "fail",
      "failures": 29,
      "detail": "The first widened run installed API 0.2.3 under both the root and App Profile contexts because validation added archives as devDependencies and overrides rather than replacing the declared root dependencies. Svelte reported 29 errors across 21 files. No assertion or dependency range was weakened."
    },
    {
      "name": "Corrected Docker-first check and complete tests",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=<exact-archive-manifest> pnpm check && LAPIS_DESKTOP_VALIDATION_ARCHIVES=<exact-archive-manifest> pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "The clean projected graph passed 114 Storybook families, all 459 specification chapters, zero Svelte errors or warnings, normal and e2e Rust checks, formatting, 719 governance/renderer tests, 746 AI tests and the complete Rust suite. Two Rust subprocess-helper tests remained intentionally ignored by their original harnesses."
    },
    {
      "name": "Direct host check and complete tests",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check && LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "The same checkout passed directly on the local machine rather than through Docker: 114 Storybook families, all 459 specification chapters, zero Svelte errors or warnings, both Rust check targets, formatting, 719 governance/renderer tests, 746 AI tests and the complete Rust suite."
    }
  ],
  "versions": {
    "notes": "e99baa742483ace8177b22fbdec3eed11867eedc",
    "lapisAi": "9a98293c26524c9320acdd9767e34e8ffdd7170c",
    "jjStore": "7a98bd89d2bc77fb6ec41f91186992abb19ba161",
    "plugins": "879581d1549187bdbac2d75b40d02e0df46e721a",
    "node": "24.15.0",
    "pnpm": "10.34.5"
  },
  "remaining": [
    "Obtain a complete hosted workflow pass on the exact Desktop candidate."
  ]
}
```
