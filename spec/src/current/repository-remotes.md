# Repository remotes and credentials

These details implement LD-REPO-001/002/005. Desktop supplies OS and Tauri
adapters; Server-owned Core supplies selection, credential scope, native remote
operations, synchronization, publication and recovery policy. Shared History
owns settings, working-copy status, actions and log presentation.

The application MUST use fresh private connection configuration. Existing
application data, connections, automatic preferences and recovery records are
outside this release's migration scope, per the user's 2026-11-15 decision. New
connections remain manual until explicit automatic-sync opt-in.

Raw HTTPS credentials MUST use the namespaced OS credential store; private
installation metadata contains only opaque identity, label, host and username.
Stored secrets MUST NOT return to the renderer. Save, replace and forget MUST
retain account/endpoint scope, fail closed when storage is locked, and preserve
Core's pending-publication credential holds. Editing metadata cannot widen the
scope bound into the OS-held record. Existing GitHub/Forgejo flows use Desktop's
forge namespace and Core's shared provider orchestration.

Persist credentials through the shared Core contract and Desktop OS adapter.
Preserve the existing OS service and item identifiers for Repository, Forge, AI,
and Sync. Approved plugin scopes use separate OS identifiers. Plugin commands
MUST NOT accept a native service name or expose native feature credentials.
Plugin admission requires local main-window authority and an admitted vault
session. Desktop reads explicit plugin approvals from
`LAPIS_DESKTOP_CREDENTIAL_PLUGINS` at startup. The default approval set is
empty.

Native Tauri commands MUST admit the local main window and current opaque vault
session, reject caller-supplied roots/owners/storage locations, and fence
response delivery after client retirement. Accepted native commands are never
replayed after a lost response. Saving a connection performs no network
operation. Connection testing is explicit; original fetch never changes working
files or the selected History pin. Push reviews one exact target/update before
execution.

Releasing a Repository observer MUST NOT retire its owning vault client. Passive
Core working-copy status remains available to that admitted client without
capturing files; explicit History reads still require Repository admission.
Closing the vault MUST fence both passive status and History reads.

Native editing guards MUST be selected by default for remote synchronization. An
explicit renderer-only editing selection MUST disable remote transfers,
including startup scheduling, so unsaved editors cannot evade native guards. SSH
uses the executing host's agent/default identities and host-key verification;
Desktop does not upload or generate private keys.

Shared settings and the existing git split status control MUST be adopted
through public released History exports. Current GitHub authorization is read
before copying its code and opening the validated HTTPS verification page.
Copied Desktop Repository presentation and renderer synchronization policy are
retired; OS/window/transport adapters remain host-owned. Qualification keeps
injected custody, native transport, real host and publication evidence separate.

Opt-in native HTTPS acceptance MUST exercise the actual macOS application, OS
credential custody and a real disposable Git endpoint. Only generated repository
data and temporary credentials may enter its public TLS tunnel. Tests MUST NOT
alter certificate trust. Ordinary tests MUST NOT launch the external endpoint;
the standalone native inventory owns it.

Opt-in host-agent SSH acceptance MUST use generated keys and a private agent,
verify exact single-branch publication and dirty-file preservation, and refuse a
mismatched host key. Temporary loopback known-host entries MUST be removed
without overwriting concurrent host configuration. Standalone native inventory
keeps this test out of default lanes.
