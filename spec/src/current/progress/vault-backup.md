# Automatic vault backup delivery

The user approved the staged plan and isolated implementation workspaces. Heavy
verification is deferred while getting a working version in place; focused
checks and all outstanding lanes are recorded. M13/AI and prior visual gates are
unchanged. The implementation is integrated into main; no stage is Active. M14.6
focused search proofs pass; cold native qualification remains deferred. M14.5
recovery focused checks pass; cold app/provider qualification remains deferred.
M14.3 local restore proofs pass; cold app qualification is deferred. M14.1
native proofs pass; cold WebView qualification remains deferred.

| ID    | Status  | Depends     | Requirements             | Gate                                                                                                                       | Next                                   | Evidence                                               |
| ----- | ------- | ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| M14   | Partial | -           | LD-REPO-005              | Functional automatic backup, restore, GitHub/Forgejo synchronization and historical search integrated into main workspaces | Review integrated working version      | E-REPO-026,E-REPO-039                                  |
| M14.1 | Partial | -           | LD-REPO-005,LD-VAULT-002 | Stable vault IDs and independent external JJ history work in the native app after reopen and recent eviction               | Deferred cold identity/reopen proof    | E-REPO-026                                             |
| M14.2 | Partial | M14.1       | LD-REPO-005              | Open-vault internal/external capture, reconciliation and crash/close recovery work                                         | Qualify cold native lifecycle later    | E-REPO-026,E-REPO-027                                  |
| M14.3 | Partial | M14.2       | LD-REPO-005              | Local timeline, guarded restoration, live history and independent status visibility work                                   | Deferred cold restore qualification    | E-REPO-028                                             |
| M14.4 | Partial | M14.3       | LD-REPO-005              | GitHub sign-in, remote setup and fresh-device restore work                                                                 | Qualify cold app/provider flow later   | E-REPO-029,E-REPO-030,E-REPO-031,E-REPO-039            |
| M14.5 | Partial | M14.4       | LD-REPO-005              | Two-device automatic pull/merge/push preserves offline work and conflicts                                                  | Qualify cold app/provider gates later  | E-REPO-032,E-REPO-033                                  |
| M14.6 | Partial | M14.3       | LD-REPO-005              | Historical text and metadata search opens exact restorable checkpoint versions                                             | Deferred cold search/restore proof     | E-REPO-034                                             |
| M14.7 | Partial | M14.5,M14.6 | LD-REPO-005              | Root storage/adoption and Forgejo work, then changes integrate into main                                                   | Deferred native/provider qualification | E-REPO-035,E-REPO-036,E-REPO-037,E-REPO-038,E-REPO-039 |

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
cold actual-app/provider qualification. At that slice M14.7 stayed Active;
earlier stages stay Partial. E-REPO-038 records main integration.

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
