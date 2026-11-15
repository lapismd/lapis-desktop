use super::ContentListener;
use crate::host::state::{NativeHost, access};
use lapis_app_core::services::content::{ContentGrants, ContentVault};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{sync::Arc, time::Duration};
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct GrantInput {
    label: String,
    vault_ids: Vec<Uuid>,
    hours: u32,
    permissions: Vec<String>,
}

async fn grants(host: NativeHost) -> Result<Arc<ContentGrants>, String> {
    access(host, |services| Ok(services.core_vaults.content.clone()))
        .await
        .map_err(|e| e.to_string())
}
#[tauri::command]
pub async fn desktop_cli_access(
    app: AppHandle,
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    action: String,
    enabled: Option<bool>,
    input: Option<GrantInput>,
    id: Option<Uuid>,
) -> Result<Value, String> {
    if window.label() != "main" {
        return Err("CLI access requires the main window".into());
    }
    let state = app.state::<ContentListener>();
    let mut listener = state.0.lock().await;
    let host = host.inner().clone();
    let grants = grants(host.clone()).await?;
    match action.as_str() {
        "status" => {
            let access_status = grants.status().map_err(|e| e.message)?;
            let vaults = access(host, |services| Ok(services.vaults.admitted()))
                .await
                .map_err(|e| e.to_string())?;
            let mut seen = std::collections::BTreeSet::new();
            Ok(
                json!({ "enabled": access_status.enabled, "target": listener.as_ref().map(|l| &l.origin),
                "vaults": vaults.into_iter().filter(|v| seen.insert(v.profile_id.clone())).map(|v| json!({"id": v.profile_id, "name": v.name})).collect::<Vec<_>>(),
                "permissions": grants.operation_permissions(),
                "grants": access_status.grants.into_iter().map(|g| json!({"id": g.grant_id, "label": g.label})).collect::<Vec<_>>() }),
            )
        }
        "enable" => {
            let enabled = enabled.ok_or("Enable value is required")?;
            if enabled {
                if listener.is_none() {
                    *listener = Some(
                        lapis_desktop::cli::content::Listener::start(grants.clone())
                            .await
                            .map_err(|e| e.to_string())?,
                    );
                }
                tauri::async_runtime::spawn_blocking(move || grants.set_enabled(true))
                    .await
                    .map_err(|_| "Access enable did not complete")?
                    .map_err(|e| e.message)?;
            } else {
                tauri::async_runtime::spawn_blocking(move || grants.set_enabled(false))
                    .await
                    .map_err(|_| "Access disable did not complete")?
                    .map_err(|e| e.message)?;
                if let Some(previous) = listener.take() {
                    previous.stop().await.map_err(|e| e.to_string())?;
                }
            }
            Ok(Value::Null)
        }
        "create" => {
            let origin = listener
                .as_ref()
                .ok_or("Enable desktop access first")?
                .origin
                .clone();
            let input = input.ok_or("Credential details are required")?;
            if !(1..=24).contains(&input.hours)
                || input.vault_ids.is_empty()
                || input.vault_ids.len() > 20
                || input.label.trim().is_empty()
                || input.label.len() > 128
                || input.permissions.len() > 32
            {
                return Err(
                    "Select a name, 1–20 admitted vaults and a lifetime of 1–24 hours".into(),
                );
            }
            let window = window.clone();
            let dialog_app = app.clone();
            tauri::async_runtime::spawn_blocking(move || {
                let path = dialog_app
                    .dialog()
                    .file()
                    .set_parent(&window)
                    .set_title("Save private CLI credential")
                    .set_file_name("lapis-cli.token")
                    .blocking_save_file()
                    .ok_or("Credential creation cancelled")?
                    .into_path()
                    .map_err(|_| "Choose a local token file")?;
                grants.prune_expired().map_err(|e| e.message)?;
                let (issued, path) = {
                    let mut services = host
                        .0
                        .lock()
                        .map_err(|_| "Vault services are unavailable")?;
                    let admitted = services.vaults.admitted();
                    let roots = admitted
                        .iter()
                        .map(|v| std::path::PathBuf::from(&v.path))
                        .collect::<Vec<_>>();
                    let path = lapis_desktop::cli::credential::destination(&path, &roots)
                        .map_err(|e| e.to_string())?;
                    let mut selected = Vec::new();
                    for id in &input.vault_ids {
                        let entry = admitted
                            .iter()
                            .find(|v| v.profile_id == id.to_string())
                            .ok_or("Vault is not admitted")?;
                        let crate::host::state::NativeServices {
                            core_vaults,
                            vaults,
                            ..
                        } = &mut *services;
                        selected.push(ContentVault {
                            name: entry.name.clone(),
                            client: core_vaults
                                .service(vaults, &entry.session_id)
                                .map_err(|e| e.to_string())?
                                .attach()
                                .map_err(|e| e.to_string())?,
                        });
                    }
                    let issued = grants
                        .issue_named_operations(
                            &input.label,
                            selected,
                            Duration::from_secs(u64::from(input.hours) * 3600),
                            &input.permissions,
                        )
                        .map_err(|e| e.message)?;
                    (issued, path)
                };
                let write =
                    lapis_desktop::cli::credential::write_new(&path, issued.token.expose_secret());
                if write.is_err() {
                    let _ = grants.revoke(issued.grant_id);
                    return Err(
                        "Could not create a new private token file; choose a different path".into(),
                    );
                }
                Ok(json!({"command": lapis_desktop::cli::credential::command(&origin, &path)}))
            })
            .await
            .map_err(|_| "Credential creation did not complete")?
        }
        "revoke" => {
            let id = id.ok_or("Credential id is required")?;
            tauri::async_runtime::spawn_blocking(move || grants.revoke(id))
                .await
                .map_err(|_| "Revocation did not complete")?
                .map_err(|e| e.message)?;
            Ok(Value::Null)
        }
        _ => Err("Unknown CLI access action".into()),
    }
}
