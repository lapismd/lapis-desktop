# Main-workspace footer handoff

```json
{
  "id": "E-CATALOG-010",
  "tasks": ["M8.5"],
  "requirements": [
    "LD-HOST-001",
    "LD-DESK-001",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-LIFE-003",
    "LD-VAULT-002"
  ],
  "revision": "enclosing Jujutsu change",
  "versions": {
    "desktop": "0.1.0",
    "designCore": "0.5.1",
    "api": "0.1.4",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "jj": "0.45.1",
    "platform": "macOS ARM64"
  },
  "files": [
    "MIGRATION.md",
    "PLAN.md",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/ai/ChatLayoutReview.stories.ts",
    "catalog/plugins/desktop/Shell.stories.ts",
    "catalog/plugins/repository/FileHistory.stories.ts",
    "catalog/plugins/repository/WorkingCopyStatus.stories.ts",
    "catalog/support/ai/transcript/DesignCoreReference.svelte",
    "package.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-presentation.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CATALOG-009.md",
    "spec/src/history/E-CATALOG-010.md",
    "spec/src/history/index.md",
    "src/components/ai/catalog/panel.css",
    "src/components/ai/chat/panel.css",
    "src/components/ai/history/panel.css",
    "src/components/ai/sessions/session-shell.css",
    "src/components/repository/RepositoryBackupStatus.svelte",
    "src/components/repository/RepositoryWorkingCopyStatus.svelte",
    "src/components/repository/repository-status.ts",
    "src/components/views/DesktopFailure.svelte",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/styles/shell.css",
    "vitest.catalog.config.ts"
  ],
  "result": "pass",
  "runs": [
    {
      "name": "main-public-archive-acceptance",
      "command": "pnpm local:install .local/archives/footer-landing.json; pnpm check:types; LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Fourteen archives verify across fourteen public routes; tracked dependency files preserved. Types pass with zero warnings/errors. All seven exact footer/status cases pass. Logs .local/verification/footer/{install-main,types-main,acceptance-main}.log."
    },
    {
      "name": "main-renderer-merge-selector-before",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "349 actual tests pass; one governance case rejects ambiguous @- because the current integration has two parents. Use the existing explicit LAPIS_DESKTOP_BASE=wkqnnkty override, retaining both ancestry/evidence checks and all assertions. No product failure or validator change."
    },
    {
      "name": "workspace-retirement",
      "command": "verify landed ancestry and clean temporary diffs; stop owned Core static server; jj workspace forget; move exact checkouts to macOS Trash",
      "result": "pass",
      "failures": 0,
      "note": "Desktop, Core and readiness checkouts are unregistered and removed from their original paths; all ignored files remain recoverable. Needed archives/logs are retained in main; .local/verification/footer/workspaces.json records exact paths."
    },
    {
      "name": "main-renderer-and-ai",
      "command": "LAPIS_DESKTOP_BASE=wkqnnkty node --import tsx --test --test-name-pattern=\"progress recognizes requirement IDs\" tests/governance/contracts.test.mjs; same explicit base with all governance/renderer tests; pnpm test:ai",
      "result": "pass",
      "failures": 0,
      "note": "Exact governance selector regression passes, then all 350 renderer/governance tests and all 601 AI tests in 127 files pass. Logs .local/verification/footer/{progress-regression-main,renderer-main-final,ai-main}.log. Existing base override resolves the two-parent selector without code or assertion changes."
    },
    {
      "name": "main-formatted-milestone-bound-before",
      "command": "LAPIS_DESKTOP_BASE=wkqnnkty pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Formatting the additional footer evidence/Next column widened the milestone table to 32846 bytes, 78 over the bound. Condense only the footer Next text and summary; preserve every task ID, status, dependency, requirement, original gate and selected evidence. No checker changes."
    },
    {
      "name": "main-spec-after-bound-fix",
      "command": "LAPIS_DESKTOP_BASE=wkqnnkty pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four lanes pass after condensing only the footer milestone text; original task statuses and gates are retained. Log spec-main-final.log."
    },
    {
      "name": "main-catalog-interrupted-for-review-fixes",
      "command": "pnpm test:storybook",
      "result": "pending",
      "failures": 0,
      "note": "Cancelled with exit 130 when the user requested sidebar/AI spacing and status-button fixes. This invocation supplies no complete-matrix result; new broad matrices are subsequently deferred at the user's request."
    },
    {
      "name": "main-review-spacing-before",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts [exact ChatLayoutReview Empty Local Search, then WorkingCopyStatus Workspace Footer]",
      "result": "fail",
      "failures": 2,
      "note": "One failure in each exact target: AI outer bottom gap 41px versus 9px above; repository control encroached on footer clearance. Logs ai-padding-before.log and status-clearance-before.log."
    },
    {
      "name": "main-review-spacing-after",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts -t 'Empty Local Search|Workspace Footer'",
      "result": "pass",
      "failures": 0,
      "note": "Both exact cases pass (12 filtered). Removed obsolete footer reserve from session/History/Catalog shells; compact working-copy and backup controls to 20px minimum height with zero block padding. Live control measures 20px in a 24px footer, with 2.5px top/1.5px bottom clearance. Log followup-exact-main.log."
    },
    {
      "name": "review-core-source-and-package",
      "command": "Design Core exact menu units; footer/tab stories; overlay/drawer cases; source types/units/spec/format/utility checks; packLocal with suffix -footer-review",
      "result": "pass",
      "failures": 0,
      "note": "Source 60edc7aa: four menu cases, eleven footer/tab cases, three drawer/menu cases, all four type configurations and 836 units pass. Two wider timing failures are repaired in owned fixtures with unchanged assertions/deadlines; cancelled/bail attempts remain in Core records. User defers new broad matrices. Public runtime/declarations/CSS prepare successfully (254 audited CSS files, zero utility references)."
    },
    {
      "name": "review-core-archive-install",
      "command": "pnpm local:install .local/archives/footer-landing.json",
      "result": "pass",
      "failures": 0,
      "note": "Fourteen archives verify across fourteen import routes; only Core entry changes, preserving other thirteen archives and tracked dependency files. Core SHA256 08393b951bf970df08ca0a609e448f84a8e5c352254f1aa61d77809434a795b2. Log install-review-core.log."
    },
    {
      "name": "main-review-process-restart",
      "command": "Stop owned main Storybook and isolated review process group; pnpm storybook:start -- --port 7491; detached CARGO_BUILD_JOBS=2 pnpm dev --no-watch from main",
      "result": "pass",
      "failures": 0,
      "note": "Storybook reports running on 7491 (PID 98309). Native app builds in 26.80s, starts target/debug/lapis-desktop and reports renderer ready; existing linker unwind advisory retained. Main Vite is 1431; saved profile/vault data is preserved. This is review startup, not the original native acceptance gate."
    },
    {
      "name": "main-startup-error-before",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/Shell.stories.ts -t 'Missing.*Saved.*Vault|Blocked.*Close'",
      "result": "fail",
      "failures": 2,
      "note": "Both exact cases rendered two alerts. Keep recovery assertions and require one icon-bearing alert. Log startup-error-before.log."
    },
    {
      "name": "main-focused-close",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/desktop/Shell.stories.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/repository/WorkingCopyStatus.stories.ts catalog/plugins/repository/FileHistory.stories.ts -t 'Missing.*Saved.*Vault|Blocked.*Close|Empty.*Local.*Search|Workspace.*Footer|Move.*History.*[Tt]o.*Main.*Body'",
      "result": "pass",
      "failures": 0,
      "note": "Five cases pass across four files; 20 filtered. Exact error regressions and the three footer/AI/tab consumer cases pass with interaction/accessibility checks. Log focused-close.log. Single destructive body Alert uses public Core exports; no corner feedback remains."
    },
    {
      "name": "main-final-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and warnings after startup error composition. Log types-close.log."
    },
    {
      "name": "main-live-footer-review",
      "command": "Read actual 7491 WorkspaceFooter DOM and save screenshot after archive refresh",
      "result": "pass",
      "failures": 0,
      "note": "Both sidebar bottom borders are 0px with zero footer gap; footer top border is 1px. Repository control is 20px within 24px footer, with 2.5px top/1.5px bottom clearance. Screenshots footer-final.png and startup-error-final.png under .local/verification/footer. No visual baseline claim."
    },
    {
      "name": "main-review-profile-before",
      "command": "Inspect preview recent-vaults.json/last-notes.json and saved vault path",
      "result": "fail",
      "failures": 1,
      "note": "Renderer started but restoration failed because Repository Review referenced the removed lapis-desktop-history checkout. The preserved main copy exists; process startup alone did not prove restoration."
    },
    {
      "name": "main-review-profile-repair-and-cold-restart",
      "command": "Stop verified isolated main preview process group; back up preview profile metadata; repoint only Repository Review to preserved main vault; detached CARGO_BUILD_JOBS=2 pnpm dev --no-watch",
      "result": "pass",
      "failures": 0,
      "note": "Profile ID and other vault entry are retained. Exact old/new path, physical root identity and backup are in .local/verification/footer/profile-relocation.json. No databases or vault contents are removed. New native process builds in 15.21s and reports renderer ready; native vault-registry.json and last-notes.json are written at 21:00:31/21:00:33 local after ordinary admission and Notes metadata startup. This one-time review relocation changes no native admission policy. Existing linker unwind and logo URL advisories remain. Log review-app-restored.log; supervisor 66903."
    },
    {
      "name": "main-final-format-before",
      "command": "pnpm exec prettier --check [changed files excluding immutable historical evidence]",
      "result": "fail",
      "failures": 2,
      "note": "Generated MIGRATION.md and newly added ChatLayoutReview assertions needed formatting. Ran Prettier only on those two files; behavior and assertions are unchanged."
    },
    {
      "name": "main-final-document-and-ownership-checks",
      "command": "LAPIS_DESKTOP_BASE=wkqnnkty pnpm progress:generate; LAPIS_DESKTOP_BASE=wkqnnkty pnpm check:progress; LAPIS_DESKTOP_BASE=wkqnnkty pnpm spec:check; pnpm check:architecture; pnpm check:app-ownership; pnpm exec prettier --check [changed files excluding immutable historical evidence]",
      "result": "pass",
      "failures": 0,
      "note": "Canonical bounds and owning requirements remain intact; milestones retain their original native gates. Current chapter sizes remain below 400 lines/32768 bytes. No aggregate product suite is claimed."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Original native M8.5, AI/provider/JJ, release and visual-baseline gates retain their original statuses.",
    "At the user's explicit final request for minimal tests, new combined main catalog/theme/viewport matrices and new Core full catalog, pointer and static-build runs are deferred; cancelled runs are not counted as passes."
  ],
  "contractReview": "Preserve AI-history landing 5c46fe59 and footer 062bbb78 as ancestors. Resolve shared introductions by retaining current local-file AI/import/custody contracts and adding footer geometry/spacing and test-runner projection. Keep main's Send message interaction. Source Core merge 37c1ca45 retains footer 0ad075a2 and transcript 87d0db7b. No native policy, storage, provider, credential or publication change. LD-LIFE-003/LD-VAULT-002 retain physical-root and recovery semantics; only shell failure presentation changes to a single destructive body alert with an icon. The preview profile relocation is an explicit local review repair.",
  "milestoneReview": "M8.5 remains In progress. E-CATALOG-009 qualifies the complete footer implementation; this record qualifies combined source/main landing, review restart and temporary-workspace retirement. Original native presentation gate is unchanged. Footer handoff is complete; M4 remains Done with its original native gate retained. Focused cold startup and error presentation do not replace broader native qualification."
}
```

The user requested landing after the concurrent desktop integration was clean,
then explicitly requested default-workspace consolidation, review restarts and
removal of this session's temporary workspaces. Main was clean before creating
the integration. Footer source and API qualification remain in E-CATALOG-009;
historical evidence is retained unchanged.

Design Core combines both qualified source parents without implementation
conflicts, passes four source/consumer type configurations, 833 units and 100
affected-family browser cases, then builds its public archive. Desktop retains
the external integration's entire archive cohort, replacing only Core and API.
The Search and Mira updates are preserved. Portable tracked dependency files are
unchanged apart from the footer's explicit tsx test-loader command.

Initial integrated Core archive: source `37c1ca45`, SHA256
`751f2ec018ca4c71e57a28d0d11dfb3669e1688f149df7942f09aaee1be202fc`. The reviewed
replacement is source `60edc7aa`, SHA256
`08393b951bf970df08ca0a609e448f84a8e5c352254f1aa61d77809434a795b2`. API archive:
source `cae795d0`, SHA256
`6e663e9c031d23f3b022b3fdcbd341d43b726630cb506319c18b205a14c5ae97`. The ignored
manifest is `.local/archives/footer-landing.json`; retained baseline logs are
`.local/verification/footer-isolated/`. All active archive paths now resolve in
retained main workspaces.

The combined shared shell originally prompted a fresh main browser matrix. That
incomplete attempt is recorded above; the user then explicitly deferred new
broad matrices. Original source/pointer/full consumer results remain separate
from the focused main checks; screenshots and launch do not replace those
original gates.

All three newly created workspaces are unregistered and absent at their original
paths: desktop `status-footer`, Core `status-footer`, and Visual Delta
`footer-readiness`. Their clean sources are landed or independently bookmarked;
qualified archives and logs are copied to main. Ignored files remain recoverable
in macOS Trash. Exact paths are in `.local/verification/footer/workspaces.json`.
The owned disposable Core static server was stopped before retirement.
Pre-existing unrelated workspaces are outside this retirement.

The main-review follow-up also adds the shared Main body destination to tab
menus. Source DC-WS-041 retains the existing Main window popup return while
allowing root-window sidebar tabs to return to the remembered or first main
pane. The new source story verifies selected-tab and view-state retention.
Source evidence is kept in Design Core, then the consumer is checked through its
prepared public archive.

The user requested that remaining testing be kept minimal to close this work.
The final source-wide catalog attempt is stopped; new combined broad matrices
are deferred. Focused source and public-archive consumer regressions retain the
original assertions. No incomplete run is reported as a full-suite pass.
