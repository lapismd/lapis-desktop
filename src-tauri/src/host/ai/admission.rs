use super::backends::{NativeBackends, revoke};
use super::policy::caller;
use crate::host::state::{NativeError, NativeHost, access};
use serde::Deserialize;
use std::io;
use std::sync::Arc;
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
    let backends = window.app_handle().state::<Arc<NativeBackends>>();
    let transition = backends.transitions.clone().lock_owned().await;
    let session = request.session_id;
    let owner = context.window.clone();
    let checking = backends.inner().clone();
    let (plan, transition) = access(host.inner().clone(), move |services| {
        checking.ensure_live()?;
        let plan = services.ai.prepare(&services.vaults, &owner, &session)?;
        Ok((plan, transition))
    })
    .await?;
    let workers = window.app_handle().ai();
    if !plan.preserves_workers() {
        revoke(&workers, &backends, &context.window, None).await?;
    }
    let generation = plan.generation().to_owned();
    let checking = backends.inner().clone();
    let (result, _transition) = access(host.inner().clone(), move |services| {
        Ok((
            checking
                .ensure_live()
                .and_then(|_| services.ai.complete(&services.vaults, &plan).map(|_| ())),
            transition,
        ))
    })
    .await?;
    if result.is_err() {
        revoke(&workers, &backends, &context.window, Some(&generation)).await?;
    }
    result.map_err(Into::into)
}

#[tauri::command]
pub async fn desktop_ai_release(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    request: ReleaseRequest,
) -> Result<(), NativeError> {
    let context = caller(&window).map_err(|error| io::Error::other(error.to_string()))?;
    let backends = window.app_handle().state::<Arc<NativeBackends>>();
    let transition = backends.transitions.clone().lock_owned().await;
    let owner = context.window.clone();
    let backends = backends.inner().clone();
    let reloading = backends.clone();
    let (retained, _transition) = access(host.inner().clone(), move |services| {
        let retained = services.ai.leave(&owner, request.reload);
        if retained {
            reloading.suspend(&owner)?;
        }
        Ok((retained, transition))
    })
    .await?;
    if !retained {
        revoke(&window.app_handle().ai(), &backends, &context.window, None).await?;
    }
    Ok(())
}

pub async fn close_vault(
    app: &AppHandle,
    host: NativeHost,
    session: &str,
) -> Result<(), NativeError> {
    let backends = app.state::<Arc<NativeBackends>>();
    let transition = backends.transitions.clone().lock_owned().await;
    let session = session.to_owned();
    let (windows, _transition) = access(host, move |services| {
        services.vaults.get(&session)?;
        if services.databases.has_session(&session) {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Close the owned database before closing the vault",
            ));
        }
        Ok((services.ai.begin_close_vault(&session), transition))
    })
    .await?;
    for retired in windows {
        revoke(
            &app.ai(),
            &backends,
            &retired.window,
            Some(&retired.generation),
        )
        .await?;
    }
    Ok(())
}

pub fn window_destroyed(app: &AppHandle, window: &str) {
    let backends = app
        .try_state::<Arc<NativeBackends>>()
        .map(|s| s.inner().clone());
    if let Some(backends) = &backends
        && let Err(error) = backends.destroy_window(window)
    {
        eprintln!("Native backend fence failed: {error}");
    }
    if let Some(host) = app.try_state::<NativeHost>()
        && let Ok(mut services) = host.0.lock()
    {
        services.ai.leave(window, false);
    }
    let Some(backends) = backends else {
        return;
    };
    let workers = app.ai();
    let window = window.to_owned();
    tauri::async_runtime::spawn(async move {
        let _transition = backends.transitions.lock().await;
        if let Err(error) = revoke(&workers, &backends, &window, None).await {
            eprintln!("Native backend cleanup failed: {error}");
        }
    });
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
