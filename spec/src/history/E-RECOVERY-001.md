# E-RECOVERY-001: Startup recovery and session Safe Mode

```json
{
  "id": "E-RECOVERY-001",
  "tasks": ["M4"],
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-007",
    "LD-MIG-002",
    "LD-REC-001",
    "LD-REC-002",
    "LD-SESSION-003",
    "LD-LIFE-001",
    "LD-LIFE-005"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "platform": "macOS ARM64"
  },
  "files": [
    "scripts/desktop-acceptance.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/notes/notes-recovery.svelte.ts",
    "src/lib/notes/notes-startup.ts",
    "src/lib/notes/startup-recovery.ts",
    "src/styles/notes-workspace.css",
    "tests/desktop/startup-recovery.test.mjs",
    "tests/renderer/startup-recovery.test.mjs",
    "MIGRATION.md",
    "spec/src/history/E-RECOVERY-001.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md"
  ],
  "result": "pending",
  "completedGates": {},
  "remaining": [
    "Qualify diagnostic copy with M7 native clipboard integration.",
    "Run session-deferred Notes/Design Core/web/Storybook and Desktop full suites after M7 implementation and audit every original gate."
  ],
  "runs": [
    {
      "name": "native-missing-recovery-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/startup-recovery-before node --test --test-concurrency=1 tests/desktop/startup-recovery.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "The old bundle lacks diagnostic-copy and optional-plugin-recovery actions. No startup delay, mock App or injected product failure is used."
    },
    {
      "name": "recovery-storage-and-diagnostics",
      "command": "node --test tests/renderer/startup-recovery.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3
      },
      "note": "Vault-scoped session state, corrupt/inactive/unavailable storage and WebKit message-plus-stack diagnostics."
    },
    {
      "name": "source-presentation",
      "command": "pnpm --filter @lapis-notes/workspace exec vitest run src/lib/desktop/desktop-recovery.test.ts src/lib/desktop-presentation.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 6
      },
      "note": "One exact missing-export before failure. Initial wrong public import caused two suite startup failures and one type diagnostic; corrected to the existing /shadcn/button export."
    },
    {
      "name": "source-storybook-accessibility-before",
      "command": "pnpm exec vitest run --project storybook stories/workspace/DesktopRecoveryBanner.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Inherited aside role=status violates aria-allowed-role. Fix the shared status container, without modifying the frozen Deno host or weakening axe."
    },
    {
      "name": "source-storybook-accessibility-after",
      "command": "pnpm exec vitest run --project storybook stories/workspace/DesktopRecoveryBanner.stories.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Fresh process verifies all three existing actions and accessibility after the semantic fix. Story stays visual-pending; no baseline work."
    },
    {
      "name": "source-check-build-and-specification",
      "command": "pnpm --filter @lapis-notes/workspace check; pnpm --filter @lapis-notes/workspace build; pnpm check:app-ownership; pnpm spec:first; pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0,
        "chapters": 172,
        "requirements": 1458
      },
      "note": "Owning source logs/record distinguish independent checks, normal prepack/publint and failed formatting/import attempts. Full product suites are deferred for this session."
    },
    {
      "name": "desktop-public-types-and-boundaries",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      }
    },
    {
      "name": "native-fixture-and-diagnostic-attempts",
      "command": "node --test --test-concurrency=1 tests/desktop/startup-recovery.test.mjs; node --test --test-concurrency=1 --test-name-pattern='session Safe Mode' tests/desktop/startup-recovery.test.mjs",
      "result": "fail",
      "failures": 11,
      "attempts": [
        {
          "log": "native-after.log",
          "failed": 1
        },
        {
          "log": "native-after-corrected.log",
          "failed": 1
        },
        {
          "log": "native-diagnostic.log",
          "failed": 1
        },
        {
          "log": "native-state.log",
          "failed": 1
        },
        {
          "log": "native-busy.log",
          "failed": 1
        },
        {
          "log": "native-busy2.log",
          "failed": 1
        },
        {
          "log": "native-errors.log",
          "failed": 1
        },
        {
          "log": "native-handlers.log",
          "failed": 1
        },
        {
          "log": "native-domclick.log",
          "failed": 1
        },
        {
          "log": "native-keyboard.log",
          "failed": 1
        },
        {
          "log": "native-dom-generation.log",
          "failed": 1
        }
      ],
      "note": "Eleven independent invocations each failed one fixture/diagnostic case; this is not eleven product regressions. First fix the missing existsSync import. The embedded driver allocates a fresh ID on every lookup, so ID inequality sent the second action before session replacement. Wait on a marker on the actual old DOM node instead. Diagnostic DOM activation exposed that race; final acceptance retains original button clicks. An attempted Tab-focus diagnostic cannot use synthetic key events for browser default focus navigation. A final wildcard text locator missed an existing rebuild status; read the status region text with the same expected string. No product hooks, assertion removals, timeout increases or driver/package edits."
    },
    {
      "name": "safe-mode-exact-component-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/startup-recovery-rebuild node --test --test-concurrency=1 --test-name-pattern='session Safe Mode' tests/desktop/startup-recovery.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Original button clicks prove both restrictions, unchanged canonical bytes, rebuilds, real guarded reload, normal restart and explicit reset. DOM-generation and reload markers are test-owned observations, absent from production."
    },
    {
      "name": "bookkeeping-before-snapshot",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "The fail-closed change audit saw unsnapshotted evidence as absent. Snapshot with ordinary jj status, then rerun; no validator change."
    },
    {
      "name": "specification-after-snapshot",
      "command": "pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanes": 4,
        "tasks": 14,
        "evidenceRecords": 25
      }
    },
    {
      "name": "fresh-native-build",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Fresh renderer and debug Acceptance.app bundle consume all twelve verified archives. Ordinary review app/profile and Documents/tauri-vault remain untouched."
    },
    {
      "name": "verified-archive-install",
      "command": "node scripts/local-archives.mjs .local/m4-startup-recovery/desktop.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 12,
        "routes": 12
      },
      "note": "Portable tracked registry manifests and lockfile preserved."
    },
    {
      "name": "exact-native-recovery-final",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/startup-recovery-final node --test --test-concurrency=1 tests/desktop/startup-recovery.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      },
      "note": "Both original cases pass with full assertions, original click actions and unchanged deadlines. Real failed-phase/full-stack details, repaired retry, one workspace owner, unchanged configuration/layout, rebuilds and guarded reload/reset are observed."
    },
    {
      "name": "related-native-startup-and-lifecycle",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/startup-recovery-related node --test --test-concurrency=1 tests/desktop/startup-progress.test.mjs tests/desktop/notes-lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 8
      },
      "note": "Cold close/Quit, retained failed notes/layout, guarded reload, missing-root recovery, repeated switch/database disposal, broken-layout return and real startup phase/progress failures pass. Zero skips or timeout/assertion changes."
    }
  ],
  "contractReview": "Restore original inventory LN-DENO-052/053/054 without changing the frozen host. Shared Workspace presents the existing banner and startup UI; Tauri owns a fresh guarded session retry, selected-vault sessionStorage and explicit layout reset. AppSafeModeState governs plugin and layout intake. Diagnostics preserve error messages omitted from WebKit stacks. No new native authority, app signing, package publication, custom replacement screen or baseline change.",
  "milestoneReview": "M4 remains In progress while the end-of-M7 full qualification and diagnostic clipboard delivery remain pending. M5\u2013M7 retain their original gates. This is targeted implementation/acceptance evidence under the session-only test deferral, not a completed aggregate gate.",
  "archives": [
    {
      "name": "@lapis-notes/ui",
      "sha256": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "03727618b0b1da7defcc1d1d2e33765f50690e24",
        "packageDirectory": "packages/ui"
      }
    },
    {
      "name": "@lapis-notes/api",
      "sha256": "2b61dd8a8e067bd0ba8c17379022cc0ac7659a4b370e3c1ec1a90d489f5b9fee",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "03727618b0b1da7defcc1d1d2e33765f50690e24",
        "packageDirectory": "packages/api"
      }
    },
    {
      "name": "@lapis-notes/language-service",
      "sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "03727618b0b1da7defcc1d1d2e33765f50690e24",
        "packageDirectory": "packages/language-service"
      }
    },
    {
      "name": "@lapis-notes/file-explorer",
      "sha256": "7d383c0115255e69316dc3d6940a7be2be6312d2376e41a4bbaa433ad285a053",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "03727618b0b1da7defcc1d1d2e33765f50690e24",
        "packageDirectory": "packages/file-explorer"
      }
    },
    {
      "name": "@lapis-notes/workspace",
      "sha256": "1f506da07bc793466ca9f3b19ea0f8705492a59e87d583e30031f43fa858a7bd",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "03727618b0b1da7defcc1d1d2e33765f50690e24",
        "packageDirectory": "packages/workspace"
      }
    },
    {
      "name": "@lapis-notes/source-editor",
      "sha256": "b02865a1f53fbfbab77d146449b9b358785a7f6d2aec074cede7c1883570ddff",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-plugins.git",
        "revision": "265680b6ba3f6bdd4fc73e3bc6562d754b2bda42",
        "packageDirectory": "packages/source-editor"
      }
    },
    {
      "name": "@lapis-notes/markdown",
      "sha256": "1fd2f7d7dbd33ec4a7627ba4ff9ecf5eed4d888d22c46fc21b8d3ac4e21cb96e",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-plugins.git",
        "revision": "265680b6ba3f6bdd4fc73e3bc6562d754b2bda42",
        "packageDirectory": "packages/markdown"
      }
    },
    {
      "name": "@lapismd/mira",
      "sha256": "ba44e98bc0c61490e48f7a7cf4ec24e819963d506145cf94792a83e68e6d39d6",
      "source": {
        "repository": "git+https://github.com/lapismd/mira-mde.git",
        "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
        "packageDirectory": "packages/mira"
      }
    },
    {
      "name": "@lapismd/mira-editor",
      "sha256": "850272c678a8e2e5106290189190eade8edab19be444235053f0945eb8ec41c3",
      "source": {
        "repository": "git+https://github.com/lapismd/mira-mde.git",
        "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
        "packageDirectory": "packages/mira-editor"
      }
    },
    {
      "name": "@lapismd/mira-plugin-ai",
      "sha256": "efe9d5b774a0545e3119818e58987a34e6efdd488c45018c6418214740118823",
      "source": {
        "repository": "git+https://github.com/lapismd/mira-mde.git",
        "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
        "packageDirectory": "packages/mira-plugin-ai"
      }
    },
    {
      "name": "@lapismd/mira-plugin-mermaid",
      "sha256": "0a8e215a3212d3e5075688a07b5da96e5a4ef01fa5fe2937c145da7882bf868e",
      "source": {
        "repository": "git+https://github.com/lapismd/mira-mde.git",
        "revision": "bdb5ae1be4ac902d38adb71ea1822797d9409d6b",
        "packageDirectory": "packages/mira-plugin-mermaid"
      }
    },
    {
      "name": "@lapismd/design-core",
      "sha256": "bc34622de80df37fb34b0e81aa5741dca3e762ff1fd0481da5e2779b2542be2e",
      "source": {
        "repository": "git+https://github.com/lapismd/design-core.git",
        "revision": "74a94ed15dfe8ef2b72213489e0f0297a0962d21",
        "packageDirectory": "."
      }
    }
  ]
}
```
