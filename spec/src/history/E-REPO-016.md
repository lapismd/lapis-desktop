# Visible background work and responsive repository startup

```json
{
  "id": "E-REPO-016",
  "tasks": ["M13", "M13.2", "M10.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-AI-002",
    "LD-DESK-001",
    "LD-HOST-001",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-009"
  ],
  "revision": "enclosing Jujutsu change wtwnvksl",
  "versions": {
    "desktopBase": "c1a16ec89f7aba34ee02c67c6873cc74b759921a",
    "node": "v26.9.0",
    "pnpm": "10.34.5",
    "storybook": "10.5.7",
    "vite": "7.3.2",
    "svelte": "5.57.2"
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/background/Work.stories.ts",
    "catalog/support/background/BackgroundDemo.svelte",
    "catalog/support/background/fixture.ts",
    "scripts/spec-contracts.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/background.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/index.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-REPO-016.md",
    "spec-validator.config.mjs",
    "src/components/ai/plugin/ai-plugin.ts",
    "src/components/repository/repository-plugin.ts",
    "src/lib/ai/catalog/inventory.ts",
    "src/lib/ai/commands/discovery.ts",
    "src/lib/ai/commands/parser-port.ts",
    "src/lib/ai/conversations/conversation-index-coordinator.ts",
    "src/lib/ai/core/owned-work.ts",
    "src/lib/ai/memory/memory-ingestion-coordinator.ts",
    "src/lib/ai/memory/memory-scheduler.ts",
    "src/lib/ai/plugin/application.ts",
    "src/lib/ai/plugin/maintenance.ts",
    "src/lib/ai/plugin/services.ts",
    "src/lib/desktop/background-work.ts",
    "src/lib/native/ai/command-parser.ts",
    "src/lib/native/ai/command-parser.worker.ts",
    "src/lib/native/ai/services.ts",
    "src/lib/native/repository/preparation-queue.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/notes/notes-startup.ts",
    "tests/ai/commands/native-parser.test.ts",
    "tests/renderer/background-work.test.mjs",
    "tests/renderer/repository-native.test.mjs",
    "tests/workers/command-parser.test.ts",
    "vitest.workers.config.ts"
  ],
  "result": "pass",
  "runs": [
    {
      "name": "before",
      "command": "ordinary preview cold launch; node --test --test-name-pattern 'queue behind' tests/renderer/repository-native.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Cold actual Preview restored both repository tabs and emitted Repository history busy. New exact queue regression reproduces the same rejection. The originally reported whole-app freeze is not proven to come from YAML parsing. Earlier native process sample shows the AppKit loop idle; user-command file access already runs on a Tokio blocking worker but holds the shared native owner during IO."
    },
    {
      "name": "focused-node",
      "command": "node --test tests/renderer/background-work.test.mjs tests/renderer/repository-*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "53 cases: preparation queue, close fence, failed preparation, no replay of unknown opens, status lifetime, pinned history and direct consumers."
    },
    {
      "name": "ai-policy",
      "command": "pnpm exec vitest run --config vitest.ai.config.mjs tests/ai/commands tests/ai/plugin/maintenance-lifetime.test.ts tests/ai/plugin/conversation-persistence.test.ts tests/ai/conversations/conversation-index-coordinator.test.ts tests/ai/memory/memory-ingestion-coordinator.test.ts tests/ai/memory/memory-scheduler.test.ts",
      "result": "pass",
      "failures": 0,
      "note": "58 cases pass. Later targeted commands/ownership rerun passes 48. Parser allocation, correlated replies, diagnostics, worker failure, deadline and closure covered."
    },
    {
      "name": "real-browser-worker",
      "command": "pnpm exec vitest run --config vitest.workers.config.ts",
      "result": "pass",
      "failures": 0,
      "note": "One actual module-worker case passes with 12000 YAML fields while renderer timers continue. It also preserves invalid-command diagnostics; no synchronous renderer fallback is installed in the native host."
    },
    {
      "name": "early-checks",
      "command": "pnpm check:types; focused catalog attempts while source was still being edited",
      "result": "fail",
      "failures": 3,
      "note": "New story used unsupported Testing Library exact options; all three type errors repaired. An intermediate malformed waitFor edit was corrected. A three-file catalog attempt was interrupted during source/HMR churn; it is not a product pass. Cold exact two-case background story run passes in 11.53s."
    },
    {
      "name": "types-audits",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Final source types 0 errors/0 warnings; both ownership audits pass."
    },
    {
      "name": "ordinary-native-bundle",
      "command": "pnpm desktop:bundle --debug; ordinary Preview cold launch through cua; select both saved repository tabs; type Repository in the native command palette",
      "result": "pass",
      "failures": 0,
      "note": "Vite build 38.99s; native asset rebuild 15.04s; normal 226.78 MiB app bundle passes. Actual native cold restore exposes 4 revisions and 9 operations at the original bd3e4eca pin without busy errors. Palette opens and filters through ordinary keyboard input. No e2e features or instrumentation, source/vault reset, installed-app replacement or provider execution. Native status is empty after completion; held browser ports show the actual status/notification task list. Screenshots retained under .local/reusable-conversations/background-native-after.png and background-status-review.png."
    },
    {
      "name": "document-first-attempt",
      "command": "pnpm progress:generate; pnpm spec:validate",
      "result": "fail",
      "failures": 7,
      "note": "New prose/padded evidence tables exceeded chapter line/byte budgets; background contract extracted into its own topic and existing ledger links retain history. Draft evidence lacked supported pending result/remaining, fresh generated-MIGRATION coverage and SUMMARY navigation; corrected in the same slice. Final checks follow."
    },
    {
      "name": "reactive-chat-regression",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/NativeNotes.stories.ts -t 'Unavailable Agent' --reporter verbose",
      "result": "fail",
      "failures": 1,
      "note": "New status publication leaked synchronous notification reads into chat effect dependencies, starving the renderer during Open Chat. Isolated run repeats the stall; process sample shows sustained main-thread work. Interrupted attempts are retained. Untracking progress publication and imperative task setup repairs this introduced regression. Temporary logging was restored byte-for-byte before the final run; no assertion was loosened."
    },
    {
      "name": "exact-chat-after-untrack",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/NativeNotes.stories.ts -t 'Unavailable Agent' --reporter verbose",
      "result": "pass",
      "failures": 0,
      "note": "Same real native-factory Chat/catalog case passes in 849ms, with three cases filtered out. Public app/model behavior and all original assertions retained."
    },
    {
      "name": "affected-story-family",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/background/Work.stories.ts catalog/plugins/ai/NativeNotes.stories.ts catalog/plugins/repository/LivePlugin.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 11 production stories pass interaction/accessibility in a fresh Chromium run (22.75s). Includes delayed work while palette remains interactive, actual status API, parser-failure toast, native-factory AI enable/disable/trust and repository direct flows. Pending-work visual uses controlled ports; ordinary native cold proof is recorded separately."
    },
    {
      "name": "final-focused-source",
      "command": "pnpm check:types; node --test tests/renderer/background-work.test.mjs tests/renderer/repository-*.test.mjs; focused AI policy command; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "53 Node cases, 58 AI policy cases, source types (0 errors/0 warnings), both ownership audits pass after the untrack repair."
    },
    {
      "name": "governance-mapping",
      "command": "node --test tests/governance/*.test.mjs; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "66 governance cases pass after adding the private background topic and explicit worker/catalog mapping. Spec-first passes for 33 protected files and eight owning chapters."
    },
    {
      "name": "final-normal-native",
      "command": "pnpm desktop:bundle --debug; cold ordinary Preview launch through cua; Open Chat; switch Op Log and JJ Log",
      "result": "pass",
      "failures": 0,
      "note": "Corrected source rebuild: Vite 29.74s, native embedded-asset compilation 14.26s, ordinary 226.78 MiB bundle. Cold app restores JJ Log 4; Open Chat renders its unavailable-agent state immediately, followed by Op Log 9 and JJ Log 4 at the saved bd3e4eca pin. No prompt/provider execution. Normal app remains running with preserved profile/vault; screenshot background-native-after.png refreshed. Original whole-app freeze remains unattributed; the reproducible preparation race and introduced reactive Chat loop are fixed."
    },
    {
      "name": "generated-summary-format",
      "command": "pnpm progress:generate; pnpm exec prettier --check <changed files>",
      "result": "fail",
      "failures": 1,
      "note": "Generated MIGRATION.md needs formatting after regeneration. Formatted the generated summary; progress validation compares its Markdown projection, preserving the generated content."
    },
    {
      "name": "final-document-checks",
      "command": "pnpm progress:generate; pnpm exec prettier --write MIGRATION.md spec/src/history/E-REPO-016.md; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm spec:check; pnpm exec prettier --check <all changed files>",
      "result": "pass",
      "failures": 0,
      "note": "Progress: 33 tasks, 118 evidence records. Specification: 6 validators, 136 chapters, 94 requirements. Spec-first mapped ownership passes across eight canonical chapters. Four spec-check lanes pass, including mdBook and Rust formatting only; no Rust compile/test lane. All changed files satisfy Prettier and authored spec budgets. Final inventory initially retained MIGRATION.md, whose formatted generated contents match the parent; removed it from the changed-file list."
    }
  ],
  "contractReview": "LD-REPO-002/004 gains a shared preparation queue and full-lifetime App status activity. Native pins, authorization, storage and transport remain unchanged; unknown opens are never replayed. LD-AI-002 optional command bootstrap no longer gates input; native command parsing uses an owned module worker, and maintenance status remains owned through drain. LD-DESK-001 startup uses the existing public progress API. No public package API or native/Rust behavior is changed.",
  "milestoneReview": "M13.2 retains its original Done gate; M13/M13.3 and M10.2 remain In progress. This responsiveness slice does not qualify managed conversation publication/restart, native evolution/search, writes, provider/platform expansion or visual baselines.",
  "scope": "Focused desktop renderer/native-adapter regression, AI policy, actual browser worker, affected production stories, types/ownership and normal local bundle. Whole catalog, native acceptance instrumentation, provider/release and Rust test suites remain deferred under the requested focused scope. Native file/database/JJ jobs were verified in source to use blocking workers. This is not proof that every future large diff or transcript has been profiled.",
  "remaining": []
}
```
