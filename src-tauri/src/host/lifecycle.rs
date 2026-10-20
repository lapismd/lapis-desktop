use lapis_desktop::lifecycle::{LeaveAction, LeaveRequest, Lifecycle};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, RunEvent, WindowEvent};

#[derive(Default)]
pub struct NativeLifecycle(Mutex<Lifecycle>);

fn emit(app: &AppHandle, pending: Option<LeaveRequest>) -> tauri::Result<()> {
    let Some(request) = pending else {
        return Ok(());
    };
    if let Err(error) = app.emit_to("main", "lapis-lifecycle-request", &request) {
        let _ = app
            .state::<NativeLifecycle>()
            .0
            .lock()
            .unwrap()
            .finish(&request.request_id, false);
        return Err(error);
    }
    Ok(())
}

pub fn ready(app: &AppHandle) -> tauri::Result<()> {
    let pending = app.state::<NativeLifecycle>().0.lock().unwrap().ready();
    emit(app, pending)
}

fn request(app: &AppHandle, action: LeaveAction) -> tauri::Result<()> {
    let pending = app
        .state::<NativeLifecycle>()
        .0
        .lock()
        .unwrap()
        .request(action);
    emit(app, pending)
}

pub fn on_event(app: &AppHandle, event: RunEvent) {
    let approved = app
        .state::<NativeLifecycle>()
        .0
        .lock()
        .unwrap()
        .approved_exit();
    match event {
        RunEvent::WindowEvent {
            label,
            event: WindowEvent::Destroyed,
            ..
        } => {
            crate::host::windows::popups::destroyed(app, &label);
            crate::host::ai::imports::window_destroyed(app, &label);
            crate::host::ai::admission::window_destroyed(app, &label);
            crate::host::repository::commands::window_destroyed(app, &label);
            #[cfg(target_os = "macos")]
            crate::host::windows::macos_chrome::release(&label);
        }
        #[cfg(target_os = "macos")]
        RunEvent::Opened { urls } => {
            for url in urls {
                crate::host::integration::enqueue(app, url.to_string());
            }
            crate::host::integration::raise(app);
        }
        RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } if label.starts_with("workspace-popup-") => {
            api.prevent_close();
            if let Err(error) = crate::host::windows::popups::request_close(app, &label) {
                let _ = app.emit_to("main", "lapis-integration-error", error);
            }
        }
        RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } if label == "main" && !approved => {
            api.prevent_close();
            if let Err(error) = request(app, LeaveAction::Close) {
                eprintln!("Could not request safe window close: {error}");
            }
        }
        RunEvent::ExitRequested { api, .. } if !approved => {
            api.prevent_exit();
            if let Err(error) = request(app, LeaveAction::Close) {
                eprintln!("Could not request safe application quit: {error}");
            }
        }
        RunEvent::Exit => {
            #[cfg(target_os = "macos")]
            crate::host::windows::macos_chrome::shutdown();
        }
        _ => {}
    }
}

#[tauri::command]
pub fn lifecycle_reload(app: AppHandle) -> Result<(), String> {
    request(&app, LeaveAction::Reload).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn lifecycle_quit(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn lifecycle_result(app: AppHandle, request_id: String, saved: bool) -> Result<(), String> {
    let action = app
        .state::<NativeLifecycle>()
        .0
        .lock()
        .unwrap()
        .finish(&request_id, saved)?;
    match action {
        Some(LeaveAction::Close) => app.exit(0),
        Some(LeaveAction::Reload) => app
            .get_webview_window("main")
            .ok_or("Main window is unavailable")?
            .reload()
            .map_err(|error| error.to_string())?,
        None => {}
    }
    Ok(())
}
