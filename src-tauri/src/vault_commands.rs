use crate::native_host::{NativeError, NativeHost as VaultHost, access};
use lapis_desktop::vault::VaultDescriptor;
use serde_json::{Value, json};
use std::io;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn vault_recents(host: tauri::State<'_, VaultHost>) -> Result<Value, NativeError> {
    access(host.inner().clone(), |manager| {
        Ok(json!(manager.vaults.recents()))
    })
    .await
}

#[tauri::command]
pub async fn vault_restore(
    host: tauri::State<'_, VaultHost>,
) -> Result<Option<VaultDescriptor>, NativeError> {
    access(host.inner().clone(), |manager| {
        manager.with_files(|manager| manager.vaults.restore_notes())
    })
    .await
}

#[tauri::command]
pub async fn vault_remember_notes(
    host: tauri::State<'_, VaultHost>,
    session_id: Option<String>,
) -> Result<(), NativeError> {
    access(host.inner().clone(), move |manager| {
        manager.with_files(|manager| manager.vaults.remember_notes(session_id.as_deref()))
    })
    .await
}

#[tauri::command]
pub async fn vault_select(
    window: tauri::WebviewWindow,
    host: tauri::State<'_, VaultHost>,
    create_name: Option<String>,
    create: Option<bool>,
) -> Result<Option<VaultDescriptor>, NativeError> {
    if let Some(name) = &create_name {
        lapis_desktop::vault::validate_name(name)?;
    }
    let host = host.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let create_destination = create.unwrap_or(false);
        if create_destination && create_name.is_some() {
            return Err(io::Error::other("Choose one vault creation mode"));
        }
        #[cfg(not(feature = "e2e"))]
        let selection = pick_native(&window, create_name.is_some(), create_destination)?;
        #[cfg(feature = "e2e")]
        let selection = {
            if std::env::var_os("LAPIS_DESKTOP_ACCEPTANCE_REAL_PICKER").is_some() {
                pick_native(&window, create_name.is_some(), create_destination)?
            } else {
                let queue = std::path::PathBuf::from(
                    std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")
                        .map_err(|_| io::Error::other("Acceptance profile is missing"))?,
                )
                .join("picker.json");
                let selection: Option<std::path::PathBuf> =
                    serde_json::from_slice(&std::fs::read(&queue)?)?;
                std::fs::remove_file(queue)?;
                selection
            }
        };
        let (selection, create_name) = if create_destination {
            match selection {
                Some(path) => {
                    let name = path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .ok_or_else(|| io::Error::other("Enter a single folder name"))?
                        .to_owned();
                    lapis_desktop::vault::validate_name(&name)?;
                    let parent = path
                        .parent()
                        .ok_or_else(|| io::Error::other("Choose a parent folder"))?;
                    (Some(parent.to_path_buf()), Some(name))
                }
                None => (None, None),
            }
        } else {
            (selection, create_name)
        };
        host.0
            .lock()
            .map_err(|_| io::Error::other("Vault owner is unavailable"))?
            .with_files(|manager| manager.vaults.select(selection, create_name.as_deref()))
    })
    .await
    .map_err(|_| io::Error::other("Folder selection could not complete"))?
    .map_err(Into::into)
}

fn pick_native(
    window: &tauri::WebviewWindow,
    create: bool,
    create_destination: bool,
) -> io::Result<Option<std::path::PathBuf>> {
    if create_destination {
        return window
            .app_handle()
            .dialog()
            .file()
            .set_parent(window)
            .set_title("Create New Vault")
            .set_file_name("Untitled vault")
            .blocking_save_file()
            .map(|selection| {
                selection
                    .into_path()
                    .map_err(|_| io::Error::other("Selected folder is not a local path"))
            })
            .transpose();
    }
    let title = if create {
        "Choose the parent folder for your new vault"
    } else {
        "Open a notes vault"
    };
    window
        .app_handle()
        .dialog()
        .file()
        .set_parent(window)
        .set_title(title)
        .blocking_pick_folder()
        .map(|selection| {
            selection
                .into_path()
                .map_err(|_| io::Error::other("Selected folder is not a local path"))
        })
        .transpose()
}

#[tauri::command]
pub async fn vault_open_recent(
    host: tauri::State<'_, VaultHost>,
    profile_id: String,
) -> Result<VaultDescriptor, NativeError> {
    access(host.inner().clone(), move |manager| {
        manager.with_files(|manager| manager.vaults.open_recent(&profile_id))
    })
    .await
}

#[tauri::command]
pub async fn vault_close(
    host: tauri::State<'_, VaultHost>,
    session_id: String,
) -> Result<(), NativeError> {
    access(host.inner().clone(), move |manager| {
        manager.close_vault(&session_id)
    })
    .await
}
