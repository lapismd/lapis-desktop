pub(crate) mod adoption;
pub(crate) mod ai_history;
pub(crate) mod backup;
mod backup_close;
mod backup_provider;
pub(crate) mod backup_restore;
mod backup_watch;
pub(crate) mod commands;
pub(crate) mod forges;
pub(crate) mod indexed_search;
mod policy;
mod publication;
pub(crate) mod remote;
mod remote_counts;
mod remote_transfer;
pub(crate) mod search;
pub(crate) mod sources;
pub(crate) mod storage;
pub(crate) mod sync;
pub(crate) mod working_copy;
use crate::host::state::NativeHost;
use std::{io, sync::Arc};
use tauri::Manager;
use tauri_plugin_jj_store::{Config, History};
pub struct RepositoryHost {
    pub backups: backup::Backups,
    pub history: Arc<History>,
    pub working_tree: jj_store_service::working_tree::Observer,
    pub transitions: tokio::sync::Mutex<()>,
    pub remote_mutations: tokio::sync::Mutex<()>,
    pub search_slots: Arc<tokio::sync::Semaphore>,
    pub storage_slots: Arc<tokio::sync::Semaphore>,
    pub remote_slots: Arc<tokio::sync::Semaphore>,
}
pub fn initialize(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(not(feature = "e2e"))]
    let cache = app.path().app_cache_dir()?.join("jj-history");
    #[cfg(feature = "e2e")]
    let cache = std::path::PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?)
        .join("jj-history-cache");
    let history = History::new(
        policy::Policy(app.state::<NativeHost>().inner().clone()),
        cache,
        Config::default(),
    )
    .map_err(|_| io::Error::other("Repository history is unavailable"))?;
    app.plugin(tauri_plugin_jj_store::Builder::new(history.clone()).build())?;
    forges::initialize(app)?;
    if !app.manage(RepositoryHost {
        backups: backup::Backups::new({
            #[cfg(not(feature = "e2e"))]
            {
                app.path().app_data_dir()?.join("vault-history")
            }
            #[cfg(feature = "e2e")]
            {
                std::path::PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?)
                    .join("vault-history")
            }
        }),
        history,
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
