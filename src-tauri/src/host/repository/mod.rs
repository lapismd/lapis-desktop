pub(crate) mod adoption;
pub(crate) mod ai_history;
pub(crate) mod backup;
mod backup_client;
mod backup_close;
pub(crate) mod backup_restore;
pub(crate) mod commands;
pub(crate) mod forges;
mod history_owner;
pub(crate) mod indexed_search;
mod policy;
mod publication;
pub(crate) mod reader;
pub(crate) mod remote;
mod remote_counts;
mod remote_transfer;
pub(crate) mod search;
pub(crate) mod sources;
pub(crate) mod storage;
pub(crate) mod sync;
pub(crate) mod working_copy;
use std::{io, sync::Arc};
use tauri::Manager;
pub struct RepositoryHost {
    pub backups: backup::Backups,
    pub readers: Arc<lapis_desktop::repository::readers::Readers>,
    pub working_tree: jj_store_service::working_tree::Observer,
    pub transitions: tokio::sync::Mutex<()>,
    pub remote_mutations: tokio::sync::Mutex<()>,
    pub search_slots: Arc<tokio::sync::Semaphore>,
    pub storage_slots: Arc<tokio::sync::Semaphore>,
    pub remote_slots: Arc<tokio::sync::Semaphore>,
}
pub fn initialize(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    forges::initialize(app)?;
    if !app.manage(RepositoryHost {
        backups: backup::Backups::new(crate::host::state::history_root(app)?),
        readers: Arc::new(Default::default()),
        working_tree: jj_store_service::working_tree::Observer::new(
            tauri_plugin_jj_store::local::Executor::new(1)
                .map_err(|_| io::Error::other("Working copy reader unavailable"))?,
            1,
        )
        .map_err(|_| io::Error::other("Working copy reader unavailable"))?,
        transitions: tokio::sync::Mutex::new(()),
        remote_mutations: tokio::sync::Mutex::new(()),
        search_slots: Arc::new(tokio::sync::Semaphore::new(1)),
        storage_slots: Arc::new(tokio::sync::Semaphore::new(1)),
        remote_slots: Arc::new(tokio::sync::Semaphore::new(2)),
    }) {
        return Err(io::Error::other("Repository history is already initialized").into());
    }
    Ok(())
}
