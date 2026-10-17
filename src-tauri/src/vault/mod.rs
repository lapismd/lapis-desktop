pub mod admission;
pub mod resources;
pub mod system_actions;

mod action_targets;
mod conditional;
mod creates;
mod files;
mod mutations;
mod profiles;
pub(crate) mod staged;
mod writes;

pub use action_targets::ActionTarget;
pub use conditional::TextWriteConflict;
pub use files::{FileStat, ListedFiles, VaultRoot};
pub use profiles::{RecentVault, VaultDescriptor, VaultManager, validate_name};
pub use writes::WriteOptions;

pub const MAX_FILE_BYTES: u64 = 64 * 1024 * 1024;
pub const MAX_RANGE_BYTES: usize = 256 * 1024;

pub(crate) fn invalid(message: &'static str) -> std::io::Error {
    std::io::Error::new(std::io::ErrorKind::InvalidInput, message)
}
