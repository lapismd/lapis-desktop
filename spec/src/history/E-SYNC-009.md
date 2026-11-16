# Integrate Sync with shared repository remotes

```json
{
  "id": "E-SYNC-009",
  "date": "2026-11-16",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-SYNC-001",
    "LD-SYNC-002",
    "LD-GOV-003",
    "LD-GOV-006",
    "LD-GOV-008",
    "LD-CAT-003"
  ],
  "contractReview": "Preserve qualified Sync and merged shared-remotes behavior. Native pins advance together to current main; retained verified private Notes/Tasks projection supplies the unreleased leave contract without changing portable registry ranges or authorizing publication.",
  "acceptanceReview": "Combined current-main source passes complete check/test/build/spec/static and required catalog coverage:1648unchanged cases from12successful batches plus520fresh cases in all4affected shard3variants,2168total. Earlier full command failed and remains recorded. Native transport/account and full encrypted journeys remain separate gates.",
  "versions": {
    "syncQualified": "37104689",
    "main": "c2971126269530d67d3b3a88a2f5e76f9d4cec90",
    "core": "c32b5ae48b24c98dfa8de2004cf68e0496cd63bd",
    "jjStore": "086def182eae2ab6e5dc39aba030390d7ea8612c",
    "frontierBlob": "6882b47cc41a2cce233fb652b4065f69cf005fc3",
    "apiRegistryShasum": "6154b90d5ac219b66e8a21ca223b6bdf5beaddfc",
    "finalPriorSpec": "0dc7bc9f-27f2-45b4-a742-22b0075968f8",
    "failedCatalogSource": "73f96243a0933f60d84d60bbd3324f8df88d932d"
  },
  "files": [
    "package.json",
    "pnpm-lock.yaml",
    "scripts/ci-install.mjs",
    "scripts/ci-prepare-links.mjs",
    "scripts/ci-sources.json",
    "scripts/validation/native-sources.json",
    "spec/src/current/lapis-sync.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/navigation/history-02.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/validation-native.test.mjs",
    "spec/src/history/E-SYNC-009.md",
    "spec/src/current/desktop.md",
    "tests/governance/profile-registry.test.mjs",
    "catalog/plugins/repository/NativeRemotes.stories.ts",
    "spec/src/current/plugins.md"
  ],
  "runs": [
    {
      "name": "Current main integration identifies12conflicting inputs",
      "command": "jj new internal/sync-foundations-qualified main@origin",
      "result": "fail",
      "failures": 12,
      "detail": "Conflict inventory:package/lock, CI installation/preparation/source pins, native sources/Cargo inputs, local dependency contract/navigation and cohort tests. Preserve new shared-remotes runtime and source pins while retaining the documented unreleased Sync leave archive cohort. This is integration-state evidence, not a functional test result."
    },
    {
      "name": "Combined exact cohort admission before compatibility resolution",
      "command": "pnpm validation -- run validation:check -- tests/governance/ci-prerequisites.test.mjs tests/governance/validation-native.test.mjs tests/governance/validation-archive-cohort.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Report05834643-17d6-4a4b-a807-319aeae4e3e4:strict hook refuses API0.6.5 for main Graph/Bases API^0.2.0 peers before tests execute. Retain Sync-qualified released Graph^0.1.12/Bases^0.4.1; no semver suppression or copied implementation. Lock preparation initially rejected a false lexical match on vfile; scalar-based protocol validation corrected task-only preparation before copying the normal registry lock."
    },
    {
      "name": "Combined exact cohort admission after compatible released peers",
      "command": "pnpm validation -- run validation:check -- tests/governance/ci-prerequisites.test.mjs tests/governance/validation-native.test.mjs tests/governance/validation-archive-cohort.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Reportce038a2c-6633-4282-9b73-6827686d674d:108pass/0fail/0skipped. Same strict archive hook and original assertions; actual API6.5 candidate import routes remain verified. Combined wider qualification follows."
    },
    {
      "name": "Complete current-main checks before broader test repair",
      "command": "pnpm check",
      "result": "pass",
      "failures": 0,
      "detail": "Reportb7572148-7bf1-43f8-b54e-50eaddfdb87d:complete types, architecture, App ownership, native checks and format pass with new Core/JJ source pins and32verified archive routes."
    },
    {
      "name": "Complete current-main Node suite finds stale profile projection fixture",
      "command": "pnpm test",
      "result": "fail",
      "failures": 1,
      "detail": "Report61572780-7b98-45c4-a327-f46551ec3cba:785pass/1fail/0skipped of786Node cases. New main profile-registry fixture supplies only Profile/AI and assumes no Sync cohort projection, contradicting the explicit temporary Sync leave-contract prerequisite. Later AI/Rust/build/catalog lanes did not execute."
    },
    {
      "name": "Exact profile projection fixture before repair",
      "command": "pnpm validation -- run validation:check -- tests/governance/profile-registry.test.mjs",
      "result": "fail",
      "failures": 1,
      "detail": "Report4f66c56b-0005-4c3d-90d0-472dff353bf9:96pass/1fail/0skipped of97. Exact fixture reproduces original private-range refusal. Update the fixture to the documented Sync migration contract:assert unchanged published source ranges, exact bounded private projection, and registry History/Mira/Bases preservation; no range or payload check waiver."
    },
    {
      "name": "Exact profile projection fixture after contract-aligned repair",
      "command": "pnpm validation -- run validation:check -- tests/governance/profile-registry.test.mjs",
      "result": "pass",
      "failures": 0,
      "detail": "Report6adf3e4c-ab79-4921-8f3f-981fe498aa57:97pass/0fail/0skipped, including96runner cases and repaired exact fixture. Asserts source manifest immutability, released API/Profile ranges, exact eight-package projection boundary, and unchanged registry History/Mira/Bases. Full consuming suite follows."
    },
    {
      "name": "Complete combined test surface after projection fixture repair",
      "command": "pnpm test",
      "result": "pass",
      "failures": 0,
      "detail": "Reportda5f811a-e0e8-4fa9-8875-b73172fd2ae1:786Node,746AIpolicy/152files,281Rust pass;0failures. Two existing invoked subprocess-helper ignores remain. Current main records258Rust; combined Sync adds23. The old-parent287count belongs to its distinct native repository implementation, not this current-main cohort."
    },
    {
      "name": "Complete combined production renderer build",
      "command": "pnpm build",
      "result": "pass",
      "failures": 0,
      "detail": "Report104a7ffb-21c9-4e01-8276-8aff961b3345:production renderer build passes with current-main remotes/History/Mira and32verified private archive routes."
    },
    {
      "name": "Complete combined specification",
      "command": "pnpm spec:check",
      "result": "pass",
      "failures": 0,
      "detail": "Reportc3370877-65b8-4875-a8da-5d795f9d5bd0:all4lanes pass, including immutable evidence/spec-first and existing chapter budgets."
    },
    {
      "name": "Complete combined static Storybook",
      "command": "pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Report89a2ccce-bc91-458a-b2c3-b360c388f4f6:static catalog builds. Full cold16batch interaction/accessibility lane follows; no visual baseline approval or native product claim."
    },
    {
      "name": "Complete cold current-main catalog finds push-review visibility boundary",
      "command": "pnpm test:storybook",
      "result": "fail",
      "failures": 1,
      "detail": "Reportd9c89688-584e-4113-8746-6ddaa5a270c4:1777pass/1fail across13executed batches. Working Copy And Review in NativeRemotes.stories.ts fails its exact URL toBeVisible assertion(desktop/light,shard3); other12batches pass. The other3shard3variants(390cases) did not execute after this failure. Preserve all assertions; inspect the populated public push-review dialog and source animation/readiness before repair."
    },
    {
      "name": "Exact cold review target retains assertion and diagnoses animated visibility",
      "command": "pnpm test:storybook -- catalog/plugins/repository/NativeRemotes.stories.ts -t 'Working Copy And Review'",
      "result": "pass",
      "failures": 0,
      "detail": "Reporte4f7c892-9a2d-4873-9f69-a65a3ab113e9:4target passes across4cold variants;12other family cases deliberately unselected, not qualified by this target. Read-only diagnostic shows the exact DD/DL visible but ancestor role=dialog data-state=open still running100ms enter animation(opacity0.22\u20130.58) at the original immediate assertion. The full-lane failure remains unrepaired evidence; this confirms dialog paint readiness is asynchronous. Remove diagnostic, await the same populated URL visibility within existing deadlines, and additionally require actual dialog removal after Cancel; no product/CSS change or assertion relaxation."
    },
    {
      "name": "Exact cold populated review and dismissal after readiness repair",
      "command": "pnpm test:storybook -- catalog/plugins/repository/NativeRemotes.stories.ts -t 'Working Copy And Review'",
      "result": "pass",
      "failures": 0,
      "detail": "Report6964e9cb-1165-4955-8972-ac85d9fbd911:4target passes across desktop/narrow and light/dark;12other cases unselected. Same URL and toBeVisible assertion; add bounded wait for that state and actual dialog removal after Cancel. Diagnostic removed. No product, CSS, timeout or baseline change."
    },
    {
      "name": "Complete directly affected remotes story family",
      "command": "pnpm test:storybook -- catalog/plugins/repository/NativeRemotes.stories.ts",
      "result": "pass",
      "failures": 0,
      "detail": "Report951ef6e2-31ba-4355-a70c-f151cbdf0790:16pass/0fail across all4stories and4cold variants, including connection, locked-storage/SSH and GitHub handoff presentation. Requalify the complete affected shard3(all4variants) to replace its failed/incomplete batches; prior12successful unchanged batches(shards1,2,4) retain exact source evidence."
    },
    {
      "name": "Final complete source lanes after remotes story readiness repair",
      "command": "pnpm check; pnpm test; pnpm build; pnpm spec:check; pnpm build-storybook",
      "result": "pass",
      "failures": 0,
      "detail": "Reports629cfc34-6802-494d-be66-206dba0be63a(check),da4fee52-f3b9-4d80-9230-1a21d97111a5(test),e65fba9e-7eaf-456c-bcbb-80ca6344bc63(build),e3f69dc1-8723-4e42-8361-8499040bf1cb(spec),0fe7dc36-37ae-4bb1-b0ec-9e0fbbd4ecc4(static). All pass:786Node/746AIpolicy/281Rust; two existing invoked helper ignores. No production/dependency/shared-fixture change after failed full catalog source73f96243; only NativeRemotes story, its owning contract and this receipt differ. Retain12successful unchanged batches and replace all4affected shard3variants with fresh cold runs."
    },
    {
      "name": "Complete cold affected shard replaces failed and unexecuted batches",
      "command": "pnpm test:storybook -- --shard=3/4",
      "result": "pass",
      "failures": 0,
      "detail": "Report33b0537a-80c8-4985-966e-2b4cedeeb356:all4variants desktop/narrow/light/dark pass130each,520total/0fail. Combined with1648passing unchanged cases from12batches in reportd9c89688, required16batch coverage totals2168passes. That earlier full command remains failed1777/1; no claim it passed. Source comparison limits differences to NativeRemotes story, owning Plugins contract and E009; no product/dependency/shared-fixture changes invalidate retained batches. Visual review remains pending."
    },
    {
      "name": "Final evidence status rejects overstated aggregate completion",
      "command": "pnpm spec:check",
      "result": "fail",
      "failures": 1,
      "detail": "Report3396a77b-a0d5-4a3f-adc8-a3bfba593bc3:LD-EVIDENCE refuses aggregate pass while remaining contains hosted/full-feature gates. Retain those gaps and return aggregate status to pending; all individual source qualification outcomes remain recorded."
    }
  ],
  "remaining": [
    "Hosted source PR CI, delivery and merge; no local source qualification remains.",
    "Actual Tauri/OS and full encrypted Sync journeys; publication/distribution and visual review retain separate gates."
  ]
}
```
