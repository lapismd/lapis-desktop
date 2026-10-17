# Desktop state review inventory

Use the Storybook sidebar names below to review production UI without starting
the native app. Every scene uses disposable state. Native effects and acceptance
remain separate; these browser examples do not qualify native IO or processes.

Add a row and the applicable normal, empty, loading, disabled, failure and
recovery scenarios whenever desktop-specific presentation changes. Use an
existing production surface and the smallest real shell it needs. A new backend
error that uses an existing visible state should identify that state instead of
creating a duplicate screen. Shared portable-plugin catalogs remain
source-owned.

| Owned surface            | Visible states                                                                                                                                                                                                       | Storybook destination                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vault launcher           | Existing/recent vault, first launch with empty recents, create, cancelled picker, pending selection, failed open/missing recent, return to vault                                                                     | Desktop/Vault launcher: OpenVault, EmptyRecents, CreateVault, CancelledPicker, OpeningVault, FailedOpen, RecentVault, MissingRecentVault, ReturnToVault       |
| Launcher overlays        | Recent search, no matching recents, appearance choices                                                                                                                                                               | Desktop/Vault launcher: RecentSearch, NoMatchingRecents, AppearanceSettings                                                                                   |
| Shell lifecycle          | Restoring the saved profile, unavailable physical vault, failed Close with retained session                                                                                                                          | Desktop/Shell lifecycle: RestoringProfile, MissingSavedVault, BlockedClose                                                                                    |
| Notes startup            | Opening storage, plugin loading with task progress, failed layout and every existing recovery action                                                                                                                 | Desktop/Startup and recovery: RestoringVault, LoadingNotes, FailedLayout                                                                                      |
| Safe Mode                | Optional plugins disabled, saved layout skipped, rebuild completion, failed restart                                                                                                                                  | Desktop/Startup and recovery: OptionalPluginsDisabled, SavedLayoutSkipped, FailedRecoveryAction                                                               |
| File conflict recovery   | Retained local draft and changed disk text, deleted file, unreadable disk, failed write, pending resolution, fresh snapshot, stale decision, leaving with controls disabled                                          | Desktop/File conflicts: ModifiedOnDisk, DeletedOnDisk, UnreadableDisk, FailedRecovery, RecoveryInProgress, FreshDiskSnapshot, StaleDecision, LeavingWorkspace |
| File conflict completion | Explicit Keep my version and Use disk version, complete acknowledged bytes, removed conflict                                                                                                                         | Desktop/File conflicts: KeepMyVersion, UseDiskVersion                                                                                                         |
| Ready Notes host         | Public workspace, source editing, owned teardown                                                                                                                                                                     | Desktop/Notes workspace: EditNote; all host stories run light/dark and desktop/narrow                                                                         |
| Global AI commands       | External command creation, revision and deletion; unreadable inventory with retained rows and recovery                                                                                                               | Desktop/AI/User commands: ExternalChanges, UnreadableRecovery; actual AI plugin/Catalog and a disposable named-IO port                                        |
| Bundled Terminal         | Normal/colored/high output, input/IME/paste/copy, resize/scroll, hidden/moved pane retention, independent tabs, exit, failure/retry, unavailable, restored Start, disabled/Safe Mode, installed precedence, settings | Desktop/Plugins/Terminal: all cases in `plugins/terminal/Terminal.stories.ts`; source/destination details in COVERAGE.md                                      |
| Bundled AI               | Chat/composer, context/skills/results, approvals/questions/tools, cancellation, errors/retry, models, settings, History/Catalog, JSONL, disabled/unavailable/initializing, lifetime and six placements               | Retained `plugins/ai` families; complete mapping in AI_MIGRATION.md and COVERAGE.md                                                                           |

The conflict examples use the real public text-conflict registry, persistence
and editing-owner lifecycle with an injected in-memory file service. They do not
claim native atomic publication. Unreadable and pending operations remain
visible for review; fixture cleanup releases work before closing its owned App.

Initial shell loading/failure is reviewed in `Desktop/Initial shell loading`.
The loading scenes retain the existing shared startup surface. Failed startup
and Safe Mode scenes run the actual NotesWorkspace. The shell failure scenes run
the actual Shell with injected failing native ports. No replacement screen or
production fixture is introduced.

Native traffic lights, dragging/focus, OS picker input, clipboard, default-app
opening, system trash and process cleanup retain their actual headed checks.
Their shared HTML hosts/clearance are present in shell examples; browser output
cannot reproduce native controls or supply their acceptance evidence.

`Desktop/AI/Native Notes binding` adds the actual Notes host and native factory
with disposable IO: an unavailable agent, disabled plugin, Safe Mode and revoked
workspace trust. Its command seeding and lazy admission are visible through the
retained Chat and Catalog; no replacement screen is introduced.
`Desktop/AI/Resource order` retains the same shell while verifying close/reload
drain before native release.

Ordinary Notes AI admission/recovery still retains M10.2's gate, and the two
former live-controller replacements remain native work. A catalog entry is not
an assertion that an unavailable native capability is enabled.

All new scenes remain visual-pending. No Visual Delta baseline is changed.

## Shell presentation follow-up

File conflicts now open the real Problems panel. `ProblemsList` keeps that
initial state visible; `ModifiedOnDisk` opens the shared three-way review.
Existing deletion, unreadable, failure, busy, stale-snapshot, leaving and
whole-version decision stories use the same production review. Terminal stories
start with both sidebars collapsed and contain no visible fixture telemetry.
Suites/native acceptance for these changes are deferred; visual-pending remains.
