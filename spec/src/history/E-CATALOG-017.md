# Qualified public controls and native-turn fixture modes

```json
{
  "id": "E-CATALOG-017",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M10.2", "M15.1"],
  "requirements": ["LD-AI-002", "LD-AI-004", "LD-CAT-002", "LD-CAT-003"],
  "versions": {
    "desktopFrozen": "2487a75a87c72a8f233b026ff10aee1aa0ec6840",
    "archiveCount": 26,
    "archiveInventorySha256": "fb390d92fc9ccdd7f50841490a002b5888b1658918d34cab220e53448c5c0ce2",
    "beforeRun": "2f578e08-62c8-4d60-85e8-296f1cae726a",
    "beforeSource": "25065a4855a750584a49e6255dcc03c9679b4821",
    "exact-repaired-afterSource": "fd3bee661ff05bd747433654165e6b631e1b5f04",
    "complete-three-familiesSource": "fd3bee661ff05bd747433654165e6b631e1b5f04"
  },
  "contractReview": "Update only private consumer catalog fixtures and selectors to the already-qualified public contracts. Select.Trigger has combobox semantics while retaining Mode, Action approvals and LLM provider labels. NativeChatHost target metadata requires a safe default_mode; the production adapter already supplies it and the shared observer refuses missing metadata. Keep exact saved profiles, secret isolation, failed-save retention, submitted request, unknown outcome, follow-up continuation and retained History assertions. Assert submitted options.mode is read-only; no product, public API, timeout or shared helper changes.",
  "milestoneReview": "This is portable catalog source acceptance only. M10.2 and M15.1 retain original native/provider, persistence, lifecycle and screen-review gates. Fixture results do not qualify an actual provider or replace E-CORE-027 or the complete final intake.",
  "runs": [
    {
      "name": "exact-unchanged-before",
      "command": "pnpm test:storybook -- catalog/plugins/ai/AgentProfiles.stories.ts catalog/plugins/ai/AgentProviders.stories.ts catalog/plugins/ai/NativeTurns.stories.ts -t 'Context And Permissions|Independent Providers|Existing Configuration|Provider Save Failure|Send And Follow Up|Lost Reply|Retained History Navigation'",
      "result": "fail",
      "failures": 7,
      "filtered": 5,
      "note": "Cold exact run 2f578e08: desktop/light has seven failures and five name-filtered stories. AgentProfiles Mode and AgentProviders LLM provider selectors query stale button roles; NativeTurns has no submitted record because the fixture target lacks required safe default_mode. The runner correctly stops; no later mode is claimed."
    },
    {
      "name": "exact-repaired-after",
      "command": "pnpm test:storybook -- catalog/plugins/ai/AgentProfiles.stories.ts catalog/plugins/ai/AgentProviders.stories.ts catalog/plugins/ai/NativeTurns.stories.ts -t Context And Permissions|Independent Providers|Existing Configuration|Provider Save Failure|Send And Follow Up|Lost Reply|Retained History Navigation",
      "result": "pass",
      "tests": 28,
      "failures": 0,
      "filtered": 20,
      "note": "2abadf1c-19cc-4656-bc35-ef9caa4fa868: all desktop/narrow and light/dark modes pass. Cold owned workers preserve fatal-diagnostic and accessibility gates. Original saved-value, secret-isolation, failed-save, unknown-outcome, continuation and retained History assertions remain; native send/follow-up cases additionally assert submitted options.mode is read-only."
    },
    {
      "name": "complete-three-families",
      "command": "pnpm test:storybook -- catalog/plugins/ai/AgentProfiles.stories.ts catalog/plugins/ai/AgentProviders.stories.ts catalog/plugins/ai/NativeTurns.stories.ts",
      "result": "pass",
      "tests": 48,
      "failures": 0,
      "filtered": 0,
      "note": "fe4fad44-890d-4477-ada2-529c9d89405f: all desktop/narrow and light/dark modes pass. Cold owned workers preserve fatal-diagnostic and accessibility gates. Original saved-value, secret-isolation, failed-save, unknown-outcome, continuation and retained History assertions remain; native send/follow-up cases additionally assert submitted options.mode is read-only."
    },
    {
      "name": "source-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "5596f1c5-6fd6-4333-a8bb-1b0c72894e36: Svelte reports zero errors and warnings."
    },
    {
      "name": "production-composition",
      "command": "pnpm check:storybook-parity",
      "result": "pass",
      "failures": 0,
      "note": "91ade957-79ed-4516-84fb-52d7a8205e9e: All 108 actual production families pass."
    },
    {
      "name": "complete-runner-guards",
      "command": "pnpm validation:check",
      "result": "pass",
      "failures": 0,
      "note": "d8aeff24-e11b-4c40-81a0-26e0940eb853: All 77 runner, lease, dispatch, source, composition and fatal-runtime regressions pass without skips.",
      "tests": 77
    },
    {
      "name": "scoped-specification-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 2,
      "note": "a59ec373-c8d4-40d0-ba6d-11e58e330f2d: the new ai.md paragraph takes the chapter to 401 physical lines and the fresh record lacks its required SUMMARY entry. Shorten only this new paragraph and add one coordinated E-CATALOG-017 navigation entry. Validators and original contracts remain unchanged."
    },
    {
      "name": "mapped-specification-before",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "47c1d9ed-fe58-4d1c-9314-b5bc24dc22df: validation, Rust formatting and mdBook pass; spec-first requires plugins.md for the catalog/support fixture path. Add only the coordinated current-wire-metadata sentence in that chapter. The AI-story mapping remains satisfied by ai.md; no checker, original gate or product input changes."
    },
    {
      "name": "mapped-specification-after",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "a0590852-6321-4be3-9e68-483baa7b5f2f: all four canonical lanes pass: validation, Rust formatting, mdBook and mapped spec-first. ai.md is 400 physical lines, plugins.md is 399, and SUMMARY adds only this record. No runtime inputs changed for these documentation corrections."
    },
    {
      "name": "private-source-and-archive-equality",
      "command": "python3 .local/validation/agent-catalog-equality.py",
      "result": "pass",
      "failures": 0,
      "note": "Ignored agent-catalog-source-equality.json proves the unchanged before tree equals frozen 2487a75a. Only four owned private catalog files and their canonical evidence/navigation differ. It mechanically preserves original assertions/timeouts except current public combobox selectors and four added safe-mode assertions, verifies the same private inputs for exact and complete family runs, hashes all 26 actual archives against fb390d92, and retains immutable result/log/four-mode JUnit checksums. Production, native, package, lock, shared helper and runner inputs are byte-identical."
    },
    {
      "name": "final-record-status-before",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "ef254da8-be0c-402a-b9f1-16ffa1198617: canonical progress validation refuses a pass record while remaining full-intake/native gates are explicitly retained. Keep this evidence pending at those original task gates, preserving every passing focused run and remaining item. Do not remove gaps or weaken validation merely to obtain pass metadata."
    }
  ],
  "files": [
    "catalog/plugins/ai/AgentProfiles.stories.ts",
    "catalog/plugins/ai/AgentProviders.stories.ts",
    "catalog/plugins/ai/NativeTurns.stories.ts",
    "catalog/support/ai/native-turns/fixture.ts",
    "spec/src/current/ai.md",
    "spec/src/history/E-CATALOG-017.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/plugins.md"
  ],
  "remaining": [
    "E-VALIDATION-003 owns final full-cohort catalog integration, central milestone/verification registration and generated MIGRATION refresh. This scoped evidence never replaces unexecuted modes or relabels failed original runs.",
    "M10.2/M15.1 original native/provider, persistence, lifecycle and screen-review gates remain unchanged; distribution/publication and visual approval remain separate."
  ]
}
```
