//! Core owns source witnesses and read tokens; Tauri supplies caller/session.
use super::{RepositoryHost, policy, reader};
use crate::host::state::{NativeHost, access};
use lapis_app_core::services::HistoryError;
use lapis_app_protocol::repository_sources::{RepositorySources, RepositorySourcesCommand};
use serde::Deserialize;
use tauri::{State, WebviewWindow};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    #[serde(default)]
    open_original: bool,
}

#[tauri::command]
pub async fn desktop_repository_sources(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<RepositorySources, reader::Failure> {
    let caller = policy::caller(&window).map_err(|_| HistoryError::Denied)?;
    let _transition = repository.transitions.lock().await;
    if request.open_original {
        let lease = reader::admit(
            &repository,
            host.inner().clone(),
            &caller.window,
            &request.session_id,
        )
        .await?;
        let result = lease
            .client()
            .repository_sources(RepositorySourcesCommand::OpenOriginal {})
            .await?;
        reader::verify(host.inner().clone(), request.session_id).await?;
        repository.readers.check(&lease)?;
        policy::caller(&window).map_err(|_| HistoryError::Denied)?;
        return Ok(result);
    }
    let session = request.session_id.clone();
    let client = access(host.inner().clone(), move |services| {
        services.core_vaults.client(&services.vaults, &session)
    })
    .await
    .map_err(|_| HistoryError::Denied)?;
    let result = client
        .repository_sources(RepositorySourcesCommand::Discover {})
        .await?;
    reader::verify(host.inner().clone(), request.session_id).await?;
    policy::caller(&window).map_err(|_| HistoryError::Denied)?;
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn source_frames_cannot_select_paths_or_supply_read_tokens() {
        let frame = serde_json::json!({"sessionId":"opaque", "openOriginal":true});
        assert!(serde_json::from_value::<Request>(frame.clone()).is_ok());
        for key in [
            "root",
            "metadata",
            "source",
            "token",
            "window",
            "generation",
        ] {
            let mut invalid = frame.clone();
            invalid[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(invalid).is_err());
        }
    }
}
