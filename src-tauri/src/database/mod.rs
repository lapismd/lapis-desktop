mod connection;
mod registry;
mod sql_guard;
mod wire;

pub use connection::NativeDatabase;
pub use registry::NativeDatabases;
pub use wire::{DbReply, DbRequest, RunResult, SqlArgs, SqlStatement, SqlValue};

pub(crate) fn invalid(message: &'static str) -> std::io::Error {
    std::io::Error::new(std::io::ErrorKind::InvalidInput, message)
}

pub(crate) fn engine_error(error: turso::Error) -> std::io::Error {
    std::io::Error::other(error.to_string())
}
