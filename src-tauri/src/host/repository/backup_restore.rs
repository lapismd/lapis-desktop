use super::{RepositoryHost, policy};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::RestoreRequest;
use serde::Deserialize;
use serde_json::Value;
use std::io;
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
    Preview { checkpoint: String, path: String },
    Apply { request: RestoreRequest },
}
#[tauri::command]
pub async fn desktop_backup_restore(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<Value, NativeError> {
    let caller = policy::caller(&window).map_err(failure)?;
    let session = request.session_id.clone();
    access(host.inner().clone(), move |s| {
        s.vaults.get(&session)?.verify_physical_root()
    })
    .await?;
    let owner = repository
        .backups
        .owner(&request.session_id, &caller.window)
        .await?;
    let result = match request.action {
        Action::Preview { checkpoint, path } => serde_json::to_value(
            owner
                .backup
                .preview_restore(checkpoint, path)
                .await
                .map_err(failure)?,
        ),
        Action::Apply { request } => {
            serde_json::to_value(owner.backup.restore(request).await.map_err(failure)?)
        }
    };
    result.map_err(|_| failure("Invalid restore response"))
}
fn failure(value: impl std::fmt::Display) -> NativeError {
    io::Error::other(format!("Vault restore: {value}")).into()
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn restore_frames_reject_renderer_authority() {
        let valid = serde_json::json!({"sessionId":"opaque","action":{"kind":"preview","checkpoint":"abc","path":"Note.md"}});
        assert!(serde_json::from_value::<Request>(valid.clone()).is_ok());
        for key in ["root", "metadata", "generation", "window"] {
            let mut frame = valid.clone();
            frame[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(frame).is_err());
            let mut frame = valid.clone();
            frame["action"][key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(frame).is_err());
        }
    }
}
