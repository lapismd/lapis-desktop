# Actual provider through retained Desktop chat and History

```json
{
  "id": "E-CORE-027",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M10.2"],
  "requirements": ["LD-AI-001", "LD-AI-002", "LD-AI-004", "LD-DESK-005"],
  "contractReview": "Qualify the existing Core composer and right-sidebar History with an actual provider, ordinary reload teardown, a disposed-observer completion gap and clean Quit/cold application recovery. No production lifecycle, screen, admission or persistence implementation is replaced.",
  "milestoneReview": "The actual Codex provider completes a composer-submitted turn after ordinary reload has disposed the renderer observer. Retained History recovers the exact conversation after reload and clean Quit/cold application restart with one native journal and unchanged record/transcript. This closes the Desktop actual-provider screen boundary of Notes R2.3; full dependency/catalog intake and the aggregate Notes gate remain separate until committed. M10.2, later AI workflows, memory and distribution retain their original gates; application defaults are unchanged.",
  "versions": {
    "desktopParent": "49881cd392c113c7d95bc046a150e92db2d933ba",
    "notesSource": "f0cf7b1abb370ea50595c3355763d9bf5abea9fe",
    "desktopBuildSource": "1c4ac514",
    "nativeBinarySha256": "7386432b00de597ffdcf38382b62091611352986a64faeb2b200de6ccf2d9a10",
    "nativeBuildLogSha256": "a9732e32cadc5073ae50482393b02ebcb1da3eebc06fa0ba31467db6c97db317",
    "archiveInventorySha256": "fb390d92fc9ccdd7f50841490a002b5888b1658918d34cab220e53448c5c0ce2",
    "packageManifestSha256": "6155c213aa847c8e880288d893f24daea3c8be7d19512a919b6e3a7c3af31efb",
    "lockfileSha256": "4351c4b60fffe6c2a317d351a0d5aa23f469446f09700da59d7517104ff2803d",
    "nativeSourcesSha256": "ca3fb8cc1e245993dcfcf45282f60fd502bc4050298301e66e21140142112abb",
    "designCoreSource": "b40f8c93bf74060d0e2f4e799a2436b5f69cfa21",
    "agentUiSource": "0e549ebccbef4e91ff9157062b91ce6da5228a94",
    "svelte": "5.56.10",
    "provider": "Codex ACP",
    "mode": "read-only"
  },
  "runs": [
    {
      "name": "syntax",
      "command": "node --check tests/desktop/ai-core-provider-screen.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Syntax only; no native/provider acceptance claimed."
    },
    {
      "name": "actual-native-before-1",
      "command": "LAPIS_AI_TEST_CORE_SCREEN_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<isolated-native-config> node --test --test-concurrency=1 <provider-workspace>/tests/desktop/ai-core-provider-screen.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Attempt 1: one failure before submission; default five-second composer wait precedes native helper admission. Receipt core-provider-screen-INleYM is preserved."
    },
    {
      "name": "actual-native-before-2",
      "command": "LAPIS_AI_TEST_CORE_SCREEN_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<isolated-native-config> node --test --test-concurrency=1 <provider-workspace>/tests/desktop/ai-core-provider-screen.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Attempt 2: one failure before submission; composer is queried before admission finishes. Join the real desktop_ai_admit command within its existing native budget rather than replace readiness or the product composer. Receipt core-provider-screen-Zht1hy is preserved."
    },
    {
      "name": "actual-native-before-3",
      "command": "LAPIS_AI_TEST_CORE_SCREEN_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<isolated-native-config> node --test --test-concurrency=1 <provider-workspace>/tests/desktop/ai-core-provider-screen.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Attempt 3: real prompt accepted, detached while Running and completed without its observer; one harness failure because History had not been opened. Use the normal Conversation actions -> AI conversations menu. Receipt core-provider-screen-WyyCSM is preserved."
    },
    {
      "name": "actual-native-before-4",
      "command": "LAPIS_AI_TEST_CORE_SCREEN_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<isolated-native-config> node --test --test-concurrency=1 <provider-workspace>/tests/desktop/ai-core-provider-screen.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Attempt 4: real prompt accepted and completed without its observer; one harness failure selected an inactive chat leaf for the reply. Select the one visible production chat without changing transcript assertions. Receipt core-provider-screen-kq9Y8y is preserved."
    },
    {
      "name": "actual-native-before-5",
      "command": "LAPIS_AI_TEST_CORE_SCREEN_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<isolated-native-config> node --test --test-concurrency=1 <provider-workspace>/tests/desktop/ai-core-provider-screen.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "note": "Attempt 5: composer/detach/completion and reloaded History pass; one cold-run harness failure because History mounts before native admission finishes and the row has only the default five-second wait. Join the row using the same 30-second recovery budget as the transcript. Receipt core-provider-screen-OO7FSX is preserved."
    },
    {
      "name": "actual-native-after",
      "command": "LAPIS_AI_TEST_CORE_SCREEN_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<isolated-native-config> node --test --test-concurrency=1 <provider-workspace>/tests/desktop/ai-core-provider-screen.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "note": "Attempt 6: receipt .local/native-test/core-provider-screen-DXIO88/receipt.json. Accepted 22:02:04.502 UTC; ordinary reload completes desktop_ai_release and vault_close before the test-only hold at 22:02:04.875. Native completion occurs without any client turn call at 22:02:11.174. Reloaded History passes at 22:02:12.665; clean Quit/cold History passes at 22:02:26.477. Exactly one Submit/journal and byte-equivalent complete record/transcript remain; transcript SHA-256 9c5ebe3f8d221310744e5099eccff6dd9292efe47106e4ccbc909879bae1833e. No production implementation changed."
    },
    {
      "name": "retained-fixture-and-explicit-optout",
      "command": "node --test --test-concurrency=1 <provider-workspace>/tests/desktop/ai-core-provider-screen.test.mjs tests/desktop/ai-core-chat.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0,
      "note": "One retained Core chat/History native fixture passes in 6.68 seconds with clean cold restart and exactly one fixture prompt. The new actual-provider target intentionally skips once without its opt-in flag. No provider is launched by the skipped target. Receipt core-chat-kPLooY and provider-screen-native-fixture-and-optout.log are preserved."
    },
    {
      "name": "qualified-public-cohort",
      "command": "Read final-candidate-20261025/install-result.json, final Design Core equality and Agent UI composite qualification receipts; recheck installed Svelte and tracked input hashes",
      "result": "pass",
      "failures": 0,
      "note": "The fresh native bundle uses 26 checksummed archives and 101 active import routes, with Svelte 5.56.10 and the exact tracked package/lock hashes above. Design Core archive 14806b99 matches all 4,312 committed public files at b40f8c93. Agent UI f9fff47b and Repository UI 34388594 match all 333/699 committed public files at 0e549ebc. Original provisional archive labels are superseded only by those separate complete source/equality receipts. Broader Desktop catalog/build/specification intake remains separately owned."
    },
    {
      "name": "specification-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Run 606eba83-1e03-4d93-b257-d1e6fc8d852f stops before other lanes: new Desktop cross-reference exceeds the 32,768-byte chapter limit; this fresh record declares pass while listing remaining gates. Keep the owning AI contract, remove the redundant new Desktop paragraph, and retain pending until this slice's final checks pass. No validator or historical evidence changes."
    },
    {
      "name": "specification-owning-map-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Run 0f43e6ff-87fc-43c8-bbf0-bfb724ef88cf passes canonical validation, Rust formatting and mdBook; spec-first requires the Desktop chapter mapped to native acceptance tests. Add only the bounded E-CORE-027 cross-reference there while preserving its existing byte limit and AI ownership. An authoring preflight rejects an oversized candidate before writing it."
    },
    {
      "name": "specification-stale-source-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Run 580b91eb-7987-4785-b863-9e3b14c5fd9d exported before the mapped cross-reference was written, so its frozen source repeats the missing Desktop map. The final authoring check now confirms 32,766 bytes with the owning cross-reference present. The previous report remains failed; no source is changed inside a running worker."
    },
    {
      "name": "specification-after",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Final-source Docker run 81780dab-c08d-481b-a661-65d3589c1cab passes all four canonical lanes: validation, Rust formatting, mdBook and mapped spec-first. Every original failed attempt is retained above; unrelated historical exceptions and broader M10/default cutover gates are unchanged."
    },
    {
      "name": "final-record-validation",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "Explicit narrow authoring validation after selecting pass with no remaining gaps: six validators, 341 chapters and 108 requirements pass. The full four-lane source check ran separately in Docker. Equivalent six-line AI prose leaves room for the separately owned one-line catalog fixture cross-reference."
    },
    {
      "name": "generated-progress",
      "command": "pnpm progress:generate; LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "Generated summary matches all 51 tasks and 299 evidence records; UTC timestamp refreshed. This is authoring/bookkeeping validation only."
    },
    {
      "name": "changed-file-format-and-syntax",
      "command": "pnpm exec prettier --check <ten-owned-paths>; node --check tests/desktop/ai-core-provider-screen.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All ten changed files and native leaf syntax pass. Full historical formatting remains covered by its existing accepted E-AI-109 exception; no committed evidence is edited."
    }
  ],
  "files": [
    "tests/desktop/ai-core-provider-screen.test.mjs",
    "spec/src/current/ai.md",
    "spec/src/current/verification.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/migration.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-CORE-027.md",
    "MIGRATION.md",
    "spec/src/current/desktop.md"
  ],
  "remaining": []
}
```

The native screen slice is qualified. Final Desktop dependency/catalog intake,
aggregate Notes R2 review, broader M10 features, default cutover, distribution
and visual review retain their own gates; none is inferred from this case.
