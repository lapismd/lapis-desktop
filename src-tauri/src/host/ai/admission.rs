use super::policy::caller;
use crate::host::state::{NativeError, NativeHost, access};
use serde::Deserialize;
use std::io;
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_lapis_ai::AiExt;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AdmitRequest {
    session_id: String,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReleaseRequest {
    reload: bool,
}

#[tauri::command]
pub async fn desktop_ai_admit(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    request: AdmitRequest,
) -> Result<(), NativeError> {
    let context = caller(&window).map_err(|error| io::Error::other(error.to_string()))?;
    let session = request.session_id;
    let owner = context.window.clone();
    let plan = access(host.inner().clone(), move |services| {
        services.ai.prepare(&services.vaults, &owner, &session)
    })
    .await?;
    let workers = window.app_handle().ai();
    if !plan.preserves_workers() {
        workers
            .revoke(&context.window, None)
            .await
            .map_err(|error| io::Error::other(error.to_string()))?;
    }
    let generation = plan.generation().to_owned();
    let result = access(host.inner().clone(), move |services| {
        services.ai.complete(&services.vaults, &plan).map(|_| ())
    })
    .await;
    if result.is_err() {
        workers
            .revoke(&context.window, Some(&generation))
            .await
            .map_err(|error| io::Error::other(error.to_string()))?;
    }
    result
}

#[tauri::command]
pub async fn desktop_ai_release(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    request: ReleaseRequest,
) -> Result<(), NativeError> {
    let context = caller(&window).map_err(|error| io::Error::other(error.to_string()))?;
    let owner = context.window.clone();
    let retained = access(host.inner().clone(), move |services| {
        Ok(services.ai.leave(&owner, request.reload))
    })
    .await?;
    if !retained {
        window
            .app_handle()
            .ai()
            .revoke(&context.window, None)
            .await
            .map_err(|error| io::Error::other(error.to_string()))?;
    }
    Ok(())
}

pub async fn close_vault(
    app: &AppHandle,
    host: NativeHost,
    session: &str,
) -> Result<(), NativeError> {
    let session = session.to_owned();
    let windows = access(host, move |services| {
        services.vaults.get(&session)?;
        if services.databases.has_session(&session) {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Close the owned database before closing the vault",
            ));
        }
        Ok(services.ai.begin_close_vault(&session))
    })
    .await?;
    for retired in windows {
        app.ai()
            .revoke(&retired.window, Some(&retired.generation))
            .await
            .map_err(|error| io::Error::other(error.to_string()))?;
    }
    Ok(())
}

pub fn window_destroyed(app: &AppHandle, window: &str) {
    if let Some(host) = app.try_state::<NativeHost>()
        && let Ok(mut services) = host.0.lock()
    {
        services.ai.leave(window, false);
    }
}

#[cfg(test)]
mod tests {
    use super::{AdmitRequest, ReleaseRequest};
    #[test]
    fn ai_admission_frames_reject_authority_overrides() {
        for value in [
            serde_json::json!({"sessionId":"vault","root":"/outside"}),
            serde_json::json!({"sessionId":"vault","generation":"old"}),
            serde_json::json!({"sessionId":"vault","program":"/outside","env":{}}),
        ] {
            assert!(serde_json::from_value::<AdmitRequest>(value).is_err());
        }
        assert!(
            serde_json::from_value::<ReleaseRequest>(
                serde_json::json!({"reload":true,"window":"other"})
            )
            .is_err()
        );
        assert!(serde_json::from_value::<ReleaseRequest>(serde_json::json!({})).is_err());
    }
}
