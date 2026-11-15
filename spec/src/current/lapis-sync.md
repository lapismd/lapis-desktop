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

## Account custody and source intake

The native account coordinator is owned by Server Core
`907e647283a0e3981a2c5aa31e43cde9a92732f1`; its source receipt records real
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
