use crate::host::state::{NativeError, NativeHost, access};
use lapis_desktop::watch::WatchBatch;
use tauri::ipc::Channel;

#[tauri::command]
pub async fn vault_watch_start(
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    path: String,
    recursive: bool,
    on_change: Channel<WatchBatch>,
) -> Result<String, NativeError> {
    access(host.inner().clone(), move |services| {
        let root = services.vaults.get(&session_id)?;
        services.watches.start(
            &session_id,
            root,
            &path,
            recursive,
            services.fs_gate.clone(),
            move |batch| on_change.send(batch).is_ok(),
        )
    })
    .await
}

#[tauri::command]
pub async fn vault_watch_stop(
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    watch_id: String,
) -> Result<(), NativeError> {
    access(host.inner().clone(), move |services| {
        services.vaults.get(&session_id)?;
        services.watches.close(&session_id, &watch_id)
    })
    .await
}
