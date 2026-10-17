# Shared native vault admission

`src-tauri/src/vault/admission.rs` owns physical-vault and window transitions
for native services. Each service constructs its own `VaultAdmissions` registry.
An AI admission cannot activate a history service, and revoking one registry
cannot revoke another. The initial consumer remains the existing AI host;
repository transport integration has its own qualification gate.

The native host supplies an already admitted `VaultManager`, the actual window
identity and a live vault token. Renderer payloads never choose a root,
admission generation or executable. The transport adapter still validates the
actual caller origin; the registry does not replace that check.

Call `prepare` to create a ticket and fence ordinary authorization. If the plan
does not preserve the existing service scope, await its owned worker cleanup
before `complete`. Completion rechecks the ticket, physical root and closing
fence. A stale or changed source cannot publish a late active admission.

Use `authorize` for current access. Returned `VaultLease` values are
observations of a native scope, not independently reusable capabilities. Session
and profile getters identify the owning vault for another native adapter; every
operation still reauthorizes against its own live registry.

Reload uses `leave(window, true)` to suspend renderer access while retaining the
service generation for verified re-admission to the same physical vault. A full
leave removes admission. Vault closure retains exact cleanup targets across
retries; the host must finish service cleanup before releasing the folder.
Existing AI suspended-reload and worker-retirement behavior is unchanged.

Rust admission tests cover independent registries, pending/stale tickets,
physical replacement, reload, bounds and closure retries. The actual hidden
WebView lane checks native caller frames and cold reset separately. This module
adds no new IPC grant or prompt/persistence behavior.
