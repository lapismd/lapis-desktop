# E-WRITERS-001: Retained plugin writers and admitted creation

Targeted slice evidence; final M4–M7 qualification remains pending.

```json
{
  "id": "E-WRITERS-001",
  "tasks": ["M4"],
  "requirements": [
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-007",
    "LD-GOV-008",
    "LD-LIFE-001",
    "LD-LIFE-004",
    "LD-LIFE-007",
    "LD-MIG-002"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "files": [
    "PLAN.md",
    "scripts/desktop-acceptance.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "src/components/views/NotesWorkspace.svelte",
    "tests/desktop/plugin-persistence.test.mjs",
    "spec/src/current/writer-audit.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-WRITERS-001.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "MIGRATION.md"
  ],
  "result": "pending",
  "remaining": [
    "Run deferred full Notes, Design Core, web/Storybook and Desktop qualification after M7 implementation.",
    "Restore original M4 startup recovery and Safe Mode requirements before aggregate qualification.",
    "Complete the original M4 aggregate cold lifecycle gate before marking Done."
  ],
  "completedGates": {},
  "runs": [
    {
      "name": "final-source-recovery-edges-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/plugin-state-persistence.test.ts -t 'initial core configuration|primitive core configuration'",
      "result": "fail",
      "failures": 2,
      "note": "Corrected leading-slash fixture reproduces missing runtime callback and accepted primitive disk state. Earlier CLI/fixture attempts remain separately recorded in owning source evidence."
    },
    {
      "name": "retained-properties-draft-before",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/frontmatter-persistence.test.ts -t 'recovery projection rejects'",
      "result": "fail",
      "failures": 1,
      "note": "After a rejected disk reset, Keep incorrectly wrote external text instead of the original local draft. The exact case passes after delayed reset acknowledgement."
    },
    {
      "name": "native-core-and-shell-before",
      "command": "node --test --test-concurrency=1 tests/desktop/plugin-persistence.test.mjs (old Acceptance bundle)",
      "result": "fail",
      "failures": 2,
      "note": "Old bundle lost the core disabled choice and overwrote external shell bytes. Earlier wrong IDs and selectors are fixture failures, retained in logs. The corrected Explorer-create baseline independently passed one case; no native creation regression is claimed."
    },
    {
      "name": "source-focused-after",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/file-editing-sessions.test.ts src/lib/__tests__/file-text-persistence.test.ts src/lib/__tests__/frontmatter-persistence.test.ts src/lib/__tests__/metadata-persistence.test.ts src/lib/__tests__/plugin-state-persistence.test.ts src/lib/__tests__/pending-file-operations.test.ts src/lib/__tests__/pending-vault-operations.test.ts src/lib/__tests__/app-state-persistence.test.ts src/lib/__tests__/app-shell-plugin-persistence.test.ts src/lib/__tests__/workspace-state-persistence.test.ts",
      "result": "pass",
      "failures": 0,
      "counts": {
        "files": 10,
        "passed": 71
      }
    },
    {
      "name": "source-manager-after",
      "command": "pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/plugin-manager.test.ts -t 'config|core plugin|prun'",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 14,
        "deselected": 46
      }
    },
    {
      "name": "source-public-checks",
      "command": "Notes API check/build, Explorer check/build, Workspace build, pnpm check:app-ownership, pnpm spec:first, pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0,
        "specificationChapters": 172,
        "requirements": 1457
      },
      "note": "These are distinct source commands, with normal prepack/publint/type-contract builds. Full product lanes are session-deferred, not claimed."
    },
    {
      "name": "design-core-transitions",
      "command": "Design Core focused App Shell transition/controller cases; public type checks and pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 17
      },
      "note": "Source change 74a94ed15dfe8ef2b72213489e0f0297a0962d21; two exact before failures. Full product lanes deferred in that owning record."
    },
    {
      "name": "archive-install",
      "command": "node scripts/local-archives.mjs .local/m4-plugin-writers/desktop-qualified.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "archives": 12,
        "routes": 12
      },
      "note": "Tracked dependency manifests and registry lockfile preserved. An earlier source installation correctly rejected old plugin artifacts requiring Design Core ^0.3.2; rebuilding owning plugin artifacts with their existing ^0.4.0 source ranges resolved that mismatch without installer changes."
    },
    {
      "name": "desktop-types-and-boundaries",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "counts": {
        "svelteErrors": 0,
        "svelteWarnings": 0
      }
    },
    {
      "name": "fresh-native-build",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererModules": 6204
      }
    },
    {
      "name": "cold-native-plugins",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/plugin-writers-qualified node --test --test-concurrency=1 tests/desktop/plugin-persistence.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3
      },
      "note": "Actual isolated WebViews, native close, physical files and cold restoration. All three pass with zero skips, failed cases or product instrumentation changes."
    },
    {
      "name": "cold-native-related-controls",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/writer-controls-qualified node --test --test-concurrency=1 tests/desktop/properties-persistence.test.mjs tests/desktop/settings-persistence.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 8
      },
      "note": "All original focused-control, external conflict, permission recovery, metadata-type and cold hotkey cases pass after the document-wide focused-control change. Zero skips."
    },
    {
      "name": "desktop-specification-and-progress",
      "command": "pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "specificationLanes": 4,
        "milestones": 14,
        "evidenceRecords": 24
      },
      "note": "Canonical validation, strict Rust formatting, mdBook and mapped spec-first pass. Pending aggregate status is intentional while session-deferred suites and startup recovery remain open."
    }
  ],
  "contractReview": "Every enabled state writer retains ownership through conditional persistence and explicit recovery. Native teardown finishes portalled focused controls, awaits App Shell transitions and plugin writes, then drains admitted file operations before the global guard. The public API and Design Core fixes are source-owned and consumed as verified local archives. No Deno source, profile policy, signing, publishing, baseline, permission or gate changes.",
  "milestoneReview": "The user resumed M4\u2013M7 with targeted per-slice testing and full suites deferred until M7 implementation completes. M4 remains In progress: this closes the plugin/creation writer component audit, not the original aggregate gate. Startup recovery, Safe Mode and every remaining M5\u2013M7 gate stay in scope.",
  "archives": [
    {
      "name": "@lapis-notes/ui",
      "sha256": "a45b4d992fc81606add4a59cc09681f5f7db0e0f5d0224dc2e23533f199504e9",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "ecdcf63b5308aa5e0be61a29cca658862c60f69f",
        "packageDirectory": "packages/ui"
      }
    },
    {
      "name": "@lapis-notes/api",
      "sha256": "2b61dd8a8e067bd0ba8c17379022cc0ac7659a4b370e3c1ec1a90d489f5b9fee",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "ecdcf63b5308aa5e0be61a29cca658862c60f69f",
        "packageDirectory": "packages/api"
      }
    },
    {
      "name": "@lapis-notes/language-service",
      "sha256": "ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "ecdcf63b5308aa5e0be61a29cca658862c60f69f",
        "packageDirectory": "packages/language-service"
      }
    },
    {
      "name": "@lapis-notes/file-explorer",
      "sha256": "7d383c0115255e69316dc3d6940a7be2be6312d2376e41a4bbaa433ad285a053",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "ecdcf63b5308aa5e0be61a29cca658862c60f69f",
        "packageDirectory": "packages/file-explorer"
      }
    },
    {
      "name": "@lapis-notes/workspace",
      "sha256": "c4e9cc3e4d73edf3a76d93a297653781c471cb2dc6646d5d37d251899380151f",
      "source": {
        "repository": "git+https://github.com/lapismd/lapis-notes.git",
        "revision": "ecdcf63b5308aa5e0be61a29cca658862c60f69f",
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
