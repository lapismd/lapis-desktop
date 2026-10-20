# Cold native vault-history identity qualification

```json
{
  "id": "E-REPO-047",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14", "M14.1"],
  "requirements": ["LD-REPO-005", "LD-VAULT-002", "LD-DESK-005", "LD-GOV-002"],
  "versions": {
    "platform": "macOS ARM64",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "node": "26.9.0",
    "nativeBinarySha256": "a3df15fcaa1d09e698bb1ddd33da3f3857597958dc3701bfe7847257a077910c",
    "desktopParent": "86411271460d25bbd8955a6e2e9c87bc38511ce0",
    "designCore": "0.5.1 verified archive at 90a79b875bf280ebbb97efdb054b369c6488c3e7",
    "shutdownFixedNativeBinarySha256": "15d9a6777c86b44e7561463f72cccda5caedf87c9cf40c3165c099a4a90b5c27"
  },
  "contractReview": "Unchanged-contract acceptance for the M14.1 identity/storage gate, LD-REPO-005 and LD-VAULT-002. Two actual cold native App processes use the existing explicit background-API mode, fixture picker, admitted main-window commands and real JJ capture. The test creates twenty other physical roots to evict the original recent entry through production behavior. Cold reselect retains the original vault ID, external metadata directory and checkpoint. A physical folder move retains that identity and history after explicit reselect. A new directory with identical note bytes at the original path receives a distinct ID and history directory. All roots remain free of .jj/.git entries. No production, permission, shared harness or installed archive changes are made. LD-GOV-002 evidence/source-first rules remain unchanged; the owning governance introduction explicitly records the identity qualification without changing test scope or gates.",
  "milestoneReview": "M14.1 is Done on the original macOS ARM64 target: stable IDs, independent external JJ state, cold reopening, actual recent eviction and explicit physical relinking are proved. M14 and its other stages retain Partial; E-REPO-046's broader ordinary-App capture/close test has an independently reproduced shared file-navigation blocker. M7.3, managed AI, restoration/search, fault/provider, distribution and cutover gates are unchanged. Release remains deferred.",
  "files": [
    "tests/desktop/repository-backup-identity.test.mjs",
    "PLAN.md",
    "MIGRATION.md",
    "docs/automatic-vault-backup-progress.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/history/index.md",
    "spec/src/history/E-REPO-047.md",
    "spec/src/current/governance.md"
  ],
  "runs": [
    {
      "name": "cold-native-identity",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup-identity.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "identity-before.log: 1/1 passes across two cold processes. The original ID is c3dc5995-3d86-4cdf-a145-2379d28692b4 and remains unchanged after actual eviction, cold reopening and folder move; its retained commit is 58ab57e48d8b921c8735d30eed071d12550407ba. The replacement receives ID 6fccc9ed-a0a9-4004-a8ba-30bfcd0642cc and separate external history. Exact receipts and native process logs are under backup-identity-PdSe4y. No forced cleanup was required for either normal close."
    },
    {
      "name": "gate-record-before",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "progress.log rejects the missing exact completedGates confirmation for M14.1. The native proof already covers the original gate; added its exact unchanged string, with no test or requirement weakening."
    },
    {
      "name": "document-size-before",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "note": "spec.log reports the same missing original-gate confirmation plus an eight-line evidence introduction exceeding the existing 400-line repository chapter. Added the exact completedGates field and condensed only introductory evidence prose into its original five lines. All normative requirements are preserved."
    },
    {
      "name": "final-tracking-and-source-audits",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm check:architecture; pnpm exec prettier --write [changed acceptance/docs files]",
      "result": "pass",
      "failures": 0,
      "note": "progress-final.log passes 41 tasks/186 evidence records; spec-final.log passes 6 validators/213 chapters/95 requirements; first.log passes 42 protected files and 8 canonical chapters; architecture.log passes. Formatting passes. The original M14.1 gate string is retained exactly. The repository chapter stays at 400 physical lines and Desktop stays below 32,768 bytes."
    },
    {
      "name": "cold-identity-after-shutdown-fix",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup-identity.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "identity-after-shutdown-fix.log: 1/1 passes again across two cold actual native processes against the E-REPO-048/df31b5ca shutdown repair. Real recent eviction, physical root relink and separate replacement identity/history remain proved; original review app and its data are preserved."
    },
    {
      "name": "identity-committed-canonical-before",
      "command": "pnpm spec:first --base @-- --head @-",
      "result": "fail",
      "failures": 1,
      "note": "identity-committed-first.log: the documentation delivery checklist also maps to governance. Added the explicit unchanged LD-GOV-002 confirmation in that chapter and this record; original gate and native assertions are unchanged."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Other M14 stages retain their original ordinary-App capture/fault/recovery, restore/search, storage migration/adoption and real GitHub/Forgejo gates.",
    "This native identity proof does not qualify visual baselines, other platforms, release or the pending shared file-navigation/popout archive refresh."
  ],
  "completedGates": {
    "M14.1": "Stable vault IDs and independent external JJ history work in the native app after reopen and recent eviction"
  }
}
```
