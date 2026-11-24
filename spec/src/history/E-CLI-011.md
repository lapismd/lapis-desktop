# CLI declarative Settings consumer acceptance

```json
{
  "id": "E-CLI-011",
  "date": "2026-11-24",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-CLI-001", "LD-CLI-003", "LD-CAT-002"],
  "files": [
    "catalog/plugins/cli/Workspace.stories.ts",
    "spec/src/current/plugins.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-01.md",
    "spec/src/history/E-CLI-011.md"
  ],
  "versions": {
    "base": "e9f357ffe088e998dd4ae2cc57ef3644b9f20a87",
    "ui": "0.2.8",
    "api": "0.6.14"
  },
  "contractReview": "Published UI0.2.8 owns the declarative General Settings definition: direct Status/Installation/Refresh fields in Advanced and separate Desktop access. Its source contract and registration tests preserve host ownership and disposal. Desktop consumes that public definition rather than its previous nested cli field. Keep exact structure/search, empty persisted authority, real workspace readiness, installation availability, credential enable/scope/create/token-file/revoke and workspace disposal checks. Browser evidence does not qualify native dialogs or custody.",
  "acceptanceReview": "Hosted shard3/4 on e9f357ff fails one CLI Workspace play before interaction on the old nested definition assertion;125 other desktop/light cases pass. Update the consuming story to check the current public model and scope actions to the actual Settings dialog. Add independent replacement disposal and search retirement assertions. No product implementation, UI override, runtime fixture, skip or baseline change.",
  "runs": [
    {
      "name": "Original hosted CLI workspace regression",
      "command": "LAPIS_DESKTOP_CATALOG_SHARD=3 LAPIS_DESKTOP_CATALOG_PROFILE=full pnpm ci:storybook-interaction; catalog/plugins/cli/Workspace.stories.ts > General Advanced And Disposal",
      "result": "fail",
      "failures": 1,
      "passed": 125,
      "detail": "Job138181873351: expected nested advanced/cli field; actual UI0.2.8 has three declarative Advanced controls and a separate Desktop access group."
    },
    {
      "name": "First local updated-model reproduction",
      "command": "pnpm test:storybook -- catalog/plugins/cli/Workspace.stories.ts",
      "result": "fail",
      "failures": 1,
      "detail": "The newly added controller search assertion assumed a two-level path for an explicit legacy search entry. Core prepends its section title to that entry; the real Status field has General/Advanced/Status. Keep original declared metadata assertion and independently verify both admitted search entries with the concrete Status breadcrumb. No shared Core or UI change."
    },
    {
      "name": "Exact repaired Workspace cold reproduction",
      "command": "LAPIS_DESKTOP_BASE=e9f357ffe088e998dd4ae2cc57ef3644b9f20a87 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test:storybook -- catalog/plugins/cli/Workspace.stories.ts",
      "result": "pass",
      "passed": 4,
      "failures": 0,
      "detail": "One case passes in desktop/light, narrow/light, desktop/dark and narrow/dark; Docker run2436b2cf-611e-45b7-8f9a-ffdb5d850fc8. The actual Settings dialog supports credential enable, Notes scope, creation, token-file and revocation before vault disposal."
    },
    {
      "name": "Complete affected CLI catalog",
      "command": "LAPIS_DESKTOP_BASE=e9f357ffe088e998dd4ae2cc57ef3644b9f20a87 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test:storybook -- catalog/plugins/cli",
      "result": "pass",
      "passed": 20,
      "failures": 0,
      "detail": "Both Settings and Workspace story files pass all five cases in each of four viewport/theme variants. Fresh Docker process; run details retained in portable reports."
    },
    {
      "name": "Catalog parity regression controls",
      "command": "node --test tests/governance/storybook-parity.test.mjs",
      "result": "pass",
      "passed": 32,
      "failures": 0
    },
    {
      "name": "Full portable specification and source governance",
      "command": "LAPIS_DESKTOP_BASE=e9f357ffe088e998dd4ae2cc57ef3644b9f20a87 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "All five lanes pass: validation including source audit/parity/evidence, canonical dependency intake, Rust formatting, mdbook and spec-first. CLI chapter remains400 lines/31228 bytes and verification140/32446."
    },
    {
      "name": "Portable type and warning gate",
      "command": "LAPIS_DESKTOP_BASE=e9f357ffe088e998dd4ae2cc57ef3644b9f20a87 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check:types",
      "result": "pass",
      "failures": 0,
      "detail": "Svelte check completes with zero errors and zero warnings."
    }
  ],
  "remaining": [
    "Exact-head hosted CI, release and native Homebrew qualification"
  ]
}
```
