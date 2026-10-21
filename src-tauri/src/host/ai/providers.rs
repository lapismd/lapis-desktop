use super::policy::{DesktopAiPolicy, caller};
use crate::host::state::{NativeError, NativeHost, access};
use lapis_desktop::ai::configuration::Save;
use serde::Deserialize;
use std::io;
use tauri::WebviewWindow;

#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Request {
    session_id: String,
    profile_id: Option<String>,
    action: Action,
}
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
enum Action {
    Status,
    Save { command: Save },
}

#[tauri::command]
pub async fn desktop_ai_providers(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    policy: tauri::State<'_, DesktopAiPolicy>,
    request: Request,
) -> Result<serde_json::Value, NativeError> {
    caller(&window).map_err(|_| {
        io::Error::new(
            io::ErrorKind::PermissionDenied,
            "AI provider settings are unavailable",
        )
    })?;
    let vault = access(host.inner().clone(), move |services| {
        services
            .vaults
            .get(&request.session_id)?
            .verify_physical_root()?;
        Ok(services
            .vaults
            .descriptor(&request.session_id)?
            .profile_id
            .clone())
    })
    .await?;
    let store = policy.providers()?;
    let store = match request.profile_id {
        Some(id) => store.for_agent(&vault, &id)?,
        None => store,
    };
    tauri::async_runtime::spawn_blocking(move || {
        let status = match request.action {
            Action::Status => store.status()?,
            Action::Save { command } => store.save(command)?,
        };
        serde_json::to_value(status).map_err(io::Error::other)
    })
    .await
    .map_err(io::Error::other)?
    .map_err(Into::into)
}
