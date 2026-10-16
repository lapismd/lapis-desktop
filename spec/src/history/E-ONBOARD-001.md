# E-ONBOARD-001: Shared Deno desktop presentation

The existing chooser and startup branding are shared rather than reimplemented.

```json
{
  "id": "E-ONBOARD-001",
  "tasks": ["M2", "M4"],
  "requirements": [
    "LD-VAULT-001",
    "LD-VAULT-006",
    "LD-SESSION-003",
    "LD-LIFE-005",
    "LD-GOV-003",
    "LD-GOV-004"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "specValidator": "0.1.4"
  },
  "files": [
    "MIGRATION.md",
    "PLAN.md",
    "scripts/desktop-acceptance.mjs",
    "scripts/progress.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CHROME-001.md",
    "spec/src/history/E-ONBOARD-001.md",
    "spec/src/history/E-PREVIEW-001.md",
    "spec/src/history/E-STARTUP-001.md",
    "spec/src/history/index.md",
    "src-tauri/src/vault_commands.rs",
    "src/FileConflicts.svelte",
    "src/NotesWorkspace.svelte",
    "src/Shell.svelte",
    "src/VaultLauncher.svelte",
    "src/launcher-appearance.ts",
    "src/main.ts",
    "src/notes-workspace.css",
    "src/shell.css",
    "src/vault-client.ts",
    "src/vault-launcher.css",
    "src/window-chrome.css",
    "src/window-drag.ts",
    "tests/desktop/conditional.spec.mjs",
    "tests/desktop/notes-conflicts.test.mjs",
    "tests/desktop/notes-lifecycle.test.mjs",
    "tests/desktop/notes.spec.mjs",
    "tests/desktop/preview-conflicts.test.mjs",
    "tests/desktop/shell.spec.mjs",
    "tests/desktop/startup-progress.test.mjs",
    "tests/desktop/vault.spec.mjs",
    "tests/desktop/window-chrome.test.mjs",
    "tests/desktop/workspace-navigation.mjs",
    "tests/governance/evidence-files.test.mjs",
    "tests/renderer/vault-client.test.mjs"
  ],
  "result": "pending",
  "remaining": [
    "Final shared-source lanes, real native acceptance, ordinary bundle and launch."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "shared-presentation-before",
      "command": "pnpm --filter @lapis-notes/workspace test src/lib/desktop-presentation.test.ts",
      "result": "fail",
      "failures": 4,
      "note": "The Deno chooser/startup are private; public exports are absent."
    },
    {
      "name": "shared-presentation-after",
      "command": "pnpm --filter @lapis-notes/workspace test src/lib/desktop-presentation.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 4
      }
    },
    {
      "name": "historical-evidence-before",
      "command": "node --test tests/governance/evidence-files.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The progress validator requires historical paths to remain in the current tree, preventing removal of obsolete chooser CSS without rewriting immutable evidence."
    },
    {
      "name": "historical-evidence-after",
      "command": "node --test tests/governance/evidence-files.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 3
      },
      "note": "Resolve old paths at the record snapshot, cover actual base deletions, and reject invented fresh paths. Historical evidence remains unchanged."
    },
    {
      "name": "native-creation-client",
      "command": "node --test tests/renderer/vault-client.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 10
      }
    },
    {
      "name": "strict-clippy-first",
      "command": "pnpm check:rust",
      "result": "fail",
      "failures": 1,
      "note": "Remove a redundant io::Error conversion; do not allow the lint."
    },
    {
      "name": "chooser-governance-first",
      "command": "pnpm check",
      "result": "fail",
      "failures": 11,
      "note": "Fresh coverage is required for chooser/picker/test paths, and removed files must resolve at their actual historical snapshot. Add this record and preserve committed evidence."
    }
  ],
  "contractReview": "Reuse the existing Deno chooser markup, recents/search, appearance and startup branding from public Workspace exports. Tauri supplies only its native admission/picker and profile adapter. Choose/open immediately starts Notes. The native save panel selects a new destination, then the existing capability-based create_child boundary validates and creates it without overwrite. Returning to vaults tears down Notes and closes its admission. Unsupported profile actions stay absent.",
  "milestoneReview": "M2 retains its original complete gate and status. Preserve cancellation, collision, listing, containment, bytes and cold lifecycle checks while changing only the user-requested presentation and direct-open flow. M4 remains In progress with Properties/metadata writer protection next; no new slice starts after review launch."
}
```
