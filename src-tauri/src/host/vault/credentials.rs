use crate::host::state::{NativeError, NativeHost, access};
use lapis_app_core::credentials::{PluginCredentialCommand, PluginCredentialReply, PluginGrants};
use std::{io, path::Path, sync::Arc};
use tauri::{Manager, WebviewWindow};

pub struct PluginCredentials {
    profile: std::path::PathBuf,
    grants: Arc<PluginGrants>,
}

impl PluginCredentials {
    pub fn new(profile: &Path) -> io::Result<Self> {
        let grants = if cfg!(target_os = "macos") {
            PluginGrants::parse(
                &std::env::var("LAPIS_DESKTOP_CREDENTIAL_PLUGINS").unwrap_or_default(),
            )
            .map_err(io::Error::other)?
        } else {
            PluginGrants::default()
        };
        Ok(Self {
            profile: profile.canonicalize()?,
            grants: Arc::new(grants),
        })
    }
}

fn require_local(window: &WebviewWindow) -> io::Result<()> {
    let url = window.url().map_err(io::Error::other)?;
    if window.label() != "main"
        || !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions))
    {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "Local main window required",
        ));
    }
    Ok(())
}

#[tauri::command]
pub async fn vault_credential_grants(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    session_id: String,
) -> Result<Vec<String>, NativeError> {
    require_local(&window)?;
    access(host.inner().clone(), move |services| {
        services
            .core_vaults
            .client(&services.vaults, &session_id)
            .map(|_| ())
    })
    .await?;
    Ok(window
        .state::<PluginCredentials>()
        .grants
        .ids()
        .into_iter()
        .map(str::to_owned)
        .collect())
}

#[tauri::command]
pub async fn vault_plugin_credentials(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    command: PluginCredentialCommand,
) -> Result<PluginCredentialReply, NativeError> {
    require_local(&window)?;
    let client = access(host.inner().clone(), move |services| {
        services.core_vaults.client(&services.vaults, &session_id)
    })
    .await?;
    let credentials = window.state::<PluginCredentials>();
    let profile = credentials.profile.clone();
    let grants = credentials.grants.clone();
    tauri::async_runtime::spawn_blocking(move || {
        client.plugin_credentials(command, &grants, |id| {
            lapis_desktop::credentials::plugin_scope(&profile, &id)
        })
    })
    .await
    .map_err(|_| io::Error::other("Plugin credential operation did not complete"))?
    .map_err(io::Error::other)
    .map_err(Into::into)
}
