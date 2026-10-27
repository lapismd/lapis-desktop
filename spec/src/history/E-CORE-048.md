# Integrated-main lineage audit and requalification

```json
{
  "id": "E-CORE-048",
  "date": "2026-10-27",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M16.10"],
  "requirements": [
    "LD-AI-005",
    "LD-AI-006",
    "LD-AI-007",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-GOV-010"
  ],
  "contractReview": "Land every pinned preserved Desktop lineage into main or record its exact supersession, then re-run the affected gates once against the integrated tree. Two lineages landed as their own slices: preserved-e-qualification-003 (E-QUALIFICATION-003 verbatim) and codex/release-coordination (E-RELEASE-017 byte-identical plus RELEASE.md with only its stamp and maintenance paragraph reconciled, and appended E-RELEASE-018). Four lineages are superseded and are recorded with byte-level proof rather than forced in. Every load-insensitive gate was re-executed on the integrated tree; the visible headed and catalog re-execution stays open behind a quiet host window, and live agent/provider acceptance is user-optional by the 2026-10-27 decision rather than a default gate. No immutable evidence was rewritten, no assertion, threshold, tag or visual baseline changed, and the accepted E-AI-109 formatting exception is untouched.",
  "milestoneReview": "M11 stays Deferred and M12 stays Planned; landing the release tracker promotes no gate and selects no task. M16.10 keeps its original Done gate through E-CORE-043/044 with current-cohort proof in E-CORE-047, and because the integrated product surface is byte-identical that proof is unchanged while the visible-UI re-run stays open in remaining. No M10, Desktop default, distribution, signing, publication, installation or visual gate is completed. R5/R6 remain Deferred and Notes owns R7 cutover and final source validation.",
  "versions": {
    "integratedMainBase": "06b4e096420c",
    "previousQualifiedTree": "3dfe624d1ad7f717110466d7d668305a8adee5e2",
    "landedBookmark1": "3628db65883d45eb2b99c9b53b73f073c3fb4fb4",
    "landedBookmark2": "a8572603654ef8342162f7a29f9cd041850ab762",
    "supersededBookmarks": [
      "34909cfff41a",
      "2e8105606ac8",
      "11e22c7f7aad",
      "feb1e8c3bfe4",
      "1b002dbf3c63"
    ],
    "productSurfaceDeltaLines": 0,
    "documentationDeltaPaths": 5,
    "designCoreRange": "^0.6.0",
    "nativePin": "cd997c2cf92ecfa1ce16de1f49ec085d58d026d5",
    "node": "24.10.0",
    "pnpm": "10.34.5",
    "rust": "1.99.0"
  },
  "files": [
    "MIGRATION.md",
    "spec/src/SUMMARY.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-CORE-048.md",
    "spec/src/history/core/index.md"
  ],
  "remaining": [
    "Re-execute the two visible-UI lanes on the integrated tree in a genuinely quiet host window (1-minute load near the 5-8 observed at 16:53:44Z, without storage/Spotlight daemon saturation): the complete cold headed suite, where four attempts returned 107, 106, 107 and 103 of 109 with completely different exhausted-5s-wait failure sets while startup 3/3 and all 28 WebKit WebDriver specs passed every time; and the complete catalog lane, which was not started because the host cannot sustain browser timing (it aborted once at load 61.7, and the identical-tree receipt is 2,124 executions with 0 failures)."
  ],
  "runs": [
    {
      "name": "Lineage audit: preserved-bases-native-adoption",
      "command": "jj diff --from 34909cff --to @ -- spec/src/history/E-DEPENDENCY-003.md; jj diff --from 11e22c7f --to 34909cff --summary; grep -c E-DEPENDENCY-003 spec/src/current/verification.md spec/src/current/local-dependencies.md",
      "result": "pass",
      "failures": 0,
      "detail": "Superseded. The bookmark's only added file, E-DEPENDENCY-003.md, is byte-identical in main (empty diff, 6,517 bytes) and verification.md plus local-dependencies.md still cite it, so the repaired signed Bases native adoption is already landed. Its six other paths are ledger/chapter states main has since superseded; nothing unique to integrate and nothing forced."
    },
    {
      "name": "Lineage audit: preserved-docker-catalog-candidate",
      "command": "jj diff --from 5f165fc9 --to 2e810560 --summary; per-file jj diff --from 2e810560 --to @; text diff of both versions for every differing file",
      "result": "pass",
      "failures": 0,
      "detail": "Superseded. Of its 43 added files, 31 are byte-identical in main (story-parity guard and its seven modules, FixtureControls, docs/governance-checkpoints.md, the validation runner modules, governance tests, E-CORE-023 and E-VALIDATION-001). The 12 differing files are strictly newer in main: bookmark-only lines number 0-8 per file against 11-83 main-only lines, and each bookmark-only line is a superseded variant (the workerEnvironment TAURI_CONFIG resource hack, hard-coded /tmp SSH ControlMaster/ControlPath now replaced by configurable sshMultiplexing/sshControlPath, six versus eight pinned native sources, one older story-parity kind, older test constants). No unique content to integrate."
    },
    {
      "name": "Lineage audit: preserved-provider-chat-qualification",
      "command": "jj diff --from 11e22c7f --to @ -- spec/src/history/E-CORE-027.md tests/desktop/ai-core-provider-screen.test.mjs; jj diff --from 49881cd3 --to 11e22c7f --summary",
      "result": "pass",
      "failures": 0,
      "detail": "Superseded. Both sides of the divergent bookmark resolve to landed content: its two added files, E-CORE-027.md and tests/desktop/ai-core-provider-screen.test.mjs, are byte-identical in main and verification.md still cites E-CORE-027, so the divergence is the pre-rebase copy of an already integrated change. Its eight remaining paths are superseded chapter/ledger states."
    },
    {
      "name": "Lineage audit: preserved-catalog-validation-1 and -2",
      "command": "jj diff --from feb1e8c3 --to @ -- catalog/plugins/repository/History.stories.ts; jj diff --from 1b002dbf --to @ -- catalog/plugins/ai/Setup.stories.ts catalog/plugins/repository/Loading.stories.ts",
      "result": "pass",
      "failures": 0,
      "detail": "Superseded. Setup.stories.ts and Loading.stories.ts are byte-identical in main. History.stories.ts differs only in Prettier wrapping of the same public Retry-action click (three lines versus one); main holds the formatted form, so landing the bookmark verbatim would fail prettier --check. No missed delta."
    },
    {
      "name": "Integrated-main product-surface identity",
      "command": "jj diff --from 3dfe624d --to @ --summary; jj diff --from 3dfe624d --to @ --summary -- src src-tauri catalog tests scripts public .storybook index.html package.json pnpm-lock.yaml vite configs vitest configs svelte.config.js tsconfig.json rust-toolchain.toml rustfmt.toml spec-validator.config.mjs .github docs AGENTS.md",
      "result": "pass",
      "failures": 0,
      "detail": "The complete delta from the tree that produced the E-CORE-047 native, provider, bundle and catalog receipts is five documentation paths: RELEASE.md, spec/src/SUMMARY.md, E-QUALIFICATION-003.md, E-RELEASE-017.md and E-RELEASE-018.md. The product-surface diff is empty (0 lines), so no renderer, native crate, story, test, tool, manifest or lock changed. Every gate below is nevertheless re-executed against integrated main rather than inherited."
    },
    {
      "name": "Integrated-main strict normal/e2e Rust, TypeScript and audits",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm check",
      "result": "fail",
      "failures": 1,
      "detail": "Story composition 113 families/0 findings, canonical validation 6 validators/372 chapters/116 requirements, svelte-check 0 errors/0 warnings, strict Clippy clean for both configurations (34.47s normal, 29.54s e2e, zero warnings). The only failure is again the accepted immutable E-AI-109.md Prettier exception, which no landed record alters."
    },
    {
      "name": "Integrated-main quiet renderer, governance, AI and native-service suites",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test",
      "result": "pass",
      "failures": 0,
      "tests": 1550,
      "detail": "544 governance/renderer Node cases, 744 AI cases across 151 files and locked cargo test 262 passed/0 failed/2 ignored in 54 suites, all against the integrated tree."
    },
    {
      "name": "Integrated-main hidden API suite and focused admission/queue ownership",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:desktop:api; node --import tsx --test --test-concurrency=1 tests/desktop/ai-native-queue-admission.test.mjs tests/desktop/ai-native-queue-owner.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs",
      "result": "pass",
      "failures": 0,
      "tests": 25,
      "detail": "The hidden native API suite passes 21/21 with 0 skips and the focused admission/queue ownership lane passes 4/4, both on the integrated tree and its rebuilt debug e2e acceptance app."
    },
    {
      "name": "Integrated-main ordinary and e2e bundles with the packaged-asset audit",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm desktop:bundle --debug; pnpm check:bundle; diff -rq of both bundles' Contents/Resources/lapis-ai trees",
      "result": "pass",
      "failures": 0,
      "detail": "The ordinary debug bundle audits as pass: arm64 only, 331 renderer JavaScript files, zero automation markers, signing deferred, complete lapis-ai resources. The e2e acceptance bundle was rebuilt by the hidden API lane and both resource trees compare byte-identical."
    },
    {
      "name": "Integrated-main cold headed attempt under host storage-daemon load",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:desktop:headed",
      "result": "fail",
      "failures": 2,
      "tests": 109,
      "detail": "107/109 with startup-progress 3/3 and all 28 WebKit WebDriver specs passing. ai-native-queue-screen.test.mjs:154 exhausted the 5s default waitUntil on the native queued-card cancel hit test, and terminal-lifecycle.test.mjs:400 reported 'Terminal output must include $' after 12.7s. Host 1-minute load was 36.29 with macOS ApplicationsStorageExtension at 73% and Storage at 25% for over five hours; both targets passed on the byte-identical product tree at lower load, so no assertion, timeout or product path was changed for this diagnosis."
    },
    {
      "name": "Integrated-main actual installed-provider attempt under the same load",
      "command": "LAPIS_AI_TEST_CORE_QUEUE_PROVIDER=1 LAPIS_AI_TEST_RUNTIME_CONFIG=<private retained device runtime configuration> node --test --test-concurrency=1 tests/desktop/ai-native-queue-provider.test.mjs",
      "result": "fail",
      "failures": 1,
      "tests": 2,
      "detail": "The completion/resume case passed in 60.3s with all four stages (receipt .local/native-test/queue-provider-W1dFKH). The Stop case failed at the driver's cancel hit test (driver.mjs:251, 5s default waitUntil) after 24.5s and preserved its failed-attempt receipt .local/native-test/queue-provider-RMr7RL before any retry. The failed attempt was recorded first, no uncertain accepted turn was replayed, and no configuration or credential content was printed."
    },
    {
      "name": "Second integrated-main attempt: load-gated exact targets, cold headed lane and provider file",
      "command": "30-minute gate for 1-minute load <11 with no cargo/rustc/acceptance app, released at load 24.18; node --import tsx --test --test-concurrency=1 tests/desktop/ai-native-queue-screen.test.mjs tests/desktop/terminal-lifecycle.test.mjs; pnpm test:desktop:headed; provider two-case file",
      "result": "fail",
      "failures": 7,
      "tests": 120,
      "detail": "The host never reached the quiet threshold inside the cap: ApplicationsStorageExtension held 66-78% for about six hours, Spotlight mds_stores 73% for over 28 hours and WindowServer 56%, with 1-minute load 24-36 and 15-minute 47-55. Every failure is an exhausted default 5s WebDriver wait and the failing set moves between attempts, which is starvation rather than a defect: exact targets passed ai-native-queue-screen 1/1 but terminal-lifecycle 2/5 with 'Terminal output must include $' at 13.0-14.3s; the cold headed lane passed startup 3/3 and all 28 WebKit WebDriver specs but 106/109 in the node suite (M14 backup 'Vault history details' not displayed after 5000ms, terminal revoked admission at 12.9s, window-chrome 'Request timed out! Consider increasing the connectionRetryTimeout option'); the provider completion/resume case passed again in 62.8s with all four stages (receipt queue-provider-OnVJ0D) while the Stop case failed at the same 5s cancel hit test (receipt queue-provider-d5hlge, stage failed). No assertion, timeout, threshold or baseline was altered and no uncertain accepted turn was replayed."
    },
    {
      "name": "Third integrated-main attempt on a quiet host: provider latency, not UI load",
      "command": "40-minute gate released at 1-minute load 7.93 with no cargo/rustc/acceptance app/browser process; provider two-case file; LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:desktop:headed",
      "result": "fail",
      "failures": 4,
      "tests": 114,
      "detail": "The provider file failed 0/2 for a new reason at low load: the Stop case exhausted the 30s composer-clear wait inside send() (driver.mjs:186) after 48.5s and the completion case exhausted the 90s terminal wait (driver.mjs:216) after 107.7s. Both retained turn journals report phase unknown with failure_code native_outcome_unknown after 178 characters of provider output, so the installed provider started each turn and did not complete it; the identical prompts completed in 38.0s and 75.8s at 17:10:04Z on the byte-identical product tree. Failed-attempt receipts queue-provider-7lI1g0 and queue-provider-S8gn9N were preserved before this record and neither unknown turn was replayed. The cold headed lane passed startup 3/3 and all 28 WebKit WebDriver specs but 107/109 in the node suite: ai-native-queue-screen again exhausted the 5s cancel hit-test waitUntil (8.4s) and terminal-lifecycle's revoked-admission case reported 'Terminal output must include $' (12.8s), the same two families that passed at 16:53:44Z on this tree."
    },
    {
      "name": "Fourth integrated-main attempt: a completely moving failure set",
      "command": "40-minute quiet gate released at 1-minute load 39.05 with no cargo/rustc/acceptance app/browser process; exact targets ai-native-queue-screen and terminal-lifecycle; LAPIS_DESKTOP_VALIDATION_RUNTIME=native pnpm test:desktop:headed",
      "result": "fail",
      "failures": 7,
      "tests": 118,
      "detail": "Exact targets passed 5/6, leaving only terminal-lifecycle's revoked-admission case (13.0s). The cold headed lane passed startup 3/3 and all 28 WebKit WebDriver specs but 103/109 in the node suite, failing six families that never failed together before: ai-native-queue-screen (5s waitUntil), ai-transcript-backup ('Vault history details' still displayed after 5000ms), native watch channels (connectionRetryTimeout), Graph navigation (16.2s), the packaged spellcheck worker (12.1s), terminal revoked admission (12.9s) and vault-return ('[data-desktop-vault-launcher]' not displayed after 5000ms). Every failure is an exhausted default 5s wait or a WebDriver request timeout, and the set differs completely from the three earlier attempts, which is host starvation rather than a product defect: this byte-identical tree passed 109/109 at 16:53:44Z with 1-minute load near 5-8, while load stayed between 22.1 and 39.1 here. The complete catalog lane was not started because the host cannot sustain browser timing; it aborted once at load 61.7 and the identical-tree receipt of 2,124 executions with 0 failures stands. No assertion, timeout, threshold, tag or baseline was altered."
    }
  ],
  "gaps": [
    "User decision 2026-10-27: live agent/provider acceptance is OPTIONAL and runs only on explicit request, never inside a default lane. The actual two-provider gate is therefore deferred by directive rather than failed. Its three integrated-main attempts (1/2, 1/2, 0/2) keep their preserved receipts - queue-provider-RMr7RL, queue-provider-d5hlge and queue-provider-7lI1g0 failed, queue-provider-W1dFKH and queue-provider-OnVJ0D passed - and no uncertain turn was replayed. When such a gate is explicitly requested the fresh-receipt rules stand: preserve receipts, record a failed attempt before any deliberate retry, never auto-replay an uncertain accepted turn, and never print configuration or credential content.",
    "Host saturation is why the visible-UI lanes could not be re-executed cleanly: Spotlight mds_stores held about 73% CPU for over 28 hours and ApplicationsStorageExtension about 66-78% for six hours, with WindowServer near 56% and 1-minute load between 7.9 and 43.7 across four attempts. The ignored .local tree (2,146 top-level entries, 467 native-test roots) carries no .metadata_never_index marker, so each native lane feeds the index; the recommended remedy is excluding those ignored trees from Spotlight or marking them, which was not done here because no host configuration was changed. Every load-insensitive lane passes on the integrated tree, and the product surface is byte-identical to the tree holding the 109/109 headed, 2/2 provider and 2,124-execution catalog receipts.",
    "Upstream, owner Notes: published @lapis-notes/api dist emits 490 extensionless relative specifiers across 119 of 238 JS files, so its public exports need a bundler or a resolving dev loader. The retained ef8170a6 archive ships the same shim and exports map, so this predates the cohort; Desktop keeps the governance-mandated tsx loader and adds no alias, patch or copied module.",
    "The shared Notes master tracker was not refreshed because that repository holds concurrent uncommitted sibling work; the refresh is reported to its owner instead of committed across repositories.",
    "A stale remote Docker lease container (lapis-desktop-validation-lease-da167e34226af956, state created 2026-10-27T14:32:48Z) makes every Docker lane for this checkout fail with a name conflict. Repository cleanup deliberately retains created workers, so releasing it needs an owner decision; every lane here used explicit native host selection.",
    "RELEASE.md's numbered release history (releases #1-#31, evidence #32, E-RELEASE-001-016) stays on the unlanded codex/release-coordination lineage; main holds only E-RELEASE-017/018 and the M11/M12 gates are unchanged.",
    "The five remaining pinned bookmarks were audited and left untouched; nothing was abandoned and no other preserved lineage was modified."
  ]
}
```
