use super::{RepositoryHost, policy};
use crate::host::state::{NativeError, NativeHost, access};
use jj_vault::{RestoreRequest, VaultRestoreRequest};
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
    PreviewVault { checkpoint: String },
    ApplyVault { request: VaultRestoreRequest },
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
        Action::PreviewVault { checkpoint } => serde_json::to_value(
            owner
                .backup
                .preview_vault_restore(checkpoint)
                .await
                .map_err(failure)?,
        ),
        Action::ApplyVault { request } => {
            #[cfg(all(debug_assertions, feature = "e2e"))]
            let original = request.clone();
            let capture = owner.backup.restore_vault(request).await.map_err(failure)?;
            #[cfg(all(debug_assertions, feature = "e2e"))]
            crate::acceptance::backup_restore::after_apply("vault", original)
                .await
                .map_err(failure)?;
            serde_json::to_value(capture)
        }
        Action::Preview { checkpoint, path } => serde_json::to_value(
            owner
                .backup
                .preview_restore(checkpoint, path)
                .await
                .map_err(failure)?,
        ),
        Action::Apply { request } => {
            #[cfg(all(debug_assertions, feature = "e2e"))]
            let original = request.clone();
            let capture = owner.backup.restore(request).await.map_err(failure)?;
            #[cfg(all(debug_assertions, feature = "e2e"))]
            crate::acceptance::backup_restore::after_apply("file", original)
                .await
                .map_err(failure)?;
            serde_json::to_value(capture)
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
        let valid = serde_json::json!({"sessionId":"opaque","action":{"kind":"apply_vault","request":{"request_id":"stable","checkpoint":"abc","expected":"tree"}}});
        assert!(serde_json::from_value::<Request>(valid.clone()).is_ok());
        for key in ["root", "path", "metadata", "generation", "window"] {
            let mut frame = valid.clone();
            frame["action"]["request"][key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(frame).is_err());
        }
    }
}
