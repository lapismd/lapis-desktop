# Lapis Sync native integration

This chapter owns current Desktop intake and OS adapters. The
[full Sync backlog](../backlog/lapis-sync.md) retains enrollment, transfer,
reconciliation, scheduling, recovery and end-to-end acceptance. Sync remains
optional and disabled; no plugin inventory or installed application changes.

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
`5d3d463b57221e6e0be46618c0ec00db3c1938e6`; its source receipt records real
HTTP, cold native-process and uncertain-outcome tests separately from OS
custody. Desktop pins the same reachable Git source for all three shared crates
and aligns JJ Store `87be3ad68530653c6c6fd1e5a2463a217cf3f044` across direct and
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
unknown operations. The native host supplies account time and device label;
these source actions remain unregistered until the Tauri adapter is qualified.

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
