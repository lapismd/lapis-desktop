# Automatic vault backup delivery

The user approved the staged plan and isolated implementation workspaces. Heavy
verification is deferred while getting a working version in place; focused
checks and all outstanding lanes are recorded. M13/AI and prior visual gates are
unchanged. Only M14.5 is Active. M14.3 local restore proofs pass; cold app
qualification is deferred. M14.1 native proofs pass; cold WebView qualification
remains deferred.

| ID    | Status      | Depends     | Requirements             | Gate                                                                                                                       | Next                                       | Evidence                         |
| ----- | ----------- | ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------- |
| M14   | In progress | -           | LD-REPO-005              | Functional automatic backup, restore, GitHub/Forgejo synchronization and historical search integrated into main workspaces | Complete the staged plan                   | E-REPO-026                       |
| M14.1 | Partial     | -           | LD-REPO-005,LD-VAULT-002 | Stable vault IDs and independent external JJ history work in the native app after reopen and recent eviction               | Complete native binding and identity proof | E-REPO-026                       |
| M14.2 | Partial     | M14.1       | LD-REPO-005              | Open-vault internal/external capture, reconciliation and crash/close recovery work                                         | Qualify cold native lifecycle later        | E-REPO-026,E-REPO-027            |
| M14.3 | Partial     | M14.2       | LD-REPO-005              | Local timeline, guarded restoration, live history and independent status visibility work                                   | Qualify cold app restore, then forge setup | E-REPO-028                       |
| M14.4 | Partial     | M14.3       | LD-REPO-005              | GitHub sign-in, remote setup and fresh-device restore work                                                                 | Qualify cold app/provider flow later       | E-REPO-029,E-REPO-030,E-REPO-031 |
| M14.5 | In progress | M14.4       | LD-REPO-005              | Two-device automatic pull/merge/push preserves offline work and conflicts                                                  | Implement automatic sync and conflicts     | E-REPO-031                       |
| M14.6 | Planned     | M14.3       | LD-REPO-005              | Historical text and metadata search opens exact restorable checkpoint versions                                             | Add the disposable projection              | -                                |
| M14.7 | Planned     | M14.5,M14.6 | LD-REPO-005              | Root storage/adoption and Forgejo work, then changes integrate into main                                                   | Complete advanced storage and providers    | -                                |

The task checklist is
[automatic-vault-backup-progress](../../../../docs/automatic-vault-backup-progress.md).
