# Automatic vault backup delivery

The user approved the staged plan and isolated implementation workspaces. Heavy
verification is deferred while getting a working version in place; focused
checks and all outstanding lanes are recorded. M13/AI and prior visual gates are
unchanged. Only M14.7 is Active. M14.6 focused search proofs pass; cold native
qualification remains deferred. M14.5 recovery focused checks pass; cold
app/provider qualification remains deferred. M14.3 local restore proofs pass;
cold app qualification is deferred. M14.1 native proofs pass; cold WebView
qualification remains deferred.

| ID    | Status      | Depends     | Requirements             | Gate                                                                                                                       | Next                                                | Evidence                         |
| ----- | ----------- | ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------- |
| M14   | In progress | -           | LD-REPO-005              | Functional automatic backup, restore, GitHub/Forgejo synchronization and historical search integrated into main workspaces | Complete the staged plan                            | E-REPO-026                       |
| M14.1 | Partial     | -           | LD-REPO-005,LD-VAULT-002 | Stable vault IDs and independent external JJ history work in the native app after reopen and recent eviction               | Complete native binding and identity proof          | E-REPO-026                       |
| M14.2 | Partial     | M14.1       | LD-REPO-005              | Open-vault internal/external capture, reconciliation and crash/close recovery work                                         | Qualify cold native lifecycle later                 | E-REPO-026,E-REPO-027            |
| M14.3 | Partial     | M14.2       | LD-REPO-005              | Local timeline, guarded restoration, live history and independent status visibility work                                   | Qualify cold app restore, then forge setup          | E-REPO-028                       |
| M14.4 | Partial     | M14.3       | LD-REPO-005              | GitHub sign-in, remote setup and fresh-device restore work                                                                 | Qualify cold app/provider flow later                | E-REPO-029,E-REPO-030,E-REPO-031 |
| M14.5 | Partial     | M14.4       | LD-REPO-005              | Two-device automatic pull/merge/push preserves offline work and conflicts                                                  | Qualify cold app/provider gates later               | E-REPO-032,E-REPO-033            |
| M14.6 | Partial     | M14.3       | LD-REPO-005              | Historical text and metadata search opens exact restorable checkpoint versions                                             | Finish focused search proof; then storage/providers | E-REPO-034                       |
| M14.7 | In progress | M14.5,M14.6 | LD-REPO-005              | Root storage/adoption and Forgejo work, then changes integrate into main                                                   | Complete existing-source adoption and selection     | E-REPO-035,E-REPO-036            |

The task checklist is
[automatic-vault-backup-progress](../../../../docs/automatic-vault-backup-progress.md).

E-REPO-036 adds advanced storage settings, shared native layout resolution,
interrupted-move recovery and filtered backup watching. Focused source/native,
renderer and catalog proofs are recorded separately. Existing-repository
adoption/source selection, cold native/provider qualification and main
integration remain required. M14.7 stays Active; earlier stages stay Partial.
