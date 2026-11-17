# Integrate current Sync planning and full-run contracts

```json
{
  "id": "E-SKILL-004",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-SKILL-001", "LD-GOV-002", "LD-GOV-004"],
  "files": [
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-SKILL-004.md",
    "spec/src/current/skills.md"
  ],
  "versions": {
    "base": "a913842c / current manual Sync plan",
    "priorQualifiedHead": "f50cc6b9089a3db1cc2570aa273f7794efdc9abe",
    "server": "2.4.0 / 83fca8ddd25b7b7913723e231779862f94f7dbcb",
    "rebasedPreIntakeParent": "464becfeb388260f33042bb61f022ecb91395ff5"
  },
  "contractReview": "Preserve the current Sync planning chapter and all existing skill evidence links. The Desktop contract explicitly declares ownership of immutable packaged skill resources for the Tauri resource change; retain the existing spec-first mapping.",
  "acceptanceReview": "Diffing prior qualified f50cc6b9 against the rebased tree shows no runtime, Cargo, package, lockfile, script or audit-policy changes. Earlier complete checks, 794 renderer/governance, 746 AI, 290 native, production build and 2168 cold catalog passes remain evidence of identical executable inputs. Validate this documentation-only overlap with formatting and its consuming spec/evidence checks; full exact-head packaging CI remains required.",
  "runs": [
    {
      "name": "full-CI-before",
      "command": "spec-validator first --base 800e8ea9bfb80bf72f6f535f602dedc8f44528e5 --head f50cc6b9089a3db1cc2570aa273f7794efdc9abe",
      "result": "fail",
      "failures": 1,
      "detail": "Full run 44119540857, Governance job 134167549631: missing mapped spec/src/current/desktop.md for the Tauri resource declaration change. Native bundle was cancelled and is not qualified."
    },
    {
      "name": "executable-input-equivalence",
      "command": "jj diff --from f50cc6b9 --to @ -- src src-tauri scripts package.json pnpm-lock.yaml pnpm-workspace.yaml config",
      "result": "pass",
      "failures": 0,
      "detail": "No differences before this documentation-only repair."
    },
    {
      "name": "initial-contract-format-check",
      "command": "pnpm spec:check with verified package archives",
      "result": "fail",
      "failures": 2,
      "detail": "Desktop chapter exceeded 32768 bytes after adding the resource detail; governance was 401 lines before local compaction. Move resource detail to the owning skills topic and retain the short Desktop contract pointer, without changing limits."
    },
    {
      "name": "desktop-topic-pointer-size",
      "command": "pnpm spec:check with verified archives",
      "result": "fail",
      "failures": 1,
      "detail": "A 32807-byte intermediate Desktop chapter still exceeded 32768. Compact redundant remotes prose without changing its owning requirement or gate, retaining the native skill contract pointer."
    },
    {
      "name": "historical-base-in-rebased-worker",
      "command": "spec:first --base 800e8ea9bfb80bf72f6f535f602dedc8f44528e5 --head @",
      "result": "fail",
      "failures": 1,
      "detail": "The isolated worker imports only current rebased ancestry, so it correctly refuses the obsolete pre-rebase base object. Rerun the same pre-intake-to-head boundary with its corresponding current ancestry commit, retaining the missing-chapter assertion."
    },
    {
      "name": "rebased-pre-intake-spec-first",
      "command": "pnpm spec:first -- --base smokozxq --head @ with verified package archives",
      "result": "pass",
      "failures": 0,
      "detail": "Equivalent rebased pre-intake-to-head boundary passes: 5 protected files and 5 canonical chapters."
    },
    {
      "name": "complete-document-check",
      "command": "pnpm spec:check with verified package archives",
      "result": "pass",
      "failures": 0,
      "detail": "validate, rust-format, mdBook and spec-first pass; unchanged 400-line and 32768-byte limits."
    }
  ],
  "remaining": [
    "Require fresh exact-head full CI including ordinary native bundle before merge; native preview acceptance/publication remain separate."
  ]
}
```

The history-navigation append conflicted when main advanced to a913842c.
Preserve both the main Sync planning/dependency receipts and all skill records.
The executable input diff is empty: this resolution changes documentation only.

The broader full run found a real contract-coverage gap absent from the ordinary
PR-base check. Add the owning Desktop resource-loading contract rather than
ignoring the Tauri path, changing its mapped chapter or weakening the gate. Keep
failed attempts and all already committed acceptance receipts unchanged.
