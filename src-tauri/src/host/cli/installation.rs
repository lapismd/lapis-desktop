use serde_json::Value;
use std::{io, path::PathBuf, process::Command};
use tauri::{AppHandle, Manager, WebviewWindow};

fn executable(app: &AppHandle) -> io::Result<PathBuf> {
    let path = app
        .path()
        .resource_dir()
        .map_err(io::Error::other)?
        .join("lapis-cli/lapis");
    if !path.is_file() {
        return Err(io::Error::other(
            "Bundled CLI is missing. Reinstall this application.",
        ));
    }
    Ok(path)
}
#[tauri::command]
pub async fn desktop_cli_installation(
    app: AppHandle,
    window: WebviewWindow,
    action: String,
    shell: Option<String>,
    remove_path: Option<bool>,
) -> Result<Value, String> {
    if window.label() != "main" {
        return Err("CLI setup requires the main window".into());
    }
    if !matches!(action.as_str(), "status" | "install" | "uninstall") {
        return Err("Unknown CLI setup action".into());
    }
    if shell
        .as_deref()
        .is_some_and(|s| !matches!(s, "bash" | "zsh"))
    {
        return Err("Choose Bash or Zsh, or use manual PATH setup".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let binary = executable(&app).map_err(|e| e.to_string())?;
        let mut command = Command::new(&binary);
        command.args(["cli", &action]);
        if action == "install" {
            command.arg("--replace");
        }
        if action == "install"
            && let Some(shell) = shell
        {
            command.args(["--setup-path", &shell]);
        }
        if action == "uninstall" && remove_path == Some(true) {
            command.arg("--remove-path");
        }
        let output = command
            .output()
            .map_err(|_| "Bundled CLI could not start")?;
        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());
        }
        let output = Command::new(&binary)
            .args(["cli", "status", "--json"])
            .output()
            .map_err(|_| "CLI status is unavailable")?;
        if !output.status.success() {
            return Err("CLI status could not be read".into());
        }
        serde_json::from_slice(&output.stdout)
            .map_err(|_| "Bundled CLI returned invalid status".to_owned())
    })
    .await
    .map_err(|_| "CLI setup did not complete".to_owned())?
}
