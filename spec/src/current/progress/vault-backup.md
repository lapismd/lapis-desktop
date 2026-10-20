# Automatic vault backup delivery

## Current checkpoint — 2026-10-20

All seven implementation stages are integrated into main. M14.1 native
identity/storage, M14.2 capture/recovery and M14.3 restore/live history are Done
on macOS ARM64. E-REPO-046/048–050 qualify ordinary editor saving/Quit, cold
reconciliation and crash recovery, failed final capture, retained live editors,
resumed watching and exact retained versions after cold reopening. E-REPO-051
qualifies restore, original-request recovery and live history independent of
footer visibility. Search, storage and real-provider gates remain Partial.
M13/AI and visual gates are unchanged.

| ID    | Status  | Depends     | Requirements             | Gate                                                                                                                       | Next                                           | Evidence                                                                                |
| ----- | ------- | ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| M14   | Partial | -           | LD-REPO-005              | Functional automatic backup, restore, GitHub/Forgejo synchronization and historical search integrated into main workspaces | Search/storage and provider acceptance         | E-REPO-026,E-REPO-039,E-REPO-040,E-REPO-041,E-REPO-042,E-REPO-043,E-REPO-045,E-REPO-047 |
| M14.1 | Done    | -           | LD-REPO-005,LD-VAULT-002 | Stable vault IDs and independent external JJ history work in the native app after reopen and recent eviction               | Complete; continue capture lifecycle           | E-REPO-026,E-REPO-042,E-REPO-047                                                        |
| M14.2 | Done    | M14.1       | LD-REPO-005              | Open-vault internal/external capture, reconciliation and crash/close recovery work                                         | Complete; continue restore/provider acceptance | E-REPO-026,E-REPO-027,E-REPO-042,E-REPO-048,E-REPO-049,E-REPO-050,E-REPO-046            |
| M14.3 | Done    | M14.2       | LD-REPO-005              | Local timeline, guarded restoration, live history and independent status visibility work                                   | Complete; continue search/providers            | E-REPO-028,E-REPO-042,E-REPO-043,E-REPO-051                                             |
| M14.4 | Partial | M14.3       | LD-REPO-005              | GitHub sign-in, remote setup and fresh-device restore work                                                                 | Qualify cold app/provider flow later           | E-REPO-029,E-REPO-030,E-REPO-031,E-REPO-039,E-REPO-040,E-REPO-041,E-REPO-042            |
| M14.5 | Partial | M14.4       | LD-REPO-005              | Two-device automatic pull/merge/push preserves offline work and conflicts                                                  | Qualify cold app/provider gates later          | E-REPO-032,E-REPO-033,E-REPO-042,E-REPO-043                                             |
| M14.6 | Partial | M14.3       | LD-REPO-005              | Historical text and metadata search opens exact restorable checkpoint versions                                             | Deferred cold search/restore proof             | E-REPO-034,E-REPO-042,E-REPO-045                                                        |
| M14.7 | Partial | M14.5,M14.6 | LD-REPO-005              | Root storage/adoption and Forgejo work, then changes integrate into main                                                   | Deferred native/provider qualification         | E-REPO-035,E-REPO-036,E-REPO-037,E-REPO-038,E-REPO-039,E-REPO-041,E-REPO-042,E-REPO-043 |

## Implementation and acceptance

| Stage                | Implementation in main | Focused evidence                                                         | Outstanding original acceptance                          |
| -------------------- | ---------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| 1 — Identity/storage | Implemented/qualified  | E-REPO-026/047: registry and cold native eviction/relink/identity        | Complete on macOS ARM64                                  |
| 2 — Capture          | Implemented/qualified  | E-REPO-026/027/046/048–050: source plus cold actual-App recovery         | Complete on macOS ARM64                                  |
| 3 — History/restore  | Implemented/qualified  | E-REPO-028/051: source plus cold actual App restore/recovery/live follow | Complete on macOS ARM64                                  |
| 4 — GitHub           | Implemented            | E-REPO-029–031/039–041: auth/remote/settings                             | Real sign-in, setup and fresh-device restore             |
| 5 — Sync             | Implemented            | E-REPO-032/033: convergence and recovery                                 | Cold app/provider two-device/offline/conflict acceptance |
| 6 — Search           | Implemented            | E-REPO-034: immutable search and UI                                      | Cold exact-version search/restore                        |
| 7 — Storage/Forgejo  | Implemented            | E-REPO-035–038: migration/adoption and integration                       | Cold storage/adoption and real Forgejo                   |

Next acceptance proceeds through a fresh native app, then real provider flows;
full suites/platforms/release remain deferred and visual approval is separate.
The latest plugin-settings presentation is E-REPO-039–041; this adds no new
native/provider qualification.

The task checklist is
[automatic-vault-backup-progress](../../../../docs/automatic-vault-backup-progress.md).

E-REPO-036 adds advanced storage settings, shared native layout resolution,
interrupted-move recovery and filtered backup watching. Focused source/native,
renderer and catalog proofs are recorded separately. At that slice, adoption,
source selection and main integration remained open. E-REPO-037/038 complete
those implementation steps; deferred cold native/provider qualification remains
Partial.

E-REPO-037 adds explicit original-history import/recovery and separate source
readers/tabs. Focused service, renderer and catalog proof remains distinct from
cold actual-app/provider qualification. At that historical slice M14.7
implementation was active; its current gate status is Partial after main
integration. E-REPO-038 records main integration.

E-REPO-038 records main-workspace integration with the verified local package
archive graph. Focused renderer/catalog checks and the production renderer build
pass in main. M14 and M14.7 are Partial because deferred native/provider and
wider qualification keep their original gates. No milestone is marked Done.

E-REPO-039 moves forge accounts, remotes and advanced backup controls into the
registered Repository History plugin settings, with copied jj-store card/footer
styling and forge icons. The independent workspace settings view is removed.
Focused settings-host, close/reopen, restore, storage, sync and recovery checks
retain the existing controllers and native contracts. M14/M14.4/M14.7 remain
Partial solely at their outstanding native/provider and wider qualification
gates; this presentation slice does not start a new implementation stage.

E-REPO-040 widens the forge account menu to fit its choices, with the viewport
bound retained. This presentation slice leaves M14/M14.4 and their
native/provider qualification gates unchanged.

E-REPO-041 gives Backup and synchronisation its own section in plugin Settings.
The maintained table-style cards retain tinted headers with body-surface rows
and footers. Existing controlled fields, search targets and native/controller
lifetimes are unchanged. Original M14 native/provider gates remain Partial.

E-REPO-043 completes manual footer Fetch/Pull/Push, optional retained-checkpoint
counts and native-selected external history directory/reveal. Focused native,
renderer and four catalog families pass. M14/M14.3/M14.5/M14.7 remain Partial;
original cold app/provider and wider gates are unchanged.

E-REPO-045 integrates retained indexed history into unified Search. Its cold IPC
proof preserves later unsnapshotted edits; full visible Search/restore and
provider gates remain open. Statuses and original gates are unchanged.

E-REPO-046 qualifies ordinary-App automatic external capture, guarded final
editor saving, retained diffs and external-storage reopening. Restoration/search
and real-provider gates remain open.

E-REPO-047 completes M14.1 with two cold actual native processes, real
recent-list eviction, stable original checkpoints through folder relinking and
independent history for a replacement physical vault. All other statuses and
original gates remain unchanged.

E-REPO-048 records native watcher/crash/final-capture proof and a reproduced
close-retry defect. The source coordinator and Desktop retain the original owner
on failed final capture. Native recovery/retry passes; E-REPO-046/050 complete
the original ordinary editor-save/guarded-Quit gate.

E-REPO-049 qualifies native watch recovery after failed capture. E-REPO-050
qualifies awaited final persistence before destructive teardown, retained live
editors, automatic watcher recovery, successful Quit retry and cold retained
diffs. M14.2 is Done on its unchanged original gate.

E-REPO-051 completes M14.3: actual file/vault restoration, exact latest safety
bytes, native receipt reconciliation after cold reopening, and live JJ Log
updates with footer status hidden. Other original gates remain unchanged.
