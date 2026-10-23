# Shared-screen host hooks and history cards

```json
{
  "id": "E-SHARED-003",
  "date": "2026-10-23",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M15.1"],
  "requirements": ["LD-CAT-001", "LD-AI-002", "LD-REPO-002"],
  "versions": {
    "desktopParent": "b806b002",
    "baseline": "52516ae9",
    "sharedUi": "6ffe9210",
    "designCore": "81ada062",
    "notesApi": "e159faad",
    "plugins": "99806c68"
  },
  "contractReview": "Host syntax and explicit App references enter public composer extensions. Blame uses controlled wrap props and existing host persistence. The Notes sidebar supplies public shell tokens for its 40px header; no private dependency selector is added. Cards retain explicit actions, exact pins and native authority.",
  "milestoneReview": "M15.1 remains In progress. Focused history, reference, wrap, headers and discussions are repaired; remaining consumer interactions, full matrices, final builds and visible native qualification remain open.",
  "runs": [
    {
      "name": "history-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/FileHistory.stories.ts catalog/plugins/repository/OperationLayout.stories.ts",
      "result": "fail",
      "failures": 5,
      "note": "6 pass/5 fail: four obsolete description-button queries and one metadata-card Close scope."
    },
    {
      "name": "history-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/FileHistory.stories.ts catalog/plugins/repository/OperationLayout.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "11 pass with explicit View code, authors, exact operation pins and recovery. Delayed reader releases even after interaction failure."
    },
    {
      "name": "references",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/MultiRecipient.stories.ts catalog/plugins/ai/CommandsAndResults.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Before: 6 pass/3 fail. Host composer.extensions restores both chip regressions: all 5 Multiple recipients cases pass. Slash feedback remains separate until source intake."
    },
    {
      "name": "discussion-navigation",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/CommentHistory.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "3 pass after 2 failures. Public turn navigation reveals lazy tables; focus exposes Reply. Original anchors, quotes, context and no-replay assertions remain."
    },
    {
      "name": "columns-and-wrap",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/ColumnInteractions.stories.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/repository/BlameWrapping.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "11 pass/1 fail before final header token. Fixed canvas, exact column rail and all Blame wrap persistence cases pass."
    },
    {
      "name": "header-final",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Blame.stories.ts -t 'Sidebar Header Alignment'",
      "result": "pass",
      "failures": 0,
      "note": "1 pass/4 skipped. Before: 17px offset, then 8px after removing nested shell insets. Browser measurement: Notes 40px, shared default 48px. Public AppShell tokens align both under the unchanged 1px assertion."
    },
    {
      "name": "attachments",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/ColumnInteractions.stories.ts catalog/plugins/repository/BlameWrapping.stories.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/ai/CommentHistory.stories.ts catalog/plugins/ai/Attachments.stories.ts",
      "result": "fail",
      "failures": 3,
      "note": "16 pass/3 fail in intermediate run; all 4 Attachments cases pass. Compact shared two-line minimum replaces retired local three-line geometry; upper bound, multiline text and view-switch assertions remain."
    },
    {
      "name": "source-feedback",
      "command": "source check, test, build, spec and four-mode chat/complete-screen matrix",
      "result": "pass",
      "failures": 0,
      "note": "Agent UI 6ffe9210: exact before 1 fail, after 1 pass in both views. 210 units; zero type errors/warnings; builds/publint and 3 spec lanes pass. 85 x 4 foundations plus 32 x 4 complete screens = 468 interaction/accessibility passes. Fresh static catalog passes."
    },
    {
      "name": "consumer-attempt",
      "command": "pnpm test:storybook catalog/plugins/repository catalog/plugins/ai",
      "result": "fail",
      "failures": 27,
      "note": "Cancelled superseded first mode after 27 observed failures while exact repairs continued. This is not full qualification. No failure is waived."
    },
    {
      "name": "current-gap-intake",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/CommandsAndResults.stories.ts catalog/plugins/ai/Addressing.stories.ts catalog/plugins/ai/ApprovalPolicy.stories.ts catalog/plugins/ai/ChatScrollRecovery.stories.ts catalog/plugins/ai/shell/FollowScope.stories.ts catalog/plugins/repository/OperationFiles.stories.ts",
      "result": "fail",
      "failures": 7,
      "note": "16 pass/7 fail plus 8 runtime errors after fresh 6ffe9210 archive intake. All 5 Addressing, 5 Operation files and approval Save Failure cases pass. Remaining scroll, automatic receipt and scope cases continue."
    },
    {
      "name": "slash-final",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/CommandsAndResults.stories.ts -t 'Slash Retains Pending Comments'",
      "result": "pass",
      "failures": 0,
      "note": "1 pass/3 skipped after restoring the native refusal wording. Shared controller feedback is visible; exact slash draft and pending comments remain retained."
    }
  ],
  "files": [
    "catalog/plugins/ai/Addressing.stories.ts",
    "catalog/plugins/ai/ApprovalPolicy.stories.ts",
    "catalog/plugins/ai/Attachments.stories.ts",
    "catalog/plugins/ai/ChatScrollRecovery.stories.ts",
    "catalog/plugins/ai/CommandsAndResults.stories.ts",
    "catalog/plugins/ai/CommentHistory.stories.ts",
    "catalog/plugins/ai/MultiRecipient.stories.ts",
    "catalog/plugins/ai/shell/FollowScope.stories.ts",
    "catalog/plugins/repository/Blame.stories.ts",
    "catalog/plugins/repository/ColumnInteractions.stories.ts",
    "catalog/plugins/repository/FileHistory.stories.ts",
    "catalog/plugins/repository/OperationFiles.stories.ts",
    "catalog/plugins/repository/OperationLayout.stories.ts",
    "catalog/support/repository/blame-review/blame-review-view.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/shared-screen-integration.md",
    "spec/src/history/E-SHARED-003.md",
    "src/components/ai/chat/composer-references.ts",
    "src/components/ai/shared/DesktopAgentChat.svelte",
    "src/components/repository/FileHistoryPanel.svelte",
    "src/components/repository/blame/blame-view.ts",
    "src/lib/ai/shared/chat-port.ts",
    "src/lib/ai/shared/chat-presentation.ts"
  ],
  "remaining": [
    "Remaining scroll/runtime, automatic captured permission and scope acceptance; final affected four-mode matrix.",
    "Final production/static builds and cold native qualification. Strict unoccluded native readiness is unresolved.",
    "Visual review pending. Accepted existing E-AI-109 formatting and DOMPurify advisories remain separate."
  ]
}
```

Only isolated migration/source workspaces change. Baseline 7480 and migration
7481 preserve comparison stories. No publication, installed app replacement,
default integration or screenshot baseline update is performed.
