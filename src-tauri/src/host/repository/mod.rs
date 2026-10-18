pub(crate) mod commands;
mod policy;
pub(crate) mod working_copy;
use crate::host::state::NativeHost;
use std::{io, sync::Arc};
use tauri::Manager;
use tauri_plugin_jj_store::{Config, History};
pub struct RepositoryHost {
    pub history: Arc<History>,
    pub working_tree: jj_store_service::working_tree::Observer,
    pub transitions: tokio::sync::Mutex<()>,
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
    if !app.manage(RepositoryHost {
        history,
        working_tree: jj_store_service::working_tree::Observer::new(
            tauri_plugin_jj_store::local::Executor::new(1)
                .map_err(|_| io::Error::other("Working copy reader unavailable"))?,
            1,
        )
        .map_err(|_| io::Error::other("Working copy reader unavailable"))?,
        transitions: tokio::sync::Mutex::new(()),
    }) {
        return Err(io::Error::other("Repository history is already initialized").into());
    }
    Ok(())
}
