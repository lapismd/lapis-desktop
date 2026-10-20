# Native workspace popout integration and admission

```json
{
  "id": "E-POPOUT-004",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "tasks": ["M7.3"],
  "requirements": [
    "LD-POP-001",
    "LD-POP-002",
    "LD-POP-003",
    "LD-POP-004",
    "LD-POP-005",
    "LD-POP-006",
    "LD-DESK-003",
    "LD-GOV-001",
    "LD-GOV-002",
    "LD-GOV-004",
    "LD-MIG-002"
  ],
  "result": "pass",
  "remaining": [],
  "contractReview": "The native host supplies bounded one-use blank-window tickets to the existing Notes/Design Core popout host. Related documents retain the original App, leaf, editor and save guard; filesystem/database/watch owners stay in main. Native close uses correlated receipts, failed saves retain the original window, and leave fences creation before draining windows and plugin owners. macOS uses a separate content controller and an initial document network policy, with shared resources confined to the active App vault. Native configuration stays in the existing audited main-thread module; no dependency patch, IPC grant, alternate UI or public package interface is introduced.",
  "milestoneReview": "M7.3 is Done on the original macOS ARM64 gate: the actual Notes App passes all 14 ordinary native window checks plus both related-host allow/deny cases against the refreshed source-owned archives. Native editor/draft/undo identity, IO/resource scope, control geometry, failed-save retention, independent save/close, redocking and cleanup are proved. M8.5, managed AI, remaining backup/provider, distribution and cutover gates remain separate.",
  "versions": "macOS ARM64; Rust 1.99.0; Tauri 2.12.4; Wry 0.57.0; Node 26.9.0; locked Desktop dependencies",
  "files": [
    "MIGRATION.md",
    "PLUGIN_MIGRATION.md",
    "scripts/source-audit.mjs",
    "spec-validator.config.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/integration.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/windows.md",
    "spec/src/history/E-POPOUT-004.md",
    "spec/src/history/index.md",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/acceptance/popouts.rs",
    "src-tauri/src/host/lifecycle.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/host/windows/macos_chrome.rs",
    "src-tauri/src/host/windows/mod.rs",
    "src-tauri/src/host/windows/popups.rs",
    "src-tauri/src/host/windows/related-policy.js",
    "src-tauri/src/host/windows/related.rs",
    "src-tauri/src/vault/resources.rs",
    "src-tauri/src/windows/mod.rs",
    "src-tauri/tests/vault_resources.rs",
    "src-tauri/tests/workspace_windows.rs",
    "src/components/views/NotesWorkspace.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/desktop/bootstrap.ts",
    "src/lib/desktop/desktop-integration.ts",
    "src/lib/desktop/popup-effects.ts",
    "src/lib/desktop/popup-handle.ts",
    "src/lib/desktop/workspace-popouts.ts",
    "src/lib/native/desktop-integration.ts",
    "src/lib/native/workspace-windows.ts",
    "src/lib/notes/notes-dispose.ts",
    "tests/desktop/plugin-entry.ts",
    "tests/desktop/popout-runner.ts",
    "tests/desktop/popout-session.ts",
    "tests/desktop/popout-workspace.test.mjs",
    "tests/desktop/runtime-entry.ts",
    "tests/renderer/notes-dispose.test.mjs",
    "tests/renderer/popout-effects.test.mjs",
    "tests/renderer/popout-host.test.mjs",
    "PLAN.md"
  ],
  "runs": [
    {
      "name": "retained-history-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-popouts node --test --test-concurrency=1 tests/desktop/popout-workspace.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Earlier fragment-ticket runs retain the editor/history but fail focused native undo or document.hasFocus. Diagnostic logs remain in popout-session-FczGz5, cEYjZS and tAPkf0. The fixture originally used Editor.setValue, which clears history; normal replaceRange exposed the actual focus failure."
    },
    {
      "name": "empty-url-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-popouts node --test --test-concurrency=1 tests/desktop/popout-workspace.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "popout-session-i84Oql fails before ordinary-native-open: Tauri rejects the empty URL before its callback. Exact about:blank without a fragment preserves the initial document."
    },
    {
      "name": "native-caller-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-popouts node --test --test-concurrency=1 tests/desktop/popout-workspace.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "native-exact-blank.log passes real opening, retained editor/draft, focused undo/redo and attachment loading, then detects a successful direct child vault_recents call through inherited native handlers. This fails the scope invariant; it is not accepted as a passing native result."
    },
    {
      "name": "scheme-replacement-rejected",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json; LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-popouts node --test --test-concurrency=1 tests/desktop/popout-workspace.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "build-isolated-handlers.log builds; native-isolated-handlers.log aborts the isolated process with NSInvalidArgumentException because an existing URL scheme handler cannot be replaced. Removed the replacement attempt; no ordinary review process or user vault is affected."
    },
    {
      "name": "global-protocol-restriction-rejected",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json; LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-popouts node --test --test-concurrency=1 tests/desktop/popout-workspace.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "build-scoped-protocols.log builds; native-scoped-protocols.log fails launcher startup because the main SDK also uses protocol IPC. Removed the global protocol override. The final policy is confined to related documents; main transport stays unchanged."
    },
    {
      "name": "policy-script-native-build-before",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "fail",
      "failures": 1,
      "note": "build-document-policy.log fails Rust E0277 on a retained NSString passed to Objective-C. Corrected to the borrowed NSString and the documented signed NSInteger injection-time encoding. Renderer assets in that build succeeded."
    },
    {
      "name": "registry-fifo",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test workspace_windows",
      "result": "pass",
      "failures": 0,
      "note": "registry-fifo.log: 9/9 pass including FIFO cancellation/retirement. A later resource-session regression is added and awaits the final native unit run."
    },
    {
      "name": "renderer-and-lifecycle",
      "command": "node --import tsx --test tests/renderer/popout-host.test.mjs tests/renderer/notes-dispose.test.mjs tests/renderer/notes-leave.test.mjs tests/renderer/integration-history.test.mjs tests/renderer/integration-ports.test.mjs tests/renderer/integration-urls.test.mjs tests/renderer/shell-entry.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "renderer-final.log: 39/39 pass, including failed saves, unresolved native retirement, original owner recovery and acknowledged/unknown ticket cancellation."
    },
    {
      "name": "native-popup-effects",
      "command": "node --import tsx --test tests/renderer/popout-effects.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "effects-final.log: 2/2 pass. Drag/zoom name their own native window, exclude interactive controls; reload uses the main guard, repeated keys do not replay, cleanup restores only owned clipboard/link listeners."
    },
    {
      "name": "types-and-source-boundaries",
      "command": "pnpm check:types; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "types-isolation.log: zero errors/warnings; architecture-resource-isolation.log and ownership-final.log pass. Final policy/source additions receive fresh final checks before qualification."
    },
    {
      "name": "native-isolation-lint",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --locked --features e2e,custom-protocol --bin lapis-desktop -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "related-isolation-check.log passes strict lint for the intermediate handler-isolation candidate. It did not predict the WebKit runtime restriction and does not qualify the final policy."
    },
    {
      "name": "policy-native-type-before",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json --config '{\"build\":{\"beforeBuildCommand\":null}}'",
      "result": "fail",
      "failures": 1,
      "note": "build-document-policy-native.log: E0282 on an inferred Objective-C controller before its typed setter was applied. Reordered the setter before adding its user script; build-document-policy-native-retry.log then builds successfully. Native-only retries reuse the already successful current renderer assets."
    },
    {
      "name": "document-policy-native-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-popouts node --test --test-concurrency=1 tests/desktop/popout-workspace.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "native-document-policy.log: opening, retained draft and actual focused undo/redo pass, but the own-vault attachment does not load. Resource policy diagnosis follows; no native gate is promoted."
    },
    {
      "name": "final-renderer-surface",
      "command": "node --import tsx --test tests/renderer/popout-effects.test.mjs tests/renderer/popout-host.test.mjs tests/renderer/notes-dispose.test.mjs tests/renderer/notes-leave.test.mjs tests/renderer/integration-history.test.mjs tests/renderer/integration-ports.test.mjs tests/renderer/integration-urls.test.mjs tests/renderer/shell-entry.test.mjs tests/governance/source-audit.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "renderer-document-policy.log: 41/41 pass."
    },
    {
      "name": "native-window-state-before",
      "command": "LAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-popouts node --test --test-concurrency=1 tests/desktop/popout-workspace.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "native-window-state.log: nine real checks pass, including undo/redo, own attachment, denied foreign-vault resources and denied child IPC. Opening the second leaf drops the first popup from the shared live layout, so its save guard is unreachable; its native Window and Document remain the same. The source defect belongs to Design Core AppWorkspace.changeLayout using its cold-restoration parser. No geometry or close assertion is weakened."
    },
    {
      "name": "native-registry-resources-final",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked --test workspace_windows --test vault_resources",
      "result": "pass",
      "failures": 0,
      "note": "native-units-final.log: 10/10 workspace registry cases and 3/3 resource cases pass. Tauri-encoded separators are decoded once; foreign identities and double encoding remain denied. The existing non-fatal compact-unwind linker warning remains."
    },
    {
      "name": "final-source-boundaries",
      "command": "pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "architecture-final.log and ownership-final.log pass on the final native configuration/resource helpers."
    },
    {
      "name": "strict-normal-final",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "clippy-normal-final.log passes all ordinary targets with strict warnings."
    },
    {
      "name": "strict-e2e-final",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --locked --all-targets --features e2e,custom-protocol -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "clippy-e2e-final.log passes all acceptance/custom-protocol targets with strict warnings."
    },
    {
      "name": "tracking-source-coverage-before",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 4,
      "note": "spec-validate-final.log: four newly updated tracking/navigation files were missing from this draft evidence file list. Added their exact coverage; no requirement, status or product gate was weakened."
    },
    {
      "name": "tracking-canonical-before",
      "command": "pnpm spec:first",
      "result": "fail",
      "failures": 1,
      "note": "spec-first-qualified.log: PLUGIN_MIGRATION.md also maps to the canonical migration chapter. Added the explicit M7.3 update there, retaining the same original gate and all unrelated milestone statuses."
    },
    {
      "name": "tracking-and-format-ready",
      "command": "pnpm progress:generate; pnpm check:progress; pnpm spec:validate; pnpm spec:first; pnpm exec prettier --write [changed authored files]; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "pass",
      "failures": 0,
      "note": "progress-final.log passes 41 tasks/184 evidence records; spec-validate-ready.log passes 6 validators/211 chapters/95 requirements; spec-first-ready.log passes 37 protected files and 6 canonical chapters. Formatting passes. M7.3 retains In progress and the original native gate. Dependency installation and actual native requalification remain pending guarded review-app shutdown."
    },
    {
      "name": "combined-archive-refresh",
      "command": "pnpm storybook:stop -- --port 7491\npnpm local:install .local/archives/native-popout-and-file-navigation.json",
      "result": "pass",
      "failures": 0,
      "note": "Normal guarded review Quit is independently recorded in E-REPO-050. install-combined-archives.log installs all 14 checksum-verified archives/routes, replacing only Core 2e6fa2d8 and API 8fd98e22. Tracked dependency files remain unchanged. Existing Svelte 5.56.10/5.57.2 peer warning and intentionally ignored dependency build scripts remain visible."
    },
    {
      "name": "ordinary-native-window-gate",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json\nLAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-popouts node --test --test-concurrency=1 tests/desktop/popout-workspace.test.mjs\nLAPIS_DESKTOP_ACCEPTANCE_ROOT=/Users/stevejuma/code/lapismd/lapis-desktop/.local/verification/native-popouts node --test --test-concurrency=1 tests/desktop/popout-host.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "leave-full-build.log rebuilds current renderer/public packages and Acceptance app. native-after-package-refresh.log passes 1/1 with all 14 expected real-App checks. related-host-after-refresh.log passes 2/2 (nine allowed-host checks and explicit no-opt-in denial). Native test processes exit normally; no close or geometry assertion is weakened."
    },
    {
      "name": "final-renderer-after-refresh",
      "command": "node --import tsx --test tests/renderer/popout-effects.test.mjs tests/renderer/popout-host.test.mjs tests/renderer/notes-dispose.test.mjs tests/renderer/notes-leave.test.mjs tests/renderer/integration-history.test.mjs tests/renderer/integration-ports.test.mjs tests/renderer/integration-urls.test.mjs tests/renderer/shell-entry.test.mjs tests/governance/source-audit.test.mjs\npnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "renderer-after-refresh.log: 44/44 pass, including the newly awaited final-persistence cases. leave-types-final.log reports zero errors/warnings. E-REPO-050 separately qualifies actual failed final capture, retained live editor, watcher recovery, Quit retry and cold retained diff."
    },
    {
      "name": "ordinary-bundle-isolation-final",
      "command": "pnpm exec tauri build --debug --bundles app\npnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "ordinary-bundle-final.log builds the current ordinary Preview app in 1m01s; existing compact-unwind advisory remains. ordinary-bundle-audit.log/.local/bundle-check.json qualify macOS ARM64, expected app identity, public production renderer, zero acceptance markers and no Node/Deno runtime. Signing/publication remain deferred."
    },
    {
      "name": "final-main-closeout",
      "command": "pnpm progress:generate\npnpm check:progress\npnpm spec:validate\npnpm spec:first\npnpm check:architecture\npnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Main closeout passes with 41 tasks/189 evidence records, 6 validators/216 chapters/95 requirements, 52 protected files/8 canonical chapters, source boundaries and explicit App ownership. Changed authored files formatted. Logs .local/verification/native-popouts/closeout-{generate,progress,spec,first,architecture,ownership,format}.log. Previously recorded actual native tests and ordinary bundle remain current; no source changes followed those passed runs. Wider product suites, provider flows, visual baselines, other platforms and release are not claimed."
    }
  ],
  "completedGates": {
    "M7.3": "The ordinary packaged app opens, edits, saves, redocks and safely closes multiple native windows with no duplicate sessions or stale resources."
  },
  "deferredQualification": [
    "Visual baselines remain pending approval; release, signing, publication and other-platform qualification remain deferred."
  ]
}
```

Verification logs and disposable vaults are under
`.local/verification/native-popouts`. The ordinary review process, profiles and
vault contents are preserved.

The upstream live-layout repair is committed in Design Core at
`2e6fa2d823b8550a7578e802f7e583737f40ce8d`. Its record is
`spec/records/2026-10-20-live-popup-projection.md`: three regressions fail
before, 12 focused and 82 complete workspace-core tests pass after, source types
are clean, the affected fixture family passes 3/3, and final specification
validation/mdBook/spec-first pass. The verified public archive SHA-256 is
`c83d81ddc3c83703c0c77e9c57d99ed4881cc980aa687a1fa923c7f7cffa489a`. The ignored
manifest `.local/archives/native-popout-live-projection.json` preserves all
fourteen installed package entries while replacing only Design Core. The
combined archive graph below is now installed after normal guarded Quit; no
forced process termination or live dependency reload was used.

Desktop qualification uses the combined verified fourteen-package manifest
`.local/archives/native-popout-and-file-navigation.json`, which replaces only
Design Core and API. The additional API navigation repair is committed at
`8fd98e22ffe81d89e064cb6630556970c74350d3`; E-REPO-046 retains its source
checks, archive checksum and original ordinary-App regression. Both original
native cases pass against the refreshed graph; original gates are unchanged.
