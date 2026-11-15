# Cold native remotes preparation and admission

```json
{
  "id": "E-REPO-059",
  "date": "2026-11-15",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": ["LD-REPO-001", "LD-REPO-005", "LD-GOV-006"],
  "versions": {
    "node": "24.10.0",
    "nativeCore": "4d4d1983c9c1a44b20c77ddcd4ef32b6000f05dc",
    "mergedCore": "c32b5ae48b24c98dfa8de2004cf68e0496cd63bd",
    "profile": "0.2.2 registry",
    "history": "0.5.1 registry",
    "privateAI": "0.2.0 / 88265a2a818f8411e6d61c91289f1901405cfa3ee7a08adf04a096ccf91a58a2",
    "desktopParent": "1717bbe3ccc35701b66b8bd4b54bb9fa936cd8aa"
  },
  "files": [
    "tests/desktop/editing-owner.test.mjs",
    "tests/desktop/repository-admission.test.mjs",
    "scripts/native-optional-inventory.json",
    "tests/desktop/repository-http-fixture.mjs",
    "tests/desktop/repository-remotes-https.test.mjs",
    "spec/src/verification-notes.md",
    "spec/src/navigation/history-02.md",
    "tests/desktop/repository-remotes-ssh.test.mjs",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/plugins.md",
    "catalog/plugins/ai/MultiRecipient.stories.ts"
  ],
  "remaining": [
    "Complete checked-head PR, merge, exact-main full CI and GitHub candidate qualification/publication."
  ],
  "runs": [
    {
      "name": "cold-preparation-first",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api",
      "result": "fail",
      "failures": 1,
      "note": "Fresh checkout lacks the bundled CLI resource; zero tests execute. Prepared the CLI from the pinned Server source and staged the verified released AI 0.2.0 macOS archive (SHA256 fa2fa5077831b21f482c93f7358332516b455a17d2f05a6445fc07e4ffd1486a)."
    },
    {
      "name": "cold-preparation-second",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api",
      "result": "fail",
      "failures": 1,
      "note": "The native-test renderer needs the existing signed-distribution fixture metadata. Prepared actual packed Tasks and Word Count resources through their public artifact helpers; ephemeral fixture keys are removed. Zero tests execute before that correction."
    },
    {
      "name": "cold-native-api-baseline",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api",
      "result": "fail",
      "failures": 3,
      "note": "Actual debug e2e app builds. Of 21 cases, 15 pass and 3 retain existing quarantines. Failures are a Core-turn startup acknowledgement timeout, an obsolete renderer-default assertion and an obsolete denial of passive status after Repository observer release."
    },
    {
      "name": "native-turn-exact",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/ai-turn-owner.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Fresh exact process passes 1/1 with unchanged deadlines/assertions after retaining the startup failure. No quarantine or retry policy was added."
    },
    {
      "name": "native-admission-exact",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/editing-owner.test.mjs tests/desktop/repository-admission.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "3/3 pass after asserting default Core editing, explicit renderer refusal, passive status without file capture after observer release, and refusal after vault closure. History still requires its separate admission."
    },
    {
      "name": "native-os-custody",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/editing-owner.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Actual OS store save/replace/forget, endpoint scope, cold persistence and secret redaction pass. Fixtures use private installation outside repository ancestors, hostname credential scope and lapis-backup bookmark. Earlier three fixture corrections remain in logs."
    },
    {
      "name": "merged-core-native-api",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api",
      "result": "fail",
      "failures": 1,
      "note": "Merged Core c32b5ae: 22 cases, 18 pass, 1 first-process Core-AI acknowledgement deadline failure, 3 existing quarantines. Exact AI case passes without changing assertions/deadlines; full lane is not qualified."
    },
    {
      "name": "native-https",
      "command": "LAPIS_DESKTOP_REMOTES_HTTPS=1 node --import tsx --test --test-concurrency=1 tests/desktop/repository-remotes-https.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Two cold actual-app runs pass with merged Core: 1 branch receives, 6 authenticated reads, 2 anonymous reads, 0 leaked credentials. Exact selected push, manual save/test, target isolation, dirty bytes/checkout/tree/pin preservation pass. Final frontend registry rebuild remains separate."
    },
    {
      "name": "final-check-baseline",
      "command": "pnpm check",
      "result": "fail",
      "failures": 8,
      "note": "Evidence schema/coverage (5), repository chapter lines (1), evidence navigation (1) and verification byte bound (1). Corrected documentation and inventory before rerunning this exact gate."
    },
    {
      "name": "final-check-second",
      "command": "pnpm check",
      "result": "fail",
      "failures": 3,
      "note": "New moved qualification notes need fresh evidence coverage; formatter leaves chapter at 401 lines and verification at 32825 bytes. Move one complete historical evidence paragraph to qualification notes and compact header contract without deleting requirements."
    },
    {
      "name": "final-check-third",
      "command": "pnpm check",
      "result": "fail",
      "failures": 11,
      "note": "All type/architecture/native strict checks pass; formatter finds 11 adoption files. Formatted only those files, then reran the complete exact check."
    },
    {
      "name": "final-check-fourth",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "Zero diagnostics, full architecture/App ownership, specification validation, ordinary/e2e strict Clippy, catalog parity and formatting pass."
    },
    {
      "name": "final-native-api-built",
      "command": "LAPIS_DESKTOP_NATIVE_LANE=1 pnpm test:native:macos -- api",
      "result": "fail",
      "failures": 1,
      "note": "Final registry renderer/app rebuild succeeds. 22 cases: 18 pass, one initial Core-AI renderer deadline, three existing quarantines. Actual remotes OS custody passes."
    },
    {
      "name": "final-native-api-compiled",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/core-file-service.test.mjs tests/desktop/editing-owner.test.mjs tests/desktop/tasks-owner.test.mjs tests/desktop/metadata-owner.test.mjs tests/desktop/search-owner.test.mjs tests/desktop/search-provider.test.mjs tests/desktop/ai-admission.test.mjs tests/desktop/ai-turn-owner.test.mjs tests/desktop/ai-native-queue-admission.test.mjs tests/desktop/ai-native-queue-owner.test.mjs tests/desktop/repository-admission.test.mjs tests/desktop/repository-service-lifetime.test.mjs tests/desktop/repository-indexed-search.test.mjs tests/desktop/repository-backup-recovery.test.mjs tests/desktop/repository-backup-resume.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Same compiled final artifact, fresh processes: complete 22-case inventory has 19 pass and three unchanged existing quarantines. The exact isolated Core-AI case separately passes 1/1. No assertion, timeout, quarantine or product code changes hide the failed build-adjacent startup."
    },
    {
      "name": "final-native-https",
      "command": "LAPIS_DESKTOP_REMOTES_HTTPS=1 node --import tsx --test --test-concurrency=1 tests/desktop/repository-remotes-https.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Final released renderer rebuilt in actual macOS app with merged Core. Complete HTTPS/OS-custody selected-original publication journey passes 1/1."
    },
    {
      "name": "final-audit",
      "command": "node --input-type=module -e \"import {runAudit} from './scripts/ci-audit.mjs'; process.exitCode=runAudit()\"",
      "result": "pass",
      "failures": 0,
      "note": "Full and production reports pass the existing exact path/version/expiry policy. Three existing development advisories (four affected edges), zero production advisories. No exception changed."
    },
    {
      "name": "final-default-test-baseline",
      "command": "pnpm test",
      "result": "fail",
      "failures": 1,
      "note": "774 Node cases: 773 pass, one stale cohort guard expects API 0.6.4 instead of released 0.6.5. Exact focused reproduction fails once; update the expected API/lock context and strengthen Profile 0.2.2/History 0.5.1 assertions. Exact repaired case and complete 7-case governance family pass."
    },
    {
      "name": "final-default-test",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "note": "774 Node governance/renderer passes; 746 AI cases in 152 files; 258 Rust passes, two existing ignores across 55 summaries. This fixes the stale exact-version assertion; no product logic is changed."
    },
    {
      "name": "final-renderer-static",
      "command": "pnpm build && pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "note": "Both final released-cohort production builds succeed in isolated Docker snapshots."
    },
    {
      "name": "cold-host-ssh",
      "command": "LAPIS_DESKTOP_REMOTES_SSH=1 node --import tsx --test --test-concurrency=1 tests/desktop/repository-remotes-ssh.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Actual macOS app passes 1/1: ephemeral agent, synthetic key, exact one-branch push/one receive, authenticated fetch and independent backup connection/test. Replacing only the temporary loopback host key with a wrong key is refused. Dirty checkout bytes remain unchanged. Synthetic private keys/agent and the exact host-key entry are retired in finally; no certificate trust is modified. Initial local script and first durable test also pass."
    },
    {
      "name": "native-inventory",
      "command": "node --test tests/governance/native-scope-inventory.test.mjs tests/governance/native-lane-defaults.test.mjs",
      "result": "pass",
      "failures": 0,
      "note": "Nine cases prove explicit native test inventory and exclusion from default lanes; new SSH case remains standalone and opt-in."
    },
    {
      "name": "final-spec-ssh-inventory-baseline",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "The snapshot captured the new SSH acceptance file before its evidence entry was added. E-REPO-059 now covers it; rerun the exact specification gate."
    },
    {
      "name": "final-spec-mappings",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 5,
      "note": "After the SSH inventory coverage is added, spec-first identifies five mapped canonical confirmations missing from the full adoption range. Update AI/file guard unchanged-contract confirmations, final registry governance cohort and Desktop/plugin ownership; retain all prior gates."
    },
    {
      "name": "final-spec-ai-bound",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "note": "Formatter expanded the AI unchanged-contract confirmation to 401 lines. Compact that same confirmation without removing its existing startup/admission gaps; canonical AI returns to 400 lines."
    },
    {
      "name": "final-repository-catalog",
      "command": "pnpm test:storybook -- catalog/plugins/repository",
      "result": "pass",
      "failures": 0,
      "note": "Final registry cohort: 171 cases in 31 files pass in each of desktop/light, narrow/light, desktop/dark and narrow/dark; 684 total. Source snapshot predates only later formatting/evidence and standalone SSH acceptance changes."
    },
    {
      "name": "final-catalog-shard-one-first",
      "command": "pnpm test:storybook -- --shard=1/4",
      "result": "fail",
      "failures": 1,
      "note": "Three variants pass 127/127; narrow/dark has 126 pass and one One Authored Message failure finding the Writer option after the first mention. The exact case passes all four cold variants unchanged. The story types its next mention before awaiting restored editor focus; add a focus-handoff assertion before subsequent typing, preserving every content/delivery assertion and deadline."
    },
    {
      "name": "final-source-gates",
      "command": "pnpm spec:check && pnpm check",
      "result": "pass",
      "failures": 0,
      "note": "After all mapped confirmations: four specification lanes pass; complete check has zero diagnostics, architecture/App ownership and ordinary/e2e strict Clippy, parity and formatter success. The later one-story focus assertion receives its focused/family qualification separately."
    },
    {
      "name": "multi-recipient-focus-exact",
      "command": "pnpm test:storybook -- catalog/plugins/ai/MultiRecipient.stories.ts -t 'One Authored Message'",
      "result": "pass",
      "failures": 0,
      "note": "Four cold layout/theme cases pass with the new editor-focus handoff assertion. All existing authored-content, recipients, sessions and delivery assertions remain."
    },
    {
      "name": "multi-recipient-focus-family",
      "command": "pnpm test:storybook -- catalog/plugins/ai/MultiRecipient.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 20 interaction/accessibility cases pass across four variants after that private story-flow change. The full shard-one rerun retains its original story implementation and is recorded independently."
    },
    {
      "name": "full-shard-one-repeat",
      "command": "pnpm test:storybook -- --shard=1/4",
      "result": "fail",
      "failures": 1,
      "note": "Before the story fix, narrow/light reproduces the same missing Writer option in One Authored Message (126/127). This confirms the sequential mention readiness assumption rather than a viewport-specific assertion."
    },
    {
      "name": "full-shard-one-first-focus",
      "command": "pnpm test:storybook -- --shard=1/4",
      "result": "fail",
      "failures": 1,
      "note": "With the focus guard only in One Authored Message, both light variants pass 127/127. Desktop/dark finds the same missing Writer option in Separate Approvals (126/127). Share the portal-closure/editor-focus assertion across all three mention loops in this private story family."
    },
    {
      "name": "mention-family-exact",
      "command": "pnpm test:storybook -- catalog/plugins/ai/MultiRecipient.stories.ts -t 'One Authored Message|Separate Approvals'",
      "result": "pass",
      "failures": 0,
      "note": "Eight exact cases pass across all display variants with the shared private mention helper. No product change, deadline increase or assertion reduction."
    },
    {
      "name": "mention-family-complete",
      "command": "pnpm test:storybook -- catalog/plugins/ai/MultiRecipient.stories.ts",
      "result": "pass",
      "failures": 0,
      "note": "All 20 cases pass after consistently waiting for the selected option to disappear and the editor to regain focus before the next keyboard action."
    },
    {
      "name": "final-complete-catalog",
      "command": "pnpm test:storybook -- --shard=1/4; pnpm test:storybook -- --shard=2/4; pnpm test:storybook -- --shard=3/4; pnpm test:storybook -- --shard=4/4",
      "result": "pass",
      "failures": 0,
      "note": "Final complete inventory: 127, 134, 130 and 151 distinct cases per shard, each in all four display variants (29 files per shard). Union: 2168 passes / 116 files. Shard one uses the consistent mention helper; shards two-four do not consume that private story helper. All production/runtime inputs match; differences across snapshots are later evidence, formatting and standalone native acceptance only. Exact original failures are retained above."
    },
    {
      "name": "final-check-and-specification",
      "command": "pnpm check && pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "note": "Final helper and mapped contracts: complete check passes, then all four specification lanes pass. No assertion, a11y threshold, baseline or quarantine is weakened."
    }
  ],
  "contractReview": "Core retains admission, synchronization and transfer policy. Desktop supplies scoped OS/Tauri adapters. Original/backup operations remain isolated. No application-data migration is required.",
  "acceptanceReview": "Actual macOS OS-custody and public-TLS Git tests are distinct from browser fixtures and portable qualification. Initial failed preparation, startup and transport attempts remain recorded; final registry adoption still needs final gates."
}
```

Actual HTTPS uses an account-free localhost.run tunnel with generated
repositories and synthetic tokens, isolated SSH configuration and no user
identities. Cloudflare DNS attempts fail before transfers. The approved scoped
localhost Keychain trust experiment does not solve Git CA validation; trust and
certificate are removed in finally. No OS trust change or permission prompt
remains. An initial alternate tunnel URL match selects an admin URL; restricting
it to the actual app.lhr.life endpoint fixes the fixture. Both final transport
runs succeed.

On-demand macOS results supplement portable Docker and hosted CI; they do not
qualify visible native-window behavior or publication. Logs are retained under
`/tmp/lapis-desktop-remotes-native-*` and `cold-native-api-*`.

A later rebase retains main PR #37 CLI qualification verbatim. Two navigation/
verification conflicts combine both evidence sets; no implementation changes.
