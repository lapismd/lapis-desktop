//! Admitted immutable indexing/query work. No capture or editor writer lease.
use super::{
    RepositoryHost, policy,
    remote::{bound, failure},
};
use crate::host::state::{NativeError, NativeHost, access};
use lapis_app_protocol::history_index::{HistoryIndexCommand, HistoryIndexValue};
use serde::Deserialize;
use std::future::Future;
use tauri::{State, WebviewWindow};
use tokio::sync::OwnedSemaphorePermit;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    action: HistoryIndexCommand,
}

#[tauri::command]
pub async fn desktop_backup_history_search(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<HistoryIndexValue, NativeError> {
    policy::caller(&window).map_err(failure)?;
    let session = request.session_id.clone();
    let (descriptor, client) = access(host.inner().clone(), move |state| {
        state.vaults.get(&session)?.verify_physical_root()?;
        let client = state.core_vaults.client(&state.vaults, &session)?;
        Ok((state.vaults.descriptor(&session)?.clone(), client))
    })
    .await?;
    let permit = repository
        .search_slots
        .clone()
        .acquire_owned()
        .await
        .map_err(|_| failure("History search is closed"))?;
    let binding = super::storage::resolve(&repository, descriptor, false).await?;
    let host = host.inner().clone();
    retain_search_permit(permit, async move {
        let result = client
            .control_history_index(request.action)
            .await
            .map_err(failure)?;
        bound(host, request.session_id, binding, |_| Ok(())).await?;
        Ok(result)
    })
    .await
}

/// Caller cancellation cannot release the relocation fence during Core work or egress.
async fn retain_search_permit<T: Send + 'static>(
    permit: OwnedSemaphorePermit,
    read: impl Future<Output = Result<T, NativeError>> + Send + 'static,
) -> Result<T, NativeError> {
    tauri::async_runtime::spawn(async move {
        let _permit = permit;
        read.await
    })
    .await
    .map_err(|_| failure("History index worker stopped"))?
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{sync::Arc, time::Duration};
    use tokio::sync::{Semaphore, oneshot};

    #[tokio::test]
    async fn cancelled_caller_cannot_release_search_slot_before_core_and_egress_finish() {
        let slots = Arc::new(Semaphore::new(1));
        let permit = slots.clone().acquire_owned().await.unwrap();
        let (core_started, started) = oneshot::channel();
        let (finish_core, core) = oneshot::channel();
        let (egress_started, checking) = oneshot::channel();
        let (finish_egress, egress) = oneshot::channel();
        let caller = tokio::spawn(retain_search_permit(permit, async move {
            core_started.send(()).unwrap();
            core.await.unwrap();
            egress_started.send(()).unwrap();
            egress.await.unwrap();
            Ok::<_, NativeError>(())
        }));
        started.await.unwrap();
        caller.abort();
        assert!(matches!(caller.await, Err(error) if error.is_cancelled()));
        assert!(slots.clone().try_acquire_owned().is_err());
        finish_core.send(()).unwrap();
        checking.await.unwrap();
        assert!(slots.clone().try_acquire_owned().is_err());
        finish_egress.send(()).unwrap();
        let acquired = tokio::time::timeout(Duration::from_secs(5), slots.acquire_owned()).await;
        assert!(matches!(acquired, Ok(Ok(_))));
    }

    #[test]
    fn index_actions_cannot_select_storage_paths_or_caller_authority() {
        let frame = serde_json::json!({"sessionId":"opaque","action":{"kind":"status"}});
        assert!(serde_json::from_value::<Request>(frame.clone()).is_ok());
        let legacy = serde_json::json!({"sessionId":"opaque","action":{"kind":"step"}});
        assert!(serde_json::from_value::<Request>(legacy).is_err());
        for key in ["root", "state", "index", "window", "token", "exclusions"] {
            for nested in [false, true] {
                let mut value = frame.clone();
                if nested {
                    value["action"][key] = serde_json::json!("outside");
                } else {
                    value[key] = serde_json::json!("outside");
                }
                assert!(serde_json::from_value::<Request>(value).is_err());
            }
        }
    }
}
