use crate::host::state::{NativeError, NativeHost, access};
use lapis_desktop::ai::user_commands::UserCommands;
use serde::Deserialize;
use serde_json::{Value, json};
use std::{io, sync::Arc};
use tauri::{Manager, WebviewWindow};

pub struct NativeUserCommands(Result<Arc<UserCommands>, String>);

pub fn initialize(app: &tauri::AppHandle) {
    #[cfg(not(feature = "e2e"))]
    let home = app.path().home_dir().map_err(|error| error.to_string());
    #[cfg(feature = "e2e")]
    let home = std::env::var("LAPIS_DESKTOP_ACCEPTANCE_ROOT")
        .map(std::path::PathBuf::from)
        .map_err(|error| error.to_string());
    app.manage(NativeUserCommands(
        home.map(|path| Arc::new(UserCommands::new(path))),
    ));
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub enum Operation {
    List {},
    Exists { name: String },
    Write { name: String, content: String },
    CreateIfMissing { name: String, content: String },
}

#[tauri::command]
pub async fn desktop_ai_user_commands(
    window: WebviewWindow,
    host: tauri::State<'_, NativeHost>,
    commands: tauri::State<'_, NativeUserCommands>,
    session_id: String,
    operation: Operation,
) -> Result<Value, NativeError> {
    let url = window
        .url()
        .map_err(|error| io::Error::other(error.to_string()))?;
    if window.label() != "main"
        || !crate::host::windows::navigation::allowed(&url, cfg!(debug_assertions))
    {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "AI user commands require the local main window",
        )
        .into());
    }
    let commands = commands
        .0
        .as_ref()
        .map_err(|message| io::Error::other(message.clone()))?
        .clone();
    access(host.inner().clone(), move |services| {
        services.with_files(|services| {
            services.vaults.get(&session_id)?.verify_physical_root()?;
            match operation {
                Operation::List {} => Ok(json!(commands.list()?)),
                Operation::Exists { name } => Ok(json!(commands.exists(&name)?)),
                Operation::Write { name, content } => {
                    commands.write(&name, &content)?;
                    Ok(Value::Null)
                }
                Operation::CreateIfMissing { name, content } => {
                    Ok(json!(commands.create_if_missing(&name, &content)?))
                }
            }
        })
    })
    .await
}

#[cfg(test)]
mod tests {
    use super::Operation;
    #[test]
    fn command_frames_reject_directory_and_unknown_operation_overrides() {
        for value in [
            serde_json::json!({"type":"list","directory":"/outside"}),
            serde_json::json!({"type":"write","name":"help","content":"body","root":"/outside"}),
            serde_json::json!({"type":"execute","program":"/outside"}),
        ] {
            assert!(serde_json::from_value::<Operation>(value).is_err());
        }
    }
}
