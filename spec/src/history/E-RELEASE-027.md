# Desktop Changesets version intent

```json
{
  "id": "E-RELEASE-027",
  "date": "2026-11-24",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-REL-001", "LD-REL-004"],
  "files": [
    "package.json",
    ".github/dependency-automation/artifact-projection.json",
    "CHANGELOG.md",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "src-tauri/tauri.conf.json",
    "src-tauri/tauri.preview.conf.json",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/navigation/history-01.md",
    "spec/src/history/E-RELEASE-027.md",
    ".changeset/desktop-mcp-release.md",
    ".changeset/patched-desktop-localization.md"
  ],
  "contractReview": "Changesets consumes reviewed Desktop release notes and advances only the existing preview rc number. Package, Cargo, lock, Tauri and bundle versions are synchronized; no npm package or stable cutover is authorized.",
  "acceptanceReview": "Version preparation is not release acceptance. Full exact-source CI, candidate packaging, native Linux Homebrew qualification and immutable-publication verification must pass after this PR merges.",
  "runs": [
    {
      "name": "Changesets preview version preparation",
      "command": "node scripts/release/version-pr.mjs",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "node": "24.15.0",
    "changesets": "3.0.3",
    "candidate": "2026.31.6-rc.3"
  },
  "remaining": [
    "Full exact-source CI and candidate/native installation qualification",
    "Verified GitHub publication and generated Homebrew update"
  ]
}
```
