use crate::host::state::{NativeError, NativeHost, access};
use lapis_desktop::database::{DbReply, DbRequest};
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionAdmission {
    connection_id: String,
}

#[tauri::command]
pub async fn vault_db_open(
    host: tauri::State<'_, NativeHost>,
    repository: tauri::State<'_, crate::host::repository::RepositoryHost>,
    session_id: String,
) -> Result<ConnectionAdmission, NativeError> {
    let _transition = repository.transitions.lock().await;
    access(host.inner().clone(), move |services| {
        let profile_id = services.vaults.descriptor(&session_id)?.profile_id.clone();
        let connection_id =
            tauri::async_runtime::block_on(services.databases.open(session_id, profile_id))?;
        Ok(ConnectionAdmission { connection_id })
    })
    .await
}

#[tauri::command]
pub async fn vault_db_execute(
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    connection_id: String,
    request: DbRequest,
) -> Result<DbReply, NativeError> {
    access(host.inner().clone(), move |services| {
        services.vaults.get(&session_id)?;
        tauri::async_runtime::block_on(services.databases.execute(
            &session_id,
            &connection_id,
            request,
        ))
    })
    .await
}

#[tauri::command]
pub async fn vault_db_close(
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    connection_id: String,
) -> Result<(), NativeError> {
    access(host.inner().clone(), move |services| {
        services.vaults.get(&session_id)?;
        tauri::async_runtime::block_on(services.databases.close(&session_id, &connection_id))
    })
    .await
}
