use super::policy::{DesktopAiPolicy, caller};
use crate::host::state::{NativeError, NativeHost, access};
use lapis_desktop::ai::tooling::{RequestId, Tooling};
use serde::Deserialize;
use std::io;
use tauri::{Manager, WebviewWindow};
use tauri_plugin_lapis_ai::AiExt;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Request {
    session_id: String,
    action: Action,
}
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case", deny_unknown_fields)]
enum Action {
    Status {},
    Install { request: RequestId },
    Outcome { request: RequestId },
}

#[tauri::command]
pub async fn desktop_ai_clients(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    tooling: tauri::State<'_, Tooling>,
    policy: tauri::State<'_, DesktopAiPolicy>,
    request: Request,
) -> Result<serde_json::Value, NativeError> {
    let context = caller(&window).map_err(|e| io::Error::other(e.to_string()))?;
    access(host.inner().clone(), move |services| {
        services
            .vaults
            .get(&request.session_id)?
            .verify_physical_root()?;
        Ok(())
    })
    .await?;
    let value = match request.action {
        Action::Status {} => {
            let policy = policy.inner().clone();
            let ready = tauri::async_runtime::spawn_blocking(move || policy.bundle_ready())
                .await
                .map_err(io::Error::other)?;
            let mut status = tooling.status(ready).await?;
            if window
                .app_handle()
                .ai()
                .list(&context)
                .is_ok_and(|s| !s.is_empty())
            {
                status.install_supported = false;
                status.install_unavailable = Some(
                    "End connected agent sessions before installing or updating clients.".into(),
                );
            }
            serde_json::to_value(status)
        }
        Action::Install { request } => {
            if window
                .app_handle()
                .ai()
                .list(&context)
                .is_ok_and(|s| !s.is_empty())
            {
                return Err(io::Error::other(
                    "End connected agent sessions before installing or updating clients.",
                )
                .into());
            }
            serde_json::to_value(tooling.install(request).await?)
        }
        Action::Outcome { request } => {
            let outcome = match tooling.outcome(request) {
                Ok(outcome) => outcome,
                Err(error) if error.kind() == io::ErrorKind::NotFound => lapis_desktop::ai::tooling::Outcome {
                    version: 1, request_id: request, runtime_id: "codex".into(), state: "not_started".into(),
                    error: Some("Installation did not start. Check client prerequisites and explicitly try again.".into()),
                },
                Err(error) => return Err(error.into()),
            };
            serde_json::to_value(outcome)
        }
    };
    value.map_err(|error| io::Error::other(error).into())
}
