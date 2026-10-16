# End-of-M7 qualification

All session-deferred source lanes are complete. This record retains earlier
failed/interrupted attempts and their resolutions. E-QUALIFICATION-002 records
the final native, ordinary-bundle and original M4–M7 gates.

```json
{
  "id": "E-QUALIFICATION-001",
  "tasks": ["M4", "M5", "M6", "M7"],
  "requirements": ["LD-GOV-007", "LD-GOV-008", "LD-MIG-002"],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "platform": "macOS ARM64"
  },
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/writer-audit.md",
    "spec/src/history/index.md",
    "spec/src/history/E-QUALIFICATION-001.md"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "notes-complete-foundation",
      "command": "pnpm check --filter=!@lapis-notes/desktop-deno --force; pnpm test --filter=!@lapis-notes/desktop-deno --force; pnpm build --filter=!@lapis-notes/desktop-deno --force; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Four separate terminal-zero commands at lapis-notes-desktop-migration revision 69cb664e49204f4474fb8ff44b14cf3ebc397107; receipts notes.json. API has 1115 passing tests. Other package totals remain in notes-2.log. Frozen desktop host is excluded; no packaged Deno rerun.",
      "counts": {
        "unitCases": 1411
      }
    },
    {
      "name": "plugins-foundation-and-storybook",
      "command": "pnpm check; pnpm test; pnpm build; pnpm spec:check; pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "counts": {
        "storybookCases": 235,
        "storybookFiles": 46
      },
      "note": "Five separate terminal-zero commands at lapis-plugins-desktop-migration revision 147ba6e2e3e4af1e1818179c1f309fc3b420ce44; receipts plugins.json. Storybook is fresh. Forced check/test/build are being rerun because ignored archive input changes are not assumed to invalidate prior Turbo caches."
    },
    {
      "name": "interrupted-source-lanes",
      "command": "pnpm test:storybook --force (Notes); pnpm build-storybook (Plugins); pnpm checks:nonvisual (Design Core)",
      "result": "fail",
      "failures": 0,
      "note": "Earlier runners were interrupted before terminal completion. Partial passing logs are supporting evidence only; each required lane must finish. No terminal completion was available from those interrupted processes; all three lanes subsequently pass in the complete runs below."
    },
    {
      "name": "mira-first-full-unit-run",
      "command": "pnpm check --force; pnpm lint; pnpm test --force",
      "result": "fail",
      "failures": 3,
      "counts": {
        "miraPackagePassed": 382
      },
      "note": "Check and lint exit zero. Three Mira tests exceed the unchanged five-second deadline: opaque theme/color mode, accepted preview recovery text, and local frontmatter disclosure remount. Resource contention is plausible but not established. Receipts mira.json retain the failed full run."
    },
    {
      "name": "mira-exact-timeout-reproductions",
      "command": "pnpm --filter @lapismd/mira exec vitest run src/index.test.ts -t 'renders opaque theme tokens and an independent color mode'; pnpm --filter @lapismd/mira exec vitest run src/preview/editable-markdown-preview/recovery-surface.test.ts -t 'renders the accepted recovery text without rereading or rebinding the source'; pnpm --filter @lapismd/mira exec vitest run src/internal/codemirror/rich/index.test.ts -t 'preserves a local frontmatter disclosure across preview widget remounts'",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 3
      },
      "note": "Three separate terminal-zero commands. No timeout or assertion changes. Receipts mira-regressions.json."
    },
    {
      "name": "mira-full-qualified",
      "command": "pnpm test --force --concurrency=1; pnpm build --force --concurrency=1; pnpm spec:check; pnpm test:storybook; pnpm build-storybook; pnpm test:e2e",
      "result": "pass",
      "failures": 0,
      "counts": {
        "unitCases": 444,
        "storybookCases": 160,
        "storybookFiles": 36,
        "browserCases": 52
      },
      "note": "Six separate terminal-zero commands at mira-mde-desktop-migration revision bdb5ae1be4ac902d38adb71ea1822797d9409d6b. Complete coverage with serial Turbo scheduling and original deadlines. Browser output includes the pre-existing test.fail blockquote whitespace contract documented in Mira verification; it is not a new unexpected failure. No source or baseline changes. Receipts mira-final.json."
    },
    {
      "name": "plugin-force-runner-argument-error",
      "command": "pnpm check --force --concurrency=1",
      "result": "fail",
      "failures": 1,
      "note": "The repository wrapper already supplies --concurrency, so Turbo rejects the duplicated option. Retry through supported TURBO_CONCURRENCY=1 with pnpm check --force; no product/test failure is inferred."
    },
    {
      "name": "notes-full-storybook-before",
      "command": "pnpm test:storybook --force",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 90
      },
      "note": "Shard 1 exposes ambiguous installation alert and mutable renamed-file path assertions; shards 2–4 do not run. Both exact single-story reproductions fail once. No runtime defect is inferred from these two fixture assertions."
    },
    {
      "name": "notes-exact-stories-after",
      "command": "pnpm exec vitest run --project storybook stories/workspace/Plugins.stories.ts stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t 'Install Failure|Sync Document Loading And Rename'",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2,
        "filtered": 43
      },
      "note": "Scope the existing titled installation alert and snapshot the original file path before managed rename. Source record: spec/records/2026-10-16-m7-story-qualification.md. Full Storybook and consumer qualification remain required."
    },
    {
      "name": "first-complete-native-attempt",
      "command": "pnpm test:desktop",
      "result": "fail",
      "failures": 5,
      "counts": {
        "startupPassed": 2,
        "foundationPassed": 27,
        "coldProfilePassed": 55,
        "coldProfileFailed": 5
      },
      "note": "File reconciliation fails before Rust renderer acknowledgement, rather than during file IO. A conflicted draft contains original text because the typing fixture races readiness/watcher reconciliation. Diagnostic copy compares serialized JSON to raw stack text. Safe Mode rebuild status and post-resize native geometry also time out. Raw HTTP representation lane is not reached."
    },
    {
      "name": "native-failure-reproductions",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-reconciliation.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/startup-recovery.test.mjs tests/desktop/window-chrome.test.mjs",
      "result": "fail",
      "failures": 2,
      "counts": {
        "passed": 7
      },
      "note": "External reconciliation, conflicted-tab retention, Safe Mode and native controls pass unchanged. A different conflict fixture loses the stale-write condition when the watcher reloads the clean note first; the raw JSON diagnostic assertion still fails."
    },
    {
      "name": "native-exact-diagnostic-and-closed-tab",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-name-pattern='startup retry' tests/desktop/startup-recovery.test.mjs; LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-name-pattern='closing a conflicted tab' tests/desktop/notes-conflicts.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 2
      },
      "note": "Separate terminal-zero runs. Parse the full clipboard diagnostic. Mark Notes ready only when its mounted shell is interactive; establish a local draft before the external writer so clean-file refresh cannot remove the intended conflict."
    },
    {
      "name": "native-affected-profile-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=.local/native-test/m5-watch-qualified node --test --test-concurrency=1 tests/desktop/file-reconciliation.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/startup-recovery.test.mjs tests/desktop/window-chrome.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 9
      },
      "note": "Fresh native build first. Preserve all exact draft/disk, blocked shutdown, complete diagnostics, Safe Mode, native resize geometry and drag-region assertions. Deadlines are unchanged. Full canonical qualification remains required."
    },
    {
      "name": "desktop-strict-check-before",
      "command": "pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Clippy requires collapsing the nested safe-external-link error branch. No behavioral or lint-policy change."
    },
    {
      "name": "desktop-strict-check-after",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Spec validation, zero Svelte errors/warnings, all-target strict Clippy and repository Prettier/Rust formatting pass."
    },
    {
      "name": "desktop-complete-unit-tests",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererGovernanceCases": 71,
        "rustCases": 68,
        "rustSubprocessHelpers": 2
      },
      "note": "The two ignored entries are database_process_helper and staging_process_helper, invoked by the passing restart/interruption tests. They are not waived behavior."
    },
    {
      "name": "plugin-full-forced-and-package-qualification",
      "command": "TURBO_CONCURRENCY=1 pnpm check --force; pnpm test --force; pnpm build --force; pnpm build-storybook; pnpm test:release; pnpm packages:pack -- --already-built; pnpm plugin:build; pnpm plugin:verify",
      "result": "pass",
      "failures": 0,
      "counts": {
        "pluginUnitCases": 807,
        "releaseToolingCases": 119,
        "packedPackages": 12,
        "verifiedPayloads": 12
      },
      "note": "Eight separate terminal-zero commands with TURBO_CONCURRENCY=1. Check/test/build bypass every Turbo cache; static Storybook, publint/prepack, deterministic payload reproduction and verification pass. Initial full Storybook remains 235 passing cases. No signing, publication or registry dispatch occurs. Receipts plugins-retry.json."
    },
    {
      "name": "final-installed-archive-cohorts",
      "command": "readArchiveManifest and verifyArchiveResolution over Desktop, Notes and Plugins active pnpm workspace routes",
      "result": "pass",
      "failures": 0,
      "counts": {
        "desktopArchives": 14,
        "desktopRoutes": 14,
        "notesArchives": 13,
        "notesRoutes": 23,
        "pluginArchives": 10,
        "pluginRoutes": 37
      },
      "note": "Checksums, packed identities and installed payloads match the pinned final cohorts. No install or tracked dependency mutation occurs."
    },
    {
      "name": "notes-complete-storybook-and-static",
      "command": "pnpm test:storybook; pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "counts": {
        "storybookCases": 257,
        "storybookFiles": 57,
        "shards": 4
      },
      "note": "Separate terminal-zero commands after both exact story regressions pass; fresh four-shard interaction/axe counts 92/65/45/55. Static catalog passes. Receipts notes-qualified.json."
    },
    {
      "name": "notes-web-with-docker-stopped",
      "command": "pnpm test:web:e2e",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 11
      },
      "note": "The server-hosted vault case cannot connect to the stopped Docker daemon. Other eleven cases pass; rerun against a freshly built candidate image is required. Receipts notes-qualified.json."
    },
    {
      "name": "notes-packages-and-spec",
      "command": "pnpm packages:check; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "releaseToolingCases": 101
      },
      "note": "Two separate terminal-zero commands after the story corrections; public package/types/publint and canonical specs pass. Receipts notes-package-spec.json."
    },
    {
      "name": "design-core-first-nonvisual-run",
      "command": "pnpm checks:nonvisual",
      "result": "fail",
      "failures": 1,
      "note": "The shell mobile horizontal-pan case times out waiting for readiness before a gesture. Repository runner retains a diagnostic PNG; no baseline is reviewed or changed. Receipts design-core-final.json."
    },
    {
      "name": "design-core-exact-mobile-pan",
      "command": "pnpm test:shell:pointer --grep 'horizontal pans reveal and dismiss both edge lanes'",
      "result": "pass",
      "failures": 0,
      "counts": {
        "passed": 1
      },
      "note": "Unchanged cold exact case passes with original deadlines. No source or timeout edit. Receipts design-core-pan-exact.json."
    },
    {
      "name": "design-core-full-qualified",
      "command": "pnpm checks:nonvisual; pnpm build-storybook; pnpm packages:check; pnpm packages:pack",
      "result": "pass",
      "failures": 0,
      "counts": {
        "unitCases": 743,
        "unitFiles": 116,
        "storybookCases": 754,
        "storybookFiles": 226,
        "workspacePointerCases": 15,
        "shellBrowserCases": 11,
        "aiBrowserCases": 3,
        "shadcnBrowserPassed": 83,
        "conditionalChromiumSkipped": 1
      },
      "note": "Four separate terminal-zero commands. Actual WebKit overlays and clean packed consumer types/CSS/fonts/focus/theme/reactive lifecycles pass. Existing repository-approved KaTeX advisory exception is unchanged. Receipts design-core-resume.json."
    },
    {
      "name": "desktop-final-source-qualification",
      "command": "pnpm check; pnpm test; pnpm build; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "rendererGovernanceCases": 71,
        "rustCases": 68
      },
      "note": "Four separate terminal-zero commands after the duplicate-link repair in E-INTEGRATION-001. Zero Svelte diagnostics, strict all-target Clippy, formatting and four spec lanes pass. Two Rust subprocess helpers are invoked by passing parent tests. Receipts desktop-final.json."
    },
    {
      "name": "server-image-frozen-install-before",
      "command": "docker build --progress=plain -f packages/server-deno/Dockerfile -t lapis-server:desktop-migration-m7-69cb664e .",
      "result": "fail",
      "failures": 1,
      "note": "Fresh candidate build rejects the frozen lockfile hook checksum because Docker ignored the public pnpm hook. Repair recreates only the official entrypoint; no local archive overlay or lockfile relaxation."
    },
    {
      "name": "server-image-after-hook-repair",
      "command": "docker build --progress=plain -f packages/server-deno/Dockerfile -t lapis-server:desktop-migration-m7-69cb664e .",
      "result": "fail",
      "failures": 1,
      "note": "Frozen registry installation succeeds; normal renderer build is killed with exit 137 at the original 3072 MiB Docker VM limit. User explicitly authorizes temporary 8192 MiB with restoration afterward. Logs web-server-image-after.log."
    },
    {
      "name": "server-source-and-hook-regressions",
      "command": "pnpm --filter @lapis-notes/server-deno check; node --test scripts/local-plugin-pnpmfile.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "serverCases": 28,
        "serverFiles": 8,
        "hookCases": 3
      },
      "note": "Separate terminal-zero commands prove server types/tests and public hook registry-range behavior. Deno desktop is untouched."
    }
  ],
  "contractReview": "Source repositories own repairs and public outputs. Tracked dependency manifests/locks remain portable registry ranges; installed overlays retain the verified final archive cohorts. Full functional, accessibility, native and ordinary-bundle gates remain required; signing, publication and post-M7 intake remain deferred.",
  "milestoneReview": "Component and aggregate qualification now pass. E-QUALIFICATION-002 records the final complete native/ordinary-bundle results and every original M4–M7 gate. The ordinary app is open for review; stop before M8."
}
```
