# Lapis Notes native host

Rust services and the Tauri adapter for Lapis Notes Preview. The library owns
admitted vault IO, database connections, file watching, service admission and
leave coordination. The binary's `host` modules bind those services to native
windows, menus, permissions and scoped plugin transports.

Native services take explicit vault/session authority. The shared
`vault::admission::VaultAdmissions` registry supplies physical-root checks and
two-phase window transitions; each consuming service owns a separate instance. A
successful discovery or stored identity grants no live service authority.
`repository::RepositoryAdmissions` additionally pins existing JJ/Git source
identity and native generations; hosts drain readers before completing new
admission or vault closure. The binary now connects it to a private history
cache and the read-only JJ Tauri plugin through exact admit/release commands. It
grants no AI execution.

`ai::capture::ManagedCapture` adapts an injected
`jj_store_conversations::capture::NativeCapture` to the shared native runtime.
The host supplies admitted privacy and a durable receipt sink. Every safe frame
in a batch is retained for ordered delivery; unknown or mismatched receipts stop
processing without fallback. This adapter alone does not select a Notes backend
or enable execution. The debug acceptance profile uses synthetic policy and
private fixture records, separately from production privacy/JJ adoption.

Use the repository's development and acceptance commands from its root. Native
service tests use `cargo test --manifest-path src-tauri/Cargo.toml --locked`;
the actual WebView/platform lanes are separate. Full contracts and documentation
live in [`spec/src/current`](../spec/src/current/index.md) and
[`docs`](../docs).

`ManagedCapture::with_native_privacy` selects the shared optional native policy
with host-admitted roots/credentials and an injected sink. Ordinary policy
rejects missing backend selection and stale admission; it grants no targets. The
debug-only real-scanner profile uses an owned temporary cache and private
fixture candidates. Production JJ publication and restart remain separate gates.

`ai::journal::ProfileJournal` supplies the private durable journal for shared
selected-store capture. Construct it from an admitted profile `Dir`, exact
capture/provider context and current native admission callback, then inject it
into `StoreCapture`. It retains an exclusive lease and checked atomic records.
See the [journal guide](../docs/native-conversation-journal.md) for ownership,
recovery and the remaining Notes integration gates.

`ai::backend::BackendProfiles` retains the admitted physical vault's explicit
writer choice and original selection receipts. An opened `BackendScope` pins
that choice; hold a `BackendCall` through each admitted operation, then drain
and drop the owner before changing writers. The native host still supplies
admission and connects its runtime/persistence adapters. See the
[backend guide](../docs/native-backend-profiles.md).

The `desktop_ai_backends` command exposes bounded, versioned text frames for
current-vault selection, receipt recovery and retained owner handles. Native
admission, worker revocation and vault closure share its transition owner. See
the [backend guide](../docs/native-backend-profiles.md) for transport and reload
semantics; renderer persistence and managed capture remain separate adapters.
