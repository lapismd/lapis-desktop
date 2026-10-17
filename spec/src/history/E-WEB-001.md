# Web desktop-service retirement

```json
{
  "id": "E-WEB-001",
  "tasks": ["M8", "M8.2"],
  "requirements": ["LD-MIG-002", "LD-PLUG-002"],
  "revision": "enclosing-change",
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-WEB-001.md",
    "spec/src/history/index.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M8.2": "Web exposes no AI/Terminal connection or activation paths, skips existing installations and preserves saved data and unrelated behavior."
  },
  "runs": [
    {
      "name": "legacy-activation-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/plugin-manager.test.ts -t \"host restriction rejects\"",
      "result": "fail",
      "failures": 2,
      "note": "Older web-compatible ai and terminal manifests reach evaluation."
    },
    {
      "name": "legacy-activation-after",
      "command": "Same exact restriction target",
      "result": "pass",
      "failures": 0,
      "passed": 2
    },
    {
      "name": "source-affected",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/plugin-manager.test.ts src/lib/__tests__/plugin-distribution-manager.test.ts src/lib/__tests__/plugin-distribution.test.ts",
      "result": "pass",
      "failures": 0,
      "passed": 87
    },
    {
      "name": "web-policy-before",
      "command": "pnpm --filter @lapis-notes/web exec vitest run src/desktop-plugin-policy.test.ts",
      "result": "fail",
      "failures": 1,
      "passed": 2,
      "note": "Web startup lacks host restrictions and still registers service bridges."
    },
    {
      "name": "web-policy-after",
      "command": "Same exact Web policy target",
      "result": "pass",
      "failures": 0,
      "passed": 3
    },
    {
      "name": "source-check",
      "command": "TURBO_CONCURRENCY=1 pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "18/18 tasks, Svelte strict diagnostics and E2E TypeScript pass."
    },
    {
      "name": "source-unit",
      "command": "TURBO_CONCURRENCY=1 pnpm test --task-args --maxWorkers=1",
      "result": "pass",
      "failures": 0,
      "passed": 1702,
      "note": "Unique unit cases across 18 tasks; one existing Deno integration skip. 1828 executions include repeated 98/28 build prerequisites."
    },
    {
      "name": "source-build",
      "command": "TURBO_CONCURRENCY=1 pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "10/10 tasks and fresh production Web output."
    },
    {
      "name": "web-runner-before",
      "command": "CI=1 pnpm --filter @lapis-notes/web exec playwright test -c playwright.config.ts desktop-features.spec.ts",
      "result": "fail",
      "failures": 1,
      "note": "No product test ran: stale package-local CLI shim points to Playwright 1.62.1 while imports and lock are 1.61.1. Root public CLI is pinned correctly; no node_modules edit or assertion change."
    },
    {
      "name": "cold-web-exact",
      "command": "CI=1 pnpm exec playwright test -c packages/web/playwright.config.ts packages/web/e2e/desktop-features.spec.ts",
      "result": "pass",
      "failures": 0,
      "passed": 1,
      "note": "Correct locked 1.61.1 runner, fresh preview/browser, preserved installed records, data, choices and layout, no connection Settings or retired sockets; only dedicated tokens removed."
    },
    {
      "name": "source-spec",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "passed": 38,
      "note": "Six lanes and App ownership audit; final doc-only rerun passes."
    },
    {
      "name": "source-catalog",
      "command": "pnpm test:storybook --force",
      "result": "pass",
      "failures": 0,
      "passed": 259,
      "note": "Four shards 92/66/46/55; 32 affected Plugins/snapshot cases pass after Docs owner repair."
    },
    {
      "name": "docs-registration-before",
      "command": "Static index owner assertion",
      "result": "fail",
      "failures": 1,
      "note": "Separate file duplicated Workspace/Plugins title; fixed in existing story owner."
    },
    {
      "name": "docs-registration-after",
      "command": "pnpm build-storybook; static owner assertion; rendered Docs review",
      "result": "pass",
      "failures": 0,
      "note": "172 chapters; public Show Code and isolated 700px iframe inspected; no baseline changes."
    },
    {
      "name": "server-registry-before",
      "command": "CI=1 pnpm exec playwright test -c packages/web/playwright.config.ts",
      "result": "fail",
      "passed": 12,
      "failures": 1,
      "note": "Registry Design Core lacks renderer.setCloseGuard; use already qualified migration public archive, no fallback."
    },
    {
      "name": "cold-web-all",
      "command": "CI=1 LAPIS_SERVER_E2E_IMAGE=lapis-server:desktop-m82-local pnpm exec playwright test -c packages/web/playwright.config.ts",
      "result": "pass",
      "passed": 13,
      "failures": 0,
      "note": "Exact server case also passes independently; fresh Docker cohort image sha256:f49afdcc60d723a87118e074159a46ddd6297e8a6ef32dbb0a1660ee0be4c46e."
    },
    {
      "name": "docker-restoration",
      "command": "docker desktop stop --timeout 45; restore only MemoryMiB in latest settings",
      "result": "pass",
      "failures": 0,
      "note": "Original stopped state restored; 8192 to 3072 MiB verified. Status reports Docker is not running."
    },
    {
      "name": "consumer-archive-refresh",
      "command": "node .local/m82/refresh-core.mjs; pnpm local:install",
      "result": "pass",
      "failures": 0,
      "note": "Five Notes packages from committed source; other nine routes retained; hashes verified across all 14 routes; tracked manifests/lock unchanged."
    },
    {
      "name": "consumer-catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "passed": 84,
      "note": "21 cases in each desktop/narrow and light/dark run; cold server after archive install. An early run overlapped install and was terminated, not counted."
    },
    {
      "name": "consumer-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Zero errors and zero warnings."
    },
    {
      "name": "consumer-unit",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "passed": 81
    },
    {
      "name": "consumer-native",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "passed": 100,
      "note": "Fresh e2e packaged WebView: 2 startup, 27 WebDriver, 69 lifecycle and 2 HTTP cases. Isolated profiles; application PATH has no Node/Deno. Five Terminal lifecycle cases pass."
    }
  ],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5"
  },
  "contractReview": "Shared API owns generic host restrictions; Web owns retired identities. Preserve plugin data and unrelated secrets; Deno desktop remains frozen.",
  "milestoneReview": "M8.2 meets its unchanged gate: Web rejects AI/Terminal without connection UI or service requests and preserves installed data/layout. M8 remains In progress for M8.3. Source and consumer evidence are separate; Deno remains frozen. Publication, app signing and visual baselines remain deferred.",
  "sourceRevision": "fa4816ed9776527e0ebc977aadab6e4fe365a47f",
  "archives": [
    {
      "name": "@lapis-notes/ui",
      "version": "0.1.3",
      "tarball": "/Users/stevejuma/code/lapismd/lapis-desktop/.local/m82/packages/lapis-notes-ui-0.1.3.tgz",
      "sha256": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "fa4816ed9776527e0ebc977aadab6e4fe365a47f",
        "packageDirectory": "packages/ui"
      }
    },
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "tarball": "/Users/stevejuma/code/lapismd/lapis-desktop/.local/m82/packages/lapis-notes-api-0.1.4.tgz",
      "sha256": "a11006a361a8f6d54fa56791098a30c40c931ad6fbd3e637b250d3618b53791b",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "fa4816ed9776527e0ebc977aadab6e4fe365a47f",
        "packageDirectory": "packages/api"
      }
    },
    {
      "name": "@lapis-notes/language-service",
      "version": "0.1.1",
      "tarball": "/Users/stevejuma/code/lapismd/lapis-desktop/.local/m82/packages/lapis-notes-language-service-0.1.1.tgz",
      "sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "fa4816ed9776527e0ebc977aadab6e4fe365a47f",
        "packageDirectory": "packages/language-service"
      }
    },
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.1.2",
      "tarball": "/Users/stevejuma/code/lapismd/lapis-desktop/.local/m82/packages/lapis-notes-file-explorer-0.1.2.tgz",
      "sha256": "be3815ebf920370dfb113be69862117670333ec755f179b322f718f7fb44c481",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "fa4816ed9776527e0ebc977aadab6e4fe365a47f",
        "packageDirectory": "packages/file-explorer"
      }
    },
    {
      "name": "@lapis-notes/workspace",
      "version": "0.2.1",
      "tarball": "/Users/stevejuma/code/lapismd/lapis-desktop/.local/m82/packages/lapis-notes-workspace-0.2.1.tgz",
      "sha256": "6901e9a8869fda52035a9f97c7a0c3c6cf8c9c1a1e9d7629062d55a539425d15",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "fa4816ed9776527e0ebc977aadab6e4fe365a47f",
        "packageDirectory": "packages/workspace"
      }
    }
  ],
  "dependencyCohort": {
    "designCoreSourceReceipt": "a65dcf6d5b40199aadbaa22f4934215202f07f55",
    "sha256": "0d31cc17e3be99bff4eea941de0ab828aabc5f94a12dddcf5a24ec6d3629a4fd",
    "note": "Unchanged public archive; explicit temporary validation prerequisite, publication deferred to M11."
  }
}
```
