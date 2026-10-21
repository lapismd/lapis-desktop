//! AI history uses the already admitted backup owner, never renderer paths.
use super::{RepositoryHost, backup::error, policy};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::{AiHistoryRequest, AiHistoryResponse};
use serde::Deserialize;
use tauri::{State, WebviewWindow};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    action: AiHistoryRequest,
}
#[tauri::command]
pub async fn desktop_ai_history(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<AiHistoryResponse, NativeError> {
    let caller = policy::caller(&window).map_err(error)?;
    let session = request.session_id.clone();
    access(host.inner().clone(), move |state| {
        state.vaults.get(&session).map(|_| ())
    })
    .await?;
    let owner = repository
        .backups
        .owner(&request.session_id, &caller.window)
        .await?;
    owner.backup.ai_history(request.action).await.map_err(error)
}
