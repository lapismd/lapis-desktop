# Preserve workspace HTML tab dragging in native WebViews

```json
{
  "id": "E-SHELL-003",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M0.1", "M7.3"],
  "requirements": ["LD-DESK-002", "LD-POP-003"],
  "contractReview": "Disable unused native file-drop capture at the shared Tauri window configuration so WebKit handles HTML workspace tab dragging. Main and related windows use the same from_config input. Existing native titlebar dragging, popup admission, file authority and shared Design Core UI remain unchanged. No renderer workaround or dependency modification.",
  "milestoneReview": "M0.1/M7.3 retain their original selected native evidence and Done status. The reported within-window tab-transfer regression is fixed and physically confirmed by the user in both directions after the cold ordinary rebuild. This does not enable or qualify cross-window transfer, replace existing popup admission/lifecycle gates, approve visual baselines or qualify release.",
  "versions": {
    "platform": "macOS ARM64",
    "tauri": "2.12.4",
    "tauriRuntimeWry": "2.12.2",
    "wry": "0.57.0",
    "desktopBaseline": "7128b8b8"
  },
  "diagnosis": "tauri.conf.json omitted dragDropEnabled, which defaults true. tauri-runtime-wry 2.12.2 with_drag_drop_handler returns true for every drag event even without native consumers. Wry 0.57.0 wkwebview/drag_drop.rs then skips WKWebView superclass draggingEntered/draggingUpdated/performDragOperation; HTML workspace targets never receive their drop. Safari has no Tauri interception. related.rs clones the same main-window configuration.",
  "runs": [
    {
      "name": "before",
      "command": "node --test tests/governance/window-drag-config.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "Both ordinary and acceptance configurations lacked the explicit false policy and inherited native capture."
    },
    {
      "name": "after",
      "command": "node --test tests/governance/window-drag-config.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "2 passed after setting dragDropEnabled false. Acceptance inherits the same window array; related and proof windows clone it in their existing native builders."
    },
    {
      "name": "ownership",
      "command": "pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Both source-boundary audits pass; no new runtime or authority seam."
    },
    {
      "name": "physical-before-attempt",
      "command": "CUA getApp, screenshot and drag; rebind running bundle ID and drag",
      "result": "pending",
      "failures": 0,
      "note": "The app/window and screenshot are readable, but native drag calls fail with noWindowsAvailable for both handles. This is an automation failure, not product evidence. Existing tab layout retained; no synthetic drop is substituted."
    },
    {
      "name": "ordinary-build",
      "command": "pnpm exec tauri build --debug --bundles app; pnpm check:bundle; CUA getApp(full preview path)",
      "result": "pass",
      "failures": 0,
      "note": "Normal arm64 bundle rebuilt with the new native configuration. Zero normal automation markers; signing deferred. Cold launch restored the existing Notes workspace, tabs and sidebars. Shared UI and existing profile/data preserved. Renderer chunk-size and existing linker unwind warnings retained."
    },
    {
      "name": "initial-document-gates",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:first; pnpm spec:validate",
      "result": "fail",
      "failures": 3,
      "note": "Spec-first passed. Documentation checks found an accidentally added M4 evidence selection and governance/migration line limits. Removed unrelated selection and compressed owning prose without removing requirements. Evidence files refreshed for the final rerun."
    },
    {
      "name": "document-limit-correction",
      "command": "pnpm check:progress; pnpm spec:validate",
      "result": "fail",
      "failures": 1,
      "note": "Progress passed at 41 tasks / 223 records; the remaining governance prose was still 402 lines. Compressed its existing acceptance paragraph to the 400-line limit, preserving all boundaries and references. Migration is 400 lines and desktop is below 32768 bytes."
    },
    {
      "name": "final-document-gates",
      "command": "pnpm check:progress; pnpm spec:first; pnpm spec:validate; changed-file Prettier",
      "result": "pass",
      "failures": 0,
      "note": "41 tasks / 223 evidence records; 3 protected files / 4 canonical chapters; 6 validators / 257 chapters / 95 requirements; all changed files formatted. Physical gesture remains pending because the native automation drag command cannot target the window; user check requested against the running rebuilt ordinary bundle."
    },
    {
      "name": "physical-native-tab-transfer",
      "command": "User review of the rebuilt Lapis Notes Preview application",
      "result": "pass",
      "failures": 0,
      "note": "User confirmed Both directions work: physical dragging from sidebar into the main body and back into the sidebar. This is ordinary compiled WKWebView evidence, separate from Safari, configuration assertions and the unavailable automation gesture."
    }
  ],
  "files": [
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/windows.md",
    "spec/src/history/E-SHELL-003.md",
    "spec/src/history/index.md",
    "src-tauri/tauri.conf.json",
    "tests/governance/window-drag-config.test.mjs"
  ],
  "remaining": [],
  "scope": "Only native window configuration and its exact regression, normal app rebuild/cold launch, bundle audit and document gates. No Rust logic or renderer/shared-package changes. Unrelated suites, visual baselines, provider qualification and release are out of scope under the user-selected minimal checks."
}
```
