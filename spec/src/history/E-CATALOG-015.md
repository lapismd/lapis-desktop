# Workspace file exclusion settings

The shared API now exposes its existing discovery exclusions in core Workspace
settings through the same Design Core string-list control used by History.

```json
{
  "id": "E-CATALOG-015",
  "date": "2026-10-19",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M8.5"],
  "requirements": ["LD-CAT-003", "LD-FILE-002", "LD-MIG-002", "LD-GOV-004"],
  "versions": {
    "desktop": "0.1.0",
    "api": "0.1.4",
    "pnpm": "10.34.5",
    "sourceRevision": "f828eaeba8411aa342d7ab4954393e84612af2f3"
  },
  "contractReview": "LN-PKG-185 owns files.exclude at Settings / Workspace / File discovery / Excluded paths. Existing Workspace fields and saved values remain intact. The core list permits add/edit/remove and an empty list, uses the normal App configuration writer, and refreshes discovery through the existing Vault event. It requires no plugin. Native watches/admission, backup selection, raw bytes and explicit adapter access remain unchanged. No Desktop policy fork, source alias, dependency patch or CSS mask.",
  "milestoneReview": "M8.5 remains In progress with its original native presentation gate; other task statuses, dependencies, requirements, gates and next actions remain unchanged. Source/public-renderer evidence does not qualify native/provider/platform/distribution or visual-baseline gates. Narrative is condensed to retain the existing milestone document byte limit.",
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/ai/VaultListingReview.stories.ts",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-presentation.md",
    "spec/src/current/files.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-015.md",
    "spec/src/history/index.md",
    "spec/src/current/ai.md",
    "spec/src/current/plugins.md"
  ],
  "runs": [
    {
      "name": "consumer-before",
      "command": "pnpm exec vitest run --config .local/verification/footer/vitest.wide.config.ts catalog/plugins/ai/VaultListingReview.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Existing discovery scenario passes; new Workspace Settings List fails on absent exclusion inputs. /tmp/desktop-file-settings-before.log."
    },
    {
      "name": "owning-source",
      "command": "Notes: registration/exclusion/configuration and selected Workspace persistence tests; isolated API check/build/pack; specification validation and source-first; main spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Two new source tests fail before implementation; final complete configuration surface has23passes, selected bridge run20passes/134filtered. API types/build/publint/declaration checks pass against exact selected source without unfinished concurrent search code. Initial fixture and dependency-link bootstrap failures are retained in source spec/records/2026-10-19-workspace-file-exclusions.md. Clean-stage spec validation/first pass; main spec initial unrelated mirror failure is followed by a passing retry of6lanes, App ownership, metadata audit and38spec tests."
    },
    {
      "name": "public-install",
      "command": "pnpm local:install .local/archives/workspace-file-exclusions-review.json",
      "result": "pass",
      "failures": 0,
      "note": "API archive Notes/.local/packages/workspace-file-exclusions/lapis-notes-api-0.1.4.tgz SHA2569ca63c9e01829efe52c67f69833ff9f2adce8ebabed76f01f38487595e70b8bf.14verified archives/import routes; tracked manifest/lockfile preserved. /tmp/desktop-file-settings-install.log."
    },
    {
      "name": "consumer-after",
      "command": "Same exact VaultListingReview Storybook command",
      "result": "pass",
      "failures": 0,
      "note": "Fresh Chromium1320x900:2 interaction/accessibility cases pass. Defaults, additions, saved .lapis/app.json data, close/reopen, remove-all, external configuration projection, live discovery and unchanged Private/draft.md bytes are verified without Repository History. /tmp/desktop-file-settings-after.log; after correcting type-only query selectors final2pass rerun /tmp/desktop-file-settings-final.log. The final reset-specific rerun also passes2cases and exercises Restore Excluded paths default; /tmp/desktop-file-settings-reset-final.log."
    },
    {
      "name": "initial-types",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 2,
      "note": "Testing Library role queries do not support Playwright's exact option. Replaced it with anchored name expressions. /tmp/desktop-file-settings-types.log."
    },
    {
      "name": "final-types-and-boundaries",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors/warnings and both source audits pass. /tmp/desktop-file-settings-{types-final,architecture,ownership}.log."
    },
    {
      "name": "review-refresh",
      "command": "pnpm storybook:restart -- --port 7491",
      "result": "pass",
      "failures": 0,
      "note": "Main Storybook67697 serves the verified archive. The native review app was already closed and remains closed; no profile/vault reset, native process or provider qualification is claimed. /tmp/desktop-file-settings-storybook.log. Manual WebKit Settings review confirms both editable defaults, list actions and standard restore control; .local/verification/workspace-file-settings/review.png."
    },
    {
      "name": "initial-specification-gate",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "Progress validates41tasks/179records and validation/rust-format/mdBook pass; source-first requires mapped ai.md and plugins.md updates for the changed AI catalog story. Added explicit scope confirmations. /tmp/desktop-file-settings-spec.log."
    },
    {
      "name": "concurrent-workspace-gate",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 6,
      "note": "The corrected source-first scope is followed by a validation stop on six newly edited repository search/native-search files without fresh evidence, owned by the concurrent search task. They are excluded from this commit and no coverage is claimed. /tmp/desktop-file-settings-spec-final.log. Own-slice canonical validation/progress and explicit source-first run separately."
    },
    {
      "name": "selected-slice-governance",
      "command": "pnpm spec:first with explicit changed-file selection; pnpm spec:validate and pnpm check:progress with LAPIS_DESKTOP_BASE/HEAD selecting this commit; scoped Prettier check",
      "result": "pass",
      "failures": 0,
      "note": "Own commit contains exactly13 selected settings/story/document files and no concurrent search/native files. Source-first passes4protected/5canonical; canonical validation passes6validators/205chapters/95requirements; progress passes41tasks/179records; formatting passes. All task statuses/dependencies/requirements/gates/next actions match parent. /tmp/desktop-file-settings-{first-final,scope-validation,scope-progress}.log."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "User requests minimal testing: aggregate catalog/theme/viewport, native/provider/platform, distribution and visual-baseline matrices remain deferred.",
    "Whole-current-workspace search/native-search qualification belongs to the concurrent search task; only this selected settings slice is committed and validated here."
  ]
}
```
