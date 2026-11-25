# Qualify native plugin background jobs

```json
{
  "id": "E-JOB-001",
  "date": "2026-11-25",
  "revision": "enclosing-change",
  "result": "pending",
  "requirements": [
    "LD-JOB-001",
    "LD-JOB-002",
    "LD-JOB-003",
    "LD-JOB-004",
    "LD-JOB-005",
    "LD-GOV-004",
    "LD-TASK-001",
    "LD-TASK-002",
    "LD-TASK-003"
  ],
  "files": [
    ".changeset/plugin-background-jobs.md",
    ".github/dependency-automation/artifact-projection.json",
    "catalog/COVERAGE.md",
    "catalog/plugins/background-jobs/Settings.stories.ts",
    "catalog/story-parity.json",
    "catalog/support/NotesDemo.svelte",
    "catalog/support/background/jobs.ts",
    "package.json",
    "pnpm-lock.yaml",
    "scripts/ci-install.mjs",
    "scripts/ci-sources.json",
    "scripts/native-family-inventory.json",
    "scripts/plugin-jobs-native-tests.mjs",
    "scripts/plugin-host-modules.ts",
    "scripts/source-audit.mjs",
    "scripts/validation/Dockerfile",
    "scripts/validation/lanes.json",
    "scripts/validation/model.mjs",
    "scripts/validation/native-sources.json",
    "spec/src/current/ai.md",
    "spec/src/current/background.md",
    "spec/src/current/desktop.md",
    "spec/src/current/files.md",
    "spec/src/current/governance.md",
    "spec/src/current/integration.md",
    "spec/src/current/local-dependencies.md",
    "spec/src/current/navigation.md",
    "spec/src/current/plugins.md",
    "spec/src/history/E-JOB-001.md",
    "spec/src/navigation/current.md",
    "spec/src/navigation/history-01.md",
    "spec/src/verification.md",
    "spec/src/verification/background-jobs.md",
    "src-tauri/Cargo.lock",
    "src-tauri/Cargo.toml",
    "src-tauri/build.rs",
    "src-tauri/capabilities/main.json",
    "src-tauri/src/database/indexing.rs",
    "src-tauri/src/acceptance/mod.rs",
    "src-tauri/src/acceptance/vault_admission.rs",
    "src-tauri/src/host/integration/services.rs",
    "src-tauri/src/host/lifecycle.rs",
    "src-tauri/src/host/mod.rs",
    "src-tauri/src/host/shell.rs",
    "src-tauri/src/host/state.rs",
    "src-tauri/src/host/vault/jobs.rs",
    "src-tauri/src/host/vault/mod.rs",
    "src-tauri/src/vault/services.rs",
    "src-tauri/src/vault/services/background.rs",
    "src-tauri/tauri.e2e.conf.json",
    "src-tauri/tests/background_jobs.rs",
    "src-tauri/tests/database_indexing.rs",
    "src/lib/desktop/shell-startup.ts",
    "src/lib/native/background-jobs/jobs.ts",
    "src/lib/notes/notes-recovery.svelte.ts",
    "src/lib/notes/notes-session.ts",
    "tests/ai/native/notes-session-transport.test.ts",
    "tests/desktop/background-jobs.test.mjs",
    "tests/desktop/released-job-artifact.mjs",
    "tests/desktop/jobs-entry.ts",
    "tests/desktop/metadata-owner.test.mjs",
    "tests/desktop/navigation-metadata.test.mjs",
    "tests/governance/ci-prerequisites.test.mjs",
    "tests/governance/native-families.test.mjs",
    "tests/governance/profile-registry.test.mjs",
    "tests/governance/validation-native.test.mjs",
    "tests/renderer/background-jobs.test.mjs",
    "tests/renderer/plugin-host-modules.test.mjs",
    "tests/renderer/native-tasks.test.mjs",
    "tests/renderer/shell-startup.test.mjs",
    "spec/src/current/tasks.md",
    "src-tauri/src/vault/tasks.rs",
    "src-tauri/tests/core_tasks_service.rs",
    "tests/desktop/tasks-owner.test.mjs",
    "tests/desktop/editing-recovery.test.mjs",
    "vite.config.ts"
  ],
  "contractReview": "Desktop owns native IPC and window/OS policy; Server Core owns scheduling, vault-scoped jobs, checkpoints and guarded writes. Native metadata becomes the default and explicit renderer compatibility denies job controls. Public packages resolve through registry semver.",
  "acceptanceReview": "The pre-credential cohort on Desktop base ea0ff322 passes eleven actual GTK/WebKit/X11 cases, full source checks/test/build, static catalog and all 2180 interaction/accessibility cases on Omarchy. It includes default native metadata/Tasks/editing, retained drafts/hidden work/Quit drain, real released Tasks 0.4.0 checkpoint/notification/cold recovery and planner completion/cold Logbook. Current-main credential integration and hosted CI remain separate. macOS system-alert delivery is not qualified by Linux.",
  "versions": {
    "api": "0.6.15",
    "workspace": "0.4.11",
    "appProfile": "0.3.1",
    "notesSource": "65df856a657f091fef60993f6c0d894a115a6612",
    "serverSource": "758084f3c6c9f0d97ba3191e5c79df1f02c75bc1",
    "nativeRun": "lapis-desktop-validation-03a23e13-bdbd-4f47-8a6b-df015dba26ba",
    "nativeSource": "3080cacccd8ba67620a910e2d15dd8644ae99bc6",
    "nativeBinarySha256": "8208579b0a86c90c75464b1fd447021d47d88fea353ae93d45faf5cb840f281f",
    "image": "sha256:537ac75cfadee716f72731dc6b372b6387597ba0b851243cb9b603946fb9f776",
    "privateAI": "9a98293c26524c9320acdd9767e34e8ffdd7170c",
    "tasks": "0.4.0"
  },
  "runs": [
    {
      "name": "Native first executable cohort",
      "command": "Omarchy pnpm test:plugin-jobs:native; plugin-jobs-linux-native-fourth.log",
      "result": "fail",
      "tests": 7,
      "passed": 6,
      "failures": 1,
      "detail": "A macOS-only shell visibility field was absent on Linux. The GTK hidden acceptance mode also needed to reapply hide at renderer readiness. Mac assertions remain; shared Tauri hidden/focus assertions were added."
    },
    {
      "name": "Exact default native metadata regression",
      "command": "Omarchy pnpm test:plugin-jobs:native -- --test-name-pattern=default native metadata preserves typed admission, detached reconciliation and cold rebuild; plugin-jobs-linux-metadata-regression-second.log",
      "result": "pass",
      "failures": 0,
      "detail": "One actual selected regression passed, including caller isolation, detach and cold rebuild; the other files had no selected cases."
    },
    {
      "name": "Complete actual native cohort",
      "command": "Omarchy pnpm test:plugin-jobs:native; plugin-jobs-linux-native-final-retry.log",
      "result": "pass",
      "tests": 7,
      "passed": 7,
      "failures": 0
    },
    {
      "name": "Focused native service/parser",
      "command": "Omarchy Rust background_jobs target; plugin-jobs-native-focused-parser.log",
      "result": "pass",
      "failures": 0,
      "detail": "Actual typed YAML property, unchanged body, complete client detach, saved identity cold resume and close/drain."
    },
    {
      "name": "Focused catalog and neighboring family",
      "command": "Omarchy catalog focused8 and neighboring32; plugin-jobs-unavailable-regression-retry.log and plugin-jobs-neighbour-regression.log",
      "result": "pass",
      "failures": 0
    },
    {
      "name": "First broad catalog attempt",
      "command": "Omarchy full catalog; plugin-jobs-catalog-full.log",
      "result": "fail",
      "failures": 1,
      "detail": "First shard 536 passed; next desktop/light shard 133 passed and Unavailable Runner timed out. Original assertions retained; focused and neighboring cold reruns pass. Complete rerun remains required."
    },
    {
      "name": "First complete Node governance/renderer lane",
      "command": "Omarchy pnpm test; plugin-jobs-desktop-test-final.log",
      "result": "fail",
      "tests": 974,
      "passed": 968,
      "failures": 6,
      "detail": "Stale source/version/native-inventory expectations and one Tasks fixture that omitted metadataOwner despite the new Core default. Registry adoption also retires the released packages from CI archive projection; only private AI remains."
    },
    {
      "name": "Final pre-credential cohort",
      "command": "Omarchy pnpm check:all; pnpm test:plugin-jobs:native; pnpm test:storybook shards1/4 through4/4",
      "result": "pass",
      "failures": 0,
      "detail": "11 actual native cases; 975 Node, 749 AI and 295 Rust passing executions; 2180 catalog interaction/accessibility cases. Exact run identities and source/binary digests are recorded below."
    }
  ],
  "remaining": [
    "Integrate credential-enabled Desktop main641de085 and API0.6.16 with combined Server mainb8824134; requalify the combined source before push/merge.",
    "Require green hosted CI before merging the final reviewed Desktop head.",
    "macOS-specific optional system-alert delivery remains a separate acceptance lane."
  ]
}
```

All executable runs use the remote Omarchy Docker context. Preparatory failures
(missing unused distribution fixtures, a 2 GiB Vite heap, and local report
collection disk exhaustion) remain in task logs. The passing native mode uses
the production bootstrap and distribution defaults, with isolated profiles and
no optional external AI/CLI providers. No macOS activation or system-alert claim
follows from this Linux acceptance. The private AI archive is unchanged.

The SDK shape descriptor was refreshed from reviewed manifest/lock/source bytes;
its algorithm and disabled automation proposals remain unchanged. Checks use the
explicit recorded parent as LAPIS_DESKTOP_BASE, retaining immutable ancestry.

Further cold catalog diagnosis found that the unavailable-approval fixture
rejected the mandatory startup policy fence. It now rejects configuration only
and faithfully applies policy fences; all eight focused mode cases passed. The
next full retry exposed two disabled approval controls in shard 2/4
desktop/light (132 passed, 2 failed). Every Notes fixture used the default
`memory-vault` identity, allowing a preceding trust-revocation story to persist
policy into later Apps. Each Notes fixture now supplies its own public adapter
vault ID and uses it as the session profile identity. Permission, pointer-event
and unavailable/recovery assertions remain unchanged. The exact shard and full
catalog reruns are required; no timeout, quarantine or assertion was loosened.

The feature has been rebased onto Desktop rc.4 main
`ea0ff322fd14b298e875d592536517b55bb22ac5`, preserving the Linux
startup-resource repair and release evidence. The final native
Core/CLI/protocol/content source pin is reviewed Server controls revision
`758084f3c6c9f0d97ba3191e5c79df1f02c75bc1`; final pin qualification is pending.

Released-handler acceptance is being added to the explicit native lane. It
deploys unchanged, checksummed published Tasks bytes and requires the real Notes
workspace, native metadata, private checkpoint and persistent notification to
survive a cold restart without a second delivery or note-body changes. Its
release archive digest must be filled only after signed publication succeeds;
that new case is not yet qualified.

The strengthened native window journey first failed at its attempted JavaScript
admission spy (1 selected failure). The real Notes workspace had opened, but the
bridge did not expose the expected mutable interception point. The spy is
replaced by a bounded passive admission receipt in the existing e2e-only native
acceptance module. Restore, picker and recent-vault paths record only the actual
profile/session IDs after admission; ordinary builds contain no receipt code or
new command. The test reads that real UI admission and supports cold automatic
restoration. Its original window, draft and Quit assertions remain required.

Final-pin native cohort: seven pass, one released-Tasks workspace load fails.
The unchanged signed artifact imports public Design Core modules that Desktop
omitted from its initial import map. Desktop now admits the registry-owned
public portable Design Core exports through its existing Vite graph. No plugin
bytes or upstream module definitions change. The exact host-module test and
native released-handler acceptance remain required. The initial deadline-only
digest fixture was corrected to the retained Review rule: overdue planned dates
and recurring occurrences. Deadline-only tasks intentionally remain outside
Review.

Released Tasks 0.4.0 Server acceptance passes on Omarchy using unchanged signed
archive SHA-256
`04953bda8012f50263ac2224a649a64d0892a43b0a70cd6d92132985af2eee3b`. The real
hosted workspace loads Tasks; 101 native metadata rows span pages 100 + 1,
including a current recurring task and an overdue planned task. One notification
and `{notifiedOn,count:1}` checkpoint survive a cold host restart without
duplicate delivery or task-body modification. Frozen registry install, renderer
build and Server/CLI builds pass. Source tree is reviewed Server
`758084f3c6c9f0d97ba3191e5c79df1f02c75bc1` (empty child snapshot
`5819ec52ef4e1da8c32864efc97e098d3bd2c100`, pack
`a13b54065d0d3bf26a1d622dc54a0fea8b1578eb922c43b71a18b0b2da73a55a`). Log:
`plugin-jobs-released-digest-review-plan.log`, one actual hosted test passes.
The preceding deadline-only fixture attempts fail 0/1 notification as expected
under retained Review semantics; their logs and original fixture remain saved.

On the final Server pin, complete Desktop checks pass (normal and e2e strict
Clippy, Svelte/types, audits, formatting); full tests pass 975 Node + 749 AI +
294 Rust with zero failures. The two ignored Rust helper subprocess tests are
invoked by their parent tests. Runs: `0e7e4dc1-7fd9-4086-8106-d4771253f3d3` and
`e0606ce8-370f-41a2-8bf3-ecffdf6bb505`. Static catalog build passes
`eee69f37-33f1-4309-a6f1-c63cb7eced6e`. With unique fixture vault identities,
cold catalog shards 1 and 2 pass 536 cases each across desktop/narrow and
light/dark modes (`47709a93-d363-4092-ba67-07357d915bac` and
`d5f3e669-d9f9-48df-8c8c-02d57c0cbe47`). Their compiler graph is separate from
the native build-owned import-map bridge.

The final-pin full native cohort `993ee6e4-05c1-436f-ab6c-f5f2fb93c327` passes
seven cases and fails only the new released-Tasks workspace load at its Open
Tasks assertion. Import-map correction retry
`d205e59f-8730-48db-bce7-26f20ccb9c70` still fails the same assertion; its
native log now identifies `Projection is not registered` during Tasks onload.
The existing renderer Tasks selection queries before native projection
registration settles. Native Tasks and editing remain independently selected
under LD-TASK-001; qualification of the metadata default cannot conceal this
prerequisite. No native assertion or production plugin bytes were weakened.

Tasks defaults to its admitted Core port when metadata and editing are Core;
explicit renderer metadata/editing keeps renderer Tasks by default, and explicit
incompatible Core Tasks selection still refuses startup. Editing was already
Core-selected by the production host; the renderer fallback now matches it. The
enlarged native lane also runs the existing typed Tasks fences/recovery and
editing fences and retained Problems recovery cases. macOS visibility assertions
remain, alongside actual cross-platform Tauri visibility/focus checks.

The released digest journey now also exercises real native Tasks completion from
Review, verifies the Markdown body survives, then reopens the same profile cold
and finds the completed task in Logbook without another digest notification. It
clears an inherited Task-owner selection and asserts all three actual native
owners, so an explicit fixture selection cannot substitute for default proof.

The retained Problems recovery journey uses the platform select-all modifier
(Command on macOS, Control on Linux); its original dirty-editor, refused-leave,
retry/accept and cold-recovery assertions are retained.

Cold catalog shard 3 passes all 504 cases (126 in each of desktop/light,
narrow/light, desktop/dark and narrow/dark), including accessibility. Run
`a78931dd-5ec3-4b55-8b5c-65494291e866`; log
`plugin-jobs-final-catalog-shard3.log`. Shard 4 remains required.

Default native Tasks first reaches the metadata-loading phase, then fails the
new 101-document fixture startup at its inherited five-second bound (run
`738cac34-49df-4ef4-ac66-0f7bad9580cd`). A diagnostic rerun retains that
assertion, observes readiness 2,011 ms after it expires, and rethrows the
original failure (`61cef5ba-65d4-40a5-a033-83e4d2062ee8`). There is no
plugin-load error or stalled owner. Only this larger cold-start corpus now
requests a ten-second bound; the small-vault journey retains five seconds. All
ownership, notification, checkpoint, body, paging and cold-restart assertions
remain unchanged.

With the 101-task startup bound corrected, Tasks loads and approvals succeed.
The new completion observer then expires after ten seconds while the durable
receipt still reports Running, with no error or checkpoint (run
`7b63e371-beae-4d19-ab2a-c7cd4ffcf91f`). The observer now waits for a terminal
receipt within 35 seconds, matching the unchanged 30-second guest execution
deadline plus transport observation, and immediately fails on Failed/Interrupted
with the native error. No guest limit, host callback deadline or assertion on
success is relaxed. The original failed run is retained.

The 30-second guest-bound observer reaches Completed, then all notification,
checkpoint and unchanged-body assertions pass. Explicit Quit exceeds the
existing ten-second helper bound and is force-cleaned (run
`7c018a4a-6b8b-49af-8995-9e29ba3b846f`). Desktop teardown lacked the public
native Tasks observation detach already used by the shared Notes host. It now
detaches/drains accepted observation before workspace, metadata and plugin
retirement, preserving Core policy until vault close. A regression uses the
actual public NativeTasksSession to hold accepted observation and proves
teardown waits without sending Disable. The exact native Quit retry remains
required.

The Quit diagnostic preserves the original ten-second assertion and observes for
up to thirty seconds before cleanup; its original-source run is
`3f63ddfe-99eb-4f6c-a43d-208e4b958389`. The retry with observer retirement
restores the original close helper, including normal code-zero exit and its
original ten-second bound.

Observer retirement does not fix Quit (`eb535852-46da-4f00-a7b0-a33ce56bf7be`).
Passive test-entry tracing (`85e1317f-4abf-4dab-a57f-6fa17d6170b1`) shows Task
observation, metadata and every plugin complete retirement. The API metadata
cache already detaches Task observation. The duplicate Desktop detach hypothesis
and its mock-only regression are removed; no observation policy change is
retained. Investigation continues at database transport/session closure.

Final acknowledgement tracing reports saved=false, not a Core drain stall. The
notification probe reopened the real App session database and closed its shared
admission; Desktop intentionally has one admission per session. App teardown
therefore failed EACCES when retiring its already-removed connection. The probe
now borrows the existing handle for a read and leaves retirement to the App. All
temporary prototype, Shell error and native acknowledgement tracing is removed.
The original normal-exit and cold-reopen assertions remain required.

The shared-admission retry (`ff330c23-f650-4fff-a342-7de0519ebf85`) passes
normal Quit and cold digest recovery without duplicate delivery. The real Review
planner shows the expected task, but the new completion selector incorrectly
requires a button. It now uses the exact accessible-label selector from the
existing Tasks acceptance helpers, without assuming the control element tag.

Final default cutover cohort passes all eleven actual native cases, zero
failures or skips: `03a23e13-bdbd-4f47-8a6b-df015dba26ba`. Source
`3080cacccd8ba67620a910e2d15dd8644ae99bc6`, native executable
`8208579b0a86c90c75464b1fd447021d47d88fea353ae93d45faf5cb840f281f`. Focused
released-Tasks regression passes one actual selected journey
(`9a08d724-644a-49f7-90a2-b3128a3706ea`); other unmatched file wrappers are not
additional native cases. The original ten-second normal-exit bound passes.

Complete `pnpm check:all` passes (`93b69017-550e-4c8f-bd0d-8d05b8ddfaec`):
normal/e2e strict Clippy, specification/source audits, Svelte/types with zero
warnings, formatting, 975 Node tests, 749 AI tests, full Rust suites and the
production renderer build. No production teardown workaround or temporary
tracing remains. Final catalog shard and specification/evidence receipts follow.

Catalog shard 4 passes all604 cases (151 per mode), run
`ca75dc69-6667-4421-bb06-44038dcd7037`. All four shards pass2180 cases with zero
interaction/accessibility failures after the isolated-vault fixture repair. The
full Rust count is295 passing executions; ignored helper entries execute through
their parent subprocess cases.

This is the completed pre-credential cohort on base
`ea0ff322fd14b298e875d592536517b55bb22ac5`. While it ran, credential PR66 merged
as Desktop641de0857f535c102729c78beaac6604beb78b9e (API0.6.16). The next
integration must preserve that work and consume combined Server
`b8824134a792cbd0aad449f9c02e659b28e2a88a`, which includes reviewed758084f3 and
has an unchanged job engine plus green required Server CI. This receipt does not
qualify the forthcoming combined source.

Final specification check first rejects the missing mapped AI chapter
(LD-GOV-002); the Close-versus-Quit AI ownership clause is now explicit.

The next validator attempt rejects missing fresh evidence coverage for that AI
clause; this receipt now maps the chapter explicitly.

Final spec run6c05870e passes all five lanes with worker exit zero. Local book
collection hits ENOSPC; the stopped remote worker retains the complete report,
and its passing result.json is collected independently.
