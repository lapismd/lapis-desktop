# Compact repository column headers

```json
{
  "id": "E-REPO-009",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-DESK-003",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-006",
    "LD-GOV-007",
    "LD-GOV-009"
  ],
  "revision": "enclosing Jujutsu change zoyxpuos",
  "versions": {
    "desktopBaseChange": "rxxunmvw (independent native-read slice)",
    "jjStoreReference": "9b1c6ec38229b5dbf3678462dc212cec20f6d53c",
    "pnpm": "10.34.5",
    "node": "26.9.0",
    "platform": "macOS ARM64"
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/Header.stories.ts",
    "docs/provenance.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/index.md",
    "src/components/repository/RepositoryLogHeader.svelte",
    "src/components/repository/RepositoryOperations.svelte",
    "src/components/repository/RepositoryPanel.svelte",
    "spec/src/history/E-REPO-009.md"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "initial-filtered-attempt",
      "command": "pnpm test:storybook catalog/plugins/repository/Header.stories.ts -t HistoryStartsWithColumnHeader",
      "result": "pending",
      "failures": 0,
      "note": "The export-name filter does not match Storybook display names: all four viewport/theme invocations skip their case. This is no acceptance proof. header-before.log."
    },
    {
      "name": "original-header-regression",
      "command": "pnpm test:storybook catalog/plugins/repository/Header.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "The unfiltered original regression fails on desktop/light because the extra Repository history h2 remains above the Column Canvas. The script stops at that first failure. header-before-exact.log."
    },
    {
      "name": "qualified-header-layout",
      "command": "pnpm test:storybook catalog/plugins/repository/Header.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Both History and Op Log header cases pass in all four viewport/theme combinations: eight checks including axe. Controls live in their header group, duplicate body headings are absent, header geometry starts within the canvas inset and neither header overflows. header-qualified.log. The earlier header-after.log predates addition of the second case and is only preliminary."
    },
    {
      "name": "types-and-owned-boundaries",
      "command": "pnpm check:types\npnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Zero type errors/warnings and both source boundaries pass. header-{types,architecture,ownership}.log."
    },
    {
      "name": "all-repository-interaction-and-accessibility",
      "command": "pnpm test:storybook catalog/plugins/repository",
      "result": "pass",
      "failures": 0,
      "note": "All six repository story files pass in each viewport/theme combination: 38 cases each, 152 total. Includes pin retention and explicit multiple-head/merge-parent selection, changed files/diffs, empty/loading/refusal, clipboard notices and retry/recovery. Each invocation starts fresh Vite and Chromium. header-repository.log."
    },
    {
      "name": "renderer-and-catalog-builds",
      "command": "pnpm build\npnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Both builds pass. Existing PURE annotation/chunk-size advisories remain unchanged. header-build.log and header-storybook-build.log."
    },
    {
      "name": "renderer-governance-compatibility",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All 212 renderer/governance cases pass. header-renderer.log."
    },
    {
      "name": "document-qualification",
      "command": "pnpm progress:generate\npnpm exec prettier --write MIGRATION.md\npnpm check:progress\npnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes 33 tasks/109 records; all four spec lanes pass. Generated MIGRATION returns to parent bytes after formatting. No native milestone gate/status changes. header-{progress-generate,migration-format,progress-pending,spec-pending}.log."
    },
    {
      "name": "full-catalog-interaction-and-accessibility",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "All 49 story files and 194 cases pass in each of desktop/light, narrow/light, desktop/dark and narrow/dark: 776 total interaction/axe checks. Each uses a cold isolated Vite/browser process. header-catalog-full.log."
    },
    {
      "name": "final-document-consumers",
      "command": "pnpm check:progress\npnpm spec:check\npnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Final status passes: 33 tasks/109 evidence records, all four spec lanes and full formatting. header-{progress,spec,format}-final.log. Native and visual approval gates remain unchanged."
    }
  ],
  "contractReview": "LD-REPO-004: History and Op Log now start directly with public Column Canvas headers like jj-store. The shared Notes header adapts the source title/count/action/toggle composition, with native pin selection and refresh in its compact actions. Full native identities remain select values and accessible descriptions; only visible labels abbreviate. Loading, empty, unavailable and multi-head explanations stay in the column body. LD-REPO-002 operation pins, source admission, comparison callbacks, native transports, mutation and receipt formats are unchanged. Source attribution is recorded in docs/provenance.json.",
  "milestoneReview": "NOTES-05H qualifies the requested header presentation. M13.2 remains Done under its original gate; M13/M13.3 remain In progress. Visual baseline approval, actual managed conversation/renderer persistence and native restart acceptance retain separate gates. Native read acceptance is independently recorded in E-AI-037; UI evidence adds no native execution or managed-chat proof.",
  "scope": "The shared header changes both repository views and all their loading/selection/recovery states. Exact failing header proof precedes both width/theme cases, all repository stories, full catalog interaction/axe, strict types/ownership, renderer/governance, renderer/static catalog builds and document consumers. Every catalog invocation uses a fresh isolated Vite/browser process. Rust, external providers, new native foreground acceptance and visual baseline updates are outside this UI-only slice."
}
```
