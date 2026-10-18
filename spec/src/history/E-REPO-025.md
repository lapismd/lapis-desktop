# Working-copy status qualification and catalog watcher isolation

```json
{
  "id": "E-REPO-025",
  "tasks": ["M13", "M13.2", "M8.5"],
  "requirements": [
    "LD-REPO-001",
    "LD-REPO-002",
    "LD-REPO-004",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-DESK-003",
    "LD-HOST-001",
    "LD-MIG-002",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-004",
    "LD-GOV-005",
    "LD-GOV-007"
  ],
  "date": "2026-10-18",
  "result": "pass",
  "revision": "enclosing-change",
  "versions": {
    "desktopBase": "b0831117",
    "jjStore": "faeab6644c64cbce332a835c7464384bdaecdc51",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "storybook": "10.5.7",
    "apiSource": "e522a82822c5f23d4be43bb545e34ea5fb296932",
    "designCoreSource": "2b46273c50fbfb4ca9a272e60f0c43526f2af236"
  },
  "files": [
    ".storybook/main.ts",
    "catalog/support/repository/WorkingCopyDemo.svelte",
    "scripts/desktop-acceptance.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository-navigation.md",
    "spec/src/current/repository.md",
    "spec/src/history/E-REPO-025.md",
    "src/lib/native/repository/services.ts",
    "tests/desktop/repository-admission.test.mjs",
    "tests/desktop/repository-working-copy.test.mjs",
    "tests/governance/catalog-reload.test.mjs",
    "tests/renderer/repository-native.test.mjs",
    "vite.catalog.config.ts"
  ],
  "contractReview": "LD-REPO-001/002/004 status authority, no-source-write observation, exact pin, bounds, worker lifetime and visibility setting contracts remain unchanged. New cold hidden-IPC assertions and headed plugin regression qualify unsnapshotted totals, forbidden renderer authority, release, refresh, recorded navigation, saved visibility and restart. User approved DetailsAndRefresh styling with Looks good; no visual baselines changed. LD-CAT-001/002 final Vite hook now explicitly merges owned watcher exclusions: Storybook10.5.7 overwrites the Vite file server block. Exclude JJ metadata as well as existing native/build/generated outputs, retaining ordinary source/CSS HMR, loopback and existing server admission. No dependency patch, broader image permission or source alias. Working-copy native failures now use the existing nativeError normalization before controller/notification delivery, preserving message/code rather than displaying a serialized object. No native frame or authority changed.",
  "milestoneReview": "M13 and M8.5 remain In progress; M13.2 retains its original Done qualification. This finishes the scoped working-copy status extension only. Managed conversations, broader platform/provider/release/distribution gates and baseline publication remain governed separately. Do not promote the umbrella milestones from these checks.",
  "scope": "Complete directly affected repository UI and native status boundary; shared watcher change additionally requires full catalog and static-build qualification. Existing source-owned Core/API mount checks remain in their independent committed evidence. Preserve review vault and ordinary profile; native acceptance uses disposable fixtures. Only idle desktop incremental outputs were removed after the review app exited; JJ server/targets/data remain untouched.",
  "runs": [
    {
      "name": "current-node-lanes",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs; pnpm check:types; pnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Initial276tests pass, strict types0errors/warnings and formatting pass. The earlier archive cleanup failure does not reproduce on the current Node26.9 run or the isolated original test. No assertion or archive fixture was weakened."
    },
    {
      "name": "watch-before",
      "command": "node --test --test-name-pattern='metadata churn' tests/governance/catalog-reload.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Observed actual Vite watcher forwarding .jj/state changes. Ignoring JJ metadata made the standalone watcher pass, but real Storybook remained unresponsive because its builder replaced server.watch."
    },
    {
      "name": "final-hook-before",
      "command": "node --test --test-name-pattern='metadata churn' tests/governance/catalog-reload.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Regression now invokes the actual main.viteFinal hook after a builder-shaped server replacement. It still forwarded JJ metadata, proving the missing final merge. Log status-verification-watch-final-before.log."
    },
    {
      "name": "final-hook-after",
      "command": "node --test tests/governance/catalog-reload.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Both filesystem watcher/final-hook and runtime reload tests pass. Metadata edits ignored, actual source.css changes retained. Log status-verification-watch-final-after.log."
    },
    {
      "name": "preview-graceful-stop",
      "command": "pnpm storybook:restart --port 7490",
      "result": "fail",
      "failures": 2,
      "note": "The old flooded event queue prevented two owned servers from stopping gracefully. Ownership record, UID,start time,command and cwd were revalidated before force-stopping only those task-owned PIDs97933 and40300. No unrelated process or fixture cleanup. Subsequent cold preview uses corrected final hook."
    },
    {
      "name": "governance-after",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "277tests pass with the new watcher regression; no inherited archive failure. Log status-verification-node-final.log."
    },
    {
      "name": "repository-catalog",
      "command": "pnpm test:storybook catalog/plugins/repository catalog/plugins/background/Work.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "99stories/19files in each desktop/narrow and light/dark run:396interaction/accessibility executions pass. Log status-verification-stories.log."
    },
    {
      "name": "static-catalog",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Static build with255stories completes successfully. Existing Rollup PURE annotation and chunk warnings remain informational. Log status-verification-static.log."
    },
    {
      "name": "e2e-build",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Cold native-test renderer and acceptance bundle built; native compilation6m41s,252.70MiB bundle. Linker warns the exception-unwind section exceeds16MiB compact-offset capacity. No build failure; ordinary bundle audit remains separate. Log status-verification-e2e-build.log."
    },
    {
      "name": "e2e-clippy",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked --features e2e -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Strict e2e all-target checks pass in2m36s. Log status-verification-e2e-clippy.log."
    },
    {
      "name": "native-first",
      "command": "node --test --test-concurrency=1 tests/desktop/repository-admission.test.mjs tests/desktop/repository-working-copy.test.mjs; node --test tests/desktop/repository-working-copy.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Hidden IPC test passes. Two UI attempts expected2changed files but correctly received4files/+60/-1: optional bundled AI seeds two real untracked .agents skill files. Diagnostic body confirms accurate status. Isolate the disposable history fixture using the existing disabled-AI preference; retain exact counts and byte-preservation assertions. Logs status-verification-native.log and status-verification-native-ui-diagnostic.log."
    },
    {
      "name": "native-qualified",
      "command": "node --test --test-concurrency=1 tests/desktop/repository-admission.test.mjs tests/desktop/repository-working-copy.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Both cold native tests pass in21.14s. Hidden real IPC checks exact physical totals, extra-frame rejection, source preservation and release/reload authority. Headed real plugin checks2files/+3/-1,3files after another unsnapshotted addition, recorded JJ Log navigation, persisted hiding across cold close/reopen, re-enable and unchanged source/Git/JJ bytes. Logs status-verification-native-qualified.log; isolated fixture roots retained under .local/native-test."
    },
    {
      "name": "source-checks-final",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Strict Svelte diagnostics0errors/0warnings, both source/App audits pass. Logs status-verification-{types-final,architecture,ownership}.log."
    },
    {
      "name": "native-navigation-and-watch-strengthening",
      "command": "node --test tests/desktop/repository-working-copy.test.mjs; node --test tests/governance/catalog-reload.test.mjs; node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Headed native case additionally asserts the recorded working-copy row is selected after navigation. Watcher case additionally excludes native build outputs. Both watcher tests and277final renderer/governance tests pass. Logs status-verification-{native-navigation,watch-qualified,node-qualified}.log."
    },
    {
      "name": "ordinary-check",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Complete normal check passes: specification, strict types, ordinary all-target Clippy with denied warnings, Prettier and Rust formatting. Separate e2e all-target Clippy also passed. Logs status-verification-check-full.log and status-verification-normal-clippy.log."
    },
    {
      "name": "ordinary-bundle",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm desktop:bundle --debug; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Production renderer built in1m41s, native dev profile5m39s,230.71MiB Preview app. ARM64 audit passes: 326 renderer JS files and 0 automation markers. Existing chunk-size/PURE warnings remain; signing is outside scope. Logs status-verification-normal-build.log and status-verification-bundle-audit.log."
    },
    {
      "name": "ordinary-review",
      "command": "CUA cold Preview launch and accessibility observation; SHA256 comparison of preserved review source inventory",
      "result": "pass",
      "failures": 0,
      "note": "Updated ordinary app restores the existing Repository Review workspace and Dirty after external advance editor contents. Working-copy control displays4files/+59/-1 from real data. User activity was observed; leave the window available rather than interfering. All110existing non-.lapis files retain exact hashes, with0changed/added paths, including complete Git/JJ metadata. No reset or installation. Logs status-verification-review-{before,preserved}.json."
    },
    {
      "name": "full-test-first",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm test",
      "result": "fail",
      "failures": 1,
      "note": "277Node,392AI policy and175Rust unit/integration cases across28binaries pass;2subprocess helpers are intentionally ignored as direct tests and exercised by their parent cases. Final Rust documentation compilation reports3E0463crate-resolution errors for Tauri-related libraries during overlapping Cargo build/check activity. Preserve the aggregate failure and rerun the doc step and complete test lane with Cargo operations serialized. Log status-verification-test-full.log."
    },
    {
      "name": "live-preview",
      "command": "pnpm storybook:restart --port7490 with final hook; repeated curl --max-time5 /index.json during native build/check/test and JJ bookkeeping",
      "result": "pass",
      "failures": 0,
      "note": "Corrected cold process71356 remains responsive throughout native/generated-file activity. Observed HTTP200responses ranged from about4ms to194ms under build load. The actual final-hook filesystem regression retains source changes while excluding JJ/native outputs. This replaces the failed direct-Vite-only mitigation; no dependency patch or broad HMR recreation."
    },
    {
      "name": "full-catalog-qualified",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "Complete255stories/62files pass in each desktop/narrow and light/dark run:1020interaction/accessibility executions. Shared final-hook configuration is covered cold. Log status-verification-catalog-full.log."
    },
    {
      "name": "final-static-catalog",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Repeat static build after the final hook import/merge change passes. Log status-verification-static-final.log."
    },
    {
      "name": "doc-serial",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --doc",
      "result": "pass",
      "failures": 0,
      "note": "Serialized Cargo metadata rebuild/doc lane passes; the crate currently contains0doc examples. Log status-verification-doc-serial.log."
    },
    {
      "name": "full-test-qualified",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm test",
      "result": "pass",
      "failures": 0,
      "note": "End-to-end command passes when Cargo lanes are serialized:277Node,392AI policy,175Rust unit/integration cases,2intentionally ignored subprocess helpers, and the documentation lane. Log status-verification-test-qualified.log. The subsequent JS-only native-error fix has278final Node checks and24direct catalog executions below; Rust sources are unchanged."
    },
    {
      "name": "native-error-before",
      "command": "node --test --test-name-pattern='working-copy native error' tests/renderer/repository-native.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "A serialized native failure reached notification feedback as a plain object, which would stringify as [object Object]. New assertion requires Error identity plus exact message/code. Log status-verification-error-before.log."
    },
    {
      "name": "native-error-qualified",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs; pnpm test:storybook catalog/plugins/repository/WorkingCopyStatus.stories.ts; pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "278final Node tests pass, including the native serialized-error/controller regression. FailureAndRecovery now feeds a normalized native-shaped failure and asserts the actual App toast. All6status stories across four theme/viewport combinations pass:24checks. Strict types0errors/warnings. Logs status-verification-error-{node,stories,types}.log."
    },
    {
      "name": "final-ordinary-bundle",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm desktop:bundle --debug; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Final ordinary bundle includes the JS native-error normalization. Native dev profile finishes in 1m55s; 230.71 MiB Preview app. ARM64 bundle audit passes: 326 renderer JS files and 0 automation markers. No signing, publication or installation. Logs status-verification-final-build.log and status-verification-final-bundle-audit.log."
    },
    {
      "name": "final-cold-review",
      "command": "CUA graceful native-menu quit, cold Preview relaunch, working-copy details and Open in JJ Log navigation; SHA256 review source inventory comparison",
      "result": "pass",
      "failures": 0,
      "note": "Latest ordinary app restores the preserved Repository Review workspace and Notes content. Status shows 4 files/+59/-1; details show recorded IDs, author, timestamp and unsnapshotted explanation. Open in JJ Log selects External history advance, commit 1980d3fa437d3ce014d7eaa9fd372bad3bcda2e5 at operation bd3e4eca8cded9201de7772afc4549adbfbd0b149e101885566459d19883939c1beb753f049e6cac2aa69156611370c70c96be127c37a54c2262ff277717a5ec. App remains open at that selected row. Final comparison: 110 before/110 after non-.lapis files, 0 changed/0 added, including source files and full Git/JJ metadata. No reset or fixture reseed. Local artifacts: .local/status-verification-final-preserved.json and .local/status-verification-final-review.png."
    },
    {
      "name": "final-bookkeeping-first",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm exec prettier --check <changed text files>",
      "result": "fail",
      "failures": 3,
      "note": "Generation and the spec-first gate pass. Before formatting the generated MIGRATION.md, progress and specification validation both report its temporary unrecorded diff and Prettier reports its generated table spacing. Formatting MIGRATION.md restores exact parent contents with no migration change; retain the actual failed checks and rerun final bookkeeping. No task status, gate or evidence assertion was weakened."
    },
    {
      "name": "final-bookkeeping-qualified",
      "command": "pnpm progress:generate; pnpm exec prettier --write MIGRATION.md; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm exec prettier --check .storybook/main.ts catalog/support/repository/WorkingCopyDemo.svelte scripts/desktop-acceptance.mjs spec/src/SUMMARY.md spec/src/current/desktop.md spec/src/current/governance.md spec/src/current/migration.md spec/src/current/plugins.md spec/src/current/progress/milestones.md spec/src/current/repository-navigation.md spec/src/current/repository.md spec/src/history/E-REPO-025.md src/lib/native/repository/services.ts tests/desktop/repository-admission.test.mjs tests/desktop/repository-working-copy.test.mjs tests/governance/catalog-reload.test.mjs tests/renderer/repository-native.test.mjs vite.catalog.config.ts",
      "result": "pass",
      "failures": 0,
      "note": "Progress validates 33 tasks/127 evidence records. Six spec validators pass for 146 chapters/94 requirements; spec-first passes 10 protected files/6 canonical chapters. All 18 changed text files satisfy Prettier. Generated MIGRATION.md matches its parent after formatting; no generated task gate/status changed. Final evidence is pass for this scoped extension, with no remaining in-scope checks; signing, publication, other platforms and managed-conversation gates remain separately deferred as described in scope and milestoneReview."
    }
  ],
  "remaining": []
}
```
