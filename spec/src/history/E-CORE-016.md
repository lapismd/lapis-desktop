# Shared native AppDatabase intake

```json
{
  "id": "E-CORE-016",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.3"],
  "requirements": ["LD-DB-001", "LD-DB-002", "LD-DB-003", "LD-DB-004"],
  "versions": {
    "desktopBaseline": "a5b936e0",
    "notesCoreAndAPI": "b55d3492bf5856726a57e51f93514c4349de433d"
  },
  "contractReview": "Replace renderer SQL and its duplicate TursoAppDatabase with generated high-level calls to the shared file/database Runtime. Keep opaque session/view admission, native profile/model authority, accepted-work lifetime and the existing public application screens. Historical M3 receipts retain their original transport scope; M16.3 tracks the existing R1.3.8 replacement gate.",
  "milestoneReview": "M16.3 is Done for the shared high-level database intake: native database/channel and existing Notes/Search checks, all 2000 catalog cases, strict checks, builds and scoped admission pass. The native UI lane retains 27 passes and one independently reproduced pre-existing Markdown attachment failure. On 2026-10-25 the user explicitly accepted that failure as non-blocking and authorized this verified intake commit. The Markdown repair stays separately pending in lapis-plugins; no failing run is relabeled. M11 remains Deferred; R2-R7 and provider/platform acceptance remain separate.",
  "runs": [
    {
      "name": "native-before",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test database_service",
      "result": "fail",
      "failures": 5,
      "note": "Five compilation diagnostics show missing shared client/storage construction and passive registry APIs. No runtime case executes."
    },
    {
      "name": "initial-native-integration",
      "command": "Same database_service target",
      "result": "fail",
      "failures": 2,
      "note": "One build attempt finds the retired SQL permission still in capabilities. The next rejects Option<Channel>, which is not a deserializable command argument. Rename the permission and use Tauri's public optional JavaScriptChannelId bound to the caller WebView."
    },
    {
      "name": "native-exact",
      "command": "Same database_service target",
      "result": "pass",
      "failures": 0,
      "note": "Three cases qualify one shared file/database owner, private profile/cache separation and close with an unpolled reply. The existing nonfatal __eh_frame linker warning remains."
    },
    {
      "name": "renderer-harness",
      "command": "node --test tests/renderer/native-database.test.mjs",
      "result": "fail",
      "failures": 2,
      "note": "The initial and first after commands omit the repository's tsx loader and fail module resolution before executing cases. Correct the command; do not modify package exports or add aliases."
    },
    {
      "name": "renderer-exact",
      "command": "node --import tsx --test tests/renderer/native-database.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Eight cases pass, including complete catalogue, undefined/null tags, ordering/drain, argument snapshots, native errors/retry, scoped changes during failed closure, admission and malformed responses."
    },
    {
      "name": "archives",
      "command": "pnpm local:pack ../lapis-notes --already-built; pnpm local:install .local/archives/shared-database-manifest.json",
      "result": "pass",
      "failures": 0,
      "note": "Five verified Notes archives from b55d3492 replace the 00a8f5ef payloads; fourteen other verified archives remain. All nineteen payloads and import routes verify. Tracked dependency files are preserved; no package is published. This scoped refresh does not claim full-cohort review freshness."
    },
    {
      "name": "native-focused",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked --test database_service --test database_connection --test database_registry --test database_restart --test database_observer",
      "result": "pass",
      "failures": 0,
      "note": "Nine cases pass; one subprocess helper is intentionally ignored. An initial test assertion expected a bare boolean instead of the retained {applied} result; correcting that fixture expectation clears its one failure."
    },
    {
      "name": "consumer-types",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "Before: two errors expose the upstream catalogue argument-union defect. Notes b55d3492 fixes public types with packed regression coverage; after fresh archive installation, zero errors and zero warnings."
    },
    {
      "name": "source-audit",
      "command": "node --import tsx --test tests/governance/source-audit.test.mjs; pnpm check:architecture; pnpm check:app-ownership",
      "result": "pass",
      "failures": 0,
      "note": "Exact permission regression moves from one failure to zero; eleven family cases pass. The public high-level command replaces the retired raw-SQL grant without broadening capabilities."
    },
    {
      "name": "complete-unit-lanes",
      "command": "node --import tsx --test tests/governance/*.test.mjs tests/renderer/*.test.mjs; pnpm test:ai; CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0,
      "note": "414 renderer/governance cases, 744 AI cases and 234 native service cases pass. Two subprocess helpers are intentionally ignored; no native UI or provider journey is claimed."
    },
    {
      "name": "renderer-production-build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "note": "Production renderer builds. Existing Rollup annotation/chunk-size advisories are unchanged; this is not packaged/native acceptance."
    },
    {
      "name": "spec-validation-before",
      "command": "pnpm spec:check; pnpm spec:validate",
      "result": "fail",
      "failures": 7,
      "note": "First run: three canonical pages exceed 400 lines and four verification rows use the milestone-only In progress status. Concise wording preserves requirements; rows remain Planned until replacement acceptance. One follow-up still finds the governance page at 402 lines. Final exact validation passes with all three pages at 400 lines."
    },
    {
      "name": "strict-native-configurations",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm check:rust; cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0,
      "note": "Both normal and e2e all-target configurations pass strict Clippy."
    },
    {
      "name": "complete-specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "All four lanes pass after the seven initial authoring findings and the one follow-up line-limit finding are repaired. No validator is loosened."
    },
    {
      "name": "formatting",
      "command": "pnpm format:check; changed-file prettier --check; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check",
      "result": "fail",
      "failures": 1,
      "note": "Full formatter reports only the unchanged historical E-AI-109.md. The user has explicitly accepted this immutable-evidence exception; parent/current diff is empty. Changed-file and Rust formatting pass after formatting three changed files."
    },
    {
      "name": "normal-packaged-build",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm exec tauri build --debug --bundles app; pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "The ordinary macOS ARM64 application builds and bundle audit finds zero automation markers. Signing stays Deferred. The existing nonfatal linker warning remains. A subsequent API-build preflight correctly stops below the 30 GiB guard; after proving compiler/linker inactivity and no open cache files, the standing cache approval removes only jj-acp/target/debug/incremental (2.25 GiB), restoring 31.8 GiB before the API lane is restarted."
    },
    {
      "name": "hidden-packaged-api",
      "command": "CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 pnpm test:desktop:api",
      "result": "pass",
      "failures": 0,
      "note": "All four cold hidden API cases pass, including shared file service, retained Search invalidation/reopen, AI admission and repository admission. Actual bundle/resources rebuilt; no visible UI gate is claimed by hidden success."
    },
    {
      "name": "actual-native-channel",
      "command": "wdio run tests/desktop/wdio.conf.mjs --spec tests/desktop/database.spec.mjs --mochaOpts.grep \"forwards committed changes\"",
      "result": "pass",
      "failures": 0,
      "note": "One exact case proves the actual JavaScript Channel reaches the native scoped observer and receives committed changes. Fixture .local/shared-database-native-ui-channel.json; isolated profile, no user vault."
    },
    {
      "name": "actual-native-ui",
      "command": "wdio run tests/desktop/wdio.conf.mjs with the ordinary five-spec isolated fixture",
      "result": "fail",
      "failures": 1,
      "note": "27 pass, one fails: reading-mode native attachment rendering. All four database/provider/channel cases pass, as do Notes edit/save/accessibility/reopen. Markdown adapter in both retained 99806c68 and current owning source lacks Mira asset URL hooks; source regression reproduces two missing-hook failures independently of this database change. Its fix encounters an existing modified lockfile, older Mira types, audit findings and unrelated metadata/story failures. No acceptance assertion is loosened; an explicit user decision is pending."
    },
    {
      "name": "complete-catalog",
      "command": "pnpm test:storybook",
      "result": "pass",
      "failures": 0,
      "note": "All 2000 cases pass: 500 in each desktop/narrow and light/dark combination, 107 files per combination. Cold Vite starts use installed b55d3492 Notes archives plus the retained fourteen payloads; full-cohort freshness is not claimed."
    },
    {
      "name": "progress-completion-before",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "Completion metadata initially omits the exact completedGates text for M16.3. Add the original gate unchanged; no acceptance rule is weakened and the user-accepted Markdown exception remains explicit."
    },
    {
      "name": "final-documentation",
      "command": "pnpm check:progress; pnpm spec:check; changed-file prettier --check",
      "result": "pass",
      "failures": 0,
      "note": "The exact completion gate and all four specification lanes pass after the accepted exception is recorded. The generated summary is formatted without changing its whitespace-insensitive projection; unchanged E-AI-109 retains the previously accepted full-format exception."
    }
  ],
  "files": [
    "AGENTS.md",
    "MIGRATION.md",
    "scripts/source-audit.mjs",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai.md",
    "spec/src/current/background.md",
    "spec/src/current/desktop.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/repository.md",
    "spec/src/current/verification.md",
    "spec/src/history/E-CORE-016.md",
    "spec/src/history/index.md",
    "src/lib/native/database/database-codec.ts",
    "src/lib/native/database/database-transport.ts",
    "src/lib/native/database/native-connection.ts",
    "src/lib/native/database/native-database-provider.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/database/connection.rs",
    "src-tauri/src/database/mod.rs",
    "src-tauri/src/database/observer.rs",
    "src-tauri/src/database/registry.rs",
    "src-tauri/src/database/sql_guard.rs",
    "src-tauri/src/database/wire.rs",
    "src-tauri/src/host/ai/imports/tests.rs",
    "src-tauri/src/host/ai/policy/tests.rs",
    "src-tauri/src/host/database.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/repository/policy/tests.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/tests/database_connection.rs",
    "src-tauri/tests/database_observer.rs",
    "src-tauri/tests/database_registry.rs",
    "src-tauri/tests/database_restart.rs",
    "src-tauri/tests/database_service.rs",
    "tests/desktop/database.spec.mjs",
    "tests/desktop/search-provider.test.mjs",
    "tests/governance/source-audit.test.mjs",
    "tests/renderer/native-connection.test.mjs",
    "tests/renderer/native-database.test.mjs"
  ],
  "remaining": [],
  "completedGates": {
    "M16.3": "R1.3.8 Tauri intake uses the shared high-level database owner through the existing packed provider. Native admission, commit observation, rollback, view/vault closure, cold persistence and existing Notes/Search UI acceptance pass without a renderer SQL engine."
  }
}
```

Qualification is complete with the explicitly accepted Markdown exception.
Native view closure fences only that view and stops passive observation.
Explicit last-vault close drains the existing core owner even when closed view
objects retain client references. No host mutex is held across database
execution, subscription or observation disposal.

SQL frames, validation and transport tests are deliberately retired with the raw
SQL interface. Replacement cases retain high-level JSON/value fidelity,
conditional commit atomicity, protocol denial, authority, native killed-process
recovery and core-owned drain. Core's complete method/domain receipts stay in
Notes; consumer acceptance remains separate.

The scoped archive refresh is development validation, not complete-cohort review
freshness or publication. Prior Notes tarballs and receipts remain under
`.local/shared-database-prior-archives*`. Current source checksums are recorded
in the nineteen-entry `.local/archives/shared-database-manifest.json`.

Five rebuilt Notes public archives use source revision
`b55d3492bf5856726a57e51f93514c4349de433d`. The other fourteen payloads remain
at the previously qualified revisions recorded in installed-archive metadata.

| Archive                         | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `@lapis-notes/ui`               | `a6b47b17298b9495ad41f35f6714dbaa08a43802fd2ca2bad06c2ade9ae97cbe` |
| `@lapis-notes/api`              | `9e34237b6758ba9e0c4e646a32e6d8282e1bde6ee84fcae004b1007a7328486d` |
| `@lapis-notes/language-service` | `ca82a9f02f8cf1167bd4af566c272dffaa9aad6cdaa867d7ed42561985fd5b65` |
| `@lapis-notes/file-explorer`    | `1b2d11da1a0d1d774a36e59a853ff05ea64af92f09ef89bd1598c771a1ea191e` |
| `@lapis-notes/workspace`        | `a215920c24354bc0d33c1036fa6af63b9a56ad709e62b8bca01ca84c25cd308e` |

## Later shared-core compatibility

`CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 cargo check --manifest-path src-tauri/Cargo.toml --lib`
passes against committed Notes `a466c8d4`, refreshing the private native
lockfile. This is native library compatibility only. The original broader
receipts above retain their recorded source revisions, and the five JS archives
remain at `b55d3492`. Shared backup selection is qualified separately by
E-CORE-017. M16.3 records the explicit user acceptance below.

## Accepted exception — 2026-10-25

The user answered: “Accept the recorded failure and commit the verified intake.”
This accepts the independently reproduced Markdown attachment defect as
non-blocking for this intake. The actual native UI result stays 27 pass / one
fail; the owning `lapis-plugins` repair remains pending. The unchanged
historical E-AI-109 formatting exception also retains its earlier explicit
acceptance. No native/provider acceptance is inferred for the newer R2 execution
source.
