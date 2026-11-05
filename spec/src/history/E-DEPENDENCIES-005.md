# Released Notes framework cohort intake

```json
{
  "id": "E-DEPENDENCIES-005",
  "date": "2026-11-05",
  "revision": "enclosing-change",
  "result": "pass",
  "requirements": ["LD-GOV-004", "LD-GOV-006", "LD-GOV-008"],
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "scripts/ci-sources.json",
    "scripts/validation/native-sources.json",
    "spec/src/backlog/distribution.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-DEPENDENCIES-005.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "tests/governance/ci-prerequisites.test.mjs"
  ],
  "contractReview": "Desktop consumes the published Notes API 0.2.6, File Explorer 0.2.2, UI 0.1.7 and Workspace 0.3.4 through normal semver ranges, with their compatible AI Host 0.3.0 and single Design Core 0.10.1 context. The private App Profile remains an explicit archive prerequisite built from the same reachable Notes release commit. No source alias, patch, fallback, quarantine, assertion or deadline changes.",
  "acceptanceReview": "The exact dependency regression first failed one of seven cases on the old Design Core/API cohort, then passed all seven after the registry lock and both source pins moved together. Exact Node 24.15.0 preparation rebuilt the App Profile from Notes 40b9ba8e, preserved the three tracked dependency files byte-for-byte, produced one identity for every selected framework package and passed the unchanged full and production audit gates. The complete host-native check, 740 governance/renderer tests, 746 AI tests, all Rust tests and production build pass. Earlier check attempts retain their exact documentation-governance and formatting failures. Hosted product qualification remains a separate release gate.",
  "runs": [
    {
      "name": "Focused cohort regression before intake",
      "command": "node --test tests/governance/ci-prerequisites.test.mjs",
      "result": "fail",
      "tests": 7,
      "failures": 1
    },
    {
      "name": "Focused cohort regression after intake",
      "command": "node --test tests/governance/ci-prerequisites.test.mjs",
      "result": "pass",
      "tests": 7,
      "failures": 0
    },
    {
      "name": "Exact-source private projection and audit",
      "command": "node scripts/ci-prepare-links.mjs && node scripts/ci-install.mjs --audit",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Initial widened host check exposed missing receipt coverage and document limits",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Corrected receipt scope still exposed verification size and formatting",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Complete host-native check",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete host-native tests",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Production renderer build",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm build",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "notesSource": "40b9ba8ee569a737a0ace77870a094972ee6f768",
    "appProfileSha256": "f957b829816b89705fb53a7a6c6fdabd09a921a9b73485d4e0894b31026b3559"
  },
  "remaining": []
}
```
