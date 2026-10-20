//! Closed native compute controls. No executable, environment or credential IPC.
use super::{
    owner::NativeAiOwner,
    policy::{DesktopAiPolicy, caller},
};
use crate::host::state::{NativeError, NativeHost};
use lapis_desktop::ai::{
    compute::{Action as ComputeAction, Command},
    tools::Owner,
};
use serde::Deserialize;
use std::{io, sync::Arc};
use tauri::WebviewWindow;
#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Request {
    session_id: String,
    action: Action,
}
#[derive(Deserialize)]
#[serde(tag = "type", deny_unknown_fields, rename_all = "camelCase")]
enum Action {
    Status,
    Command { command: Command },
}
#[tauri::command]
pub async fn desktop_ai_compute(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    policy: tauri::State<'_, DesktopAiPolicy>,
    owner: tauri::State<'_, Arc<NativeAiOwner>>,
    request: Request,
) -> Result<serde_json::Value, NativeError> {
    let _transition = owner.transitions.clone().lock_owned().await;
    let context = caller(&window).map_err(|_| io::Error::other("Compute unavailable"))?;
    // Device-owned cleanup stays available after trust/root admission is revoked.
    if let Action::Command { command } = &request.action
        && let ComputeAction::Stop { owner_id } = &command.action
    {
        let compute = policy.compute()?;
        compute.stop_owned(&request.session_id, *owner_id).await?;
        return tauri::async_runtime::spawn_blocking(move || {
            serde_json::to_value(compute.status()?).map_err(io::Error::other)
        })
        .await
        .map_err(io::Error::other)?
        .map_err(Into::into);
    }
    let checking = owner.inner().clone();
    let services = host.inner().clone();
    let preparing = policy.inner().clone();
    let (compute, plan, scope) = tauri::async_runtime::spawn_blocking(move || {
        let lease = checking.current(&services, &context.window)?;
        if lease.session() != request.session_id {
            return Err(io::Error::other("Compute scope unavailable"));
        }
        Ok((
            preparing.compute()?,
            preparing.compute_plan()?,
            Owner {
                window: context.window,
                session: lease.session().to_owned(),
                generation: lease.generation().to_owned(),
            },
        ))
    })
    .await
    .map_err(io::Error::other)??;
    if let Action::Command { command } = request.action {
        let checking = owner.inner().clone();
        let host = host.inner().clone();
        let window = window.label().to_owned();
        let original = scope.generation.clone();
        let authorize = Arc::new(move || checking.retained(&host, &window, &original).map(|_| ()));
        compute.command(command, plan, scope, authorize).await?;
    }
    tauri::async_runtime::spawn_blocking(move || {
        serde_json::to_value(compute.status()?).map_err(io::Error::other)
    })
    .await
    .map_err(io::Error::other)?
    .map_err(Into::into)
}
