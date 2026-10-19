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

/// A display projection; the renderer cannot feed this path back as authority.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageView {
    #[serde(flatten)]
    pub status: jj_vault::StorageStatus,
    pub repository_path: String,
    pub can_reveal: bool,
}
pub fn view(storage: &Storage) -> io::Result<StorageView> {
    let status = storage.status().map_err(failure)?;
    let path = storage.binding().map_err(failure)?.metadata();
    let can_reveal = status.pending.is_none() && verified_directory(&path).is_ok();
    Ok(StorageView {
        status,
        repository_path: path
            .into_os_string()
            .into_string()
            .map_err(|_| io::Error::other("Repository path is not UTF-8"))?,
        can_reveal,
    })
}
pub fn reveal_path(storage: &Storage, revision: u64) -> io::Result<PathBuf> {
    let status = storage.status().map_err(failure)?;
    if status.revision != revision || status.pending.is_some() {
        return Err(io::Error::other(
            "History storage changed; refresh before revealing it",
        ));
    }
    let path = storage.binding().map_err(failure)?.metadata();
    verified_directory(&path)?;
    Ok(path)
}
fn verified_directory(path: &std::path::Path) -> io::Result<()> {
    let metadata = std::fs::symlink_metadata(path)?;
    if !metadata.is_dir() || metadata.is_symlink() || std::fs::canonicalize(path)? != path {
        return Err(io::Error::other(
            "Repository directory is unavailable or redirected",
        ));
    }
    Ok(())
}
