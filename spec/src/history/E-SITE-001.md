# Website product capture scenes

```json
{
  "id": "E-SITE-001",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CAT-001", "LD-CAT-003", "LD-CAT-005", "LD-GOV-004"],
  "files": [
    ".gitignore",
    ".storybook/main.ts",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/WebsiteMedia.stories.ts",
    "catalog/story-parity.json",
    "catalog/website-media.json",
    "package.json",
    "pnpm-lock.yaml",
    "spec/src/current/plugins.md",
    "tests/visual/storybook.spec.ts-snapshots/.gitkeep",
    "spec/src/history/E-SITE-001.md",
    "spec/src/history/index.md",
    "spec/src/verification.md"
  ],
  "contractReview": "Website media mounts the actual NotesWorkspace and VaultLauncher through disposable owned fixtures. The launcher scene sets and restores the real appearance preference. Visual Delta readiness gates capture; browser scenes qualify neither native behavior nor visual baselines. No runtime or dependency source repair is included.",
  "acceptanceReview": "Keep assertions and axe enabled. The user explicitly accepted recording the existing icon, dark-launcher contrast, evidence and Docker prerequisite limitations to keep the migration focused. The website is validated independently; these source failures are not passes.",
  "versions": {
    "desktop": "0.1.0 private preview",
    "api": "0.2.4",
    "workspace": "0.3.2",
    "ui": "0.1.6",
    "design-core": "0.9.0",
    "mira": "0.1.4",
    "visual-delta": "0.1.0",
    "pnpm": "10.34.5",
    "runtime": "Explicit host/browser diagnostics with two verified immutable private prerequisite archives; not Docker/native product qualification"
  },
  "runs": [
    {
      "name": "New Workspace and Launcher, desktop/light",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook catalog/plugins/WebsiteMedia.stories.ts",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Same two scenes, narrow/light",
      "command": "LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/WebsiteMedia.stories.ts",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Same two scenes, desktop/dark: Workspace passes, Launcher contrast fails",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/WebsiteMedia.stories.ts",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Same two scenes, narrow/dark: Workspace passes, Launcher contrast fails",
      "command": "LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/WebsiteMedia.stories.ts",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Required catalog command stopped in first shard: 127 pass, existing Plugin File Icon fails",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Existing Plugin File Icon, unchanged parent and current source",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook catalog/plugins/Workspace.stories.ts --testNamePattern=\"Plugin File Icon\"",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Types, zero errors/warnings",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:types",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Production-root parity, 115 families",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:storybook-parity",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Format (Prettier and Rust formatting)",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm format:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Root unit gate: 579 pass, one evidence test fails; reproduced on unchanged parent",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Architecture source boundaries",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:architecture",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Explicit App ownership",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:app-ownership",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Renderer production build",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Cold static Storybook",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm build-storybook",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Registry-only addon closure frozen install with the inherited peer graph",
      "command": "pnpm --dir /tmp/lapis-desktop-addon-lock-review install --frozen-lockfile --ignore-pnpmfile",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Supplementary unsharded narrow/dark diagnostics canceled without complete reports; normal root lane remains sharded",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts --reporter=verbose",
      "result": "pending",
      "failures": 0
    }
  ],
  "remaining": [
    "Existing Plugin File Icon misses its expected SVG path (same failure on parent ea80efee); its source/package cohort is the owning follow-up.",
    "The shared Notes workspace DesktopVaultLauncher settings link is #6026f2 on #1e1e1e (2.42:1) in actual dark appearance. User accepted this source limitation; no CSS workaround or axe exemption was added.",
    "Seven missing historical paths in immutable E-CI-003/E-CI-004 block root unit/spec gates before and after this change. Desktop governance owns reconciliation.",
    "Inherited lock prerequisites miss seven manifest dependencies; private AI/app-profile prerequisites and the configured Docker CPU request also block portable qualification. The added addon closure remains registry-only; no local overlay is committed.",
    "No native platform qualification, source publication, remote push or visual-baseline approval.",
    "The required sharded catalog command stops at the reproduced first-shard failure; remaining broad shards are not qualified. Supplementary unsharded diagnostics were canceled and do not substitute for the governed lane."
  ]
}
```

The existing E-WEB-001 receipt was briefly overwritten by a filename collision
and restored byte-for-byte from the parent before validation or commit. This
receipt uses the new E-SITE-001 identity.

The primary Desktop working copy had unrelated dependency/governance edits. This
slice stays in the isolated `website-media` workspace, based on ea80efee. The
private validation overlay and archive selection remain ignored; their payload
hashes are 88265a2a818f8411e6d61c91289f1901405cfa3ee7a08adf04a096ccf91a58a2 (AI
0.2.0) and e7aeea336e3ceb0a70a49a690e9293f84445175e06225a60eab2ef9c636d0ef9
(app-profile 0.1.0). Tracked package ranges and addon lock entries are portable.

Failed attempts are retained in the website migration logs. Initial story types
required unrelated component args and were corrected without casts. A same-host
full narrow run stalled without reporting results and was stopped; a fresh
verbose run is recorded separately. Earlier baseline-copy attempts could not
resolve the private archive paths; the final parent snapshot uses exactly the
same verified payloads and reproduces the icon failure and seven stale evidence
paths.

The complete Launcher and WebsiteMedia families also passed 15/15 tests in each
light viewport; desktop/dark passed 14/15 with only the recorded Launcher
contrast failure. The final narrow/dark family result is recorded separately.

Final source-commit media capture/import is recorded by the website. No PNG
baseline was created; new stories remain visual-pending. The empty baseline
directory only satisfies the public addon's static-assets directory contract.
