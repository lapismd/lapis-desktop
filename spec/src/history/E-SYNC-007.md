# Native Sync Tauri account transport

```json
{
  "id": "E-SYNC-007",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-SYNC-001",
    "LD-SYNC-002",
    "LD-GOV-003",
    "LD-GOV-005",
    "LD-GOV-009",
    "LD-GOV-010",
    "LD-AI-002",
    "LD-REPO-001"
  ],
  "contractReview": "Tauri transport binds the caller window to the native admitted session and captured profile/vault/root, retains Core ownership, revalidates after waits and does not expose credentials or select fallback providers. Native work is awaited outside host locks.",
  "acceptanceReview": "Current Corec32/JJ086 passes six actual macOS scope/Keychain cases without skips, strict normal/e2e Clippy and both native builds. Complete native API inventory passes25/28 with3existing AI quarantines; portable checks,787Node/746AI/281Rust, build and spec pass. This is local boundary evidence; connected-account, locked-Keychain, full encrypted Sync, hosted and release qualification remain open.",
  "versions": {
    "desktopLeaveInput": "6fe0833674c782b20432acc2c406873cb82bdd6d",
    "main": "1717bbe3ccc3",
    "core": "5d3d463b57221e6e0be46618c0ec00db3c1938e6",
    "desktopLeaveQualifiedSource": "3fd0c987f79c7d09ebeaf90e108645cb6b526a0a",
    "acpSource": "9a98293c26524c9320acdd9767e34e8ffdd7170c",
    "acpArchiveSha256": "fa2fa5077831b21f482c93f7358332516b455a17d2f05a6445fc07e4ffd1486a",
    "acpBinarySha256": "b14c72f46f3b0f245841992cc7fb34685a17f75feb0a56cdbeffa29de5de0d13",
    "currentInput": "f59ca6b55b6d8f2cc49f2a7a57c5ae8261346c74",
    "currentCore": "c32b5ae48b24c98dfa8de2004cf68e0496cd63bd",
    "currentJjStore": "086def182eae2ab6e5dc39aba030390d7ea8612c",
    "currentCliSha256": "b1403a51cb41ee4c35d6f8d0b33149c0b71e1c85a479621342e01466f237d9c7",
    "finalPrimary": "3b434932e558556b79f7a4f9b1777cfc4b72ffb0"
  },
  "files": [
    "spec/src/navigation/history-02.md",
    "spec/src/current/desktop.md",
    "spec/src/current/lapis-sync.md",
    "spec/src/history/E-SYNC-007.md",
    "scripts/desktop-api-tests.mjs",
    "tests/desktop/sync-account.test.mjs",
    "spec/src/current/governance.md",
    "scripts/native-optional-inventory.json",
    "src-tauri/src/sync/account.rs",
    "src-tauri/src/sync/account/presentation.rs",
    "src-tauri/src/host/sync/mod.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/lifecycle.rs",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "scripts/source-audit.mjs",
    "tests/governance/source-audit.test.mjs",
    "tests/desktop/sync-custody.test.mjs",
    "src-tauri/Cargo.toml",
    "src-tauri/tests/fixtures/sync-custody.rs",
    "scripts/prepare-acp-acceptance.mjs",
    "spec-validator.config.mjs",
    "src-tauri/src/host/ai/imports/tests.rs",
    "src-tauri/src/host/ai/policy/tests.rs",
    "src-tauri/src/host/repository/policy/tests.rs",
    "spec/src/current/ai.md",
    "spec/src/current/repository.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/verification/lapis-sync.md",
    "spec/src/backlog/lapis-sync.md"
  ],
  "runs": [
    {
      "name": "Native Sync API subset is not inventoried before test infrastructure",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Exit1 before build:existing API runner accepts only ordinary/--onnx. This proves missing selected acceptance entry, not native command behavior. Add a fixed Sync-only subset while keeping these cases in the complete default API inventory; actual IPC unavailable boundary follows."
    },
    {
      "name": "Exact native ACP source build stops at unchanged free-space gate",
      "command": "PinnedAI9a98 pnpm dev:cargo -- build --locked --bin lapis-acp",
      "result": "fail",
      "failures": 1,
      "detail": "20.9GiB free; source-owned managed Cargo requires30GiB. Guard not lowered. Official published v0.2.0 tag resolves exactly9a98; its aarch64-apple-darwin archive and SHA256SUMS match the recorded GitHub asset digest. Release binary stages into task-owned source output only, with Mach-O arm64 and system-library linkage verified. No installed application, user cache or production profile modified."
    },
    {
      "name": "Native consumer dependency bootstrap from verified public archives",
      "command": "Existing local:install implementation and verifyArchiveGraph",
      "result": "pass",
      "failures": 0,
      "detail": "Eight checksum/source-verified candidates installed; all32actual import routes fingerprint correctly and each archive has one context. Tracked manifests/lock preserved. This is host-native dependency preparation, not product test or platform qualification."
    },
    {
      "name": "Native Sync test requires explicit optional inventory ownership",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Before build, fail-closed native coverage rejects the new sync-account.test.mjs as unclassified. Register it as optional API coverage owned by lapis-sync; retain every guard and original default inventory. No native IPC or product case executed."
    },
    {
      "name": "Native baseline stops at missing bundled CLI resource",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-api-unavailable-before-2.log:Cargo compilation reaches Desktop build.rs, then resource generation refuses absent resources/lapis-cli. No Sync IPC case executed; not a command-behavior baseline. Prepare the real CLI from the pinned Core revision with the existing cli:prepare owner script; no placeholder resource or assertion change."
    },
    {
      "name": "Pinned release CLI prerequisite built and signed locally",
      "command": "CARGO_BUILD_JOBS=2 pnpm cli:prepare",
      "result": "pass",
      "failures": 0,
      "detail": "Real pinned Core5d3d release build completed in2m24s for aarch64-apple-darwin; task-owned binary SHA256283f22f03f16ba6f75664bcdd4af704a5c998e08844adc03381a184b09c07489. This is test prerequisite evidence only, not Sync IPC or distribution qualification."
    },
    {
      "name": "Native baseline next refuses absent AI bundle",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-api-unavailable-before-3.log:build.rs next refuses resources/lapis-ai. No native case executed. Stage the recorded official exact-source release bundle through existing ai:prepare --bundle verification; retain source-build free-space gate and no-placeholder policy."
    },
    {
      "name": "Published exact-source AI bundle verified and staged",
      "command": "pnpm ai:prepare -- --bundle .local/native-sdk/lapis-ai-0.2.0/unpacked/lapis-ai-0.2.0-aarch64-apple-darwin",
      "result": "pass",
      "failures": 0,
      "detail": "Owning bundle verifier accepts the recorded official release payload and stages into task-owned src-tauri/resources/lapis-ai. Frozen source-tooling install supplies its TOML parser; no source, global cache or installed app changes. This is prerequisite preparation only."
    },
    {
      "name": "Native baseline reaches renderer build but signed-plugin fixtures are absent",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-api-unavailable-before-4.log:real native ACP fixture builds, but Vite refuses absent .local/native-install/public.json. Existing prepareDistributionFixtures then refuses missing verified portable-candidates manifest; attempt5 repeats that prerequisite failure. No IPC test case executes. Prepare real pinned portable/Tasks artifacts using existing fixture ownership, never a placeholder public.json."
    },
    {
      "name": "Real pinned portable and Tasks fixtures prepared",
      "command": "Existing plugin release/signing helpers, buildTasksArtifact and prepareDistributionFixtures",
      "result": "pass",
      "failures": 0,
      "detail": "Word Count source879581d1 built from a clean independent task checkout; signed test bundle and verified Tasks7e25dc5c public archive supply real acceptance fixtures. Disposable signing key removed in finally. No publication, fabricated fixture or installed app replacement."
    },
    {
      "name": "Exact actual macOS hidden-WebView unavailable Sync transport baseline",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 2,
      "detail": "Log.local/sync-api-unavailable-before-6.log:actual cold native e2e bundle executes2cases;0pass/2fail/0skipped. Both fail at desktop_sync_open not allowed:Command not found. Background visibility/focus checks and real vault selection execute. This is the native IPC before boundary, distinct from earlier prerequisite failures."
    },
    {
      "name": "Exact actual macOS hidden-WebView scope transport after implementation",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-api-after-scope.log:original2cases now2pass/0fail/0skipped in10.45s. Actual cold native process restart preserves logical profile identity; replacement/detach reject stale handles, renderer root injection refuses, safe complete DTOs match and note bytes remain unchanged. Real macOS hidden/unfocused WebView only; no Keychain credential IO, account connection, headed UI or hosted/release claim."
    },
    {
      "name": "Native scope transport and default-disabled cold acceptance",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-api-scope-disabled.log:3pass/0fail/0skipped in11.10s, original2cases plus cold default-disabled case. Without host selection, native scope command refuses ENOTSUP, no Sync directory/profile witness is created and working note bytes remain unchanged. No Keychain account IO or hosted/release qualification."
    },
    {
      "name": "Exact capability audit requires bounded Sync transport grants",
      "command": "pnpm check:architecture",
      "result": "fail",
      "failures": 1,
      "detail": "Report6d127a23-d8a7-4fa5-8a6a-06acae0a3c62:LD-CAPABILITY-SCOPE rejects newly registered open/snapshot/detach permissions until its exact allowlist follows the new contract. Add only those3named local-main grants and retain rejection of other windows, disabled local policy, wildcard/default or unimplemented account-call grants."
    },
    {
      "name": "Native replaced-root case preserves existing recovery error classification",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-api-scope-root.log:3pass/1fail of4. New replaced-private-root case expected EACCES, but the existing profile identity contract deliberately returns InvalidData, mapped to EINVAL with recovery-required message. Retain production classification; require exact EINVAL/recovery text and no new profile metadata, alongside original-scope restoration and byte preservation. Existing3cases pass."
    },
    {
      "name": "Exact bounded capability audit after registration intake",
      "command": "pnpm check:architecture",
      "result": "pass",
      "failures": 0,
      "detail": "Report7d538f95-3075-4b0f-a463-14c5dee29ccd:source boundaries pass with exact3named local-main Sync grants. Separate audit regression family follows; no wildcard/default or account-call grants added."
    },
    {
      "name": "Native private-root recovery acceptance after exact classification correction",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-api-scope-root-after.log:4pass/0fail/0skipped. Replaced private root refuses with exact existing EINVAL/recovery message, creates no replacement identity, restores the original admitted scope when the original root returns and preserves working bytes."
    },
    {
      "name": "Isolated native custody qualification lacks executable probe",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "fail",
      "failures": 1,
      "detail": "Log.local/sync-custody-unavailable-before.log:4scope passes/1custody failure of5cases. New custody case cannot launch missing native probe(ENOENT); no OS write occurred and no Keychain behavior is qualified. Add an e2e/debug-only fixture using the actual production adapter, bounded task roots and fixed task-only item key; its cleanup accepts only its own namespace."
    },
    {
      "name": "Actual macOS scope and Keychain adapter acceptance",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-custody-after.log:5pass/0fail/0skipped. Actual production AccountCustody writes and cold independent native processes read its isolated OS item; another captured profile sees no item, no custody bytes become profile files, cleanup removes the item and another process confirms missing. Probe SHA2561a8a417f35f6a9c7d357ee9c6488083aa401583c43df5974467f42ad73fa0943, Desktop source67e3a09f51d0cfee647d860a19848d171fa9712d. This qualifies that local macOS adapter boundary only, not locked-Keychain, connected account, hosted or release gates. Add process-local noninteractive guard, bounded probe timeout and artifact-hash checks for the retained lane."
    },
    {
      "name": "Actual noninteractive and hash-verified macOS custody acceptance",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-custody-noninteractive.log:5pass/0fail/0skipped. Production-adapter probe explicitly disables OS interaction in its own process, uses10second/8KiB subprocess bounds, and verifies staged binary bytes against recorded SHA256098cf4a8c4fab60c2cb1ddf7b1f7dc1ae6c2762aef215b5a16e18bc5509441a4; actual OS entry cleanup and subsequent missing read pass. Desktop source659f09efd3d7e44454842d85f6136dc65b3d5e1d. Add native refused/accepted vault-close scope case and guard source identity across fixture compilation."
    },
    {
      "name": "Native refused/accepted close, source-guarded artifacts and OS custody",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-scope-vault-leave.log:6pass/0fail/0skipped in14.60s. Real native database keeps vault close busy; same Sync handle/snapshot survives that refusal, accepted close rejects stale scope and reopen keeps profile identity/working bytes. Source identity is checked before/after fixture compilation; Desktop snapshot3ae311ea5dd7475db0552d03209b94784e39833c. Other5cases include actual noninteractive Keychain write/cold read/wrong-profile/verified cleanup. These results belong to Core5d3d/JJ87be input; new-main cohort requires fresh native acceptance."
    },
    {
      "name": "Align unpublished bridge with current shared-remotes source cohort",
      "command": "jj rebase -r ovsomrzs -o internal/sync-remotes-input@task-input",
      "result": "pass",
      "failures": 0,
      "detail": "Rebase only unpublished bridge onto task inputf59ca6b5, whose full portable check/test/build/spec/static passed and full coldcatalog is still running. Resolve3documentation conflicts by retaining all parent CLI/remotes/Sync receipts plus E-SYNC-007; preserve3fd0c987/37104689 and earlier qualified hashes. Native6case/Keychain proofs above belong to old5d3d/87be cohort; rerun exact native cases and complete API/source lanes for currentc32/086."
    },
    {
      "name": "Current-main native prerequisites and installed archive graph",
      "command": "pnpm local:install; verifyArchiveGraph; CARGO_BUILD_JOBS=2 pnpm cli:prepare",
      "result": "pass",
      "failures": 0,
      "detail": "Eight verified archives install with tracked files restored; explicit complete installed-graph verification checks55physical import routes against tarball bytes(one selected lock context per candidate). Current Corec32 CLI release builds in2m24s; SHA256b1403a51cb41ee4c35d6f8d0b33149c0b71e1c85a479621342e01466f237d9c7. These installed-native routes are distinct from the clean portable32route receipt."
    },
    {
      "name": "Exact native scope and OS custody on current-main source",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-remotes-native-exact.log:6pass/0fail/0skipped on current Corec32/JJ086. Actual cold scopes, private-root recovery, refused/accepted native vault close and noninteractive isolated Keychain write/cold-read/cleanup all pass."
    },
    {
      "name": "Complete explicit native API inventory on current-main source",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-remotes-native-full-api.log:25pass/0fail/3existing skipped of28 in101.17s; all6new Sync cases execute and pass. Existing AI admission/queue cases retain quarantines E-RELEASE-008/010/014 and remain unqualified, not substituted by the other passes. Source-guarded fixture/Desktop snapshot5a9b2903ff3d28503a1eb86c7f6786151e3ec77f. No complete-native-feature, connected-account, locked-Keychain, hosted or release claim."
    },
    {
      "name": "Portable normal all-target check exposes missing optional state in guard fixtures",
      "command": "pnpm check",
      "result": "fail",
      "failures": 3,
      "detail": "Report934d0c67-c7b4-43cb-995b-745f83d1c44e:Rust E0063 in existing AI import, AI policy and repository policy NativeServices fixtures; each lacks the new optional sync field. Preserve their unrelated guard behavior with explicit sync:None, matching disabled production selection. No assertion or native-quarantine changes."
    },
    {
      "name": "Exact normal all-target compiler check after optional fixture initialization",
      "command": "pnpm check:rust",
      "result": "pass",
      "failures": 0,
      "detail": "Report908dfe0b-0b3b-4a37-ac7a-29febb70656b:all3original missing-field errors resolve with explicit sync:None in unrelated AI/repository guard fixtures. No assertions or quarantine changes. Current full portable suite is running; native API preparation additionally enforces real macOS strict normal/e2e compilation and normal build before the e2e bundle, without launching the normal app."
    },
    {
      "name": "Complete portable bridge source checks after disabled-fixture repair",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Reportf6742200-0f4c-4698-ac47-f65295503b34:complete types, architecture/App ownership, strict normal/e2e Rust and formatting pass. This snapshot precedes additive actual-macOS compiler preflight in the API runner; final shared-runner checks follow."
    },
    {
      "name": "Complete portable bridge test surface",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "Reportdc356544-4850-48f0-b8dc-177fb4aba88f:787Node,746AIpolicy and281Rust passes;0failures,2existing invoked subprocess-helper ignores. No new native qualification substitutes."
    },
    {
      "name": "Portable bridge production build and canonical specification",
      "command": "pnpm build; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Production builde91abdc5-e243-4514-bd11-02272a200be2 and full4lane spec1891a243-f24a-4c2b-977a-90e2d1f7a99b pass before additive native compiler preflight."
    },
    {
      "name": "Actual macOS strict compiler, both build configurations and exact Sync API",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api --sync",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-native-compiler-and-api.log:real macOS ARM64 strict all-target Clippy passes in normal and e2e modes; normal native binary builds without launch and actual e2e bundle builds. All6unskipped Sync/OS cases pass after this preflight. No normal application/user profile is launched. Rerun complete shared API inventory and final script/governance lanes for the stricter runner."
    },
    {
      "name": "Complete native API inventory under strict macOS compiler preflight",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_PORTABLE_FIXTURES=<task-manifest> pnpm test:native:macos -- api",
      "result": "pass",
      "failures": 0,
      "detail": "Log.local/sync-native-compiler-full-api.log:25pass/0fail/3existing skipped of28 in101.13s after actual normal/e2e strict all-target Clippy, normal binary and cold e2e bundle builds. All6Sync cases execute. Existing AI quarantines E-RELEASE-008/010/014 remain unqualified; no hosted/release claim."
    },
    {
      "name": "Final complete portable stricter-runner qualification",
      "command": "pnpm check; pnpm test; pnpm build; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Reports788b267b-e3a5-45ab-bea0-81d748878250(check),4fd2d666-834b-446d-af8b-f872f107a899(test),fde1ecd7-ad75-4b13-8de1-35d89594a1dc(build),312c2d6c-e4bf-428c-b42a-06c4baafe38a(spec). Complete types/architecture/App ownership/strict compiler/format pass;787Node,746AIpolicy and281Rust pass, two existing invoked helper ignores. No new skipped cases."
    },
    {
      "name": "Final local boundary verification and backlog documentation",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Report54a05c47-3bc9-4592-9fe2-a7cb3809e125:all4lanes pass after recording actual local six-case scope/Keychain proof, complete native inventory25/3quarantines and remaining account/hosted/release gates in canonical verification/backlog. Aggregate remains pending because full feature gaps remain."
    },
    {
      "name": "Final source-equivalent parent alignment",
      "command": "jj git fetch --remote task-input; jj rebase -r ovsomrzs -o internal/sync-remotes-input@task-input",
      "result": "pass",
      "failures": 0,
      "detail": "Only unpublished ovsomrzs follows final primary3b434932; all previously qualified hashes stay intact. Parent tree differs from importedf59ca6b5 only in NativeRemotes story, owning Plugins contract and E009. No native/runtime/dependency/shared-fixture changes. Primary independently qualifies story4/4,family16/16,affected shard520/0 and unchanged12batches1648/0; complete source checks pass. Retain actual native evidence at its recorded source/hash; this alignment does not claim a new exact-head native execution. Final documentation/spec checks follow."
    }
  ],
  "remaining": [
    "Hosted source CI and dependency-ordered PR delivery/merge; existing3native AI quarantines remain unqualified.",
    "Bounded account command/observation transport, native leave ownership, browser handoff and explicit App injection; real account and locked-Keychain acceptance.",
    "Enrollment, content history/transfer/apply, automatic participation, conflicts/recovery and independent-device Sync qualification."
  ]
}
```
