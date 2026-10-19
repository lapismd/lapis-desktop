# Remembered blame wrapping

A default-on header toggle remembers wrapping in local storage. Measured virtual
groups retain source/attribution alignment after toggles and viewport resize.

```json
{
  "id": "E-REPO-044",
  "date": "2026-10-19",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M13.2"],
  "requirements": ["LD-REPO-004", "LD-CAT-003"],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "designCore": "0.5.1",
    "desktopParent": "06b2c8a8"
  },
  "contractReview": "Blame has a default-on header Wrap text control using public shadcn Toggle/Tooltip. An application-local browser-storage preference is restored in new file panes; unavailable storage retains a usable session choice. Source bytes, logical line numbers, operation pins, authorization and native reads remain unchanged. App-owned virtual groups use measured heights, remeasure on wrap/width changes and keep an explicit pane-lifetime virtualizer subscription so live review callbacks cannot retain old offsets. No foundational package changes or overrides.",
  "milestoneReview": "M13.2 remains Done at its original qualified history gate. This UI-only presentation extension does not change native authority or promote M13.3/M14/provider/platform/release gates. Visual baselines remain unapproved; wider qualification remains deferred under the user minimal-testing request.",
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/BlameWrapping.stories.ts",
    "catalog/support/repository/blame-review/BlameReviewDemo.svelte",
    "catalog/support/repository/blame-review/large-fixture.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-REPO-044.md",
    "spec/src/history/index.md",
    "src/components/repository/blame/RepositoryBlameGroup.svelte",
    "src/components/repository/blame/RepositoryBlamePanel.svelte",
    "src/components/repository/blame/RepositoryBlameRows.svelte",
    "src/components/repository/blame/RepositoryBlameView.svelte",
    "src/lib/repository/blame-preferences.ts"
  ],
  "runs": [
    {
      "name": "before",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/repository/BlameWrapping.stories.ts",
      "result": "fail",
      "failures": 2,
      "note": "Both new stories fail on the absent Wrap text header control. before.log."
    },
    {
      "name": "initial-after",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/repository/BlameWrapping.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "2 cases pass for default wrapping, long paragraphs/unbroken paths, exact source text, resize/group alignment and remembered on/off after closing/reopening. after.log; repeated after the local-state rename in final.log."
    },
    {
      "name": "type-before",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 3,
      "note": "Svelte type generation confused the local state variable with the second $state rune. Renaming it viewState resolves all three diagnostics without changing controller ownership. types.log; types-final.log then reports zero errors/warnings."
    },
    {
      "name": "direct-consumers",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/repository/BlameLayoutReview.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "10 existing interaction/axe cases pass, including progressive source, title actions, failure/toast recovery, loading, commit details, large-file scrolling and sticky attribution. consumers.log."
    },
    {
      "name": "live-overlap-before",
      "command": "CUA cold load and manual wrap toggles in the hosted long-lines story at port 7491",
      "result": "fail",
      "failures": 1,
      "note": "Live WebKit review showed the first group growing to 924px while the next group retained top:112px. Chromium interaction checks did not expose the expired store publication. Direct height updates alone were insufficient; explicit pane-lifetime subscription fixes offset publication. The long-lines story now additionally asserts repeated toggles after its initial resize path. overlap-before.log passes one Chromium case and is not claimed as a reproduction."
    },
    {
      "name": "webkit-experiment",
      "command": "pnpm exec vitest run --config .local/verification/blame-wrap/vitest.webkit.config.ts catalog/plugins/repository/BlameWrapping.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Both interactions pass in fresh WebKit, but the global afterAll requires Chromium --expose-gc and fails the file. This unsupported automation lane is not claimed passed; the existing GC gate and assertions remain unchanged. webkit-before.log. Manual ordinary hosted WebKit review is recorded separately."
    },
    {
      "name": "live-overlap-after",
      "command": "CUA cold reload, manual off/on toggles and scrolling in desktop-repository-blame-wrapping--long-lines",
      "result": "pass",
      "failures": 0,
      "note": "After explicit pane-lifetime subscription, manual off gives first height112/next top112 and on gives first height924/next top924. Scrolling visibly retains non-overlapping source and sticky attribution. review.png. subscription-after.log also passes both focused Chromium cases."
    },
    {
      "name": "complete-blame-surface",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/repository/BlameWrapping.stories.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/repository/BlameLayoutReview.stories.ts\npnpm check:types\npnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "12 interaction/axe cases pass across all 3 directly affected blame story families with final pane-owned subscription. Zero type errors/warnings; architecture and explicit App ownership pass. complete-surface.log, types-complete.log, architecture-final.log, ownership.log."
    },
    {
      "name": "documents-before",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:first\npnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Progress and spec-first pass (41 tasks/177 evidence records; 11 protected files/5 canonical chapters). desktop.md was 32771 bytes, three over its limit. Condensing the introductory footer reference preserves all requirement/evidence IDs and resolves the limit. spec-validate.log."
    },
    {
      "name": "documents-final",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:validate\npnpm spec:first\npnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0,
      "note": "Progress: 41 tasks/177 evidence records. Specification: 6 validators/203 chapters/95 requirements. Spec-first: 11 protected files/5 canonical chapters. Changed-file formatting passes; no baseline or original milestone gate changes. generate.log, progress-final.log, spec-validate-final.log, spec-first.log, format.log."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "No Rust/native service behavior changed; native tests and rebuilds are out of scope.",
    "Full catalog/theme/platform/release matrices and visual baseline updates are deferred. WebKit automation requires separate engine-aware harness resource cleanup; no test infrastructure was weakened."
  ]
}
```
