# Patched localization registry intake

```json
{
  "id": "E-DEPENDENCIES-020",
  "date": "2026-11-24",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-GOV-002", "LD-GOV-006"],
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    ".github/dependency-automation/artifact-projection.json",
    ".changeset/patched-desktop-localization.md",
    "tests/governance/profile-registry.test.mjs",
    "tests/governance/ci-prerequisites.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/navigation/history-01.md",
    "spec/src/verification.md",
    "spec/src/history/E-DEPENDENCIES-020.md",
    "tests/governance/release-version.test.mjs",
    "spec/src/current/distribution.md"
  ],
  "versions": {
    "base": "2ca6947856183b9a0f68a436e6e3bd50f0d30117",
    "api": "0.6.14",
    "ui": "0.2.8",
    "i18nextRange": "^26.3.4",
    "apiReleaseSource": "5e7b804a09a166d016af2f97fb0d2e18238e227a",
    "i18next": "26.7.2",
    "apiIntegrity": "sha512-yLqwHZqUxgjex+0NNI6U/Yf7Op0kP6dghzgnRYypp17aNQKZ+k2LdtSLTDTdbsByU3QninB/Qr+qlads4Jgk4g==",
    "shapeSha256": "2e48a516416bef0cf225c6b6cf8832dcb1e52db4c2da9db274c958179cf960ef",
    "descriptorSha256": "b5343855fcd39b7c9f9c5608172e40d5cd1e14af5386a734d5f9e52f4b2b80a0",
    "reviewedSdkSource": "c4b54f932cd4239d9a8f0b3e1fb327f28b63dfb2",
    "apiReleaseRun": "https://github.com/lapismd/lapis-notes/actions/runs/45307527894"
  },
  "contractReview": "Fix the owning API peer contract first (Notes198), version through reviewed Changesets PR199, verify public registry publication, then adopt normal API/UI/i18next ranges. Preserve one API identity, exact private archive prerequisites, native pins, development advisory policy and held SDK authority. Renew only the reviewed application context descriptor.",
  "acceptanceReview": "The original production audit and patched-resolution regression fail before intake, then pass with published API0.6.14/UI0.2.8/i18next26.7.2. Actual installed and public graphs are production-clean. Full portable check, 2,011 tests, renderer build, five specification lanes and 531 evidence records pass. The real version dry run and strengthened public-bootstrap test pass. Local catalog installation stops on ENOSPC before collection; exact-head hosted full catalog/native gates remain mandatory before merge and publication.",
  "runs": [
    {
      "name": "Original exact production audit",
      "command": "node --input-type=module -e 'import {runAudit} from \"./scripts/ci-audit.mjs\"; process.exitCode=runAudit();'",
      "result": "fail",
      "failures": 1,
      "detail": "GHSA-6jcc-5g8w-32mx via API i18next25.10.10. Both production and blocking classifications report the same single advisory."
    },
    {
      "name": "Patched installed-resolution governance before",
      "command": "node --test tests/governance/profile-registry.test.mjs",
      "result": "fail",
      "failures": 1,
      "passed": 1,
      "detail": "The new graph regression rejects i18next25.10.10; existing registry-range/private-projection regression passes."
    },
    {
      "name": "Public registry admission before",
      "command": "node /tmp/lapis-desktop-api0614-intake.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "After the publisher reports success, the encoded scoped-version URL returns404. The guard stops before editing manifest/lock. The canonical raw scoped-version URL subsequently returns200 with matching version, compatible peer and tarball integrity."
    },
    {
      "name": "Owner API publication and registry verification",
      "command": "GitHub Release workflow45307527894; GET https://registry.npmjs.org/@lapis-notes/api/0.6.14",
      "result": "pass",
      "failures": 0,
      "detail": "All applicable candidate lanes, npm signed-provenance publication, real published-package verification, GitHub release and consumer notification succeed on main5e7b804a."
    },
    {
      "name": "Released cohort and patched graph regressions after",
      "command": "node --test tests/governance/profile-registry.test.mjs tests/governance/ci-prerequisites.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 10
    },
    {
      "name": "Public graph exact audit after",
      "command": "node --input-type=module -e 'import {runAudit} from \"./scripts/ci-audit.mjs\"; process.exitCode=runAudit();'",
      "result": "pass",
      "failures": 0,
      "detail": "Zero production advisories. Existing exact development-only glob/minimatch policy remains unchanged."
    },
    {
      "name": "Actual private installed graph admission and audit",
      "command": "node scripts/local-archives.mjs .local/api0614-private-archives.json; pnpm audit --json and --prod --json against node_modules/.pnpm/lock.yaml; auditFindings",
      "result": "pass",
      "failures": 0,
      "detail": "The original verified AI0.2.0 archive sha256071f885c... from source9a98293c is the sole explicit private overlay. API/UI resolve from npm. One actual API0.6.14 and i18next26.7.2, zero production advisories and no audit gate errors. Source manifest/lock are preserved."
    },
    {
      "name": "Complete portable source check",
      "command": "LAPIS_DESKTOP_BASE=2ca6947856183b9a0f68a436e6e3bd50f0d30117 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Strict normal/e2e Rust Clippy, type checking, source specification, composition and formatting pass."
    },
    {
      "name": "Complete portable tests",
      "command": "LAPIS_DESKTOP_BASE=2ca6947856183b9a0f68a436e6e3bd50f0d30117 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test",
      "result": "pass",
      "failures": 0,
      "passed": 2011,
      "detail": "969 governance/renderer, 749 AI policy and 293 Rust tests pass; two existing native ignores remain."
    },
    {
      "name": "Complete portable renderer build",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Real version context setup attempts",
      "command": "node /tmp/lapis-desktop-api0614-version-smoke.mjs",
      "result": "fail",
      "failures": 3,
      "detail": "Temporary harness setup failures only: copied absent first-release changelog; omitted synthetic main history; omitted the public docs-tools root formatter. The production workflow already provides the formatter. Correct the isolated setup to match it."
    },
    {
      "name": "Real first-version context and formatter qualification",
      "command": "node /tmp/lapis-desktop-api0614-version-smoke.mjs; node --test tests/governance/release-version.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "The strengthened two-case fixture and real-source dry run use the actual public docs-tools graph and formatter config. Both reviewed product notes prepare rc.3, synchronized package/Cargo/Tauri versions, renewed context and first changelog. Generated governance remains400 lines/32749 bytes. No versioning source implementation changes."
    },
    {
      "name": "First portable catalog preparation",
      "command": "LAPIS_DESKTOP_BASE=2ca6947856183b9a0f68a436e6e3bd50f0d30117 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "detail": "Dependency installation stops before browser collection with ENOSPC on the Docker filesystem. Collected reports remain. Remove only the two exited workers created by this slice, preserving their reports and all other containers/caches. Rerun the same Docker lane after the active Plugins catalog finishes."
    },
    {
      "name": "Affected release governance",
      "command": "node --test tests/governance/release-*.test.mjs",
      "result": "pass",
      "passed": 39,
      "failures": 0
    },
    {
      "name": "Complete portable specification and evidence",
      "command": "LAPIS_DESKTOP_BASE=2ca6947856183b9a0f68a436e6e3bd50f0d30117 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:check; pnpm check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "All five canonical lanes and 531 immutable evidence records pass."
    }
  ],
  "remaining": [
    "Exact-head hosted full catalog, native and source CI gates before merge",
    "Desktop version PR, candidate publication and actual Homebrew delivery"
  ]
}
```
