# Released CLI version custody

```json
{
  "id": "E-CLI-010",
  "date": "2026-11-23",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CLI-002", "LD-CLI-003", "LD-REL-002"],
  "files": [
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-01.md",
    "spec/src/history/E-CLI-010.md"
  ],
  "versions": {
    "cli": "2.9.2",
    "cliSource": "4c22844f67744a47f38d580a684cca90c4731605",
    "coreSource": "83fca8ddd25b7b7913723e231779862f94f7dbcb",
    "bundledCliSha256": "d6e1e1537bb55ffc315e6a0bc362619af04cc837252d4a08a6f6322fcac1e37d"
  },
  "contractReview": "Server version PR 150 passes all 11 checks and merges with synchronized CLI executable/release version 2.9.2. Desktop selects that exact main source only for optional CLI tooling; ordinary Core, HTTP, MCP and native plugin engine pins remain unchanged. No installed application/profile is replaced.",
  "acceptanceReview": "Cargo metadata resolves CLI 2.9.2 from 4c22844f and Core from unchanged 83fca8dd. Seven real native content/export/discovery cases and 15 affected CLI/native governance cases pass. The source-owned release CLI build succeeds; its executable reports lapis 2.9.2 and its bundle resource verifier passes. Five-lane portable spec/spec-first/book and the 530-record evidence inventory pass. The actual public release verifier independently checks the published tag/source/Cargo version plus size/SHA-256 for all three archives. The downloaded Linux x64 release binary independently reports lapis 2.9.2, and the formula rendered from that verified manifest passes Ruby syntax. No Homebrew installation or Desktop publication is claimed.",
  "runs": [
    {
      "name": "Focused native listener, export and discovery",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test cli_content --test cli_credential --test cli_discovery",
      "result": "pass",
      "passed": 7,
      "failures": 0
    },
    {
      "name": "Affected CLI and native pin governance",
      "command": "node --test tests/governance/cli-preparation.test.mjs tests/governance/release-linux.test.mjs tests/governance/validation-native.test.mjs",
      "result": "pass",
      "passed": 15,
      "failures": 0
    },
    {
      "name": "Release CLI source build and bundle verification",
      "command": "node scripts/prepare-cli.mjs; src-tauri/resources/lapis-cli/lapis --version; verifyCliResource(directory, target)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Public CLI release verification and actual binary identity",
      "command": "readPublishedCliManifest(v2.9.2), renderFormula; checksum-verify downloaded Linux archive and execute lapis --version; ruby -c generated formula",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete portable spec and evidence",
      "command": "LAPIS_DESKTOP_BASE=b2c0a6d1c00b300f462f17b9bac72070514411ef LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:check; pnpm check:evidence",
      "result": "pass",
      "failures": 0
    }
  ],
  "remaining": [
    "First real formula PR, native Homebrew installation qualification and public tap adoption",
    "Desktop hosted CI, automatic version PR, candidate and public release qualification",
    "Production i18next advisory in existing API peer remains blocked pending owning-package release/adoption; no waiver"
  ]
}
```
