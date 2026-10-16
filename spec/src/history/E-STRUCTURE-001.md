# E-STRUCTURE-001: Renderer source organization

Organizes desktop-owned source without advancing the paused migration.

```json
{
  "id": "E-STRUCTURE-001",
  "tasks": ["M4"],
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-DESK-005",
    "LD-MIG-002"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4"
  },
  "files": [
    "AGENTS.md",
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-STRUCTURE-001.md",
    "spec/src/history/index.md",
    "src/components/files/FileConflicts.svelte",
    "src/components/vaults/VaultLauncher.svelte",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/desktop/desktop-lifecycle.ts",
    "src/lib/desktop/shell-startup.ts",
    "src/lib/desktop/window-drag.ts",
    "src/lib/launcher/launcher-appearance.ts",
    "src/lib/native/database/database-codec.ts",
    "src/lib/native/database/native-connection.ts",
    "src/lib/native/database/native-database-provider.ts",
    "src/lib/native/native-bridge.ts",
    "src/lib/native/native-error.ts",
    "src/lib/native/vault-client.ts",
    "src/lib/notes/notes-plugins.ts",
    "src/lib/notes/notes-session.ts",
    "src/main.ts",
    "src/styles/notes-workspace.css",
    "src/styles/shell.css",
    "src/styles/window-chrome.css",
    "tests/desktop/entry.ts",
    "tests/renderer/native-connection.test.mjs",
    "tests/renderer/shell-startup.test.mjs",
    "tests/renderer/vault-client.test.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "focused-before",
      "command": "node --test tests/governance/source-audit.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 21
      },
      "note": "Clean-parent baseline before moving files. The change is organizational; no behavioral regression is claimed."
    },
    {
      "name": "types-and-boundaries-before",
      "command": "pnpm check:types; node scripts/source-audit.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      }
    },
    {
      "name": "focused-after",
      "command": "node --test tests/governance/source-audit.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 21
      },
      "note": "All original tests and assertions remain; only direct source imports move."
    },
    {
      "name": "types-and-boundaries-after",
      "command": "pnpm check:types; node scripts/source-audit.mjs; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "Existing recursive audits cover every new directory without allowlists or weakened rules."
    },
    {
      "name": "equivalence-comparison-formatting-mismatch",
      "command": "python3 (ad hoc relative-import-normalized comparison against jj file show -r @-)",
      "result": "fail",
      "failures": 1,
      "note": "The initial comparator treated the formatter-added trailing comma in a multiline type import as an implementation difference. Manual diff confirms the formatting-only change; no product failure."
    },
    {
      "name": "equivalence-comparison-after",
      "command": "python3 (ad hoc relative-import/formatting-normalized comparison against jj file show -r @-)",
      "result": "pass",
      "failures": 0,
      "counts": {
        "productionFiles": 20,
        "movedFiles": 19,
        "sourceRootFiles": 1
      },
      "note": "All production implementations match the parent after normalizing relative paths, whitespace and trailing commas. CSS and import-free modules are unchanged; main.ts is the only root source file."
    },
    {
      "name": "renderer-production-build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "counts": {
        "modules": 6198
      },
      "note": "Fresh Vite production build resolves all relocated modules and stylesheet imports. Existing large-chunk advisory remains; no build threshold changes."
    },
    {
      "name": "full-foundation-tests",
      "command": "CARGO_BUILD_JOBS=2 pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodeCases": 36,
        "rustCases": 34,
        "ignoredRustHelpers": 2
      },
      "note": "No new tests, skips, assertions or native implementation changes. Cargo lanes remain serialized."
    },
    {
      "name": "desktop-check-pending-evidence-before",
      "command": "CARGO_BUILD_JOBS=2 pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Specification validation correctly rejects a draft record marked pass while verification remains pending. Mark the record pending until all checks finish; no validator or requirement is changed. Type, Clippy and format lanes did not start in this attempt."
    },
    {
      "name": "full-desktop-check-after",
      "command": "CARGO_BUILD_JOBS=2 pnpm check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0,
        "chapters": 31,
        "requirements": 39
      },
      "note": "The original command passes specification/source/progress validation, public Svelte types, all-target strict Clippy and full formatting after the draft evidence correction."
    },
    {
      "name": "unchanged-milestone-gates",
      "command": "node --input-type=module (compare parseTasks against jj file show -r @- spec/src/current/progress/milestones.md)",
      "result": "pass",
      "failures": 0,
      "counts": {
        "milestones": 14
      },
      "note": "All statuses, original gates, dependencies, requirements and next actions exactly match the parent. Only selected evidence gains this maintenance record."
    },
    {
      "name": "canonical-cold-native-acceptance",
      "command": "CARGO_BUILD_JOBS=2 pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "startupCases": 2,
        "webviewCases": 27,
        "coldLifecycleCases": 24,
        "totalCases": 53
      },
      "note": "Fresh renderer and native acceptance builds pass unassisted on macOS ARM64. Includes actual WebView startup/progress/recovery, shell and vaults, public database conformance, disk editing, attachment display, axe, conditional-save recovery, chooser return, tab-first native chrome and cold settings/hotkey persistence. All five WebView spec files pass; the final cold continuation passes in 98.9 seconds. No test hooks, assertions, skips or deadlines change, and all state is isolated."
    },
    {
      "name": "specification-and-progress-final",
      "command": "pnpm spec:check; pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "specificationLanes": 4,
        "milestones": 14,
        "evidenceRecords": 23
      },
      "note": "Canonical validation, Rust formatting, mdBook and mapped spec-first pass. The sole task ledger and generated tracker agree; source budgets, App ownership and immutable historical path checks remain enabled."
    }
  ],
  "contractReview": "Inspected GitButler apps/desktop/src plus its components/README.md and lib/LIB_PLAN.md. Adopt components grouped by feature with views as composition roots, non-visual feature modules under lib, and global host CSS under styles. Keep native transport separate from Notes orchestration. Update renderer/native acceptance imports directly; no aliases, barrels, compatibility stubs, routing framework, dependency or shared-library changes. AGENTS.md documents the preferred placement for future code. Existing line budgets and ownership audits remain in force; immutable historical records retain their original paths.",
  "milestoneReview": "This is the explicitly requested organization slice while functional migration remains paused. M4 stays In progress with its existing review pause and remaining writer audit. All original milestone gates and statuses remain unchanged; no new functionality, Deno changes, signing, publishing or visual-baseline work is included.",
  "reference": "https://github.com/gitbutlerapp/gitbutler/tree/master/apps/desktop/src"
}
```
