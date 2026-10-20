//! Native layout changes are separate from immutable repository admission.
use super::{
    RepositoryHost, policy,
    remote::{failure, runtime},
};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::{Binding, StorageLocation};
use lapis_desktop::repository::storage::{self as presentation, StorageView};
use lapis_desktop::vault::VaultDescriptor;
use serde::Deserialize;
use tauri::Manager;
use tauri::{State, WebviewWindow};
use tauri_plugin_lapis_ai::AiExt;
use tauri_plugin_opener::OpenerExt;

// Local layout discovery and capture startup never queue behind networking.
pub(super) async fn worker<T: Send + 'static>(
    repository: &RepositoryHost,
    action: impl FnOnce() -> std::io::Result<T> + Send + 'static,
) -> Result<T, NativeError> {
    let permit = repository
        .storage_slots
        .clone()
        .acquire_owned()
        .await
        .map_err(|_| failure("History storage is closed"))?;
    tauri::async_runtime::spawn_blocking(move || {
        let _permit = permit;
        action()
    })
    .await
    .map_err(|_| failure("History storage worker stopped"))?
    .map_err(Into::into)
}

pub(super) async fn resolve(
    repository: &RepositoryHost,
    descriptor: VaultDescriptor,
    recover: bool,
) -> Result<Binding, NativeError> {
    let locations = repository.backups.locations.clone();
    worker(repository, move || {
        if recover {
            runtime()?.block_on(locations.recover(&descriptor))
        } else {
            locations.binding(&descriptor)
        }
    })
    .await
}

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
    Reveal {
        revision: u64,
    },
    Change {
        revision: u64,
        location: StorageLocation,
        request_id: String,
    },
    Recover,
    Rollback {
        request_id: String,
    },
}

#[tauri::command]
pub async fn desktop_backup_storage(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<StorageView, NativeError> {
    let caller = policy::caller(&window).map_err(failure)?;
    let _transition = repository.transitions.lock().await;
    let session = request.session_id.clone();
    let descriptor = access(host.inner().clone(), move |services| {
        services.vaults.get(&session)?.verify_physical_root()?;
        Ok(services.vaults.descriptor(&session)?.clone())
    })
    .await?;
    let storage = repository.backups.locations.storage(&descriptor);
    if matches!(request.action, Action::Status | Action::Reveal { .. }) {
        let app = window.app_handle().clone();
        return worker(&repository, move || {
            if let Action::Reveal { revision } = request.action {
                let path = presentation::reveal_path(&storage, revision)?;
                app.opener()
                    .reveal_item_in_dir(path)
                    .map_err(std::io::Error::other)?;
            }
            presentation::view(&storage)
        })
        .await;
    }
    let _mutation = repository.remote_mutations.lock().await;
    let _search = repository
        .search_slots
        .clone()
        .acquire_owned()
        .await
        .map_err(|_| failure("History search is closed"))?;
    repository
        .backups
        .close(host.inner().clone(), &request.session_id)
        .await?;
    let backends = window.state::<std::sync::Arc<crate::host::ai::backends::NativeBackends>>();
    let _ai_transition = backends
        .prepare_storage_move(&window.ai(), &request.session_id)
        .await?;
    let owner = caller.window.clone();
    access(host.inner().clone(), move |services| {
        services.repository.leave(&owner, false);
        Ok(())
    })
    .await?;
    repository
        .history
        .revoke(&caller.window)
        .await
        .map_err(failure)?;
    let (status, binding) = worker(&repository, move || {
        runtime()?.block_on(async {
            match request.action {
                Action::Change {
                    revision,
                    location,
                    request_id,
                } => storage.change(revision, location, &request_id).await,
                Action::Recover => storage.recover().await,
                Action::Rollback { request_id } => storage.rollback(&request_id).await,
                Action::Status | Action::Reveal { .. } => unreachable!(),
            }
            .map_err(std::io::Error::other)?;
            Ok((
                presentation::view(&storage)?,
                storage.binding().map_err(std::io::Error::other)?,
            ))
        })
    })
    .await?;
    let session = request.session_id;
    access(host.inner().clone(), move |services| {
        services.vaults.get(&session)?.verify_physical_root()?;
        services
            .repository
            .bind_backup(&services.vaults, &session, &binding.state)
    })
    .await?;
    Ok(status)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn storage_frames_reject_paths_and_scope_injection() {
        let valid = serde_json::json!({"sessionId":"opaque", "action":{"kind":"change", "revision":0, "location":"colocated", "request_id":"original"}});
        assert!(serde_json::from_value::<Request>(valid.clone()).is_ok());
        let reveal =
            serde_json::json!({"sessionId":"opaque", "action":{"kind":"reveal", "revision":0}});
        assert!(serde_json::from_value::<Request>(reveal.clone()).is_ok());
        let mut injected = reveal;
        injected["action"]["path"] = serde_json::json!("/outside");
        assert!(serde_json::from_value::<Request>(injected).is_err());
        for key in [
            "root",
            "state",
            "archive",
            "control",
            "window",
            "generation",
            "vaultId",
        ] {
            for nested in [false, true] {
                let mut frame = valid.clone();
                if nested {
                    frame["action"][key] = serde_json::json!("outside");
                } else {
                    frame[key] = serde_json::json!("outside");
                }
                assert!(serde_json::from_value::<Request>(frame).is_err());
            }
        }
    }
}
