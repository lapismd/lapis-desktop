//! Explicit recorded-history import through the existing serialized vault worker.
use super::{
    RepositoryHost, policy,
    remote::{failure, runtime},
    storage,
};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::{AdoptionRequest, Binding, ExistingHistory};
use serde::{Deserialize, Serialize};
use tauri::{State, WebviewWindow};
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    action: Action,
}
#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
enum Action {
    Status,
    Adopt { request: AdoptionRequest },
    Stop { request_id: String },
}
#[derive(Serialize)]
pub struct AdoptionStatus {
    source: Option<ExistingHistory>,
    source_unavailable: bool,
    pending: Option<AdoptionRequest>,
}
async fn status(
    repository: &RepositoryHost,
    binding: Binding,
) -> Result<AdoptionStatus, NativeError> {
    storage::worker(repository, move || {
        runtime()?.block_on(async {
            let source = binding.existing_history().await;
            Ok(AdoptionStatus {
                source_unavailable: source.is_err(),
                source: source.ok().flatten(),
                pending: if binding.state.join("vault.json").is_file() {
                    binding.pending_adoption().map_err(std::io::Error::other)?
                } else {
                    None
                },
            })
        })
    })
    .await
}
#[tauri::command]
pub async fn desktop_backup_adoption(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<AdoptionStatus, NativeError> {
    let caller = policy::caller(&window).map_err(failure)?;
    let _transition = repository.transitions.lock().await;
    let session = request.session_id.clone();
    let descriptor = access(host.inner().clone(), move |services| {
        services.vaults.get(&session)?.verify_physical_root()?;
        Ok(services.vaults.descriptor(&session)?.clone())
    })
    .await?;
    let binding = storage::resolve(&repository, descriptor, false).await?;
    if matches!(request.action, Action::Status) {
        return status(&repository, binding).await;
    }
    let _mutation = repository.remote_mutations.lock().await;
    {
        // Paused capture is not silently enabled by an import. The UI offers
        // automatic-history enablement before this explicit native operation.
        let owner = repository
            .backups
            .owner(&request.session_id, &caller.window)
            .await?;
        match request.action {
            Action::Adopt { request } => {
                owner.backup.adopt_history(request).await.map_err(failure)?;
            }
            Action::Stop { request_id } => {
                owner
                    .backup
                    .stop_adoption(request_id)
                    .await
                    .map_err(failure)?;
            }
            Action::Status => unreachable!(),
        }
    }
    status(&repository, binding).await
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn adoption_frames_reject_renderer_paths_and_source_authority() {
        let valid = serde_json::json!({"sessionId":"opaque","action":{"kind":"adopt","request":{"request_id":"original","source":{"operation":"ab".repeat(64),"commit":"cd".repeat(20)}}}});
        assert!(serde_json::from_value::<Request>(valid.clone()).is_ok());
        for key in ["root", "metadata", "state", "token", "window", "generation"] {
            for depth in 0..4 {
                let mut frame = valid.clone();
                let target = match depth {
                    0 => &mut frame,
                    1 => &mut frame["action"],
                    2 => &mut frame["action"]["request"],
                    _ => &mut frame["action"]["request"]["source"],
                };
                target[key] = serde_json::json!("outside");
                assert!(serde_json::from_value::<Request>(frame).is_err());
            }
        }
    }
}
