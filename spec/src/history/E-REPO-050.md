# Retain the live Notes workspace when final backup persistence fails

```json
{
  "id": "E-REPO-050",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "versions": "macOS ARM64; Rust 1.99.0; Tauri 2.12.4; Node 26.9.0; Desktop parent ef53bf74",
  "result": "pass",
  "tasks": ["M14", "M14.2", "M7.3"],
  "requirements": ["LD-REPO-005", "LD-LIFE-001", "LD-FILE-003", "LD-POP-004"],
  "files": [
    "tests/renderer/notes-dispose.test.mjs",
    "src/lib/notes/notes-dispose.ts",
    "spec/src/current/vault-backup.md",
    "spec/src/current/files.md",
    "spec/src/current/windows.md",
    "spec/src/current/desktop.md",
    "spec/src/current/repository.md",
    "spec/src/current/progress/vault-backup.md",
    "spec/src/current/migration.md",
    "MIGRATION.md",
    "spec/src/history/E-REPO-050.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/progress/milestones.md",
    "src/lib/repository/backup.ts",
    "src/components/repository/repository-backup.ts",
    "src/components/views/notes-bundled-plugins.ts",
    "src/components/views/NotesWorkspace.svelte",
    "tests/renderer/repository-backup.test.mjs",
    "tests/desktop/repository-backup-leave.test.mjs"
  ],
  "contractReview": "LD-LIFE-001/LD-REPO-005 require final backup persistence before destructive workspace, metadata and plugin teardown. Current synchronous prepareLeave is followed by beforeDispose/workspace disposal before RepositoryPlugin.onunload reaches native stop. Awaitable preflight and reversible reattachment must run within the same App writer guard; failed persistence must leave the original editors/views/plugins available and resume normal/backup watching. No library API extension, renderer authority or alternate App is proposed.",
  "milestoneReview": "M14.2 is Done on its original gate, supported by E-REPO-046 ordinary editor-save/Quit/cold reopen, E-REPO-048 actual native capture/crash/final drain, E-REPO-049 live watcher recovery, this actual-App failed final capture and successful retry, and the retained qualified M5 native watcher/overflow/reconciliation foundation. M14.1 remains Done; remaining M14 restore/search/provider/storage gates and AI/release remain separate. M7.3 completion is independently selected in E-POPOUT-004.",
  "runs": [
    {
      "name": "awaited-final-persistence-before",
      "command": "node --import tsx --test tests/renderer/notes-dispose.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "leave-before.log: 2 pass, 2 fail. Async preparation is not awaited; workspace-dispose occurs before it settles, and rejection does not stop destructive teardown."
    },
    {
      "name": "late-backup-persistence-before",
      "command": "node --import tsx --test tests/renderer/notes-dispose.test.mjs",
      "result": "fail",
      "failures": 3,
      "note": "leave-complete-before.log: 2 pass, 3 fail, including the actual current plugin-disable failure path after workspace/metadata destruction. leave-backup-before.log retains 2 pass/3 fail after the last case models one final capture called at both preparation and unload; the preflight must intercept it first."
    },
    {
      "name": "guarded-review-quit",
      "command": "osascript -l JavaScript -e 'ObjC.import(\"AppKit\"); var review = $.NSRunningApplication.runningApplicationWithProcessIdentifier(54405); if (!review || ObjC.unwrap(review.executableURL.path) !== \"/Users/stevejuma/code/lapismd/lapis-desktop/src-tauri/target/debug/lapis-desktop\") throw new Error(\"Review process identity changed\"); JSON.stringify({pid:Number(review.processIdentifier),normalQuitRequested:Boolean(review.terminate)});'\nps -p 54405,53444,54207,53269 -o pid=,ppid=,stat=,args=",
      "result": "pass",
      "failures": 0,
      "note": "Inspected the installed AppKit header: terminate attempts normal Quit; forceTerminate is a separate method and was not used. Request delivery returns true, immediate observation still sees live processes, subsequent observation has none. This safely unblocks local archive refresh while preserving profile/vault data; it is review operation evidence, not the final product failure/retry gate."
    },
    {
      "name": "awaited-final-persistence-after",
      "command": "node --import tsx --test tests/renderer/notes-dispose.test.mjs tests/renderer/repository-backup.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "leave-final-units.log: 15/15 pass. The five original leave cases pass; backup startup is drained before stop, cancelled leave reattaches without another consuming stop, and successful preflight is not repeated at plugin disposal. Ordinary source types pass with zero errors/warnings after combined archive installation."
    },
    {
      "name": "source-public-archive-refresh",
      "command": "pnpm local:install .local/archives/native-popout-and-file-navigation.json",
      "result": "pass",
      "failures": 0,
      "note": "install-combined-archives.log: all 14 verified public archives/import routes install coherently after normal review Quit and Storybook stop, with portable tracked manifests/lock preserved. Core 2e6fa2d8 and API 8fd98e22 source fixes replace the two older entries; existing peer/build-script warnings remain explicit."
    },
    {
      "name": "native-failed-quit-retry-and-reopen",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json\nLAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-backup node --test --test-concurrency=1 tests/desktop/repository-backup-leave.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "leave-full-build.log builds current native-test renderer and Acceptance bundle; existing Rollup annotation/empty optional worker chunk and compact-unwind warnings remain. leave-native-app.log passes 1/1 across two cold actual Notes processes: unreadable external file rejects Quit, identical editor DOM/session and saved draft survive, backup and ordinary watchers recover, a later file is captured automatically, successful Quit retry saves, and cold JJ Log displays the exact retained retry diff."
    },
    {
      "name": "direct-consumer-units",
      "command": "node --import tsx --test tests/renderer/notes-dispose.test.mjs tests/renderer/repository-backup.test.mjs tests/renderer/notes-leave.test.mjs tests/renderer/repository-sync.test.mjs tests/renderer/native-repository.test.mjs tests/renderer/repository-admission.test.mjs\nnode --import tsx --test tests/renderer/repository-native.test.mjs tests/renderer/repository-restore.test.mjs tests/renderer/repository-storage.test.mjs tests/renderer/repository-sources.test.mjs\npnpm check:types\npnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "leave-consumer-units.log passes 34 tests, but Node silently ignores the last two absent filenames in that first command. Correct existing native/restore/storage/source consumers run separately in leave-native-consumer-units.log: 29/29 pass. Exact leave/controller cases pass 15/15; related window/integration surface passes 44/44. Source types are clean and architecture/App ownership pass. No repository-wide suite claim is made."
    },
    {
      "name": "final-main-closeout",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:validate\npnpm spec:first\npnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Main closeout passes with 41 tasks/189 evidence records, 6 validators/216 chapters/95 requirements, 52 protected files/8 canonical chapters, source boundaries and explicit App ownership. Changed authored files formatted. Logs .local/verification/native-popouts/closeout-{generate,progress,spec,first,architecture,ownership,format}.log. Previously recorded actual native tests and ordinary bundle remain current; no source changes followed those passed runs. Wider product suites, provider flows, visual baselines, other platforms and release are not claimed."
    }
  ],
  "remaining": [],
  "deferredQualification": [
    "Remaining restore/search/storage/adoption and real-provider flows, AI/conversations, visual baseline, release and additional platforms retain their original gates."
  ],
  "completedGates": {
    "M14.2": "Open-vault internal/external capture, reconciliation and crash/close recovery work"
  }
}
```
