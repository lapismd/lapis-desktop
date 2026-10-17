# Shared progress before desktop shell import

```json
{
  "id": "E-STARTUP-002",
  "tasks": ["M0.1", "M4"],
  "requirements": [
    "LD-DESK-001",
    "LD-DESK-003",
    "LD-SESSION-003",
    "LD-CAT-003",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-007",
    "LD-MIG-002",
    "LD-NAV-007"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4"
  },
  "files": [
    "index.html",
    "src/main.ts",
    "src/components/views/ShellStartup.svelte",
    "src/lib/desktop/launch.ts",
    "src/lib/desktop/load-shell.ts",
    "src/lib/desktop/bootstrap.ts",
    "src/styles/shell.css",
    "catalog/plugins/desktop/ShellStartup.stories.ts",
    "catalog/COVERAGE.md",
    "catalog/DESKTOP_STATES.md",
    "scripts/check-bundle.mjs",
    "tests/desktop/entry.ts",
    "tests/desktop/runtime-entry.ts",
    "tests/desktop/startup-progress.test.mjs",
    "tests/renderer/shell-entry.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/history/E-STARTUP-002.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "PLAN.md",
    "PLUGIN_MIGRATION.md",
    "MIGRATION.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/migration.md",
    "spec/src/current/navigation.md"
  ],
  "result": "pass",
  "completedGates": {},
  "remaining": [],
  "runs": [
    {
      "name": "raw-html-before",
      "command": "node --test tests/renderer/shell-entry.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The initial HTML contains a raw 64px image. Its centering CSS arrives with the full application graph, allowing a top-left logo flash before shared progress."
    },
    {
      "name": "entry-after",
      "command": "node --test tests/renderer/shell-entry.test.mjs tests/renderer/shell-startup.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Five cases prove empty authored boot markup, progress before application import, retained failure diagnostics and unchanged native readiness ordering."
    },
    {
      "name": "failure-story-selector",
      "command": "pnpm test:storybook catalog/plugins/desktop/ShellStartup.stories.ts catalog/plugins/desktop/Startup.stories.ts catalog/plugins/ai/NativeNotes.stories.ts catalog/plugins/ai/ResourceOrder.stories.ts",
      "result": "fail",
      "failures": 1,
      "note": "Thirteen cases pass in the first configuration. The new failure story queried the task-list branch, which the shared component replaces with its failure summary. Assert the same failed phase through the public failure-summary and require data-state=failed; no production behavior or assertion content is weakened."
    },
    {
      "name": "focused-catalog-after",
      "command": "pnpm test:storybook catalog/plugins/desktop/ShellStartup.stories.ts catalog/plugins/desktop/Startup.stories.ts catalog/plugins/ai/NativeNotes.stories.ts catalog/plugins/ai/ResourceOrder.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "Fourteen stories pass all four size/theme configurations: 56 interaction/accessibility checks, including real shared failure presentation."
    },
    {
      "name": "fresh-native-startup",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm test:desktop:headed",
      "result": "pass",
      "failures": 0,
      "note": "Fresh packaged startup stage passes all three native cases. Before importing full application instrumentation, the actual WebView reports shared progress, Load the desktop shell, no standalone logo, no app children, a logo below 52px and horizontal center within 1px. The separate five-file Webdriver stage passes all 27 checks. This stage result does not hide the later failing command."
    },
    {
      "name": "native-full-attempt",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm test:desktop:headed",
      "result": "fail",
      "failures": 3,
      "note": "Main native collection passes 89/92: watch final rendered-frame and Graph hover frame requests time out; Search Keep my version leaves File conflicts. Fixture files prove watch stop/close IPC completed. Earlier Graph recovery and bundled-ID corrections pass. Preserve failures; no deadline/assertion is changed. HTTP stage is not reached."
    },
    {
      "name": "native-exact-isolated",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=$(mktemp -d \"$PWD/.local/native-test/exact-final-XXXXXX\") MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 --test-name-pattern=\"native watch channels|native global/local Graph|Search settings preserve failed\" tests/desktop/file-watch.test.mjs tests/desktop/navigation-graph.test.mjs tests/desktop/navigation-search-settings.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "All three exact unchanged cases pass cold, with no competing application build. This retry does not prove the preceding timeout causes. Complete isolated native collection is still required."
    },
    {
      "name": "ordinary-bundle",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "Fresh ordinary macOS ARM64 Preview bundle is 126.13 MiB. Audit finds zero automation markers, including the first-screen capture marker; no Node/Deno runtime. Signing remains deferred."
    },
    {
      "name": "quiet-complete",
      "command": "pnpm test:desktop",
      "result": "pass",
      "failures": 0,
      "note": "Final source passes 176 Node, 384 AI and 100 native Rust service cases (660 total; two inherited Rust helpers ignored), then all 151 stories in four viewport/theme configurations: 604 interaction/accessibility checks. No headed UI is used by this default command."
    },
    {
      "name": "mapped-navigation-contract",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Validate, Rust formatting and mdBook pass; spec-first correctly requires navigation.md for the Graph acceptance setup correction. Update that mapped contract with unchanged recovery requirements and the committed-layout fault boundary; original milestone gate is unchanged."
    },
    {
      "name": "native-complete-manual-state-omission",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=$(mktemp -d \"$PWD/.local/native-test/native-final-isolated-XXXXXX\") MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/*.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "95/97 native cases pass, including all three preceding failures, both HTTP representation cases, cold startup and AI ownership. Only lifecycle geometry cases lack their global LAPIS_DESKTOP_ACCEPTANCE_STATE. Both native logs explicitly reject NotPresent before WebDriver readiness. This is manual setup failure; the canonical headed script supplies the state file. No product/test assertion is changed; repeat those two cases with both isolated environment values."
    },
    {
      "name": "native-geometry-corrected-setup",
      "command": "task_native_geometry_root=$(mktemp -d \"$PWD/.local/native-test/geometry-final-XXXXXX\"); LAPIS_DESKTOP_ACCEPTANCE_ROOT=\"$task_native_geometry_root\" LAPIS_DESKTOP_ACCEPTANCE_STATE=\"$task_native_geometry_root/window-state.json\" MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/lifecycle.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Both geometry/Close/cold-restoration cases pass with the required isolated state file. Across final runs, all 97 Node native cases and all 27 Webdriver checks pass; neither failed aggregate command is relabeled successful."
    },
    {
      "name": "normal-check",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Final product source passes canonical validation, zero Svelte errors/warnings, strict normal Clippy and formatting. Subsequent edits update documentation only; final spec/format checks cover those documents."
    },
    {
      "name": "strict-e2e-final",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Final normal/e2e native source is qualified without changing any deadline, assertion, baseline or native automation boundary."
    },
    {
      "name": "static-catalog-final",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Fresh static catalog includes the new initial-shell Loading/Failed production compositions. Existing chunk-size and removable pure-annotation notices remain warnings; no visual baseline is changed."
    },
    {
      "name": "spec-final",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Canonical/source/progress validation, Rust format, mdBook and mapped spec-first all pass after the required navigation contract update. Checkpoint documents preserve original task gates and unfinished statuses."
    },
    {
      "name": "format-final",
      "command": "pnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Repository Prettier and cargo fmt checks pass. Product source is unchanged since the qualified native/quiet/bundle runs."
    }
  ],
  "contractReview": "The first renderer composition reuses public DesktopWorkspaceStartup before the full shell or acceptance instrumentation is imported. It owns Svelte teardown and retains the existing failed-startup surface. No simulated progress delay, replacement screen, unsafe native API or Deno change is introduced. Acceptance captures the real WebView composition before importing the application; ordinary bundle audits reject its marker. Native aggregate frame/recovery failures pass unchanged in isolated exact and complete reruns; their scheduling cause is not claimed as proven. Both manual geometry failures are proven missing-state setup errors and pass after supplying the required isolated state file. Visual review stays pending and non-blocking.",
  "milestoneReview": "M0.1/M4 retain their original completed gates. This is a first-screen regression correction, not a new milestone completion claim. AI and later migration gates remain unchanged. The latest user instruction pauses implementation after this slice for ordinary-app review. Plans and the ledger order resumption as M10.2, M10.3, M10.4, independent M7.3, M11 and M12; unfinished statuses and original gates are retained."
}
```
