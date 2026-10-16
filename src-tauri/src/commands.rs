use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Manager;

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
    #[cfg(feature = "e2e")]
    native_menus: Result<Vec<crate::integration_acceptance::MenuEntry>, String>,
    #[cfg(feature = "e2e")]
    native_popouts: Vec<crate::popout_acceptance::ProofWindow>,
    #[cfg(feature = "e2e")]
    popout_proof_mode: Option<&'static str>,
    #[cfg(all(feature = "e2e", target_os = "macos"))]
    native_chrome_observers: usize,
    #[cfg(all(feature = "e2e", target_os = "macos"))]
    native_controls: Result<Vec<[f64; 4]>, String>,
    #[cfg(all(feature = "e2e", target_os = "macos"))]
    native_visibility: Result<[bool; 5], String>,
}

#[tauri::command]
pub async fn shell_info(app: tauri::AppHandle) -> ShellInfo {
    #[cfg(all(feature = "e2e", target_os = "macos"))]
    let native_visibility = match app.get_webview_window("main") {
        Some(window) => crate::macos_chrome::visibility(window).await,
        None => Err("The native window is unavailable".into()),
    };
    #[cfg(all(feature = "e2e", target_os = "macos"))]
    let native_controls = {
        match app.get_webview_window("main") {
            Some(window) => crate::macos_chrome::geometry(window).await,
            None => Err("The native window is unavailable".into()),
        }
    };
    ShellInfo {
        runtime: "tauri-desktop",
        os: std::env::consts::OS,
        version: app.package_info().version.to_string(),
        process_id: std::process::id(),
        ready: app.state::<ShellState>().ready.load(Ordering::SeqCst),
        #[cfg(feature = "e2e")]
        native_menus: crate::integration_acceptance::menus(&app),
        #[cfg(feature = "e2e")]
        native_popouts: crate::popout_acceptance::windows(&app).await,
        #[cfg(feature = "e2e")]
        popout_proof_mode: crate::popout_acceptance::mode(),
        #[cfg(all(feature = "e2e", target_os = "macos"))]
        native_chrome_observers: crate::macos_chrome::observer_count(),
        #[cfg(all(feature = "e2e", target_os = "macos"))]
        native_controls,
        #[cfg(all(feature = "e2e", target_os = "macos"))]
        native_visibility,
    }
}

#[tauri::command]
pub fn shell_ready(
    app: tauri::AppHandle,
    state: tauri::State<'_, ShellState>,
) -> Result<(), String> {
    #[cfg(all(feature = "e2e", target_os = "macos"))]
    {
        app.show().map_err(|error| error.to_string())?;
        if let Some(window) = app.get_webview_window("main") {
            window.show().map_err(|error| error.to_string())?;
            window.set_focus().map_err(|error| error.to_string())?;
        }
    }
    crate::lifecycle::ready(&app).map_err(|error| error.to_string())?;
    if !state.ready.swap(true, Ordering::SeqCst) {
        println!("lapis-desktop: renderer ready");
    }
    Ok(())
}
