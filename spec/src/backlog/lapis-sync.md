# Lapis Sync: manual encrypted MVP

**Active MVP scope, revised by the user on 17 November 2026.** The
[cross-repository MVP plan](https://github.com/lapismd/lapis-plugins/blob/main/spec/src/plugins/sync/implementation-plan.md)
owns delivery order; its retained full roadmap is deferred follow-up. The
[implementation context](https://github.com/lapismd/lapis-plugins/blob/main/spec/src/plugins/sync/implementation-context.md)
retains historical provenance. This scope change completes no product gate.

This is separate from
[Git vault synchronization and turn history](vault-synchronization.md), which
retains its original provider and two-device acceptance. Lapis Sync uses the
`sync` plugin and encrypted revision/object protocol. Legacy `nostr-sync`,
standalone History and Git backup keep their identities and existing data.

The [current native chapter](../current/lapis-sync.md) tracks source intake,
custody adapters, retained account admission and cancellable native leave; their
source evidence does not complete this roadmap or enable the plugin.

App leave preparation is qualified against the private Notes LN-PKG-193
candidate. [E-SYNC-007](../history/E-SYNC-007.md) records six actual local macOS
scope and Keychain cases, strict normal/e2e compiler and both native builds.
[E-SYNC-010](../history/E-SYNC-010.md) qualifies account calls and guarded
vault/ Quit leave: native API26pass/3existing AI quarantines, all7Sync cases
executed. [E-SYNC-016](../history/E-SYNC-016.md) records source integration; the
quarantined cases remain unqualified. [E-SYNC-017](../history/E-SYNC-017.md)
records bounded native observations, actual Sync7/7 and full native API26/0 with
three existing AI quarantines. Browser handoff, App injection,
connected-account, locked-Keychain and full Sync journeys remain outstanding.
Local acceptance does not qualify hosted or release gates.

## Active MVP and exit journey

Support two independent macOS ARM64 Desktop devices, one logical vault and one
configured Lapis Server destination per local vault. Offline edits cover notes
and attachments. **Sync now** performs durable encrypted checkpoint, upload,
download and guarded non-conflicting apply. One minimal settings/status surface
shows progress, last successful sync, errors and explicit conflict recovery.

For the MVP, Server is an authenticated ciphertext-only destination. It receives
no content keys and has no enrolled decrypting endpoint or managed Sync working
vault. Local devices require owner-approved authenticated, expiring,
replay-protected pairing. Account login alone grants no content authority.
Native Core owns durable effects; the plugin observes the public App service and
submits admitted actions. No Deno revival or renderer scheduler.

Implement in this order:

1. Complete real native App/session lifecycle, HTTPS account connection,
   protected restore/sign-out and local-device pairing.
2. Connect native encrypted history/checkpoint/outbox and authenticated,
   dependency-ordered durable transfer with bounded catch-up.
3. Complete manual create/update/delete apply. Treat rename as delete/add;
   preserve explicit tombstones and refuse stale or conflicting changes.
4. Preserve both conflict versions and durable conflict state, stop visibly, and
   provide a minimal explicit manual resolution/retry path.
5. Demonstrate A offline edit → Sync now → Server → B exact files, then B edit →
   Sync now → Server → A, using independent stores/keys and a real server.
   Repeat across device/server cold restart and interrupted transfer/apply.

Mandatory MVP acceptance retains encrypted durability before network work,
stable ciphertext/event retry identity, unknown-outcome inspection, guarded
idempotent apply, writer protection or refusal across active/retired/embedded/
multi-window writers, and exclusive apply ownership. Test lost acknowledgements,
conflicting text/binary/delete/add, populated-root collision refusal, empty or
partial listings, index rebuild, wrong profile/vault/root, permission loss,
locked/missing keys and corrupt/missing objects. Attachments retain bounded
streaming and the 64 MiB in-flight target. Minimal encrypted recovery export/
import requires an actual independent-device restore; account reset is separate.

Qualify the actual macOS boundary plus affected source/artifact/consumer,
functional, keyboard/accessibility, architecture/App-ownership and spec lanes.
MVP-relevant retained cases must execute after repair; deferred-only scenarios
remain explicitly unqualified. Do not relax assertions or count skips as passes.
Visual review stays visual-pending. Sync remains optional/disabled by default;
private intake does not authorize publication, deployment or app replacement.

## Deferred until after MVP

- Decrypting server enrollment, readable managed vault, Server Web → Desktop
  edits and server/external-change capture without browsers.
- Automatic sync/checkpoints, reconnect scheduling, watchers and background
  participant lifetime; manual restart/retry recovery remains in MVP. Retain the
  20-second quiet/five-minute maximum policy for eventual automatic operation.
- Rich History/File History/Compare/Merge interfaces, automatic conflict
  resolution, semantic rename detection and forward restore.
- Revocation-management UI, key/Sync Identity rotation and advanced recovery;
  existing authority/cutoff validation, safe refusal and minimal encrypted
  recovery remain binding. Do not claim compromised-key recovery in the MVP.
- Other platforms, all six placements, broad synthetic 3 GiB qualification and
  public package/registry/distribution work. Existing separate release approvals
  still apply, alongside the previously deferred destinations/migration/GC.

## Original full product outcome — deferred beyond MVP

Desktop devices can edit notes and attachments offline, retain local history
across restart and synchronize with one configured Lapis Server destination per
local vault. Multiple enrolled devices share revision ancestry, explicit
conflicts and forward restore. The server is an explicitly enrolled endpoint
with its own device key and a readable managed vault. Its Web users edit that
vault; server capture continues without an open browser.

Encryption is mandatory before provider transport and encrypted repository
storage. The enrolled server can decrypt its working files and indexes. Account
login, endpoint enrollment, transport authorization, content keys, owner
authority and recovery remain separate. Login alone cannot unlock content, and
account reset cannot replace encrypted recovery.

The agreed native direction is a Plugins-owned Rust engine, qualified against
shared complete-output fixtures from the retained TypeScript engine. Shared
native application services own durable work and scheduling. Desktop owns OS
custody, Tauri adapters and window/profile admission. The eventual plugin is
optional and disabled by default after qualification.

## Investigation baseline and provenance

| Area                | Existing foundation on 14 November 2026                                                                                    | Remaining boundary                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Sync plugin         | Protocol codecs, encrypted checkpoints/outbox, ancestry/authority, guarded-apply foundations and retained UI               | Private/parked, no complete production runtime, tests/stories skipped        |
| Notes API           | Scoped identity/change, guarded I/O/storage, crypto/pairing/membership/recovery and editor protection                      | Native consumer selection and complete Sync writer qualification             |
| Frozen Deno host    | Dedicated encrypted stores, Keychain custody, admitted security/data RPC, guarded filesystem/receipts and restart evidence | Reference only; none of that acceptance qualifies Tauri/Rust                 |
| Current Tauri       | Generic API SyncHostService lifecycle, existing editor registry and native application infrastructure                      | No installed Sync plugin, native Sync providers, runtime or scheduler        |
| Old server          | Account authorization, connection checks and managed-vault discovery                                                       | Durable destination and continuous participant remained unfinished           |
| Current Rust server | Hosted vaults and shared native application services                                                                       | Sync-specific authorization, enrollment, destination/storage and participant |

In `src/components/views/NotesWorkspace.svelte`, the App receives no Sync
security/local-provider configuration; `takeHostSyncService(app)` supplies the
generic service for disposal. The static plugin inventories omit Sync.
Repository History's existing synchronization implementation is the Git feature
and does not supply these missing capabilities.

The owning Plugins records retain the exact history:

- [12 October Deno plan](https://github.com/lapismd/lapis-plugins/blob/main/spec/records/2026-10-12-lapis-sync-deno-plan.md)
  established the full scope, trusted enrolled server and mandatory encryption.
- [14 October incremental plan](https://github.com/lapismd/lapis-plugins/blob/main/spec/records/2026-10-14-sync-incremental-delivery-plan.md)
  and
  [runtime continuation](https://github.com/lapismd/lapis-plugins/blob/main/spec/records/2026-10-14-sync-runtime-continuation.md)
  retain the original feature stages and source qualification.
- Notes merge `967a92fb123c` landed reusable host/editor contracts. Deno custody
  `ace47828b0b1` and data bridge `facb10aef06b` retain actual native security,
  bounded RPC, captured authority and restart receipts in the Notes repository.
- [Plugins landing `7cce83e7864b`](https://github.com/lapismd/lapis-plugins/blob/main/spec/records/2026-10-15-sync-stage-0c-main-landing.md)
  retained engine/UI source and completed its stage-0 landing prerequisites.
- [15 October account bridge checkpoint](https://github.com/lapismd/lapis-plugins/blob/main/spec/records/2026-10-15-sync-slice-1c-native-account-bridge.md)
  qualified private real-server/Keychain Settings integration; packaged native
  window, renderer reload and broader platform qualification remained pending.

Old temporary workspaces were preserved and retired after landing. Earlier
pending-main claims, Deno runtime/version assumptions and import failures
describe those recorded revisions. The former packaged-window failure is not a
reproduced current Tauri defect. Preserve all historical evidence unchanged;
[LD-MIG-003](../current/migration.md) keeps Deno Desktop frozen.

The investigation observed 85 passing focused API cases in nine files;
standalone Sync engine/Svelte checks had zero errors/warnings. Its current test
run collected 18 files with all 205 cases intentionally skipped. The Plugins
context lists the exact API targets and source snapshots. These are source
observations, not current Rust/Tauri, two-device or release acceptance. The
[documentation receipt](../history/E-PLAN-007.md) covers this saved plan.

## Source ownership and public integration

| Owner                             | Required future work                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plugins                           | Rust algorithms in `crates/lapis-plugin-services`, TypeScript parity corpus, destination client, `SyncRuntime` presentation, retained settings/views/status and provider conformance |
| Notes API                         | Optional App-owned native Sync capability/observation contract, scoped host security/local-storage capabilities, writer admission/protection and cleanup                             |
| Server-owned shared core/protocol | Durable encrypted repositories, guarded file effects, endpoint security orchestration, admitted native participant/scheduler and bounded commands/observations                       |
| Rust HTTP server                  | Consent/scoped account authorization, pairing delivery and enrollment, authenticated event/object APIs and hosted participant lifetime                                               |
| Desktop                           | OS key wrapping and credentials, profile/vault/root admission, Tauri IPC/events, browser handoff, plugin intake and actual native acceptance                                         |

Reuse the API's `SyncHostServiceOptions` and public repository/security
contracts where they apply. Extend generic public contracts upstream before
integration. `SyncRuntime` remains the plugin's action/snapshot/subscription
facade; an explicit App/session-owned optional native service provides its
implementation. Native failure cannot fall back to another authoritative
renderer engine or disposable store. Pure algorithms remain Plugins-owned; core
owns effects and application policy, while Desktop supplies Tauri/OS policy.

Preserve the Nostr-compatible event IDs, signatures, attestation envelopes,
encrypted object formats, ancestry, membership cutoffs and explicit legacy
readers. Rust crypto/signing uses host custody; private keys, wrapping material,
bearers and authorization verifiers do not enter renderer/plugin state. Keep
separate stores for encrypted history/outbox, guarded apply journals and wrapped
credentials, outside indexes and captured vault content.

Commands carry bounded values, stable request IDs and captured vault/device/
epoch/membership authority. Admission rechecks after waits and fences late work
across window, profile, vault, server, account and plugin changes. Distinguish
staged upload, accepted history and applied working files. Preserve uncertain
outcomes for inspection before retry; encrypted retries retain their IDs/bytes.

One inclusion policy governs capture/apply: notes/attachments and explicitly
allowed portable `.lapis` configuration; exclude secrets, machine-specific
state, indexes, caches and Sync stores. Logical Sync vault identity remains
distinct from local path/profile, managed server-vault ID and destination URL.

### Writer and lifetime integration

Reaudit the current [enabled writer inventory](../current/writer-audit.md) and
all additional enabled plugins at implementation time. Cover API editors, Source
Editor, Markdown/Mira previews, properties/metadata, App/plugin/layout state,
attachments, AI/domain writes and terminal/external filesystem effects. An older
inventory or generic API test does not prove the full active surface.

Protect/flush admitted writers before snapshot/apply and keep the captured
destination. Preserve dirty or retired drafts, conditional saves, native intent
admission and failed cleanup. Use native durable idempotent mutation receipts;
do not hold a renderer timer or view instance as the durable work owner.

Acquire host-owned exclusive apply ownership across Lapis Sync and legacy Nostr
Sync, and serialize Git restore/pull and other application mutations through the
existing protection boundary. Multiple windows observe the same admitted
service; detaching a view does not create or destroy a second engine. Define
distinct reload/detach, explicit plugin disable, vault close and process exit
behavior; cancelled leave retains ownership and all pending work.

## Retained full roadmap — MVP subsets first, larger exits deferred

The Plugins roadmap supplies the complete prerequisites, public interfaces,
regression families and manual journey for each matching stage. All stages are
pending; the Desktop contribution and exit boundaries are:

| Stage                    | Desktop contribution / prerequisite                                                              | Native or manual exit                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1. Rebaseline source     | Consume repaired public TypeScript/UI boundaries after Plugins reexecutes retained tests/stories | Real shell review; skipped tests remain explicit until repaired and executed                                                   |
| 2. Rust parity           | Consume Plugins algorithms after frozen vectors and complete TypeScript/Rust outcomes pass       | Native service can interpret fixture history without renderer/host dependencies                                                |
| 3. Storage and custody   | Add admitted Tauri/OS adapters over core stores/guarded files; API contracts precede callers     | Real cold processes retain identity, ciphertext/outbox and receipts; denied roots/raw-key access and failed cleanup reject     |
| 4. Account connection    | Current Rust consent/access service plus OS credential custody                                   | Real Tauri sign-in, discovery, connection, cancel, expire, server change, restart and sign-out                                 |
| 5. Enrollment            | Host-mediated expiring pairing and owner authorization with shared core/server                   | Independent device/server identities survive restart; locked or unenrolled content access refuses                              |
| 6. Local history         | Bind native observation/actions to retained plugin runtime after local enrollment                | Save/checkpoint/compare/history, pending-writer block or flush, then offline cold reopen                                       |
| 7. Transfer              | Use authenticated destination APIs after durable repository/enrollment gates                     | A uploads; independently stored B downloads/compares; neither download nor connection claims working-file apply                |
| 8. Manual round trip     | Complete writer/exclusive-apply admission and durable recovery                                   | A → server Web → A/B, dirty-writer refusal, interrupted apply and no echoed revisions                                          |
| 9. Automatic/offline     | One native owner, bounded retry, durable catch-up and retained scheduling policy                 | Offline cold restart, missed feed/watch event and server external edit without browsers converge                               |
| 10. Conflicts/recovery   | Connect persistent drafts, conditional decisions, forward restore and key recovery               | Text/binary/rename/delete conflict, stale draft, populated-root preview, revocation/rotation and recovery through real UI      |
| 11. Qualification/intake | Full source/artifact/consumer checks and separately qualified supported OS custody               | Optional default-disabled activation, Safe Mode, install/update/disable/uninstall/restart; release remains separately approved |

The retained autosave policy attempts a checkpoint after 20 seconds quiet and at
most five minutes of continuous change; single-flight native admission and
bounded retries govern execution. No view/settings callback owns scheduling.
Server capture includes managed Web/API edits and external file changes with
startup/periodic reconciliation. Watch events are hints; revalidated versions
govern apply. Capturing every intermediate external save is not guaranteed.

Manual accepted upload, manual server apply, manual return-path convergence and
automatic two-device operation are distinct exits. Each slice first updates its
owner requirements/verification, names the exact regression and records source
revisions, public artifacts and consumer acceptance independently.

## Deferred full-feature acceptance matrix

The following matrix retains full-feature follow-up. Shared safety cases remain
MVP gates above; server/Web edits, automation, expanded UI/restore/rotation and
additional-platform qualification are deferred, not completed.

| Target                                                   | Required result                                                                                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Cold offline device/server restart                       | Local history/outbox survives; reconnect retains exact ciphertext/events and converges                                                   |
| Lost acknowledgement or duplicate request                | Durable identity/receipt inspected before retry; no duplicate revision or falsely completed operation                                    |
| Two devices, Web and browser-free external server edit   | Independent stores/keys, correct ancestry, actual saved working files and no origin echo                                                 |
| Dirty/retired/embedded writers and windows               | Flush/protect or visible refusal, no lost draft, no cross-vault response or extra scheduler                                              |
| External edit during capture/apply; rename/delete/binary | Captured identity/generation rejects overwrite; both versions remain reviewable                                                          |
| Crash, missing/corrupt objects or stale receipt          | Safe recoverable intent; no false applied marker or plaintext fallback                                                                   |
| Wrong profile/root/vault/server and permission loss      | Scoped capabilities, fenced late responses and revoked subscriptions                                                                     |
| Locked/revoked keys, rotation and encrypted recovery     | No unauthorized new-epoch publication/decryption; historical access limits remain explicit                                               |
| Two populated roots, empty side, partial page            | Collision preview and bounded reconciliation; absence never implies mass deletion                                                        |
| Cursor expiry or rebuilt index                           | Durable encrypted history/membership/outbox remains; bounded catch-up recovers                                                           |
| Large attachment                                         | Real streamed capture/transfer/apply measures the retained 64 MiB in-flight target; synthetic 3 GiB coverage is separate                 |
| Conflict/forward restore                                 | Real retained Merge/History controls, persisted decisions, stale rejection and preserved intervening history                             |
| Disable/re-enable/reload/switch/close                    | Bounded drain, cancelled-close ownership, recoverable failure and resumed pending work                                                   |
| UI and accessibility                                     | Production Sync/History/File History/Compare/Merge/Settings/status, all six placements, light/dark, narrow sizes, keyboard/focus and axe |
| Supported platforms                                      | Each actual OS custody/restart and packaged window boundary qualified independently                                                      |

Start at exact targets and then the complete impact surface. Native lifecycle
changes require cold processes; headless/fixture/warm success is supporting
evidence only. Retain architecture/App-ownership, full affected functional,
interaction/axe, type/package and spec gates. Use portable Docker lanes and
explicit platform-native gates as their owning guides require; source and
consumer evidence remain distinct. Keep `visual-pending` and no baseline updates
without approval. Unexplained required failures block shared landing.

## Deferred work and resumption

Defer external Nostr/Blossom/S3 destinations, automatic legacy migration,
simultaneous destinations/backfill, live character collaboration, multi-process
server coordination, selective sync and advanced garbage collection. Retain
history conservatively until offline-device retention is specified. Publication,
registry updates, signing and installed-app replacement retain separate gates.

On resumption, recheck live source/dependency state and every owning guide.
Consume verified public archives for private migration acceptance with recorded
source revisions/checksums and portable manifests/registry lockfiles. Do not
repair upstream defects with consumer aliases, copied engines or overrides.
Future API/Server work needs its own canonical contracts and receipts before
implementation; recording those dependencies here does not implement them.

Saving this backlog changes no product verification status. Continue verified
foundations toward the active manual MVP journey; do not restart completed
slices or resume deferred features without a scope change. Commit each verified
slice in its owner with Jujutsu and preserve historical receipts.
