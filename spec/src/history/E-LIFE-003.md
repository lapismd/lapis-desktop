# Native requalification of shell failure presentation

```json
{
  "id": "E-LIFE-003",
  "date": "2026-10-28",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M4"],
  "requirements": [
    "LD-LIFE-001",
    "LD-LIFE-003",
    "LD-VAULT-002",
    "LD-VAULT-006",
    "LD-DESK-005"
  ],
  "contractReview": "Unchanged-contract acceptance for the presentation boundary landed in E-LIFE-002. Ready-session failures must remain in Problems with a toast; launcher and restoration failures remain in the shared chooser body. No product, contract or selector changes in this record.",
  "milestoneReview": "M4 remains Done. Closes the headed native continuity gap recorded in E-LIFE-002 by requalifying the exact notes-lifecycle, editing-recovery and repository-backup-leave cases against a cold e2e Acceptance rebuild of yoyrwuls.",
  "versions": {
    "desktop": "0.1.0",
    "desktopSource": "yoyrwuls",
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "jj": "0.45.1",
    "platform": "macOS ARM64"
  },
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-LIFE-003.md",
    "spec/src/history/index.md"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "native-e2e-rebuild",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Cold e2e Acceptance.app rebuild of the presentation commit. Log .local/verification/shell-failure-native/build.log."
    },
    {
      "name": "notes-lifecycle-exact",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated> node --import tsx --test --test-concurrency=1 --test-name-pattern='failed note saves|failed layout saves|failed physical-root restoration' tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 3,
      "note": "Blocked close and reload wait for workspace notification toasts; missing vault waits for launcher in-body alert. Persistence and recovery assertions intact. Log .local/verification/shell-failure-native/notes-lifecycle-exact.log."
    },
    {
      "name": "editing-recovery-exact",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated> node --import tsx --test --test-concurrency=1 --test-name-pattern='native retained claims refuse leave' tests/desktop/editing-recovery.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 1,
      "note": "Leave refusal surfaces through toast plus mounted Problems recovery; session retained. Log .local/verification/shell-failure-native/editing-recovery-exact.log."
    },
    {
      "name": "repository-backup-leave-before-collision",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated> node --import tsx --test --test-concurrency=1 tests/desktop/repository-backup-leave.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Overlapped with concurrent editing-recovery; Acceptance exited before WebDriver readiness. Not a product failure. Retried alone."
    },
    {
      "name": "repository-backup-leave-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=<isolated> node --import tsx --test --test-concurrency=1 tests/desktop/repository-backup-leave.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 1,
      "note": "Failed final backup leave waits for toast, retains the live editor and resumes watching. Log .local/verification/shell-failure-native/repository-backup-leave.log."
    }
  ]
}
```

Closes the headed native gap left by E-LIFE-002. Exact failure-presentation
cases pass against a cold e2e Acceptance rebuild with toast and launcher-body
selectors.
