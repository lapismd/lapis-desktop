use crate::host::state::{NativeError, NativeHost, access};
use lapis_app_protocol::database::{
    call::{DatabaseCall, DatabaseValue},
    changes::ChangeSet,
};
use serde::Serialize;
use tauri::ipc::JavaScriptChannelId;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionAdmission {
    connection_id: String,
}

#[tauri::command]
pub async fn vault_db_open(
    webview: tauri::Webview,
    host: tauri::State<'_, NativeHost>,
    repository: tauri::State<'_, crate::host::repository::RepositoryHost>,
    session_id: String,
    on_change: Option<JavaScriptChannelId>,
) -> Result<ConnectionAdmission, NativeError> {
    let on_change = on_change.map(|id| id.channel_on::<_, ChangeSet>(webview));
    let _transition = repository.transitions.lock().await;
    let session = session_id.clone();
    let (connection_id, connection) = access(host.inner().clone(), move |services| {
        let client = services.core_vaults.client(&services.vaults, &session)?;
        services.databases.open(&session, client)
    })
    .await?;
    match connection.subscribe().await {
        Ok(changes) => {
            if let Some(channel) = on_change {
                connection
                    .observe(changes, move |change| channel.send(change).is_ok())
                    .await?;
            }
            Ok(ConnectionAdmission { connection_id })
        }
        Err(error) => {
            connection.close().await;
            access(host.inner().clone(), move |services| {
                services.databases.remove(&session_id, &connection_id)
            })
            .await?;
            Err(error.into())
        }
    }
}

#[tauri::command]
pub async fn vault_db_call(
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    connection_id: String,
    request: DatabaseCall,
) -> Result<DatabaseValue, NativeError> {
    let connection = access(host.inner().clone(), move |services| {
        services.vaults.get(&session_id)?.verify_physical_root()?;
        services.databases.get(&session_id, &connection_id)
    })
    .await?;
    connection.call(request).await.map_err(Into::into)
}

#[tauri::command]
pub async fn vault_db_close(
    host: tauri::State<'_, NativeHost>,
    repository: tauri::State<'_, crate::host::repository::RepositoryHost>,
    session_id: String,
    connection_id: String,
) -> Result<(), NativeError> {
    let _transition = repository.transitions.lock().await;
    let session = session_id.clone();
    let id = connection_id.clone();
    let connection = access(host.inner().clone(), move |services| {
        services.vaults.get(&session)?;
        services.databases.get(&session, &id)
    })
    .await?;
    connection.close().await;
    access(host.inner().clone(), move |services| {
        services.databases.remove(&session_id, &connection_id)
    })
    .await
}
