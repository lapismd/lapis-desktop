pub(crate) mod adoption;
pub(crate) mod ai_history;
pub(crate) mod backup;
mod backup_access;
mod backup_client;
mod backup_close;
pub(crate) mod backup_restore;
pub(crate) mod commands;
mod history_owner;
pub(crate) mod indexed_search;
mod policy;
pub(crate) mod reader;
pub(crate) mod remotes;
pub(crate) mod search;
pub(crate) mod sources;
pub(crate) mod storage;
pub(crate) mod working_copy;
use std::{io, sync::Arc};
use tauri::Manager;
pub struct RepositoryHost {
    pub backups: backup::Backups,
    pub readers: Arc<lapis_desktop::repository::readers::Readers>,
    pub transitions: tokio::sync::Mutex<()>,
    pub remote_mutations: tokio::sync::Mutex<()>,
    pub search_slots: Arc<tokio::sync::Semaphore>,
    pub storage_slots: Arc<tokio::sync::Semaphore>,
}
pub fn initialize(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    if !app.manage(RepositoryHost {
        backups: backup::Backups::new(crate::host::state::history_root(app)?),
        readers: Arc::new(Default::default()),
        transitions: tokio::sync::Mutex::new(()),
        remote_mutations: tokio::sync::Mutex::new(()),
        search_slots: Arc::new(tokio::sync::Semaphore::new(1)),
        storage_slots: Arc::new(tokio::sync::Semaphore::new(1)),
    }) {
        return Err(io::Error::other("Repository history is already initialized").into());
    }
    Ok(())
}
