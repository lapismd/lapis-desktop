//! Immutable history search on bounded workers, outside capture/file IO locks.
use super::{
    RepositoryHost, policy,
    remote::{bound, failure},
};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::search::{NativeHistory, Page, Request as SearchRequest};
use serde::Deserialize;
use tauri::{State, WebviewWindow};
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    search: SearchRequest,
}
#[tauri::command]
pub async fn desktop_backup_search(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<Page, NativeError> {
    policy::caller(&window).map_err(failure)?;
    // Pausing capture preserves immutable search access for this admitted vault.
    let session = request.session_id.clone();
    let descriptor = access(host.inner().clone(), move |s| {
        s.vaults.get(&session)?.verify_physical_root()?;
        Ok(s.vaults.descriptor(&session)?.clone())
    })
    .await?;
    let binding = super::storage::resolve(&repository, descriptor, false).await?;
    let permit = repository
        .search_slots
        .clone()
        .try_acquire_owned()
        .map_err(|_| failure("History search is busy"))?;
    let source = binding.clone();
    let page = tauri::async_runtime::spawn_blocking(move || {
        let _permit = permit;
        // Session loading itself is native IO. No renderer/native-state mutex is
        // held while projecting retained checkpoint objects.
        NativeHistory {
            binding: source,
            exclusions: vec![],
        }
        .search(&request.search)
        .map_err(std::io::Error::other)
    })
    .await
    .map_err(|_| failure("History search worker stopped"))??;
    bound(
        host.inner().clone(),
        request.session_id.clone(),
        binding,
        |_| Ok(()),
    )
    .await?;
    Ok(page)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn search_frames_cannot_choose_index_paths_or_authority() {
        let valid = serde_json::json!({"sessionId":"opaque","search":{"query":{"text":"lost phrase"},"cursor":null}});
        assert!(serde_json::from_value::<Request>(valid.clone()).is_ok());
        for key in [
            "root",
            "state",
            "index",
            "window",
            "token",
            "generation",
            "exclusions",
        ] {
            for nested in [false, true] {
                let mut frame = valid.clone();
                if nested {
                    frame["search"][key] = serde_json::json!("outside");
                } else {
                    frame[key] = serde_json::json!("outside");
                }
                assert!(serde_json::from_value::<Request>(frame).is_err());
            }
        }
    }
}
