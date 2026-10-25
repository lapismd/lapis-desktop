mod connection;
mod observer;
mod registry;

pub use connection::DatabaseConnection;
pub use registry::NativeDatabases;

pub(crate) fn invalid(message: &'static str) -> std::io::Error {
    std::io::Error::new(std::io::ErrorKind::InvalidInput, message)
}
