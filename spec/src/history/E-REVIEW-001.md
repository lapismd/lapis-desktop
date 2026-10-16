# E-REVIEW-001: Native controls, chooser return and Deno freeze

The user requested these changes during review of the ordinary Tauri app.

```json
{
  "id": "E-REVIEW-001",
  "tasks": ["M0.1", "M4", "M12"],
  "requirements": [
    "LD-DESK-002",
    "LD-VAULT-006",
    "LD-LIFE-003",
    "LD-MIG-002",
    "LD-MIG-003",
    "LD-VAULT-007"
  ],
  "revision": "enclosing-change",
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "tauri": "2.12.4",
    "specValidator": "0.1.4"
  },
  "files": [
    "PLAN.md",
    "MIGRATION.md",
    "scripts/desktop-acceptance.mjs",
    "src/Shell.svelte",
    "src/VaultLauncher.svelte",
    "src-tauri/tauri.conf.json",
    "tests/desktop/vault-return.test.mjs",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/SUMMARY.md",
    "spec/src/history/index.md",
    "spec/src/history/E-REVIEW-001.md",
    ".prettierignore",
    "src-tauri/tauri.e2e.conf.json",
    "tests/desktop/native-session.mjs",
    "tests/desktop/native-visibility.mjs",
    "tests/desktop/notes.spec.mjs",
    "tests/desktop/wdio.conf.mjs",
    "tests/desktop/vault.spec.mjs",
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "src-tauri/src/main.rs",
    "src-tauri/src/macos_chrome.rs",
    "src-tauri/src/window.rs",
    "src-tauri/src/lifecycle.rs",
    "src-tauri/src/commands.rs",
    "tests/desktop/window-chrome.test.mjs",
    "scripts/check-bundle.mjs"
  ],
  "result": "pass",
  "remaining": [],
  "completedGates": {},
  "runs": [
    {
      "name": "return-button-before-hidden-window",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/vault-return-before node --test --test-concurrency=1 tests/desktop/vault-return.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The existing native visibility guard fails before product assertions. Preserve the failure; do not loosen the guard."
    },
    {
      "name": "return-button-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/vault-return-before node --test --test-concurrency=1 tests/desktop/vault-return.test.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "cases": 1
      },
      "note": "Against the previous bundled artifact, opening/editing/leaving succeeds and saves to disk. The assertion fails specifically because Return to previous vault is absent."
    },
    {
      "name": "spec-first-attempt",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "note": "Split chooser-return into its own atomic requirement (LD-VAULT-007) and keep the new migration verification row inside the actual table."
    },
    {
      "name": "format-first-attempt",
      "command": "pnpm format:check",
      "result": "fail",
      "failures": 7,
      "note": "Five unformatted acceptance files were inherited from WIP. Concurrent Jujutsu metadata enumeration adds two missing-file errors; exclude .jj metadata and apply formatting only to the five source files."
    },
    {
      "name": "formatter-ignore-file-attempt",
      "command": "pnpm exec prettier --write .prettierignore [changed source files]",
      "result": "fail",
      "failures": 1,
      "note": "Prettier has no parser for its own ignore file. The source files format successfully; verify the plain-text ignore through the normal formatting lane."
    },
    {
      "name": "renderer-and-governance-units",
      "command": "node --test tests/governance/*.test.mjs tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 36
      }
    },
    {
      "name": "native-return-after-hidden-window",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/vault-return-after node --test --test-concurrency=1 tests/desktop/vault-return.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The existing visibility guard fails at startup. Foreground the actual isolated app through CUA; no guard, timeout or assertion is weakened."
    },
    {
      "name": "native-return-exact-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/vault-return-after node --test --test-concurrency=1 tests/desktop/vault-return.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "coldCases": 1
      },
      "note": "The actual WebView saves pending edits, releases the previous database, preserves the return button after picker cancellation, and restores the selected note and saved layout."
    },
    {
      "name": "full-native-webview-first",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-full LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-full/window-state.json pnpm exec wdio run tests/desktop/wdio.conf.mjs",
      "result": "fail",
      "failures": 1,
      "counts": {
        "passed": 26,
        "failed": 1
      },
      "note": "The newly visible shared icon-only close button has a correct aria-label, but the existing keyboard assertion incorrectly uses only textContent as its name. Keep enabled/tab-order/name assertions and read aria-label for the accessible name. All seven Notes cases, including Reading-view departure, pass while the native window is foregrounded."
    },
    {
      "name": "full-cold-native-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-full LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-full/window-state.json node --test --test-concurrency=1 tests/desktop/startup-progress.test.mjs tests/desktop/lifecycle.test.mjs tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/window-chrome.test.mjs tests/desktop/vault-return.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "coldCases": 18
      },
      "note": "All native lifecycle, startup, editor/preview conflict, repeated-switch, chooser-return and HTML-drag/tab geometry cases pass. This run uses the initial 20px native inset; native visual review subsequently moves the inset to 22px to center buttons at y=20. Requalify native chrome against that final bundle."
    },
    {
      "name": "desktop-check-format-during-edit",
      "command": "CARGO_BUILD_JOBS=2 pnpm check",
      "result": "fail",
      "failures": 1,
      "note": "Type checking (zero errors/warnings), strict Clippy and spec validation pass. Formatting catches the newly edited vault accessibility test; format it and rerun the exact check."
    },
    {
      "name": "desktop-units-after",
      "command": "CARGO_BUILD_JOBS=2 pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodeCases": 36,
        "rustCases": 34,
        "ignoredSubprocessHelpers": 2
      }
    },
    {
      "name": "spec-validate-after",
      "command": "pnpm spec:validate",
      "result": "pass",
      "failures": 0,
      "counts": {
        "validators": 6,
        "chapters": 26,
        "requirements": 38
      }
    },
    {
      "name": "traffic-light-visual-first",
      "command": "cua.getApp; app.getScreenshot",
      "result": "fail",
      "failures": 1,
      "note": "Tauri inset y=20 places native centers near y=18 on this macOS host. Use the public y=22 inset to meet the 40px tab strip centerline; no AppKit layout code is added."
    },
    {
      "name": "native-vault-access-exact-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-vault-22 LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-vault-22/window-state.json pnpm exec wdio run tests/desktop/wdio.conf.mjs --spec tests/desktop/vault.spec.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 9
      },
      "note": "The original keyboard-name failure and all eight prerequisite admission/security cases pass against the final native inset. Icon-only controls must still have a nonempty accessible name, be enabled and be keyboard-reachable."
    },
    {
      "name": "full-native-webview-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22 LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22/window-state.json pnpm exec wdio run tests/desktop/wdio.conf.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 27,
        "specFiles": 5
      },
      "note": "All shell, admission, conditional writes, database, Notes and axe cases pass with the final 22px native inset. CUA foregrounds the actual app; the previous hidden-WebView limitation remains a harness concern and is not bypassed."
    },
    {
      "name": "native-inset-rebuild",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json --config '{\"build\":{\"beforeBuildCommand\":null}}'",
      "result": "pass",
      "failures": 0,
      "note": "After two fresh frontend/e2e builds, only native inset changes. This rebuild reuses that unchanged renderer output; the final ordinary bundle runs its full frontend build again."
    },
    {
      "name": "final-native-chrome-and-return",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22 LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22/window-state.json node --test --test-concurrency=1 tests/desktop/window-chrome.test.mjs tests/desktop/vault-return.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "coldCases": 2
      },
      "note": "Requalify final native-inset bundle after the 18-case cold run: tab-first geometry/drag exclusions and the previous-vault close/cancel/save/restore flow pass."
    },
    {
      "name": "strict-desktop-check-after",
      "command": "CARGO_BUILD_JOBS=2 pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Svelte has zero errors and warnings; strict all-target Clippy, six-validator specification validation, source audits and repository-wide formatting pass."
    },
    {
      "name": "full-specification-check",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "counts": {
        "lanes": 4
      },
      "note": "Canonical validation, Rust formatting, mdBook and mapped spec-first pass."
    },
    {
      "name": "progress-after",
      "command": "pnpm check:progress",
      "result": "pass",
      "failures": 0,
      "counts": {
        "tasks": 14,
        "evidenceRecords": 19
      }
    },
    {
      "name": "unchanged-original-gates",
      "command": "node --input-type=module (parseTasks comparison with Jujutsu parent)",
      "result": "pass",
      "failures": 0,
      "counts": {
        "unchangedGates": 14,
        "unchangedStatuses": 14
      }
    },
    {
      "name": "ordinary-restored-controls-before",
      "command": "pnpm desktop:bundle --debug; pnpm check:bundle; cua.getApp; app.getAXStateAndScreenshot",
      "result": "fail",
      "failures": 1,
      "note": "The ordinary bundle and its automation-exclusion check pass. Restoring/raising the real workspace resets both native offsets despite configured trafficLightPosition. The pinned Tauri high-level API has initial placement but no runtime setter. Adapt the existing jj-store native-control boundary for the Lapis 40px header; no Deno code changes, polling or tab transforms."
    },
    {
      "name": "native-geometry-exact-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22 LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22/window-state.json node --test --test-concurrency=1 tests/desktop/window-chrome.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The previous acceptance artifact cannot establish real native rectangles; the new assertion fails rather than substituting configured targets. The ordinary-window screenshot independently shows relayout resetting both native offsets."
    },
    {
      "name": "native-relayout-build-first",
      "command": "CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json --config '{\"build\":{\"beforeBuildCommand\":null}}'",
      "result": "fail",
      "failures": 3,
      "note": "Tauri async State reference/return requirements yield two related compiler errors, and the page-load callback needs an explicit window borrow. Make shell_info own its AppHandle and derive state from that owner; correct the borrow. No native probe or Rust lint is disabled."
    },
    {
      "name": "native-boundary-strict-check",
      "command": "CARGO_BUILD_JOBS=2 pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "After the native-boundary fix, strict Clippy, zero-warning Svelte checking, specification/source audits, repository formatting and Rust formatting pass."
    },
    {
      "name": "native-boundary-unit-tests",
      "command": "CARGO_BUILD_JOBS=2 pnpm test",
      "result": "pass",
      "failures": 0,
      "counts": {
        "nodeCases": 36,
        "rustCases": 34,
        "ignoredSubprocessHelpers": 2
      }
    },
    {
      "name": "native-geometry-after-hidden-window",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22 LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22/window-state.json node --test --test-concurrency=1 tests/desktop/window-chrome.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "The first helper attempt is blocked by the existing visibility guard before geometry assertions; foreground the isolated native app without loosening the guard."
    },
    {
      "name": "actual-native-geometry-after",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22 LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-fixes-all-22/window-state.json node --test --test-concurrency=1 tests/desktop/window-chrome.test.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 1,
        "coldProcesses": 2,
        "nativeButtons": 3
      },
      "note": "Measure actual AppKit rectangles after startup, native resize/focus and a second cold process restoring geometry. All three centers are y=20 within 0.5px, all native controls retain their 16px inset and fit the 80px reserved region. Existing tab-edge, sidebar and HTML-drag assertions remain."
    },
    {
      "name": "jjbutler-reference-review",
      "command": "Read /Users/stevejuma/code/jjbutler/crates/jj-tauri/src/window.rs and Cargo manifests; cargo info tauri-plugin-trafficlights-positioner",
      "result": "pass",
      "failures": 0,
      "note": "JJButler window.rs uses setup_traffic_lights_inset and documents the Tauri reset issue (#13044). The checkout does not declare that dependency; the published stable 1.0.0 crate targets Tauri 1.7.0, not this Tauri 2 app. Keep the verified jj-store-style helper rather than add an incompatible dependency. No JJButler source changes."
    },
    {
      "name": "relayout-full-webview",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-relayout-final LAPIS_DESKTOP_ACCEPTANCE_STATE=/Users/stevejuma/code/lapismd/lapis-desktop/.local/native-test/review-relayout-final/window-state.json pnpm exec wdio run tests/desktop/wdio.conf.mjs",
      "result": "pass",
      "failures": 0,
      "counts": {
        "cases": 27,
        "specFiles": 5
      },
      "note": "The complete actual-WebView suite passes again after the native helper and asynchronous e2e geometry measurement are added."
    }
  ],
  "contractReview": "The chooser uses the existing shared canReturn/onClose surface and retains only the last ready profile ID after save/teardown. Return reopens through host-owned admission and saved-layout restoration; cancellation preserves it. For native controls, Tauri initial placement alone fails after AppKit restoration. Adapt jj-store desktop/src/macos_chrome.rs to retain y=20 centers in the 40px Lapis strip, using live Tauri main-thread borrows, one window-filtered update observer, no raw pointer retention and no polling. Only that module permits unsafe native borrows; the service library still forbids unsafe code. E2E-only shell information measures actual button rectangles to prevent configured target values from posing as native acceptance. Deno desktop stays superseded and frozen; no Deno changes or packaged reruns, and shared-library ownership remains intact.",
  "milestoneReview": "All fourteen milestone gates and statuses are unchanged. M0.1 remains qualified by its original evidence. M4 remains In progress with the earlier preview/presentation qualification and Properties/metadata writer audit unfinished. M12 remains Planned; freezing Deno does not claim capability-complete cutover. Signing and publication remain deferred. E-REVIEW-002 records final native qualification and the ordinary app restored for review; pause without starting another slice."
}
```
