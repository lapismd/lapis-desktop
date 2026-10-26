//! Typed intent controls and snapshots on the existing admitted vault client.
use crate::host::state::{NativeError, NativeHost, access};
use lapis_app_protocol::{
    ErrorCode, TextSnapshot,
    editing_intents::{EditingIntentCommand, EditingIntentValue},
};
use lapis_desktop::vault::editing::EditingOwner;
use std::io;
use tauri::{Manager, WebviewWindow};

fn authorize(window: &WebviewWindow) -> Result<(), NativeError> {
    window
        .app_handle()
        .state::<EditingOwner>()
        .authorize(window.label())?;
    let url = window.url().map_err(io::Error::other)?;
    if !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions)) {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
        .into());
    }
    Ok(())
}

#[tauri::command]
pub async fn vault_editing_intents(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    command: EditingIntentCommand,
) -> Result<EditingIntentValue, NativeError> {
    authorize(&window)?;
    access(host.inner().clone(), move |services| {
        services
            .core_vaults
            .client(&services.vaults, &session_id)?
            .editing_intents(command)
            .map_err(io::Error::other)
    })
    .await
}

#[tauri::command]
pub async fn vault_editing_snapshot(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    path: String,
) -> Result<Option<TextSnapshot>, NativeError> {
    authorize(&window)?;
    access(host.inner().clone(), move |services| {
        let client = services.core_vaults.client(&services.vaults, &session_id)?;
        match client.read_text(&path) {
            Ok(snapshot) => Ok(Some(snapshot)),
            Err(error) if error.code() == ErrorCode::NotFound => Ok(None),
            Err(error) => Err(io::Error::other(error)),
        }
    })
    .await
}
