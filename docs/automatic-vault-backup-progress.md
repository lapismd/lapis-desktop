# Automatic vault backup delivery

This checklist implements the approved seven-stage plan. Only the current stage
is Active. Checkmarks identify completed slices; they do not promote an entire
stage before its acceptance is proven. The native source ledger is jj-store M34;
the desktop ledger is M14. Heavy checks are deferred by user instruction and
listed below. Changes integrate back into the main workspaces after completion.

| Stage                                  | Status  | Acceptance                                                                                     |
| -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| 1. Vault identity and external storage | Partial | Ordinary folder has durable history without in-vault JJ/Git metadata; reopen/relink retains it |
| 2. Capture coordinator                 | Partial | Internal/external changes, bounded debounce/reconciliation and crash/close recovery work       |
| 3. Local history and restore           | Partial | Timeline, guarded file/vault restore, live history and optional status work                    |
| 4. GitHub integration                  | Partial | Sign-in, remote setup and fresh-device restore work                                            |
| 5. Automatic two-way synchronization   | Active  | Two devices merge/push/pull safely, including conflicts and offline recovery                   |
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

## Native capture foundations

- [x] Native durable vault registry; two eviction/move/replacement regressions
      pass.
- [x] Permissioned desktop writer, shared IO gate, source binding, native
      watcher and status integration; native compilation and two real
      watcher/admission tests pass.
- [ ] Native runtime close/destruction/reload proof and failed-open cleanup.
- [x] Record focused source/consumer evidence and commit the verified
      external-storage/capture and file-restore foundations in both workspaces.

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
- Remote setup/sync, historical search, root-storage migration,
  existing-repository adoption and Forgejo remain required implementation, not
  deferred scope.
- Nothing has been integrated into the main workspaces yet. Existing review app
  and ordinary vault data remain in their original locations.

## Local restore and live follow

- [x] Guarded retained-file preview and restore with a preceding safety
      checkpoint.
- [x] Durable restore receipts recover a lost response without overwriting later
      edits.
- [x] Editor writers stay protected across preview and apply; failures use App
      toasts.
- [x] Native worker dispatch, main-window permissions and production
      diff-toolbar action.
- [x] Live JJ/Op Log and file-history views follow completed checkpoints while
      retaining explicit selections.
- [x] Initial capture reports progress without holding plugin/shell startup.
- [x] Focused evidence: three source restore tests, six coordinator/native
      worker tests, 50 renderer/governance tests, strict types, native
      command-frame test, six stories in four width/theme runs (24
      interaction/accessibility executions).
- [x] Whole-vault restore with an original safety checkpoint, guarded progress
      and complete-tree verification.
- [x] Durable UI restore identity and explicit original-request recovery after
      reopening history.
- [ ] Complete actual-WebView backup/restore lifecycle acceptance.
- [ ] Existing repository source selector, GitHub/Forgejo, synchronization and
      search.

First Storybook restore attempts exposed a Vite dependency-optimization reload
and an assertion racing dialog animation. The exact stories pass after the
dependency cache settled and visibility is awaited. One inherited pin regression
and a source-size violation were corrected without weakening the original
assertions.

Whole-vault native evidence adds two actual source regressions and the extended
serialized native worker proof. Unsupported symlink and file/directory type
transitions fail explicitly before mutation. Full-tree restore does not replace
`.lapis` runtime data or explicit backup exclusions.

## GitHub integration

- [x] Reuse jj-forge account manager with desktop-owned OS secret namespace and
      private account metadata. Reuse only the configured public OAuth client
      ID.
- [x] Main-window-only native account command on bounded workers; cancellation
      bypasses busy polling and fences late credential persistence.
- [x] Production backup settings entry, device sign-in, PAT/Enterprise form,
      loading skeletons, App toasts and progress.
- [x] Focused account checks: seven source cases, two native worker cases, one
      frame test, 15 renderer/governance cases, strict types and 20 account
      interaction/accessibility executions. E-VAULT-BACKUP-004 / E-REPO-029.
- [x] Native remote transfer/import/guarded restore and exact durable push
      intents. Actual Git clones and a stalled-HTTPS capture proof pass in
      source26c4c417 (E-VAULT-BACKUP-005).
- [x] Native account-scoped repository resolution: validate clone origin,
      project, branch and observed push permission without exposing credentials.
- [x] Desktop remote repository/branch setup and guarded fresh-device restore;
      cached restoration, original-request recovery and progress drain work.
      E-REPO-031.
- [ ] Live forge acceptance after the complete sync flow is implemented.

## Current stage: Automatic synchronization

- [ ] Plugin-owned automatic fetch/merge/push, independent of status/settings.
- [ ] Bounded offline retry/coalescing without blocking local capture or close.
- [ ] Guarded native merge and usable retained-conflict resolution.
- [ ] Exact original push recovery and two-device native proof.
