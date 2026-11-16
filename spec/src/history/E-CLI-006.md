# Advance the CLI delivery preview version

```json
{
  "id": "E-CLI-006",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CLI-001", "LD-REL-001", "LD-REL-002", "LD-GOV-004"],
  "versions": {
    "previousTag": "desktop-v2026.31.6-rc.1",
    "previousSource": "217aa6e396a9ef05040e7decad614e73b0b49662",
    "candidate": "2026.31.6-rc.2",
    "cliSource": "3b121d21bb32ca81da84cf750661509f097a7b43",
    "notesSource": "d157d0eaf7be37a5d220d61fbadb7bcf2b35bb9f"
  },
  "files": [
    "docs/desktop-release.md",
    "package.json",
    "spec/src/backlog/distribution.md",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/history/E-CLI-006.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/tauri.conf.json"
  ],
  "contractReview": "A published preview tag remains bound to its original source and bytes. The merged CLI delivery therefore advances the public, Rust and Tauri versions together to rc.2 while retaining the numeric 2026.31.6 macOS bundle version.",
  "acceptanceReview": "The first preparation attempt failed on all three targets because ordinary main CI was not release authority. Manual full exact-source CI then passed every selected gate, including the ordinary macOS bundle with CLI audit, both Linux native targets, Quality, unit, four catalog shards, audits and final release authority. The second preparation attempt correctly refused rc.1 because that candidate was already published from source 217aa6e. No tag or asset was overwritten.",
  "remaining": [
    "Merge the rc.2 version advance, run exact-source full CI and prepare the non-publishing three-platform candidate.",
    "Native credential-dialog qualification and visual review remain pending; no baseline changed.",
    "Public preview publication remains an environment-protected user decision."
  ],
  "runs": [
    {
      "name": "candidate-before-full-ci",
      "command": "GitHub Actions Desktop preview release 43691282510, operation=prepare, publish=false",
      "result": "fail",
      "failures": 3,
      "detail": "All platform jobs refused before build because release authority required a manual full exact-source CI run."
    },
    {
      "name": "full-exact-source-ci",
      "command": "GitHub Actions CI 43691430430, full=true",
      "result": "pass",
      "failures": 0,
      "detail": "All 20 jobs pass for 524c3bd, including macOS ordinary bundle CLI audit, Linux ARM64/x64 native builds, Quality, unit, four catalog shards, audits, Validate and Full source qualification."
    },
    {
      "name": "candidate-with-published-version",
      "command": "GitHub Actions Desktop preview release 43696199871, operation=prepare, publish=false",
      "result": "fail",
      "failures": 1,
      "detail": "The first admitted matrix job refused because desktop-v2026.31.6-rc.1 already exists; the redundant run was cancelled without rebuilding or publishing."
    },
    {
      "name": "release-version-regressions",
      "command": "node --test tests/governance/release-gates.test.mjs tests/governance/release-linux.test.mjs tests/governance/release-publication.test.mjs tests/governance/release-workflow.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 26
    },
    {
      "name": "portable-specification-before-mapped-chapters",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "detail": "Spec-first required the protected application manifests to update their mapped Desktop and Governance chapters in addition to Distribution."
    },
    {
      "name": "portable-quality",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "portable-specification",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0
    }
  ]
}
```
