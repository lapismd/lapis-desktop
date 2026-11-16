//! Passive source/status projection from the admitted shared native owner.
use super::{policy, remotes};
use crate::host::state::{NativeError, NativeHost};
use serde::Deserialize;
use std::io;
use tauri::{State, WebviewWindow};
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
}
#[tauri::command]
pub async fn desktop_repository_working_copy(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    request: Request,
) -> Result<String, NativeError> {
    let client = remotes::client(&window, host.inner().clone(), request.session_id.clone()).await?;
    let result = client
        .repository_working_copy()
        .await
        .map_err(io::Error::other)?;
    remotes::verify(host.inner().clone(), request.session_id, client).await?;
    policy::caller(&window).map_err(|_| {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        )
    })?;
    Ok(result)
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
