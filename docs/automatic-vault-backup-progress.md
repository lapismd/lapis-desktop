# Automatic vault backup delivery

This checklist implements the approved seven-stage plan. Only the current stage
is Active. Checkmarks identify completed slices; they do not promote an entire
stage before its acceptance is proven. The native source ledger is jj-store M34;
the desktop ledger is M14. Heavy checks are deferred by user instruction and
listed below. Changes integrate back into the main workspaces after completion.

| Stage                                  | Status  | Acceptance                                                                                     |
| -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| 1. Vault identity and external storage | Partial | Ordinary folder has durable history without in-vault JJ/Git metadata; reopen/relink retains it |
| 2. Capture coordinator                 | Active  | Internal/external changes, bounded debounce/reconciliation and crash/close recovery work       |
| 3. Local history and restore           | Pending | Timeline, guarded file/vault restore, live history and optional status work                    |
| 4. GitHub integration                  | Pending | Sign-in, remote setup and fresh-device restore work                                            |
| 5. Automatic two-way synchronization   | Pending | Two devices merge/push/pull safely, including conflicts and offline recovery                   |
| 6. Historical search                   | Pending | Find and restore past text, paths and metadata through exact checkpoint anchors                |
| 7. Advanced storage and Forgejo        | Pending | Root .jj/adoption and Forgejo work, then changes integrate into main                           |

## Completed slices

- [x] Isolated JJ source and desktop workspaces under `vault-backup/`.
- [x] Upstream-native external repository/working-copy initialization and
      retained checkpoint ancestry. Four actual native regressions pass,
      including physical-root relinking.
- [x] Independent inclusion rules retain Git-ignored attachments and nested
      repository content while excluding repository/app metadata.
- [x] Reusable `jj-vault` worker coordinator. Two scheduling and three actual
      worker/close/in-flight-change tests pass.
- [x] Seven renderer controller regressions pass, including late start response,
      independent observer lifetime, failure recovery and fenced close.
- [x] Eleven exact permission/source-audit tests and strict Svelte types pass.

## In the current stage

- [x] Native durable vault registry; two eviction/move/replacement regressions
      pass.
- [x] Permissioned desktop writer, shared IO gate, source binding, native
      watcher and status integration; native compilation and two real
      watcher/admission tests pass.
- [ ] Native runtime close/destruction/reload proof and failed-open cleanup.
- [ ] Record focused source/consumer evidence and commit the verified
      foundation.

## Deferred verification and remaining delivery

- Full repository Rust/UI/catalog suites and all-platform/release qualification
  are deferred until implementation is in place. No visual baseline changes.
- A focused Rust check initially hit the 30 GiB disk reserve. The active
  jj-store target was preserved. An idle desktop incremental cache was cleaned
  while holding its Cargo lock, recovering about14 GiB; review data and app
  bundles were preserved. Focused native compilation/tests then ran.
- Initial source compile/test mistakes and the native descendant-rebase failure
  were fixed before the three capture regressions passed. First consumer types
  lacked the new workspace's public `jj-history` dist; building that package
  restored a clean type check. These attempts remain in local verification logs.
- Remote setup/sync, restore, search, root-storage migration,
  existing-repository adoption and Forgejo remain required implementation, not
  deferred scope.
- Nothing has been integrated into the main workspaces yet. Existing review app
  and ordinary vault data remain in their original locations.
