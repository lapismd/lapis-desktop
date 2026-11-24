use crate::host::state::{NativeError, NativeHost, access};
use lapis_app_protocol::background_jobs::{JobCommand, JobSnapshot};
use lapis_desktop::database::MetadataOwner;
use std::io;
use tauri::{Manager, WebviewWindow};

#[tauri::command]
pub async fn vault_background_jobs(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    command: JobCommand,
) -> Result<JobSnapshot, NativeError> {
    window
        .app_handle()
        .state::<MetadataOwner>()
        .authorize(window.label())?;
    let url = window.url().map_err(io::Error::other)?;
    if !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions)) {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
        .into());
    }
    let session = session_id.clone();
    let client = access(host.inner().clone(), move |services| {
        services.core_vaults.client(&services.vaults, &session)
    })
    .await?;
    let caller = client.clone();
    let snapshot = tauri::async_runtime::spawn_blocking(move || {
        caller.plugin_jobs(command).map_err(io::Error::other)
    })
    .await
    .map_err(io::Error::other)??;
    access(host.inner().clone(), move |services| {
        services
            .core_vaults
            .verify_client(&services.vaults, &session_id, &client)
    })
    .await?;
    Ok(snapshot)
}
