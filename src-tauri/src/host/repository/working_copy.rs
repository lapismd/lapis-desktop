//! Observes the native-admitted physical vault; no renderer path or write authority.
use super::{RepositoryHost, policy};
use crate::host::state::{NativeError, NativeHost, access};
use serde::Deserialize;
use std::{io, sync::Arc};
use tauri::{State, WebviewWindow};
use tauri_plugin_jj_store::local;
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
}
fn unavailable(error: impl std::fmt::Display) -> NativeError {
    io::Error::other(format!("Working copy status unavailable: {error}")).into()
}
#[tauri::command]
pub async fn desktop_repository_working_copy(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<String, NativeError> {
    let caller = policy::caller(&window).map_err(unavailable)?;
    // The existing transition owner drains this bounded read before release,
    // replacement or vault close. It never holds the native services mutex over IO.
    let _transition = repository.transitions.lock().await;
    let (grant, root) = access(host.inner().clone(), move |services| {
        let grant =
            services
                .repository
                .authorize(&services.vaults, &caller.window, &request.session_id)?;
        let root = services.vaults.get(grant.session())?.path().to_path_buf();
        Ok((grant, root))
    })
    .await?;
    let access: Arc<dyn local::Access> = Arc::new(policy::Access {
        host: host.inner().clone(),
        grant,
    });
    let reader = local::Executor::new(1).map_err(unavailable)?;
    let result = async {
        let heads = reader.heads(access.clone()).await.map_err(unavailable)?;
        let [operation] = heads.heads.as_slice() else {
            return Err(unavailable("Choose one repository operation before reading the working copy"));
        };
        let result = repository.working_tree.status(access.clone(), root, *operation).await.map_err(unavailable)?;
        access.authorize().await.map_err(unavailable)?;
        let author = result.commit.author;
        serde_json::to_string(&serde_json::json!({
            "version": 1, "operation": result.operation, "workspace": result.workspace,
            "working_copy": result.working_copy, "files": result.files, "lines": result.lines,
            "uncounted": result.uncounted,
            "commit": { "change_id": result.commit.change_id, "description": result.commit.description,
                "author": {"name": author.name, "email": author.email,
                    "timestamp": {"millis": author.timestamp.millis.to_string(), "offset_minutes": author.timestamp.offset_minutes}}
            }
        })).map_err(unavailable)
    }.await;
    repository.working_tree.drain().await.map_err(unavailable)?;
    result
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn status_request_has_no_renderer_source_authority() {
        for key in [
            "path",
            "root",
            "metadata",
            "operation",
            "workspace",
            "generation",
            "window",
        ] {
            let mut value = serde_json::json!({"sessionId":"vault"});
            value[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(value).is_err());
        }
    }
}
