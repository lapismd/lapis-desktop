//! Tauri caller and scope transport; native account ownership stays in services.
use crate::host::state::{NativeError, NativeHost, NativeServices, access};
use lapis_desktop::sync::account::{AccountServices, presentation::Presentation};
use serde::{Deserialize, Serialize};
use std::io;
use tauri::{Manager, State, WebviewWindow};
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OpenRequest {
    session_id: String,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ScopeRequest {
    handle: Uuid,
}

#[derive(Serialize)]
pub struct Opened {
    handle: Uuid,
    observation: Presentation,
}

fn caller(window: &WebviewWindow) -> io::Result<String> {
    if window.label() != "main"
        || !crate::host::windows::navigation::allowed(
            &window.url().map_err(|_| denied())?,
            cfg!(debug_assertions),
        )
    {
        return Err(denied());
    }
    Ok(window.label().into())
}

fn selected(sync: &mut Option<AccountServices>) -> io::Result<&mut AccountServices> {
    sync.as_mut()
        .ok_or_else(|| io::Error::new(io::ErrorKind::Unsupported, "Native Sync is not selected"))
}

fn denied() -> io::Error {
    io::Error::new(
        io::ErrorKind::PermissionDenied,
        "Native Sync caller is unavailable",
    )
}

#[tauri::command]
pub async fn desktop_sync_open(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    request: OpenRequest,
) -> Result<Opened, NativeError> {
    let window = caller(&window)?;
    if request.session_id.is_empty() || request.session_id.len() > 128 {
        return Err(denied().into());
    }
    access(host.inner().clone(), move |services| {
        let NativeServices { sync, vaults, .. } = services;
        let sync = selected(sync)?;
        let handle = sync.open_scope(vaults, &window, &request.session_id)?;
        let observation = sync.presentation(vaults, &window, handle)?;
        Ok(Opened {
            handle,
            observation,
        })
    })
    .await
}

#[tauri::command]
pub async fn desktop_sync_snapshot(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    request: ScopeRequest,
) -> Result<Presentation, NativeError> {
    let window = caller(&window)?;
    access(host.inner().clone(), move |services| {
        let NativeServices { sync, vaults, .. } = services;
        selected(sync)?.presentation(vaults, &window, request.handle)
    })
    .await
}

#[tauri::command]
pub async fn desktop_sync_detach(
    window: WebviewWindow,
    host: State<'_, NativeHost>,
    request: ScopeRequest,
) -> Result<(), NativeError> {
    let window = caller(&window)?;
    access(host.inner().clone(), move |services| {
        let NativeServices { sync, vaults, .. } = services;
        let sync = selected(sync)?;
        sync.validate(vaults, &window, request.handle)?;
        sync.detach(&window);
        Ok(())
    })
    .await
}

pub fn window_destroyed(app: &tauri::AppHandle, window: &str) {
    if let Some(host) = app.try_state::<NativeHost>()
        && let Ok(mut services) = host.0.lock()
        && let Some(sync) = &mut services.sync
    {
        sync.detach(window);
    }
}

/// Explicit selection owns construction; absent selection never accesses custody.
pub fn initialize(profile: &std::path::Path) -> io::Result<Option<AccountServices>> {
    match std::env::var("LAPIS_DESKTOP_SYNC_OWNER") {
        Err(std::env::VarError::NotPresent) => Ok(None),
        Ok(value) if value == "disabled" => Ok(None),
        Ok(value) if value == "core" => {
            let root = lapis_app_core::vault::VaultRoot::open(profile)?;
            let custody = lapis_desktop::sync::custody::AccountCustody::for_profile(&root)?;
            Ok(Some(AccountServices::new(
                &root,
                std::sync::Arc::new(custody),
            )?))
        }
        _ => Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Invalid native Sync selection",
        )),
    }
}
