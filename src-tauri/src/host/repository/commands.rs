use super::{RepositoryHost, policy::caller};
use crate::host::state::{NativeError, NativeHost, NativeServices, access};
use serde::Deserialize;
use std::io;
use tauri::{AppHandle, Manager, State, WebviewWindow};
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AdmitRequest {
    session_id: String,
    #[serde(default)]
    managed: bool,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReleaseRequest {
    reload: bool,
}
fn failure() -> io::Error {
    io::Error::other("Repository history cleanup could not complete")
}
#[tauri::command]
pub async fn desktop_repository_admit(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: AdmitRequest,
) -> Result<(), NativeError> {
    let context = caller(&window).map_err(|_| {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Repository caller is unavailable",
        )
    })?;
    let _transition = repository.transitions.lock().await;
    let owner = context.window.clone();
    let session = request.session_id.clone();
    let descriptor = access(host.inner().clone(), move |services| {
        services.vaults.get(&session)?.verify_physical_root()?;
        Ok(services.vaults.descriptor(&session)?.clone())
    })
    .await?;
    let binding = super::storage::resolve(&repository, descriptor, false).await?;
    // Missing managed history must not revoke independent original readers.
    if request.managed && !binding.state.join("vault.json").is_file() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            "No automatic vault history yet; enable local backup to create it",
        )
        .into());
    }
    let plan = access(host.inner().clone(), move |services| {
        // Existing backup history remains readable when capture is paused.
        // Discovery only verifies its saved binding; it never initializes JJ.
        let state = binding.state;
        if state.join("vault.json").is_file() {
            services
                .repository
                .bind_backup(&services.vaults, &request.session_id, &state)?;
        }
        services
            .repository
            .prepare(&services.vaults, &owner, &request.session_id)
    })
    .await;
    let plan = match plan {
        Ok(plan) => plan,
        Err(error) => {
            repository
                .history
                .revoke(&context.window)
                .await
                .map_err(|_| failure())?;
            return Err(error);
        }
    };
    if !plan.preserves_reads() && (plan.had_prior_scope() || !plan.preserves_vault()) {
        repository
            .history
            .revoke(&context.window)
            .await
            .map_err(|_| failure())?;
    }
    let result = access(host.inner().clone(), move |services| {
        services
            .repository
            .complete(&services.vaults, &plan)
            .map(|_| ())
    })
    .await;
    if result.is_err() {
        repository
            .history
            .revoke(&context.window)
            .await
            .map_err(|_| failure())?;
    }
    result
}
#[tauri::command]
pub async fn desktop_repository_release(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: ReleaseRequest,
) -> Result<(), NativeError> {
    let context = caller(&window).map_err(|_| {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Repository caller is unavailable",
        )
    })?;
    let _transition = repository.transitions.lock().await;
    let owner = context.window.clone();
    access(host.inner().clone(), move |services| {
        services.repository.leave(&owner, request.reload);
        Ok(())
    })
    .await?;
    if request.reload {
        repository.backups.detach_window(&context.window).await;
    }
    repository
        .history
        .revoke(&context.window)
        .await
        .map_err(|_| failure())?;
    Ok(())
}
/// The caller holds the shared repository transition guard through vault release.
pub async fn close_vault(
    repository: &RepositoryHost,
    host: NativeHost,
    session: &str,
    reload: bool,
) -> Result<(), NativeError> {
    if reload {
        repository.backups.detach(session).await;
    } else {
        repository.backups.close(host.clone(), session).await?;
    }
    let session = session.to_owned();
    let retired = access(host.clone(), move |services| {
        services.vaults.get(&session)?;
        if services.databases.has_session(&session) {
            return Err(io::Error::new(
                io::ErrorKind::WouldBlock,
                "Close the owned database before closing the vault",
            ));
        }
        Ok(services.repository.begin_close_vault(&session))
    })
    .await?;
    for target in retired {
        let window = target.window.clone();
        let current = access(host.clone(), move |services| {
            Ok(services.repository.retirement_is_current(&target))
        })
        .await?;
        if current {
            repository
                .history
                .revoke(&window)
                .await
                .map_err(|_| failure())?;
        }
    }
    Ok(())
}
pub fn window_destroyed(app: &AppHandle, window: &str) {
    if window != "main" {
        return;
    }
    if let Some(repository) = app.try_state::<RepositoryHost>() {
        repository.backups.fence();
    }
    if let Some(host) = app.try_state::<NativeHost>()
        && let Ok(mut services) = host.0.lock()
    {
        let NativeServices { repository, .. } = &mut *services;
        repository.leave(window, false);
    }
    let app = app.clone();
    let window = window.to_owned();
    tauri::async_runtime::spawn(async move {
        let Some(host) = app.try_state::<NativeHost>() else {
            return;
        };
        let Some(repository) = app.try_state::<RepositoryHost>() else {
            return;
        };
        let _transition = repository.transitions.lock().await;
        if repository
            .backups
            .close_window(host.inner().clone(), &window)
            .await
            .is_err()
        {
            eprintln!("Vault backup shutdown needs recovery on the next open");
        }
    });
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn repository_frames_reject_renderer_authority() {
        for key in ["window", "url", "root", "generation", "metadata", "cache"] {
            let mut request = serde_json::json!({"sessionId":"vault"});
            request[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<AdmitRequest>(request).is_err());
            let mut request = serde_json::json!({"reload":true});
            request[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<ReleaseRequest>(request).is_err());
        }
    }
}
