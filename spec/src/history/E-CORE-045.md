# Actual installed-provider native queue acceptance

```json
{
  "id": "E-CORE-045",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.10"],
  "requirements": [
    "LD-AI-005",
    "LD-AI-006",
    "LD-AI-007",
    "LD-GOV-006",
    "LD-GOV-010"
  ],
  "contractReview": "Actual installed-provider native half of Notes R4.1.6 passes through the existing Agent/History screens, trusted read-only declaration and omitted model/effort. Dispatched Stop retains Unknown/vault_closed_during_turn and is never resumed. The successful cold-resume branch uses a labelled offline retained-state fixture copied from a real completed queue after clean process exit, preserving its native target guard; it makes no live-admission claim.",
  "milestoneReview": "M16.10 remains Done through E-CORE-043/044, with this supplemental actual-provider proof selected separately. Hosted R4.1.6 passed three configured cases in dfdf57e6. This completes no broader M10, default, distribution or release gate. Continue R7 cutover and deferred test repairs; start no additional R4 feature work. R5/R6 remain Deferred.",
  "versions": {
    "desktopMain": "40b50d3e1e2ef375db62485b3dd594553aec902a",
    "queueSource": "151e4f12bd7742b20df5ad0466ab1b25adac3b10",
    "qualifiedCore": "b2034168f524316062aaa1db596936a130a5eb74",
    "notesStatusMain": "8275be7ed6af918f94e6a1bce1fee10e8f6b5474",
    "lapisAi": "6548afe0f47c6fa2ff71d326a5f6e8ce4ebbebd8",
    "actualAcpHelperSha256": "9181b38679aed2c713c225cf8d73a134743b736f113feeb8003f315521530be7",
    "hostedProviderCommit": "dfdf57e623e420d773dcc792957e2efdfaf3174a",
    "apiArchive": "ef8170a6f77d811f1d62c3c567dc1b07a8c30418ec3fce538f4e3838a09c1cfc",
    "appProfileArchive": "fe45dedb08125257a84e57933fcddc9685fa6d559a41821a73b0e654608e2068",
    "agentUiArchive": "58bd5870d6d67bd60a1d1c8724eb31d4359c3d923eb673474f6818b9e7f90b95"
  },
  "files": [
    "MIGRATION.md",
    "scripts/validation/native-sources.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-queue.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CORE-045.md",
    "spec/src/history/core/index.md",
    "tests/desktop/ai-native-queue-provider.test.mjs",
    "tests/desktop/native-queue-provider/driver.mjs"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Acceptance coverage before this slice",
      "command": "Read retained R2 provider targets and E-CORE-043; new native queue provider target",
      "result": "pending",
      "failures": 0,
      "detail": "Existing real-provider proof covers one turn and History; M16.10 covers full native queue semantics with deterministic peers. Actual installed queue Stop/default omission/detached completion/cold retained resume is not yet qualified. No product regression or artificial missing-test failure is claimed."
    },
    {
      "name": "First provider native build attempt",
      "command": "node .local/qualification/native-build.mjs queue-provider-e2e",
      "result": "fail",
      "failures": 0,
      "detail": "The required 30 GiB free-space guard stopped the build before compilation at about 25.6 GiB. No provider prompt ran; preserve both qualified targets, binaries, receipts, profiles and model data during audited inactive cache cleanup."
    },
    {
      "name": "Native fixture preparation repair",
      "command": "node .local/qualification/native-build.mjs queue-provider-e2e",
      "result": "fail",
      "failures": 1,
      "detail": "A second attempt passed the disk guard but stopped before compilation because the private validation receipt directory was absent. Created it and retained this preparation failure separately."
    },
    {
      "name": "Opt-in acceptance first attempt",
      "command": "LAPIS_AI_TEST_CORE_QUEUE_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<original-R2-config> node --test --test-concurrency=1 tests/desktop/ai-native-queue-provider.test.mjs",
      "result": "fail",
      "tests": 2,
      "failures": 2,
      "detail": "Both cases reached no provider dispatch: the old private R2 configuration selected an incomplete generated source bundle (bundle_file_unavailable). A read-only diagnostic confirmed that refusal; its clean-close expectation also failed because the new test audit held every lifecycle result. Retained both original receipts and diagnostic."
    },
    {
      "name": "Qualified runtime and driver diagnostics",
      "command": "Same two-case target with private complete-bundle configuration",
      "result": "fail",
      "tests": 2,
      "failures": 2,
      "detail": "Retained kMdPwC and egKOXl. Actual head plus queued completion without observers passed. Test driver cancellation used an unsupported WDIO asynchronous map, and a real page reload discarded its audit. Repair uses sequential element resolution, arms only the requested reload hold, reinstalls the audit after navigation and records native refusal/UI diagnostics. No product assertion or runtime contract was weakened."
    },
    {
      "name": "Exact Stop driver target before visible-control selection",
      "command": "node --test --test-name-pattern=\"installed provider queue Stop\" tests/desktop/ai-native-queue-provider.test.mjs with explicit provider opt-in",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "detail": "Retained 7ceK3h. The first matching Pause button produced no native Stop command and the head completed normally. Final driver resolves the visible enabled control, focuses/hit-tests it and requires the matching finished queue command before reading the outcome."
    },
    {
      "name": "Exact repaired targets",
      "command": "Explicit provider opt-in with each installed provider queue name pattern",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "detail": "Stop zjiJEf 38.8s and completion/resume HkahtW 76.1s both passed. Final source formatting followed; the complete pair was then run again cold."
    },
    {
      "name": "Final actual native provider pair",
      "command": "LAPIS_AI_TEST_CORE_QUEUE_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<private-complete-bundle-config> node --test --test-concurrency=1 tests/desktop/ai-native-queue-provider.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "skipped": 0,
      "detail": "Final receipts NwOOwU (36.2s) and a5vLS3 (76.9s), 113.5s aggregate. Exactly four real provider requests: one stopped Unknown, two known completions with all observers detached, and one explicitly resumed completion. Unknown keeps explicit_stop then cold service_restarted, one journal, unchanged entries/transcript and zero cold submit/accept/resume. Offline retained work is seeded only after clean exit from an actual completed queue; cold observation dispatches nothing, existing UI Resume submits the exact known head once, and subsequent cold history has no replay."
    },
    {
      "name": "Related hidden native admission and queue ownership",
      "command": "node --test --test-concurrency=1 tests/desktop/ai-native-queue-admission.test.mjs tests/desktop/ai-native-queue-owner.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "detail": "Real native caller/admission, browser-authority refusal, Stop/cancel/resume identity, cold pause and retained Core owner all pass in 15.1s."
    },
    {
      "name": "Quiet opt-out",
      "command": "node --test tests/desktop/ai-native-queue-provider.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "skipped": 2,
      "detail": "Both intentional skips require explicit installed-provider opt-in. No native app or provider launches in the quiet default."
    },
    {
      "name": "Pinned native Rust compatibility",
      "command": "LAPIS_DESKTOP_BASE=40b50d3e1e2ef375db62485b3dd594553aec902a node .local/qualification/snapshot-batch.mjs queue-rust",
      "result": "pass",
      "tests": 258,
      "failures": 0,
      "skipped": 2,
      "detail": "Docker face6d7a-52cf-4f69-9659-2e51efa20352: strict normal/e2e and all Rust cases pass; two unchanged subprocess-helper ignores remain. Selected b203 source adds context/bootstrap modules, so this gate was rerun despite unchanged queue/transport implementation. All 31 archives and 117 public import routes verify."
    },
    {
      "name": "Both complete native app configurations and ordinary bundle audit",
      "command": "node .local/qualification/native-build.mjs queue-provider-e2e; node .local/qualification/native-build.mjs queue-provider-ordinary ordinary; node scripts/check-bundle.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Both native builds verify complete packaged AI resources. Ordinary arm64 bundle contains 330 renderer JavaScript chunks and zero automation markers. The acceptance app and private runtime configuration use its verified resources; ACP hash remains 9181b386 and installed-client paths are unchanged, with no model, effort or duration override. A non-fatal macOS linker unwind warning is retained."
    },
    {
      "name": "Hosted actual-provider half",
      "command": "Notes hosted-provider-queue qualification in dfdf57e623e420d773dcc792957e2efdfaf3174a",
      "result": "pass",
      "tests": 3,
      "failures": 0,
      "detail": "Immutable spec/records/2026-10-27-hosted-provider-queue.md: Stop 3FLl8p, offline retained resume 3VM37v and retained R2 JN1uAj pass. Web strict, complete public 584-member equality, canonical and opt-out checks pass. This native evidence links that separate owner proof without relabelling earlier failed attempts."
    },
    {
      "name": "Safe local-space recovery",
      "command": "Audited inactive compiler-cache cleanup and SHA-verified independent APFS clones",
      "result": "pass",
      "failures": 0,
      "detail": "Removed only 6.20 GiB inactive non-executable compiler libraries/metadata/objects after compiler/open-file checks. Replaced 79 byte-identical immutable terminal-run jj-store.tar copies with independently addressable APFS clones, preserving all paths, SHA256 bytes, status records and metadata; no hardlinks. Recovered about 9.7 GiB physical space. All binaries, bundles, qualified targets, profiles, vaults, models and reports remain."
    },
    {
      "name": "macOS host units",
      "command": "node .local/qualification/mac-rust.mjs provider-host --host",
      "result": "pass",
      "tests": 55,
      "failures": 0,
      "detail": "All native Tauri host policy and transport unit cases pass against the same pinned source and archives; no window or provider dispatch is involved."
    },
    {
      "name": "First documentary snapshot and evidence schema repair",
      "command": "node .local/qualification/snapshot-batch.mjs final-docs; same frozen e29d08b4 input retry",
      "result": "fail",
      "failures": 15,
      "detail": "Initial SSH connection was refused before container creation; preserved its log and retried the same frozen input after guarded SSH succeeded. The worker passed architecture, App ownership and parity, and retained only the accepted unchanged E-AI-109 formatting warning. Progress then rejected this new record because result strings used passed/failed instead of canonical pass/fail (plus a blocked run). Corrected the new evidence metadata; no historical record, assertion or validator was changed."
    },
    {
      "name": "Corrected evidence schema and exact specification byte-limit repair",
      "command": "node .local/qualification/snapshot-batch.mjs final-docs (a811c812-f6b3-4ae6-b551-4c5da5760ca2)",
      "result": "fail",
      "failures": 1,
      "detail": "The exact progress target now passes (58 tasks/322 evidence), as do architecture, App ownership and 113-family parity. Canonical validation then found that this slice added too much explanatory text to verification.md: 32944 bytes exceeds its 32768-byte limit. Replaced only the new E045 paragraph with a concise evidence pointer; existing requirements and historical references are preserved. The full format command still retains only accepted unchanged E-AI-109."
    },
    {
      "name": "Complete specification mapping repair",
      "command": "node .local/qualification/snapshot-batch.mjs final-docs (4273cd96-c7da-4979-91ea-07b83e73c524)",
      "result": "fail",
      "failures": 2,
      "detail": "The exact byte-limit and progress regressions pass, as do all source/parity audits and book generation. Spec-first required the mapped Desktop chapter for new native acceptance files and Migration chapter for tracker changes. Updated their existing checkpoint introductions with the installed-provider proof and separate R7/deferred scope; no requirement, historical record or gate was weakened."
    },
    {
      "name": "Complete documentary closure after exact repairs",
      "command": "node .local/qualification/batch-input.mjs <frozen final-docs input 0885356d-3de3-4afd-8a3b-555be7b3c371>",
      "result": "pass",
      "failures": 0,
      "detail": "Frozen snapshot 7e8f5d334cdab77e14ed88c6eca1fbe439ccb3ad: exact spec-first passes five protected files/five mapped chapters; exact canonical validation and progress pass, with 58 tasks/322 evidence. Source architecture, App ownership, 113-family parity, Rust formatting, all four specification lanes and mdBook pass. The raw full format command retains exactly the previously accepted immutable E-AI-109 warning, byte-identical to the parent; every other file formats. Failed pre-container, schema, byte-limit and mapping attempts remain distinct."
    }
  ],
  "gaps": [
    "R7 default-switch, hosted static delivery and compatibility/deferred test repairs remain separate. R5/R6 are Deferred.",
    "Broader M10, visual review, publication, signing and distribution retain their original gates. No ordinary default or installed profile was replaced.",
    "Immutable E-AI-109 formatting remains the previously accepted unchanged baseline; no history was edited."
  ]
}
```
