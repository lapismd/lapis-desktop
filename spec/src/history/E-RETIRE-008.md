# Remove Desktop Spec Validator Deno bootstrap

```json
{
  "id": "E-RETIRE-008",
  "date": "2026-11-18",
  "revision": "enclosing-change",
  "result": "pass",
  "versions": {
    "desktopBase": "5006a7cffe2f8d816bd822e1cc1a882e88a357be",
    "latestPublishedSpecValidator": "0.2.1",
    "node": "24.15.0",
    "pnpm": "10.34.5",
    "hostNode": "26.9.0"
  },
  "requirements": ["LD-GOV-006", "LD-GOV-008"],
  "files": [
    "scripts/refresh-local-dependencies.mjs",
    "tests/governance/refresh-local-dependencies.test.mjs",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/governance.md",
    "spec/src/backlog/distribution.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-RETIRE-008.md"
  ],
  "archives": [
    {
      "name": "@lapis-notes/lapis-plugin-tasks",
      "version": "0.2.0",
      "sha256": "9ff0dbdec630b0e56fbaa21957349ee22248d80759fa0a3f1a5b3c3a9b898cff"
    },
    {
      "name": "@lapis-notes/api",
      "version": "0.6.8",
      "sha256": "c90eac5de04eb15b971d45665f0bd26603abf3a00fd35320a9ed3cb56dc0f4ce"
    },
    {
      "name": "@lapis-notes/ui",
      "version": "0.2.3",
      "sha256": "d8dc5f8e2469f2e9f4dd5bcd5b727db9780507caa5a8701f3c8a9d32f9a32e95"
    },
    {
      "name": "@lapis-notes/workspace",
      "version": "0.4.8",
      "sha256": "558ecb749a420cbb222a790f19f5527aef9b2d956fcb367e633ca26cc7d60177"
    },
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.2.8",
      "sha256": "5ab4ba28eb6a839bf64cfbc4031c77bb60b9883069ce9c0a510ecce32be3f342"
    },
    {
      "name": "@lapis-notes/language-service",
      "version": "0.1.6",
      "sha256": "9b371f7c14850d73961f9d2a94aad126c964b7f3800576b38079185e821f28a0"
    },
    {
      "name": "@lapis-notes/app-profile",
      "version": "0.2.5",
      "sha256": "82f533715b31a0504f4ce3e9780b9071a8c00bcfb1f9c929c5deff46a0e1d859"
    },
    {
      "name": "@lapismd/ai",
      "version": "0.2.0",
      "sha256": "071f885c9c0b4efe0722bd3771a632583a7416d62a59f17d2c9f3d9ac9ea3630"
    }
  ],
  "contractReview": "Remove only the Desktop-owned obsolete Deno runtime bootstrap used for Spec Validator local refresh. Keep build:node and source-owned public export preparation. Source manifest admission must reject any declared Deno engine, incompatible/missing Node engine and missing Node build before any source build or status freshness check. Existing committed-source, semver, checksum, payload, transitive-context and atomic candidate publication gates remain unchanged. Core APIs/services/functions, Language Service dependencies/wiring and future features are outside this slice and remain unchanged.",
  "acceptanceReview": "Exercise the real refreshLocalDependencies entrypoint in child Node processes with isolated committed Jujutsu source cohorts and an external recording pnpm executable. The supported validator fixture builds its public CLI, JavaScript and declaration files through Node. Legacy engine fixtures record a real outgoing Deno bootstrap argument before the fix; no Deno runtime is actually installed. The after cases must reject before all source build commands and before any candidate receipt. Missing/incompatible Node, missing script, status, stale semver and dirty inputs remain covered. Full owning Desktop check/test/build and specification/evidence checks are required. The accepted eight public archives are the prior verified cohort for local source qualification only; they do not spoof or qualify the fresh 5006 producer dependency/fixture artifact or its same-run hosted fanout. No native/macOS/WebView or provider-live execution is authorized.",
  "runs": [
    {
      "name": "Latest Node validator and specification discovery",
      "command": "pnpm view @lapismd/spec-validator version; pnpm --package=@lapismd/spec-validator@0.2.1 dlx sh -c 'pnpm spec:search \"Deno Spec Validator refresh local dependencies supported Node sources\"'",
      "result": "pass",
      "failures": 0,
      "detail": "Latest published version is 0.2.1, Node >=22. Repository search explicitly reports the text fallback; semantic search is not claimed."
    },
    {
      "name": "Host QMD doctor",
      "command": "pnpm --package=@lapismd/spec-validator@0.2.1 dlx spec-validator doctor",
      "result": "fail",
      "failures": 1,
      "detail": "Existing QMD native modules mismatch host Node ABI 147. Repository/config/book checks pass; global tooling remains untouched and pinned Docker owns product qualification."
    },
    {
      "name": "Initial executable fixture setup failure",
      "command": "node scripts/validation.mjs run validation:check -- tests/governance/refresh-local-dependencies.test.mjs",
      "result": "fail",
      "failures": 7,
      "detail": "8c154506-dbd9-4c98-a3ce-a6da5b654683: the initial cohort fixture omitted build-group root package.json files, so its recording pnpm stopped at Mira before reaching the intended boundary. Correct only the new fixture manifests, preserve assertions, and rerun before editing production."
    },
    {
      "name": "Exact executable source regression before",
      "command": "node scripts/validation.mjs run validation:check -- tests/governance/refresh-local-dependencies.test.mjs",
      "result": "fail",
      "failures": 6,
      "detail": "77ac0210-8272-40b4-89d9-736bd830476b: target 3 pass/6 fail; fixed normal driver includes 96 adjacent controls, aggregate 99 pass/6 fail. Actual refresh attempts pnpm --package=deno@2.5.6 dlx --shell-mode pnpm build:node. Supported Node, stale semver and dirty-source cases already pass."
    },
    {
      "name": "Exact executable source regression after",
      "command": "node scripts/validation.mjs run validation:check -- tests/governance/refresh-local-dependencies.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "daaa7090-02c0-4743-9f08-ec584ff58a62: target 9 pass/0 fail; driver 105 pass/0 fail/0 skip. Old/empty Deno declarations, unsupported/missing Node, missing build and status reject before any source build. Supported Node preserves public files and archive identity; existing semver/dirty-source rejection stays closed."
    },
    {
      "name": "Complete owning Desktop lanes",
      "command": "node scripts/validation.mjs run check:all",
      "result": "pass",
      "failures": 0,
      "detail": "f0b34f3d-1024-4e58-a135-f7a774f83061: independent normal caches, 2 CPUs/12 GiB with established 6 GiB renderer heap. Node governance/renderer 810 pass/0 fail/0 skip; AI 748 pass across 153 files; Rust 290 pass/0 fail/2 existing subprocess-helper ignores across 65 suites. Ordinary/e2e strict Clippy, parity 116 families/0 findings, Svelte 0 errors/0 warnings, formatting and production renderer build pass. Existing bundle-size warning retained. No native or provider-live execution."
    },
    {
      "name": "Canonical specification and evidence",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "01decfb8-1f09-47ee-9c55-04b89701607e: 2 CPUs/4 GiB; validate, rust-format, mdbook and spec-first pass (4 lanes), including evidence and source architecture checks. Existing large search-index warning retained. The final metadata-only seal is additionally checked with check:evidence and formatting before commit."
    },
    {
      "name": "Host formatter entrypoints unavailable",
      "command": "pnpm exec prettier --write <eight changed files>; pnpm --package=prettier@3.3.3 dlx prettier --write <eight changed files>",
      "result": "fail",
      "failures": 2,
      "detail": "Host node_modules lacks Prettier; first command fails before formatting. Pinned dlx then cannot resolve the repository Svelte plugin from the uninstalled host workspace. Final formatter uses the same pinned Prettier 3.3.3 with proseWrap=always on only Markdown and JavaScript, where no Svelte plugin applies. Full Docker formatting already passed in check:all; no host dependencies or config are changed."
    },
    {
      "name": "Final non-Svelte formatting",
      "command": "pnpm --package=prettier@3.3.3 dlx prettier --no-config --prose-wrap always --write <eight changed Markdown/JavaScript files>",
      "result": "pass",
      "failures": 0,
      "detail": "Equivalent applicable repository options for the changed Markdown/JavaScript files; no Svelte input or persistent formatting configuration changes."
    },
    {
      "name": "Receipt evidence after scoped seal",
      "command": "node scripts/validation.mjs run check:evidence",
      "result": "pass",
      "failures": 0,
      "detail": "f272ffc7-3772-4a65-8567-cd0355fb4d20: 510 records pass. Recheck after recording the host-only formatter attempts and final formatting; retain prior receipts unchanged."
    }
  ],
  "remaining": []
}
```

## Desktop Deno usage audit

- The removed refresh branch was the only direct Desktop Deno launch found in
  tracked source, scripts, CI, configuration and test entrypoints. It selected a
  Deno npm bootstrap from the producer manifest despite the current supported
  Node build contract. The source-owned build command remains unchanged.
- Keep bundle exclusion in `check-bundle.mjs`, ordinary-release verification,
  production source rejection and native smoke PATH denial. Their Deno text
  rejects runtime dependence; it does not launch Deno. Native turn-owner
  rejection and negative tests remain intact.
- Keep release candidate `nodeDenoOnPath` receipt validation and smoke fields,
  and the CalVer comparison against the historical stable Deno app. Upgrade,
  native product and ordinary installed-app qualification remain separate.
- Lock metadata for `@lapismd/ai-host@0.3.0` and `@zip.js/zip.js@2.24.0`
  declares multiple supported runtimes, including Node. An engine declaration is
  not evidence of a Desktop Deno subprocess. Preserve those packages and their
  core APIs/services; no manifest or lock cleanup is included.
- Other local source groups still use their owning build contracts. This change
  certifies the Desktop Spec Validator invocation, not every producer's
  implementation. Generic unused-function cleanup, Language Service removal,
  other AI helpers/styles and future features are excluded by the narrowed user
  scope. No such source was edited.

The complete tracked code/config Deno hits are retained in the ignored
`.local/validation/retirement-desktop-deno-usage-after.json`. No additional
Desktop-owned Deno launch remains in that audit. Frozen-host cutover and
separately owned Deno adapters remain in the existing retirement plan.
