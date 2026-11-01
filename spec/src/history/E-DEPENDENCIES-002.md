# Compatible first-party dependency intake

```json
{
  "id": "E-DEPENDENCIES-002",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-006", "LD-GOV-008", "LD-HOST-001"],
  "versions": {
    "node": "26.9.0 for source governance checks",
    "pnpm": "10.34.5",
    "ui": "0.1.6",
    "markdown": "0.2.1",
    "api": "0.2.3; private Profile source unchanged",
    "designCore": "0.8.0; existing root patch unchanged"
  },
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    "spec/src/current/local-dependencies.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md"
  ],
  "runs": [
    {
      "name": "Original hosted native acceptance",
      "command": "GitHub Actions 41316096440/job/124876356872: pnpm test:desktop:headed",
      "result": "fail",
      "failures": 1,
      "detail": "Background AI admission failed because Rust did not acknowledge the renderer within the existing readiness bound. Native rerun remains separate; no deadline, assertion or quarantine was changed."
    },
    {
      "name": "Dependency and archive governance",
      "command": "node --test tests/governance/ci-prerequisites.test.mjs tests/governance/local-archives.test.mjs tests/governance/archive-development-dependencies.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "15 tests pass."
    }
  ],
  "remaining": [
    "Fresh hosted functional, audit, packaging and native CI must pass on the updated dependency graph."
  ],
  "contractReview": "Update only compatible published UI and Markdown patches. The user explicitly retained the private Profile/API 0.2.3 pair. API 0.2.4, Workspace 0.3.2, File Explorer 0.2.1 and Tasks 0.1.2 need a separate private-profile intake; Design Core 0.10 is outside the current published Notes peer cohort. Registry tags were checked alongside version metadata so next-tagged packages are not downgraded to older latest tags.",
  "acceptanceReview": "This receipt qualifies the dependency-source boundary and its 15 focused governance cases. It does not claim native acceptance or fix the original handshake failure. All merge, publication, signing, deployment and visual gates remain."
}
```
