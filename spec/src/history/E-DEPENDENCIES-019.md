# Preserve new main native collection in held dependency adoption

```json
{
  "id": "E-DEPENDENCIES-019",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "blocked",
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-008"
  ],
  "files": [
    ".github/dependency-automation/development-high-proposal.json",
    "docs/proposals/desktop-picomatch-development.md",
    "spec/src/backlog.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "spec/src/history/E-DEPENDENCIES-019.md",
    "spec/src/verification-notes.md"
  ],
  "contractReview": "Resolve the actual ed03 main integration while preserving new Core cold-chat collection, native family/scope coverage, immutable E-RETIRE-013 and E-DEPENDENCIES-017/018. Rebase only the two existing PR source/evidence commits. No runtime, private/native pin, archive/export, collector, policy or security authority changes. New exact proposal stays disabled, null authority/approval, operational projections empty. Append renewed exact source evidence; historical receipts retain original identities.",
  "acceptanceReview": "Reproduce one actual history-navigation rebase conflict and retain both evidence links. Run original affected independent guards plus new native family/fixture governance before full cold local QA. Independently compare all21bound inputs and product/UI/archive/policy bytes against qualified f521, rather than copying recorded digests. Fresh new-head hosted allUI/axe and both Linux native gates remain Root-owned and required; historical hosted/cold receipts are source-equivalent context, not a new-head hosted binding or activation approval.",
  "versions": {
    "base": "ed03f5ee585469b0e319535ae95cb6e8bd064282",
    "previousHead": "f521ef1d8337ae15fcc1b6646f58c2ff4d90ad37",
    "sourceSha": "aba2cabe20568d238b278851e6b0f81dd2546892",
    "snapshot": "4f06e1834c08fbf399bc5b8393517ba8596ffc40",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1",
    "image": "sha256:36d8f2ab59683921ee66ef0f48b3dfa62c921dd958dd1f13342ec765ff6082d4",
    "sourceInputsSha256": "c0e32e951577f250f6147bb891c3c6dddad2347c043d5d9e687f046875c0837a",
    "descriptorSha256": "18ec13aa4cbaf0eac8db6af508dddf83aacec65cd5d8a43f68d9ded44d0df9a4",
    "shapeSha256": "c0c86889045958d5ae1a4fbc4822c55aae6af01bcfabe907ee930ae7307be881"
  },
  "runs": [
    {
      "name": "Exact integration before",
      "command": "jj rebase -s 4537add5 -o main@origin; jj resolve --list",
      "result": "fail",
      "failures": 1,
      "detail": "Actual fetched remote main ed03, not cached PR base2015. One conflict: spec/src/navigation/history-02.md; no manifest/lock/policy conflict."
    },
    {
      "name": "Exact integration after",
      "command": "jj resolve --list; jj diff --from f521ef1d --to candidate --summary",
      "result": "pass",
      "failures": 0,
      "detail": "No conflicts. Preserve both newmain E-RETIRE-013 and held adoption E017/E018 links. All10newmain paths retained; both committed adoption receipts byte-identical."
    },
    {
      "name": "Fresh doctor and QMD discovery",
      "command": "pnpm exec spec-validator doctor --json; pnpm spec:search \"dependency automation E-DEPENDENCIES-017 E-DEPENDENCIES-018\"; pnpm spec:search --scope backlog \"dependency automation\"",
      "result": "pass",
      "failures": 0,
      "detail": "Doctor ok with10passes and existing portable-script-alias warning. System QMD/native index loads and semantic current/backlog results returned before spec edits. Published Deno-free0.2.1 already exact in manifest/lock."
    },
    {
      "name": "Independently recomputed impact binding",
      "command": "21source SHA256 inputs; checkArtifactProjection(); jj diff qualified f521 to integrated candidate across complete product/runtime/archive/policy inputs",
      "result": "pass",
      "failures": 0,
      "detail": "21digest c0e32,descriptor18ec,shapec0c868 unchanged. Entire src/src-tauri/catalog/.storybook/patches,manifest/workspace/lock,CI/private/nativepins,archive install/export helpers,collector/policy bytes equal. Newmain changes only native opt-in collection/inventory/governance test and docs. No new native execution or app/profile installation."
    },
    {
      "name": "First complete integration check",
      "command": "pnpm check in bounded cold worker40650e86",
      "result": "fail",
      "failures": 1,
      "detail": "Canonical verification.md is32833bytes after combining legitimate main native-collection and PR adoption evidence,65over32768limit. No product assertion failure. Preserve original log; move held-adoption verification paragraphs intact to dedicated verification/dependency-automation.md and keep link in original. Repeat same fullcheck in fresh frozen worker."
    },
    {
      "name": "Complete projected lock comparison corrects initial partial diagnosis",
      "command": "Recursive parsed YAML comparison of prior actual-installed-lock and new projected lock",
      "result": "fail",
      "failures": 1,
      "detail": "Initial assert equal except deprecations fails: besides27removed deprecation annotations, minimatch10.2.6 now selects brace-expansion5.0.12 instead of5.0.13, adding its package/snapshot. Portable source lock unchanged. Preserve exact diff report and fresh audit binding; do not infer prior installed graph equality or weaken any assertion. Full fresh QA uses actual new projection; finalhead hosted allUI/axe remains required."
    },
    {
      "name": "First document split qualification",
      "command": "pnpm check in fresh bounded worker",
      "result": "fail",
      "failures": 5,
      "detail": "New verification subpage requires SUMMARY registration and verification table;3relative links also fail. No product tests reached. Correct by preserving narrative in existing registered verification-notes.md at held-dependency-automation anchor, not by weakening document rules. Source failed logs retained."
    },
    {
      "name": "Exact affected governance and native collection replay",
      "command": "node --import tsx --test: artifact-projection,dependency-automation-intake,dependency-intake-vcs,dependency-note-consumption,projected-audit-admission,projected-audit-context,dependency-automation-completion,validation-native,native-families,native-scope-inventory,native-fixture-portability",
      "result": "pass",
      "failures": 0,
      "detail": "168pass/0fail including exact Core cold-chat opt-in services collection and all independent source,VCS,proposal,metadata observer and read-only sibling controls. Fresh4CPU/12GiB/2GiBshm/dropALL Docker; no native WebView/provider."
    },
    {
      "name": "Fresh actual archive and audit context",
      "command": "Eight verified archive frozeninstall; public archive export controls; actual34installedroutes; all/prod audits; source-owned projectedAuditContext",
      "result": "pass",
      "failures": 0,
      "detail": "Sourceaba2/21inputs digestc0e32,manifestbbc0/projectedlockc441/archives7254; rawMOD3/HIGH2,production0. Legacy evaluator gateErrors[] is observed behavior only; authority independently unestablished, no grant. All8native source tars exactly equal original cold2015source qualification."
    },
    {
      "name": "Actual installed projection differences and public runtime equality",
      "command": "Complete parsed prior/final projected lock diff; npm pack --ignore-scripts publishedAgentUI0.2.8/0.2.9 and bytewise archive comparison",
      "result": "pass",
      "failures": 0,
      "detail": "Final projected lock has27fewer registry deprecation annotations, development minimatch10.2.6/brace-expansion5.0.13to5.0.12, and privateProfile AgentUI0.2.8to0.2.9. All333published archive files match except package.json version and tighter Core^0.13.4to^0.13.5; selectedCore0.13.5 and every runtime/dist byte equal. No prior installed lock identity claim. Source-equivalent oldcoldUI context retained; fresh finalhead hosted fullUI/axe still required."
    },
    {
      "name": "Complete cold integrated qualification",
      "command": "Fresh bounded Docker worker: pnpm check; pnpm test; pnpm build; pnpm spec:check; pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "All9stages including focused/archive/audit pass on frozen source4f06e1834c08fbf399bc5b8393517ba8596ffc40. Fullcheck0errors/warnings,116parityfamilies/0findings,source audits,ordinary+e2e strictClippy,format. Fulltest951Node+748AI/153files+290Rustpasses,2existingignored. Renderer build passes with existing chunkwarning. Fivecanonical lanes,7validators,583chapters/134requirements and521evidence pass. This exact pnpmcheck clears original budget/split findings. No local fullUI rerun: product/UI runtime bytes and selectedCore equal; freshfinalhead hostedfullUI/axe remains mandatory."
    },
    {
      "name": "Actual-main-first acceptance",
      "command": "pnpm exec spec-validator first --base ed03f5ee585469b0e319535ae95cb6e8bd064282 --head exactIntegratedSnapshot --json",
      "result": "pass",
      "failures": 0,
      "detail": "32protectedfiles/3canonicalchapters pass. Rebased source and evidence commits are unsigned; final metadata is checked again before commit. No historical E017/E018/E-RETIRE-013 receipt is modified."
    }
  ],
  "remaining": [
    "Root must qualify final-head fresh hosted full source,allUI/axe and bothLinux checks/reviews before ordinary merge.",
    "Exact trusted hosted source/archive/audit binding, independent legacy security authority reconciliation, main/default and scheduled health plus held metadata completion callback remain required before any activation.",
    "Disabled/nullauthority/nullapprovedAt/emptyoperationalprojections and both central empty live capability maps remain held. CurrentSDK0.2.1 no-op does not prove future update.",
    "Native macOS/headed/model/provider/distribution and visual baseline authority remain separate."
  ],
  "evidenceDirectory": "/home/steve/.cache/lapis-rollout-20261117/desktop-ed03-integration",
  "localProjectionContext": {
    "sourceSha": "aba2cabe20568d238b278851e6b0f81dd2546892",
    "sourceInputsSha256": "c0e32e951577f250f6147bb891c3c6dddad2347c043d5d9e687f046875c0837a",
    "portableManifestSha256": "5249c6d2c7f9ff79f9f948cb118600e762aaf9594ed148e2985003c87532b746",
    "portableLockSha256": "33b1fc7324a63cd2a4e4ee5c16f9f9381599cd9c568d633ea38d2366c1c8de37",
    "workspaceSha256": "3c48dadf4e7557172f8ea08f932195d3c49dda566ec6ad927ffdb0261132ad1d",
    "sourceInventorySha256": "b3a598669587eb8de3dfb66d7ce55b009e72f95a42b62171be95bd66c8cd16b5",
    "projection": {
      "platform": "linux-x64",
      "manifestSha256": "bbc0e1a9572e95d52d3fb49812ba4e0e36b9a2df66c5a21093a76b98003f1b53",
      "lockSha256": "c44173ee58dc3be20fbe15a1c33ce7a90a33142a1c3038e59e34afb3c8d393ea",
      "archivesSha256": "725454cc4c1b427a2007d04d2ea9b1b50f569e1fdf502179edb6afdd94d66ea8"
    },
    "recordPresent": true,
    "recordSha256": "badadf039983216f12fb09a1cbe29962c7ce4853df295e27e4a3ac71910092c2"
  },
  "rawFullCounts": {
    "info": 0,
    "low": 0,
    "moderate": 3,
    "high": 2,
    "critical": 0
  },
  "rawProductionCounts": {
    "info": 0,
    "low": 0,
    "moderate": 0,
    "high": 0,
    "critical": 0
  }
}
```
