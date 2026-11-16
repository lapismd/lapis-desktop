//! Local caller/session admission; accepted work and publication stay in Core.
use super::policy;
use crate::host::state::{NativeError, NativeHost, access};
use lapis_app_protocol::{
    repository_backup::{RepositoryBackupCommand, RepositoryBackupSnapshot},
    repository_remotes::{RepositoryRemotesCommand, RepositoryRemotesSnapshot},
    repository_sync::{RepositorySyncCommand, RepositorySyncSnapshot},
};
use serde::Deserialize;
use std::{io, sync::Arc};
use tauri::{State, WebviewWindow};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    command: Option<RepositoryRemotesCommand>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SyncRequest {
    session_id: String,
    command: Option<RepositorySyncCommand>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BackupRequest {
    session_id: String,
    command: RepositoryBackupCommand,
}

pub(super) async fn client(
    window: &WebviewWindow,
    host: NativeHost,
    session: String,
) -> Result<Arc<lapis_app_core::services::Client>, NativeError> {
    policy::caller(window).map_err(|_| {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
    })?;
    access(host, move |services| {
        services.core_vaults.client(&services.vaults, &session)
    })
    .await
}
#[tauri::command]
pub async fn desktop_repository_remotes(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    request: Request,
) -> Result<RepositoryRemotesSnapshot, NativeError> {
    let client = client(&window, host.inner().clone(), request.session_id.clone()).await?;
    let result = match request.command {
        Some(command) => client.control_repository_remotes(command).await,
        None => client.repository_remote_settings().await,
    }
    .map_err(io::Error::other)?;
    verify(host.inner().clone(), request.session_id, client).await?;
    policy::caller(&window).map_err(|_| {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
    })?;
    Ok(result)
}
#[tauri::command]
pub async fn desktop_repository_synchronization(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    request: SyncRequest,
) -> Result<RepositorySyncSnapshot, NativeError> {
    let client = client(&window, host.inner().clone(), request.session_id.clone()).await?;
    let result = match request.command {
        Some(command) => client.control_repository_synchronization(command).await,
        None => client.repository_synchronization(),
    }
    .map_err(io::Error::other)?;
    verify(host.inner().clone(), request.session_id, client).await?;
    policy::caller(&window).map_err(|_| {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
    })?;
    Ok(result)
}
#[tauri::command]
pub async fn desktop_repository_backup(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    request: BackupRequest,
) -> Result<RepositoryBackupSnapshot, NativeError> {
    let client = client(&window, host.inner().clone(), request.session_id.clone()).await?;
    let result = client
        .control_repository_backup(request.command)
        .await
        .map_err(io::Error::other)?;
    verify(host.inner().clone(), request.session_id, client).await?;
    policy::caller(&window).map_err(|_| {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
    })?;
    Ok(result)
}
pub(super) async fn verify(
    host: NativeHost,
    session: String,
    client: Arc<lapis_app_core::services::Client>,
) -> Result<(), NativeError> {
    access(host, move |services| {
        services
            .core_vaults
            .verify_client(&services.vaults, &session, &client)
    })
    .await
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn requests_cannot_select_host_storage_or_identity() {
        for key in [
            "path",
            "root",
            "owner",
            "credentials",
            "window",
            "generation",
        ] {
            let mut frame = serde_json::json!({"sessionId":"opaque", "command":null});
            frame[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(frame.clone()).is_err());
            assert!(serde_json::from_value::<SyncRequest>(frame).is_err());
        }
    }
}
