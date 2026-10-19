# Content-sized forge account menus

The user requested wider forge controls. The visibly narrow account menu used
default sizing; this slice copies jj-store menu-layout.ts directly into the
maintained component through its public style prop. Native and broader product
qualification remains separate and unchanged.

```json
{
  "id": "E-REPO-040",
  "tasks": ["M14", "M14.4"],
  "requirements": [
    "LD-REPO-005",
    "LD-CAT-003",
    "LD-HOST-001",
    "LD-DESK-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-MIG-002"
  ],
  "date": "2026-10-19",
  "result": "pass",
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "storybook": "10.5.7",
    "designCore": "0.5.1",
    "source": "jj-store efc26dea; web/src/lib/ui/store-forge/menu-layout.ts"
  },
  "contractReview": "Presentation-only change: forge account menus copy the content-sized jj-store layout, with a 14rem minimum, viewport width bound and single-line labels. Public Design Core Content style prop only. Account/controller lifetime, credentials, settings registration and native commands remain unchanged. No new tests mirror this reversible styling change; existing account stories exercise affected interactions and accessibility.",
  "milestoneReview": "M14/M14.4 remain Partial at their original native/provider/wider qualification gates. This focused presentation slice is complete; visual baseline approval remains separate.",
  "files": [
    "catalog/COVERAGE.md",
    "docs/automatic-vault-backup-progress.md",
    "docs/provenance.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/repository.md",
    "spec/src/current/vault-backup.md",
    "spec/src/history/index.md",
    "src/components/repository/backup/ForgeAccounts.svelte",
    "spec/src/history/E-REPO-040.md",
    "spec/src/current/migration.md"
  ],
  "runs": [
    {
      "name": "browser-before",
      "command": "Read the current 7490 Empty Accounts story and expand Add forge account",
      "result": "fail",
      "failures": 1,
      "note": "The default narrow menu wraps account choices onto two or three lines. Before screenshot: /tmp/lapis-embedded-forge-settings.png."
    },
    {
      "name": "browser-after",
      "command": "Expand Add forge account in the HMR-updated Empty Accounts story",
      "result": "pass",
      "failures": 0,
      "note": "All four forge account choices fit on single lines. Existing plugin settings card width is retained. Screenshot: /tmp/lapis-wide-forge-menu.png. Manual observation, not baseline approval."
    },
    {
      "name": "types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and warnings. .local/forge-menu-width-types.log."
    },
    {
      "name": "account-story-matrix",
      "command": "pnpm test:storybook catalog/plugins/repository/Forges.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Eight account stories in four fresh viewport/theme processes: 32 interaction/accessibility executions pass. .local/forge-menu-width-catalog.log."
    },
    {
      "name": "mapped-canonical-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "The progress checklist also maps to the migration chapter. Extend its existing evidence range with E-REPO-040; original native/provider gates stay unchanged."
    },
    {
      "name": "document-checks",
      "command": "pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm exec prettier --check <changed files>",
      "result": "pass",
      "failures": 0,
      "note": "Progress, owning canonical mappings, all document limits and changed-file formatting pass. No Rust/native build or unrelated suites are needed for this presentation-only scope."
    }
  ],
  "remaining": []
}
```
