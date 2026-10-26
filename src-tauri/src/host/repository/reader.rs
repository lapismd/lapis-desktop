//! Main-local lossless History frames and dedicated Core client lifetime.
use super::{RepositoryHost, policy};
use crate::host::state::{NativeHost, access};
use lapis_app_core::services::{HistoryError, HistoryMethod};
use lapis_desktop::repository::readers::ReaderLease;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{State, WebviewWindow};

#[derive(Serialize)]
pub struct Failure {
    code: &'static str,
    message: String,
    history: HistoryError,
}
impl From<HistoryError> for Failure {
    fn from(history: HistoryError) -> Self {
        use HistoryError::*;
        let code = match &history {
            Denied => "EACCES",
            Invalid | InvalidQuery(_) | Range | Limit => "EINVAL",
            NotFound => "ENOENT",
            Canceled | BlameReset | EpochChanged | Busy | IndexBudget | IndexRebuildRequired => {
                "EBUSY"
            }
            _ => "EIO",
        };
        Self {
            code,
            message: history.to_string(),
            history,
        }
    }
}

pub(super) async fn retire(
    repository: &RepositoryHost,
    lease: Arc<ReaderLease>,
) -> Result<(), HistoryError> {
    repository.readers.fence(&lease);
    let readers = repository.readers.clone();
    tauri::async_runtime::spawn_blocking(move || readers.retire(&lease))
        .await
        .map_err(|_| HistoryError::Unavailable)?
}

/// The caller holds repository.transitions throughout replacement/retirement.
pub(super) async fn admit(
    repository: &RepositoryHost,
    host: NativeHost,
    window: &str,
    session: &str,
) -> Result<Arc<ReaderLease>, HistoryError> {
    let selected = session.to_owned();
    let service = access(host, move |services| {
        services.core_vaults.service(&services.vaults, &selected)
    })
    .await
    .map_err(|_| HistoryError::Denied)?;
    if let Some(previous) = repository.readers.current(window)?
        && (previous.session() != session || repository.readers.check(&previous).is_err())
    {
        retire(repository, previous).await?;
    }
    repository.readers.attach(window, session, &service)
}

pub(super) async fn verify(host: NativeHost, session: String) -> Result<(), HistoryError> {
    access(host, move |services| {
        services.vaults.get(&session)?.verify_physical_root()
    })
    .await
    .map_err(|_| HistoryError::Denied)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    method: String,
    frame: String,
}

#[tauri::command]
pub async fn desktop_repository_read(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<String, Failure> {
    let caller = policy::caller(&window).map_err(|_| HistoryError::Denied)?;
    let method: HistoryMethod = request.method.parse()?;
    verify(host.inner().clone(), request.session_id.clone()).await?;
    let lease = repository
        .readers
        .require(&caller.window, &request.session_id)?;
    let result = lease.client().read_history(method, request.frame).await?;
    verify(host.inner().clone(), request.session_id).await?;
    repository.readers.check(&lease)?;
    policy::caller(&window).map_err(|_| HistoryError::Denied)?;
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn read_envelope_carries_no_filesystem_or_caller_authority() {
        let frame =
            serde_json::json!({"sessionId":"opaque","method":"heads","frame":"lossless text"});
        assert!(serde_json::from_value::<Request>(frame.clone()).is_ok());
        for key in [
            "root",
            "path",
            "metadata",
            "token",
            "window",
            "generation",
            "cache",
        ] {
            let mut invalid = frame.clone();
            invalid[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(invalid).is_err());
        }
    }
    #[test]
    fn query_diagnostics_survive_the_native_error_boundary() {
        let failure = Failure::from(HistoryError::EpochChanged);
        let value = serde_json::to_value(failure).unwrap();
        assert_eq!(value["code"], "EBUSY");
        assert_eq!(
            value["history"],
            serde_json::to_value(HistoryError::EpochChanged).unwrap()
        );
        assert!(!value["message"].as_str().unwrap().is_empty());
    }
}
