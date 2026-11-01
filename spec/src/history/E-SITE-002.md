# Final Desktop website-media family coverage

```json
{
  "id": "E-SITE-002",
  "date": "2026-11-01",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CAT-001", "LD-CAT-003"],
  "files": ["spec/src/history/E-SITE-002.md", "spec/src/history/index.md"],
  "contractReview": "Supplement E-SITE-001 with the final narrow/dark Launcher and WebsiteMedia family result. No runtime or story changes.",
  "acceptanceReview": "The user accepted the existing dark launcher contrast limitation with checks enabled. Broader source qualification remains pending; do not count failed accessibility stories as passes.",
  "versions": {
    "desktop": "0.1.0 private preview",
    "workspace": "0.3.2",
    "design-core": "0.9.0",
    "runtime": "explicit native host/browser diagnostic"
  },
  "runs": [
    {
      "name": "Narrow/dark full Launcher + WebsiteMedia: 1 pass, 14 contrast failures",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native LAPIS_CATALOG_THEME=dark LAPIS_CATALOG_VIEWPORT=narrow pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/Launcher.stories.ts catalog/plugins/WebsiteMedia.stories.ts",
      "result": "fail",
      "failures": 14
    },
    {
      "name": "Fresh committed-source static Storybook build",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm exec storybook build --disable-telemetry --output-dir .local/storybook-website-committed",
      "result": "pass",
      "failures": 0
    }
  ],
  "remaining": [
    "Existing dark launcher settings/action/error foreground contrast fails across thirteen existing scenarios and the new Launcher scene; the new Workspace passes. Source-owned follow-up remains in the Notes workspace/Design Core theme path. No exemptions or consumer styling were added."
  ]
}
```
