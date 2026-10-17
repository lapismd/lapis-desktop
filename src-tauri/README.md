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
admission or vault closure. It has no renderer command or AI execution grant.

Use the repository's development and acceptance commands from its root. Native
service tests use `cargo test --manifest-path src-tauri/Cargo.toml --locked`;
the actual WebView/platform lanes are separate. Full contracts and documentation
live in [`spec/src/current`](../spec/src/current/index.md) and
[`docs`](../docs).
