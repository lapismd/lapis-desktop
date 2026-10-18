# Regular log row preview and verified Gravatar fixture

```json
{
  "id": "E-REPO-022",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-REPO-004",
    "LD-MIG-002",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-007"
  ],
  "date": "2026-10-18",
  "result": "pending",
  "revision": "enclosing-change",
  "versions": {
    "desktopBase": "c951ed1d",
    "storybook": "10.5.7",
    "svelte": "5.57.2",
    "designCore": "installed verified 0.5.1 archive",
    "pnpm": "10.34.5"
  },
  "files": [
    ".storybook/preview.css",
    "catalog/support/repository/blame-review/large-fixture.ts",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/plugins.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-REPO-022.md"
  ],
  "contractReview": "LD-CAT-001/002/003 preview-first scope: E-REPO-021 affected only parity compositions, leaving regular plugin tabs opened from the blame story grey. Catalog CSS now paints application-owned graph list hosts with --background, retaining transparent resting rows, existing hover/selection rules and column headers. No dependency-internal selectors or production changes. Three synthetic blame signatures use the user-supplied dev@lapis.md through the existing production SHA-256 Gravatar helper and public Design Core AuthorCard/Avatar. LD-REPO-004 native identities, pinning, data and authorization remain unchanged.",
  "milestoneReview": "M13.2 keeps its original Done qualification; M13/M13.3 remain In progress. Preview approval, production adoption and original native/conversation/release gates remain separate.",
  "remaining": [
    "User visual confirmation before production adoption.",
    "Native csp/devCsp img-src currently omit Gravatar. Native image admission and qualification remain a production adoption task; this preview does not change security policy."
  ],
  "runs": [
    {
      "name": "gravatar-http",
      "command": "node --input-type=module: SHA-256/MD5 of normalized info@lapis.md and dev@lapis.md with fetch(GET) of https://www.gravatar.com/avatar/HASH?d=404&s=80",
      "result": "pass",
      "failures": 0,
      "note": "Both info hashes return404. Both dev hashes return200 image/png,4078bytes. Known public Gravatar example returns200, and info d=identicon returns200, confirming the original404 is a missing account image. No image downloads or replacement initials assets."
    },
    {
      "name": "actual-story-before-after",
      "command": "CUA IAB: desktop-repository-blame-layout-review--large-file; open regular Repository Op Log and Repository History through their ribbon actions; inspect computed graph styles and blame img elements",
      "result": "pass",
      "failures": 0,
      "note": "Before: transparent operation graph over column rgb(250,250,250). After: both regular graph lists compute rgb(255,255,255), with unselected rows transparent over white. Dev SHA-256 image is complete with naturalWidth80 in rendered blame avatars. Screenshots: .local/reusable-conversations/regular-{oplog,jjlog}-white.png and blame-dev-gravatar.png. UI observations are separate from automated tests and visual approval."
    },
    {
      "name": "types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and warnings; .local/reusable-conversations/log-rows-gravatar-types.log."
    },
    {
      "name": "documents",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm exec prettier --write/--check on changed CSS, TS and Markdown files",
      "result": "pass",
      "failures": 0,
      "note": "Progress124 evidence/33 tasks; six validators,143 chapters,94 requirements; spec-first passes. No milestone status changes. Logs use .local/reusable-conversations/log-rows-gravatar-{progress,spec,first}.log."
    }
  ],
  "scope": "Catalog-only visual changes. Automated story suites, native builds, live-policy changes and broad checks remain deferred under the user's preview-first instruction."
}
```
