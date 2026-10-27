# Pending coherent Desktop cutover intake

```json
{
  "id": "E-CORE-046",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M16.10"],
  "requirements": [
    "LD-AI-005",
    "LD-AI-006",
    "LD-AI-007",
    "LD-GOV-006",
    "LD-GOV-010"
  ],
  "contractReview": "Prepare qualified installed-provider acceptance source without transferring its older Core/public-input proof. Candidate native input selects landed Notes cd997c2c and the freshly built API/AppProfile pair is installed through the explicit private 31-archive overlay. Native current-cohort acceptance remains pending. Installed application, feature defaults and user profile remain unchanged.",
  "milestoneReview": "M16.10 retains its original Done gate through E-CORE-043/044. Imported E-CORE-045 remains immutable older-cohort evidence. R7 coherent Desktop intake and actual new-cohort acceptance remain pending; no M10/default/distribution completion is claimed.",
  "versions": {
    "desktopBaseline": "40b50d3e1e2ef375db62485b3dd594553aec902a",
    "providerSource": "85d9b5e10fcb1b70acfc1ad16f99259db6a20a5a",
    "providerQualifiedCore": "b2034168f524316062aaa1db596936a130a5eb74",
    "retainedDefaultNativePin": "0eec081174c3314a58636fecc4a0c227e1f30acf",
    "observedNotesCommitted": "cd997c2cf92ecfa1ce16de1f49ec085d58d026d5",
    "retainedApiArchive": "ef8170a6f77d811f1d62c3c567dc1b07a8c30418ec3fce538f4e3838a09c1cfc",
    "retainedAppProfileArchive": "fe45dedb08125257a84e57933fcddc9685fa6d559a41821a73b0e654608e2068",
    "retainedAgentUiArchive": "58bd5870d6d67bd60a1d1c8724eb31d4359c3d923eb673474f6818b9e7f90b95",
    "candidateNativePin": "cd997c2cf92ecfa1ce16de1f49ec085d58d026d5",
    "candidateApiArchive": "f368081f2451057a56fc7e9ff163c31a1979b76dedf258c93c933179e958255a",
    "candidateAppProfileArchive": "bf1324f71af2cb146ae9be0ac047dd69187c46d047f510ad5ad8cb45d9ad161f",
    "pairBuildSnapshot": "8404bdd25c7182c728339b164866dcde481f1e55",
    "pairBuildWorker": "lapis-r7-runtime-final-main-0553241c-c29d-4269-817f-3da74f772ac8",
    "candidateArchiveCount": 31,
    "verifiedImportRoutes": 117
  },
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-queue.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CORE-045.md",
    "spec/src/history/E-CORE-046.md",
    "spec/src/history/core/index.md",
    "tests/desktop/ai-native-queue-provider.test.mjs",
    "tests/desktop/native-queue-provider/driver.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/current/local-dependencies.md",
    "src-tauri/Cargo.lock"
  ],
  "remaining": [
    "Qualify the selected cd997c2c native source and matching public pair through strict normal/e2e, complete Rust/macOS and actual native admission/provider gates.",
    "Run the complete directly affected renderer/AI/catalog and complete-resource ordinary/e2e bundle gates on this final main cohort.",
    "Preserve required source-workspace native receipts/logs, finish current-cohort qualification, then remove integrated temporary workspaces."
  ],
  "runs": [
    {
      "name": "Existing provider source and clean default baseline",
      "command": "jj st; jj show 85d9b5e1; compare Notes b2034168..d2346704",
      "result": "pass",
      "failures": 0,
      "detail": "Desktop default and provider source were clean. Source tests/contracts and immutable E045 are prepared. Root then landed Notes cd997c2c; its native pin is selected while the old archive overlay remains unchanged pending a coherent pair. Newer API participant/turn types, AppProfile participant/session/observer and saved-state capture, and Core/protocol inputs prevent transferring E045 product results."
    },
    {
      "name": "Current-cohort native and provider acceptance",
      "command": "Refresh coherent source/public inputs, then original strict/native/provider and affected catalog lanes",
      "result": "pending",
      "failures": 0,
      "detail": "No native build, app, provider, UI, installation, publication or user-profile mutation runs during this preparation."
    },
    {
      "name": "Quiet provider opt-out",
      "command": "env -u LAPIS_AI_TEST_CORE_QUEUE_PROVIDER -u LAPIS_AI_TEST_RUNTIME_CONFIG node --test tests/desktop/ai-native-queue-provider.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0,
      "skipped": 2,
      "detail": "Both explicit skips execute no native app or provider. This verifies quiet discovery only, not actual current-cohort acceptance."
    },
    {
      "name": "Initial documentary validation",
      "command": "pnpm exec spec-validator validate",
      "result": "fail",
      "failures": 1,
      "detail": "The added intake introduction made current/migration.md402physical lines. Condensed only the new checkpoint text while preserving separate original gates; exact validation is rerun below."
    },
    {
      "name": "Source preparation and documentary closure",
      "command": "node --check <provider test/driver>; node scripts/source-audit.mjs; node scripts/progress.mjs; pnpm exec spec-validator validate; pnpm exec spec-validator first",
      "result": "pass",
      "failures": 0,
      "detail": "Provider test/helper and immutable E045 match source 85d9 exactly. Source boundaries, syntax and 58-task/323-evidence progress pass. After the initial 402-line refusal, exact canonical validation passes 6 validators/368 chapters/116 requirements; mapped gate passes 5 protected files/6 chapters. No native build or provider dispatch ran."
    },
    {
      "name": "Default-owned prerequisite retention",
      "command": "Verify SHA256/package identities and retain31existing archives plus available receipt JSONs under .local/qualification/r7-cohort",
      "result": "pass",
      "failures": 0,
      "detail": "All 31 tarball identities/digests verified and 4,865,206 bytes retained, including 16 payloads previously residing in temporary workspaces. Three existing source receipt JSONs also retained. The 29 unchanged prerequisites await the matching new API/AppProfile pair. No archive installation or current configuration selection occurred."
    },
    {
      "name": "First private overlay preparation",
      "command": "node .local/r7/install.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Stopped before manifest mutation or pnpm installation because this checkout reports an absent override policy as null. The owned private preparation now recognizes null/undefined as absent while retaining configured policy; no product or dependency assertion changed."
    },
    {
      "name": "Fresh pair assembly and normal private installation",
      "command": "Verify final-main pair provenance; node .local/r7/install.mjs; select workspace-local candidate inventory",
      "result": "pass",
      "failures": 0,
      "detail": "The pair comes from five fresh internal package builds plus source-owned API/AppProfile packs at frozen8404, content-identical to landedcd997. All31 default-owned archives and117 transitive import routes verify. Both tracked package.json and pnpm-lock.yaml bytes match baseline40b50d3e after projected-lock/frozen install. The owned Storybook supervisor was stopped first. No global configuration, dependency patch, source alias, installed app or user-profile change."
    },
    {
      "name": "Exact quiet consumer before and after pair refresh",
      "command": "node --import tsx --test tests/renderer/ai-native-queue.test.mjs tests/renderer/native-chat.test.mjs tests/governance/local-archives.test.mjs tests/governance/archive-development-dependencies.test.mjs",
      "result": "pass",
      "tests": 16,
      "failures": 0,
      "detail": "Before16/0 on the retained pair; after16/0 on the new pair. This is renderer transport and archive-admission evidence, not native or provider acceptance."
    },
    {
      "name": "Quiet public consumer type compatibility",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check:types",
      "result": "pass",
      "failures": 0,
      "detail": "Svelte check completes with0errors/0warnings using the newly installed public pair. No app window or native compiler runs."
    },
    {
      "name": "Native lock preparation and resource checkpoint",
      "command": "Compare Core Cargo manifests and current consumer lock; df -h .",
      "result": "pending",
      "failures": 0,
      "detail": "Added only lapis-app-core\u2019s new serde_yaml dependency edge to the already pinned0.9.34+deprecated package/checksum. Frozen --locked validation remains pending. About28GiB was available, below the30GiB native guard; the shared Mac compiler slot is coordinated by Root and no Cargo job ran in this lane."
    },
    {
      "name": "Qualified source ancestry integration",
      "command": "jj --config signing.behavior=drop rebase -r @ --onto85d9b5e1; restore exact saved candidate b53fa976; compare complete tracked trees",
      "result": "pass",
      "failures": 0,
      "detail": "Only the uncommitted intake change was rebased. Seven expected overlapping doc/pin conflicts were resolved from the saved candidate tree; complete before/after tracked-tree comparison is empty. Immutable85d9 is now an ancestor, preserving40b50 baseline and original provider source. No finalized commit or product/input delta."
    }
  ],
  "gaps": [
    "Current-cohort acceptance is pending. Historical native and source counts remain scoped to their original receipts."
  ]
}
```
