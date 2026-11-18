# Complete hosted repaired-cohort qualification

```json
{
  "id": "E-RETIRE-011",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "checkedDesktopHead": "5006a7cffe2f8d816bd822e1cc1a882e88a357be",
    "originalTestMerge": "c22dd5542f5995a2f674f22437f939375b2e6395",
    "featureMerge": "45d61a6c95d980892be8bb6a32f612137c1bb529",
    "previousEvidence": "c57594d06c19634f6a664c0414f3e7eb19bdfcf6",
    "notesSource": "5ffb33c152404b6880debd1b5fd70762121d6196",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1"
  },
  "requirements": ["LD-GOV-006", "LD-AI-002"],
  "files": [
    "spec/src/history/E-RETIRE-011.md",
    "spec/src/current/ai-adapter.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md"
  ],
  "contractReview": "Close the fresh producer/admission and selected ordinary hosted-CI boundary recorded pending in E-RETIRE-002/003/005/010. Preserve those records verbatim, core API services/functions, future Language Service wiring, Rust/native pins and normal private-archive identity. No application, public API, installer policy, user data, dependency, workflow or acceptance assertion changes.",
  "acceptanceReview": "Verify current GitHub PR head, terminal exact-head run and every job before the expected-head merge. Ordinary CI success is limited to its eight selected gates. Explicitly unselected macOS bundle/full-source jobs do not count as passes. Retain native product, on-demand local diagnostic, App Profile lifecycle and release gates separately. A source-identical merge plus documentation integration does not manufacture native or published-registry qualification.",
  "hosted": {
    "pr": 48,
    "runId": 44201504767,
    "attempt": 1,
    "head": "5006a7cffe2f8d816bd822e1cc1a882e88a357be",
    "status": "completed",
    "conclusion": "success",
    "jobs": 20,
    "passedJobs": 18,
    "skippedJobs": ["Native bundle", "Full source qualification"],
    "selectedGatesPassed": 8,
    "finalValidationJob": 134505295282,
    "summaryArtifact": {
      "id": 14388302214,
      "size": 1774,
      "githubDigest": "41f97270710a148a3f9c45fe0cc6019290ddc9a7eb9df33d850d3d40bbc9f81d"
    }
  },
  "runs": [
    {
      "name": "Exact-head final hosted verification",
      "command": "GitHub fetch_commit_workflow_runs(5006a7cf), fetch_workflow_run_jobs(44201504767), get_pr_info(48)",
      "result": "pass",
      "failures": 0,
      "detail": "Root verifies a completed successful workflow and all 20 terminal jobs: 18 successful and two explicitly unselected. Final Validate job 134505295282 reports all eight selected gates pass. Governance, both complete producers, same-run audits, quality, unit, static catalog, all 2,168 interaction/accessibility executions and both Linux release binaries pass. No macOS product acceptance or full-source-profile pass is inferred."
    },
    {
      "name": "Controlled feature-branch integration",
      "command": "Mark PR48 ready, then expected-head merge5006a7cf into retirement/shared-ai-public-consumer",
      "result": "pass",
      "failures": 0,
      "detail": "GitHub merge succeeds at 45d61a6c95d980892be8bb6a32f612137c1bb529. This is the PR47 feature branch, not main. Child PRs49/51/52 retain exact heads5321742d/c4c4509e/bbbf12f2 and auto-retarget to the feature branch. Their current checks remain independent; no head was rewritten."
    },
    {
      "name": "Merged tree and protected source equivalence",
      "command": "jj --no-pager diff --from 5006a7cffe2f8d816bd822e1cc1a882e88a357be --to 45d61a6c95d980892be8bb6a32f612137c1bb529 --summary",
      "result": "pass",
      "failures": 0,
      "detail": "The checked and merged full trees are identical; integration changes documentation only. E-RETIRE-002/003/005/010 bytes independently match their original commits. E-RETIRE-010 records the complete eight-package artifact and same-run installed guard. Preserve source/event identity; no old full artifact is replayed."
    },
    {
      "name": "Superseded private UI workflow scheduling recovery",
      "command": "Verify old run44206657064 atcc61 and current PR51 headc4; cancel only old run, then inspect terminal state",
      "result": "pass",
      "failures": 0,
      "detail": "Old run44206657064 at cc61 had a failed Storybook aggregate and sole queued always() Validate job134505278752; current c4 run44210561723 was pending without jobs. Normal cancellation was acknowledged but left that old job queued. Targeted force-cancel succeeds; root verifies completed/cancelled, and the current run schedules normally. No current candidate was cancelled or duplicate-dispatched. The old run is not counted as passing."
    },
    {
      "name": "Initial closure-document validation",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "fail",
      "failures": 2,
      "detail": "5752b6fd-dedd-48fc-a4e2-7108299f72f1: one invocation stops at validate with two findings. E-RETIRE-011 incorrectly used result pass while listing remaining gates; keep it pending. Verification reached 32,811 bytes against the unchanged 32,768-byte limit; move retirement context into its owning chapter while preserving every evidence link. No product code or gate is changed."
    },
    {
      "name": "Closure-document validation after correction",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "58801a53-8f83-4a4b-bec5-e27a39743fc8: all four lanes pass after the original two findings become zero. The receipt stays pending with all broader gates retained. Verification is 32,271 bytes; detailed context moves to the owning AI adapter chapter without losing any receipt links or raising limits. Pinned omarchy Docker, 2 CPU/4 GiB, same complete eight-package overlay. No production source changes."
    },
    {
      "name": "Final closure evidence check",
      "command": "node scripts/validation.mjs run check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "5cab8d53-9224-4cbc-a0d7-8d7f851c8c4c: all 512 evidence records pass against the complete eight-package overlay. This final detail is recorded and formatted after the run. E-RETIRE-011 remains pending for its listed integration, native and distribution gates; no failed attempt is discarded."
    }
  ],
  "remaining": [
    "Land this documentation integration on the PR47 feature branch in dependency order.",
    "Qualify current child PR49/51/52 and the final #47 candidate at their actual heads; keep independent source and consumer receipts.",
    "Original/synthetic external-versus-bundled native startup/data/preferences/Safe Mode/cold-reopen cases remain unexecuted; on-demand native decision is pending.",
    "App Profile native-chat storage/lifecycle remains a separate boundary. Package publication, registry-only adoption, Website deployment and installed-app replacement are separately gated."
  ]
}
```

E-RETIRE-002/003/005/010 remain immutable. This receipt closes their fresh
ordinary-hosted producer/consumer boundary only. Preserve core API services and
functions and planned Language Service integration. Terminal migration remains
last. Prepared native preservation is tracked in
[PR49](https://github.com/lapismd/lapis-desktop/pull/49).
