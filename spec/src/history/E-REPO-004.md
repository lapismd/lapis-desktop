# Cold visible native history qualification

```json
{
  "id": "E-REPO-004",
  "tasks": ["M13", "M13.2"],
  "requirements": [
    "LD-REPO-002",
    "LD-DESK-005",
    "LD-GOV-002",
    "LD-GOV-003",
    "LD-GOV-007"
  ],
  "revision": "enclosing Jujutsu change xvrpxklz",
  "versions": {
    "desktopUi": "2209736a",
    "stockJj": "0.45.1",
    "platform": "macOS ARM64",
    "bundle": "Lapis Notes Acceptance.app",
    "rust": "1.99.0"
  },
  "files": [
    "spec/src/SUMMARY.md",
    "spec/src/current/desktop.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/index.md",
    "tests/desktop/repository-visible.test.mjs",
    "spec/src/history/E-REPO-004.md"
  ],
  "result": "pending",
  "remaining": [
    "Complete strict actual-window native history/diff and cold restoration target.",
    "Resolve native key-window/document focus condition without weakening the existing assertion.",
    "Final focused/native lifetime and documentation checks before committing."
  ],
  "runs": [
    {
      "name": "before-target",
      "command": "jj --no-pager file list -r @- tests/desktop/repository-visible.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "No visible history acceptance existed in2209736a. Hidden API E-REPO-002 and production stories E-REPO-003 remain distinct prerequisites."
    },
    {
      "name": "initial-build-prerequisite",
      "command": "prepareDistributionFixtures(); pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "fail",
      "failures": 1,
      "note": "Isolated workspace lacks portable-candidate manifest and native-install/public.json. Build fails before Cargo;preparation uses the primary workspace checksum-verified qualified Word Count candidate and exact staged ACP helpers. No source target copied."
    },
    {
      "name": "isolated-native-build",
      "command": "CARGO_INCREMENTAL=0 MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "failures": 0,
      "note": "Fresh isolated checkout target;7m06s native compile,201.65MiB bundle. No installed app,primary Preview target or user profile touched. Free space49.6GiB before and46.9GiB after. Root E-REUSABLE-PROGRESS-006 records prior inactive AI-target cleanup."
    },
    {
      "name": "initial-fixture",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/repository-visible.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "history-visible-native-first.log:stock jj operation log rejects -r;no app launch. Read-only current ID now uses --at-op=@ --ignore-working-copy op log --limit1 --no-graph -T id."
    },
    {
      "name": "initial-native-selection",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/repository-visible.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "history-visible-native-second.log:actual native app opens fixture and exact128-hex operation pin. A mixed CSS/WebDriver text selector fails before revision interaction;child text queries now scope from the region element. This is harness correction,not product acceptance."
    },
    {
      "name": "retained-focus-condition",
      "command": "MACOSX_DEPLOYMENT_TARGET=13.0 CARGO_BUILD_JOBS=2 node --test --test-concurrency=1 tests/desktop/repository-visible.test.mjs",
      "result": "fail",
      "failures": 6,
      "note": "Third,fourth,fifth,activation-probe,raised-probe and pointer-probe runs each stop at the unchanged15-second focus assertion. DOM visible=true,focused=false;native visible/on-active-space/unoccluded=true and key-window=false. AX Raise does not resolve it;pointer diagnostic ends as the test cleanup quits the app. Cause remains unproven. No assertion,timeout,background mode or native requirement is weakened."
    }
  ],
  "contractReview": "Unchanged LD-REPO-002/LD-DESK-005. New test uses the actual native app,production ribbon/controls,real stock-JJ fixture,exact operations,dirty byte/metadata witnesses,close/reopen and ordinary-folder refusal. No fixture UI or hidden API substitutes for the visible gate. Host/helpers and production code remain unchanged.",
  "milestoneReview": "M13/M13.2 stay In progress. The new visible test remains pending;the existing source/catalog pass and native build do not complete its original gate. M13.3 remains Planned and durable conversations are unqualified.",
  "scope": "Test-only native acceptance slice after2209736a. Primary app remains running and intact;all attempted acceptance processes clean up. Raw logs and temporary fixtures remain under isolated .local/native-test and jj-store/.local/reusable-conversations/history-visible-native-*."
}
```
