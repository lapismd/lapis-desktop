//! Vault-owned layout resolution shared by capture and immutable readers.
use crate::vault::VaultDescriptor;
use jj_vault::{Binding, Storage};
use std::{io, path::PathBuf};

#[derive(Clone)]
pub struct Locations {
    root: PathBuf,
}
impl Locations {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }
    pub fn storage(&self, vault: &VaultDescriptor) -> Storage {
        Storage::new(
            Binding {
                vault_id: vault.profile_id.clone(),
                root: PathBuf::from(&vault.path),
                state: self.root.join(&vault.profile_id),
            },
            self.root.join(".layouts").join(&vault.profile_id),
        )
    }
    /// Immutable discovery must never initialize or recover a writer.
    pub fn binding(&self, vault: &VaultDescriptor) -> io::Result<Binding> {
        let storage = self.storage(vault);
        if storage.status().map_err(failure)?.pending.is_some() {
            return Err(io::Error::other(
                "Finish the pending history storage move before opening repository history",
            ));
        }
        storage.binding().map_err(failure)
    }
    /// Run on a native worker before admitting a new capture owner.
    pub async fn recover(&self, vault: &VaultDescriptor) -> io::Result<Binding> {
        self.storage(vault).recover().await.map_err(failure)?;
        self.binding(vault)
    }
}
fn failure(error: impl std::fmt::Display) -> io::Error {
    io::Error::other(format!("History storage: {error}"))
}
