use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};

#[derive(Default)]
pub struct ShellState {
    ready: AtomicBool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellInfo {
    runtime: &'static str,
    os: &'static str,
    version: String,
    process_id: u32,
    ready: bool,
}

#[tauri::command]
pub fn shell_info(app: tauri::AppHandle, state: tauri::State<'_, ShellState>) -> ShellInfo {
    ShellInfo {
        runtime: "tauri-desktop",
        os: std::env::consts::OS,
        version: app.package_info().version.to_string(),
        process_id: std::process::id(),
        ready: state.ready.load(Ordering::SeqCst),
    }
}

#[tauri::command]
pub fn shell_ready(
    app: tauri::AppHandle,
    state: tauri::State<'_, ShellState>,
) -> Result<(), String> {
    crate::lifecycle::ready(&app).map_err(|error| error.to_string())?;
    if !state.ready.swap(true, Ordering::SeqCst) {
        println!("lapis-desktop: renderer ready");
    }
    Ok(())
}
