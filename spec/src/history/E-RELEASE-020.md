# Resume exact interrupted draft publication

```json
{
  "id": "E-RELEASE-020",
  "date": "2026-11-13",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "candidateSource": "217aa6e396a9ef05040e7decad614e73b0b49662",
    "fullCiRun": 43403891789,
    "preparationRun": 43408364134,
    "firstPublishRun": 43415939740,
    "secondPublishRun": 43429636796,
    "qualifiedDraft": 444226697,
    "emptyDuplicateDraft": 444260013,
    "tag": "desktop-v2026.31.6-rc.1",
    "hostedNode": "24.15.0"
  },
  "requirements": [
    "LD-REL-001",
    "LD-REL-003",
    "LD-REL-004",
    "LD-REL-005",
    "LD-REL-006"
  ],
  "files": [
    ".github/workflows/release-desktop.yml",
    "docs/desktop-release.md",
    "scripts/release/publish.mjs",
    "scripts/release/select-candidate.mjs",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/history/E-RELEASE-020.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/governance/release-gates.test.mjs",
    "tests/governance/release-publication.test.mjs",
    "tests/governance/release-workflow.test.mjs"
  ],
  "contractReview": "The sealed candidate remains bound to preparation 43408364134 and source 217aa6e3. Recovery cannot rebuild, substitute, delete or overwrite assets. GitHub draft discovery uses the releases collection rather than the public by-tag endpoint. Every exact-tag draft must retain the candidate source and preview channel and contain only unique expected assets with identical bytes. The unique compatible draft with greatest verified coverage is selected by release ID; empty duplicates remain untouched and equal candidates fail closed. A later recovery-code revision must itself pass full exact-main CI, and cross-source selection is allowed only when the original exact-source tag and interrupted draft already exist.",
  "acceptanceReview": "Exact-main full CI 43403891789 and preparation 43408364134 passed. The candidate verifier and all 15 SHA256SUMS entries passed for desktop-v2026.31.6-rc.1. Publication 43415939740 created the exact tag and qualified draft, uploaded all 16 candidate files and failed on transient UND_ERR_SOCKET before publication. GitHub draft asset sizes and digests matched the sealed local candidate. Wholly new publication 43429636796 selected the same preparation but created an empty duplicate because GitHub's by-tag endpoint omits drafts, then failed when tag-based upload collided with LIMITATIONS.md in the qualified draft. Publication and tap update remain incomplete. The GitHub-realistic local regression failed before repair and passes after release-ID selection; complete hosted qualification is pending.",
  "remaining": [
    "Pass the complete local governance/spec/evidence lanes, explicit full PR qualification and full exact-main CI for the repair revision.",
    "Dispatch a wholly new protected publish-candidate run for preparation 43408364134, approve only its exact environment, verify the public tag/assets/source, and complete the tap update."
  ],
  "runs": [
    {
      "name": "Exact candidate source qualification",
      "command": "GitHub Actions run 43403891789",
      "result": "pass",
      "failures": 0,
      "detail": "Every full exact-main job passed for 217aa6e3, including Validate and Full source qualification."
    },
    {
      "name": "Sealed three-platform preparation",
      "command": "GitHub Actions run 43408364134",
      "result": "pass",
      "failures": 0,
      "detail": "All three builds, both original Linux Homebrew installed-app qualifications and candidate sealing passed; the verifier and all 15 SHA256SUMS entries passed independently."
    },
    {
      "name": "First protected publication",
      "command": "GitHub Actions run 43415939740",
      "result": "fail",
      "failures": 1,
      "detail": "After approval, the exact tag and draft were created and all 16 files uploaded. A transient GitHub UND_ERR_SOCKET occurred while re-reading draft assets; the draft remained unpublished and the tap job did not start."
    },
    {
      "name": "Independent qualified draft comparison",
      "command": "Compare sealed candidate files with GitHub release 444226697 asset size and digest fields",
      "result": "pass",
      "failures": 0,
      "detail": "All 16 GitHub draft assets matched the local sealed candidate exactly."
    },
    {
      "name": "Wholly new protected publication",
      "command": "GitHub Actions run 43429636796",
      "result": "fail",
      "failures": 1,
      "detail": "Selection reused preparation 43408364134. Publication created empty draft 444260013 because the by-tag endpoint omitted qualified draft 444226697, then tag-based upload collided with its existing LIMITATIONS.md. No candidate bytes changed and the tap job stayed skipped."
    },
    {
      "name": "GitHub-realistic interrupted-draft regression before repair",
      "command": "node --test --test-name-pattern='interrupted draft upload' tests/governance/release-publication.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "The second call created another draft and attempted to overwrite an asset through ambiguous tag-based upload, reproducing hosted publication 43429636796."
    },
    {
      "name": "Draft recovery regressions after repair",
      "command": "node --test --test-name-pattern='interrupted draft upload|ambiguous duplicate drafts' tests/governance/release-publication.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "The qualified draft wins over an empty duplicate by verified coverage and release ID; equal compatible drafts fail closed without uploading."
    },
    {
      "name": "Focused release governance",
      "command": "node --test tests/governance/release-publication.test.mjs tests/governance/release-gates.test.mjs tests/governance/release-workflow.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "21/21 focused candidate selection, publication and workflow tests passed."
    },
    {
      "name": "Complete governance suite",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "370/370 governance tests passed from the isolated main-based recovery workspace."
    },
    {
      "name": "Specification and evidence qualification",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:evidence && LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All 457 evidence records and all four specification lanes passed; spec-first mapped the seven protected paths to distribution and governance."
    },
    {
      "name": "Complete native check with reused local dependencies",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "fail",
      "failures": 3,
      "detail": "Story parity and specification validation passed. Svelte type validation found the existing local @lapis-notes/api 0.2.6/0.2.8 dual identity in notes-bundled-plugins.ts. The frozen main lock cannot install its two declared private packages, so this release-only change does not alter manifests or dependencies; fresh hosted qualification remains required."
    }
  ]
}
```

The qualified candidate and both failed publication attempts remain immutable.
This repair does not authorize publication until its own complete hosted gates
pass and a wholly new protected run selects preparation 43408364134.
