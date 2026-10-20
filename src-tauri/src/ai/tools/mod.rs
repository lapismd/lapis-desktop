//! Authenticated application-tool transport. The host retains policy and effects.
mod binding;
mod binding_transport;
mod client;
mod events;
mod files;
mod framing;
mod http;
mod http_listener;
mod listener;
mod protocol;
mod registry;
mod state;

pub use binding::{Authorize, Binding, EventSink, Limits};
pub use client::{Client, stdio};
pub use protocol::{Event, Outcome, ToolSpec};
pub use registry::{Owner, Registry};

use std::io;
fn unavailable() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Application tools are unavailable",
    )
}
fn unknown() -> io::Error {
    io::Error::other("Application tool outcome is unknown; do not replay automatically")
}
