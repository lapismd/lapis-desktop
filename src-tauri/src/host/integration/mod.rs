pub(crate) mod menu;
pub(crate) mod services;

use lapis_desktop::integration::urls::{AppUrlQueue, AppUrlRequest, supported_scheme};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

#[derive(Default)]
pub struct IntegrationState(Mutex<AppUrlQueue>);

pub fn enqueue(app: &AppHandle, url: String) {
    app.state::<IntegrationState>()
        .0
        .lock()
        .unwrap()
        .enqueue(url);
    let _ = app.emit_to("main", "lapis-app-urls-pending", ());
}

pub fn arguments(app: &AppHandle, args: impl IntoIterator<Item = String>) {
    for value in args {
        if value
            .split_once(':')
            .is_some_and(|(scheme, _)| supported_scheme(&scheme.to_ascii_lowercase()))
        {
            enqueue(app, value);
        }
    }
}

pub fn raise(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn main_window(window: &WebviewWindow) -> Result<(), String> {
    if window.label() == "main" {
        Ok(())
    } else {
        Err("Application URL delivery requires the main window".into())
    }
}

#[tauri::command]
pub fn desktop_url_next(
    app: AppHandle,
    window: WebviewWindow,
) -> Result<Option<AppUrlRequest>, String> {
    main_window(&window)?;
    Ok(app.state::<IntegrationState>().0.lock().unwrap().next())
}

#[tauri::command]
pub fn desktop_url_ack(app: AppHandle, window: WebviewWindow, id: String) -> Result<(), String> {
    main_window(&window)?;
    app.state::<IntegrationState>()
        .0
        .lock()
        .unwrap()
        .acknowledge(&id)?;
    #[cfg(feature = "e2e")]
    crate::acceptance::integration::record("url-ack", &id);
    Ok(())
}

#[tauri::command]
pub fn desktop_url_enqueue(
    app: AppHandle,
    window: WebviewWindow,
    url: String,
) -> Result<(), String> {
    main_window(&window)?;
    enqueue(&app, url);
    Ok(())
}
