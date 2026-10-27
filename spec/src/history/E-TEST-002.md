# Live agent/provider specs are explicit opt-in only

```json
{
  "id": "E-TEST-002",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M0.2"],
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-GOV-009"],
  "contractReview": "Make the existing exclusion of live agent/provider acceptance structural instead of conventional. One opt-in runner, pnpm test:provider:live, is now the sole entry point for the twelve specs that can drive a real installed agent or provider; it refuses without an explicit LAPIS_AI_TEST_RUNTIME_CONFIG, refuses an unlisted path and refuses a non-macOS-ARM64 host. A governance audit inside the default pnpm test lane fails if any lane definition, acceptance script, catalog or vitest configuration, Storybook file, package.json script or lane command ever collects a live spec, helper or the runner itself, and if any live spec loses its own skip guard. No spec, assertion, timeout, fixture or requirement was weakened: the portable-runner contract keeps its explicit native-lane allowlist and still asserts those lanes bypass validation.mjs.",
  "milestoneReview": "M0.2 retains its original Done gate and now also owns the structural live-provider exclusion; E-TEST-001 remains the quiet-entrypoint record. No native, provider, catalog, distribution or visual gate is promoted, and actual-provider acceptance stays deferred by the 2026-10-27 user decision recorded in E-CORE-048 rather than completed here.",
  "versions": {
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "userDecision": "2026-10-27",
    "liveSpecs": 12,
    "liveHelpers": 3,
    "auditedDefaultLaneFiles": 14,
    "governanceSuiteTests": 170
  },
  "files": [
    "AGENTS.md",
    "MIGRATION.md",
    "package.json",
    "scripts/live-provider-tests.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-TEST-002.md",
    "tests/governance/live-provider-exclusion.test.mjs",
    "tests/governance/validation.test.mjs"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Where live acceptance is collected today",
      "command": "grep -rl 'LAPIS_AI_TEST_RUNTIME_CONFIG|LAPIS_AI_TEST_CORE_QUEUE_PROVIDER|LAPIS_AI_TEST_CLIENTS|LAPIS_AI_TEST_GGUF' tests/; then match each hit against scripts/validation/lanes.json, scripts/desktop-acceptance.mjs, scripts/desktop-api-tests.mjs, scripts/desktop-tests.mjs, scripts/catalog-tests.mjs and the vitest configs",
      "result": "pass",
      "failures": 0,
      "detail": "Fifteen files can select a real agent or provider: twelve specs plus the ai-provider-fixture, ai-local-compute-fixture and native-queue-provider driver helpers. None appears in any default lane list, so the exclusion already held in fact; nothing was collected by the quiet, headless, headed, hidden API, catalog or bundle lanes."
    },
    {
      "name": "Structural audit first run",
      "command": "node --import tsx --test tests/governance/live-provider-exclusion.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "4/5 passed. The inventory-completeness case flagged the audit's own source, because enforcing the opt-in names requires naming the four variables. The scan now excludes the audit file itself; no assertion, inventory entry or lane check was weakened."
    },
    {
      "name": "Structural audit after scoping",
      "command": "node --import tsx --test tests/governance/live-provider-exclusion.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 5,
      "detail": "5/5: inventory completeness over every tests/ module, default-lane exclusion across 14 lane/config/Storybook files plus a lanes.json rule that no lane may collect tests/desktop specs, package.json exposure only as test:provider:live, a per-spec skip-guard requirement, and the runner's own refusal gate."
    },
    {
      "name": "Opt-in runner refusals",
      "command": "env -u LAPIS_AI_TEST_RUNTIME_CONFIG pnpm test:provider:live -- --all; LAPIS_AI_TEST_RUNTIME_CONFIG=<empty private file> pnpm test:provider:live -- tests/desktop/lifecycle.test.mjs; LAPIS_AI_TEST_RUNTIME_CONFIG=<empty private file> pnpm test:provider:live",
      "result": "pass",
      "failures": 0,
      "detail": "All three refusals exit non-zero before any process is spawned: the missing explicit configuration, an unlisted spec that the runner never executes, and a missing selection. No live turn ran and no configuration content was printed."
    },
    {
      "name": "Portable-runner contract before and after",
      "command": "node --import tsx --test --test-name-pattern='every nonvisual test command uses the portable runner' tests/governance/validation.test.mjs; node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 170,
      "detail": "Before: that exact case failed once because test:provider:live bypassed the portable runner (169/170 in the governance glob). After adding it to the contract's existing explicit native-lane set, which still asserts those lanes bypass validation.mjs, the exact case passes 1/1 and the complete governance glob passes 170/170 with 0 skipped."
    }
  ],
  "gaps": [
    "The live specs themselves are unchanged and each keeps its own family opt-in, so an explicitly requested run still needs its own flag (for example LAPIS_AI_TEST_CORE_QUEUE_PROVIDER=1) plus a qualified runtime configuration; --all without those flags reports skips rather than driving a provider.",
    "Actual-provider acceptance remains deferred by the 2026-10-27 user decision; E-CORE-048 holds the three integrated-main attempts and their preserved receipts, and no uncertain accepted turn was replayed.",
    "pnpm test:desktop:onnx stays a separate explicit lane for the real ONNX search model. It exercises no agent or provider and is unchanged by this policy."
  ]
}
```
