# Prepare original signed AI preservation acceptance

```json
{
  "id": "E-RETIRE-009",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "desktopParents": [
      "6e5c7ee9740381bd2368050b69fdc2dba8c939ae",
      "5006a7cffe2f8d816bd822e1cc1a882e88a357be"
    ],
    "notesSource": "5ffb33c152404b6880debd1b5fd70762121d6196",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "hostNode": "26.9.0"
  },
  "requirements": ["LD-PLUG-001", "LD-AI-002", "LD-DESK-004"],
  "files": [
    "tests/desktop/ai-notes-binding.test.mjs",
    "tests/desktop/ai-retirement-fixture.mjs",
    "tests/desktop/historical-ai-files.mjs",
    "spec/src/current/ai.md",
    "spec/src/current/plugins.md",
    "spec/src/current/desktop.md",
    "spec/src/backlog/ai-qualification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "spec/src/history/E-RETIRE-009.md"
  ],
  "contractReview": "Add original-archive Desktop preservation coverage under existing bundled precedence, disabled preferences and Safe Mode contracts. Preserve every core API/service/function and future Language Service input. No production implementation, public interface, runtime default, source pin, installer policy or installed user profile changes. Merge the previously qualified private preparation repair; never rewrite E-RETIRE-004/005.",
  "acceptanceReview": "E-RETIRE-004 used a synthetic throwing module to detect unintended external evaluation. Retain that assertion only for the synthetic trap. Add the unchanged original signed archive as a second fixture kind, preserving all178original files and legacy settings/transcript/memory bytes in disposable vaults. The owner verifier authenticates registry/release signatures and177signed file hashes. The helper admits only its exact pinned full-archive hash and size, validates the extracted member set/content and refuses missing/tampered input before any vault writes. Seed existing state; no current installer exception or new-install permission is inferred. Actual native startup remains unexecuted.",
  "artifact": {
    "schema": 1,
    "archive": {
      "url": "https://github.com/lapismd/lapis-plugins/releases/download/ai%400.1.16/ai-0.1.16.lapis-plugin",
      "size": 5035388,
      "sha256": "09f0436532ddc5a556d0563877b02856ac5d0abc309f515c9718e24415260a6a"
    },
    "pluginId": "ai",
    "version": "0.1.16",
    "source": {
      "commit": "993e53456bf5044bc73c515cf98dc2424625e6c7",
      "package": "@lapis-notes/ai"
    },
    "registryStatus": "disabled",
    "registrySignaturesVerified": 1,
    "releaseKeyId": "lapis-plugin-release-2026-06",
    "releaseSignatureVerified": true,
    "exactFileHashesVerified": 177,
    "extractedFiles": 178
  },
  "runs": [
    {
      "name": "Original historical asset identity",
      "command": "Read-only curl of preserved GitHub release asset followed by SHA256/size comparison against signed registry metadata",
      "result": "pass",
      "failures": 0,
      "detail": "Original5,035,388bytes; SHA25609f0436532ddc5a556d0563877b02856ac5d0abc309f515c9718e24415260a6a. No npm install or bundle execution."
    },
    {
      "name": "Owning signature and complete bundle verifier",
      "command": "Plugins96935625 verifyPluginBundle plus canonical signed registry verification in retained omarchy fixture worker",
      "result": "pass",
      "failures": 0,
      "detail": "Original release key lapis-plugin-release-2026-06; registry key lapis-registry-2026-06. Both signatures pass;177signed sizes/hashes/exact paths and runtime metadata pass;178original archive files retained in ignored cache. Registry status remains disabled."
    },
    {
      "name": "Fixture source before",
      "command": "node .local/validation/retired-ai-original/fixture-regression.mjs",
      "result": "fail",
      "failures": 5,
      "detail": "3existing synthetic preparations pass;3historical requests still seed synthetic files; tampered/missing historical inputs are incorrectly ignored."
    },
    {
      "name": "Fixture source after",
      "command": "node .local/validation/retired-ai-original/fixture-regression.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "8pass:3synthetic,3original-archive preference variants, same-size altered bytes and missing-input rejection before writes. Original bytes checked against all178files. Source/fixture preparation only, no App/native startup."
    },
    {
      "name": "Native fixture syntax",
      "command": "node --check tests/desktop/ai-notes-binding.test.mjs; node --check tests/desktop/ai-retirement-fixture.mjs; node --check tests/desktop/historical-ai-files.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Syntax only; source helper reads bytes without importing/evaluating original code."
    },
    {
      "name": "Actual native historical/synthetic matrix",
      "command": "LAPIS_DESKTOP_AI_OWNER=renderer LAPIS_DESKTOP_RETIRED_AI_ARCHIVE=<verified ignored archive> LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- headed --family services",
      "result": "pending",
      "failures": 0,
      "detail": "Ten cases prepared in existing inventoried file:2baseline plus4synthetic and4historical variants. No native case executed in this slice; separate explicit on-demand decision required. No provider prompt/replay intended."
    },
    {
      "name": "Pinned Docker fixture replay",
      "command": "Node fixture-regression.mjs in omarchy with tracked helper byte hashes and original checksum-pinned input",
      "result": "pass",
      "failures": 0,
      "detail": "Node24.15.0:8pass/0fail, including all178original files,3preference variants and missing/same-size-tamper refusal. Test helper bytes only; original code never evaluated and no native App started."
    },
    {
      "name": "Complete owning Desktop qualification",
      "command": "node scripts/validation.mjs run check:all",
      "result": "pass",
      "failures": 0,
      "detail": "8dbbac50-0f96-4090-ac2f-8b14758f0d87: 801 governance/renderer tests, 748 AI tests across153files,290Rust tests with2existing ignores; types0errors/0warnings, parity116families/0findings, ordinary/e2e strict Clippy, full source/Markdown/Rust formatting and production renderer build pass. omarchy Docker,2CPU/12GiB and established6GiB build heap. Fresh individually verified8package overlay from repaired PR48. No native WebView/window or provider execution; existing bundle-size warning retained."
    },
    {
      "name": "Canonical specifications and source governance",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "def0f25f-966d-4433-aa57-ee09fe4d8e45: all four lanes pass (validate, Rust format, mdBook and spec-first), including architecture, App ownership and evidence/source audits. Pinned omarchy Docker, 2 CPU/4 GiB, unchanged eight-package verified overlay. No host product fallback."
    },
    {
      "name": "Changed fixture and document formatting",
      "command": "pnpm dlx prettier@3.3.3 --config /tmp/lapis-retirement-prettier.json --check <three changed fixture/test files and seven changed Markdown files>",
      "result": "pass",
      "failures": 0,
      "detail": "All changed files pass pinned Prettier formatting. Final evidence validation follows this receipt update; original E-RETIRE-004/005 records remain unchanged."
    }
  ],
  "remaining": [
    "Actual original/synthetic native startup, disabled preferences, Safe Mode, close/reopen and byte preservation through explicit on-demand native lane; retain all outcomes.",
    "App Profile native-chat owner is a separate existing path; default-owner acceptance does not qualify its storage/lifecycle.",
    "Fresh exact-head hosted qualification of the combined repaired cohort.",
    "Package publication, Website cutover and installed-app replacement remain separately gated."
  ]
}
```

The preserved public archive is an ignored test input, never vendored retired
implementation. Authenticity is not permission for a new installation. Core API
services/functions and planned capability remain intact under the narrowed
scope.
