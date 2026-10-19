# Automatic vault backup delivery

## Current checkpoint — 2026-10-19

All seven implementation stages are **implemented and integrated into main**. No
implementation stage is currently active. The source ledger is jj-store M34; the
desktop [M14 ledger](../spec/src/current/progress/vault-backup.md) alone owns
desktop completion status. Its Partial statuses retain original acceptance
gates; they do not mean all seven features are still being implemented.

| Stage                                  | Implementation         | Recorded focused checks                                                                                 | Remaining acceptance                                                       |
| -------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1. Vault identity and external storage | Implemented/integrated | Native registry, external JJ roots and relinking (E-REPO-026)                                           | Cold native reopen, eviction/relink and independent vault identity         |
| 2. Capture coordinator                 | Implemented/integrated | Worker/watcher, admission, renderer lifetime and close fencing (E-REPO-026/027)                         | Cold native internal/external capture, reconciliation, crash/close/reload  |
| 3. Local history and restore           | Implemented/integrated | Actual source restore, worker/frame, renderer and catalog checks (E-REPO-028)                           | Actual WebView file/vault restore, recovery, live follow and status        |
| 4. GitHub integration                  | Implemented/integrated | Account/remote/restore native boundaries, renderer and settings stories (E-REPO-029–031/039–041)        | Live sign-in, remote setup and fresh-device restore                        |
| 5. Automatic two-way synchronization   | Implemented/integrated | Native two-device convergence and recovery, renderer/catalog checks (E-REPO-032/033)                    | Cold app/provider push/pull, offline/conflict and unknown-outcome recovery |
| 6. Historical search                   | Implemented/integrated | Source search, native frames, renderer and catalog checks (E-REPO-034)                                  | Cold native exact-version search and guarded restore                       |
| 7. Advanced storage and Forgejo        | Implemented/integrated | Forgejo auth, storage migration, ancestry adoption/source tabs and main renderer build (E-REPO-035–038) | Cold native storage/adoption and live Forgejo acceptance                   |

Settings now live in **Settings → Repository History**, with GitHub/Forgejo
icons, full-width forge tables and a separate Backup and synchronisation
section. E-REPO-039–041 cover the latest presentation; E-REPO-041 records 164
affected Storybook interaction/accessibility executions, strict types, ownership
audits and a production renderer build. These are production-component previews;
final integration/settings slices have no new actual native review-app
acceptance recorded.

The next useful delivery slice is cold native-app acceptance, followed by real
providers and wider qualification. Full suites, other platforms, release and
visual approval remain deferred. E-REPO-042 reconciles tracking only; M13/AI,
original gates and visual baselines are unchanged. Checkmarks below identify
completed slices; unchecked items identify pending acceptance.

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
  remain deferred under the approved working-version scope. No visual baseline
  changes.
- A focused Rust check initially hit the 30 GiB disk reserve. The active
  jj-store target was preserved. An idle desktop incremental cache was cleaned
  while holding its Cargo lock, recovering about 14 GiB; review data and app
  bundles were preserved. Focused native compilation/tests then ran.
- Initial source compile/test mistakes and the native descendant-rebase failure
  were fixed before the three capture regressions passed. First consumer types
  lacked the new workspace's public `jj-history` dist; building that package
  restored a clean type check. These attempts remain in local verification logs.
- Historical search and Forgejo focused implementation are recorded below.
  Existing-repository adoption/source selection now have focused implementation;
  native/provider acceptance remains deferred and recorded.
- [x] Source and desktop code integrated into the main workspaces. Existing
      review-app and ordinary vault data remain in their original locations.

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
- [x] Forgejo and historical search focused implementation (recorded below).
- [x] Existing repository source selector and explicit ancestry adoption.

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
      source 26c4c417 (E-VAULT-BACKUP-005).
- [x] Native account-scoped repository resolution: validate clone origin,
      project, branch and observed push permission without exposing credentials.
- [x] Desktop remote repository/branch setup and guarded fresh-device restore;
      cached restoration, original-request recovery and progress drain work.
      E-REPO-031.
- [ ] Live GitHub/Forgejo acceptance of the integrated sync flow.

## Automatic synchronization

- [x] Plugin-owned automatic fetch/merge/push, independent of status/settings.
- [x] Bounded offline retry/coalescing without blocking local capture or close.
- [x] Guarded native merge and usable retained-conflict resolution.
- [x] Two-device native merge/convergence proof, exact publication reservation
      and accepted-ancestor observation without replay. E-VAULT-BACKUP-008.
- [x] Original apply recovery, cold recovery record matching and native writer
      barrier before keeping current files. E-REPO-032.
- [x] Explicit recovery controls when an unknown push cannot be confirmed by
      remote ancestry; preserve its original receipt and never replay blindly.
- [ ] Focused actual native-app synchronization/lifecycle acceptance.

Normal, conflict and original-push recovery flows have focused proof in
E-VAULT-BACKUP-008/009 and E-REPO-032/033. Stage 5 implementation is complete;
its gate remains Partial because cold native/provider acceptance remains open.
Implementation is integrated; no stage is Active. Root storage, adoption and
Forgejo have focused implementations; cold native/provider qualification remains
deferred. Main code is integrated; original review and vault data are preserved.

## Historical search

- [x] Bounded immutable checkpoint/text/path/metadata reader and disposable
      cache.
- [x] Plugin search UI, exact selection and guarded restoration.
- [x] Focused source/consumer proofs and mapped loading/empty/recovery stories.

Source E-VAULT-BACKUP-010 qualifies 20 native and nine worker/search cases.
Desktop E-REPO-034 qualifies 46 renderer cases, nine native frame cases and 116
affected catalog interaction/accessibility executions. Cold native
search/restore/lifecycle acceptance remains deferred after implementation.
Search cache is disposable; content above 1 MiB and binary/conflicted versions
remain path-only with an explicit count.

## Advanced storage and Forgejo

- [x] Forgejo PAT custody, provider-aware Git authentication and remote setup.
- [x] Recoverable native external/root .jj migration, original receipt lineage,
      archives, rollback before installation and excluded control files.
- [x] Production storage settings with guarded move/reload and original-request
      recovery; capture, history, search and sync share native layout
      resolution.
- [x] Backup watcher excludes repository/runtime metadata from both hints and
      recursive inventory, preventing capture loops in the root layout.
- [x] Explicit existing-repository adoption with original-request recovery.
- [x] Separate backup/original JJ Log and Op Log source tabs with pinned reads.
- [x] Focused source/desktop implementation integrated into main.
- [ ] Cold native-app acceptance remains deferred.

Forgejo focused evidence: E-VAULT-BACKUP-011 / E-REPO-035. Source 29 forge
package cases, seven credential/transfer cases, four native consumer service
cases, nine frame cases, 11 renderer cases and 84 catalog interaction/axe
executions pass. Live provider/cold app gates remain open. E-VAULT-BACKUP-012
and E-REPO-036 record focused source/desktop storage evidence. Stage 7
implementation is integrated; its native/provider qualification remains Partial.

E-VAULT-BACKUP-013 / E-REPO-037 record recorded-ancestry import, original
request recovery and source-specific tabs. The original repository stays
independent and unchanged; imported Git ancestry joins the current managed tree.
Original native operations/evolution remain available through separate read
tokens. Capture, search, status and ordinary file history stay backup-scoped.
Current focused results are recorded in the ledgers. Cold native/provider
qualification remains open; E-REPO-038 records main integration.

## Main workspace acceptance

E-REPO-038 records main integration. The desktop uses the same 14
checksum-verified local archives as the qualified isolated workspace; normal
package manifests and lockfiles remain portable. Main focused renderer tests,
strict types, affected cold Storybook/theme/width checks and the production
renderer build pass. Source production code is unchanged from
E-VAULT-BACKUP-013. The unrelated source progress edit and review/vault data are
preserved. Heavy actual-native-app, live-forge, full-suite, other-platform and
release qualification remain deferred; focused evidence does not complete those
original gates.

- [x] Generate the source documentation book and rerun the rendered-book link
      audit. E-VAULT-BACKUP-015 records the initial missing input and successful
      repair: 3157 HTML pages / 120192 local references pass.

## Plugin settings presentation

- [x] Account, remote, synchronization, storage and adoption controls live
      inside Settings → Repository History, without an independent workspace
      tab.
- [x] Adapt jj-store's compact tinted card headers, divided rows, trailing
      action footers and GitHub/Forgejo brand icons; retain local attribution.
- [x] Preserve transient authorization cleanup, original restore recovery and
      plugin-owned long-running work when settings closes.

E-REPO-039 records 164 affected Storybook executions plus 20 sync reruns, 47
renderer tests, 67 governance tests, strict types and the renderer build. Real
native/provider acceptance, visual approval and wider release gates remain
deferred.

- [x] Forge account choices use jj-store menu sizing so labels fit on one line,
      bounded by the viewport (E-REPO-040).

- [x] Separate Backup and synchronisation section with tinted table headers and
      white light-theme body rows/footers (E-REPO-041). Existing settings source
      values, account cleanup and background work ownership are retained.

E-REPO-045 replaces separate history search with Current files, History and
Everything in the existing Search view. A disposable native index emits bounded
worker batches independently of capture; exact historical targets remain owned
by Repository History. Its cold IPC proof is separate from full visible restore
and live-provider qualification.
