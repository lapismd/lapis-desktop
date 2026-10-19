# Shared search input presentation

Design Core owns search borders, focus rings and suggestion typography/layout.
Desktop consumes the verified public archive without local CSS overrides.

```json
{
  "id": "E-CATALOG-014",
  "date": "2026-10-19",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8.5", "M10.2"],
  "requirements": [
    "LD-AI-002",
    "LD-AI-004",
    "LD-CAT-003",
    "LD-GOV-004",
    "LD-MIG-002"
  ],
  "versions": {
    "desktop": "0.1.0",
    "designCore": "0.5.1",
    "pnpm": "10.34.5",
    "sourceRevision": "b3fb5ea7cf2556e8eea35da2eb00dd1a4465806f"
  },
  "contractReview": "Design Core DC-FILTER-003 owns shadcn Input resting-border and transparent focused-border/ring token parity, including ancestor overrides, and sans completion labels above wrapping descriptions. DC-FILTER-006 borderless/invalid custom-language semantics are preserved. Desktop History/Catalog retain controlled queries, filtering, actions and lifetime. No public props, native authority or query execution changes; no source aliases, dependency patches or consumer CSS masks.",
  "milestoneReview": "M8.5 and M10.2 remain In progress with their original native/provider gates. Focused presentation evidence does not promote migration, platform or distribution qualification. The summary text is condensed only to keep the milestone document within its existing byte limit.",
  "files": [
    "MIGRATION.md",
    "spec/src/current/ai-presentation.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-014.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "runs": [
    {
      "name": "source-regression",
      "command": "Core: exact input stories before/after, search-filter-bar stories, filter unit tests, check:types, check:no-tailwind, scoped Prettier, spec:check",
      "result": "pass",
      "failures": 0,
      "note": "2 original presentation failures become 3 passes; final family 12 passes, filter unit 80 passes and all 4 source/consumer type checks pass. Quoted-path final presentation rerun 2 passes. A new fixture initially omitted required operators and was corrected; initial spec atomic-bullet failure corrected. Source spec/records/2026-10-19-search-input-presentation.md retains all attempts. Source spec passes 3 lanes. No baseline update."
    },
    {
      "name": "prepared-public-archive",
      "command": "Core packLocal suffix -search-presentation; pnpm local:install .local/archives/search-presentation-review.json",
      "result": "pass",
      "failures": 0,
      "note": "Archive design-core/.local/packages/lapismd-design-core-0.5.1-search-presentation.tgz SHA256 3cd519df4986b772802d6664e5b54c1c666b16bb49a1b9bb4f63640fbf67ceb2. Prepared CSS compiled3/audited257/remaining0; 14 verified archives across 14 routes, tracked manifests/lockfile preserved. /tmp/design-core-search-pack.log and /tmp/desktop-search-install.log. Existing peer/build-script advisories remain."
    },
    {
      "name": "direct-consumer-interactions",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/History.stories.ts catalog/plugins/ai/Catalog.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Fresh Chromium 1320x900: 8 interaction/accessibility stories pass in 2 files. /tmp/desktop-search-consumers.log. Source directly checks actual shadcn focus parity across light/dark/ancestor tokens, field/operator/value geometry and keyboard completion."
    },
    {
      "name": "consumer-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors/warnings; /tmp/desktop-search-types.log."
    },
    {
      "name": "review-refresh",
      "command": "pnpm storybook:restart -- --port 7491; restart verified checkout-owned pnpm dev --no-watch process tree",
      "result": "pass",
      "failures": 0,
      "note": "Storybook50564 serves the new archive; review supervisor53887 starts Vite1431 and native target/debug/lapis-desktop, retaining the existing vault/profile. Incremental dev build succeeds with the existing unwind-table linker advisory. /tmp/desktop-search-storybook.log and .local/verification/search-presentation/review-app.log/json. Source Storybook9009 manual WebKit preview confirms stacked sans labels/descriptions and focused ring; Core .local/verification/search-presentation/suggestions.png. Desktop browser navigation initially timed out while cold dependencies rebuilt; automated fresh consumer evidence is separately passing. Startup is review evidence, not native acceptance. Subsequent Desktop WebKit navigation succeeds and confirms transparent border plus 3px theme ring on the actual packaged History input."
    },
    {
      "name": "initial-document-gate",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Progress generation/check pass, but spec rejected missing generated MIGRATION.md evidence coverage and a milestone table 36 bytes over its limit after formatting. Added generated-file coverage and condensed narrative, preserving every task status/dependency/requirement/gate/next action. /tmp/desktop-search-spec.log."
    },
    {
      "name": "generated-summary-format",
      "command": "scoped pnpm exec prettier --check",
      "result": "fail",
      "failures": 1,
      "note": "Generated MIGRATION.md initially needed formatting; applied Prettier and reran formatting plus semantic progress validation. No generator implementation change."
    },
    {
      "name": "final-document-gates",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check; scoped Prettier check; compare task columns with parent",
      "result": "pass",
      "failures": 0,
      "note": "41 tasks/178 evidence records validate; spec validation, Rust formatting, mdBook and spec-first pass (4 lanes). Scoped formatting passes after formatting the generated summary; task statuses/dependencies/requirements/gates/next actions match parent. /tmp/desktop-search-{progress-final,spec-final,format-final}.log. No milestone promotion."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "User requests minimal testing; aggregate catalog/theme/viewport, native/provider/platform and visual-baseline matrices remain deferred.",
    "files.exclude is registered in core with .git/.jj defaults; no visible Files settings page is claimed or added by this presentation change."
  ]
}
```
