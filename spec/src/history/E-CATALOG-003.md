# Desktop shell and Storybook review

```json
{
  "id": "E-CATALOG-003",
  "tasks": ["M8.5"],
  "requirements": [
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-FILE-008",
    "LD-DESK-001",
    "LD-GOV-002",
    "LD-GOV-003"
  ],
  "revision": "enclosing Jujutsu change",
  "versions": {
    "design-core": "0.5.1; main e0ca382f plus existing desktop contracts fa174d7e",
    "notes": "prepared runtime 19d3c58d",
    "plugins": "prepared manifests d76ed202",
    "storybook": "10.5.7"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/desktop/FileConflicts.stories.ts",
    "catalog/plugins/desktop/Startup.stories.ts",
    "catalog/plugins/terminal/Terminal.stories.ts",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/desktop/FileConflictsDemo.svelte",
    "catalog/support/terminal/TerminalDemo.svelte",
    "catalog/support/terminal/review.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-003.md",
    "spec/src/history/index.md",
    "src/components/files/ConflictReview.svelte",
    "src/components/files/FileConflicts.svelte",
    "src/components/files/conflict-review-state.svelte.ts",
    "src/components/files/conflict-review-view.ts",
    "src/components/files/register-conflict-reviews.ts",
    "src/components/views/NotesWorkspace.svelte"
  ],
  "result": "pending",
  "remaining": [
    "User-deferred source tests, checks and interaction/accessibility lanes for the combined dependency cohort.",
    "Update and run native conflict acceptance against Problems and the shared comparison; native builds deferred by request.",
    "Resume the original migration gates separately; this review does not complete M8.5 or M10.2.",
    "Visual review and baseline approval remain pending."
  ],
  "runs": [
    {
      "name": "before-review",
      "command": "User annotations and source inspection of Dark, FailedRecoveryAction, FileConflicts and Terminal stories",
      "result": "pending",
      "failures": 0,
      "note": "No automated before count: user explicitly deferred test suites. Reported white editor, unpainted banner, separate conflict UI and visible Terminal fixture JSON."
    },
    {
      "name": "notes-packaging",
      "command": "pnpm --recursive --workspace-concurrency=1 --filter @lapis-notes/ui --filter @lapis-notes/api --filter @lapis-notes/workspace --filter @lapis-notes/file-explorer build; pnpm --filter @lapis-notes/api build",
      "result": "pass",
      "failures": 0,
      "note": "Public dist refresh; API declaration compile and publint included. Not a test-suite or consumer qualification pass."
    },
    {
      "name": "plugins-packaging",
      "command": "pnpm --recursive --workspace-concurrency=1 --filter @lapis-notes/source-editor --filter @lapis-notes/markdown --filter @lapis-notes/search --filter @lapis-notes/graph build",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "direct-main-preview",
      "command": "Prepare Design Core e0ca382f and view desktop-notes-workspace--dark",
      "result": "fail",
      "failures": 1,
      "note": "Workspace construction fails because main lacks the desktop migration setCloseGuard contract. Preserve original guarded-close and drained-plugin changes on top of current main; no consumer shim."
    },
    {
      "name": "combined-package-intake",
      "command": "Design Core packLocal fa174d7e; pnpm pack --config.ignore-scripts=true for eight refreshed packages; pnpm local:install",
      "result": "pass",
      "failures": 0,
      "note": "14 checksum-verified archives and 14 import routes; tracked manifests and registry lock resolution preserved. Design Core CSS: 3 compiled, 253 audited, zero remaining utility references. Existing Svelte 5.56.10 peer warning against desktop 5.57.2 remains; no peer warning is hidden."
    },
    {
      "name": "manual-catalog-preview",
      "command": "Cold pnpm storybook; view Dark, ProblemsList -> conflict action, ModifiedOnDisk, FailedRecoveryAction, MultipleTerminals",
      "result": "pending",
      "failures": 0,
      "note": "Manual presentation review only. Dark editor, opaque banner/icons and actual Problems-to-MergeEditor navigation observed. Initial review creation left the new tab inactive; explicitly activate, reveal and publish the owned layout after routing. Suites and native acceptance remain deferred."
    },
    {
      "name": "deferred-tests",
      "command": "Source/desktop functional, interaction/axe, full builds and native acceptance",
      "result": "pending",
      "failures": 0,
      "note": "Not run at user request; no full-gate or automated pass count claimed."
    },
    {
      "name": "bookkeeping-before",
      "command": "pnpm spec:validate; pnpm check:progress",
      "result": "fail",
      "failures": 3,
      "note": "Initial review evidence used an unsupported two-word identity and omitted required review fields; the added desktop contract section also exceeded its byte bound. Use E-CATALOG-003, add the required reviews and compact existing startup prose while preserving its contract."
    },
    {
      "name": "bookkeeping-recovery",
      "command": "Restore immutable historical evidence; allocate fresh E-CATALOG-003; rerun pnpm spec:validate and pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "The intermediate E-REVIEW-001 name collided with historical evidence. Its committed bytes were restored unchanged; all new references use the fresh catalog record. Initial document byte limits and missing schema fields are corrected without changing gates."
    },
    {
      "name": "static-governance",
      "command": "pnpm spec:validate; pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "Desktop specification: 6 validators, 101 chapters, 93 requirements. Source/app boundaries and progress bookkeeping pass. Notes and Plugins specification validation/spec-first pass; Design Core specification validation passes. These are static/bookkeeping checks, not the deferred product/test gates."
    },
    {
      "name": "spec-first-mapping-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "The new review task and generated migration summary require the migration contract to document the explicitly deferred review slice; the mapping is now present."
    },
    {
      "name": "formatting",
      "command": "pnpm exec prettier --plugin prettier-plugin-svelte --check <changed files>",
      "result": "pass",
      "failures": 0,
      "note": "The first check flags only generated MIGRATION.md table formatting; formatting that projection fixes it. Progress accepts equivalent Markdown whitespace. No product tests are run."
    }
  ],
  "milestoneReview": "M8.5 remains In progress; requested source/catalog and native qualification are deferred. M10.2 and prior completed gates retain their existing statuses.",
  "contractReview": "Desktop owns conflict routing and whole-version decisions through existing writer actions; shared diagnostics and banner changes are source-owned. Fixtures expose product UI only. No native authority, Deno, publication or visual-baseline change."
}
```

The user authorized shared production presentation plus stories, with tests and
native builds deferred. Deno stays frozen. No native service, save pipeline,
permission, installed application or ordinary development vault changes here.

File conflicts reveal Problems through an App-owned diagnostic collection.
Opening a row reuses or creates the desktop conflict review. Design Core's
read-only three-way editor shows draft, baseline and disk snapshots; footer
choices call the existing guarded writer actions. Closing the view retains the
conflict. Resolution removes its diagnostic and review. Unreadable snapshots,
stale decisions, failed writes, pending recovery and guarded leave retain
stories. The new API diagnostic-resource hook and opaque banner/icons live
upstream.

Terminal fixtures keep observations/actions in a private WeakMap, outside the
visible DOM. They seed the existing review layout with both sidebars closed.
Story plays retain persistence, input, resize, lifecycle and session
observations. The Safe Mode failure fixture now displays a realistic retry
message.

Current source-only dependency compatibility accepts 0.4 and 0.5.1. The ignored
local archive overlay selects the newest local Design Core main plus the two
existing desktop lifecycle/popup changes. Their original qualified lineages are
preserved. Full combined-cohort validation is deferred; earlier passing evidence
is not attributed to this combined candidate. Source and consumer records are
separate. No package is published, signed, released or pushed.

## Prepared archive provenance

| Package                    | Version | Source snapshot                            | SHA256                                                             |
| -------------------------- | ------- | ------------------------------------------ | ------------------------------------------------------------------ |
| @lapis-notes/ui            | 0.1.3   | `19d3c58d4b4a45c1a73f195f16cac51330f2af09` | `5473c8c9531d672f227ac0cd3d955b9eaebc249689f40d7be8580a2a99a9245c` |
| @lapis-notes/api           | 0.1.4   | `19d3c58d4b4a45c1a73f195f16cac51330f2af09` | `2110026fcdb326f35e62678c965f5feedf0e62b1e38ca72da4b181d2b851d435` |
| @lapis-notes/file-explorer | 0.1.2   | `19d3c58d4b4a45c1a73f195f16cac51330f2af09` | `84bf066037fe866e0d94667adac12af6f88fa8f8455b4b4bda91610add5b5048` |
| @lapis-notes/workspace     | 0.2.1   | `19d3c58d4b4a45c1a73f195f16cac51330f2af09` | `39c22292c376b540a9f90c0434893360d85148f45def8a9e01ac1aec520edf0e` |
| @lapis-notes/source-editor | 0.1.2   | `d76ed20282b7cc34352a6fe74896566c17c9b4b2` | `685b2685c55045d7792de7f41a59743456dfee5315ad4305bafbd414237b2250` |
| @lapis-notes/markdown      | 0.1.6   | `d76ed20282b7cc34352a6fe74896566c17c9b4b2` | `007e8009dc2c561a631b3a87e629129ef6ffe541bee8ea68c11bbaac19250bf2` |
| @lapismd/design-core       | 0.5.1   | `fa174d7e998196a6f748cdc89f29672ab12b71c6` | `473616153257920672a6fb7e6210f945a3f7802975e22ff8661a6fdab54f51c5` |
| @lapis-notes/search        | 0.1.3   | `d76ed20282b7cc34352a6fe74896566c17c9b4b2` | `5fc0cba3d45a99b8525a6d9c4b7cba8a167d7b9ab72e8e9bdfd732b80a08fbdc` |
| @lapis-notes/graph         | 0.1.3   | `d76ed20282b7cc34352a6fe74896566c17c9b4b2` | `5e518ed7914576deb8c997ed7091a7f7d446c6a06e2905ad3b0bb245527af553` |

The remaining language-service and four Mira archives retain their recorded
versions/checksums in the ignored 14-package manifest. Runtime snapshots precede
this record and source documentation/lock-specifier changes; built code matches
the recorded snapshots. Screenshots and packaging logs live under the ignored
`.local/qualification/catalog-review` directory and are review aids only.

## Milestone review

M8.5 is In progress until its source/catalog and native acceptance lanes resume.
Historical M8.4 acceptance is not reused to qualify these new changes. M10.2 and
all unrelated migration tasks retain their existing gates/status. No Visual
Delta baseline or visual-approved tag changes.
