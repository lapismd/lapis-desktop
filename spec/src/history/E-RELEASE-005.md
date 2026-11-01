# Linux Tauri preview distribution

```json
{
  "id": "E-RELEASE-005",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-REL-001",
    "LD-REL-002",
    "LD-REL-003",
    "LD-REL-004",
    "LD-REL-005",
    "LD-REL-006"
  ],
  "files": [
    ".github/workflows/release-desktop.yml",
    "scripts/release/contract.mjs",
    "scripts/release/build-common.mjs",
    "scripts/release/build-linux.mjs",
    "scripts/release/build.mjs",
    "scripts/release/assemble.mjs",
    "scripts/release/candidate.mjs",
    "scripts/release/verify-candidate.mjs",
    "scripts/release/verify-linux.mjs",
    "scripts/release/ordinary.mjs",
    "scripts/release/smoke-installed.mjs",
    "scripts/release/smoke-linux.mjs",
    "scripts/release/verify-installed.mjs",
    "scripts/release/prepare-platform.mjs",
    "scripts/release/publish.mjs",
    "package.json",
    "tests/governance/release-publication.test.mjs",
    "tests/governance/release-linux.test.mjs",
    "tests/governance/release-workflow.test.mjs",
    "docs/desktop-release.md",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md"
  ],
  "contractReview": "Linux ARM64 and x64 join the preview release scope. Existing CI --no-bundle uploads contain only executables; complete distribution requires the Tauri resource tree, release-built helpers and a distinct launcher/desktop identity. Preserve the stable Deno channel and all protected release approval/source/checksum boundaries. Do not change CI caching or sharding as part of this work.",
  "acceptanceReview": "Require all three platform archives from one source/version and actual per-platform Homebrew install/reinstall/uninstall, data retention, window and graceful-quit receipts, each bound to its tested archive hash. Report the first-preview upgrade gap and all14existing native RC quarantines. Linux startup smoke does not establish full Linux feature parity.",
  "runs": [
    {
      "name": "Observed source baseline: Linux CI invokes tauri build --no-bundle and uploads only target/release/lapis-desktop for both architectures. Main CI41312175583 passes15jobs, with95nativefeaturepasses,zero failures and14disclosedskips.",
      "command": "Inspect .github/workflows/ci.yml and source-bound main CI41312175583",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Mac-only candidate verifier accepted an incomplete final target set before implementation.",
      "command": "node --test tests/governance/release-publication.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Three-platform release regressions: 16 passed, zero failures/skips; complete governance surface: 231 passed, zero failures/skips.",
      "command": "node --import tsx --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Source boundaries, evidence (386 records), actionlint and full formatting pass.",
      "command": "node scripts/source-audit.mjs; node scripts/evidence.mjs; actionlint .github/workflows/release-desktop.yml; pnpm exec prettier --check .",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Docker spec validation failed because the new LD-REL-006 verification-table row was accidentally split; the malformed row also hid later rows. Corrected the row and retained this failed attempt.",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 12
    },
    {
      "name": "Corrected verification-table row; all four isolated Docker lanes pass: validation, rust-format, mdbook and spec-first.",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0
    }
  ],
  "versions": {
    "baselineSource": "b5a255bbb381d6fc2d936b38925f5b2ae7a6c755",
    "version": "2026.31.6-rc.1"
  },
  "remaining": [
    "Hosted Linux packaging and real native Homebrew installation still need qualification; local regressions do not establish full Linux feature parity.",
    "The Mac-only dry preparation run41315690097 is a packaging probe, not the final Linux-capable candidate.",
    "Final-source main CI, three-platform candidate and concrete publication approval remain required."
  ]
}
```
