# Signed native plugin lifecycle

```json
{
  "id": "E-INSTALL-001",
  "tasks": ["M9", "M9.1"],
  "requirements": [
    "LD-MIG-002",
    "LD-PLUG-001",
    "LD-INSTALL-001",
    "LD-INSTALL-002"
  ],
  "revision": "enclosing-change",
  "files": [
    "MIGRATION.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/migration.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-INSTALL-001.md",
    "src/main.ts",
    "src/lib/desktop/bootstrap.ts",
    "src/components/views/Shell.svelte",
    "src/components/views/NotesWorkspace.svelte",
    "spec/src/current/plugins.md",
    "tests/desktop/distribution-fixtures.mjs",
    "tests/desktop/distribution-entry.ts",
    "tests/desktop/distribution-driver.mjs",
    "tests/desktop/plugin-distribution.test.mjs",
    "tests/desktop/plugin-distribution-recovery.test.mjs",
    "tests/desktop/plugin-entry.ts",
    "tests/desktop/entry.ts",
    "scripts/check-bundle.mjs",
    "scripts/desktop-acceptance.mjs",
    "src/lib/notes/notes-plugin-browser.ts",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "vite.config.ts",
    "spec/src/current/verification.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M9": "Signed-package verification, shared API identity, restart, failed-load recovery, capability restrictions and bundled-ID collision checks pass in a packaged app.",
    "M9.1": "Signed compatible plugins install, enable, disable, update and uninstall with shared API identity, restart recovery, capability rejection and bundled-ID protection in the packaged app."
  },
  "runs": [
    {
      "name": "source-foundation-first-affected",
      "command": "Source API vitest plugin-installer, plugin-manager, plugin-distribution, plugin-distribution-manager and nostr-plugin-distribution files",
      "result": "pass",
      "passed": 122,
      "failures": 0,
      "note": "Intermediate source foundation only; more restart/diagnostic regressions and full source qualification remain. No M9 native installation claim."
    },
    {
      "name": "source-foundation-complete-unit",
      "command": "Source TURBO_CONCURRENCY=1 pnpm check; pnpm test --task-args --maxWorkers=1; pnpm build",
      "result": "pass",
      "passed": 1728,
      "failures": 0,
      "note": "18 check tasks, 18 test tasks, 10 builds. Full catalog, Web/server, source commit and consumer archives pending."
    },
    {
      "name": "source-plugin-management-cold",
      "command": "pnpm exec vitest run --project storybook stories/workspace/PluginManagement.stories.ts",
      "result": "pass",
      "passed": 25,
      "failures": 0
    },
    {
      "name": "native-fixture-format-before",
      "command": "node --test --test-name-pattern=\"signed native installation shares\" tests/desktop/plugin-distribution.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Fixture error: release.signed.json was compressed; production correctly requires a stored first ZIP entry. Corrected fixture packaging, no product assertion weakened."
    },
    {
      "name": "native-fixture-abi-before",
      "command": "Same exact native target after ZIP correction",
      "result": "fail",
      "failures": 1,
      "note": "Fixture imported unversioned svelte instead of the public renderer ABI. Corrected fixture to derive the approved exact renderer specifier from the public module registry."
    },
    {
      "name": "native-lifecycle-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/m91/native-before node --test --test-concurrency=1 --test-name-pattern=\"signed native installation shares\" tests/desktop/plugin-distribution.test.mjs",
      "result": "fail",
      "failures": 1,
      "passed": 0,
      "note": "Using the committed M8 archive cohort: real signature verification, installation and shared API/Svelte identity pass. Update publishes version 2 while version 1 remains enabled; original assertion waiting.enabled === false fails. Source fixes are not installed into this baseline."
    },
    {
      "name": "source-owner-boundaries",
      "command": "API vitest plugin-manager -t \"retires replacement resources|dormant static registration|direct external load that collides\"",
      "result": "pass",
      "passed": 3,
      "failures": 0,
      "note": "Two meaningful failures reproduced before fix. Repeated rollback retains an older reload barrier; dormant static IDs reject before contribution indexing."
    },
    {
      "name": "source-services",
      "command": "API vitest plugin-manager -t \"checks required native services\"",
      "result": "pass",
      "passed": 5,
      "failures": 0,
      "note": "Unsupported, unavailable, available and malformed declarations remain distinct. Native service qualification still pending."
    },
    {
      "name": "source-final-affected",
      "command": "API vitest seven affected plugin lifecycle/distribution/persistence files",
      "result": "pass",
      "passed": 149,
      "failures": 0
    },
    {
      "name": "source-final-core",
      "command": "TURBO_CONCURRENCY=1 pnpm check; pnpm test --task-args --maxWorkers=1; pnpm build",
      "result": "pass",
      "passed": 1734,
      "failures": 0,
      "note": "18 check tasks, 18 test tasks, 10 build tasks. 1,860 executions include 126 build prerequisites; one pre-existing frozen-desktop skip."
    },
    {
      "name": "desktop-js-governance",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "passed": 85,
      "failures": 0
    },
    {
      "name": "native-plugins-ui-before",
      "command": "node --test --test-name-pattern=\"Word Count installs through\" tests/desktop/plugin-distribution.test.mjs",
      "result": "fail",
      "passed": 0,
      "failures": 1,
      "note": "The existing production Plugins view had no desktop ribbon/view registration. Native acceptance fails waiting for ribbon:app:plugins before any install. Desktop routing now composes the public Workspace component."
    },
    {
      "name": "source-foundation-committed",
      "command": "Owning Notes workspace check, tests, build, full catalog/static/docs and Web/server lanes",
      "result": "pass",
      "passed": 1734,
      "failures": 0,
      "note": "Committed 2b7ee095babd04f72639be7b6140c0cb64eb1512. 259 catalog/axe, 172 static chapters, six docs cases and 13 Web/server cases pass. One earlier server setup failure and exact reproduction traced to Docker VM disk exhaustion; removing two migration-owned unused/unshared cache records restores unchanged acceptance. Docker is stopped at 3072 MiB."
    },
    {
      "name": "archive-refresh",
      "command": "node .local/m91/refresh-core.mjs; pnpm local:install",
      "result": "pass",
      "passed": 14,
      "failures": 0,
      "note": "Five committed Notes public archives refreshed; nine other archive entries retained. All 14 import routes verify. Tracked package manifests/lockfiles preserved; no publication."
    },
    {
      "name": "desktop-source-checks",
      "command": "pnpm test; pnpm check:rust; pnpm check:types",
      "result": "pass",
      "passed": 162,
      "failures": 0,
      "note": "85 JS/governance plus 77 Rust cases. Two pre-existing platform cases ignored. Clippy and zero-error/warning type checks pass, including with the ignored public fixture file hidden."
    },
    {
      "name": "native-focused-first-refreshed",
      "command": "node --test --test-concurrency=1 tests/desktop/plugin-distribution.test.mjs tests/desktop/plugin-distribution-recovery.test.mjs",
      "result": "fail",
      "passed": 4,
      "failures": 1,
      "note": "All SDK safety cases pass. The real Word Count UI case incorrectly assumed that the curated homepage displays every plugin; the ordinary Plugins directory/search step was missing from the test."
    },
    {
      "name": "native-plugins-ui-after",
      "command": "node --test --test-concurrency=1 --test-name-pattern=\"Word Count installs through\" tests/desktop/plugin-distribution.test.mjs",
      "result": "pass",
      "passed": 1,
      "failures": 0,
      "note": "Uses the production Plugins ribbon, directory/search and Install in Lapis action; real Settings disable/re-enable, cold persistence and uninstall cleanup pass. Original assertions retained."
    },
    {
      "name": "desktop-catalog-complete",
      "command": "pnpm test:storybook",
      "result": "pass",
      "passed": 84,
      "failures": 0,
      "note": "21 cases in each desktop/narrow and light/dark combination; fresh processes and accessibility errors enabled."
    },
    {
      "name": "full-cold-native",
      "command": "pnpm test:desktop",
      "result": "pass",
      "passed": 113,
      "failures": 0,
      "note": "2 startup cases, 27 WDIO cases, 82 native lifecycle cases and 2 development-origin representation cases pass. All five new signed distribution cases pass in this full run. Native children have no Node/Deno on PATH. /tmp/lapis-m91-native-full.log."
    },
    {
      "name": "static-desktop-catalog",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Static desktop catalog builds; visual review stays pending. /tmp/lapis-m91-desktop-static.log."
    },
    {
      "name": "ordinary-bundle-audit",
      "command": "pnpm exec tauri build --debug --bundles app; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Ordinary ARM64 Lapis Notes Preview.app, 356 renderer JS files and zero automation/trust markers; no bundled Node/Deno runtime. Signing deferred. /tmp/lapis-m91-ordinary-{build,audit}.log."
    },
    {
      "name": "generated-progress-format",
      "command": "pnpm format:check; pnpm exec prettier --write MIGRATION.md; pnpm check:progress; pnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "First formatter run reports one generated-document formatting issue; formatting it retains the same progress projection and all checks pass."
    },
    {
      "name": "final-check-and-governance",
      "command": "pnpm check; pnpm spec:check; pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "note": "Specification validation, strict types, all-target clippy, Prettier/Rust formatting, mdBook, spec-first and unchanged-gate progress all pass. /tmp/lapis-m91-final-{check,spec,progress}.log."
    }
  ],
  "versions": {
    "pnpm": "10.34.5",
    "node": "26.9.0"
  },
  "contractReview": "Public App options isolate ephemeral acceptance trust from ordinary startup. Production reuses public Workspace Plugins/Settings components and the source-owned signed distribution pipeline; no copied screen, private API mutation, runtime shim, dynamic native binary installer or extra native permissions. Source API requirements LN-PLUG-116\u2013121 are supported by actual native acceptance.",
  "milestoneReview": "M9 and M9.1 satisfy their original gates. Real signed installation, public Plugins/Settings flows, loaded replacement retirement, exact retained data, restart recovery, teardown and bundled-ID/capability rejection pass in the packaged app. Full native, catalog, source/Web and ordinary-bundle audits pass. Continue M10.1\u2013M10.4 automatically. Application signing/publication and M7.3 ordinary popup admission remain separate deferred gates.",
  "source": {
    "repository": "lapis-notes",
    "revision": "2b7ee095babd04f72639be7b6140c0cb64eb1512",
    "archiveReceipt": ".local/m91/core-refresh.json",
    "webImage": "sha256:dcf54d1bae226076d75efbd90fc991f990e0ac7bd88949689978c93b6b7d0a5e",
    "archives": [
      {
        "name": "@lapis-notes/ui",
        "version": "0.1.3",
        "sha256": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9"
      },
      {
        "name": "@lapis-notes/api",
        "version": "0.1.4",
        "sha256": "14374ea2dc5d82ec34fd63b0937a9327e416af6c4e5d76918c1f209884950cf2"
      },
      {
        "name": "@lapis-notes/language-service",
        "version": "0.1.1",
        "sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65"
      },
      {
        "name": "@lapis-notes/file-explorer",
        "version": "0.1.2",
        "sha256": "be3815ebf920370dfb113be69862117670333ec755f179b322f718f7fb44c481"
      },
      {
        "name": "@lapis-notes/workspace",
        "version": "0.2.1",
        "sha256": "750899d2c415ca3954edd760d1dac6705c5548bde532ba5af1bebac71c196ef5"
      }
    ]
  }
}
```
