# Publish shared Repository remotes in Preview rc.2

```json
{
  "id": "E-RELEASE-024",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "version": "2026.31.6-rc.2",
    "sourceCommit": "c2971126269530d67d3b3a88a2f5e76f9d4cec90",
    "pr": 38,
    "prCI": 43792696237,
    "fullMainCI": 43797010305,
    "candidateRun": 43802352633,
    "publicationRun": 43809171888,
    "history": "0.5.1",
    "appProfile": "0.2.2",
    "server": "2.3.0",
    "hostedNode": "24.15.0",
    "specValidator": "0.2.0",
    "tapFixCommit": "34a0d7518e2026d7693eefc4eca6c36019ea8abc",
    "tapFixPR": 12,
    "tapFixPRCI": 43810697210,
    "tapFixMainCI": 43811354204,
    "tapUpdatePR": 11,
    "tapUpdateCI": 43811434675,
    "tapUpdateMerge": "37ffee7e172be5c7fae49ed96e51b8c24bb0fcbd",
    "publicTapCI": 43812136817
  },
  "requirements": [
    "LD-GOV-002",
    "LD-REL-001",
    "LD-REL-002",
    "LD-REL-003",
    "LD-REL-004",
    "LD-REL-005",
    "LD-REL-006",
    "LD-GOV-004"
  ],
  "files": [
    "docs/desktop-release.md",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/backlog/distribution.md",
    "spec/src/history/E-RELEASE-024.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification-notes.md",
    ".github/workflows/release-desktop.yml",
    "tests/governance/release-workflow.test.mjs"
  ],
  "contractReview": "Promote the source-bound ordinary three-platform candidate without rebuilding. Full exact-main CI, scoped protected-environment approval, complete asset inventories, archive hashes and both Linux Homebrew lifecycles remain required. Desktop candidate macOS evidence remains build/audit only; no runtime or feature qualification is inferred. Existing quarantines, limitations, private AI provenance, release protections and stable-channel identity remain unchanged. Follow-up release/recovery callers pin the checked source-owned tap repair and pass only the contents-read workflow token before separate App write authorization. The API verifier refuses authenticated redirects and never sends a token to public downloads. These pipeline changes do not rebuild or replace the published app.",
  "acceptanceReview": "PR #38 merges after all required checks. Full exact-main CI, three ordinary candidate builds, both Linux Homebrew upgrade/lifecycle journeys and sealing pass on c2971126. Protected publication promotes the same candidate; all 16 public downloads independently match it byte-for-byte. After the source-owned anonymous-API repair, generated tap PR #11 passes all four gates and merges. Official public-cask CI 43812136817 passes; downloaded public receipts and live cask/manifest bind rc.2 to the same source and hashes. Local caller follow-up validation passes; checked-head CI remains the subsequent PR merge gate.",
  "remaining": [
    "At local recording, checked-head CI for this caller/evidence follow-up must pass before merge. Live external forge/device, two-device and older native/provider gaps remain in their owning backlog."
  ],
  "runs": [
    {
      "name": "Exact-head PR qualification",
      "command": "GitHub Actions run 43792696237",
      "result": "pass",
      "failures": 0,
      "detail": "Required source, unit, four catalog interaction/accessibility shards, audits and Linux native jobs pass before merge c2971126. E-REPO-058/059 retain the complete original local and cold-host evidence."
    },
    {
      "name": "Exact-main full release qualification",
      "command": "gh workflow run ci.yml --repo lapismd/lapis-desktop --ref main -F full=true; run 43797010305",
      "result": "pass",
      "failures": 0,
      "detail": "All 20 source-authority jobs recorded by the candidate pass, including Full source qualification, all dependency platforms, four catalog shards, Native bundle, both Linux targets and Validate. Duplicate ordinary push run 43796920026 was deliberately superseded and cancelled; it is not a failed product invocation or release authority."
    },
    {
      "name": "Three-platform candidate and Linux lifecycles",
      "command": "GitHub Actions run 43802352633; operation=prepare, publish=false",
      "result": "pass",
      "failures": 0,
      "detail": "Ordinary macOS ARM64 ZIP and Linux ARM64/x64 archives build and audit successfully. Both Linux receipts bind exact archive hashes to install, upgrade from rc.1, reinstall, uninstall, profile/vault retention and native launch/quit. Complete candidate is sealed after those checks."
    },
    {
      "name": "Protected immutable promotion",
      "command": "GitHub Actions run 43809171888; operation=publish-candidate, candidate_run_id=43802352633, publish=true",
      "result": "pass",
      "failures": 0,
      "detail": "Standing user release authorization approves only returned desktop-preview-release environment 25935070491 after independent sealed-byte verification. Publication and App-authored tap handoff pass without rebuilding."
    },
    {
      "name": "Production download and tag verification",
      "command": "gh release download desktop-v2026.31.6-rc.2; verifyCandidate(publicDirectory, c2971126); compare every file to sealed candidate",
      "result": "pass",
      "failures": 0,
      "detail": "Source tag targets c2971126269530d67d3b3a88a2f5e76f9d4cec90. All 16 assets, checksum inventory, per-target reports and Linux receipts verify; every downloaded byte matches the sealed candidate. Release remains a public prerelease rather than latest stable."
    },
    {
      "name": "Initial local documentation baseline invocation",
      "command": "pnpm check:evidence",
      "result": "fail",
      "failures": 1,
      "detail": "The invocation omitted the declared private AI archive list and stopped at frozen installation before evidence validation: @lapismd/ai was absent from the portable lock projection. No product/source failure and no gate waiver; the corrected exact lane follows."
    },
    {
      "name": "Documentation baseline with approved private prerequisite",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/remotes-private-prerequisite/runner-archives-final.json pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "All 479 existing records pass in the declared Docker worker with the checksum-verified private AI archive. Latest registry validator remains 0.2.0; doctor and semantic QMD search pass with the existing alias warning."
    },
    {
      "name": "Original tap update metadata failure",
      "command": "GitHub Actions run 43809436113, job 133107883966",
      "result": "fail",
      "failures": 1,
      "detail": "The existing stable installer passes, then anonymous release metadata returns HTTP 403 before preview installation. ARM64 and macOS jobs pass. This invocation is retained and never relabelled; no bad archive or preview runtime is established by it."
    },
    {
      "name": "Source-owned tap repair and fresh update qualification",
      "command": "Tap PR #12 CI 43810697210, main CI 43811354204; updated PR #11 CI 43811434675",
      "result": "pass",
      "failures": 0,
      "detail": "The exact stable/preview token regression first fails 2/2 and then passes 2/2. All 25 tap units, syntax/generated-cask and formatting checks pass. Both the source repair and new generated-update head pass all four hosted gates. PR #11 merges after incorporating checked main 34a0d751. Live cask and manifest equal the published release; official public-cask acceptance remains separately tracked."
    },
    {
      "name": "Desktop metadata caller before repair",
      "command": "node --test --test-name-pattern='tap release verification uses' tests/governance/release-workflow.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "The release/recovery metadata step lacks its read-only GITHUB_TOKEN environment. This exact missing admission fails before the caller change."
    },
    {
      "name": "Desktop metadata caller and complete release family after repair",
      "command": "node --test tests/governance/release-*.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "The exact original case passes 1/1 and all 27 release-governance cases pass. Both metadata callers use the workflow read token before creating the separate write-scoped App token and consume immutable checked tap revision 34a0d751."
    },
    {
      "name": "Direct-host governance diagnostic",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "fail",
      "failures": 8,
      "detail": "369 pass/8 fail/1 skip of 378. Seven temporary Git-commit fixtures hit local 1Password signing timeouts; the tool artifact case requires colocated Git provenance unavailable in the host JJ workspace. No global signing settings, OS grants, assertion or timeout is changed. The declared Docker lane below resolves the environment boundary."
    },
    {
      "name": "Complete supported Docker tests",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/remotes-private-prerequisite/runner-archives-final.json pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "775 Node governance/renderer cases, 746 AI cases across 152 files, and 258 Rust cases pass. Two existing Rust helper ignores and 55 Rust summaries remain. Docker supplies isolated signing and colocated source provenance; there is no OS approval dependency."
    },
    {
      "name": "Initial follow-up full check coverage refusal",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/remotes-private-prerequisite/runner-archives-final.json pnpm check",
      "result": "fail",
      "failures": 2,
      "detail": "Specification validation refuses fresh evidence coverage for the changed release workflow and regression file. Adding both paths and the actual regression history to this fresh receipt preserves the gate; the exact complete check is rerun."
    },
    {
      "name": "Official public-cask acceptance",
      "command": "GitHub Actions run 43812136817; download homebrew-installation-* artifacts and compare public receipts/live cask/manifest",
      "result": "pass",
      "failures": 0,
      "detail": "All four tap gates pass after merge 37ffee7e. Official public-install steps execute successfully; receipt version, source, distribution=public, archive hash, install/reinstall/uninstall, audit and retained data agree with rc.2. Public installation reports upgrade not-run because it is fresh; both Linux candidate receipts independently prove rc.1 upgrade. Desktop candidate macOS qualification remains build/audit only and is not inferred from Linux or the tap owner checks."
    },
    {
      "name": "Final complete Docker check",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/remotes-private-prerequisite/runner-archives-final.json pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Exact refused lane passes after fresh evidence coverage is added: 116 story families, specification validation, zero Svelte/type findings, ordinary/e2e strict Clippy and formatting pass. Existing source/App ownership boundaries remain intact."
    },
    {
      "name": "Final Docker renderer build",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/remotes-private-prerequisite/runner-archives-final.json pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Production Vite renderer build passes. Existing annotation, empty-chunk and size warnings remain; no build warning threshold is changed."
    },
    {
      "name": "Follow-up specification status classification",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/remotes-private-prerequisite/runner-archives-final.json pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "The validator rejects result=pass with an outstanding checked-head merge gate. Keeping this source/caller receipt pending preserves the actual gate; publication success and preceding evidence remain unchanged. The exact lane is rerun after this classification correction."
    },
    {
      "name": "Follow-up evidence status classification",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/remotes-private-prerequisite/runner-archives-final.json pnpm check:evidence",
      "result": "fail",
      "failures": 1,
      "detail": "The validator rejects result=pass with an outstanding checked-head merge gate. Keeping this source/caller receipt pending preserves the actual gate; publication success and preceding evidence remain unchanged. The exact lane is rerun after this classification correction."
    },
    {
      "name": "Final specification and evidence checks after status correction",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/remotes-private-prerequisite/runner-archives-final.json pnpm spec:check; pnpm check:evidence with the same archive environment",
      "result": "pass",
      "failures": 0,
      "detail": "All four specification lanes and all 480 evidence records pass. The receipt stays pending specifically for the subsequent checked-head merge gate. Current governance and distribution backlog remain within 400 lines, the verification table is unchanged, and old committed receipts remain immutable."
    }
  ]
}
```

## Immutable published archives

| Target      |     Bytes | SHA-256                                                            |
| ----------- | --------: | ------------------------------------------------------------------ |
| macOS ARM64 |  97477272 | `84a676abc0ef3793ec01ad92d255f0229cc944057a9e2577446ea0991f2fb352` |
| Linux ARM64 | 110472081 | `b26509ead8f0e4ee5121ad31b0f832ad51c6177bdd5f348404bab26a99fe2ec7` |
| Linux x64   | 110424338 | `df72557bb778ed00add8799bda22db07b3dbbf72a6ddad037b907d2beed1be4c` |

[Published preview](https://github.com/lapismd/lapis-desktop/releases/tag/desktop-v2026.31.6-rc.2).
Earlier CLI candidate E-CLI-007 remains bound to its own source and bytes; it
was not substituted for this remotes candidate. E-REPO-058/059 preserve original
failures, complete catalog counts and separate actual OS/HTTPS/SSH evidence.

The manual remotes feature uses released History 0.5.1 and Profile 0.2.2. Only
the documented private AI public-build archive remains; this is not a
registry-only claim. Live external forge/device sign-in, two-device sync and
older native/provider gaps remain in their owning backlog. No migration, visual
baseline, timeout, assertion or quarantine policy changes.
