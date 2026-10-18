# Blame scrolling and compact attribution preview

```json
{
  "id": "E-REPO-020",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
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
    "desktopBase": "b2ee7957",
    "storybook": "10.5.7",
    "svelte": "5.57.2",
    "designCore": "installed verified 0.5.1 archive",
    "pnpm": "10.34.5",
    "node": "26.9.0",
    "jj": "0.45.1"
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/BlameLayoutReview.stories.ts",
    "catalog/support/repository/blame-review/ReviewBlameGroup.svelte",
    "catalog/support/repository/blame-review/ReviewBlameRows.svelte",
    "catalog/support/repository/blame-review/ReviewBlameView.svelte",
    "catalog/support/repository/blame-review/large-fixture.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-REPO-020.md"
  ],
  "contractReview": "LD-CAT-001/002/003 review-only copies remain authorized pending visual confirmation. Copy production virtual rows first, then replace translateY transforms with top offsets so native sticky coordinates match source groups. Public Design Core ScrollArea owns the shared viewport and themed scrollbars; its public viewportRef feeds the existing virtualizer. The supported auto strategy retains the foundation-owned WebKit fallback. Remove only the attribution/source vertical divider and reduce line-number width with digit-aware allowance. Three synthetic commits use the user-provided info@lapis.md email through the existing Gravatar/profile component. LD-REPO-002/004 native pin, source, authorization, identity, annotation and lifetime remain unchanged; no production, dependency, native command or public API changes. Horizontal separators are inset shadows on the static source/gutter group boundary, not borders on sticky labels; this avoids a doubled line beneath the fixed file header.",
  "milestoneReview": "M13.2 keeps its original Done qualification; M13/M13.3 remain In progress. This preview does not qualify visual approval, live adoption, durable conversations, provider/native or release gates.",
  "scope": "One catalog blame-review family and its owned fixture/components, with canonical documentation and ledger updates. Production and native sources remain untouched. Whole-catalog/build/native lanes remain deferred by the user.",
  "remaining": [
    "User visual confirmation before production adoption.",
    "info@lapis.md currently has no returned Gravatar image: SHA-256 and MD5 endpoints both returned404 with d=404. The fixture intentionally preserves the normal fallback."
  ],
  "runs": [
    {
      "name": "sticky-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts -t \"Sticky Attribution\"",
      "result": "fail",
      "failures": 1,
      "note": "Exact new geometry case fails. Actual IAB at scroll307 shows the lines6\u201318 origin140px below its expected viewport top and the lines19\u201325 origin168px below its source boundary. Parent translateY offsets alter sticky containing coordinates. Log blame-sticky-before.log."
    },
    {
      "name": "sticky-exact",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/BlameLayoutReview.stories.ts -t \"Sticky Attribution|Large File\"",
      "result": "pass",
      "failures": 0,
      "note": "Both exact cases pass in a fresh runner. Covers pin, group push-off, next-group replacement, later virtual groups, horizontal gutter pin and shared ScrollArea. Log blame-sticky-exact.log."
    },
    {
      "name": "types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors/warnings. Log blame-scrollarea-types.log."
    },
    {
      "name": "visible-sticky",
      "command": "Actual in-app browser PageDown and geometry observation",
      "result": "pass",
      "failures": 0,
      "note": "IAB ScrollArea at scroll147: current lines6\u201318 origin equals viewport top138px; subsequent origins equal group/source tops495/691/747px. Shared component owns the viewport. No source writes or native process restart."
    },
    {
      "name": "gravatar",
      "command": "Read-only HEAD of Gravatar URLs for info@lapis.md using the existing SHA-256 format and legacy MD5",
      "result": "pass",
      "failures": 0,
      "note": "Both return404. This is external image unavailability, not a component error; user was informed. Existing initial/profile fallback is preserved."
    },
    {
      "name": "review-family-combinations",
      "command": "pnpm test:storybook catalog/plugins/repository/BlameLayoutReview.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All five review stories pass at desktop/narrow widths in light/dark:20 focused interaction/accessibility executions. Final checks include zero border on the pinned origin, static gutter separator, compact48px line-number gutter and no vertical attribution border. Log blame-sticky-final-states.log. Earlier sticky-only all-state and compact-family passes are in blame-scrollarea-all-states.log and blame-scroll-compact-family.log."
    },
    {
      "name": "final-types-and-documents",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Strict types zero errors/warnings, source/App audits pass, progress33tasks/122records, specification6validators/141chapters/94requirements, and mapped canonical source gate passes. Logs blame-sticky-final-{types,architecture,ownership,progress,spec,first}.log. Whole catalog, static application build, native qualification and live adoption are outside this review-only slice."
    },
    {
      "name": "visible-final-sticky",
      "command": "In-app browser StickyAttribution review and DOM geometry; save screenshot",
      "result": "pass",
      "failures": 0,
      "note": "At scroll1006px, the lines28\u201351 title top equals the viewport/header boundary138px; title border is0px and line-number gutter48px. Screenshot .local/reusable-conversations/blame-sticky-compact.png. Temporary capture tab closed; user LargeFile tab retained. This is visual evidence, not baseline approval."
    }
  ]
}
```

The user keeps implementation in Storybook until visual confirmation. This
record extends E-REPO-019, without adopting changes into shipping components.
The attribution label remains below the fixed file header while its source group
passes, and the next group pushes it out. Both columns share the same scroll
viewport; source line heights and immutable selections stay unchanged.
