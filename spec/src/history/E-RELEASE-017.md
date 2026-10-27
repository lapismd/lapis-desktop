# Approved Design Core publication

```json
{
  "id": "E-RELEASE-017",
  "date": "2026-10-21",
  "tasks": ["M11", "M12"],
  "requirements": [
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-MIG-002",
    "LD-MIG-003"
  ],
  "revision": "enclosing Jujutsu change",
  "result": "pass",
  "contractReview": "The user explicitly requests auditing Design Core for unmerged workspace data and releasing it next. The release retains DC-PKG-009/011 registry-only dependencies, protected integration, independent package qualification, immutable publication and existing KaTeX-only audit acceptance. No additional risk exception or screenshot test is introduced.",
  "milestoneReview": "M11 and M12 remain Planned. Library publication does not qualify Desktop installation, signing, upgrade, rollback or Deno retirement. Active Desktop work is preserved in its separate default workspace.",
  "files": [
    "RELEASE.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-RELEASE-017.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "versions": {
    "designCore": "0.6.0",
    "mira": "0.1.0",
    "visualDelta": "0.0.9"
  },
  "source": {
    "reviewedHead": "027c17574e8e530a1c13297108daf942f03d14c5",
    "mergeCommit": "5bae94975c9923d15f1bcf52609958fa28b82ab9",
    "pr": "https://github.com/lapismd/design-core/pull/31",
    "protectedCi": "https://github.com/lapismd/design-core/actions/runs/39664953890",
    "releaseRun": "https://github.com/lapismd/design-core/actions/runs/39667451267",
    "mainCi": "https://github.com/lapismd/design-core/actions/runs/39667451520",
    "ownerEvidencePr": "https://github.com/lapismd/design-core/pull/32",
    "ownerEvidenceHead": "5f77505d9ebac2ca432ca6466bca391dbe1b8b37",
    "ownerEvidenceCi": "https://github.com/lapismd/design-core/actions/runs/39672509770",
    "ownerEvidenceMerge": "c82fcb71a89c7f10b7f420cbf1afc811513afae0"
  },
  "runs": [
    {
      "name": "workspace-and-public-source-recheck",
      "command": "jj st; jj workspace list; git worktree list --porcelain; jj git fetch --remote codex-https; review October 18 reconciliation and archive inventory; gh pr/run/npm queries",
      "result": "pass",
      "failures": 0,
      "note": "Only default is active and clean. Historical secondary JJ and generator source is reconciled, and tracked archive bookmarks remain present. The October 18 record documents retaining recovery copies then; current Trash contents are unverified because macOS blocks directory listing. No new workspace deletion is performed. No open Dependabot PR exists."
    },
    {
      "name": "protected-source-qualification-and-merge",
      "command": "gh run view 39664953890; inspect final Storybook/Shadcn logs; gh pr merge 31 --merge --match-head-commit 027c17574e8e530a1c13297108daf942f03d14c5; jj git fetch; jj diff --from 027c1757 --to 5bae9497 --summary; jj new main",
      "result": "pass",
      "failures": 0,
      "note": "All eleven protected checks pass. Storybook interaction/axe: 897/897 across 258 files. Shadcn pointer: 152 pass and one platform-specific skip. Both source audits pass. PR #31 merges at 5bae9497 with identical tested tree. Automatic merge was unavailable; the attempted --auto request changed no state, and ordinary protected merge succeeded after every check passed. Local main and default now include the consolidated source."
    },
    {
      "name": "hosted-artifact-and-approved-publication",
      "command": "gh run view/download 39667451267; inspect hosted release manifest/tarball with design-core-wave4-inspect.py; compare all hosted/local payloads and permissions; checkPackedAudit; approve pending npm-production deployment 7236284840",
      "result": "pass",
      "failures": 0,
      "note": "Exact-main CI passes all eleven checks; hosted release passes all five jobs. Artifact checksums/source, 4184 files, 292 export targets, portable dependencies and license/font/syntax notices pass. Every file and permission matches the qualified local archive, despite different tar encoding/compression. Existing KaTeX-only low acceptance covers six propagated package entries. The first manual audit-evaluation expression had an extra closing parenthesis; corrected invocation passes. User publication authorization is explicit; protected OIDC publishes the inspected archive without credentials in the checkout."
    },
    {
      "name": "public-registry-identity-and-provenance",
      "command": "Read publication receipt; design-core-wave4-registry-verify.py against public npm; download npm-signatures artifact; gh release view; inspect public tag ref and npm latest",
      "result": "pass",
      "failures": 0,
      "note": "npm publication succeeds at 20:18:07 UTC. Initial public metadata requests return 404/old latest during processing; subsequent verification passes without a second publication or moved tag. Registry archive bytes, SHA-256/SHA-512/SHA-1, SLSA v1 subject and source match the approved manifest. Two package signatures are present; hosted verification checks 45 graph identities with zero invalid or missing entries. Public stable GitHub release at 20:21:18 UTC and tag point to 5bae9497. npm latest is 0.6.0."
    },
    {
      "name": "cold-public-consumer",
      "command": "Pass absolute path of independently downloaded public archive to checkPublicPackageRuntime from scripts/check-public-package-runtime.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Fresh installed consumer types and cold development/production CSS, fonts, focus, themes, token overrides, TagList overflow/actions, reactive CodeEditor and bound Composer Input lifecycle pass without Tailwind tooling or Svelte diagnostics. Log /private/tmp/design-core-wave4-public-consumer.log; public inspection/archive/signatures retained under /private/tmp/design-core-wave4-hosted.htsuGQ. Actual application dependency adoption remains in later waves."
    },
    {
      "name": "owner-documentation",
      "command": "pnpm exec prettier --check spec/records/2026-10-21-wave-four-publication.md; pnpm spec:check; jj commit; explicit HTTPS bookmark push; gh pr create and attach #32",
      "result": "pass",
      "failures": 0,
      "note": "The fresh completion record passes formatting and all three source spec lanes. Evidence commit 011478c9f4237247048a8b1dec16d34e425d175e changes only Markdown; no broad product lanes run locally for it. Protected documentation CI 39669948552 remains in progress; its integration is tracked separately from the completed immutable release."
    },
    {
      "name": "coordinator-evidence-status-before",
      "command": "node scripts/progress.mjs --write; default Desktop Prettier over explicit coordinator files; spec-validator check; node scripts/progress.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Initial final-status validation rejects pass while the record still lists pending documentation integration and later-wave gates. The record remains pending until owner #32 merges; later-wave scope moves to deferred rather than this completed library gate. This is a coordinator status-model error; immutable release identity and public consumer checks remain passing."
    },
    {
      "name": "owner-release-summary-count-correction",
      "command": "Compare live release job list with .github/workflows/release.yml; stop own pending merge watcher; correct completion record/PR text from six to five jobs; pnpm exec prettier --check; pnpm spec:check; jj commit and push c367cd05",
      "result": "pass",
      "failures": 0,
      "note": "Self-review finds one factual job-count typo in the completion notes. All five actual release jobs are green; correction affects only Markdown and the PR description. Artifact/source identity, package publication, signatures and public consumer remain unchanged. The predecessor merge watcher is stopped before any merge. Fresh protected CI on c367cd05 replaces the prior documentation run without waiving a required gate."
    },
    {
      "name": "historical-recovery-archive-probe",
      "command": "Probe the recorded October 18 recovery path with pathlib/stat; attempt a narrowly scoped Trash listing; inspect retained retirement metadata and JJ archive bookmarks",
      "result": "fail",
      "failures": 1,
      "note": "The old recovery path does not resolve through direct stat; listing its Trash parent returns macOS EPERM. Current archive availability/contents cannot be established, and this does not prove deletion. Correct the fresh completion record from a present-tense recovery guarantee to the verified historical retention record plus current tracked bookmarks. No archive is moved or deleted. Active JJ/Git workspace registries still contain only clean default, and consolidated tracked source is already public on main. This historical recovery-copy limitation does not alter the completed package release checks."
    },
    {
      "name": "owner-recovery-scope-clarification",
      "command": "Correct fresh completion record and PR description; pnpm exec prettier --write; pnpm spec:check; jj commit and push 5f77505d",
      "result": "pass",
      "failures": 0,
      "note": "Source and both runtime package candidates are unchanged. Fresh completion notes distinguish the historical retirement record/current tracked bookmarks from recovery copies that macOS does not permit revalidating. Source formatting and all three spec lanes pass. Protected final documentation CI 39672509770 runs on 5f77505d; previous documentation runs 39669948552 and 39671582752 are superseded/cancelled, not passing claims."
    },
    {
      "name": "qualified-owner-evidence-integration",
      "command": "gh run watch 39672509770 --exit-status; gh pr merge 32 --merge --match-head-commit 5f77505d9ebac2ca432ca6466bca391dbe1b8b37; jj git fetch; require empty working copy; jj new main; recheck JJ/Git workspace registries and main ancestry",
      "result": "pass",
      "failures": 0,
      "note": "Final documentation CI passes all eleven required checks on exact head 5f77505d. Protected #32 merges at c82fcb71a89c7f10b7f420cbf1afc811513afae0; its tree matches the tested documentation head. Released source 027c1757 and completion head 5f77505d are both ancestors of main. Only clean default remains in JJ and Git workspace registries. The immutable package/tag source remains 5bae9497; documentation integration creates no new package version. Historical Trash-copy availability remains explicitly unverified; tracked source reconciliation and archive bookmarks are verified."
    },
    {
      "name": "final-coordinator-document-qualification",
      "command": "node scripts/progress.mjs --write; existing default Desktop Prettier over the seven explicit coordinator paths; existing spec-validator check; node scripts/progress.mjs; jj diff/status and explicit coordinator commit",
      "result": "pass",
      "failures": 0,
      "note": "Final completion metadata selects the successful library evidence without marking M11/M12 complete. All original application gates and later-wave approvals remain deferred. The coordinator formatter/spec/progress checks are run before committing; no Desktop product/native test or application restart is needed for this Markdown-only slice."
    }
  ],
  "remaining": [],
  "artifacts": {
    "name": "@lapismd/design-core@0.6.0",
    "artifactId": 12378706645,
    "signatureArtifactId": 12378503272,
    "bytes": 1755798,
    "files": 4184,
    "exportTargets": 292,
    "sha256": "240a578240d2055a922c92f15a17f6aeb2b8b69a9aad04f78fd34cee6d013a2b",
    "integrity": "sha512-xLZssOtMmjptLwIX+DondoV6SDR4bKxSumLBxCseq0WimssAB4/Y+SfcppI2TAcc8wUCVHplgTEAU5yK9c2PbA==",
    "manifestSha256": "372c8c8c6532e7c2ee44042cad7dbd9ecd27d7b64028b8520840c59e580418fc",
    "release": "https://github.com/lapismd/design-core/releases/tag/design-core%400.6.0",
    "sigstoreLogIndex": 3363421274
  },
  "deferred": [
    "Wave 5 Lapis Notes integration/publication and later waves retain separate approvals. Original Desktop installation/upgrade/rollback and Deno cutover gates remain unchanged and are outside this library completion record."
  ],
  "nextWavePreflight": {
    "repository": "lapismd/lapis-notes",
    "mode": "read-only",
    "defaultParent": "ce1a786e",
    "localMainBookmark": "257c3bd4",
    "githubMain": "eee666941724ef94d9aaef3204b687dc892fce42",
    "requiredApi": "cae795d0aefe8a1d97dd36af70a487c07eeecd62",
    "requiredApiInDefault": true,
    "openPullRequests": [37, 38, 34],
    "commands": "Read AGENTS.md; jj st/workspace list/log/remotes; jj ancestry queries for cae795d0 in default and reusable-history; gh main/PR reads",
    "note": "Default is clean and already contains the required API change, so the October 19 tracker baseline is stale. Its default parent and local main bookmark are distinct; GitHub integration must be refreshed/reconciled before source work. Preserve existing Version Packages #37 and inspect overlapping dependency-image #38/#34. No open Dependabot proposal appears. No Lapis Notes file, bookmark, remote or release is changed by this preflight."
  },
  "limitations": [
    "Historical ignored/untracked recovery copies under Trash cannot currently be revalidated because macOS blocks directory listing; tracked archived heads and consolidated release source are verified.",
    "The existing low-severity KaTeX-only packed-consumer exception remains; source workspace audits are clean."
  ]
}
```
