# File blame and repository loading states

```json
{
  "id": "E-REPO-018",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-DESK-001",
    "LD-DESK-003",
    "LD-HOST-001",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-MIG-002",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-006",
    "LD-GOV-007"
  ],
  "date": "2026-10-18",
  "result": "pass",
  "files": [
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "catalog/plugins/repository/Blame.stories.ts",
    "catalog/plugins/repository/FileHistory.stories.ts",
    "catalog/plugins/repository/History.stories.ts",
    "catalog/plugins/repository/Loading.stories.ts",
    "catalog/support/repository/blame.ts",
    "catalog/support/repository/fixture.ts",
    "catalog/support/repository/loading.ts",
    "catalog/support/repository/operations.ts",
    "catalog/support/repository/query-stats.ts",
    "catalog/support/repository/review/RepositoryHistoryReview.svelte",
    "catalog/support/repository/review/RepositoryOperationsReview.svelte",
    "docs/provenance.json",
    "package.json",
    "pnpm-lock.yaml",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-REPO-018.md",
    "src/components/repository/RepositoryChangedFiles.svelte",
    "src/components/repository/RepositoryDiffColumn.svelte",
    "src/components/repository/RepositoryFileHistory.svelte",
    "src/components/repository/RepositoryGraph.svelte",
    "src/components/repository/RepositoryIdentifiers.svelte",
    "src/components/repository/RepositoryOperationColumn.svelte",
    "src/components/repository/RepositoryOperationFiles.svelte",
    "src/components/repository/RepositoryOperations.svelte",
    "src/components/repository/RepositoryPanel.svelte",
    "src/components/repository/RepositorySkeleton.svelte",
    "src/components/repository/blame/RepositoryBlameGroup.svelte",
    "src/components/repository/blame/RepositoryBlamePanel.svelte",
    "src/components/repository/blame/RepositoryBlameRows.svelte",
    "src/components/repository/blame/RepositoryBlameView.svelte",
    "src/components/repository/blame/blame-view.ts",
    "src/components/repository/conflicts/RepositoryConflictResolution.svelte",
    "src/components/repository/file-history-view.ts",
    "src/components/repository/repository-plugin.ts",
    "src/lib/native/repository/services.ts",
    "src/lib/repository/blame-chunks.ts",
    "src/lib/repository/blame-controller.ts",
    "src/lib/repository/blame-model.ts",
    "src/lib/repository/file-history-controller.ts",
    "src/lib/repository/history-reader.ts",
    "tests/renderer/repository-blame.test.mjs",
    "tests/renderer/repository-file-history.test.mjs",
    "vite.catalog.config.ts"
  ],
  "contractReview": "LD-REPO-002/004 adds a sidebar Blame action at the recorded workspace commit/file/operation. Independent retained handle/progressive native attribution and exact file_at proof feed copied jj-store virtual source/author UI; origin links use main JJ Log at the same pin. Sidebar removes ordinary operation/author metadata, matches40px public tab header height, and renders shadcn Empty with an icon. Repository loading uses representative Design Core skeletons while App status retains work visibility. LD-DESK-003/LD-HOST-001 native admission/transport ownership remain unchanged; the producer command is explicitly granted by the existing local-history capability, never empty defaults. Source state, mutation authority and wide native integers stay retained.",
  "milestoneReview": "M13.2 keeps its original Done gate; M13/M13.3 remain In progress. NOTES-05I8 does not qualify durable AgentStore/ThreadStore managed chat or restart recovery. Native writes/search/evolution, provider/platform expansion, whole catalog combinations and visual baselines remain separately deferred by user direction.",
  "scope": "Production repository views, sidebar, blame controller/native reader boundary and directly affected repository/background story families. Independent native owner evidence, fixture interactions/accessibility and ordinary native UI are reported separately. Enclosing desktop change tpxqrozl on bd1e053b; native owner mtrnlzzu on17270354.",
  "remaining": [],
  "runs": [
    {
      "name": "native-owner",
      "command": "jj-store pnpm dev:cargo -- test -p tauri-plugin-jj-store --no-default-features -- --test-threads=1; Tauri feature check and strict Clippy; pnpm history:test",
      "result": "pass",
      "failures": 0,
      "note": "E-FILE-BLAME-001 owns exact stock-JJ attribution, retained scope/generation/source preservation and actual close drain. Fourteen native bridge cases and nine headless client cases pass. New additive blame command stays read-only, inside current admission and blocking work; defaults remain empty."
    },
    {
      "name": "node-before",
      "command": "node --test tests/renderer/repository-blame.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Initial Node strip-only runtime refused a TS parameter property. Replaced it with explicit fields. Next fixture assertion found file_at calls absent from the fixture log; logged that boundary. No product assertion was loosened. Earlier logs blame-node-exact/qualified preserve both attempts."
    },
    {
      "name": "node-exact",
      "command": "node --test tests/renderer/repository-blame.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Six exact cases pass: original pin/progressive cursor/file membership text, recovery, stale replies, close drain, wide integers and chunk bounds/unknown gaps. Log blame-node-final.log."
    },
    {
      "name": "types-draft",
      "command": "pnpm check:types",
      "result": "fail",
      "failures": 11,
      "note": "Initial draft had eleven errors/two warnings across model/imports. Intermediate three-error and role-selector failures are retained in blame-types-*.log. Used public RelativeTime, narrowed native number|bigint line positions and corrected template/fixture typing. Final strict check has zero errors/zero warnings."
    },
    {
      "name": "first-blame-stories",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Blame.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Three stories passed; Preparing exposed a real Axe visible-label mismatch for single-sided Git IDs. Existing Identifier CSS displays expanded abbreviated text for a single side; accessible name now uses that same label. Exact Preparing then passes without disabling Axe or changing thresholds. Logs blame-stories-exact.log and blame-a11y-qualified.log."
    },
    {
      "name": "skeleton-draft",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/repository/FileHistory.stories.ts catalog/plugins/repository/History.stories.ts -t <focused expression>",
      "result": "fail",
      "failures": 1,
      "note": "First run passed eight selected cases but Vite discovered file-clock during testing, reloaded and failed History import. Added the actual dependency to the existing optimizer inventory. Next run passed twelve selected cases and exposed two new Empty tests using a nonexistent dependency-internal data-slot. Corrected them to assert the rendered icon inside status. Exact No Active File/No Revisions then pass (2/2)."
    },
    {
      "name": "loading-draft",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Loading.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Four of five pass. OperationDetails hold was installed before the operation fixture overrides read, so it never reached the real boundary. Moved pending-read decoration after operation composition. Exact Operation Details now passes; teardown still releases its owned delayed read."
    },
    {
      "name": "source-audit-draft",
      "command": "pnpm check:architecture; pnpm check:app-ownership",
      "result": "fail",
      "failures": 2,
      "note": "Formatting pushed the shared fixture over300 counted lines; extracted bounded query statistics. The audit also mistook source-grid for a Tailwind class; renamed the owned selector source-columns without changing CSS behavior. Both audits then pass. No audit allowlist or limit change."
    },
    {
      "name": "source-final-draft",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; node --test tests/renderer/repository-*.test.mjs tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Strict source checks pass; initial complete affected renderer/governance run passes129 cases. Final frozen-source rerun follows."
    },
    {
      "name": "local-dependencies",
      "command": "pnpm add @tanstack/svelte-virtual --ignore-scripts; pnpm local:install .local/archives/manifest.json; pnpm storybook:restart -- --port 7490",
      "result": "pass",
      "failures": 0,
      "note": "Direct virtualizer dependency supports copied bounded blame chunks. Restored portable manifest ordering and 14 verified local archives/routes after package-manager resolution; no source aliases or node_modules edits. Design Core0.5.1 archive remains installed. Existing exact archive manifest/checksums are retained under ignored .local. Actual Axe4.14.0; no accessibility suppression."
    },
    {
      "name": "draft-documents",
      "command": "pnpm progress:generate; pnpm spec:check; node --test tests/renderer/repository-*.test.mjs tests/governance/*.test.mjs",
      "result": "fail",
      "failures": 3,
      "note": "Draft record used tests instead of runs and lacked explicit revision/versions. Corrected its format and included generated MIGRATION ownership coverage. No product or gate changes."
    },
    {
      "name": "final-source",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership; node --test tests/renderer/repository-*.test.mjs tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Frozen source checks pass0errors/0warnings, architecture and App audits. All129 affected renderer/governance cases pass. Log blame-source-qualified.log."
    },
    {
      "name": "first-family",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository catalog/plugins/background/Work.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All87 production/review/background interaction/accessibility cases pass across17 files in a fresh process,134.44s. Covers shared fixture lifetime and full directly affected family. An earlier attempt ended without a test summary during managed Storybook restart; it supplies no pass evidence."
    },
    {
      "name": "native-id-before",
      "command": "pnpm desktop:bundle --debug; cold ordinary Preview launch; pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Blame.stories.ts -t \"Blame From File History\"",
      "result": "fail",
      "failures": 1,
      "note": "Cold native review correctly opens recorded Unsnapshotted draft instead of physical Dirty after external advance and origin navigation retains bd3e4eca pin. It also exposed internal hex shown in the blame-header JJ chip. Added an exact fixture assertion; it fails once before repair. Reused the same encodeJjChangeId used by existing logs/selectors. Native source unchanged."
    },
    {
      "name": "native-id-exact",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Blame.stories.ts -t \"Blame From File History\"",
      "result": "pass",
      "failures": 0,
      "note": "Exact raw-to-JJ presentation regression passes1/1, three filtered. Corrected full change ID is available for copying. Log blame-id-qualified.log."
    },
    {
      "name": "final-cold-native",
      "command": "pnpm desktop:bundle --debug; graceful quit; cold exact ordinary Preview bundle launch through cua; open File history Blame and origin link; compare fixture source hashes",
      "result": "pass",
      "failures": 0,
      "note": "Final ordinary228.01MiB app built (renderer44.47s/native18.08s). Cold launch restores existing profile, dirty Note.md and sidebar. Native attribution shows recorded Unsnapshotted draft at1980d3fa/bd3e4eca while physical editor remains Dirty after external advance. Origin link selects1980d3fa in main JJ Log at the same pin; corrected JJ chip copies qroruqsvtowzpprzyvrvtkzvokowwrlm. All14 captured fixture file/head/ref/extra fingerprints remain identical. Screenshot .local/reusable-conversations/file-blame-native.png; empty-story screenshot file-history-empty.png. App remains running. No reset, installed-app replacement, test instrumentation or mutation."
    },
    {
      "name": "final-family-narrow",
      "command": "LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=dark pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository catalog/plugins/background/Work.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Final source after JJ ID repair: all87 affected interaction/accessibility cases pass across17 files in a fresh process,124.69s. Includes all four blame stories, five representative loading stories and both Empty/icon states. Other theme/width combinations, whole catalog, provider/platform/release lanes and visual baselines remain deferred."
    },
    {
      "name": "anchor-before",
      "command": "node --test --test-name-pattern \"changing file scope\" tests/renderer/repository-file-history.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Final state review found the newly stored workspaceCommit persisted through partial state merge when the editor cleared or next admission failed. Exact regression fails once before the fix. Reset its anchor with initial scope state and guard the action by current path as well."
    },
    {
      "name": "anchor-final",
      "command": "node --test tests/renderer/repository-file-history.test.mjs tests/renderer/repository-blame.test.mjs; node --test tests/renderer/repository-*.test.mjs tests/governance/*.test.mjs; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "All13 exact file-history/blame cases and all130 affected renderer/governance cases pass; final strict types have0errors/0warnings. Added disabled-action assertions after leaving the editor and for initial Empty. No new native/source behavior."
    },
    {
      "name": "sidebar-final-stories",
      "command": "LAPIS_CATALOG_VIEWPORT=desktop LAPIS_CATALOG_THEME=light pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Blame.stories.ts catalog/plugins/repository/FileHistory.stories.ts; LAPIS_CATALOG_VIEWPORT=narrow LAPIS_CATALOG_THEME=dark same command",
      "result": "pass",
      "failures": 0,
      "note": "All11 directly affected sidebar/blame interaction/accessibility stories pass at both widths/themes after the final anchor reset. Broader87-case runs remain recorded above. Source/ownership audits and strict types remain passing."
    },
    {
      "name": "final-build-and-documents",
      "command": "pnpm desktop:bundle --debug; pnpm check:progress; pnpm spec:check; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0,
      "note": "Final anchor-clear ordinary228.01MiB app builds (renderer41.66s/native17.27s). Progress passes33tasks/120records and all four document lanes pass: validate, Rust format, mdBook, spec-first. Final formatting checked on actual changed files. The earlier cold ordinary blame proof remains recorded separately; this last state-clear build was not relaunched because native control detected ongoing user review. The existing demo remains open; no forced termination or data reset."
    }
  ],
  "revision": "enclosing Jujutsu change tpxqrozl",
  "versions": {
    "desktopBase": "bd1e053b",
    "jjStore": "b829c2ff (change mtrnlzzu)",
    "jj": "0.45.1",
    "storybook": "10.5.7",
    "svelte": "5.57.2",
    "vite": "7.3.2",
    "axe": "4.14.0",
    "designCore": "verified 0.5.1 archive"
  }
}
```
