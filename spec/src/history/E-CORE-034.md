# Native editor qualification closure

```json
{
  "id": "E-CORE-034",
  "date": "2026-10-26",
  "revision": "enclosing-change",
  "result": "pass",
  "tasks": ["M16.7"],
  "requirements": [
    "LD-LIFE-001",
    "LD-LIFE-004",
    "LD-LIFE-007",
    "LD-LIFE-008",
    "LD-LIFE-009",
    "LD-CAT-003"
  ],
  "contractReview": "Final current-profile writer qualification preserves conditional persistence, native claims and the same Problems/recovery surfaces. Captured Properties setup and collapsed-drawer readiness strengthen original checks without changing bounds or authority.",
  "milestoneReview": "M16.7 Done. Final source-qualified public intake passes 12 portable gates, 2,068 catalog cases, 58 actual macOS native enabled-writer cases and ordinary/e2e complete-asset builds. Both Terminal exact regressions and Memory proof pass. Initial failed cohorts remain recorded; renderer editing stays default and native Tasks/shared readers, R3 and default cutover retain separate gates.",
  "versions": {
    "desktopParent": "fa13c1ce",
    "apiArchiveSha256": "a1fc412fd6cc1e7f40d18d8eafd48c89a66a248ec84cec71f00e11bb704707cd",
    "miraSource": "cb8f2b2bddcabc7ec0b15cb55035a40094b54df3",
    "miraArchiveSha256": "03e15e02bf8d4b61f56c096e31e2538a18fecb980e0e99ce6f1a155155dcf0e9",
    "provisionalMarkdownArchiveSha256": "bf1c1425eabf7987f7e7a165d953a65034b0588ca96f90584a54b0d7a7b80787",
    "nativeNotesSource": "6e76be484e875796418d9394a0c418035fb1d6f4",
    "node": "26.9.0",
    "pnpm": "10.34.5",
    "markdownSource": "814f6d2dde1dc685cfcff58e32c65304f2af28e5",
    "markdownArchiveSha256": "4cc5a02ef5fe16a418d6ce1f42c576403eacd34a8d084121900e4a98caa8395e",
    "agentUiSource": "0e549ebccbef4e91ff9157062b91ce6da5228a94",
    "agentUiArchiveSha256": "f9fff47b80e169e8a1d34e6b3ea9cfb6b0cdf1287ae9a9cd814efc1e470ad6c6"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
    "catalog/plugins/ai/Attachments.stories.ts",
    "catalog/plugins/desktop/EditingRecovery.stories.ts",
    "catalog/plugins/desktop/FileConflicts.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/desktop/editing-recovery/EditingRecoveryDemo.svelte",
    "catalog/support/desktop/editing-recovery/port.ts",
    "scripts/desktop-acceptance.mjs",
    "scripts/desktop-api-tests.mjs",
    "scripts/source-audit.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/SUMMARY.md",
    "spec/src/current/ai-memory.md",
    "spec/src/current/ai.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/migration.md",
    "spec/src/current/plugins.md",
    "spec/src/current/progress/milestones.md",
    "spec/src/current/verification.md",
    "spec/src/current/windows.md",
    "spec/src/current/writer-audit.md",
    "spec/src/history/E-CORE-033.md",
    "spec/src/history/E-CORE-034.md",
    "spec/src/history/core/index.md",
    "src/components/files/ConflictReview.svelte",
    "src/components/views/Shell.svelte",
    "src/lib/ai/memory/note-mutation.ts",
    "src/lib/desktop/shell-startup.ts",
    "src/lib/native/editing/intents.ts",
    "src/lib/notes/notes-dispose.ts",
    "src/lib/notes/notes-session.ts",
    "src-tauri/Cargo.lock",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/shell.rs",
    "src-tauri/src/host/vault/editing.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/vault/editing.rs",
    "src-tauri/src/vault/mod.rs",
    "src-tauri/tests/core_editing_service.rs",
    "tests/desktop/editing-owner.test.mjs",
    "tests/desktop/editing-recovery.test.mjs",
    "tests/desktop/file-deletion.test.mjs",
    "tests/desktop/file-reconciliation.test.mjs",
    "tests/desktop/file-ui-mutations.test.mjs",
    "tests/desktop/plugin-persistence.test.mjs",
    "tests/desktop/properties-persistence.test.mjs",
    "tests/desktop/settings-persistence.test.mjs",
    "tests/renderer/native-editing.test.mjs",
    "tests/renderer/notes-dispose.test.mjs",
    "tests/renderer/shell-startup.test.mjs",
    "tests/desktop/terminal-lifecycle.test.mjs"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Initial complete catalog attempt",
      "command": "pnpm test:storybook",
      "result": "fail",
      "tests": 120,
      "failures": 1
    },
    {
      "name": "Cold exact Classic collapsed geometry before readiness",
      "command": "pnpm test:storybook -- catalog/plugins/ai/Attachments.stories.ts -t '^Classic$'",
      "result": "fail",
      "tests": 2,
      "failures": 1,
      "unexecutedVariants": 2
    },
    {
      "name": "Cold exact Classic collapsed geometry after readiness",
      "command": "pnpm test:storybook -- catalog/plugins/ai/Attachments.stories.ts -t '^Classic$'",
      "result": "pass",
      "tests": 4,
      "failures": 0
    },
    {
      "name": "Native focused Properties capture before owning source repair",
      "command": "node --import tsx --test --test-name-pattern='a stale Properties record' tests/desktop/properties-persistence.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1
    },
    {
      "name": "Complete native Properties family with provisional public owner archives",
      "command": "node --import tsx --test tests/desktop/properties-persistence.test.mjs",
      "result": "pass",
      "tests": 4,
      "failures": 0
    },
    {
      "name": "Cold Agent UI error and command recovery against current qualified public archive",
      "command": "pnpm test:storybook -- catalog/plugins/ai/Catalog.stories.ts catalog/plugins/ai/UserCommands.stories.ts",
      "result": "pass",
      "tests": 24,
      "failures": 0
    },
    {
      "name": "Complete current-archive native writer/editing/popup family",
      "command": "/opt/homebrew/Cellar/node/26.9.0/bin/node --import tsx --test --test-concurrency=1 tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/properties-persistence.test.mjs tests/desktop/settings-persistence.test.mjs tests/desktop/plugin-persistence.test.mjs tests/desktop/popout-host.test.mjs tests/desktop/file-ui-mutations.test.mjs tests/desktop/file-deletion.test.mjs tests/desktop/file-reconciliation.test.mjs tests/desktop/file-creation.test.mjs tests/desktop/file-watch.test.mjs tests/desktop/file-operations.test.mjs tests/desktop/file-import.test.mjs tests/desktop/editing-owner.test.mjs tests/desktop/editing-recovery.test.mjs tests/desktop/popout-workspace.test.mjs",
      "result": "pass",
      "tests": 44,
      "failures": 0
    },
    {
      "name": "Ordinary bundle isolated dependency preparation before correction",
      "command": "pnpm exec tauri build --debug --bundles app",
      "result": "fail",
      "checks": 1,
      "failures": 1
    },
    {
      "name": "Ordinary bundle missing staged compute helper before correction",
      "command": "pnpm exec tauri build --debug --bundles app",
      "result": "fail",
      "checks": 1,
      "failures": 1
    },
    {
      "name": "Complete current-archive portable intake",
      "command": "pnpm check:storybook-parity; pnpm spec:validate; pnpm check:types; pnpm check:rust; pnpm check:rust:e2e; pnpm test; pnpm build; pnpm build-storybook; pnpm check:architecture; pnpm check:app-ownership; pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "checks": 12,
      "failures": 0
    },
    {
      "name": "Terminal retained-shell close before current failure selector",
      "command": "node --import tsx --test --test-name-pattern='cancelled close retains' tests/desktop/terminal-lifecycle.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1
    },
    {
      "name": "Ordinary complete-asset native configuration",
      "command": "pnpm exec tauri build --debug --bundles app",
      "result": "pass",
      "checks": 1,
      "failures": 0
    },
    {
      "name": "E2e complete-asset native configuration",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "checks": 1,
      "failures": 0
    },
    {
      "name": "Terminal retained-shell close using current native failure surface",
      "command": "node --import tsx --test --test-name-pattern='cancelled close retains' tests/desktop/terminal-lifecycle.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "Expanded enabled-writer run before final fixture and selector setup",
      "command": "/opt/homebrew/Cellar/node/26.9.0/bin/node --import tsx --test --test-concurrency=1 tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/properties-persistence.test.mjs tests/desktop/settings-persistence.test.mjs tests/desktop/plugin-persistence.test.mjs tests/desktop/popout-host.test.mjs tests/desktop/file-ui-mutations.test.mjs tests/desktop/file-deletion.test.mjs tests/desktop/file-reconciliation.test.mjs tests/desktop/file-creation.test.mjs tests/desktop/file-watch.test.mjs tests/desktop/file-operations.test.mjs tests/desktop/file-import.test.mjs tests/desktop/editing-owner.test.mjs tests/desktop/editing-recovery.test.mjs tests/desktop/popout-workspace.test.mjs tests/desktop/navigation-search-settings.test.mjs tests/desktop/navigation-graph.test.mjs tests/desktop/terminal-lifecycle.test.mjs tests/desktop/ai-memory.test.mjs tests/desktop/ai-notes-binding.test.mjs",
      "result": "fail",
      "tests": 58,
      "failures": 2
    },
    {
      "name": "Terminal revoked-vault exact before current failure selector",
      "command": "node --import tsx --test --test-name-pattern='revoked physical vault admission' tests/desktop/terminal-lifecycle.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1
    },
    {
      "name": "Terminal revoked-vault exact using current failure surface",
      "command": "node --import tsx --test --test-name-pattern='revoked physical vault admission' tests/desktop/terminal-lifecycle.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "Exact cold native Memory smoke with its existing proof flag enabled",
      "command": "node --import tsx --test tests/desktop/ai-memory.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "Final complete enabled-writer native family with corrected fixtures",
      "command": "/opt/homebrew/Cellar/node/26.9.0/bin/node --import tsx --test --test-concurrency=1 tests/desktop/notes-lifecycle.test.mjs tests/desktop/notes-conflicts.test.mjs tests/desktop/preview-conflicts.test.mjs tests/desktop/properties-persistence.test.mjs tests/desktop/settings-persistence.test.mjs tests/desktop/plugin-persistence.test.mjs tests/desktop/popout-host.test.mjs tests/desktop/file-ui-mutations.test.mjs tests/desktop/file-deletion.test.mjs tests/desktop/file-reconciliation.test.mjs tests/desktop/file-creation.test.mjs tests/desktop/file-watch.test.mjs tests/desktop/file-operations.test.mjs tests/desktop/file-import.test.mjs tests/desktop/editing-owner.test.mjs tests/desktop/editing-recovery.test.mjs tests/desktop/popout-workspace.test.mjs tests/desktop/navigation-search-settings.test.mjs tests/desktop/navigation-graph.test.mjs tests/desktop/terminal-lifecycle.test.mjs tests/desktop/ai-memory.test.mjs tests/desktop/ai-notes-binding.test.mjs",
      "result": "pass",
      "tests": 58,
      "failures": 0
    },
    {
      "name": "Complete current-archive catalog across all four native Docker shards",
      "command": "pnpm test:storybook -- --shard=1/4; pnpm test:storybook -- --shard=2/4; pnpm test:storybook -- --shard=3/4; pnpm test:storybook -- --shard=4/4",
      "result": "pass",
      "tests": 2068,
      "checks": 4,
      "failures": 0
    },
    {
      "name": "Original-gate ledger binding before completedGates was recorded",
      "command": "node scripts/progress.mjs --check",
      "result": "fail",
      "checks": 1,
      "failures": 1
    },
    {
      "name": "Retained immutable formatter baseline only",
      "command": "pnpm format:check",
      "result": "fail",
      "checks": 1,
      "failures": 1
    },
    {
      "name": "Final original-gate documentary closure",
      "command": "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check; pnpm check:architecture; pnpm check:app-ownership; pnpm check:storybook-parity; pnpm check:progress; pnpm spec:check",
      "result": "pass",
      "checks": 6,
      "failures": 0
    }
  ],
  "completedGates": {
    "M16.7": "Explicit Core editing selection binds real API/Markdown writers to admitted native intents; original conditional-save, conflict, leave/refused-leave and cold-recovery acceptance plus all affected catalog and portable/native checks pass without another save or recovery engine."
  }
}
```

Strict prerequisite receipt `0cf71301` passes all five checks. Its formatter
then flags generated MIGRATION whitespace plus unchanged immutable E-AI-109.
Only MIGRATION formatting changes before `e97822be`; all product bytes remain
identical. That next receipt passes complete units/build, but stops the catalog
on Classic attachments at 52px against the unchanged 36px bound (119/120 pass).

Cold exact `238d1e25` passes Desktop light, then fails narrow light at the same
bound; dark variants do not execute. Exact `4d790e15` passes all four variants
after awaiting the closed state, removal control unmount and that same bound. No
delay, timeout, threshold, baseline or production component is changed.

Native stale Properties setup now edits while focused, changes disk, awaits
metadata hydration and asserts the draft before Enter. It fails 0/1 with the old
public packages: metadata replaces local with external. With the public
Mira/Markdown repair it passes the complete four-case native family, including
explicit disk recovery, later edits preserving owner:outside, permission
recovery, normal close and property-type cold restoration. Source-wide Markdown
qualification is separate from this provisional host diagnosis.

E-CORE-033 retains the six actual retirement/preview passes and initial
failures. Core IO permission wording is source-owned in Notes; current typed
codes and native path redaction remain unchanged. Signing, publication and
default cutover stay deferred. Visual review remains pending.

Final source intakes select committed Notes `6e76be48`, Mira `cb8f2b2b` and
Markdown `814f6d2d`; final archive digests are recorded above. The cold final
e2e native build passes with 31 archives and 116 verified public import routes.
The first catalog shard2 executes 121 cases: 118 pass and three fail because the
selected old Agent UI archive omits required error alerts. Current committed
Agent UI `0e549ebc` already repairs this source defect and records complete
owner qualification. Intake uses its qualified `f9fff47b` archive; original
error, retained-content and recovery assertions remain unchanged. Two other
shard launches fail at SSH connection admission and execute zero product cases.

Native receipt `native-final-writer-aggregate-receipt.json` passes all 44 cases
with final Notes/API/Mira/Markdown bytes. Its 17 named files include the
original 40-case family, two editing admission cases, Problems recovery and the
real workspace popup. The run includes unchanged binary attachment import bytes
and the corrected source-owned permission error. Agent UI refresh is a separate
public presentation intake and is repeated against the final bundle.

Cold consumer run `a4a38593-e4ee-48ff-b734-6001bb058e41` passes all 24
Catalog/UserCommands cases with current Agent UI archive `f9fff47b`; the three
original alert failures move to zero. Original assertions and exact host error
text are retained. Independent read-only review reports no actionable production
findings across native selection/admission, shutdown preflight, immutable memory
producer metadata and freshness-checked Use disk recovery. Its production
snapshot comparison confirms only qualification prose changed during review.

Final-cohort receipt `native-final-agent-writer-aggregate-receipt.json` again
passes all 44 native cases after current Agent UI intake. E2e bundle receipt
`native-build-final-agent-receipt.json` passes with 31 archives/116 routes.
Ordinary setup first lacks the pinned AI verifier development dependency, then
finds the staged compute helper absent and refuses its attempted rebuild under
the existing free-space guard. Neither attempt compiles a new helper. A retained
qualified helper is restored only after matching its exact manifest SHA-256
`71c383e34b229663b5a2f81a45882703fd42e65ad4cd0493c1a2e78615848697`; the complete
bundle verifier passes before retry. Only the isolated ignored validation
environment changes; AI sources and main profiles remain untouched.

Current-cohort portable run `0abe8999-4951-4724-9d12-be2f5f378eb9` passes all 12
intake commands above with the final 31 archives and 116 public import routes.
Complete units are 514 Node, 744 AI and 248 Rust passes, plus two subprocess
helper entrypoints ignored by the outer runner and invoked by the actual
restart/interruption tests. Renderer and static Storybook builds, strict
normal/e2e Clippy, architecture/App ownership, progress, mdBook and spec-first
all pass. This intake is separate from the still-running complete catalog shards
and the final evidence/format check.

Both complete-asset configurations pass: ordinary build receipt
`native-build-final-ordinary-qualified-receipt.json` plus independently verified
packaged assets, and e2e `native-build-final-complete-assets-receipt.json` with
its complete packaged verifier. The sole linker unwind-table warning is
retained; no source warning, fixture resource or assertion is suppressed. The
final enabled-writer surface also includes existing Search/Graph settings,
Terminal close and AI memory/binding checks. Exact Terminal cancellation first
fails 0/1 solely on the removed `.shell-failure` selector; it now uses the same
current native-failure helper as Notes, retaining shell identity, refusal and
successful retry assertions. Its full five-case family remains required.

Expanded native receipt `native-final-enabled-writers-receipt.json` is retained
as **56/58 pass, two fail**. Memory stops before its first operation because the
existing `VITE_LAPIS_MEMORY_PROOF` fixture flag is absent; Terminal revocation
still selects the removed failure banner. Both Terminal exact selectors now pass
after using the existing native-failure helper. Rebuild with the original Memory
proof flag, then repeat its exact case and the complete native family; no
product assertion, timeout or persistence behavior changes.

Correctly configured Memory proof build
`native-build-final-memory-proof-receipt.json` passes with complete packaged
assets; exact cold memory smoke then passes 1/1 without a product change.
Current catalog shards1/2 pass 480/484 cases respectively. Final full native58
and catalog shards3/4 remain required; earlier failed aggregates are retained.

## Final qualification

The final actual macOS family passes **58/58**, including both corrected
Terminal paths and the cold Memory proof. No case is skipped. Native receipt
`native-final-enabled-writers-after-receipt.json` uses the same 22 target files;
its earlier 56/58 attempt remains failed. Both app configurations and packaged
AI manifests qualify; no installed application or user profile is replaced.

| Catalog shard | Retained run                           | Four-variant passes |
| ------------- | -------------------------------------- | ------------------- |
| 1             | `44a87de0-e4d2-468c-bffa-c12fc269e099` | 480                 |
| 2             | `5b39a30e-82e2-4388-9580-13cc0203341d` | 484                 |
| 3             | `bc25490d-5668-4c7f-a3b2-ca760f129320` | 532                 |
| 4             | `98be7f9f-af8c-4167-94c1-7e7707467d34` | 572                 |

All **2,068** catalog cases pass. Machine-checked `final-input-equality.json`
proves all 31 selected archive digests / 116 public import routes and unchanged
product/config/catalog/fixture/shared-helper inputs across portable/catalog
runs. Only documentary updates and the separately requalified Terminal leaf
selectors differ. Original failed aggregates and setup attempts are retained; no
functional, accessibility or native failure is waived. Immutable E-AI-109's
previously accepted byte-identical formatter failure remains separate. M16.7 is
complete; native Tasks/shared reader intake, broader R3 and default cutover are
separate. Publication, signing and visual approval remain deferred/pending.

Final documentary attempt `94bc12c7-f52d-499f-ae45-2f3a6231b045` confirms the
missing original-gate binding; its failure remains retained. Recording the exact
unchanged gate in completedGates clears local progress qualification. The final
documentary retry rechecks the six lanes above; its formatter accepts only
byte-identical E-AI-109 under the prior explicit exception. No new failure is
waived and the original completion gate is unchanged.
