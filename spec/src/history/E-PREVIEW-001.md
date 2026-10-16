# E-PREVIEW-001: Editable Markdown preview recovery

This record preserves independent before/after results and the unchanged
milestone gates.

```json
{
  "id": "E-PREVIEW-001",
  "tasks": ["M4"],
  "requirements": ["LD-LIFE-004", "LD-LIFE-007"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "specValidator": "0.1.4"
  },
  "completedGates": {},
  "files": [
    "MIGRATION.md",
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-PREVIEW-001.md",
    "spec/src/history/index.md",
    "tests/desktop/preview-conflicts.test.mjs"
  ],
  "result": "pending",
  "remaining": ["Complete updated-cohort source and consumer qualification."],
  "runs": [
    {
      "name": "native-unsafe-before",
      "command": "node --test --test-concurrency=1 tests/desktop/preview-conflicts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "On the original cohort Close exits and external disk bytes are replaced by the local preview draft."
    },
    {
      "name": "visible-recovery-before-link-fix",
      "command": "node --test --test-concurrency=1 tests/desktop/preview-conflicts.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passedCases": 2,
        "failedCases": 1
      },
      "note": "Accepting disk updates a retained invisible writer while the replacement visible editor keeps old text. Source tracing establishes the duplicate writer and is removed after diagnosis."
    },
    {
      "name": "exact-native-preview-after",
      "command": "node --test --test-concurrency=1 tests/desktop/preview-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "coldCases": 3
      },
      "note": "External edit blocks Close; repeated changes require a new decision; Keep survives restart. Accept disk updates the visible editor and later saves work. Closing the owner tab retains the failed draft and shutdown barrier. Axe reports no violations."
    },
    {
      "name": "source-public-helper-and-plugin",
      "command": "pnpm test --force; pnpm check --force; pnpm build --force; pnpm test:release",
      "result": "pass",
      "failures": 0,
      "counts": {
        "apiExactCases": 22,
        "notesUnits": 1591,
        "apiUnits": 1014,
        "notesChecks": 18,
        "notesBuilds": 10,
        "pluginExactCases": 16,
        "pluginUnits": 796,
        "pluginChecks": 13,
        "pluginBuilds": 12,
        "pluginReleaseToolCases": 119
      },
      "note": "Source-owned full lanes and the built API public contract pass. Plugin audit retains its existing exceptions; no new ignore is added."
    },
    {
      "name": "native-editing-accessibility-before-paint",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 1,
      "counts": {
        "webviewPassed": 26,
        "webviewFailed": 1
      },
      "note": "The original exact editing axe check finds aria-hidden-focus in Mira's gutter before its deferred measurement frame. Reading and all other WebView checks pass. Mira's real EditorView regression reproduces one failure, then both source cases pass after coalescing DOM-attribute ownership into a microtask. No native test wait, accessibility exclusion or consumer workaround is introduced."
    },
    {
      "name": "source-gutter-qualified",
      "command": "pnpm check:all; pnpm test:storybook --no-file-parallelism; pnpm packages:check; pnpm packages:pack; pnpm build-storybook; pnpm exec playwright test -c .visual-delta/cache/preview-playwright.config.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "units": 444,
        "coreUnits": 385,
        "exactGutterCases": 2,
        "focusedToolbarCases": 3,
        "interactions": 160,
        "coldBrowserCases": 52,
        "publicPacks": 6
      },
      "note": "The original Mira server on 7007 is preserved; cold browser acceptance uses 7107. Source specification checking passes all four lanes."
    }
  ],
  "contractReview": "Mira owns portable sessions and recovery protection; API owns document baselines and conflict actions; Markdown binds the captured source to its original App. Desktop exercises public exports without a second persistence path.",
  "milestoneReview": "M4 remains In progress under its original gate. Editable previews are a separately qualified writer. Properties/frontmatter and metadata writers remain unaudited; LD-LIFE-004 and LD-LIFE-007 stay Planned. No completedGates.M4 entry is permitted."
}
```
