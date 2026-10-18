# Cold native pinned history and restart

```json
{
  "id": "E-REPO-006",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-DESK-005",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-007",
    "LD-MIG-002"
  ],
  "revision": "enclosing Jujutsu change ssvlzxtn",
  "versions": {
    "desktopUi": "3aa56eff",
    "notesApi": "a91d5e2e",
    "designCore": "a57a38e2",
    "stockJj": "0.45.1",
    "platform": "macOS ARM64",
    "bundle": "Lapis Notes Acceptance.app",
    "webdriverio": "9.31.2",
    "embeddedDriver": "tauri-plugin-wdio-webdriver 1.5.0"
  },
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/repository.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/index.md",
    "tests/desktop/repository-visible.test.mjs",
    "spec/src/history/E-REPO-006.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md"
  ],
  "result": "pass",
  "remaining": [],
  "runs": [
    {
      "name": "layout-bundle",
      "command": "CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "After 3aa56eff, Vite 28.45s and native 28.40s; isolated 201.65 MiB bundle. Log: jj-store/.local/reusable-conversations/history-visible-native-layout-build.log. Primary Preview app, source fixture and installed applications untouched."
    },
    {
      "name": "first-cold-focus",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/repository-visible.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "history-visible-native-pane-acceptance.log: first window passes unified/split, exact pin, source preservation and external-head refresh. Cold second launch stops at the unchanged 15-second document/native focus guard. Real foreground input was not delivered to that second process in time."
    },
    {
      "name": "before-option-driver",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/repository-visible.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "history-visible-native-pane-assisted.log: physical foreground clicks on both launches reach restored original pin and diff. Selecting the advanced operation times out without changing the pin. WebdriverIO selectByAttribute calls elementClick on an option; the embedded driver implements el.click(), which does not select that option in WebKit."
    },
    {
      "name": "after-option-driver",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/repository-visible.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "One pass in 17.83s after a test-local helper validates the mounted enabled select and its actual option, then sets its value and emits standard input/change events. No controller, IPC or test-only product state is called. All original assertions retained. Physical foreground assistance on both launches. Evidence root .local/native-test/repository-visible-cEGkYP; log history-visible-native-select-fixed.log."
    },
    {
      "name": "strict-native-key-window",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/repository-visible.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "One complete pass in 20.97s after strengthening ready() to require native visibility [visible=true,minimized=false,currentSpace=true,unoccluded=true,keyWindow=true]. Original document focus/visibility and animation-frame guard remains unchanged. Two physical foreground clicks. Exact 128-hex operation pins, real ribbon, unified/split content, dirty files and .jj/.git bytes, external advance without pin movement, cold close/reopen restoration, explicit new pin clearing old diff, later operation content and plain-folder refusal all pass. Both processes exit normally. Evidence root .local/native-test/repository-visible-usFC3C; log jj-store/.local/reusable-conversations/history-visible-native-strict-key-window.log."
    },
    {
      "name": "syntax-format",
      "command": "pnpm exec prettier --check tests/desktop/repository-visible.test.mjs && node --check tests/desktop/repository-visible.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Standalone test syntax and formatting pass before the final strict native run."
    },
    {
      "name": "initial-record-checks",
      "command": "pnpm progress:generate; node --test tests/governance/*.test.mjs; pnpm check:progress; pnpm spec:validate; pnpm spec:first",
      "result": "fail",
      "failures": 4,
      "note": "One governance case, progress validation, specification validation and spec-first reject the incomplete bookkeeping. The new record lacks completedGates for the original M13.2 gate, has not yet been snapshotted by jj for fresh-coverage checks and omits required unchanged desktop/migration chapter mappings. Add the exact original gate confirmation and chapter reviews, snapshot with jj st and repeat these checks. Product/native assertions and the gate string remain unchanged."
    },
    {
      "name": "record-governance-after-mapping",
      "command": "node --test tests/governance/*.test.mjs && pnpm check:progress && pnpm spec:first",
      "result": "pass",
      "failures": 0,
      "note": "After the exact original completedGates confirmation, JJ snapshot and required chapter reviews: all 47 governance tests pass; progress 33 tasks/94 records; spec-first three protected files/three chapters."
    },
    {
      "name": "chapter-budget",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "note": "The added desktop review paragraph exceeds its 32,768-byte budget (33,231 bytes). Retain detailed foreground-assistance evidence in the owning repository chapter and replace the desktop paragraph with a short cross-reference. No limit or requirement is relaxed. A first short appended cross-reference still exceeds the budget (32,856 bytes); replace the existing ownership footer with equivalent concise wording plus E-REPO-006. The original footer has only ten spare bytes."
    },
    {
      "name": "final-document-gates",
      "command": "pnpm check:progress && pnpm spec:validate && pnpm spec:first && pnpm exec prettier --check tests/desktop/repository-visible.test.mjs spec/src/history/E-REPO-006.md spec/src/current/desktop.md spec/src/current/migration.md spec/src/current/repository.md spec/src/current/progress/milestones.md spec/src/current/verification.md spec/src/history/index.md spec/src/SUMMARY.md MIGRATION.md",
      "result": "pass",
      "failures": 0,
      "note": "Progress 33 tasks/94 evidence records; six validators, 109 chapters, 94 requirements; spec-first three protected files/three canonical chapters; all ten changed files pass formatting. Desktop chapter 32,761 bytes within 32,768. Original gate text and assertions remain unchanged or strengthened."
    }
  ],
  "contractReview": "Unchanged LD-REPO-002/LD-DESK-005 and LD-GOV-002/003/007. This slice repairs a test-local embedded-driver interaction and strengthens actual native key-window assertions; source/native/UI behavior, admission, operation identities, receipts and publication are unchanged. Actual native acceptance with physical foreground assistance is distinct from fixture stories and unattended activation.",
  "milestoneReview": "M13.2 is Done within its original macOS ARM64 native history/diff, exact frame and drained-lifetime scope. E-REPO-002 retains native admission/transport/drain proof; E-REPO-003/005 retain presentation qualification; this full cold actual-window target completes the visible restart/source-preservation gate. M13 remains In progress and M13.3 Planned: no durable conversation claim. Unattended foreground activation, other platforms, visual approval and release remain separate gaps.",
  "scope": "Private standalone native test plus owning progress/specification evidence. No shared native harness or production implementation changed, so the exact cold native target, JavaScript syntax, governance and document checks cover this slice. Existing 696-check UI qualification is unchanged; Rust, full catalog and full native OS suites are out of scope for this test-local correction. No baselines, fixture resets, installed-app replacement or unrelated process restarts.",
  "completedGates": {
    "M13.2": "Cold native and visible Notes pinned history/diffs, exact integer frames and drained vault closure."
  }
}
```
