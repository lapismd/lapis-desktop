# E-HOST-001: shared host compatibility

M1 passed using committed source-owned local pnpm archives. Publication remains
deferred. The Notes changes are isolated in lapis-notes-desktop-migration.

```json
{
  "id": "E-HOST-001",
  "tasks": ["M1"],
  "requirements": ["LD-MIG-002", "LD-GOV-006", "LD-HOST-001"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "svelte": "5.56.10",
    "target": "aarch64-apple-darwin"
  },
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    "scripts/local-archives.mjs",
    "tests/governance/local-archives.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/governance.md",
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-HOST-001.md",
    "scripts/pack-local-core.mjs",
    "README.md",
    "src/shell-startup.ts",
    "tests/renderer/shell-startup.test.mjs",
    "tests/desktop/shell.spec.mjs",
    "spec/src/current/migration.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {
    "M1": "Upstream regressions prove the shared `.lapis` default across every affected package and host. Build and pack verified shared-package changes locally, then validate their public archives in the Tauri app and affected consumers."
  },
  "runs": [
    {
      "name": "local-archive-integrity-and-recovery",
      "command": "node --test tests/governance/local-archives.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3,
        "failed": 0
      },
      "note": "Rejects tampering/identity/revision failures, redirects transitive dependencies without changing peer ranges, rejects incompatible archives, and restores dependency files after failed pnpm installation."
    },
    {
      "name": "initial-host-requirement-table",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 5,
      "note": "A blank line separated the new requirement row from its canonical table. The validator rejected the malformed row and its unresolved references."
    },
    {
      "name": "repaired-host-requirement-table",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "validators": 6,
        "chapters": 13,
        "requirements": 15
      }
    },
    {
      "name": "before-shared-api-consumer",
      "command": "node --test tests/renderer/shell-startup.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 1,
        "failed": 1
      },
      "note": "Before integration, native startup exposed no shared application-state default or runtime classification."
    },
    {
      "name": "host-spec-first-initial",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The changed M1 ledger needed its mapped migration chapter updated in this implementation change, in addition to the preceding workflow-plan commit."
    },
    {
      "name": "initial-core-pack-flag",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --already-built",
      "result": "fail",
      "failures": 1,
      "note": "pnpm pack does not accept --ignore-scripts; corrected to --config.ignore-scripts=true."
    },
    {
      "name": "initial-archive-graph-install",
      "command": "pnpm local:install",
      "result": "fail",
      "failures": 1,
      "note": "Post-install validation found missing root UI/framework peer packages. Explicitly declared all five source-owned archives; peer ranges remain registry semver."
    },
    {
      "name": "actual-initial-core-archives",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --already-built && pnpm local:install",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 5
      },
      "note": "Source snapshot 2a7282bd2479b9609e654aea12bad8334ebfec01; verified SHA256 and package identity. Installer restored tracked manifests/lockfile."
    },
    {
      "name": "database-barrel-renderer-loader",
      "command": "node --test tests/renderer/shell-startup.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 0,
        "failed": 1
      },
      "note": "Database barrel uses bundler-oriented extensionless imports. A diagnostic tsx run passed 2 tests, but the production build also pulled optional Turso/model WASM assets. Fixed upstream by a service-independent public runtime entrypoint; final plain-Node archive target pending."
    },
    {
      "name": "initial-host-check-format",
      "command": "pnpm build && pnpm check",
      "result": "fail",
      "failures": 3,
      "note": "Production build, spec validation, Svelte and Clippy passed. Formatter reported three files; formatting repaired."
    },
    {
      "name": "host-governance-tests",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 13,
        "failed": 0
      }
    },
    {
      "name": "independent-runtime-archives",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --already-built && pnpm local:install",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 5
      },
      "note": "Source snapshot fd218f6e359f27242eede51b4383caaaf1d74e40. Checksums and installed identities recorded in the ignored manifest/report. Final committed-source binding follows qualification."
    },
    {
      "name": "public-archive-renderer-regression",
      "command": "node --test tests/renderer/shell-startup.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2,
        "failed": 0
      },
      "note": "Plain Node loads the public path/runtime exports; no loader shim is needed."
    },
    {
      "name": "independent-runtime-renderer-build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererJavaScriptFiles": 1,
        "optionalWasmAssets": 0
      },
      "note": "The runtime leaf avoids loading Turso/model implementations during shell startup."
    },
    {
      "name": "actual-native-shared-default",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nativeTestsPassed": 5,
        "coldLifecycleTestsPassed": 2,
        "axeViolations": 0
      },
      "note": "Actual macOS WebView verifies .lapis, tauri-desktop and desktop classification from the public API archives. Two isolated cold processes close/relaunch without Deno."
    },
    {
      "name": "ordinary-arm64-bundle",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "bundles": 1,
        "automationMarkers": 0
      },
      "note": "27.22 MiB ARM64 application, normal renderer, no bundled Node/Deno. Signing remains deferred."
    },
    {
      "name": "generated-tracker-format",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Generated MIGRATION.md needed formatting. The semantic progress checker tolerates Markdown alignment; formatted the generated document."
    },
    {
      "name": "desktop-check-repaired",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Specification validation, Svelte type checks, Clippy and formatting pass."
    },
    {
      "name": "desktop-full-tests",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodePassed": 15,
        "rustPassed": 2,
        "failed": 0
      }
    },
    {
      "name": "final-committed-source-archive-binding",
      "command": "pnpm local:pack ../lapis-notes-desktop-migration --already-built && pnpm local:install",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 5
      },
      "note": "All five packed and installed source revisions match verified source commit 1e6458922b486c07f36a5bc7d85d020b5805cd49. SHA256 identities are retained in this record; tracked registry dependency files were preserved."
    },
    {
      "name": "final-committed-source-native-qualification",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nativeTestsPassed": 5,
        "coldLifecycleTestsPassed": 2,
        "axeViolations": 0
      },
      "note": "Actual macOS WebView and two isolated cold processes consume the final committed-source archives. Native header is unchanged; the prior physical drag qualification remains applicable."
    },
    {
      "name": "final-committed-source-ordinary-bundle",
      "command": "pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "counts": {
        "bundles": 1,
        "automationMarkers": 0,
        "optionalWasmAssets": 0
      },
      "note": "27.22 MiB ARM64 ordinary application; no bundled Node/Deno. Application signing remains deferred."
    },
    {
      "name": "final-committed-source-desktop-gates",
      "command": "node --test tests/renderer/shell-startup.test.mjs; pnpm check; pnpm test; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererPassed": 2,
        "nodePassed": 15,
        "rustPassed": 2,
        "specLanesPassed": 4,
        "svelteErrors": 0,
        "svelteWarnings": 0
      },
      "note": "All final checks used the committed-source archive installation. Svelte, Clippy, formatting, mdBook, progress/source audits and spec-first pass."
    }
  ],
  "contractReview": "M1 consumes source-owned package archives through portable registry metadata. The shared .lapis default applies to all hosts, and native Tauri sessions require an explicit provider upstream.",
  "milestoneReview": "M1 Done: the original revised gate is satisfied by source regressions, complete affected-host qualification, verified public archives and actual native Tauri acceptance. M2 native vault access is next; no Notes workspace or editing is claimed.",
  "sourceQualification": {
    "repository": "lapis-notes",
    "workspace": "lapis-notes-desktop-migration",
    "revision": "1e6458922b486c07f36a5bc7d85d020b5805cd49",
    "evidence": "spec/records/2026-10-16-tauri-shared-state.md",
    "counts": {
      "focusedStateRuntimePassed": 14,
      "unitPassed": 1555,
      "unitSkipped": 1,
      "buildTasksPassed": 10,
      "checkTasksPassed": 18,
      "storybookPassed": 249,
      "webBrowserPassed": 12,
      "serverBrowserPassed": 1,
      "legacyPackagedSmokePassed": 2
    },
    "note": "Source-owned full qualification includes public packed types, all affected hosts, interaction and axe acceptance. No package was published."
  },
  "archives": [
    {
      "name": "@lapis-notes/ui",
      "version": "0.1.3",
      "sha256": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9"
    },
    {
      "name": "@lapis-notes/api",
      "version": "0.1.4",
      "sha256": "001e27d2e75896f959b8f89cc235aeb310da66d5efec3f1c0f37adea4a423447"
    },
    {
      "name": "@lapis-notes/language-service",
      "version": "0.1.1",
      "sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65"
    },
    {
      "name": "@lapis-notes/file-explorer",
      "version": "0.1.2",
      "sha256": "79d46a57325cfa601633c776bc128759020b962426c7f43ff35f67370c77e470"
    },
    {
      "name": "@lapis-notes/workspace",
      "version": "0.2.1",
      "sha256": "7e968a3173149c547e1195ea48b9a82ba9b396eae4b18166c53c009681453cc7"
    }
  ]
}
```
