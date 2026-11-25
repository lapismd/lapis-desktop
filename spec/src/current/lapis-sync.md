# Lapis Sync native integration

This chapter owns current Desktop intake and OS adapters. The
[Sync backlog](../backlog/lapis-sync.md) now prioritizes the manual encrypted
two-device macOS MVP. Server/Web editing, automation, expanded recovery/UI and
other platforms are deferred; shared security/data-integrity gates remain. Sync
remains optional and disabled; no plugin inventory or installed application
changes. The shared Desktop OS credential adapter retains existing Sync service
and item identifiers and enforces the same profile admission.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LD-SYNC-001 | Desktop MUST consume the public shared native Sync service through exact reachable source revisions, admit its captured profile/vault/root before commands, and keep account, endpoint and content authority separate. Shared Core owns durable work; Desktop MUST NOT install a renderer scheduler or silently select another provider after native failure. |
| LD-SYNC-002 | The macOS account custody adapter MUST keep bounded native-only bytes in a profile-scoped Keychain namespace, validate scoped item keys and retain captured physical-root admission. Missing entries MUST remain distinct from custody failures; unsupported platforms MUST report unavailable without plaintext fallback.                                    |

## Native profile identity

LD-SYNC-001 native admission MUST retain one immutable logical profile UUID in
profile-private Sync metadata and an independent immutable profile-level
creation witness outside the Sync repository, bound to captured physical
profile, Sync and witness-file identities. An existing Sync directory with
missing, foreign or corrupt identity MUST require recovery instead of issuing a
replacement identity. Native profile admission does not select a destination,
enroll a participant or activate Sync.

## Retained account admission

LD-SYNC-001 Desktop account admission MUST share one Core account owner per
logical local vault and captured root, with one selected server origin. Native
profile identity and admitted vault sessions determine custody scope; a window
cannot supply another root, profile identity or raw secret. Per-window opaque
handles MUST be replaced on re-admission and checked both before actions and
after waits or before observation delivery.

View detach MUST revoke its handle while retaining accepted work and the owner.
A window command MUST NOT close the shared owner. Explicit native vault/process
lifetime integration owns close/drain; uncertain custody retains the original
owner. Native registries MUST bound retained services and reject a different
origin or replaced root without creating another owner or fallback.

An unconfigured native session MAY admit a window scope before destination
selection. This scope MUST validate the same profile/vault/root and revocable
handle without opening an account or accessing custody. Account commands remain
unavailable until explicit configuration; choosing a server replaces the handle
only after successful admission. This capability adds no content authority.

## Account custody and source intake

The native account coordinator is owned by Server Core
`c32b5ae48b24c98dfa8de2004cf68e0496cd63bd`; its source receipt records real
HTTP, cold native-process and uncertain-outcome tests separately from OS
custody. Desktop pins the same reachable Git source for all three shared crates
and aligns JJ Store `086def182eae2ab6e5dc39aba030390d7ea8612c` across direct and
transitive native consumers. Feature-source intake is private development
qualification; dependency PR ordering and release gates remain explicit.

The account adapter implements Core's HostAccountCustody port. Its service
namespace binds the captured profile's path and physical identity, while Core
binds each item to logical profile/vault identities, one server and its owner
lock. Native code alone sees protected bytes; views receive safe snapshots and
submit admitted commands. No account bearer or proof grants content access.

Portable Linux tests qualify scope validation and unavailable-provider refusal.
Actual Keychain storage/restart/locked access and Tauri/window lifetime require
their own explicit native evidence under existing platform policy. A compiled
adapter, fake provider or another platform's pass cannot satisfy those gates.

[Verification](../verification/lapis-sync.md) records source and remaining
native gates.

Native command admission MUST bound provider, request identity and inputs,
reject renderer-supplied time, custody, roots and secret material, and refuse
unknown operations. The native host supplies account time and device label; the
account call transport MUST return the matching provider/request identity and a
freshly validated handle/observation without serializing native owners. The
initial Tauri scope open/snapshot/detach transport MUST require explicit
`LAPIS_DESKTOP_SYNC_OWNER=core`; absent or disabled selection MUST create no
Sync service or custody state. Invalid selection MUST fail closed.

Native leave admission MUST fence and drain the final account owner without
revoking its window handles or releasing custody before other native leave
checks approve. Dropping preparation after refused or cancelled leave MUST
retain the same handles, account identity and original owner. A native-only
completion proof binds the original registry/session/vault/root and permits
revocation only after a successful commit; reload and another retained session
keep the owner. The host MUST retain one native transition guard through this
sequence.

## App leave and transport detachment

LD-SYNC-001 Desktop App teardown MUST prepare its explicitly injected native
Sync service before stopping observation or entering the whole-vault writer
guard. Preparation fences new calls and drains accepted applies while retaining
the same lease and observations. Refused leave MUST release that fence so the
original App can recover; permanent disposal MUST await transport detachment
without closing native-owned durable work. The API owns this portable contract
under LN-PKG-189/193; Desktop owns its separate lifecycle caller and Tauri
resource release. A fixture transport cannot qualify the actual native boundary.

## Tauri account transport

LD-SYNC-001 native presentation admission MUST derive its profile root from the
host and its vault/root from the calling window's admitted session. Commands and
observations MUST revalidate opaque scope handles after waits. Native account
work stays in Core; transport detachment MUST revoke only presentation
authority. The host MUST await Core work outside its services lock, preserve
refused leave, and open only the currently admitted account approval URL.
Snapshot revisions and payloads MUST be bounded and contain no credentials.
Successful handle replacement MUST retain monotonic observation revisions for
the same window; refused first configuration MUST retain its admitted scope. The
bridge remains explicitly selected; registration cannot activate Sync by default
or select a custody/persistence fallback.

## Explicit local custody probe

LD-SYNC-002 local macOS custody acceptance MUST use the production adapter in
independent native processes, task-owned profile roots and isolated OS item
namespaces. Register cleanup before writing; prove missing, write, cold read,
wrong-profile isolation and cleanup without printing protected bytes. Debug
probe tooling MUST require the explicit native lane and never enter an ordinary
application bundle or expose a renderer secret command. These results MUST NOT
claim locked-Keychain, full account, hosted or release qualification.

## Native account leave integration

LD-SYNC-001 Tauri vault close MUST prepare the captured account under the shared
native transition guard, await its drain outside the services lock, and keep
that preparation until other native leave owners approve. Database, filesystem
or owner refusal MUST release the fence without revoking the Sync handle. Final
commit MUST revalidate the original profile/session/root before effects; only a
successful account commit permits scope retirement and collection. Reload MUST
retain the account owner while retiring presentation. Accepted command work MUST
outlive its response waiter; delivery MUST revalidate scope after waiting.
Account configuration and scope admission MUST use that same transition guard.

LD-SYNC-001 native Quit preparation MUST also fence/drain accounts retained
without sessions after reload, then commit only after other detached native
owners approve. A new session or foreign registry MUST invalidate preparation
before effects. Refused or partially uncertain closes MUST retain ownership for
inspection; only positively closed owners may be collected. Active sessions
remain subject to their individual close guards.

## Bounded native observation delivery

LD-SYNC-001 native observation MUST remain passive: one outstanding wait per
admitted presentation scope, bounded secret-free snapshots and monotonic safe
integer revisions. Native waits MUST have a bounded lifetime, coalesce account
updates and revalidate the original scope before delivery. Scope replacement,
detach and window destruction MUST wake retained observation waits promptly
without closing Core-owned work. A future or forged cursor MUST refuse; older
revisions MUST return current coalesced state. Stopped observations MUST NOT
restart another custody or execution provider.
