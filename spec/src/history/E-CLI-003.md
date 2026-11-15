# Published CLI UI registry adoption

```json
{
  "id": "E-CLI-003",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CLI-001", "LD-GOV-004"],
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    "spec/src/current/governance.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/history/E-CLI-003.md",
    "spec/src/navigation/history-02.md"
  ],
  "versions": {
    "notesSourcePr": 116,
    "notesVersionPr": 117,
    "notesMerge": "d157d0eaf7be37a5d220d61fbadb7bcf2b35bb9f",
    "notesReleaseRun": "43657283043 attempt 2",
    "api": "0.6.1",
    "fileExplorer": "0.2.8",
    "languageService": "0.1.6",
    "ui": "0.2.0",
    "uiIntegrity": "sha512-vQ0iXxbzzsUuUPY692STIO5YemZP424vBghHlD7wSVu3VhM7v0SYswENZU0KmkqvmBER+WbgUWyLxqCBmCjZJA==",
    "workspace": "0.4.4"
  },
  "contractReview": "The App-independent CLI settings port remains the only shared UI contract adopted by Desktop; native authority and lifecycle stay Desktop-owned.",
  "acceptanceReview": "The published package exposes ./cli from ./dist/cli/index.js. Desktop consumes UI 0.2.0 with the coherent API 0.6.1, File Explorer 0.2.8, Language Service 0.1.6 and Workspace 0.4.4 registry cohort while its two documented private prerequisites remain explicit archive inputs. The first UI-only projection produced 22 Svelte class-identity errors from two API peer instances; coherent cohort adoption removed all 22 without an alias, patch or consumer shim. The registry-backed portable check passes and the previously qualified interaction/runtime surface is unchanged.",
  "remaining": [
    "Supported-platform installed-bundle and native credential-dialog qualification remains pending.",
    "Visual review remains pending; no baseline changed."
  ],
  "runs": [
    {
      "name": "notes-release",
      "command": "GitHub Actions release run 43657283043",
      "result": "pass",
      "failures": 0,
      "detail": "Initial post-publish verification exhausted its propagation wait for API 0.6.1; failed-job retry passed registry install, releases and notifications without republishing."
    },
    {
      "name": "published-export",
      "command": "npm view @lapis-notes/ui@0.2.0 version dist.integrity exports --json",
      "result": "pass",
      "failures": 0,
      "detail": "Version, integrity and ./cli export match the qualified candidate."
    },
    {
      "name": "registry-consumer",
      "command": "node .local/cli-consumer-install.mjs && inspect node_modules/@lapis-notes/ui/package.json",
      "result": "pass",
      "failures": 0,
      "detail": "Installed UI 0.2.0 from npm; ignored local inputs supplied only the documented private App Profile and AI prerequisites."
    },
    {
      "name": "portable-check-before-evidence",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm check",
      "result": "fail",
      "failures": 2,
      "detail": "Implementation checks reached the spec gate, which correctly rejected package.json and pnpm-lock.yaml until this fresh evidence existed."
    },
    {
      "name": "portable-check-mixed-cohort",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm check",
      "result": "fail",
      "failures": 22,
      "detail": "UI 0.2.0 beside the old API/Workspace cohort installed two API peer instances; Svelte correctly rejected private class identities across production and catalog consumers."
    },
    {
      "name": "portable-check-coherent-before-format",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm check",
      "result": "fail",
      "failures": 2,
      "detail": "The coherent package graph reached zero Svelte and Rust findings, then format:check rejected two changed specification pages."
    },
    {
      "name": "portable-check-coherent-before-spec-limit",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Formatting exposed a 401-line backlog page; the spec file-limit gate rejected it before implementation checks."
    },
    {
      "name": "portable-check-coherent",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "The coherent registry cohort plus the two checksum-pinned private archive prerequisites passes the complete portable check lane."
    },
    {
      "name": "portable-build-coherent",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "The production renderer bundle builds from the coherent registry cohort and checksum-pinned private inputs."
    },
    {
      "name": "portable-spec-check",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/cli-ui-validation-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Validate, Rust formatting, mdBook and spec-first lanes pass."
    }
  ]
}
```
