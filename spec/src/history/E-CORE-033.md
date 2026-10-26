# Staged Desktop native editing intents

```json
{
  "id": "E-CORE-033",
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
  "contractReview": "Staged thin Tauri intent/snapshot adapter uses the existing admitted client. Shared App owns conditional persistence, interactive/operation lifetimes and Problems recovery. Desktop preflights before destructive teardown; no new engine or default cutover.",
  "milestoneReview": "M16.7 staged intake and final closure are qualified in E-CORE-034: 58 actual native and 2,068 catalog cases pass with final source/public archives and both native configurations. This record preserves the initial focused passes and failed attempts; no failed aggregate is reclassified or waived.",
  "versions": {
    "desktopParent": "fa13c1ce",
    "node": "26.9.0",
    "nativeNotesSource": "2bfd032e132074f3d39cf84262162a6ee14a1d45",
    "candidateApiArchiveSha256": "585992687390c47a0f27403d4e7500c202daa1680a7a3e4596653698ad8aab73",
    "candidateMarkdownArchiveSha256": "f1a6666de7f9d03064a427fc2672a9a54ed3c60fe6e400f885a89d93e3e527e6",
    "workspaceArchiveSha256": "b33e860549b8661fc8c7c0bb0b82c9beacf61bdc0ef612775a5ea6669e7ce775",
    "pnpm": "10.34.5",
    "apiSource": "10051ac051d4e3045018071857ca82e1b3447860",
    "markdownSource": "ea9ea3bde68fb3bc1b0ae53c66e3301e173b0d0f",
    "provisionalRetirementApiArchiveSha256": "a1fc412fd6cc1e7f40d18d8eafd48c89a66a248ec84cec71f00e11bb704707cd",
    "miraAttachmentSource": "d24f79bfa8ded39ab415157f3e27447ce6f36bd8",
    "miraAttachmentArchiveSha256": "918e26bfc383e2dfc37c4ddce725412a76df1165af378acbc3ef3670042ed419"
  },
  "files": [
    "MIGRATION.md",
    "catalog/COVERAGE.md",
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
    "tests/renderer/shell-startup.test.mjs"
  ],
  "remaining": [],
  "runs": [
    {
      "name": "Exact leave preflight before",
      "command": "node --test --test-name-pattern='native recovery preflight' tests/renderer/notes-dispose.test.mjs",
      "result": "fail",
      "tests": 2,
      "failures": 2
    },
    {
      "name": "Exact leave preflight after",
      "command": "node --test --test-name-pattern='native recovery preflight' tests/renderer/notes-dispose.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0
    },
    {
      "name": "Complete affected pure leave boundary",
      "command": "node --test tests/renderer/notes-dispose.test.mjs tests/renderer/notes-leave.test.mjs",
      "result": "pass",
      "tests": 13,
      "failures": 0
    },
    {
      "name": "Native exact before source lock intake",
      "command": "pnpm test:rust -- --test core_editing_service",
      "result": "fail",
      "tests": 0,
      "failures": 1
    },
    {
      "name": "Native protocol fixture before correct next-generation frame",
      "command": "pnpm test:rust -- --test core_editing_service",
      "result": "fail",
      "tests": 2,
      "failures": 1
    },
    {
      "name": "Native explicit selection and shared caller-fence exact",
      "command": "pnpm test:rust -- --test core_editing_service",
      "result": "pass",
      "tests": 2,
      "failures": 0
    },
    {
      "name": "Exact capability audit before named editing permission intake",
      "command": "node scripts/source-audit.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1
    },
    {
      "name": "Exact capability audit after named editing permission intake",
      "command": "node scripts/source-audit.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "Focused renderer and leave cohort",
      "command": "node --import tsx --test tests/renderer/native-editing.test.mjs tests/renderer/shell-startup.test.mjs tests/renderer/notes-dispose.test.mjs tests/renderer/notes-leave.test.mjs",
      "result": "pass",
      "tests": 22,
      "failures": 0
    },
    {
      "name": "Recovery-story strict typing before fixture argument ownership",
      "command": "pnpm check:types",
      "result": "fail",
      "errors": 2,
      "warnings": 0,
      "failures": 2
    },
    {
      "name": "Recovery-story strict typing after fixture argument ownership",
      "command": "pnpm check:types",
      "result": "pass",
      "errors": 0,
      "warnings": 0,
      "failures": 0
    },
    {
      "name": "Cold recovery stories in both themes and viewports",
      "command": "pnpm test:storybook -- catalog/plugins/desktop/EditingRecovery.stories.ts",
      "result": "pass",
      "tests": 8,
      "failures": 0
    },
    {
      "name": "Actual macOS e2e application build",
      "command": "pnpm exec tauri build --debug --bundles app --features e2e --config src-tauri/tauri.e2e.conf.json",
      "result": "pass",
      "checks": 1,
      "failures": 0,
      "warnings": 1
    },
    {
      "name": "Actual hidden native default selection, same-client writes and retained claims",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/editing-owner.test.mjs",
      "result": "pass",
      "tests": 2,
      "failures": 0
    },
    {
      "name": "Initial native recovery UI delivery",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/editing-recovery.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1
    },
    {
      "name": "Exact bundled startup before memory native producer metadata",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/editing-recovery.test.mjs",
      "result": "fail",
      "tests": 1,
      "failures": 1
    },
    {
      "name": "Actual complete startup and retained recovery after memory producer metadata",
      "command": "node --import tsx --test --test-concurrency=1 tests/desktop/editing-recovery.test.mjs",
      "result": "pass",
      "tests": 1,
      "failures": 0
    },
    {
      "name": "Complete original native writer family before repairs",
      "command": "node --import tsx --test --test-concurrency=1 [14 original Desktop writer files]",
      "result": "fail",
      "tests": 40,
      "failures": 17
    },
    {
      "name": "Current Problems flow exposes missing explicit disk acceptance",
      "command": "node --import tsx --test tests/desktop/plugin-persistence.test.mjs",
      "result": "fail",
      "tests": 3,
      "failures": 1
    },
    {
      "name": "Exact native clean retirement and Properties close",
      "command": "node --import tsx --test --test-name-pattern='external file changes reconcile|Properties edits save before' tests/desktop/file-reconciliation.test.mjs tests/desktop/properties-persistence.test.mjs",
      "result": "fail",
      "tests": 2,
      "failures": 2
    },
    {
      "name": "Full consumer first specification gate",
      "command": "pnpm spec:validate",
      "result": "fail",
      "failures": 1
    },
    {
      "name": "Current conflict presentation and four theme/viewport variants",
      "command": "pnpm test:storybook -- catalog/plugins/desktop/FileConflicts.stories.ts",
      "result": "pass",
      "tests": 60,
      "failures": 0
    },
    {
      "name": "Native retirement and complete preview recovery after owner archive intake",
      "command": "node --import tsx --test --test-name-pattern='external file changes reconcile|Properties edits save before|preview' [three original native files]",
      "result": "pass",
      "tests": 6,
      "failures": 0
    }
  ]
}
```

The narrow pure Node boundary runs explicitly on the host without launching a
browser/native window or sharing a heavy worker. Both regressions fail: the
existing leave path never calls native-recovery preflight, so it destroys the
workspace despite a retained claim and omits the final-layout/preflight order.

Desktop parent is qualified `fa13c1ce`. CORE019–021/025/026/027, Markdown and
Mira source qualification and both actual host adoptions remain distinct. App
signing, publication, installed-app replacement and default cutover remain
deferred. Visual review remains pending; no baseline is approved.

Native source intake initially requires the lock to acknowledge three new
path-crate dependencies; offline workspace-only update adds those names without
changing any registry version. The first protocol fixture sends stale Resume
generation 1 and correctly receives Conflict. The final case asserts that
refusal, then resumes generation 2: **2/2 pass**, receipt
`8d1cd122-a97f-4c92-bb08-c9cb2fa5f46d`.

The minimum real WorkspaceShell recovery stories are adapted from qualified
Notes `fa77eb1a`, retain public Problems and saved-file reading, and own
awaitable fixture cleanup. Their Desktop interaction/axe and complete affected
catalog gates remain pending.

The candidate inventory now selects the final formatted CORE028 API from source
`10051ac0` and Markdown from product snapshot `b4efa987`. These are public build
archives, with source closure still separate. Markdown's exact/owner/runtime
gates pass; its full catalog receipt retains 284 passing assertions and one
browser disconnect before the final Link Preview file. No complete source or
Desktop catalog claim is made from that incomplete run.

The native acceptance inventory includes the pending real mounted-UI
`editing-recovery.test.mjs`: a foreign retained claim refuses vault leave while
the original editor stays mounted, then the existing Problems actions review
saved bytes, recover and discard that captured claim. A final real edit and
ordinary leave must persist successfully. Hidden IPC checks are separate and
cannot substitute for this visible native lifecycle gate. The source audit
initially rejects the two new named permissions until its exact allowlist is
updated; no broader capability is admitted.

At the 18:55 UTC checkpoint, both private exact/full consumer runners are
prepared but not dispatched because the shared Docker worker limit is already
occupied. Native helper preparation retains its own disk preflight. Standing
approval permits inactive cache cleanup; application bundles, selected public
archives, qualification evidence and all vault/profile data remain retained. A
download-cache preflight correctly refuses cleanup when it observes an active
Deno process. These are resource holds, not passing native or catalog evidence.

Source inspection corrects the initial disk-hold assumption: the 30 GiB guard
belongs to JJ helper rebuilds through `dev:cargo`, not Desktop's direct native
acceptance build. Qualified ACP resources at the selected `6548afe0` pin are
available for checksum-verified staging. No direct Desktop build has yet failed
a disk check; actual preparation/build outcomes remain required and pending.

Focused receipt `2e7fe87d-bf27-4ecc-b49d-e375ae0ff9b8` verifies 31 public
archives across 116 import routes, 22 renderer/leave cases, strict checks, both
source audits, 111 story families, eight cold recovery-story cases and two Rust
service cases. Its first strict attempt `58a0d6f7` reports two fixture-render
argument errors. Giving StoryObj the actual fixture props retains WorkspaceShell
as the genuine production subject and clears both diagnostics.

The isolated Mac cohort uses the same eight committed native pins and public
archive identities. Preparation retains a long-tarball-path failure and a
missing resource-directory failure; short private archive names and an explicit
resource destination repair setup without changing tracked manifests. The first
app build correctly refuses absent distribution fixture data. Preparing the
existing signed ephemeral fixture then builds the actual 375 MiB app; its
toolchain retains one linker unwind-table warning. Hidden IPC passes 2/2 with no
focus/activation.

The initial visible recovery attempt fails at WebDriver context-menu delivery.
It also exposes the missing native producer metadata in Desktop's existing
MemoryNoteMutation. The strengthened exact startup assertion fails 0/1 with
`Native editing lifecycle is required: .lapis/memory/state.json`. The producer
now supplies synchronous immutable-input protection and its existing conditional
baseline through the public contract; no persistence engine, format, policy or
AI package changes. LD-AI-002 and the original M10 gates remain unchanged.

The next actual native run passes 1/1: complete bundled startup, foreign EBUSY,
refused leave with the original editor, saved-file review, captured recovery and
discard, unchanged saved recovery bytes, then a new real edit and ordinary
leave. The test uses the already established native contextmenu event delivery,
awaits its actual menu and adds no direct model or recovery-action invocation.
Broader original native and complete portable/catalog gates remain open.

The original native writer cohort fails **17/40** (23 pass): ten cases retain
obsolete conflict selectors, four preview fixtures expose Mira reactive writer
registration churn, and clean reconciliation/Properties close expose native
retirement/preflight problems. Exact close diagnosis remains 0/2; none are
waived. The updated App Shell conflict target reaches merge review then fails
only on the absent explicit disk-acceptance button (2/3 pass). Separate source
repairs and current presentation acceptance must precede renewed aggregate
qualification.

The first full portable attempt reaches its specification gate and fails on new
evidence schema/status and authored chapter size errors. No broader pass is
claimed from that aborted run; the documentation is corrected before rerunning.

Refreshed owner archives repair all six original native targets: clean external
rename/delete, Properties immediate close/cold restoration, and all four preview
recovery/retirement cases pass. Current Problems/merge presentation passes all
60 theme/viewport story cases, strict typing, specification and source audits in
`2599a211`. Explicit disk acceptance retains deleted-file absence.

Core filesystem permission conversion independently mislabels IO denial as an
invalid vault attachment; its source repair retains codes/redaction and remains
separate from native acceptance. Properties displayed-record preservation has a
separate source owner. The original aggregate and full portable/catalog gates
stay open; no remaining failure is waived.

This record preserves preceding staged checkpoints. E-CORE-034 closes every
M16.7 source/public/native/catalog gate; earlier open-gate statements above
refer to their preceding cohort. Broader R3 and default cutover remain separate.
