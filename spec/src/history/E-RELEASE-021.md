# Keep draft discovery behind protected publication

```json
{
  "id": "E-RELEASE-021",
  "date": "2026-11-13",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "candidateSource": "217aa6e396a9ef05040e7decad614e73b0b49662",
    "recoveryMain": "0eb420dc4a9adbd9ca5ae99d321513dbb9ea252d",
    "fullCiRun": 43444066441,
    "preparationRun": 43408364134,
    "failedPublishRun": 43454132514,
    "qualifiedDraft": 444226697,
    "emptyDuplicateDraft": 444260013,
    "tag": "desktop-v2026.31.6-rc.1",
    "hostedNode": "24.15.0",
    "specValidator": "0.2.0"
  },
  "requirements": ["LD-GOV-002", "LD-GOV-003", "LD-REL-004"],
  "files": [
    "docs/desktop-release.md",
    "scripts/release/select-candidate.mjs",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/history/E-RELEASE-021.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/governance/release-gates.test.mjs",
    "tests/governance/release-workflow.test.mjs"
  ],
  "contractReview": "Cross-source recovery still requires the original exact-source tag, sealed candidate and protected draft. The unprotected selector retains contents read-only, verifies that the tag targets the candidate source and refuses an already public release. GitHub does not expose drafts to that token. Draft enumeration, source/channel/asset verification and release-ID selection therefore remain exclusively in the environment-protected contents-write publisher. No candidate, tag, draft or asset is rebuilt, replaced, deleted or changed.",
  "acceptanceReview": "Exact-main full CI 43444066441 passed, but wholly new publication 43454132514 failed before approval because its read-only selector tried to enumerate drafts and GitHub returned none. The exact tag still targets candidate source 217aa6e3; qualified draft 444226697 retains all 16 assets and duplicate 444260013 remains empty. A local read-token regression failed before repair; 21 focused release tests, all 370 governance tests, 458 evidence records and all four specification lanes pass after separating read-only tag/public-release checks from protected draft discovery. Hosted repair qualification and publication remain pending.",
  "remaining": [
    "Pass explicit full PR qualification and a wholly new exact-main full run for the repair.",
    "Dispatch a wholly new protected publication for preparation 43408364134, approve only its exact environment, verify the public release and complete the tap update."
  ],
  "runs": [
    {
      "name": "Recovery revision exact-main qualification",
      "command": "GitHub Actions run 43444066441",
      "result": "pass",
      "failures": 0,
      "detail": "Every job passed for 0eb420dc, including both Linux native builds, Validate and Full source qualification."
    },
    {
      "name": "Read-only draft selection hosted failure",
      "command": "GitHub Actions run 43454132514 job 131983693941",
      "result": "fail",
      "failures": 1,
      "detail": "Select previously qualified bytes failed with Cross-source publication is limited to an existing interrupted draft. The job token had Contents read, the exact tag was visible, but the releases collection hid drafts; publication and tap jobs were skipped."
    },
    {
      "name": "Immutable hosted release state inspection",
      "command": "gh api exact tag, releases/444226697, releases/444260013 and actions/runs/43408364134",
      "result": "pass",
      "failures": 0,
      "detail": "The tag targets 217aa6e3, qualified draft 444226697 remains draft/prerelease with 16 recorded assets, duplicate 444260013 remains empty, and preparation 43408364134 remains a successful main workflow_dispatch for that source."
    },
    {
      "name": "Read-only selector regression before repair",
      "command": "node --test --test-name-pattern='promotion selects only qualified' tests/governance/release-gates.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "The selector called the draft releases collection and received Read-only workflow tokens cannot enumerate drafts."
    },
    {
      "name": "Read-only selector regression after repair",
      "command": "node --test --test-name-pattern='promotion selects only qualified' tests/governance/release-gates.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "1/1 exact selector test passed using the exact tag and absent public release while preserving protected draft verification."
    },
    {
      "name": "Protected workflow permission regression",
      "command": "node --test --test-name-pattern='preview publication stays manual' tests/governance/release-workflow.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "1/1 test passed: candidate selection inherits contents read and only the environment-protected publisher receives contents write."
    },
    {
      "name": "Focused release governance",
      "command": "node --test tests/governance/release-publication.test.mjs tests/governance/release-gates.test.mjs tests/governance/release-workflow.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "21/21 candidate, draft publication, selector permission and workflow recovery tests passed."
    },
    {
      "name": "Complete governance suite",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "370/370 governance tests passed from the isolated canonical-main repair workspace."
    },
    {
      "name": "Evidence validation before canonical specification qualification",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "All 458 evidence records passed."
    },
    {
      "name": "Specification qualification before governance mapping",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Validation, Rust formatting and mdBook passed; spec-first rejected the protected selector change until LD-GOV-002 received its same-change canonical governance mapping."
    },
    {
      "name": "Focused specification-first mapping after repair",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "detail": "Four protected files mapped to the distribution and governance canonical chapters."
    },
    {
      "name": "Specification qualification before governance budget repair",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Evidence passed; specification validation rejected governance.md at 405 physical lines, so the new rule was folded into the existing LD-GOV-002 row without weakening it."
    },
    {
      "name": "Specification qualification before requirement-shape repair",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Evidence and the 400-line budget passed; requirement validation rejected a fifth LD-GOV-002 sentence, so the same authority rule was combined into the existing protected-recovery sentence."
    },
    {
      "name": "Specification qualification before requirement-word repair",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Evidence, line budget and sentence shape passed; requirement validation found 81 LD-GOV-002 words against the 80-word cap, so one redundant pronoun was removed without changing the obligation."
    },
    {
      "name": "Specification and evidence qualification after repairs",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:evidence && LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All 458 evidence records and all four specification lanes passed; spec-first mapped four protected files to distribution and governance."
    },
    {
      "name": "Complete native check with reused local dependencies",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "fail",
      "failures": 3,
      "detail": "Story parity and specification validation passed. Svelte type validation reproduced the existing local @lapis-notes/api 0.2.6/0.2.8 dual identity in notes-bundled-plugins.ts recorded by E-RELEASE-020. This release-governance repair does not alter application sources, manifests, locks or local dependency projections; fresh hosted qualification remains required."
    }
  ]
}
```

Failed publication `43454132514` remains immutable. This repair does not
authorize a retry or candidate rebuild; it requires a wholly new complete
workflow after the repair's own PR and exact-main full qualification.
