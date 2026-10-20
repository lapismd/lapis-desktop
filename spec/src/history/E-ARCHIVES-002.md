# Complete local dependency refresh

The review app had an old Search payload despite newer committed source. The
complete source cohort now follows committed default-checkout work, including
work outside `main`. This record separates preparation, installation and native
review; existing migration gates remain unchanged.

```json
{
  "id": "E-ARCHIVES-002",
  "date": "2026-10-20",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M1"],
  "requirements": ["LD-GOV-006", "LD-GOV-008"],
  "versions": {
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "platform": "macOS ARM64"
  },
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    "README.md",
    "MIGRATION.md",
    "scripts/local-dependency-sources.mjs",
    "scripts/refresh-local-dependencies.mjs",
    "tests/governance/local-dependency-sources.test.mjs",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/verification.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/history/E-ARCHIVES-002.md",
    "spec/src/history/index.md",
    "spec/src/SUMMARY.md",
    "scripts/spec-contracts.mjs",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/index.md",
    "scripts/local-archives.mjs",
    "tests/governance/archive-development-dependencies.test.mjs",
    "tests/ai/chat/recipient-selection.test.ts",
    "tests/ai/sessions/plugin-data.test.ts",
    "spec/src/current/ai.md",
    "spec/src/current/ai-addressing.md"
  ],
  "contractReview": "LD-GOV-006/008 retain portable registry ranges, source-owned public builds and checksum/payload verification. The private refresh command rebuilds the complete first-party dependency closure from committed default-checkout inputs and fingerprints linked exports. It does not move source bookmarks, publish packages or include unrelated uncommitted source.",
  "milestoneReview": "M1 remains Done at its original gate. Refreshing dependencies and the ordinary review bundle does not qualify new AI, provider, distribution or platform gates; all existing statuses remain unchanged.",
  "runs": [
    {
      "name": "search-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Search.stories.ts",
      "result": "fail",
      "failures": 7,
      "note": "All seven current History Search stories fail against the old installed Search payload. search-before.log retains accessible-name failures and missing unified history behavior. The earlier ExactFileVersion selector skipped all seven because Storybook uses the spaced story name; the complete family was then run."
    },
    {
      "name": "source-status-before",
      "command": "pnpm local:status",
      "result": "fail",
      "failures": 19,
      "note": "Nineteen of 21 packages have old or missing receipts. Missing linked-build receipts are unqualified, not proof that their source bytes are old. Installed API and Mira source revisions already match. status-before.log."
    },
    {
      "name": "source-selection-regressions",
      "command": "node --test tests/governance/local-dependency-sources.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "4/4 pass: real JJ checkout work ahead of main, named empty integration commits, unrelated documentation preservation, rejection of dirty package/build inputs, incompatible source ranges and stale linked exports. source-tests.log."
    },
    {
      "name": "refresh-runtime-before",
      "command": "pnpm local:refresh",
      "result": "fail",
      "failures": 1,
      "note": "refresh.log: source preparation reaches Spec Validator but rejects machine Deno 2.9.7 against its exact 2.9.5 pin. Refresh now reads that source pin and uses temporary official npm Deno tooling without changing the default installation."
    },
    {
      "name": "refresh-private-metadata-before",
      "command": "pnpm local:refresh",
      "result": "fail",
      "failures": 1,
      "note": "refresh-final.log: public builds pass, but the new tool assumes every package has repository.url. Private AI intentionally omits it; preparation now records its owning local repository identity. The old candidate manifest remains untouched in both failed runs."
    },
    {
      "name": "complete-public-preparation",
      "command": "pnpm local:refresh",
      "result": "pass",
      "failures": 0,
      "note": "refresh-complete.log: 17 public archives and four linked clients rebuilt from committed source. Design Core owner packaging compiles 3 CSS files and audits 258 with zero remaining utility references. Manifests/checksums are replaced only after all groups complete."
    },
    {
      "name": "native-helper-refresh",
      "command": "CARGO_BUILD_JOBS=2 pnpm ai:prepare",
      "result": "pass",
      "failures": 0,
      "note": "ai-prepare.log: four native helpers built from lapis-ai d8d6a61d and verified/staged. Existing lapis-compute compact-unwind linker warning remains."
    },
    {
      "name": "native-dependency-check",
      "command": "CARGO_BUILD_JOBS=2 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm check:rust",
      "result": "pass",
      "failures": 0,
      "note": "native-check.log: strict Clippy across all Desktop targets and current native sibling dependencies passes."
    },
    {
      "name": "governance-family",
      "command": "node --test tests/governance/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "governance-tests-final.log: 73/73 pass after the source-range and published-development-pin regressions were added."
    },
    {
      "name": "specification-size-before",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 2,
      "note": "spec-validate-before-install.log: governance 410 and migration 401 physical lines exceed the original 400 limit. Local intake is split into its own canonical topic, legacy workflow prose is condensed and the migration note shortened. No budget is raised."
    },
    {
      "name": "complete-install-range-before",
      "command": "pnpm local:install",
      "result": "fail",
      "failures": 1,
      "note": "install.log: archive checksum/identity preflight passes, then current Source Editor/Markdown/Graph manifests reject Design Core 0.5.1 with ^0.4.0. Stop occurred after normal review Quit and scoped Storybook stop; tracked dependency files were restored. Fix stays in lapis-plugins; Desktop adds an early semver-closure preflight, with 4/4 regression tests passing. No admission check is weakened."
    },
    {
      "name": "published-dev-pin-before",
      "command": "pnpm local:install",
      "result": "fail",
      "failures": 1,
      "note": "install-compatible.log: the archive hook incorrectly checks published AI Host development-only Spec Validator 0.1.0 against the selected 0.1.4. Only local workspace development dependencies now join admission; runtime and peer constraints remain strict."
    },
    {
      "name": "archive-regression-family",
      "command": "node --test tests/governance/*archive*.test.mjs tests/governance/local-dependency-sources.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Focused source/archive family passes 11/11; the published-development-pin regression changes 1 failure to 1 pass. No installed package or registry range is patched."
    },
    {
      "name": "outline-consumer-before",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Search.stories.ts",
      "result": "fail",
      "failures": 7,
      "note": "After installing current Search, all intended interactions are reached but seven cases fail axe list semantics in the source-owned empty Markdown Outline. Source fix and governed No headings regression live in lapis-plugins; no Desktop workaround."
    },
    {
      "name": "source-wider-catalog",
      "command": "pnpm test:storybook (lapis-plugins)",
      "result": "fail",
      "failures": 16,
      "note": "First shard: 47 pass, 16 fail; Bases Registry 4, Markdown ReadingSurface 4, Sync History 6, Sync Shell 2. User explicitly deferred wider catalog investigations to finish Desktop review. Later shards are unqualified; source records retain details."
    },
    {
      "name": "source-audit-final",
      "command": "pnpm check (lapis-plugins)",
      "result": "fail",
      "failures": 2,
      "note": "Audit reports two additional moderate Vite development-tool paths under GHSA-698v-4r3x-3vcv, plus the same two existing ignored advisories. User explicitly deferred the tooling advisories to finish review. No ignore added. Remaining package lanes run separately."
    },
    {
      "name": "renderer-policy-family",
      "command": "node --import tsx --test tests/renderer/*.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "renderer-tests-final.log: 321/321 pass."
    },
    {
      "name": "source-focused-after",
      "command": "pnpm exec vitest run --project storybook stories/plugins/markdown/panels/Outline.stories.ts stories/plugins/ai-history/panels/History.stories.ts --no-file-parallelism; pnpm exec vitest run --project storybook stories/plugins/ai/panels/History.stories.ts --no-file-parallelism",
      "result": "pass",
      "failures": 0,
      "note": "Fresh source processes: Outline 7/7 (including the new empty-state regression) and AI History 6/6 pass. Markdown check, 62 unit tests and public build/publint pass. The first command selected only Outline because the extra AI path did not exist; the second explicitly verified the actual AI History family."
    },
    {
      "name": "source-final-package-lanes",
      "command": "pnpm packages:check && pnpm check:app-ownership && pnpm check:no-tailwind && node --env-file-if-exists=.env scripts/run-turbo.mjs check && pnpm test && pnpm build && pnpm build-storybook; pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Separate lanes after the audit stop: 13 check tasks, 13 test tasks/793 unit tests, 12 public build/publint tasks, static Storybook and three specification lanes pass. Existing Turbo cache hits are recorded. Aggregate check and wider interactions remain deferred failures."
    },
    {
      "name": "complete-final-install",
      "command": "node .local/latest-deps/repack-final.mjs && pnpm local:install && pnpm local:status",
      "result": "pass",
      "failures": 0,
      "note": "Repacked only changed, already-built Plugins 49159087 and Agent Redaction 3c3dc0d7 in the complete cohort. 17 archives install with tracked dependency files preserved; all 21 packages current and 64 direct/transitive archive routes verified. Four linked exports retain verified fingerprints."
    },
    {
      "name": "original-search-after",
      "command": "pnpm exec vitest run --config vitest.catalog.config.ts catalog/plugins/repository/Search.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "search-final.log: 7/7 interaction/accessibility cases pass, against the installed public archives in a fresh process. Original seven old-Search failures and seven later Outline failures are both resolved."
    },
    {
      "name": "desktop-types-final",
      "command": "pnpm check:types",
      "result": "pass",
      "failures": 0,
      "note": "desktop-types-final.log: zero errors and zero warnings after final source installation."
    },
    {
      "name": "desktop-all-search-presentations",
      "command": "pnpm test:storybook catalog/plugins/repository/Search.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "search-all-presentations-final.log: 28/28 interaction/accessibility cases pass across desktop/narrow and light/dark, with fresh processes for each presentation."
    },
    {
      "name": "desktop-unit-stale-assertions-before",
      "command": "CARGO_BUILD_JOBS=2 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm test",
      "result": "fail",
      "failures": 2,
      "note": "desktop-tests-final.log: Node 394/394 pass, AI 632 pass/2 fail; Rust was not reached. Both stale assertions concern unchanged local runtime: the namespace test expected an empty insertion rather than the canonical Markdown agent link (already enforced by agent-mention-links.test.ts), and legacy settings omitted the disabled automatic-mention default."
    },
    {
      "name": "desktop-unit-stale-assertions-after",
      "command": "pnpm exec vitest run --config vitest.ai.config.mjs tests/ai/chat/recipient-selection.test.ts tests/ai/sessions/plugin-data.test.ts",
      "result": "pass",
      "failures": 0,
      "note": "ai-stale-assertions-after.log: 11/11 pass. Exact link bytes, recipient selection arguments and full normalized settings remain asserted; no runtime change or weakened matching."
    },
    {
      "name": "review-bundle-final",
      "command": "CARGO_BUILD_JOBS=2 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm desktop:bundle --debug && pnpm check:bundle",
      "result": "pass",
      "failures": 0,
      "note": "review-bundle-final.log and bundle-audit-final.log: renderer 40.33s, native 18.31s, ordinary 561.65 MiB preview app; bundled resources verify, 328 renderer JS files, zero automation markers. Existing large-chunk and compact-unwind linker warnings remain."
    },
    {
      "name": "cold-review-launch",
      "command": "CUA getApp on the rebuilt Lapis Notes Preview.app",
      "result": "pass",
      "failures": 0,
      "note": "Cold packaged tauri://localhost launch restores Repository Review, AI and Note.md tabs and Search. Current files selector is visible; a later observation shows History selected. The Raise/menu interaction timed out; subsequent app selection succeeded. No chat was sent or vault file edited. The live History source showed temporarily unavailable for the current query; this is recorded as an unqualified native service observation, not a successful native history-search gate."
    },
    {
      "name": "owned-storybook-restored",
      "command": "pnpm storybook:start -- --port 7491",
      "result": "pass",
      "failures": 0,
      "note": "storybook-review-final.log: checkout-owned preview is running at http://127.0.0.1:7491. Unrelated servers remain untouched."
    },
    {
      "name": "source-main-push",
      "command": "jj bookmark set main -r @- && jj git push --bookmark main --remote codex-https (lapis-plugins)",
      "result": "fail",
      "failures": 1,
      "note": "Local main selects source 49159087. GitHub rejects the direct push with GH006: changes require a pull request and all nine status checks. No branch-protection bypass, PR, publication or force push. The default checkout remains clean and its source revision remains 49159087; final freshness check still reports all 21 current."
    },
    {
      "name": "desktop-unit-final",
      "command": "CARGO_BUILD_JOBS=2 MACOSX_DEPLOYMENT_TARGET=13.0 pnpm test",
      "result": "pass",
      "failures": 0,
      "note": "desktop-tests-reconciled-final.log: 394 Node governance/renderer tests, 634 AI policy tests and 203 Rust tests pass; two existing Rust ignores remain. The full command exits zero. The two stale assertion failures are resolved without runtime changes."
    },
    {
      "name": "desktop-final-governance",
      "command": "pnpm check:progress && pnpm spec:check && pnpm format:check",
      "result": "pass",
      "failures": 0,
      "note": "Progress passes for 41 tasks/221 evidence records; all four specification lanes and full Prettier/Rust formatting pass. Generated MIGRATION.md first required normal formatting; its normalized projection is current and original milestone statuses/gates are preserved."
    },
    {
      "name": "evidence-status-before",
      "command": "pnpm check:progress",
      "result": "fail",
      "failures": 1,
      "note": "Final record was initially marked pass while retaining deferred qualification gaps. Governance correctly refused it. Record status remains pending, preserving every gap and all original gates; the verified refresh/code slice and passing focused lanes are committed separately from aggregate qualification."
    }
  ],
  "remaining": [
    "User-deferred: 16 wider lapis-plugins catalog failures and two moderate Vite tooling advisory paths; remaining source shards are unqualified.",
    "Live History source reported temporarily unavailable for the current review-vault query. No native history-search success is claimed by this refresh; diagnose separately from archive freshness.",
    "Visual review/baselines and publication/signing remain deferred; original migration milestone statuses and gates are unchanged.",
    "Plugin source push is blocked by protected-main PR/CI requirements; verified commits remain available locally."
  ],
  "sourceSnapshots": [
    {
      "repository": "git+https://github.com/lapismd/mira-mde.git",
      "revision": "408809d3c41bbef9ad5d73da7ab515f9b0a3679f",
      "packages": [
        "@lapismd/mira-editor",
        "@lapismd/mira-plugin-ai",
        "@lapismd/mira-plugin-mermaid",
        "@lapismd/mira"
      ]
    },
    {
      "repository": "git+https://github.com/lapismd/design-core.git",
      "revision": "0e7b5b49d65cdc2efe1be82e4e6d0b32c8c5f291",
      "packages": ["@lapismd/design-core"]
    },
    {
      "repository": "git+https://github.com/lapismd/agent-redaction.git",
      "revision": "3c3dc0d768afbe197e796d4bf94c0be5074faa4c",
      "packages": ["@lapismd/agent-redaction"]
    },
    {
      "repository": "git+https://github.com/lapismd/ai-host.git",
      "revision": "58d0ffc5ca50e51f4ce23090a25228b99fb7f397",
      "packages": ["@lapismd/ai-host"]
    },
    {
      "repository": "git+https://github.com/lapismd/lapis-notes.git",
      "revision": "ce1a786e076af84ad35a5f20d337a0a679090100",
      "packages": [
        "@lapis-notes/ui",
        "@lapis-notes/api",
        "@lapis-notes/language-service",
        "@lapis-notes/file-explorer",
        "@lapis-notes/workspace"
      ]
    },
    {
      "repository": "git+https://github.com/lapismd/lapis-plugins.git",
      "revision": "49159087d809105bfa46550b07ca5ec5b57effa4",
      "packages": [
        "@lapis-notes/source-editor",
        "@lapis-notes/markdown",
        "@lapis-notes/search",
        "@lapis-notes/graph"
      ]
    },
    {
      "repository": "git+https://github.com/lapismd/spec-validator.git",
      "revision": "ab8cd63debcd6998978e5e57fdbab51c4aed9f63",
      "packages": ["@lapismd/spec-validator"]
    },
    {
      "repository": "https://github.com/lapismd/lapis-terminal.git",
      "revision": "d7e0a7cd710fef626e1350c116ca6e4b18986972",
      "packages": ["@lapismd/terminal"]
    },
    {
      "repository": "lapis-ai",
      "revision": "d8d6a61d98fd419fe5e63b09b043d2fd9d84a8c1",
      "packages": ["@lapismd/ai"]
    },
    {
      "repository": "https://github.com/stevejuma/jj-store.git",
      "revision": "3998e2b01cb4a1c4f4dba0e1e81f9c3e72f6e15b",
      "packages": ["@lapismd/jj-history", "@lapismd/jj-conversations"]
    }
  ]
}
```

Logs and source/archive inventories are under `.local/latest-deps` and
`.local/archives`. No visual baselines or publication/signing are authorized.
