# Cold ordinary-app automatic backup

```json
{
  "id": "E-REPO-046",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M14", "M14.1", "M14.2"],
  "requirements": ["LD-REPO-005", "LD-DESK-005", "LD-LIFE-001"],
  "versions": {
    "platform": "macOS ARM64",
    "node": "26.9.0",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "designCore": "0.5.1 verified archive at 90a79b875bf280ebbb97efdb054b369c6488c3e7",
    "desktopParent": "86411271460d25bbd8955a6e2e9c87bc38511ce0"
  },
  "contractReview": "Unchanged-contract acceptance for LD-REPO-005, LD-DESK-005 and LD-LIFE-001. The real native App starts automatic backup through its enabled plugin. The test observes the existing footer checkpoint identifiers, reads the actual plugin Settings storage path, writes a real external file, opens its retained diff, edits the actual CodeMirror editor and invokes guarded application Quit. It never calls capture to substitute for automatic watching. Cold reopening must retain the external history location and exact saved editor version without creating root Git/JJ metadata. No production code, native permission, shared test harness or fake backend is added. Plan/checklist tracking distinguishes independent identity and native recovery qualification (E-REPO-047/048) from this original editor-save/Quit target. Source repairs are committed; guarded normal Quit, archive refresh and actual native requalification are complete. No original gate changes.",
  "milestoneReview": "This original cold ordinary-App capture/editor-save/Quit/reopen target now passes against the verified API/Core graph. Alongside E-REPO-047/048/049/050 and retained M5 watch/reconciliation evidence, M14.2 is Done on its original macOS ARM64 capture/recovery gate. Restore/search/storage/adoption, real providers, AI, release and cutover remain separate.",
  "files": [
    "tests/desktop/repository-backup.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/repository.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-REPO-046.md",
    "PLAN.md",
    "docs/automatic-vault-backup-progress.md"
  ],
  "runs": [
    {
      "name": "cold-selector-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "cold-before.log reaches real initial backup, native-selected external storage and automatic capture of an external file. The test then combines WebdriverIO text syntax with a CSS selector, which is invalid. Chained the existing element scopes correctly; no product assertion changed. This failed run does not qualify the complete target."
    },
    {
      "name": "cold-editor-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "cold-selector-retry.log and cold-editor-diagnostic.log pass automatic capture and the exact retained external diff. Editor navigation remains blocked while Settings is open; changed the test to click the existing Close settings control and verify dismissal instead of assuming an Escape completed it."
    },
    {
      "name": "cold-editor-diagnostic",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "cold-editor-diagnostic.log repeats the actual editor-navigation failure and records the live DOM plus editor-navigation.png. Settings remains open in this attempt. The next run explicitly clicks and verifies the existing Close settings action before diagnosing the independent API tab-selection failure."
    },
    {
      "name": "cold-foreground-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "cold-dialog-retry.log verifies Settings dismissal but still cannot display the real editor after clicking Note.md. Screenshot editor-navigation.png shows the note tab and Explorer selection while Repository History stays active. Two exact shared API regressions reproduce this queued-projection defect; the source fix and newer-navigation protection pass four exact and 149 affected tests before packaging."
    },
    {
      "name": "pending-tracking-after-qualified-split",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "note": "identity-spec-final.log: after committing only verified slices, restored pending plan/checklist narratives lacked fresh evidence coverage. Their ordinary editor-save/Quit tracking belongs to this E-REPO-046 record; added those two exact file paths and corrected stale source-repair status. Native assertions and original gates are unchanged."
    },
    {
      "name": "pending-source-first-after-qualified-split",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "tracking-first-final.log: committing the qualified identity introduction leaves no fresh repository-chapter change for this still-pending ordinary-App test. Its unchanged admission/identity/save-Quit contract is now explicitly confirmed in that owning chapter; no protected path, requirement or assertion is bypassed."
    },
    {
      "name": "pending-tracking-ready",
      "command": "pnpm spec:first\npnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "note": "tracking-first-ready.log passes 41 protected files/seven canonical chapters; tracking-ready.log passes six validators/214 chapters/95 requirements. Pending ordinary-App test and original gates remain unchanged. Source/identity/recovery commits are separate; the review app and dependency graph remain live and untouched."
    },
    {
      "name": "original-cold-ordinary-after-refresh",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "ordinary-after-refresh.log: 1/1 passes in two actual cold Notes processes. Automatic external capture, exact retained diff, real editor navigation, guarded Quit final save, cold retained editor diff, stable external history location and absence of root Git/JJ metadata are proved. No UI selector or save assertion is weakened."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Remaining M14 restore/search/storage/adoption and real GitHub/Forgejo acceptance, AI, release, other-platform and visual gates remain open."
  ]
}
```

This target uses a fresh disposable vault/profile for each run. Source API
repair `8fd98e22ffe81d89e064cb6630556970c74350d3` is packaged at SHA-256
`314a83c8f88e340dd22d624971a85c8fd855604b97250ece0b6f5134d1889ad5`; its record
is `lapis-notes/spec/records/2026-10-20-foreground-file-navigation.md`. The
combined ignored fourteen-package manifest
`.local/archives/native-popout-and-file-navigation.json` installs verified API
and Design Core fixes while preserving the other twelve package entries. Normal
guarded review Quit precedes installation; ordinary review data remains
preserved. Original cold ordinary-App capture/editor-save/Quit/reopen now
passes. E-POPOUT-004 independently qualifies ordinary native windows. Neither
proof substitutes for remaining restore/search/storage and real-provider gates.
