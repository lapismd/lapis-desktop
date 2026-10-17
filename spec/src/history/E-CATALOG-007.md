# Lapis reading-view sizing

```json
{
  "id": "E-CATALOG-007",
  "tasks": ["M8.5"],
  "requirements": ["LD-CAT-001", "LD-CAT-003", "LD-GOV-002", "LD-GOV-003"],
  "revision": "enclosing Jujutsu change",
  "versions": {
    "desktop": "0.1.0",
    "markdown": "0.1.6",
    "markdownSource": "8c345d30b497e7678ebc5f410d43dfacf12e6f37",
    "markdownSha256": "94961f48973de70cc8a610a88c2064fc7e06051113915dd03d481a4689a91401"
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/Workspace.stories.ts",
    "spec/src/current/plugins.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-007.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "result": "pending",
  "remaining": [
    "User-deferred source/catalog interaction, accessibility, full consumer and native suites.",
    "Source short/long review stories are authored; their complete lane remains deferred.",
    "Visual review and baseline approval remain pending."
  ],
  "runs": [
    {
      "name": "before",
      "command": "Desktop/Notes workspace/EditNote switched to Reading; inspect the preview's DOM geometry",
      "result": "fail",
      "failures": 1,
      "note": "One reported layout defect. The preview and inner Mira are 620px tall inside an 868px reading pane. The outer editor fills the pane but its inner block wrappers do not stretch."
    },
    {
      "name": "source-static-and-package",
      "command": "Markdown package check/build/publint; source spec validation/spec-first/App audit; isolated-base package build and pnpm pack",
      "result": "pass",
      "failures": 0,
      "note": "Source Svelte check has zero errors/warnings. Source spec passes 6 validators, 27 chapters, 601 requirements and maps 2 protected files to 1 chapter. Audit retains two existing ignored advisories. Full suites remain deferred; source evidence records the initial missing Svelte formatter plugin separately."
    },
    {
      "name": "public-archive-intake",
      "command": "pnpm local:install",
      "result": "pass",
      "failures": 0,
      "note": "14 checksum-verified local archives across 14 import routes. Only Markdown changes. An isolated source candidate adds the same Lapis-wrapper layout fix to the previously installed d76ed202 base, excluding unrelated newer persistence changes. Portable tracked dependency files remain unchanged."
    },
    {
      "name": "cold-manual-review",
      "command": "Fresh pnpm storybook; Notes workspace/ReadingNote and ReadingNoteDark; measure preview against its scroll viewport",
      "result": "pass",
      "failures": 0,
      "note": "Original tall light pane: preview and viewport both 868px, ending at 948px; no extra short-note scroll range. Light/dark review scenes both fill their 600px viewport. A disposable 40-section dark note grows to 4433px through the outer 600px Scroll Area; wheel scrolling reaches Section 40. Inner preview overflow stays visible. Saved reading-fill-light/dark/long.png under .local/qualification/catalog-review."
    },
    {
      "name": "static-governance",
      "command": "pnpm progress:generate; pnpm spec:validate; pnpm spec:first; pnpm check:progress; pnpm check:architecture; pnpm check:app-ownership; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "Specification, spec-first, progress, formatting and explicit source/App-boundary audits pass: 6 validators, 105 chapters, 93 requirements; 4 protected files, 2 chapters; 33 tasks, 90 evidence records. Generated MIGRATION.md remains unchanged because task statuses and next actions are unchanged."
    }
  ],
  "milestoneReview": "M8.5 remains In progress under the existing test deferral; no native or original aggregate gate is completed and AI migration remains paused.",
  "contractReview": "The user explicitly localized sizing to Lapis's Markdown view layer shared by its hosts. The source-owned markdown-view__reading wrapper stretches its inner flex layers while retaining the existing outer Scroll Area. Mira, other Markdown consumers and desktop production styles remain unchanged."
}
```

Source evidence lives at
`lapis-plugins/spec/records/2026-10-17-reading-surface-fill.md`. The production
fix is in Lapis's shared Markdown reading wrapper, with portable Mira unchanged.
Desktop adds only consumer review scenarios and coverage. Source stories cover
short/long notes in both themes; desktop ReadingNote scenarios extend real note
editing into Reading and assert that its painted surface fills the viewport. No
package publication, signing, push, native build or baseline update occurs.
