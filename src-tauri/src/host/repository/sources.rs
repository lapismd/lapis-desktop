//! Main-window source discovery and original-repository read admission.
use super::{RepositoryHost, policy, remote::failure};
use crate::host::state::{NativeError, NativeHost, access};
use serde::{Deserialize, Serialize};
use tauri::{State, WebviewWindow};
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    #[serde(default)]
    open_original: bool,
}
#[derive(Serialize)]
pub struct Sources {
    original: bool,
    token: Option<String>,
}
#[tauri::command]
pub async fn desktop_repository_sources(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    repository: State<'_, RepositoryHost>,
    request: Request,
) -> Result<Sources, NativeError> {
    let caller = policy::caller(&window).map_err(failure)?;
    let _transition = repository.transitions.lock().await;
    let session = request.session_id.clone();
    let descriptor = access(host.inner().clone(), move |services| {
        services.vaults.get(&session)?.verify_physical_root()?;
        Ok(services.vaults.descriptor(&session)?.clone())
    })
    .await?;
    let binding = super::storage::resolve(&repository, descriptor, false).await?;
    let session = request.session_id.clone();
    let original = access(host.inner().clone(), move |services| {
        if binding.state.join("vault.json").is_file() {
            services
                .repository
                .bind_backup(&services.vaults, &session, &binding.state)?;
        }
        services
            .repository
            .original_available(&services.vaults, &session)
    })
    .await?;
    if !request.open_original {
        return Ok(Sources {
            original,
            token: None,
        });
    }
    if !original {
        return Err(failure("This vault has no separate original JJ repository"));
    }
    let owner = caller.window.clone();
    let session = request.session_id;
    let plan = access(host.inner().clone(), move |services| {
        services
            .repository
            .prepare_original(&services.vaults, &owner, &session)
    })
    .await?;
    if !plan.preserves_vault() {
        repository
            .history
            .revoke(&caller.window)
            .await
            .map_err(failure)?;
    }
    let token = plan
        .read_token()
        .ok_or_else(|| failure("Original history scope is unavailable"))?
        .to_owned();
    access(host.inner().clone(), move |services| {
        services
            .repository
            .complete(&services.vaults, &plan)
            .map(|_| ())
    })
    .await?;
    Ok(Sources {
        original: true,
        token: Some(token),
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn source_frames_cannot_select_paths_or_supply_read_tokens() {
        let frame = serde_json::json!({"sessionId":"opaque", "openOriginal":true});
        assert!(serde_json::from_value::<Request>(frame.clone()).is_ok());
        for key in [
            "root",
            "metadata",
            "source",
            "token",
            "window",
            "generation",
        ] {
            let mut invalid = frame.clone();
            invalid[key] = serde_json::json!("outside");
            assert!(serde_json::from_value::<Request>(invalid).is_err());
        }
    }
}
