# Retire final Desktop Deno residue

```json
{
  "id": "E-RETIRE-016",
  "date": "2026-11-19",
  "revision": "enclosing-change",
  "result": "pass",
  "versions": {
    "desktopBase": "769cc6135af1305cf92ef20e2a41b7eeb2870f7f",
    "notesDesktopRemoval": "d2d0c9a4d2036f78094b52b681751d776e7e8d1c",
    "notesSharedAiAuthority": "54ac10c347d10fdf716ac4cf07ba8577765256e3",
    "pluginsDenoClaims": "b0af5f0689ef974c1ae3b031cc6326ccb4a462a0",
    "terminalPlugin": "3d8be40bc28765aa54dc8432d4349a40d158e3ca",
    "terminalHost": "164ceed90be353607f28fdb8151cd663c2863286",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1"
  },
  "requirements": ["LD-MIG-003", "LD-VAULT-006", "LD-AI-004", "LD-GOV-002"],
  "files": [
    "catalog/plugins/ai/ErrorsAndMentions.stories.ts",
    "catalog/plugins/ai/ToolActivity.stories.ts",
    "catalog/support/ai/seeds-1.ts",
    "docs/desktop-release.md",
    "spec/src/backlog.md",
    "spec/src/backlog/ai-qualification.md",
    "spec/src/backlog/distribution.md",
    "spec/src/backlog/lapis-sync.md",
    "spec/src/current/desktop.md",
    "spec/src/current/ai.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/current/plugins.md",
    "spec/src/current/writer-audit.md",
    "spec/src/history/E-RETIRE-016.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-02.md",
    "spec/src/verification.md"
  ],
  "contractReview": "Replace obsolete current claims that the removed Deno Desktop is merely frozen, name the actual Workspace-plus-Tauri launcher ownership, and make the active catalog show Desktop's own AI test lane instead of the retired shared package. Preserve core API services/functions, Language Service, planned Sync, native/Tauri AI, standalone AI Host/controller, terminal Rust code, negative guards, attribution, historical source/artifacts and user data. No implementation is moved.",
  "acceptanceReview": "The three active catalog references to the retired shared AI command must become Desktop-owned commands and keep their interaction/accessibility behavior in four cold viewport/theme presentations. Current/backlog status must say the Deno Desktop is retired while immutable provenance, stable-version upgrade checks and non-Desktop Deno services remain explicit. Historical and negative references are retained only for those named purposes.",
  "provenance": {
    "notesDesktopRemovalPr": "https://github.com/lapismd/lapis-notes/pull/180",
    "notesSharedAiAuthorityPr": "https://github.com/lapismd/lapis-notes/pull/181",
    "pluginsClaimsPr": "https://github.com/lapismd/lapis-plugins/pull/164",
    "terminalPluginPr": "https://github.com/lapismd/lapis-plugin-terminal/pull/4",
    "terminalHostPr": "https://github.com/lapismd/terminal-host/pull/4"
  },
  "runs": [
    {
      "name": "Deno-free specification discovery",
      "command": "pnpm dlx @lapismd/spec-validator@0.2.1 doctor --json; semantic current/backlog searches",
      "result": "pass",
      "failures": 0,
      "detail": "Doctor passes thirteen checks with the repository's existing custom-alias warning. QMD semantic search identifies LD-VAULT-006, LD-MIG-003 and the frozen-host distribution backlog before editing."
    },
    {
      "name": "Fresh registry-only install attempt",
      "command": "pnpm install --frozen-lockfile",
      "result": "fail",
      "failures": 1,
      "detail": "Current main intentionally requires the migration overlay for private @lapismd/ai 0.2.0; the tracked registry lock has no matching importer. No manifest, lock or active AI dependency changed. The documented five-archive projection is used for validation."
    },
    {
      "name": "Targeted stale-reference reproduction",
      "command": "Exact-base scan of current, backlog, docs and catalog authority",
      "result": "fail",
      "failures": 16,
      "detail": "The base contains three visible @lapis-notes/ai test commands and thirteen stale frozen/pending retirement claims. Historical inventory, provenance, attribution, stable-version comparison and negative guards are outside this count and remain unchanged."
    },
    {
      "name": "Focused cold catalog replay",
      "command": "pnpm test:storybook -- catalog/plugins/ai/ErrorsAndMentions.stories.ts catalog/plugins/ai/ToolActivity.stories.ts",
      "result": "pass",
      "tests": 24,
      "failures": 0,
      "detail": "Both files pass six tests in each desktop/light, narrow/light, desktop/dark and narrow/dark presentation using the exact isolated source snapshot and five verified private archives. Reports: lapis-desktop-validation-7dd97d81-167c-459f-8fbb-0abf9836e5f9."
    },
    {
      "name": "Post-change authority scan",
      "command": "Targeted active stale-reference scan plus consolidated classified reference scan",
      "result": "pass",
      "failures": 0,
      "detail": "The sixteen targeted stale claims are absent. Remaining hits are current retired-state wording, immutable migration/Sync provenance, release upgrade guards, controller attribution, negative audits and historical installed-data checks; none imports or launches the retired Desktop or shared AI plugin."
    },
    {
      "name": "Initial specification gate",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "detail": "Validate stopped because formatting the edited requirement expanded desktop.md above 32 KiB and verbose new evidence text expanded verification.md above 32 KiB. The exact base files were each only 26-28 bytes below the cap. Restoring the original table layout, shortening the requirement without weakening it and compacting evidence links puts both below the existing cap; no contract was split or removed."
    },
    {
      "name": "Initial mapped spec-first gate",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 2,
      "detail": "The catalog fixture change lacked fresh ai.md and governance.md mappings. Bounded E-RETIRE-016 references now map the Desktop-owned command without changing AI behavior, controller guards, service ownership or validation policy."
    },
    {
      "name": "Specification book build",
      "command": "pnpm spec:build",
      "result": "pass",
      "failures": 0,
      "detail": "All 527 evidence records and the complete specification book build from the isolated source snapshot. Report: lapis-desktop-validation-cac5426e-7070-4d4c-be35-04ea40b360cc."
    },
    {
      "name": "Mapped spec-first gate",
      "command": "pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "detail": "Four protected files map to six canonical chapters. Report: lapis-desktop-validation-277d10d3-3126-447a-8c30-dfe83cbc9210."
    },
    {
      "name": "Catalog parity inventory",
      "command": "pnpm check:storybook-parity",
      "result": "pass",
      "families": 117,
      "failures": 0,
      "detail": "All 117 governed catalog families remain mapped with no parity findings. Report: lapis-desktop-validation-3ebc202d-77b7-4f9a-a315-2edec9085279."
    },
    {
      "name": "Aggregate specification gate",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Specification validation passes, then the archive runner reports Source intake ancestry unavailable or stale in its canonical-intake subprocess. The retained snapshot has the expected source revision and parent, and the canonical-intake command passes directly in that exact snapshot with explicit head and base. This is an archive-runner environment propagation failure; hosted exact-head CI remains the authoritative aggregate gate. Report: lapis-desktop-validation-ea16bbf0-7ea8-442b-a21d-daefad724a61."
    }
  ],
  "remaining": []
}
```

Website production deployment and npm metadata changes remain separate approval
gates. This receipt changes neither release state nor installed applications.
