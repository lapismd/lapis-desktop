# Docker-first consumer qualification

```json
{
  "id": "E-VALIDATION-002",
  "date": "2026-10-25",
  "revision": "enclosing-change",
  "result": "pending",
  "tasks": ["M8"],
  "requirements": [
    "LD-GOV-008",
    "LD-GOV-010",
    "LD-CAT-001",
    "LD-CAT-002",
    "LD-CAT-003",
    "LD-CAT-005"
  ],
  "contractReview": "Consumer acceptance uses exact source-qualified public archives and the fatal Svelte diagnostic guard; every discovered failure retains its original assertion and owning boundary.",
  "milestoneReview": "Supports Docker-first dependency intake. Existing M8 completion remains historical; native/provider, distribution and visual gates are separate.",
  "runs": [
    {
      "name": "drafts-fatal-guard-after",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/dependency-refresh-20261025/candidate-dc-repair/portable-archives.json pnpm test:storybook -- catalog/plugins/ai/Drafts.stories.ts -t 'Reopen Without Sending'",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "filteredCases": 20,
      "note": "All four viewport/theme modes pass with zero unhandled diagnostics against source-repaired DesignCore archive SHA4f8adef1; cold run1b0274b9-b317-48fc-9ba5-01de599933df. Source final admission remains pending; active overlay unchanged."
    },
    {
      "name": "provisional-complete-catalog-before",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/dependency-refresh-20261025/candidate-dc-repair/portable-archives.json pnpm test:storybook",
      "result": "fail",
      "tests": 114,
      "failures": 6,
      "note": "First completed desktop/light shard has108passes and6missing-suggestion failures: LiveInboxControls1,FileMentions1,MultiRecipient4. The next shard is partially collected, then owned runf241ed57-cbd0-4968-a3fe-e7b9c3ad2bde is stopped after source remount cause is identified; no complete catalog claim."
    },
    {
      "name": "live-inbox-before",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/dependency-refresh-20261025/candidate-dc-repair/portable-archives.json pnpm test:storybook -- catalog/plugins/ai/ChatLayoutReview.stories.ts -t 'Live Inbox Controls'",
      "result": "fail",
      "failures": 1,
      "filteredCases": 8,
      "note": "Exact unchanged cold target reproduces absent /help App option. Run5a9238ee-9530-4725-81dc-02862b524079."
    },
    {
      "name": "replacement-exact-regressions",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/dependency-refresh-20261025/candidate-dc-remount/portable-archives.json pnpm test:storybook -- catalog/plugins/ai/Drafts.stories.ts catalog/plugins/ai/ChatLayoutReview.stories.ts catalog/plugins/ai/ErrorsAndMentions.stories.ts catalog/plugins/ai/MultiRecipient.stories.ts -t 'Reopen Without Sending|Live Inbox Controls|File Mentions|One Authored Message|Create Named Participant|Visible Work And Cancellation|Separate Approvals'",
      "result": "pass",
      "tests": 28,
      "failures": 0,
      "filteredCases": 64,
      "note": "All7 original scenarios pass in all4modes with zero fatal diagnostics against replacementSHA4f6b3f5c. Cold run5c44c08a-9664-40ae-a2ad-788670d02f6e."
    },
    {
      "name": "record-metadata-before",
      "command": "pnpm test",
      "result": "fail",
      "tests": 497,
      "failures": 1,
      "note": "496governance/renderer pass; progress contract detects missing versions/files/remaining metadata in new E-VALIDATION-002/E-CORE-024 records. Corrected record headers only, run2cf070f8-eff4-4488-9863-5dfcd0218225."
    },
    {
      "name": "record-scope-before",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test tests/governance/contracts.test.mjs",
      "result": "fail",
      "failures": 1,
      "note": "Exact static contracts rejects E-CORE-024 pass with aggregate R2.3 gaps in its scoped remaining list. The narrow native preflight has no own gaps; aggregate gaps stay explicit in milestoneReview/narrative and M10.2 remains In progress."
    },
    {
      "name": "replacement-catalog-first-shard",
      "command": "pnpm test:storybook",
      "result": "pass",
      "tests": 456,
      "failures": 0,
      "note": "Run00add2f4-0e24-4ffc-bc1f-8f459b604f07 retains all4 completed shard1 mode reports,114cases each. Owned run intentionally stopped before useful shard2 collection; exit137 is interrupted, not a complete default-run pass. Remaining explicit shards use byte-identical product/test/guard sources."
    },
    {
      "name": "jsonl-catalog-before",
      "command": "pnpm test:storybook -- --shard=3/4",
      "result": "fail",
      "tests": 134,
      "failures": 1,
      "unhandledErrors": 1,
      "note": "First desktop/light mode133pass/1fail. Jsonl Large Transcript loses opener focus and emits derived_inert. Owning stack: DesignCore AppShellSurfaceLayer cleanup microtask reads returnFocus after AgentUI conditional inspector owner is destroyed. Run375e5417-441c-43eb-805b-944a18bdbed8."
    },
    {
      "name": "jsonl-exact-before",
      "command": "pnpm test:storybook -- catalog/plugins/ai/Jsonl.stories.ts -t 'Large Transcript'",
      "result": "fail",
      "tests": 1,
      "failures": 1,
      "filteredCases": 9,
      "unhandledErrors": 1,
      "note": "Unchanged exact cold target reproduces the same fatal diagnostic and focus failure. Runa3941c48-b04d-4431-8ec8-d934272df612. The existing warning guard and original assertion remain unchanged."
    },
    {
      "name": "replacement-second-shard-historical",
      "command": "pnpm test:storybook -- --shard=2/4",
      "result": "pass",
      "tests": 226,
      "failures": 0,
      "note": "Run0af243f9-0463-46ce-9bd5-f06d0da3f0d4 retains desktop/light and narrow/light reports113cases each. Owned run stopped during dark mode after shared-source repair became necessary; partial output is retained and no complete-run claim is made."
    },
    {
      "name": "hover-listener-catalog-before",
      "command": "pnpm test:storybook -- --shard=4/4",
      "result": "fail",
      "tests": 143,
      "failures": 1,
      "unhandledErrors": 1,
      "note": "First desktop/light mode142pass/1fail, run44b6d80d-da8c-49d9-b2f0-93f9f929dee8. Bits2.19.5 link-preview delayed pointerup listener reads destroyed root after prior story cleanup. Released2.20.2 always returns listener cleanup."
    },
    {
      "name": "hover-listener-isolated-diagnosis",
      "command": "pnpm test:storybook -- catalog/plugins/ai/AgentMentionLinks.stories.ts -t 'Composer Suggestions'",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "filteredCases": 4,
      "note": "Unchanged isolated latest-reported case passes all4modes, run372dfd8d-e854-40fe-bc45-4ce5c9f2e1bd. The originating previous hover story is required to reproduce the leaked listener; this is diagnosis, not repair acceptance."
    },
    {
      "name": "hover-listener-exact-family-before",
      "command": "pnpm test:storybook -- catalog/plugins/ai/AgentMentionLinks.stories.ts",
      "result": "fail",
      "tests": 2,
      "failures": 1,
      "unhandledErrors": 1,
      "note": "Unchanged complete two-story family reproduces1pass/1failure and1unhandled derived_inert in first desktop/light mode, runb58b14ea-959a-41d3-bdb6-15ff7d9df978. No guard, assertion or teardown delay is weakened."
    },
    {
      "name": "complete-tests-after-record-repair",
      "command": "pnpm test",
      "result": "pass",
      "tests": 1479,
      "failures": 0,
      "note": "497governance/renderer,744AI and238Linuxnative cases across50Rust targets all pass, runb43ecca1-62b5-4265-bac9-cbdf602a4744. Native sources remain pinned to qualified Notes7161a447 and the recorded six-input inventory. This does not qualify macOS UI or provider acceptance."
    },
    {
      "name": "jsonl-exact-after-surface-repair",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/dependency-refresh-20261025/candidate-dc-surface/portable-archives.json pnpm test:storybook -- catalog/plugins/ai/Jsonl.stories.ts -t 'Large Transcript'",
      "result": "pass",
      "tests": 4,
      "failures": 0,
      "filteredCases": 36,
      "note": "Original exact target passes all4modes with zero fatal or unhandled diagnostics against independently audited archive567f022a; run0ad94522-b614-460b-941e-78eac3efa8c0. Final source/consumer aggregate admission remains pending; active overlay is unchanged."
    },
    {
      "name": "hover-listener-exact-family-after",
      "command": "LAPIS_DESKTOP_VALIDATION_ARCHIVES=.local/dependency-refresh-20261025/candidate-dc-surface/portable-archives.json pnpm test:storybook -- catalog/plugins/ai/AgentMentionLinks.stories.ts",
      "result": "pass",
      "tests": 8,
      "failures": 0,
      "note": "The same complete two-story family passes all4modes with zero fatal/unhandled diagnostics against audited567f022a, runb7adf2b0-0133-44c6-9d1c-aa305956d2b3. Final source and combined API/UI consumer-cohort qualification remain separate."
    },
    {
      "name": "design-core-complete-source-after",
      "command": "pnpm checks (Design Core composer-lifetime workspace)",
      "result": "pass",
      "failures": 0,
      "note": "Source run6e537654-89ad-4591-9260-285b44600850 passes922unit/browser,974stories,16workspace,17shell,3AI and153shared-control browser cases with1existing intentional skip; format/types/source-consumer/spec/static/metadata pass. Committed8318eb6d; all1557publicinputs equal audited567f022a archive. Final recordformat9b887ffc andspec8d10abb0 also pass."
    },
    {
      "name": "superseded-partial-cohort-interrupted",
      "command": "pnpm test:storybook -- --shard=1/4",
      "result": "pending",
      "note": "Owned runcee000dd-2d91-4857-9686-e18d455d3f9d started with a reconstructed25-entry cohort, then stopped when the authoritative26-entry set arrived (AgentUI/Search refresh plus AI prerequisite). Reports retained; no final catalog acceptance is claimed. Final matrix waits for the newly exposed source-owned SwipeItem repair. Zero observed failures before intentional interruption; this remains pending and is not a completed test pass.",
      "failures": 0
    },
    {
      "name": "swipe-item-source-and-original-consumer-after",
      "command": "pnpm checks (Design Core swipe-lifetime-20261025 workspace); pnpm packages:pack (isolated public archive workspace)",
      "result": "pass",
      "failures": 0,
      "note": "Source acf23771-150c-4c9e-8ecd-afed5174d76f passes 922 unit cases, 983 stories and 16 workspace, 17 shell, 3 AI and 153 shared-control browser cases, retaining 1 existing intentional skip. Format, types, spec, static build and metadata pass. Public audit 6911d642-6486-4f19-a8d6-6d5a0f65e5a4 passes clean types/cold behavior with the existing accepted low KaTeX exception. Commit 4af345c4 has 1,557 public inputs equal to c77a3a83; only 4 Swipe Item source/dist files differ from 567f022a among 4,312 payload files. Tasks original 2, affected 41 and full 275 unit + 2 native + 62 catalog cases all pass (ad70e333, 8696436c, 593aa1ee); guards and assertions are unchanged. Default DC rebase preserves all 6 unrelated dirty files and their exact patch."
    },
    {
      "name": "final-record-interruption-metadata-before",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test tests/governance/contracts.test.mjs",
      "result": "fail",
      "tests": 8,
      "failures": 1,
      "note": "Seven pass; progress contract rejects the interrupted25-entry attempt because its pending row lacks required observed-failure metadata. Corrected only that row to failures0 while retaining pending/interrupted status; no validator or product assertion changes."
    },
    {
      "name": "final-record-interruption-metadata-after",
      "command": "LAPIS_DESKTOP_VALIDATION_RUNTIME=native node --import tsx --test tests/governance/contracts.test.mjs",
      "result": "pass",
      "tests": 8,
      "failures": 0,
      "note": "Exact unchanged eight governance contracts all pass after recording zero observed failures on the intentionally interrupted pending cohort row. The interrupted test attempt remains pending; no product pass is inferred."
    },
    {
      "name": "final-cohort-catalog-shard-1",
      "command": "pnpm test:storybook -- --shard=1/4 (catalog-validation-1 workspace, configured 26-entry 934f8e85 archive manifest)",
      "result": "pass",
      "tests": 456,
      "failures": 0,
      "note": "Run 51ac7b2c-325f-41e1-be3d-b3398e471f62 retains all four desktop/narrow and light/dark JUnit reports, 114 cases each with zero failures/errors/skips. All 26 input names, versions and hashes exactly match the frozen final manifest, including DC c77. Source 1200b5a5 is an empty child of frozen 2e810560. Four of sixteen final matrix reports are complete; no complete catalog or native acceptance claim."
    },
    {
      "name": "final-cohort-catalog-shard-2-before",
      "command": "pnpm test:storybook -- --shard=2/4 (catalog-validation-2 workspace, configured 26-entry 934f8e85 archive manifest)",
      "result": "fail",
      "tests": 113,
      "failures": 4,
      "unhandledErrors": 0,
      "note": "Run 1bad2906-a678-4050-9c42-18a1a9d5802c stops after the first desktop/light mode: 109 passes, 4 failures. AI Catalog Retained Inventory and Toggle Failure And Retry observe the new loading Skeleton before inventory; Catalog Load Failure And Retry and User commands Unreadable Recovery cannot find the prior accessible alert. Original assertions and diagnostics remain unchanged."
    },
    {
      "name": "final-catalog-four-exact-before",
      "command": "pnpm test:storybook -- catalog/plugins/ai/Catalog.stories.ts catalog/plugins/ai/UserCommands.stories.ts -t 'Retained Inventory|Toggle Failure And Retry|Load Failure And Retry|Unreadable Recovery'",
      "result": "fail",
      "tests": 4,
      "failures": 4,
      "filteredCases": 2,
      "unhandledErrors": 0,
      "note": "Unchanged cold run 68ff45fe-d5c0-4d74-bc43-55f2660078f6 reproduces all four regressions. Source split: Agent UI Empty error content has no alert role; Desktop readyPanel waits for named Loading conversations but only obsolete Loading catalog text. The public tree already retains earlier visible groups in a separate conditional, so no retention rewrite is justified."
    },
    {
      "name": "provisional-exact-catalog-regressions",
      "command": "pnpm test:storybook -- catalog/plugins/ai/Catalog.stories.ts catalog/plugins/ai/UserCommands.stories.ts -t 'Retained Inventory|Toggle Failure And Retry|Load Failure And Retry|Unreadable Recovery'",
      "result": "pass",
      "tests": 16,
      "failures": 0,
      "note": "6109ede7: four original regressions pass in all four cold viewport/theme modes (16 executed; 8 name-filtered). Source 8842e36e equals frozen 2e810560 plus only the named Loading catalog readiness helper and mapped contract sentence. New provisional 26-entry inventory ebbc6da9 replaces only Agent UI f9fff47b and Repository UI 3907b5f4; all checksums/package identities and seven owner-build prerequisites match. Original first-mode four failures move to zero, with no changed assertions or timeouts. Owner source browser/static/package/spec qualification and final archive equality remain pending; this is overlap evidence, not admission."
    }
  ],
  "remaining": [
    "Original four Catalog/UserCommands regressions pass all 16 selected cases against the provisional public cohort. Qualify source-owner browser/static/package/spec repair and freeze final Agent UI/Repository UI outputs before affected Catalog/History/placement and remaining 12 of 16 complete catalog reports, renderer/build/governance lanes. Retain exact shard 1 baseline (456 passes); its 27 story families do not consume the corrected readiness helper. Never relabel baseline or provisional archive identities.",
    "Record final other-consumer/cohort admission separately; registry-only distribution, native product/provider and visual review remain open."
  ],
  "versions": {
    "desktopSource": "cd8858f6f06472681c265c42c511d54ca9e65038",
    "designCoreSource": "4af345c4cfb7401d004b83a7a81ff7e9a812aa21",
    "designCoreArchiveSha256": "c77a3a83391b9fafd42c7f99f695af03b29941c1022a5a8bbacb3964d45e55c7",
    "priorDesignCoreSource": "3bcbae3fcc9e8bfbf75371117b74ceb11173381a",
    "priorDesignCoreArchiveSha256": "4f6b3f5c6c619e3154cb2860881b7d89b9c11062db4cfa1eb9ae0488150b7a97",
    "frozenCatalogSource": "2e810560",
    "pnpm": "10.34.5",
    "nodeDocker": "24.15.0",
    "designCoreCommittedSource": "4af345c4cfb7401d004b83a7a81ff7e9a812aa21",
    "candidateBitsSource": "a27be8190fba7f77dcf2cd459595542749544070",
    "candidateBitsArchiveSha256": "7b0fea714ddc489a57340ba649276b9f23bbd91ffac38d62244e44d24b7a5109",
    "priorSurfaceDesignCoreSource": "8318eb6daf58b13bed5c7e90c36ceea6a982c965",
    "priorSurfaceDesignCoreArchiveSha256": "567f022a5013d9d70a435fcd60751ada91ff6e68396976ccfb016bc265d8672c",
    "finalCohortManifestSha256": "934f8e8527f61cddd830eea4e282616a49b988b77e5321d2fcfd3e9ff7e896d0",
    "finalCohortEntries": 26
  },
  "files": [
    ".storybook/vitest.setup.ts",
    "catalog/plugins/ai/Drafts.stories.ts",
    "catalog/plugins/ai/ChatLayoutReview.stories.ts",
    "catalog/plugins/ai/ErrorsAndMentions.stories.ts",
    "catalog/plugins/ai/MultiRecipient.stories.ts"
  ]
}
```

Source checks and Linux tooling/service evidence remain in
[E-VALIDATION-001](E-VALIDATION-001.md); archive identities and installation
evidence remain in [E-CORE-023](E-CORE-023.md).

The 26-entry catalog has no Bases import: Desktop's five static Notes plugins,
the public App Profile's four default plugins and its exact `d1846fd2` archive
exclude Bases. Adding an unused npm archive would not update the installed
plugin. Keep these catalog reports on their actual 26-entry inputs.

Signed Bases adoption is a separate pending gate. The native portable fixture
loads Bases 0.1.4 from source `147ba6e2`, signed archive `f2012aba`, with
runtime `main.mjs` SHA `5af482f6`. That bundle includes its own Design Core code
and does not contain the new filter accessible names. The old npm input
`6a123ebe` and provisional `51409979` contain 157 files each: 154 are identical,
while the two filter components and manifest differ. The provisional archive was
superseded when its source catalog exposed additional unnamed controls.

After complete source qualification, produce a fresh test-signed `.lapis-plugin`
from the same exact source as its npm archive, verify its signed payload and
host module contract, and run the focused installed-plugin
`tests/desktop/portable-database.test.mjs` Bases scenario plus the changed
filter-control accessibility interactions. Retain source, signed-artifact and
actual host evidence separately; historical native acceptance does not qualify
new plugin bytes. No signed fixtures, user vaults or installed plugins are
changed by this impact assessment.

## Provisional Catalog overlap

Run `6109ede7` passes the four original Catalog/UserCommands regressions across
all four viewport/theme modes: 16 executed, eight name-filtered, zero failures,
errors or unhandled runtime diagnostics. Manifest `ebbc6da9` and source
`8842e36e` retain exact receipts under
`.local/dependency-refresh-20261025/candidate-catalog-alerts-provisional/`. Only
Agent UI and Repository UI archives differ from the original 26-entry cohort;
their owner source gates remain pending. Broad consumer families wait for stable
Repository UI geometry fixes. Historical shard 1 remains qualified only under
its original `934f8e85` inventory and source identities.
