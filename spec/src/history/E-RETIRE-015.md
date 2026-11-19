# Qualify App Profile retired-data preservation

```json
{
  "id": "E-RETIRE-015",
  "date": "2026-11-19",
  "revision": "enclosing-change",
  "result": "pass",
  "versions": {
    "desktopBase": "ea4cc229f82f16bd23f9accb8a890793001774fe",
    "serverSource": "83fca8ddd25b7b7913723e231779862f94f7dbcb",
    "serverPeerSha256": "2e7ee6fb4ec3837eee571534039ebb54cbd31dd067738de4c7ae61fa4b8fdcfe",
    "historicalArchiveSha256": "09f0436532ddc5a556d0563877b02856ac5d0abc309f515c9718e24415260a6a",
    "node": "24.15.0",
    "nativeNode": "26.9.0",
    "pnpm": "10.34.5",
    "specValidator": "0.2.1"
  },
  "requirements": ["LD-PLUG-001", "LD-AI-002", "LD-DESK-004", "LD-GOV-002"],
  "files": [
    "scripts/ci-artifact-identity.mjs",
    "src/lib/ai/conversations/metadata-yaml-equality.ts",
    "src/lib/ai/conversations/vault-transcript-store.ts",
    "tests/ai/conversations/vault-transcript-store.test.ts",
    "tests/desktop/ai-core-chat.test.mjs",
    "tests/desktop/ai-notes-binding.test.mjs",
    "tests/desktop/native-session-mode.mjs",
    "tests/desktop/native-session.mjs",
    "tests/governance/native-session-mode.test.mjs",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/native-acceptance.md",
    "spec/src/backlog/ai-qualification.md",
    "spec/src/verification.md",
    "spec/src/navigation/history-02.md",
    "spec/src/history/E-RETIRE-015.md"
  ],
  "contractReview": "Add the missing App Profile native-chat synthetic/original installed-copy preservation cases under normal and Safe Mode startup. When the renderer matrix proved that reopening unchanged legacy conversation metadata normalized YAML quoting, repair the Desktop-owned vault transcript store so a semantically unchanged metadata snapshot is not rewritten. Preserve all core API services/functions, planned Language Service wiring, renderer retirement coverage, terminal scope and user data. No public interface, installer permission, provider policy or runtime default changes.",
  "acceptanceReview": "Use only the acceptance app, workspace-local disposable profiles, the exact checksum-pinned historical archive and the exact pinned Server protocol peer. Each fixture kind must preserve installed plugin/settings/legacy-controller/transcript/memory bytes through guarded exit and cold reopen. Normal startup must use bundled App Profile chat and send exactly one isolated peer turn without replay. Safe Mode must expose no AI action or ACP worker, then permit bundled chat after a cold normal restart. The synthetic external module must never evaluate. Never open an installed app, user profile or live provider.",
  "provenance": {
    "desktopExactMainCi": "https://github.com/lapismd/lapis-desktop/actions/runs/44431482214",
    "desktopPages": "https://github.com/lapismd/lapis-desktop/actions/runs/44431481970",
    "serverPeerCurrentBytesMatchPin": true,
    "historicalArchiveSize": 5035388,
    "historicalArchiveFiles": 178
  },
  "runs": [
    {
      "name": "Fresh Desktop exact-main prerequisite",
      "command": "Hosted CI and Storybook Pages at ea4cc229f82f16bd23f9accb8a890793001774fe",
      "result": "pass",
      "failures": 0,
      "detail": "CI run44431482214 passes18jobs including both Linux native builds, Unit, Quality, Governance, audits, static Storybook, four interaction shards and final Validate. Pages run44431481970 passes. Desktop main remained the exact qualified SHA before this slice."
    },
    {
      "name": "Specification discovery",
      "command": "Published @lapismd/spec-validator@0.2.1 doctor and semantic/text searches",
      "result": "fail",
      "failures": 1,
      "detail": "Doctor reports the host qmd native module still targets an older Node ABI. Search explicitly degrades to the documented rg fallback and locates LD-PLUG-001/E-RETIRE-009. No global tool repair or semantic-success claim."
    },
    {
      "name": "Pinned input preflight",
      "command": "Archive size/SHA256 plus pinned/current Server peer byte comparison",
      "result": "pass",
      "failures": 0,
      "detail": "Historical archive is5,035,388bytes with the expected SHA256. Desktop pins Server83fca8d; its peer.py and the current unrelated-dirty Server checkout both hash to2e7ee6fb. No Server file changed."
    },
    {
      "name": "Fixture source and tamper replay",
      "command": "node .local/validation/retired-ai-original/fixture-regression.mjs",
      "result": "pass",
      "tests": 8,
      "failures": 0,
      "detail": "Three synthetic and three historical preference variants preserve bytes; same-size tamper and missing historical input reject before writes. Syntax and pinned Prettier pass for the changed native test."
    },
    {
      "name": "Initial portable spec-first attempt",
      "command": "node scripts/validation.mjs run spec:first",
      "result": "fail",
      "failures": 1,
      "detail": "The ignored validation config still selected PR48 API0.6.8, which cannot satisfy current ^0.6.9. No validator or product test ran. Replaced only the ignored overlay with the five exact current-main dependency archives from successful hosted run44431482214."
    },
    {
      "name": "Archive verification harness typo",
      "command": "Local SHA256 loop before corrected spec-first replay",
      "result": "fail",
      "failures": 1,
      "detail": "A zsh loop variable named path shadowed PATH, so shasum, awk and the following node command were not found. No product command ran. The corrected loop used archive_path and absolute system tools; all five expected and actual hashes match."
    },
    {
      "name": "Mapped spec-first gate",
      "command": "node scripts/validation.mjs run spec:first",
      "result": "pass",
      "failures": 0,
      "detail": "Isolated omarchy Docker with the current-main five-archive overlay verifies12import routes and maps the one protected native test to both required canonical chapters."
    },
    {
      "name": "Initial canonical specification check",
      "command": "node scripts/validation.mjs run spec:check",
      "result": "fail",
      "failures": 5,
      "detail": "The first authored contract exceeded ai.md by8lines and desktop.md by504bytes, and the three changed protected paths lacked a fresh receipt. No assertion was weakened. The contract was moved to native-acceptance, bounded references retained in mapped chapters, and this receipt added."
    },
    {
      "name": "Portable owner qualification",
      "command": "node scripts/validation.mjs run spec:check; node scripts/validation.mjs run check:all",
      "result": "pass",
      "failures": 0,
      "detail": "The repaired bounded receipt/specification passes spec:check and the complete check:all Docker lane. Portable Docker cannot replace native acceptance."
    },
    {
      "name": "Isolated macOS ARM64 preservation matrix",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_RETIRED_AI_ARCHIVE=<verified archive> pnpm test:native:macos -- headed --family services",
      "result": "fail",
      "failures": 23,
      "detail": "Fresh runner-owned fixture attempt services-OqSctK reached the driver listener for every application but0/21feature and0/2resource cases reached renderer acknowledgement;11governed cases stayed skipped. A live process sample located AppKit's hidden crash-recovery modal before Tauri setup, accumulated by deliberately killed acceptance processes. The same acceptance binary reached renderer and shell readiness when probed with ApplePersistenceIgnoreState. No deadline or product assertion changed; the acceptance-only launcher now supplies that AppKit preference and retains Desktop's own isolated window-state fixture."
    },
    {
      "name": "AppKit crash-restoration regression",
      "command": "node --test tests/governance/native-session-mode.test.mjs; focused native raw-representation case",
      "result": "pass",
      "failures": 0,
      "detail": "Portable launcher regression passes7/7. The exact raw-representation native case that previously stopped at the listener passes1/1 in2.2s. AppKit restoration is disabled only for .app launches; raw diagnostic executables retain their original arguments."
    },
    {
      "name": "Post-repair full services attempt",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_RETIRED_AI_ARCHIVE=<verified archive> pnpm test:native:macos -- headed --family services",
      "result": "fail",
      "failures": 6,
      "detail": "services-foGmXc reaches every renderer: feature16pass/5fail/11governed skips and resource1pass/1fail. All4new App Profile normal/Safe Mode synthetic/historical cases and the baseline Core chat pass. Four renderer-retirement cases expose the exact preserved Saved runtime fake is unavailable state instead of their stale generic message; assertions are tightened to that exact state. The pre-existing transcript-backup history-readiness failure and raw HTTP diagnostic unknown-path failure are outside this Desktop/Deno slice and remain unchanged."
    },
    {
      "name": "Legacy metadata byte-preservation regression",
      "command": "pnpm exec vitest run tests/ai/conversations/vault-transcript-store.test.ts --reporter=verbose",
      "result": "pass",
      "tests": 8,
      "failures": 0,
      "detail": "The exact new regression first failed1/8 solely because writeMetadata removed quotes around unchanged createdAt/updatedAt values. After the narrow store repair it passes8/8: parsed-equal metadata retains original bytes, while existing changed/oversized/corrupt/delete cases retain their assertions."
    },
    {
      "name": "First rebuilt native artifact identity attempt",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 ... pnpm test:native:macos -- headed --operation prepare",
      "result": "fail",
      "failures": 1,
      "detail": "The e2e app and bundle built, then identity collection invoked xcrun without an explicit SDK and selected a removed CommandLineTools path despite the active full Xcode27.2 installation. Identity now requests the macosx SDK explicitly; no system developer selection changed."
    },
    {
      "name": "Focused renderer retirement preservation replay",
      "command": "node --import tsx --test --test-concurrency=1 --test-name-pattern=<four enabled and Safe Mode cases> tests/desktop/ai-notes-binding.test.mjs",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "detail": "Fresh disposable roots pass4/4 in25.1s: normal and Safe Mode synthetic/historical cases preserve every seeded byte, expose the exact unavailable saved runtime, deny both native AI commands without admission and never evaluate the external module."
    },
    {
      "name": "Complete renderer Notes binding matrix",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/ai-notes-binding.test.mjs",
      "result": "pass",
      "tests": 10,
      "failures": 0,
      "detail": "Fresh disposable roots pass10/10 in52.7s: baseline admission/disablement plus all synthetic/historical enabled, installed-disabled, app-shell-disabled and Safe Mode paths."
    },
    {
      "name": "Post-byte-repair full native services matrix",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 LAPIS_DESKTOP_AI_OWNER=renderer LAPIS_DESKTOP_RETIRED_AI_ARCHIVE=<verified archive> pnpm test:native:macos -- headed --family services",
      "result": "fail",
      "failures": 2,
      "detail": "services-Fu3aRc passes feature20 with1 failure and11 governed skips; resource passes1 with1 failure. Core cold chat, all4 App Profile retirement cases and all10 renderer binding cases pass. The only failures reproduce unchanged out-of-scope boundaries: ai-transcript-backup never exposes Vault history: Saved locally, and the raw development-WebView diagnostic exits SIGABRT before driver connection. Treating either as non-blocking still requires explicit acceptance; neither core/history nor diagnostic code changed."
    },
    {
      "name": "Explicit unrelated-failure acceptance",
      "command": "User decision recorded 2026-11-19",
      "result": "pass",
      "failures": 0,
      "detail": "The user explicitly accepts the unchanged transcript-backup readiness failure and raw development-WebView SIGABRT as non-blocking for this Desktop/Deno retirement boundary. The failures and original counts remain recorded; no core/history or raw diagnostic code changed. This acceptance does not qualify those boundaries or authorize installed-app replacement, real user data, publication or production deployment."
    },
    {
      "name": "Sealed evidence schema attempts",
      "command": "Two exact-snapshot pnpm check:evidence attempts",
      "result": "fail",
      "failures": 2,
      "detail": "The checker first rejected a pass receipt with landing/follow-up text in remaining, then rejected omission of the required field. No product assertion or result changed. Sequencing belongs in current backlog/tracker state, while a sealed pass receipt requires remaining to be an empty array."
    },
    {
      "name": "Deno-free spec tooling and semantic discovery",
      "command": "pnpm view @lapismd/spec-validator version; npm rebuild better-sqlite3 --prefix <existing qmd>; pnpm exec spec-validator --no-color doctor; pnpm spec:search <retirement query>",
      "result": "pass",
      "failures": 0,
      "detail": "Registry confirms0.2.1 is the latest published Deno-free validator already pinned. Rebuilding only the existing QMD native dependency for Node ABI147 repairs the host tool; doctor passes13checks with the pre-existing alias warning, and semantic search returns the governing native-acceptance and AI chapters."
    },
    {
      "name": "Sealed complete portable qualification",
      "command": "LAPIS_DESKTOP_BASE=ea4cc229f82f16bd23f9accb8a890793001774fe LAPIS_DESKTOP_HEAD=cb2c072efeccc5829c810177db9363347a7171c4 pnpm check:all",
      "result": "pass",
      "failures": 0,
      "detail": "Validation run lapis-desktop-validation-f3d1aa9d-88d1-48ca-9b03-ac2ccc9b75b9 passes with exitCode0 against the exact JJ snapshot: canonical intake/specification, governance953/953, AI749/749, TypeScript, Rust checks/tests/formatting, audits and production Vite build. The immutable result records container image sha256:36d8f2ab59683921ee66ef0f48b3dfa62c921dd958dd1f13342ec765ff6082d4."
    }
  ],
  "remaining": []
}
```

The historical archive is ignored test input, never vendored implementation or
new-install permission. Native acceptance cannot authorize package publication,
installed-app replacement or live-provider access.
