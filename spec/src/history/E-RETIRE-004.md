# Prepare native shared AI preservation acceptance

```json
{
  "id": "E-RETIRE-004",
  "date": "2026-11-17",
  "revision": "enclosing-change",
  "result": "pending",
  "versions": {
    "desktopBase": "351811a99485",
    "notesSource": "5ffb33c152404b6880debd1b5fd70762121d6196",
    "hostNode": "26.9.0",
    "specValidator": "0.2.1"
  },
  "requirements": ["LD-PLUG-001", "LD-AI-002", "LD-DESK-004"],
  "files": [
    "tests/desktop/ai-notes-binding.test.mjs",
    "tests/desktop/ai-retirement-fixture.mjs",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/plugins.md",
    "spec/src/backlog/ai-qualification.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-RETIRE-004.md"
  ],
  "contractReview": "LD-PLUG-001 already requires bundled identity precedence, explicit disabled preferences and Safe Mode optional suppression. Correct the stale pre-M10 description to match actual registration. No production behavior, public installer policy, settings schema or deletion rule changes. Retain Desktop-owned AiPlugin, App Profile native-chat, all installed records and user data.",
  "acceptanceReview": "Prepare actual native WebView acceptance through existing inventoried ai-notes-binding test and production Shell/Notes startup. A synthetic installed ai manifest and throwing main sentinel exercise shadowed installed-copy behavior, not signed bundle installation or exact historical artifact compatibility. Compare original manifest, main, installed/community preferences, legacy settings, conversation metadata/transcript and memory bytes across startup, guarded close and cold reopen. Enabled startup additionally checks canonical pluginData retains legacy controller IDs and unknown fields. Legacy installed enabled=false and App Shell ai=false remain separately covered. Initial Safe Mode is seeded using only the disposable profile identity before Notes opens, then cold session startup must restore bundled AI without evaluating the external module. These cases are prepared, not executed or qualified.",
  "runs": [
    {
      "name": "Initial specification discovery",
      "command": "pnpm spec:search --semantic 'retired external AI bundled plugin Safe Mode saved data'",
      "result": "fail",
      "failures": 1,
      "detail": "Fresh isolated workspace has no node_modules, so spec-validator is absent. Published0.2.1 doctor then reproduced host QMD ABI147 mismatch; search explicitly degraded to text fallback. No semantic-search success claimed."
    },
    {
      "name": "Tool-only setup attempts",
      "command": "Published spec-validator search and Prettier setup in the dependency-free workspace",
      "result": "fail",
      "failures": 2,
      "detail": "An extra literal -- was rejected by search; corrected invocation reported QMD text fallback. Prettier initially could not resolve prettier-plugin-svelte; explicit temporary proseWrap-only config formats only changed Markdown/MJS with the same pinned Prettier3.3.3. No source alias, dependency installation or product host fallback."
    },
    {
      "name": "Native test syntax",
      "command": "node --check tests/desktop/ai-notes-binding.test.mjs; node --check tests/desktop/ai-retirement-fixture.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Syntax only. No native app or provider was started."
    },
    {
      "name": "Disposable synthetic fixture preparation",
      "command": "Node temporary-directory seedRetiredAi smoke for enabled, installed-disabled and App Shell-disabled variants; native inventory lookup",
      "result": "pass",
      "failures": 0,
      "detail": "All3variants create and byte-check their files. Existing ai-notes-binding remains services/feature with coldProcess=true. This validates fixture preparation/inventory only, not startup, data migration, signatures or native AI."
    },
    {
      "name": "Initial specification byte-limit finding",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "omarchy4eed953f-d715-4e8b-b105-12db10f820f9 rejects desktop.md at32973bytes over32768. Replace the added prose with a short evidence link within the existing navigation line; preserve all requirements and the unchanged limit. Final chapter32765bytes."
    },
    {
      "name": "Specification and evidence checks",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "083e034c-b7b6-4a1e-899f-c567f3f027ed: omarchy Docker with exact merged-main public archive inventory; validate/evidence, Rust formatting, mdBook and spec-first all pass. No host fallback or native execution."
    },
    {
      "name": "Actual native preservation acceptance",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- headed --family services",
      "result": "pending",
      "failures": 0,
      "detail": "Before: existing2cases had no installed external AI fixture, legacy-source disablement matrix or AI-specific Safe Mode/data preservation case. After:4additional cases prepared;0native cases executed in this slice. macOS execution requires its separate on-demand decision and remains non-qualifying under current policy."
    }
  ],
  "remaining": [
    "Execute and review all6ai-notes-binding native cases only through an explicitly selected native lane; retain every failure and actual receipt.",
    "Qualify the original deployed artifact and supported production native platform boundary; synthetic installed records do not prove signed installation, origin authenticity or historical-byte compatibility.",
    "App Profile native-chat owns a separate storage/runtime path. Its equivalent old-data/cold/Safe Mode acceptance remains separate; default Desktop AiPlugin acceptance cannot qualify it.",
    "No provider prompt, resume or replay proof is claimed; stored controller identifiers remain inert. Keep publication, website cutover and installed-app replacement separately gated."
  ]
}
```

## Audited production path

- `src/components/views/Shell.svelte` selects `AiPlugin` through
  `createNativeAi` by default. Only `data-ai-owner=core` selects App Profile's
  native-chat owner.
- `NotesWorkspace.svelte` supplies either owned AI factory and supplies
  `unavailableDesktopPlugins.ai` only when neither exists. It does not import
  the retired shared plugin or start ai-controller.
- `notes-bundled-plugins.ts` binds owned services, reads retained disablement
  and registers a static `ai` before configured plugin loading.
- `notes-startup.ts` loads configuration, registers bundled plugins, then passes
  independent community/optional-core Safe Mode options to the public manager.
- `aiEnabledByDefault` reads legacy App Shell `ai:false` and installed
  `plugins.ai.enabled:false` without writing either file. Core preferences
  remain separately authoritative through the public manager.
- In pinned Notes source, `PluginManager.registerStaticPlugins` retains the
  bundled registration. External loading checks already registered identities;
  no retirement-specific uninstall or ID-only filesystem deletion is involved.
- `AiPlugin.onload` reads old `.lapis/plugins/ai/data.json` only when needed and
  writes the retained payload through public `saveData`. `AiSettingsStore`
  preserves unknown source fields and legacy sessions without activating them.
  `selectAiRuntime` rejects saved non-ACP runtime names instead of invoking a
  controller fallback.

No native application, installed profile, provider credential or user vault was
opened. No visual baseline changed. Prepared test sources cannot close the
native retirement gate.
