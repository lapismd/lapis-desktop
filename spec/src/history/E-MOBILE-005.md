# Wait for App-owned mobile chrome after shell start

```json
{
  "id": "E-MOBILE-005",
  "date": "2026-11-13",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "failedRun": 43443462401,
    "failedJob": 131977689890,
    "sourceCommit": "63d2299d47217ac2fe3f26b5e4855f7b1759a656",
    "coreOverride": "0.13.0",
    "coreRange": "^0.12.1"
  },
  "requirements": ["LD-SESSION-005", "LD-GOV-006", "LD-GOV-008"],
  "files": [
    "catalog/plugins/Workspace.stories.ts",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/mobile-layout.md",
    "spec/src/history/E-MOBILE-005.md",
    "spec/src/navigation/history-02.md",
    "tests/governance/ci-prerequisites.test.mjs"
  ],
  "contractReview": "Notes-ready is session startup, not AppShell preference hydration. The responsive catalog waits until workspace-mobile exists; toBeVisible(null) does not retry. Auto observes the live app-shell width. Published Core 0.12.4 attached that observer only in onMount, so Auto stayed desktop. Released 0.13.0 observes root with an effect. The host still does not force displayMode. E-MOBILE-003 and E-MOBILE-004 stay immutable.",
  "acceptanceReview": "Hosted Storybook shard 1/4 on 63d2299d failed 1 of 129 cases because Responsive Layout asserted workspace-mobile immediately after notes-ready. Local replay with a wait reached Always/Never/Always, then Auto stayed desktop on 0.12.4 at 390px shell width. Fresh hosted shard 1 and unit pin checks remain required.",
  "remaining": [
    "Pass hosted Storybook interactions shard 1/4 and Unit tests on the repaired commit before merge."
  ],
  "runs": [
    {
      "name": "hosted-storybook-shard-1-before",
      "command": "GitHub Actions run 43443462401 job 131977689890",
      "result": "fail",
      "failures": 1,
      "detail": "128 passed. catalog/plugins/Workspace.stories.ts > Responsive Layout on desktop/light received null for [data-ui-component=workspace-mobile] after notes-ready."
    },
    {
      "name": "local-responsive-layout-0.12.4",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/Workspace.stories.ts -t 'Responsive Layout'",
      "result": "fail",
      "failures": 1,
      "detail": "After waiting for the first Always paint, Auto 390px kept desktop chrome on published 0.12.4 (onMount observer). shellWidth was 390."
    },
    {
      "name": "exact-responsive-layout-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:storybook -- catalog/plugins/Workspace.stories.ts -t 'Responsive Layout'",
      "result": "pass",
      "failures": 0,
      "detail": "4/4 viewport/theme variants passed on Design Core 0.13.0 after waiting for workspace-mobile and sizing the observed app-shell."
    },
    {
      "name": "exact-prerequisites-after",
      "command": "node --import tsx --test tests/governance/ci-prerequisites.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "7/7 pass, including the released Notes cohort Design Core 0.13.0 peer-context pin."
    }
  ]
}
```

The hosted failure is the original acceptance boundary. This record does not
rewrite E-MOBILE-003 or claim native-window qualification.
