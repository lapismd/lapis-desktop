# Desktop renderer credential admission

```json
{
  "id": "E-REPO-062",
  "date": "2026-11-25",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-DESK-003", "LD-REPO-005", "LD-GOV-006", "LD-GOV-004"],
  "versions": {
    "notesAPI": "0.6.15 built archive from 9d34e7f94721ffae62fbcf6f7996c6e9efea69b5",
    "notesReleaseCandidate": "API 0.6.16 from Notes CI tree 88bc5fc7cdcc59b7c036c89dd6d18b927257e918",
    "notesRegistry": "@lapis-notes/api@0.6.16",
    "nativePlugins": "9f2713ac6a4f40ff48325620d969de08fb31f5aa"
  },
  "files": [
    ".github/dependency-automation/artifact-projection.json",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/validation/native-sources.json",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-REPO-062.md",
    "spec/src/navigation/history-01.md",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/native/plugin-credentials.ts",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/profile-registry.test.mjs",
    "tests/governance/validation-native.test.mjs"
  ],
  "contractReview": "Desktop passes the admitted plugin secret host to the owned App. Plugin activation and revocation use the Notes API while the native client retains authority over persisted secrets.",
  "acceptanceReview": "The Notes API installs from npm and exposes the credential capability. The native source inventory follows the shared Core Cargo lock. Hosted and full macOS application acceptance remain separate.",
  "runs": [
    {
      "name": "Desktop renderer types, unit tests and build",
      "command": "pnpm check:types && node --import tsx --test tests/renderer/*.test.mjs && pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Zero Svelte diagnostics, 402 unit tests, and a successful renderer build."
    },
    {
      "name": "Full catalog first desktop-light variant",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "detail": "Editor Blame Action did not reach the existing Notes-ready assertion. 133 other cases passed before the dispatcher stopped."
    },
    {
      "name": "Fresh exact Blame story in all four variants",
      "command": "pnpm test:storybook -- catalog/plugins/repository/Blame.stories.ts",
      "result": "pass",
      "failures": 0,
      "detail": "All five cases passed on each of four variants with unchanged assertions and timeouts."
    },
    {
      "name": "Desktop catalog static build",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Wider catalog retry of the failing variant",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "detail": "The complete desktop-light variant of shard 1 reran cold and passed all 134 cases. Further variants remain running."
    },
    {
      "name": "Notes API release candidate",
      "command": "pnpm check:types && node --import tsx --test tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Zero Svelte diagnostics and all 402 renderer tests pass against the independently checksummed 0.6.16 release archive."
    },
    {
      "name": "Notes API release candidate catalog",
      "command": "pnpm test:storybook -- catalog/plugins/desktop/Startup.stories.ts catalog/plugins/repository/Blame.stories.ts",
      "result": "pass",
      "failures": 0,
      "detail": "All 11 stories passed across four theme and viewport variants."
    },
    {
      "name": "Complete cold Desktop catalog rerun",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "detail": "All 2,172 interactions passed across 16 shard and theme/viewport combinations with the built Notes API 0.6.15 credential archive."
    },
    {
      "name": "Released Notes API renderer",
      "command": "pnpm exec svelte-check --tsconfig tsconfig.json --fail-on-warnings && node --import tsx --test tests/renderer/*.test.mjs && pnpm exec vite build",
      "result": "pass",
      "failures": 0,
      "detail": "Verified installed API 0.6.16, zero Svelte diagnostics, 402 renderer tests and a successful production build."
    },
    {
      "name": "Registry and native source pin assertions",
      "command": "node --import tsx --test --test-name-pattern=\"portable sources retain the native Notes pin|released Notes cohort|released retirement cohort\" tests/governance/validation-native.test.mjs tests/governance/ci-prerequisites.test.mjs tests/governance/profile-registry.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Three reported pin mismatches were reproduced and all three assertions passed after the fixture and native inventory updates."
    }
  ],
  "remaining": [
    "Run hosted exact-source checks and qualify the full macOS application."
  ]
}
```
