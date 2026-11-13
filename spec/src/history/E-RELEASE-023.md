# Own compute-model picker focus readiness

```json
{
  "id": "E-RELEASE-023",
  "date": "2026-11-13",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "failedRun": 43474683091,
    "sourceCommit": "6dea19cce05421e633cc8ef6c693ff0a65c8a6b5",
    "failedJob": 132064860747,
    "supersededQualifiedPrRun": 43490444272,
    "supersededQualifiedPrHead": "edde2917aae1b9026a71870e75b9f27d87541414",
    "rebaseMain": "f5a352959e806b0e6d6ad095eb5e6400be8846c7",
    "hostedNode": "24.15.0",
    "specValidator": "0.2.0"
  },
  "requirements": ["LD-AI-004", "LD-CAT-003", "LD-COMP-001"],
  "files": [
    "spec/src/current/ai-setup.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/history/E-RELEASE-023.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "src/components/ai/settings/AiComputeModelPicker.svelte"
  ],
  "contractReview": "The Desktop-owned compute-model picker retains the public Design Core Popover and Command View primitives, its searchable model catalog and the original focus assertion. Opening now owns initial focus explicitly through the public popover autofocus callback after the search input mounts. Selection still restores focus to the trigger. No delay, retry, longer timeout, synthetic control, Design Core override or weakened assertion is introduced.",
  "acceptanceReview": "Exact-main full run 43474683091 passed every acquired job except desktop/dark Storybook shard 4/4, where Model Picker mounted and opened but focus remained on the trigger instead of its search input. That shard passed 147/148 tests; the same 148 tests passed in desktop/light and narrow/light. Aggregate Storybook, Validate and Full source qualification failed consequentially. A cold local four-variant run passed 40/40 before repair, confirming intermittent readiness. Explicit full PR run 43490444272 then passed every job, including Validate and Full source qualification, on exact head edde2917aae1b9026a71870e75b9f27d87541414. Main subsequently advanced to f5a352959e806b0e6d6ad095eb5e6400be8846c7 and made that head unmergeable; the successful run is preserved but cannot qualify the rebased head. New complete PR and exact-main full workflows remain required.",
  "remaining": [
    "Pass a wholly new explicit full PR qualification for the rebased head and exact-main full qualification before another protected publication."
  ],
  "runs": [
    {
      "name": "Exact-main full qualification with model-picker focus race",
      "command": "GitHub Actions run 43474683091",
      "result": "fail",
      "failures": 1,
      "detail": "Desktop/dark Storybook shard 4/4 failed only Model Picker: the open search input existed, but focus remained on the open Model trigger. Aggregate Storybook, Validate and Full source qualification rejected the attempt."
    },
    {
      "name": "Superseded exact-head PR full qualification",
      "command": "GitHub Actions run 43490444272",
      "result": "pass",
      "failures": 0,
      "detail": "Every job passed on exact PR head edde2917aae1b9026a71870e75b9f27d87541414, including Validate and Full source qualification. Main then advanced to f5a352959e806b0e6d6ad095eb5e6400be8846c7, making the head unmergeable; rebasing changed the head and requires a wholly new full qualification."
    },
    {
      "name": "Cold complete AI setup story before repair",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/ai/Setup.stories.ts",
      "result": "pass",
      "failures": 0,
      "detail": "All 10 stories passed in desktop/light, narrow/light, desktop/dark and narrow/dark: 40/40 governed interactions. The hosted failure remains authoritative for the timing-sensitive race."
    },
    {
      "name": "Original desktop/dark target after repair",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=dark LAPIS_DESKTOP_CATALOG_PROFILE=full pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/Setup.stories.ts -t 'Model Picker' --reporter=default",
      "result": "pass",
      "failures": 0,
      "detail": "The exact original variant passed 1/1 with the unchanged search-focus assertion and normal deadline. Five additional independent cold process executions passed 5/5."
    },
    {
      "name": "Complete AI setup story after repair",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/ai/Setup.stories.ts",
      "result": "pass",
      "failures": 0,
      "detail": "All 10 stories passed in desktop/light, narrow/light, desktop/dark and narrow/dark: 40/40 governed interaction and accessibility executions."
    },
    {
      "name": "Specification search health",
      "command": "pnpm exec spec-validator doctor --json && pnpm spec:search 'AI setup model picker focus'",
      "result": "pass",
      "failures": 0,
      "detail": "Spec Validator 0.2.0 is the latest Deno-free release; QMD 2.5.3 native modules load, the index opens and semantic search resolves the canonical local AI setup chapter."
    },
    {
      "name": "Evidence and specification qualification",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:evidence && LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All 460 evidence records and all four specification lanes passed. AI, Desktop and local AI setup map the protected picker change while retaining the 400-line and 32,768-byte budgets."
    },
    {
      "name": "Complete repository check",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Story parity, specification validation, Svelte types with zero errors or warnings, normal/e2e Rust checks and formatting passed after staging the verified pinned Lapis AI runtime."
    },
    {
      "name": "Complete Linux test lane",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "All 757 Node tests, 746 AI tests and the complete Linux Rust/native-service suite passed. No macOS tests ran."
    },
    {
      "name": "Production renderer build",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "The production renderer build passed with only the existing pure-annotation, empty-chunk and chunk-size warnings."
    }
  ]
}
```

Run `43474683091` is not release authority. This repair does not rebuild or
change candidate `43408364134`, qualified draft `444226697`, empty duplicate
draft `444260013` or any release asset.
