use crate::host::state::{NativeError, NativeHost, access};
use lapis_app_protocol::files::{FileCommand, FileValue};
use serde::Deserialize;
use serde_json::{Value, json};

#[derive(Deserialize)]
#[serde(untagged)]
pub enum FileRequest {
    Portable(FileCommand),
    System(SystemRequest),
}
#[derive(Deserialize)]
#[serde(
    tag = "operation",
    rename_all = "kebab-case",
    deny_unknown_fields,
    rename_all_fields = "camelCase"
)]
pub enum SystemRequest {
    ToVaultPath { absolute_path: String },
    ResolvePath { path: String },
    OpenPath { path: String },
    RevealPath { path: String },
    TrashSystem { path: String },
}
fn portable_result(value: FileValue) -> Value {
    match value {
        FileValue::Text { data } => json!(data),
        FileValue::Binary { data } => json!(data),
        FileValue::Stat { stat } => json!(stat),
        FileValue::Exists { exists } => json!(exists),
        FileValue::List { listing } => json!(listing),
        FileValue::Done {} => Value::Null,
    }
}
#[tauri::command]
pub async fn vault_fs(
    host: tauri::State<'_, NativeHost>,
    session_id: String,
    request: FileRequest,
) -> Result<Value, NativeError> {
    access(host.inner().clone(), move |manager| {
        manager.with_files(|manager| {
            let system = match request {
                FileRequest::Portable(command) => {
                    return manager
                        .core_vaults
                        .files(&manager.vaults, &session_id, command)
                        .map(portable_result);
                }
                FileRequest::System(system) => system,
            };
            let root = manager.vaults.get(&session_id)?;
            Ok(match system {
                SystemRequest::ToVaultPath { absolute_path } => json!(
                    lapis_desktop::vault::system_actions::to_relative(root, &absolute_path)?
                ),
                SystemRequest::ResolvePath { path } => {
                    json!(lapis_desktop::vault::system_actions::resolve(root, &path)?)
                }
                SystemRequest::OpenPath { path } => {
                    lapis_desktop::vault::system_actions::open(root, &path)?;
                    #[cfg(feature = "e2e")]
                    crate::acceptance::actions::record("open-path", &path, None);
                    Value::Null
                }
                SystemRequest::RevealPath { path } => {
                    lapis_desktop::vault::system_actions::reveal(root, &path)?;
                    #[cfg(feature = "e2e")]
                    crate::acceptance::actions::record("reveal-path", &path, None);
                    Value::Null
                }
                SystemRequest::TrashSystem { path } => {
                    let receipt = lapis_desktop::vault::system_actions::trash(root, &path)?;
                    #[cfg(feature = "e2e")]
                    crate::acceptance::actions::record("trash-system", &path, receipt.as_deref());
                    #[cfg(not(feature = "e2e"))]
                    let _ = receipt;
                    json!(true)
                }
            })
        })
    })
    .await
}
