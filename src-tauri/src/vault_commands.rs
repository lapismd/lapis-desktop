use lapis_desktop::vault::{VaultDescriptor, VaultManager, WriteOptions};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::io;
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[derive(Clone)]
pub struct VaultHost(pub Arc<Mutex<VaultManager>>);

#[derive(Serialize)]
pub struct NativeError {
    code: &'static str,
    message: String,
}

impl From<io::Error> for NativeError {
    fn from(error: io::Error) -> Self {
        let code = match error.kind() {
            io::ErrorKind::NotFound => "ENOENT",
            io::ErrorKind::PermissionDenied => "EACCES",
            io::ErrorKind::AlreadyExists => "EEXIST",
            io::ErrorKind::InvalidInput | io::ErrorKind::InvalidData => "EINVAL",
            _ => "EIO",
        };
        Self {
            code,
            message: error.to_string(),
        }
    }
}

pub fn initialize(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(not(feature = "e2e"))]
    let profile = app.path().app_data_dir()?;
    #[cfg(feature = "e2e")]
    let profile =
        std::path::PathBuf::from(std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")?).join("profile");
    app.manage(VaultHost(Arc::new(Mutex::new(VaultManager::new(
        &profile,
    )?))));
    Ok(())
}

async fn access<T: Send + 'static>(
    host: VaultHost,
    action: impl FnOnce(&mut VaultManager) -> io::Result<T> + Send + 'static,
) -> Result<T, NativeError> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut manager = host
            .0
            .lock()
            .map_err(|_| io::Error::other("Vault owner is unavailable"))?;
        action(&mut manager)
    })
    .await
    .map_err(|_| io::Error::other("Vault operation could not complete"))?
    .map_err(Into::into)
}

#[tauri::command]
pub async fn vault_recents(host: tauri::State<'_, VaultHost>) -> Result<Value, NativeError> {
    access(host.inner().clone(), |manager| Ok(json!(manager.recents()))).await
}

#[tauri::command]
pub async fn vault_select(
    window: tauri::WebviewWindow,
    host: tauri::State<'_, VaultHost>,
    create_name: Option<String>,
) -> Result<Option<VaultDescriptor>, NativeError> {
    if let Some(name) = &create_name {
        lapis_desktop::vault::validate_name(name)?;
    }
    let host = host.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(not(feature = "e2e"))]
        let selection = pick_native(&window, create_name.is_some())?;
        #[cfg(feature = "e2e")]
        let selection = {
            if std::env::var_os("LAPIS_DESKTOP_ACCEPTANCE_REAL_PICKER").is_some() {
                pick_native(&window, create_name.is_some())?
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
        host.0
            .lock()
            .map_err(|_| io::Error::other("Vault owner is unavailable"))?
            .select(selection, create_name.as_deref())
    })
    .await
    .map_err(|_| io::Error::other("Folder selection could not complete"))?
    .map_err(Into::into)
}

fn pick_native(
    window: &tauri::WebviewWindow,
    create: bool,
) -> io::Result<Option<std::path::PathBuf>> {
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
        manager.open_recent(&profile_id)
    })
    .await
}

#[tauri::command]
pub async fn vault_close(
    host: tauri::State<'_, VaultHost>,
    session_id: String,
) -> Result<(), NativeError> {
    access(host.inner().clone(), move |manager| {
        manager.close(&session_id)
    })
    .await
}

#[derive(Deserialize)]
#[serde(tag = "operation", rename_all = "kebab-case", deny_unknown_fields)]
pub enum FileRequest {
    Stat {
        path: String,
    },
    Exists {
        path: String,
    },
    List {
        path: String,
    },
    ReadText {
        path: String,
    },
    ReadBinary {
        path: String,
    },
    ReadRange {
        path: String,
        offset: u64,
        length: usize,
    },
    WriteText {
        path: String,
        data: String,
        #[serde(default)]
        options: WriteOptions,
    },
    WriteBinary {
        path: String,
        data: Vec<u8>,
        #[serde(default)]
        options: WriteOptions,
    },
    AppendText {
        path: String,
        data: String,
        #[serde(default)]
        options: WriteOptions,
    },
    Mkdir {
        path: String,
        #[serde(default)]
        recursive: bool,
    },
}

#[tauri::command]
pub async fn vault_fs(
    host: tauri::State<'_, VaultHost>,
    session_id: String,
    request: FileRequest,
) -> Result<Value, NativeError> {
    access(host.inner().clone(), move |manager| {
        let root = manager.get(&session_id)?;
        Ok(match request {
            FileRequest::Stat { path } => json!(root.stat(&path)?),
            FileRequest::Exists { path } => json!(root.stat(&path)?.is_some()),
            FileRequest::List { path } => json!(root.list(&path)?),
            FileRequest::ReadText { path } => json!(root.read_text(&path)?),
            FileRequest::ReadBinary { path } => json!(root.read(&path)?),
            FileRequest::ReadRange {
                path,
                offset,
                length,
            } => json!(root.read_range(&path, offset, length)?),
            FileRequest::WriteText {
                path,
                data,
                options,
            } => {
                root.write(&path, data.as_bytes(), &options)?;
                Value::Null
            }
            FileRequest::WriteBinary {
                path,
                data,
                options,
            } => {
                root.write(&path, &data, &options)?;
                Value::Null
            }
            FileRequest::AppendText {
                path,
                data,
                options,
            } => {
                root.append(&path, &data, &options)?;
                Value::Null
            }
            FileRequest::Mkdir { path, recursive } => {
                root.mkdir(&path, recursive)?;
                Value::Null
            }
        })
    })
    .await
}
