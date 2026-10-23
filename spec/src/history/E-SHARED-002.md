# Shared-screen queue and consumer qualification

```json
{
  "id": "E-SHARED-002",
  "date": "2026-10-23",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M15.1"],
  "requirements": ["LD-AI-002", "LD-CAT-001", "LD-REPO-002"],
  "versions": {
    "desktopParent": "9f842d04",
    "baseline": "52516ae9",
    "sharedUi": "05ca85c7",
    "designCore": "81ada062",
    "notesApi": "e159faad",
    "plugins": "99806c68"
  },
  "contractReview": "Queue capture preserves the valid default effort setting on the selection and every target. Complete shared screens retain native admission, exact request identity and host persistence. Catalog assertions select the actual approval decision independently from the allowance menu.",
  "milestoneReview": "M15.1 remains In progress. The queue regression and full AI policy lane pass. Full consumer interaction/accessibility, final builds and visible native qualification remain separate gates. No distribution or original AI milestone is completed by fixture acceptance.",
  "runs": [
    {
      "name": "queue-default-before",
      "command": "pnpm exec vitest run --config vitest.ai.config.mjs tests/ai/chat/controller/queued-messages.test.ts -t 'acknowledges durable authoring'",
      "result": "fail",
      "failures": 1,
      "note": "One failure and seven skipped. Queue thinking is invalid rejects the default composer effort before metadata persistence."
    },
    {
      "name": "queue-default-after",
      "command": "pnpm exec vitest run --config vitest.ai.config.mjs tests/ai/chat/controller/queued-messages.test.ts -t 'acknowledges durable authoring'",
      "result": "pass",
      "failures": 0,
      "note": "One pass and seven skipped. Exact persisted selection and recipient effort remain default; FIFO, authoring acknowledgement and no duplicate users retain their assertions."
    },
    {
      "name": "ai-policy-all",
      "command": "pnpm test:ai",
      "result": "pass",
      "failures": 0,
      "note": "151 files and 741 tests pass after the validator fix."
    },
    {
      "name": "queue-and-trace",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/QueuedMessages.stories.ts catalog/plugins/ai/TraceAndScrolling.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "11 pass. Previous run had 10 pass and one Failed Queue Save cleanup failure: its deliberately retained draft exposes Queue rather than Stop. The final case explicitly denies the pending request and still asserts the retained draft, one session and no saved queue."
    },
    {
      "name": "failed-queue-exact",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/QueuedMessages.stories.ts -t 'Failed Queue Save'",
      "result": "pass",
      "failures": 0,
      "note": "One pass and seven skipped. The fixture uses QueueRefusedError for its known pre-write refusal; uncertain production IO remains unknown."
    },
    {
      "name": "native-hidden-admission-imports",
      "command": "node --test --test-concurrency=1 tests/desktop/ai-admission.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/ai-local-imports.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Five cold native checks pass: AI admission, repository pins/blocked close/restart and three imported capture formats. Isolated profiles and actual native IO; no real provider or credentials. This does not qualify foreground visibility."
    },
    {
      "name": "source-package-acceptance",
      "command": "AGENT_UI_REVIEW_PNPMFILE=.local/migration/package-review.pnpmfile.cjs pnpm test:package",
      "result": "pass",
      "failures": 0,
      "note": "Clean packed-package type and Vite consumption pass; 140 documented examples compile. Explicit ignored review hook supplies the unpublished JJ History dependency from checksum-verified short-path archives. Earlier ordinary install and long-path override attempts failed; neither changes tracked package ranges. Source chat matrix also passes 484 interaction/accessibility cases."
    },
    {
      "name": "consumer-matrix-previous",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository catalog/plugins/ai",
      "result": "fail",
      "failures": 1,
      "note": "Cancelled the superseded process after its old Failed Queue Save case failed and teardown stopped progressing. A fresh final four-mode run uses the repaired story. No failure was waived."
    },
    {
      "name": "types-before",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 12,
      "note": "Six story files used Playwright's exact option in Testing Library role queries. Removed that unsupported option; string role names already match the complete accessible name. A fresh exact command rerun follows."
    },
    {
      "name": "types-after",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "The exact final rerun reports zero errors and zero warnings."
    },
    {
      "name": "source-boundaries",
      "command": "pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Both source boundary audits pass. Temporary queue diagnostics were removed before qualification."
    }
  ],
  "files": [
    "MIGRATION.md",
    "catalog/plugins/ai/AppToolActivity.stories.ts",
    "catalog/plugins/ai/ApprovalPolicy.stories.ts",
    "catalog/plugins/ai/MultiRecipient.stories.ts",
    "catalog/plugins/ai/QueuedMessages.stories.ts",
    "catalog/plugins/ai/ReplyErrors.stories.ts",
    "catalog/plugins/ai/TraceAndScrolling.stories.ts",
    "catalog/plugins/ai/TurnRequests.stories.ts",
    "catalog/support/ai/transcript/queue-store.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-recovery.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-SHARED-002.md",
    "src/lib/ai/conversations/validation-fields.ts",
    "tests/ai/chat/controller/queued-messages.test.ts"
  ],
  "remaining": [
    "Final four-mode directly affected consumer interaction/accessibility matrix and fresh production/static catalogs.",
    "Foreground native history still fails strict unoccluded-window readiness. Hidden native success is separate evidence; the visible gate is not waived.",
    "Visual review remains pending; no screenshot baselines updated."
  ]
}
```

The user explicitly accepted the existing immutable E-AI-109 formatting issue
and the three existing Plugins DOMPurify/Mermaid advisories as separately
tracked, non-blocking findings for this local UI migration. Neither exception
permits publication or waives a new functional, interaction or accessibility
failure.

Baseline Storybook stays on 7480; the isolated migration stays on 7481. Native
acceptance uses only its isolated application identifier, build target and test
profiles. No installed app, ordinary profile or default workspace is replaced.
