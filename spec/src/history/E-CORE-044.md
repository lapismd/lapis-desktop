# Default-workspace native queue adoption

```json
{
  "id": "E-CORE-044",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.10"],
  "requirements": [
    "LD-MIG-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-006",
    "LD-GOV-008",
    "LD-GOV-010"
  ],
  "contractReview": "Adopt immutable qualified Desktop151e4f12 into the clean default workspace, preserving exact product/catalog/native source pins and the complete qualified public archive cohort. Metadata-only adoption checks its own documents and transfers product evidence only with byte equality; no product gate is replaced.",
  "milestoneReview": "M16.10 remains Done through E-CORE-043. Default source adoption and normal ignored public-archive installation retain all31 archive hashes and117 active import routes with portable manifests/lockfiles restored. Current ledger/roadmap now identify default adoption and separate Notes R4.1.6 native/hosted provider work. Broader M10/default/visual/release gates remain separate.",
  "versions": {
    "defaultBefore": "183cbced",
    "defaultParentBefore": "6c6243202e05b04e57de0a737829ca3a48e3ed3e",
    "qualifiedDesktop": "151e4f12bd7742b20df5ad0466ab1b25adac3b10",
    "qualifiedProduct": "e3d1b54561ddd4eeba6977de895b72c08c8b773e",
    "nativeCore": "0eec081174c3314a58636fecc4a0c227e1f30acf",
    "agentUiSource": "2bee4ed673f4fbb82b721268091d75b2392e95d0",
    "agentUiArchive": "58bd5870d6d67bd60a1d1c8724eb31d4359c3d923eb673474f6818b9e7f90b95",
    "apiArchive": "ef8170a6f77d811f1d62c3c567dc1b07a8c30418ec3fce538f4e3838a09c1cfc",
    "appProfileArchive": "fe45dedb08125257a84e57933fcddc9685fa6d559a41821a73b0e654608e2068"
  },
  "files": [
    "MIGRATION.md",
    "PLAN.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/core/index.md",
    "spec/src/history/E-CORE-044.md"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Clean default source adoption",
      "command": "jj st; jj diff --from6c624320 --to183cbced --name-only; jj new151e4f12; jj st",
      "result": "pass",
      "failures": 0,
      "detail": "Default was clean and byte-identical to prior qualified parent6c624320. New default change starts directly on immutable151e; no overlapping work or product merge. Other workspaces remain intact."
    },
    {
      "name": "Normal default public archive overlay refresh",
      "command": "Owned Storybook stop; .local/r4-queue-adoption/install.mjs; official projected/frozen pnpm install; verifyArchiveResolution",
      "result": "pass",
      "failures": 0,
      "detail": "No7480 listener was running. Reused the existing R3 ignored normal overlay pattern with short staged archive names, all31 exact qualified packages and117 transitive import routes verified. Both tracked package/lock byte hashes match before/after; no source aliases, node_modules patch or published range change. This selective adoption does not claim registry-only/latest-head freshness."
    },
    {
      "name": "Qualified product and input equality",
      "command": "Compare default source against151e; selected native pins and manifest/lock/Cargo files; installed31 public hashes",
      "result": "pass",
      "failures": 0,
      "detail": "Only these documentary adoption files differ; all product, catalog, scripts, runtime/native inputs and public archive identities remain exact. Transfer E043 full2124catalog/544Node/744AI/258LinuxRust/55MacHost/5actualNative and both complete-asset bundle proofs without another unchanged product run."
    },
    {
      "name": "Default-adoption documentary qualification",
      "command": "final-docs Docker 5e373de8-bd4b-457e-9e41-c12d1abdcb33 at184c1197; final metadata formatter/progress/spec check",
      "result": "pass",
      "failures": 0,
      "detail": "Progress58/tasks321evidence, mapped canonical/mdBook/spec-first, Rust formatting, architecture/App ownership and113-family parity pass. Formatting retains only accepted byte-identical immutable E-AI-109. Final evidence/timestamp/prose-only changes receive the same document checks; no unchanged catalog/native product lane is repeated."
    }
  ],
  "completedGates": {
    "M16.10": "Explicit native queue selection routes generated accept/read/Stop/cancel/resume through the admitted Core owner; complete trusted recipient and mode capture, exact identities, uncertain observation, existing screen controls and cold no-replay recovery pass source/public, quiet/catalog and actual native gates without renderer scheduling or ordinary default activation."
  }
}
```
