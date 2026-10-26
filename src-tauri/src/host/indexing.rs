//! Typed controls on the existing database admission; the core owns all work.
use super::state::{NativeError, NativeHost, access};
use lapis_app_protocol::indexing::IndexingValue;
use lapis_desktop::database::{IndexingRequest, MetadataOwner};
use std::io;
use tauri::{Manager, WebviewWindow};

#[tauri::command]
pub async fn vault_indexing(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    request: IndexingRequest,
) -> Result<IndexingValue, NativeError> {
    let owner = *window.app_handle().state::<MetadataOwner>();
    owner.authorize(window.label())?;
    owner.authorize_command(&request.command)?;
    let url = window.url().map_err(io::Error::other)?;
    if !super::windows::navigation::allowed(&url, cfg!(debug_assertions)) {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
        .into());
    }
    let connection = access(host.inner().clone(), move |services| {
        services
            .vaults
            .get(&request.session_id)?
            .verify_physical_root()?;
        services
            .databases
            .get(&request.session_id, &request.connection_id)
    })
    .await?;
    // Never keep the host mutex while accepted native work awaits completion.
    connection
        .indexing(request.command)
        .await
        .map_err(Into::into)
}
