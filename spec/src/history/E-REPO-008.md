# Repository canvas preview and shell surface correction

```json
{
  "id": "E-REPO-008",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-004",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-DESK-003",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-007"
  ],
  "revision": "enclosing Jujutsu change xzsvmntq",
  "versions": {
    "desktopBase": "4e628fb2ada8d7e00c667ad6948fca08cfa1fb75",
    "designCore": "aae7dc35",
    "platform": "macOS ARM64",
    "vitest": "4.1.11",
    "pnpm": "10.34.5"
  },
  "files": [
    "catalog/COVERAGE.md",
    "catalog/plugins/repository/ColumnInteractions.stories.ts",
    "catalog/plugins/repository/History.stories.ts",
    "src/components/repository/RepositoryShell.svelte",
    "spec/src/current/repository.md",
    "spec/src/current/plugins.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-REPO-008.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/verification.md"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "exact-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/History.stories.ts -t 'Pinned History And Diff'",
      "result": "fail",
      "failures": 1,
      "note": "The live 7490 preview had roughly 475px for history with both Notes sidebars open. Column Canvas correctly displayed only the selected compact diff. First assertion mistakenly called wide mode desktop; the corrected exact run still fails: expected wide, received compact. repository-preview-before{,-corrected}.log."
    },
    {
      "name": "exact-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/History.stories.ts -t 'Pinned History And Diff'",
      "result": "pass",
      "failures": 0,
      "note": "One case passes. The primary preview closes its disposable sidebars through mounted controls; adjacent columns and the public shell border/radius are required. Application sidebar preferences and dedicated NarrowPaneInWideShell coverage are preserved. repository-preview-after.log."
    },
    {
      "name": "types-renderer-and-audits",
      "command": "pnpm check:types\nnode --test tests/governance/*.test.mjs tests/renderer/*.test.mjs\npnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Zero type errors/warnings; 212 renderer/governance cases and both source/App ownership audits pass. repository-preview-{types,renderer,architecture,ownership}.log."
    },
    {
      "name": "ui-builds",
      "command": "pnpm build\npnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Renderer and static catalog build successfully. Existing pure-annotation and chunk-size advisories remain. repository-preview-{build,static}.log."
    },
    {
      "name": "repository-family",
      "command": "pnpm test:storybook catalog/plugins/repository",
      "result": "pass",
      "failures": 0,
      "note": "All 36 affected stories pass at desktop/narrow widths in light/dark themes: 144 interaction/axe checks. The embedded-shell height assertion now measures its actual public body region, preserving the intentional outer inset/border. repository-preview-stories.log."
    },
    {
      "name": "document-core-and-first",
      "command": "pnpm exec spec-validator validate --only governance,fileLimits,verification,summary,book\npnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "Five core validators pass: 122 chapters and 94 requirements. Spec-first passes five protected files/five canonical chapters. repository-preview-{doc-core,first}.log."
    },
    {
      "name": "formatting",
      "command": "pnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Complete Prettier and Rust formatting checks pass on the isolated UI change. repository-preview-format.log."
    },
    {
      "name": "unsupported-diff-option",
      "command": "jj --no-pager diff --check\njj --no-pager diff --word-diff-regex [^[:space:]]+ -- MIGRATION.md",
      "result": "fail",
      "failures": 2,
      "note": "Neither Git-style diff option is supported by this JJ version; no product validation ran. Normal scoped JJ diffs and passing formatter checks inspect the changes."
    },
    {
      "name": "complete-catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "Shared RepositoryShell serves both History and Op Log, so the workspace escalation ladder requires the complete catalog. All 192 cases pass independently in desktop/light, narrow/light, desktop/dark and narrow/dark: 768 interaction/axe checks, zero failures. Fresh Vitest/Vite/browser processes provide cold startup. repository-preview-catalog-full.log."
    },
    {
      "name": "initial-final-progress",
      "command": "pnpm progress:generate\npnpm check:progress",
      "result": "fail",
      "failures": 2,
      "note": "The new evidence initially used snake-case review keys instead of this repository's camel-case string fields. Progress also refused the fresh MIGRATION projection without evidence coverage. Correct the evidence schema and retain only the intended formatted projection before retrying. repository-preview-progress-final.log."
    },
    {
      "name": "formatted-projection-snapshot",
      "command": "pnpm exec prettier --write MIGRATION.md spec/src/history/E-REPO-008.md\npnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "Prettier returns the generated projection to identical parent bytes, but check:progress initially reads JJ's previous unsnapshotted projection. Snapshot with jj st before the exact retry. repository-preview-progress-final2.log."
    },
    {
      "name": "final-document-consumers",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:check\npnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes 33 tasks/106 evidence records. All four specification lanes pass, including six validators, source/App audits, mdBook, Rust formatting and spec-first. Complete Prettier/Rust formatting passes. Formatting returns MIGRATION.md to parent bytes; no generated projection churn is committed. Logs repository-preview-progress-final3.log, repository-preview-spec-final.log and repository-preview-format-final.log. The final evidence-only update repeats progress/spec validation and scoped formatting."
    }
  ],
  "contractReview": "LD-REPO-004 and LD-CAT-001/002/003: keep public shell surface tokens and a useful wide primary review while retaining pane-relative compact behavior. LD-DESK-003 ownership/lifetime and native storage/transport contracts are unchanged.",
  "milestoneReview": "M13.2 remains Done; M13/M13.3 retain In progress and original gates. This UI correction does not qualify managed capture, native agent admission, renderer persistence or chat/restart. Visual approval remains pending."
}
```

Fresh Vitest processes provide cold Vite/browser startup for this presentation
slice. No native code or lifecycle changed; Rust/native/provider lanes are out
of scope. Live IAB inspection confirms both columns and the restored shell.
Local screenshot: `.local/reusable-conversations/repository-preview.png`. Visual
baselines remain pending.
