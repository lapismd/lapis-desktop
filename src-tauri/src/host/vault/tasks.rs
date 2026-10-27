//! Typed Task calls use the same admitted client as App editing and metadata.
use crate::host::state::{NativeError, NativeHost, access};
use lapis_app_protocol::native_tasks::{NativeTaskCommand, NativeTaskValue};
use lapis_desktop::vault::tasks::TasksOwner;
use std::io;
use tauri::{Manager, WebviewWindow};

#[tauri::command]
pub async fn vault_tasks(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    command: NativeTaskCommand,
) -> Result<NativeTaskValue, NativeError> {
    window
        .app_handle()
        .state::<TasksOwner>()
        .authorize(window.label())?;
    let url = window.url().map_err(io::Error::other)?;
    if !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions)) {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
        .into());
    }
    let client = access(host.inner().clone(), move |services| {
        services.core_vaults.client(&services.vaults, &session_id)
    })
    .await?;
    // Core retains accepted work independently of this IPC response. Never hold
    // NativeHost's lock while the existing journal and indexed writer execute.
    client
        .control_tasks(command)
        .await
        .map_err(io::Error::other)
        .map_err(Into::into)
}
