# Adopt published declarative CLI settings UI

```json
{
  "id": "E-CLI-008",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "pass",
  "requirements": ["LD-CLI-001", "LD-GOV-004"],
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    "scripts/ci-sources.json",
    ".github/dependency-automation/artifact-projection.json",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/validation-native.test.mjs",
    "tests/governance/profile-registry.test.mjs",
    "tests/governance/artifact-projection.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/verification.md",
    "spec/src/history/E-CLI-008.md",
    "spec/src/navigation/history-02.md"
  ],
  "versions": {
    "notesReleaseRun": "44315243276",
    "notesUiRelease": "ui@0.2.5",
    "notesJavascriptSource": "6b2b39f583a30be4e6dfa734050c20af862384ba",
    "api": "0.6.9",
    "appProfile": "0.2.6",
    "ui": "0.2.5",
    "uiIntegrity": "sha512-eDDE3XXNpfa8gbHrrQbi4/Z3Lbg4UVi6d4z57LMXeeOIl9oDcdj+OQ8eJv/XhHQ3vcdjvoSeDb49chtNfy/7vg==",
    "projectionShape": "018000ffc43161d5b0f2376e6cab432e974b42310ae98f5ba47dd9be4ac82013",
    "projectionDescriptor": "403f5b2044df651284e3991b0db249787004c4d3d3b738aef1925f37452e7b3f"
  },
  "contractReview": "Desktop keeps native CLI installation and access authority. It consumes the published UI ./cli port that binds General → Advanced through the declarative settings renderer, including the host-binding repair in UI 0.2.5. Published API 0.6.9 supplies NativeSyncService.prepareLeave so the ordinary registry cohort no longer needs a private Notes leave archive for type admission. CI private-package packing uses the published Notes JavaScript source so archive versions satisfy the adopted ranges.",
  "acceptanceReview": "Notes release run 44315243276 published UI 0.2.5 after a registry-propagation verify retry, then created the ui@0.2.5 GitHub release. Desktop raised API to ^0.6.9, App Profile to ^0.2.6 and UI to ^0.2.5 while keeping the portable lock free of unpublished AI file: entries. A private AI archive overlay restored only that prerequisite for local installs. The hosted Notes CI pin advanced to 6b2b39f583a30be4e6dfa734050c20af862384ba and the seeded SDK projection shape refreshed so private-package prep archives match the adopted ranges. check:types against the published cohort found 0 errors and 0 warnings.",
  "remaining": [],
  "runs": [
    {
      "name": "notes-release-publish",
      "command": "GitHub Actions release run 44315243276",
      "result": "pass",
      "failures": 0,
      "detail": "Validation and publish succeeded for UI 0.2.5. Verify first exhausted npm propagation, then passed on failed-job retry; GitHub release ui@0.2.5 and consumer notification completed."
    },
    {
      "name": "published-export",
      "command": "npm view @lapis-notes/ui@0.2.5 version dist.integrity exports --json",
      "result": "pass",
      "failures": 0,
      "detail": "Version 0.2.5, integrity and ./cli export match the installed package."
    },
    {
      "name": "registry-consumer-types",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-validation-archives.json LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:types",
      "result": "pass",
      "failures": 0,
      "detail": "Published API 0.6.9, App Profile 0.2.6 and UI 0.2.5 with the checksum-pinned AI archive prerequisite: 0 errors, 0 warnings."
    },
    {
      "name": "notes-ci-pin-cohort",
      "command": "node --test tests/governance/ci-prerequisites.test.mjs tests/governance/validation-native.test.mjs tests/governance/profile-registry.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Hosted Notes pin 6b2b39f583a30be4e6dfa734050c20af862384ba matches API ^0.6.9, App Profile ^0.2.6 and UI ^0.2.5; native Notes pin unchanged."
    },
    {
      "name": "artifact-projection-current",
      "command": "node --test tests/governance/artifact-projection.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Frozen current projection no-op matches shape 018000ffc43161d5b0f2376e6cab432e974b42310ae98f5ba47dd9be4ac82013 and descriptor 403f5b2044df651284e3991b0db249787004c4d3d3b738aef1925f37452e7b3f after the Notes CI pin advance."
    },
    {
      "name": "portable-check",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-validation-archives.json LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Canonical intake, types, Rust, Rust e2e and format lanes pass against the published cohort."
    },
    {
      "name": "portable-spec-check",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-validation-archives.json LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Validate, canonical intake, Rust formatting, mdBook and spec-first lanes pass."
    }
  ]
}
```
