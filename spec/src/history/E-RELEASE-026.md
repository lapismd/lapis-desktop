# Changesets preview automation and CLI distribution intake

```json
{
  "id": "E-RELEASE-026",
  "date": "2026-11-23",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-REL-001",
    "LD-REL-002",
    "LD-REL-004",
    "LD-REL-005",
    "LD-CI-001",
    "LD-CLI-002",
    "LD-CLI-003",
    "LD-GOV-006",
    "LD-GOV-008"
  ],
  "files": [
    ".changeset/README.md",
    ".changeset/config.json",
    ".changeset/desktop-mcp-release.md",
    ".github/dependency-automation/artifact-projection.json",
    ".github/workflows/ci.yml",
    ".github/workflows/release-auto.yml",
    ".github/workflows/release-cli-tap.yml",
    ".github/workflows/release-desktop.yml",
    ".github/workflows/version-desktop.yml",
    "docs/desktop-release.md",
    "package.json",
    "scripts/dependency-automation/artifact-projection.mjs",
    "scripts/dependency-automation/canonical-policy.mjs",
    "scripts/dependency-automation/check-canonical-intake.mjs",
    "scripts/prepare-cli.mjs",
    "scripts/release/auto.mjs",
    "scripts/release/changesets.mjs",
    "scripts/release/check-intent.mjs",
    "scripts/release/github.mjs",
    "scripts/release/refresh-context.mjs",
    "scripts/release/version-evidence.mjs",
    "scripts/release/version-pr.mjs",
    "scripts/release/version.mjs",
    "scripts/release-tools/package.json",
    "scripts/release-tools/pnpm-lock.yaml",
    "scripts/verify-cli-resource.mjs",
    "spec/src/current/ci.md",
    "spec/src/current/desktop.md",
    "spec/src/current/distribution.md",
    "spec/src/current/governance.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/history/E-RELEASE-026.md",
    "spec/src/navigation/history-01.md",
    "spec/src/verification.md",
    "spec-validator.config.mjs",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "tests/governance/artifact-projection.test.mjs",
    "tests/governance/cli-preparation.test.mjs",
    "tests/governance/dependency-automation-completion.test.mjs",
    "tests/governance/dependency-note-consumption.test.mjs",
    "tests/governance/release-auto.test.mjs",
    "tests/governance/release-context.test.mjs",
    "tests/governance/release-contract.test.mjs",
    "tests/governance/release-intent-cli.test.mjs",
    "tests/governance/release-intent.test.mjs",
    "tests/governance/release-linux.test.mjs",
    "tests/governance/release-version-pr.test.mjs",
    "tests/governance/release-version.test.mjs"
  ],
  "contractReview": "User explicitly requested automatic publication after reviewed version PRs and CI. Changesets owns release intent/changelog with synchronized preview rc identities. Full exact-source CI, native candidate installation, immutable assets, main-only publication and restricted tap App writes remain required. Public release tools avoid private application prerequisites. Product PRs require a new Changeset; generated version PRs consume notes and renew the exact frozen application context while SDK mutation checks and held activation remain intact. CLI tooling is pinned independently to its owning Server source; the qualified Core/Protocol/HTTP/MCP and native plugin engine pins remain unchanged. No installed app/profile is replaced by source validation.",
  "acceptanceReview": "Initial missing version module failed once; real Changesets fixtures exposed missing ancestry and empty-plan handling (one each), repaired without weakening assertions. Wider checks found three failures: intentional frozen-context drift, unintended engine refresh and missing hosted runtime declarations. Renewing reviewed context, separating CLI custody and declaring hosted runtime repaired all original targets. Review found a Changesets entry-point scope error; real subprocess acceptance now verifies valid intent, missing-intent refusal and non-PR execution. Focused affected family passes 104 cases and full governance passes 564. Final independent-CLI native suite passes 293 with two existing ignored quarantines, and normal/e2e strict Clippy and native build pass. Local portable attempts without the required private AI overlay fail frozen install (three lanes); overlay restores install, but check without an explicit range hits the pre-existing ancestry refusal. Complete portable qualification uses explicit exact source base and the documented ignored archive overlay. Corrected public CLI release and real formula acceptance remain pending. The user-authorized reviewer pause removal was applied through GitHub environment settings and read back: only branch protection remains, with the existing main-only deployment policy unchanged. The complete portable test lane passes 965 governance/renderer, 749 AI and 293 native cases (two existing native ignores). Two attempts to overlap portable lanes correctly refused the active workspace lease and performed no validation; serialized runs preserve that guard. Serialized exact-range check then exposed one real integration failure: the pre-existing SDK-only note inventory rejected new product Changesets. The exact new lifecycle test failed once. Product notes/config are now outside SDK maintenance inventory only when its version is unchanged; SDK-transition source scope, managed-note validation and altered-integrity refusals remain intact. Unchanged policy constants move to their own module to keep the owning checker within its source-size limit. Spec validation also rejected one expanded requirement at 92 words; its contract is shortened without dropping the detailed recovery rules. All 62 SDK intake/lifecycle/VCS cases pass after the integration repair. One early follow-up check snapshot preceded the fresh evidence inventory update and correctly reported three uncovered files; the final receipt lists all source changes. Complete governance passes 565 after the maintenance repair; the hosted intent entry point also accepts empty managed SDK notes without allowing them to satisfy product release intent. Spec style additionally identified one 84-word row and a five-sentence row; shortened rows preserve the full prose contracts. The full portable quality check passes. Full specification qualification found an unmapped Changesets config; its exact mapping test failed once, then the source mapping was extended to Changesets, release tooling and all owned release workflows under the distribution contract. Final portable check, full tests, five-lane specification check/spec-first/book and 529-record evidence inventory all pass. Final test counts are 968 governance/renderer, 749 AI and 293 native cases, with two existing native ignores. The independent CLI packaging source remains provisional until the corrected release is published; the tap infrastructure merged after all four checks, including the three native installation jobs, passed.",
  "runs": [
    {
      "name": "Missing preview version target before implementation",
      "command": "node --test tests/governance/release-version.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Real Changesets fixture/empty plan intermediate attempts",
      "command": "node --test tests/governance/release-version.test.mjs",
      "result": "fail",
      "failures": 2
    },
    {
      "name": "Complete release and held automation test family",
      "command": "node --test tests/governance/release-*.test.mjs tests/governance/dependency-automation-completion.test.mjs",
      "result": "pass",
      "passed": 41,
      "failures": 0
    },
    {
      "name": "Native content, credential and discovery intake",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --test cli_content --test cli_credential --test cli_discovery",
      "result": "pass",
      "passed": 7,
      "failures": 0
    },
    {
      "name": "Complete native source suite",
      "command": "cargo test --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "passed": 293,
      "ignored": 2,
      "failures": 0
    },
    {
      "name": "Normal strict native Clippy",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Wider initial check/test failures",
      "command": "pnpm check && pnpm test (documented private archive overlay)",
      "result": "fail",
      "failures": 3
    },
    {
      "name": "Affected release, context, CLI and validation family after repairs",
      "command": "node --test tests/governance/release-*.test.mjs tests/governance/artifact-projection.test.mjs tests/governance/cli-preparation.test.mjs tests/governance/validation-native.test.mjs tests/governance/validation.test.mjs tests/governance/dependency-automation-completion.test.mjs",
      "result": "pass",
      "passed": 104,
      "failures": 0
    },
    {
      "name": "Full governance after final entry-point repair",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "passed": 564,
      "failures": 0
    },
    {
      "name": "Strict e2e native Clippy",
      "command": "cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --features e2e --locked -- -D warnings",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Ordinary native build",
      "command": "cargo build --manifest-path src-tauri/Cargo.toml --locked",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Renderer distribution build",
      "command": "pnpm build (documented private archive overlay)",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Remove environment reviewer pause while preserving main-only deployment",
      "command": "gh api --method PUT repos/lapismd/lapis-desktop/environments/desktop-preview-release (reviewers=[] and existing deployment_branch_policy), then read environment and branch policies",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete portable test lane",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test",
      "result": "pass",
      "passed": 2007,
      "ignored": 2,
      "failures": 0
    },
    {
      "name": "Actual repository release intent",
      "command": "GITHUB_OUTPUT=<ignored-output> node scripts/release/version-pr.mjs --intent",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Product Changesets and SDK inventory integration before repair",
      "command": "node --test tests/governance/dependency-note-consumption.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Complete SDK intake and maintenance lifecycle regressions after product note separation",
      "command": "node --test tests/governance/dependency-automation-intake.test.mjs tests/governance/dependency-note-consumption.test.mjs tests/governance/dependency-intake-vcs.test.mjs",
      "result": "pass",
      "passed": 62,
      "failures": 0
    },
    {
      "name": "Full governance with maintenance integration",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "passed": 565,
      "failures": 0
    },
    {
      "name": "Distribution configuration mapping before repair",
      "command": "node --test tests/governance/release-contract.test.mjs",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Final complete portable test lane",
      "command": "LAPIS_DESKTOP_BASE=ebdad8f09991ea33b06a87839d9393547b415c86 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm test",
      "result": "pass",
      "passed": 2010,
      "ignored": 2,
      "failures": 0
    },
    {
      "name": "Complete portable quality lane",
      "command": "LAPIS_DESKTOP_BASE=ebdad8f09991ea33b06a87839d9393547b415c86 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Complete portable specification check",
      "command": "LAPIS_DESKTOP_BASE=ebdad8f09991ea33b06a87839d9393547b415c86 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm spec:check",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Immutable evidence inventory",
      "command": "LAPIS_DESKTOP_BASE=ebdad8f09991ea33b06a87839d9393547b415c86 LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/ui025-private-archives.json pnpm check:evidence",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "Release and canonical mapping regression family",
      "command": "node --test tests/governance/release-contract.test.mjs tests/governance/contracts.test.mjs",
      "result": "pass",
      "passed": 9,
      "failures": 0
    }
  ],
  "versions": {
    "node": "26.8.2",
    "pnpm": "10.34.5",
    "rust": "1.99.0",
    "changesets": "3.0.3",
    "specValidator": "0.2.1",
    "tapSource": "2dffdb8d056dce83a3dfb52a46277185b57c941e",
    "privateAiArchiveSha256": "071f885c9c0b4efe0722bd3771a632583a7416d62a59f17d2c9f3d9ac9ea3630",
    "cliSource": "cadc20b8200e3388486549509a00981b6c164eb6",
    "coreSource": "83fca8ddd25b7b7913723e231779862f94f7dbcb"
  },
  "remaining": [
    "Source/tap PR CI and review, corrected CLI release, and final released-source alignment remain required.",
    "Version PR merge, full exact-main CI, qualified candidate/publication and first real Homebrew formula/public preview acceptance remain pending.",
    "Existing native quarantines, macOS build-only limits, private AI prerequisites, visual review and stable cutover remain separate."
  ]
}
```
