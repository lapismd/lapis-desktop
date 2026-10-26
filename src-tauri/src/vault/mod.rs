pub mod admission;
pub mod editing;
pub mod resources;
pub mod services;
pub mod system_actions;
pub mod tasks;

mod profiles;
mod registry;

pub use profiles::{RecentVault, VaultDescriptor, VaultManager, validate_name};

pub(crate) fn invalid(message: &'static str) -> std::io::Error {
    std::io::Error::new(std::io::ErrorKind::InvalidInput, message)
}
